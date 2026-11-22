import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {bindSwipe,swipeDecision} from '../dist/src/swipe.js';

function fixture(){
  const dom=new JSDOM('<div id="app"><nav data-swipe-scope="sections"><button data-action="page">Guia</button></nav><main data-swipe-scope="workouts"><h2>Treino</h2><input><a href="#">Vídeo</a><button data-drag-handle>Mover</button></main></div>',{pretendToBeVisual:true}),w=dom.window,root=w.document.querySelector('#app'),surface=root.querySelector('main'),calls=[],frames=new Map();let frame=0,blocked=false,allowed=true,animated=true;
  w.requestAnimationFrame=fn=>{frames.set(++frame,fn);return frame};w.cancelAnimationFrame=id=>frames.delete(id);Object.defineProperty(w.document.documentElement,'clientWidth',{value:360});
  bindSwipe(root,{target:w,isBlocked:()=>blocked,canMove:()=>allowed,motion:()=>animated,onMove:(scope,delta)=>calls.push({scope,delta})});
  function pointer(node,type,x,y=200,{id=1,time=0,primary=true}={}){const event=new w.Event(type,{bubbles:true,cancelable:true});for(const [key,value] of Object.entries({button:0,pointerType:'touch',pointerId:id,isPrimary:primary,clientX:x,clientY:y,timeStamp:time}))Object.defineProperty(event,key,{value});node.dispatchEvent(event);return event}
  return {w,root,surface,calls,pointer,frames,node:selector=>root.querySelector(selector),block:value=>blocked=value,allow:value=>allowed=value,motion:value=>animated=value,paint(){for(const fn of frames.values())fn();frames.clear()},close(){root._swipeCleanup();dom.window.close()}};
}
test('decisão distingue deslocamento horizontal, movimento vertical e arraste curto',()=>{
  assert.equal(swipeDecision(-90,10,500,360),1);assert.equal(swipeDecision(90,10,500,360),-1);assert.equal(swipeDecision(20,0,10,360),0);assert.equal(swipeDecision(60,90,300,360),0);assert.equal(swipeDecision(-35,1,50,360),1);
});
test('deslizar confirma uma vez, acompanha o dedo e suprime o clique posterior',()=>{
  const f=fixture();try{f.pointer(f.node('h2'),'pointerdown',250);assert.equal(f.pointer(f.root,'pointermove',150).defaultPrevented,true);f.paint();assert.match(f.surface.style.transform,/-40px/);f.pointer(f.root,'pointerup',100,200,{time:400});assert.deepEqual(f.calls,[{scope:'workouts',delta:1}]);assert.equal(f.surface.style.transform,'');const click=new f.w.MouseEvent('click',{bubbles:true,cancelable:true});f.root.dispatchEvent(click);assert.equal(click.defaultPrevented,true)}finally{f.close()}
});
test('rolagem vertical, bordas do sistema e controles interativos não trocam de tela',()=>{
  const f=fixture();try{
    for(const selector of ['input','a','[data-drag-handle]']){f.pointer(f.node(selector),'pointerdown',220);f.pointer(f.root,'pointermove',100);f.pointer(f.root,'pointerup',90,200,{time:400})}
    for(const x of [8,352]){f.pointer(f.node('h2'),'pointerdown',x);f.pointer(f.root,'pointermove',170);f.pointer(f.root,'pointerup',170,200,{time:400})}
    f.pointer(f.node('h2'),'pointerdown',220);assert.equal(f.pointer(f.root,'pointermove',210,330).defaultPrevented,false);f.pointer(f.root,'pointerup',100,350,{time:400});assert.equal(f.calls.length,0);
  }finally{f.close()}
});
test('cancelamento, segundo dedo, bloqueios e ausência de destino preservam a tela',()=>{
  const f=fixture();try{
    for(const kind of ['pointercancel','second','blocked','destination']){
      f.pointer(f.node('h2'),'pointerdown',250);f.pointer(f.root,'pointermove',150);f.paint();
      if(kind==='second')f.pointer(f.root,'pointerdown',160,200,{id:2,primary:false});else if(kind==='blocked')f.block(true);else if(kind==='destination')f.allow(false);else f.pointer(f.root,'pointercancel',150);
      f.pointer(f.root,'pointerup',80,200,{time:400});f.block(false);f.allow(true);assert.equal(f.surface.style.transform,'');
    }
    assert.equal(f.calls.length,0);
  }finally{f.close()}
});
test('outro pointer não conclui o gesto e movimento reduzido mantém navegação sem animação',()=>{
  const f=fixture();try{f.motion(false);f.pointer(f.node('h2'),'pointerdown',250);f.pointer(f.root,'pointermove',120);f.pointer(f.root,'pointerup',80,200,{id:2,time:400});assert.equal(f.calls.length,0);assert.equal(f.frames.size,0);f.pointer(f.root,'pointerup',80,200,{time:400});assert.equal(f.calls.length,1)}finally{f.close()}
});
test('gesto iniciado em botão de guia funciona sem duplicar ação; rebind remove ouvintes antigos',()=>{
  const f=fixture();try{f.pointer(f.node('nav button'),'pointerdown',250);f.pointer(f.root,'pointermove',150);f.pointer(f.root,'pointerup',80,200,{time:400});assert.deepEqual(f.calls,[{scope:'sections',delta:1}]);f.root._swipeCleanup();f.pointer(f.node('h2'),'pointerdown',250);f.pointer(f.root,'pointermove',150);f.pointer(f.root,'pointerup',80,200,{time:400});assert.equal(f.calls.length,1)}finally{f.close()}
});
test('soltar fora do app antes de arrastar não bloqueia o próximo gesto',()=>{
  const f=fixture();try{f.pointer(f.node('h2'),'pointerdown',250);f.pointer(f.w,'pointerup',250);f.pointer(f.node('h2'),'pointerdown',250);f.pointer(f.root,'pointermove',150);f.pointer(f.w,'pointerup',80,200,{time:400});assert.deepEqual(f.calls,[{scope:'workouts',delta:1}])}finally{f.close()}
});
