import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initialState,activeAreas,updateItem} from '../dist/src/domain.js';
import {DATA_KEY,UI_KEY} from '../dist/src/repository.js';
import {VIEWS_KEY} from '../dist/src/workflows.js';
import {DAY_KEY} from '../dist/src/day.js';

// Simulação de DOM em Node: não abre navegador, não carrega recursos nem faz login.
test('fluxos integrados de ações rápidas, seleção, reversão e favoritas',async t=>{
  const dom=new JSDOM(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://retomar.example/',pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
  const originals=new Map();
  for(const [key,value] of Object.entries({window:w,localStorage:w.localStorage,location:w.location,document:w.document,navigator:w.navigator,FormData:w.FormData,HTMLElement:w.HTMLElement,getComputedStyle:w.getComputedStyle.bind(w),requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),CSS:{escape:s=>String(s).replace(/[^\w-]/g,c=>'\\'+c)},confirm:()=>true})){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  const intervals=new Set(),timeouts=new Set(),nativeInterval=globalThis.setInterval,nativeTimeout=globalThis.setTimeout;
  globalThis.setInterval=(...args)=>{const h=nativeInterval(...args);h.unref();intervals.add(h);return h;};
  globalThis.setTimeout=(...args)=>{const h=nativeTimeout(...args);h.unref();timeouts.add(h);return h;};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{}];};w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  const s=initialState(),area=activeAreas(s)[0].id;
  for(const [id,parentId] of [['p',''],['c','p'],['b','']])updateItem(s,id,{title:'Teste '+id,notes:'',areaId:area,parentId,date:'2200-11-12',time:id==='c'?'00:00':'14:35',priority:'normal',status:'pending'},'fixture');
  w.localStorage.setItem(DATA_KEY,JSON.stringify(s));
  const requests=[];w.fetch=async url=>{requests.push(String(url));throw Error('Unexpected network request');};
  const legacyKey='entrelinhas-vida:google-calendar:v1';w.localStorage.setItem(legacyKey,JSON.stringify({enabled:true,clientId:'12345-public.apps.googleusercontent.com',calendarIds:['private-calendar']}));w.localStorage.setItem('entrelinhas-vida:agenda-pairing:v1','retired-record');

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
    await t.test('Meu dia mantém tarefas e elimina preferências externas sem consultar a rede',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);await click('[data-action="page"][data-page="day"]');fill('#day-date','2200-11-12');node('#day-date').dispatchEvent(new w.Event('change',{bubbles:true}));await settle();assert.equal(w.document.querySelectorAll('.day-task').length,1);assert.equal(node('#search-input').value,'Teste b');await click('[data-action="day-clear"]');assert.equal(w.document.querySelectorAll('.day-task').length,3);assert.equal(requests.length,0);assert.equal(w.localStorage.getItem(DATA_KEY),raw);
      assert.equal(w.localStorage.getItem(legacyKey),null);assert.equal(w.localStorage.getItem('entrelinhas-vida:agenda-pairing:v1'),null);assert.equal(w.document.querySelector('[data-action="day-connect"]'),null);assert.ok(!node('#app').textContent.includes('Google'));
    });
    await t.test('Meu dia alterna lista/cartões e um/sete dias sem mudar o formato do Planejamento',async()=>{
      const before=w.localStorage.getItem(DATA_KEY),uiBefore=JSON.parse(w.localStorage.getItem(UI_KEY));
      await click('[data-action="day-layout"][data-layout="compact"]');fill('#day-span','7');await settle();assert.equal(w.document.querySelectorAll('.day-column').length,7);assert.equal(w.document.querySelector('.day-grid-week'),null);assert.equal(node('.day-entries').classList.contains('layout-compact'),true);
      await click('[data-action="day-layout"][data-layout="cards"]');assert.ok(node('.day-grid-week'));const saved=JSON.parse(w.localStorage.getItem(UI_KEY));assert.equal(saved.dayLayout,'cards');assert.equal(saved.layout,uiBefore.layout);assert.equal(w.localStorage.getItem(DATA_KEY),before);fill('#day-span','1');await settle();
    });
    await t.test('criar em Meu dia preenche o dia escolhido e a área, e Desfazer preserva tarefas anteriores',async()=>{
      fill('#day-date','2200-11-13');node('#day-date').dispatchEvent(new w.Event('change',{bubbles:true}));await settle();fill('#area-filter',area);await settle();
      await click('[data-action="day-new-task"][data-date="2200-11-13"]');assert.equal(node('#item-date').value,'2200-11-13');assert.equal(node('#item-area').value,area);fill('#item-title','Nova tarefa pelo dia');await submit();const created=Object.values(state().items).find(x=>x.title==='Nova tarefa pelo dia');assert.equal(created.date,'2200-11-13');assert.ok(node(`.day-task [data-drag-item="${created.id}"]`));await click('[data-action="workflow-undo"]');assert.equal(state().items[created.id].deleted,true);
      fill('#area-filter','all');await settle();fill('#day-date','2200-11-12');node('#day-date').dispatchEvent(new w.Event('change',{bubbles:true}));await settle();assert.equal(w.document.querySelectorAll('.day-task').length,3);
    });
    await t.test('concluir, filtrar por concluídas e desfazer usam a mesma tarefa do Planejamento',async()=>{
      await click('.day-task [data-action="toggle"][data-id="p"]');assert.equal(state().items.p.status,'done');assert.equal(state().items.c.status,'pending');assert.equal(w.document.querySelector('.day-task [data-drag-item="p"]'),null);
      fill('#day-status','done');await settle();assert.equal(w.document.querySelectorAll('.day-task').length,1);assert.ok(node('.day-task [data-drag-item="p"]'));fill('#day-status','open');await settle();await click('[data-action="workflow-undo"]');assert.equal(state().items.p.status,'pending');
      await click('.day-task [data-action="workflow-quick"][data-id="p"][data-field="priority"]');fill('#quick-value','urgent');await submit();await click('[data-action="page"][data-page="plan"]');assert.equal(state().items.p.priority,'urgent');assert.ok(node('[data-drag-item="p"].priority-urgent'));await click('[data-action="page"][data-page="day"]');await click('[data-action="workflow-undo"]');assert.equal(state().items.p.priority,'normal');
    });
    await t.test('busca e área são compartilhadas, preservando foco e posição do cursor ao digitar',async()=>{
      const input=node('#search-input');input.focus();input.value='Teste c';input.setSelectionRange(2,2);input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();assert.equal(w.document.activeElement.id,'search-input');assert.equal(w.document.activeElement.selectionStart,2);assert.equal(w.document.querySelectorAll('.day-task').length,1);
      await click('[data-action="page"][data-page="plan"]');assert.equal(node('#search-input').value,'Teste c');assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);await click('[data-action="page"][data-page="day"]');await click('[data-action="day-clear"]');assert.equal(w.document.querySelectorAll('.day-task').length,3);
      fill('#day-priority','urgent');await settle();assert.equal(w.document.querySelectorAll('.day-task').length,0);await click('[data-action="day-clear"]');assert.equal(w.document.querySelectorAll('.day-task').length,3);
    });
    await t.test('prazo próprio do subitem move apenas ele para outro dia e pode ser desfeito',async()=>{
      await click('.day-task [data-action="workflow-quick"][data-id="c"][data-field="deadline"]');fill('#quick-date','2200-11-14');await submit();assert.equal(state().items.p.date,'2200-11-12');assert.equal(state().items.c.date,'2200-11-14');assert.equal(w.document.querySelectorAll('.day-task').length,2);await click('[data-action="workflow-undo"]');assert.equal(w.document.querySelectorAll('.day-task').length,3);assert.equal(state().items.c.time,'00:00');assert.match(node('.day-task [data-drag-item="c"] .parent-link').textContent,/Subitem de/);
    });
    await t.test('sair da seleção para Meu dia restaura ações de concluir e o botão de criar',async()=>{
      await click('[data-action="page"][data-page="plan"]');await click('[data-action="workflow-mode"]');await click('[data-action="workflow-all"]');await click('[data-action="page"][data-page="day"]');assert.equal(w.document.querySelectorAll('[data-action="workflow-select"]').length,0);assert.equal(w.document.querySelectorAll('.day-task [data-action="toggle"]').length,3);assert.ok(node('.desktop-add'));
    });
    await t.test('entrar em Meu dia a partir de Arquivadas conserva o aviso dos subitens ativos',async()=>{
      await click('[data-action="page"][data-page="plan"]');await click('[data-action="archive-view"][data-mode="archived"]');await click('[data-action="page"][data-page="day"]');assert.equal(w.document.querySelectorAll('.day-task').length,3);
      await click('.day-task [data-action="edit"][data-id="p"]');try{assert.match(node('.editor-danger .field-help').textContent,/também inclui os subitens/);}finally{await click('#cancel-item');await click('[data-action="page"][data-page="plan"]');await click('[data-action="archive-view"][data-mode="active"]');await click('[data-action="page"][data-page="day"]');}
    });
    await t.test('ocultar e mostrar Meu dia preserva tarefas e favoritas',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY),views=w.localStorage.getItem(VIEWS_KEY);await click('[data-action="page"][data-page="settings"]');
      assert.ok(!node('#app').textContent.includes('Google'));await click('[data-action="day-visibility"]');assert.equal(JSON.parse(w.localStorage.getItem(DAY_KEY)).enabled,false);assert.equal(w.document.querySelector('[data-action="page"][data-page="day"]'),null);
      await click('[data-action="day-visibility"]');assert.equal(JSON.parse(w.localStorage.getItem(DAY_KEY)).enabled,true);assert.ok(node('[data-action="page"][data-page="day"]'));assert.equal(w.localStorage.getItem(DATA_KEY),raw);assert.equal(w.localStorage.getItem(VIEWS_KEY),views);assert.equal(requests.length,0);
    });
  }finally{
    dom.window.close();for(const h of intervals)clearInterval(h);for(const h of timeouts)clearTimeout(h);globalThis.setInterval=nativeInterval;globalThis.setTimeout=nativeTimeout;
    for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
