import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initialState,activeAreas,updateItem} from '../dist/src/domain.js';
import {DATA_KEY} from '../dist/src/repository.js';
import {VIEWS_KEY} from '../dist/src/workflows.js';

// Simulação de DOM em Node: não abre navegador, não carrega recursos nem faz login.
test('fluxos integrados de ações rápidas, seleção, reversão e favoritas',async t=>{
  const dom=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://retomar.example/',pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
  const originals=new Map();
  for(const [key,value] of Object.entries({window:w,localStorage:w.localStorage,location:w.location,document:w.document,navigator:w.navigator,FormData:w.FormData,HTMLElement:w.HTMLElement,requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),CSS:{escape:s=>String(s).replace(/[^\w-]/g,c=>'\\'+c)},confirm:()=>true})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const intervals=new Set(),timeouts=new Set(),nativeInterval=globalThis.setInterval,nativeTimeout=globalThis.setTimeout;
  globalThis.setInterval=(...args)=>{const h=nativeInterval(...args);h.unref();intervals.add(h);return h;};
  globalThis.setTimeout=(...args)=>{const h=nativeTimeout(...args);h.unref();timeouts.add(h);return h;};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  const s=initialState(),area=activeAreas(s)[0].id;
  for(const [id,parentId] of [['p',''],['c','p'],['b','']])updateItem(s,id,{title:'Teste '+id,notes:'',areaId:area,parentId,date:'2200-11-12',time:id==='c'?'00:00':'14:35',priority:'normal',status:'pending'},'fixture');
  w.localStorage.setItem(DATA_KEY,JSON.stringify(s));
  const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>nativeTimeout(resolve,10));};
  const node=selector=>{const el=w.document.querySelector(selector);assert.ok(el,'Elemento ausente: '+selector);return el;};
  const click=async selector=>{node(selector).click();await settle();};
  const fill=(selector,value)=>{const el=node(selector);el.value=value;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
  const submit=async()=>{node('dialog[open] form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await settle();};
  const state=()=>JSON.parse(w.localStorage.getItem(DATA_KEY));
  try{
    await import('../dist/src/app.js');await settle();
    await t.test('abertura monta controles novos e não cria botões aninhados',()=>{
      assert.equal(w.document.querySelectorAll('[data-action="workflow-quick"]').length,6);
      assert.equal(w.document.querySelectorAll('button button').length,0);assert.ok(node('[data-action="workflow-views"]'));
    });
    await t.test('prioridade rápida salva e Desfazer restaura a tarefa',async()=>{
      await click('[data-action="workflow-quick"][data-id="p"][data-field="priority"]');fill('#quick-value','urgent');await submit();assert.equal(state().items.p.priority,'urgent');assert.equal(w.document.querySelector('dialog[open]'),null);
      await click('[data-action="workflow-undo"]');assert.equal(state().items.p.priority,'normal');assert.equal(w.document.querySelector('[data-action="workflow-undo"]'),null);
    });
    await t.test('horário sem data mantém o formulário e corrigir data salva meia-noite',async()=>{
      await click('[data-action="workflow-quick"][data-id="p"][data-field="deadline"]');fill('#quick-date','');fill('#quick-time','00:00');await submit();assert.ok(w.document.querySelector('dialog[open]'));assert.equal(state().items.p.time,'14:35');
      fill('#quick-date','2200-11-20');await submit();assert.equal(state().items.p.time,'00:00');assert.equal(state().items.p.date,'2200-11-20');await click('[data-action="workflow-undo"]');
    });
    await t.test('andamento rápido conclui e reverte sem alterar subitem',async()=>{
      await click('[data-action="workflow-quick"][data-id="p"][data-field="status"]');fill('#quick-value','done');await submit();assert.equal(state().items.p.status,'done');assert.equal(state().items.c.status,'pending');await click('[data-action="workflow-undo"]');assert.equal(state().items.p.status,'pending');
    });
    await t.test('selecionar exibidas não inclui subitens recolhidos e lote preserva seus prazos',async()=>{
      await click('[data-action="workflow-mode"]');assert.equal(w.document.querySelectorAll('[data-action="toggle"]').length,0);await click('[data-action="workflow-all"]');assert.equal(w.document.querySelectorAll('[data-action="workflow-select"][aria-checked="true"]').length,2);
      await click('[data-action="workflow-bulk"]');fill('#bulk-date','2200-12-01');await submit();const saved=state();assert.equal(saved.items.p.date,'2200-12-01');assert.equal(saved.items.b.date,'2200-12-01');assert.equal(saved.items.c.date,'2200-11-12');assert.equal(saved.items.p.time,'14:35');assert.equal(w.document.querySelector('.bulk-bar'),null);
      await click('[data-action="workflow-undo"]');assert.equal(state().items.p.date,'2200-11-12');assert.equal(state().items.b.date,'2200-11-12');
    });
    await t.test('mudança de filtros limpa seleção antes de nova ação em lote',async()=>{
      await click('[data-action="workflow-mode"]');await click('[data-action="workflow-select"][data-id="p"]');fill('#search-input','Teste b');await settle();assert.equal(w.document.querySelectorAll('[aria-checked="true"]').length,0);assert.equal(node('[data-action="workflow-bulk"]').disabled,true);
      await click('[data-action="workflow-mode"]');fill('#search-input','');await settle();
    });
    await t.test('arquivar seleção oculta a família e Desfazer a recupera',async()=>{
      await click('[data-action="workflow-mode"]');await click('[data-action="workflow-select"][data-id="p"]');await click('[data-action="workflow-bulk"]');fill('#bulk-kind','archive');await submit();assert.equal(state().items.p.archived,true);assert.equal(w.document.querySelector('[data-root-item][data-drag-item="p"]'),null);
      await click('[data-action="workflow-undo"]');assert.equal(state().items.p.archived,false);assert.ok(w.document.querySelector('[data-root-item][data-drag-item="p"]'));
    });
    await t.test('revisão concorrente recusa lote sem salvar parcialmente ou fechar formulário',async()=>{
      await click('[data-action="workflow-mode"]');await click('[data-action="workflow-all"]');await click('[data-action="workflow-bulk"]');fill('#bulk-date','2200-12-02');const remote=state();updateItem(remote,'b',{notes:'Outra janela'},'remote');w.localStorage.setItem(DATA_KEY,JSON.stringify(remote));const raw=w.localStorage.getItem(DATA_KEY);await submit();assert.equal(w.localStorage.getItem(DATA_KEY),raw);assert.match(node('dialog .formerror').textContent,/mudou em outra janela/);assert.equal(node('dialog button[type="submit"]').disabled,false);
      await click('[data-workflow-cancel]');await click('[data-action="workflow-mode"]');
    });
    await t.test('favorita salva e aplica busca, formato e agrupamento sem alterar tarefas',async()=>{
      fill('#search-input','Teste b');await settle();await click('[data-action="ordering"]');fill('#view-layout','cards');fill('#group-by','priority');await submit();
      await click('[data-action="workflow-views"]');fill('#view-name','Busca favorita');await submit();const favorite=JSON.parse(w.localStorage.getItem(VIEWS_KEY))[0];assert.equal(favorite.view.query,'Teste b');assert.equal(favorite.view.layout,'cards');
      fill('#search-input','');await settle();const raw=w.localStorage.getItem(DATA_KEY);await click('[data-action="workflow-views"]');await click('[data-view-apply]');assert.equal(node('#search-input').value,'Teste b');assert.ok(node('#task-results').classList.contains('layout-cards'));assert.ok(node('#task-results').classList.contains('group-priority'));assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('renomear e remover favoritas mantém o planejamento',async()=>{
      await click('[data-action="workflow-views"]');await click('[data-view-rename]');fill('#view-rename','Nome atualizado');await submit();assert.equal(JSON.parse(w.localStorage.getItem(VIEWS_KEY))[0].name,'Nome atualizado');const raw=w.localStorage.getItem(DATA_KEY);
      await click('[data-action="workflow-views"]');await click('[data-view-remove]');assert.deepEqual(JSON.parse(w.localStorage.getItem(VIEWS_KEY)),[]);assert.equal(w.localStorage.getItem(DATA_KEY),raw);await click('[data-workflow-cancel]');
    });
  }finally{
    dom.window.close();for(const h of intervals)clearInterval(h);for(const h of timeouts)clearTimeout(h);globalThis.setInterval=nativeInterval;globalThis.setTimeout=nativeTimeout;
    for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
