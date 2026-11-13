import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initialState,activeAreas,updateItem,selectItems,activeItems} from '../dist/src/domain.js';
import {DATA_KEY} from '../dist/src/repository.js';

// DOM em Node, sem navegador ou recursos externos. Larguras e tipo de ponteiro
// exercitam as decisões da interface; não simulam layout, pintura ou teclado nativo.
test('paridade de uso entre PC, celular, lista e cartões',async t=>{
  const dom=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://retomar.example/',pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
  let width=1280,coarse=false,discard=true;
  w.matchMedia=query=>({matches:query.includes('pointer: coarse')?coarse:false,addEventListener(){},removeEventListener(){}});
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>null;
  // Apenas visibilidade dos controles para restauração de foco, sem medidas físicas.
  w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')||this.closest('.mobile-actions')&&width>650||this.matches('.desktop-add')&&width<=650?[]:[{}];};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');this.querySelector('[autofocus]')?.focus();};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.fetch=async()=>{throw Error('A verificação não deve consultar serviços externos.');};
  const originals=new Map();
  for(const [key,value] of Object.entries({window:w,localStorage:w.localStorage,location:w.location,document:w.document,navigator:w.navigator,FormData:w.FormData,HTMLElement:w.HTMLElement,getComputedStyle:w.getComputedStyle.bind(w),requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),CSS:{escape:s=>String(s).replace(/[^\w-]/g,c=>'\\'+c)},confirm:()=>discard})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const timers=new Set(),intervals=new Set(),nativeTimeout=setTimeout,nativeInterval=setInterval;
  globalThis.setTimeout=(...args)=>{const h=nativeTimeout(...args);h.unref();timers.add(h);return h;};
  globalThis.setInterval=(...args)=>{const h=nativeInterval(...args);h.unref();intervals.add(h);return h;};
  const fixture=initialState(),areaId=activeAreas(fixture)[0].id;
  for(const [id,parentId] of [['p',''],['c','p'],['b','']])updateItem(fixture,id,{title:id==='c'?'Etapa independente':'Tarefa '+id+' '+('texto longo ').repeat(12),notes:'Observação '+id,areaId,parentId,date:'2200-11-12',time:id==='c'?'00:00':'14:35',priority:'normal',status:'pending'},'fixture');
  w.localStorage.setItem(DATA_KEY,JSON.stringify(fixture));
  const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>nativeTimeout(resolve,12));};
  const node=selector=>{const el=w.document.querySelector(selector);assert.ok(el,'Elemento ausente: '+selector);return el;};
  const click=async selector=>{const el=node(selector);el.focus();el.click();await settle();};
  const fill=(selector,value,event)=>{const el=node(selector);el.value=value;el.dispatchEvent(new w.Event(event||(el.tagName==='SELECT'?'change':'input'),{bubbles:true}));};
  const submit=async()=>{node('dialog[open] form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await settle();};
  const raw=()=>w.localStorage.getItem(DATA_KEY),state=()=>JSON.parse(raw());
  const order=()=>selectItems(activeItems(state()).filter(x=>!x.parentId),{order:'manual'}).map(x=>x.id);
  const rootTask=id=>node(`[data-root-item][data-drag-item="${id}"]`);
  const format=async(layout,group='none')=>{await click('[data-action="ordering"]');fill('#view-layout',layout);fill('#group-by',group);fill('#sort-filter','manual');await submit();};
  try{
    await import('../dist/src/app.js');await settle();
    await t.test('seleção mantém rótulo de andamento e oculta Adicionar nas duas interfaces',async()=>{
      await click('[data-action="workflow-mode"]');
      try{
        assert.equal(w.document.querySelectorAll('.desktop-add,.mobile-actions').length,0);
        assert.equal(rootTask('p').querySelector(':scope > .task-tags > .task-status-label')?.textContent,'Pendente');
      }finally{await click('[data-action="workflow-mode"]');}
    });
    await t.test('selecionar, limpar e sair mantêm foco de teclado no comando equivalente',async()=>{
      try{
        await click('[data-action="workflow-mode"]');assert.equal(w.document.activeElement.dataset.action,'workflow-mode');
        await click('[data-action="workflow-all"]');assert.equal(w.document.activeElement.dataset.action,'workflow-all');
        await click('[data-action="workflow-none"]');assert.equal(w.document.activeElement.dataset.action,'workflow-all');
      }finally{await click('[data-action="workflow-mode"]');}
    });
    await t.test('Meu dia mantém foco ao mudar data, período e avançar',async()=>{
      const before=raw();await click('[data-page="day"]');
      try{
        node('#calendar-date').focus();fill('#calendar-date','2200-11-12','change');await settle();assert.equal(w.document.activeElement.id,'calendar-date');
        node('#calendar-span').focus();fill('#calendar-span','7');await settle();assert.equal(w.document.activeElement.id,'calendar-span');
        await click('[data-action="calendar-next"]');assert.equal(w.document.activeElement.dataset.action,'calendar-next');assert.equal(raw(),before);
      }finally{await click('[data-page="plan"]');}
    });
    for(const profile of [{width:320,coarse:true},{width:360,coarse:true},{width:390,coarse:true},{width:650,coarse:true},{width:651,coarse:false},{width:768,coarse:true},{width:1024,coarse:false},{width:1280,coarse:false}])for(const layout of ['compact','cards'])await t.test(`${profile.width}px, ${profile.coarse?'toque':'mouse/teclado'}, ${layout}`,async()=>{
      width=profile.width;coarse=profile.coarse;Object.defineProperty(w,'innerWidth',{value:width,configurable:true});w.dispatchEvent(new w.Event('resize'));
      const before=raw();await format(layout);assert.equal(raw(),before);assert.ok(node('#task-results').classList.contains('layout-'+layout));
      const expand='[data-action="expand-item"][data-id="p"]';if(node(expand).getAttribute('aria-expanded')==='true')await click(expand);
      assert.equal(w.document.querySelectorAll('[data-root-item]').length,2);assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,0);
      assert.equal(!!rootTask('p').querySelector(':scope > .task-note'),layout==='cards');
      for(const field of ['deadline','priority','status'])assert.ok(rootTask('p').querySelector(`[data-action="workflow-quick"][data-field="${field}"]`));
      await click(width<=650?'.mobile-actions [data-action="new"]':'.desktop-add');assert.equal(node('#item-title').hasAttribute('autofocus'),!coarse);assert.equal(node('#modal-title').hasAttribute('autofocus'),coarse);
      fill('#item-title','Criação equivalente');await submit();const created=activeItems(state()).find(x=>x.title==='Criação equivalente');assert.ok(created);assert.equal(created.status,'pending');assert.equal(created.date,'');await click('[data-action="workflow-undo"]');assert.ok(state().items[created.id].deleted);
      await click('[data-action="edit"][data-id="p"]');const title=node('#item-title').value;fill('#item-title','Rascunho sem salvar');discard=false;await click('#cancel-item');assert.ok(w.document.querySelector('dialog[open]'));assert.equal(state().items.p.title,title);discard=true;await click('#cancel-item');assert.equal(w.document.activeElement.dataset.id,'p');
      await click(expand);assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);assert.equal(w.document.querySelectorAll('button button').length,0);
      await click('[data-action="workflow-quick"][data-id="c"][data-field="priority"]');fill('#quick-value','urgent');await submit();assert.equal(state().items.c.priority,'urgent');assert.equal(state().items.p.priority,'normal');await click('[data-action="workflow-undo"]');
      await click('[data-action="toggle"][data-id="p"]');assert.equal(state().items.p.status,'done');assert.equal(state().items.c.status,'pending');assert.equal(w.document.activeElement.dataset.action,'toggle');
      await click('[data-action="archive-item"][data-id="p"]');assert.equal(w.document.querySelector('[data-drag-item="p"]'),null);assert.equal(w.document.querySelector('[data-drag-item="c"]'),null);
      await click('[data-action="archive-view"][data-mode="archived"]');assert.equal(w.document.activeElement.dataset.mode,'archived');assert.equal(w.document.querySelectorAll('[data-drag-item="p"]').length,1);assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);
      await click('[data-action="restore-item"][data-id="p"]');assert.equal(state().items.p.archived,false);assert.equal(state().items.c.archived,false);await click('[data-action="archive-view"][data-mode="active"]');
      await click('[data-action="workflow-quick"][data-id="p"][data-field="status"]');fill('#quick-value','pending');await submit();
      await click('[data-action="workflow-mode"]');await click('[data-action="workflow-all"]');assert.equal(w.document.querySelectorAll('[data-action="workflow-select"][aria-checked="true"]').length,3);
      assert.equal(w.document.querySelectorAll('[data-action="toggle"],[data-action="workflow-quick"],.desktop-add,.mobile-actions').length,0);
      for(const id of ['p','c','b'])assert.equal(node(`[data-drag-item="${id}"] > .task-tags > .task-status-label`).textContent,'Pendente');
      await click('[data-action="workflow-bulk"]');fill('#bulk-date','2200-12-01');await submit();for(const id of ['p','c','b'])assert.equal(state().items[id].date,'2200-12-01');await click('[data-action="workflow-undo"]');assert.equal(state().items.c.time,'00:00');
      const originalOrder=order();const handle=node('[data-drag-item="b"] > .task-tags [data-drag-handle]');handle.focus();handle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));await settle();assert.deepEqual(order(),[...originalOrder].reverse());assert.equal(w.document.activeElement.closest('[data-drag-item]').dataset.dragItem,'b');await click('[data-action="workflow-undo"]');assert.deepEqual(order(),originalOrder);
      for(const group of ['area','priority','date','none']){
        const unchanged=raw();await format(layout,group);assert.equal(raw(),unchanged);
        if(group==='date'){assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);assert.match(node('[data-drag-item="c"] > .parent-link').textContent,/Subitem de/);}
        else{assert.equal(w.document.querySelectorAll('[data-root-item]').length,2);assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);}
      }
      fill('#search-input','Etapa independente');await settle();assert.equal(w.document.querySelectorAll('[data-root-item]').length,1);assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);fill('#search-input','');await settle();
      await click('[data-page="day"]');node('#calendar-date').focus();fill('#calendar-date','2200-11-12','change');await settle();fill('#calendar-span','1');await settle();assert.equal(w.document.querySelectorAll('.day-task').length,3);fill('#calendar-span','7');await settle();assert.equal(w.document.querySelectorAll('.day-column').length,7);
      await click('[data-page="plan"]');assert.ok(node('#task-results').classList.contains('layout-'+layout));
    });
  }finally{
    dom.window.close();for(const h of timers)clearTimeout(h);for(const h of intervals)clearInterval(h);globalThis.setTimeout=nativeTimeout;globalThis.setInterval=nativeInterval;
    for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
