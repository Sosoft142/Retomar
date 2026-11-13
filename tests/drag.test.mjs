import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {bindDrag} from '../dist/src/drag.js';

test('alças preservam rolagem, arraste por mouse/toque e alternativa por teclado',async t=>{
  const dom=new JSDOM('<main id="root"><article data-drag-item="a" data-drag-label="Primeira"><p>Conteúdo</p><button data-drag-handle>Mover</button></article><article data-drag-item="b"><button data-drag-handle>Mover</button></article></main>'),w=dom.window;
  const originals=new Map(),scheduled=new Map();let timer=0;w.scrollBy=()=>{};
  for(const [key,value] of Object.entries({window:w,document:w.document,innerHeight:900,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},setTimeout:(fn,ms)=>{scheduled.set(++timer,{fn,ms});return timer;},clearTimeout:id=>scheduled.delete(id)})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const root=w.document.querySelector('#root'),a=root.querySelector('[data-drag-item="a"]'),b=root.querySelector('[data-drag-item="b"]'),handle=a.querySelector('button'),drops=[],moves=[];
  b.getBoundingClientRect=()=>({top:200,height:100});w.document.elementFromPoint=()=>b;
  const pointer=(node,type,pointerType='mouse',x=10,y=10)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{button:0,pointerId:1,pointerType,clientX:x,clientY:y});node.dispatchEvent(e);return e;};
  const hold=()=>{const pending=[...scheduled.values()];scheduled.clear();assert.equal(pending.length,1);assert.equal(pending[0].ms,300);pending[0].fn();};
  try{
    bindDrag(root,{onDrop:data=>drops.push(data),onMove:data=>moves.push(data)});
    await t.test('movimentos sobre título/conteúdo não iniciam arraste nem cancelam gesto',()=>{
      const text=a.querySelector('p');pointer(text,'pointerdown','touch');const e=pointer(text,'pointermove','touch',10,260);pointer(text,'pointerup','touch',10,260);assert.equal(e.defaultPrevented,false);assert.equal(scheduled.size,0);assert.equal(drops.length,0);assert.equal(root.querySelector('.is-dragging'),null);
    });
    await t.test('mouse move a partir da alça e informa destino correto',()=>{
      pointer(handle,'pointerdown');pointer(root,'pointermove','mouse',20,260);assert.equal(a.classList.contains('is-dragging'),true);pointer(root,'pointerup','mouse',20,260);assert.deepEqual(drops.pop(),{type:'item',id:'a',target:{node:b,type:'item',id:'b',position:'after'}});assert.equal(w.document.querySelector('.drag-ghost'),null);
    });
    await t.test('deslocar o dedo antes da espera cancela a intenção de arrastar',()=>{
      pointer(handle,'pointerdown','touch');assert.equal(scheduled.size,1);pointer(root,'pointermove','touch',10,30);assert.equal(scheduled.size,0);pointer(root,'pointerup','touch');assert.equal(drops.length,0);assert.equal(w.document.querySelector('.drag-ghost'),null);
    });
    await t.test('segurar e arrastar por toque conclui uma vez e bloqueia clique acidental',()=>{
      pointer(handle,'pointerdown','touch');hold();const e=pointer(root,'pointermove','touch',20,220);assert.equal(e.defaultPrevented,true);pointer(root,'pointerup','touch',20,220);assert.equal(drops.length,1);assert.equal(drops.pop().target.position,'before');const click=new w.MouseEvent('click',{bubbles:true,cancelable:true});handle.dispatchEvent(click);assert.equal(click.defaultPrevented,true);
    });
    await t.test('setas oferecem alternativa e Escape/blur cancelam sem mover',()=>{
      handle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));assert.deepEqual(moves,[{type:'item',id:'a',delta:1}]);
      for(const cancel of ['Escape','blur']){pointer(handle,'pointerdown','touch');hold();if(cancel==='Escape')handle.dispatchEvent(new w.KeyboardEvent('keydown',{key:cancel,bubbles:true}));else w.dispatchEvent(new w.Event('blur'));assert.equal(w.document.querySelector('.drag-ghost'),null);assert.equal(drops.length,0);}
    });
  }finally{
    root._dragCleanup?.();dom.window.close();
    for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
