import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initialState,activeAreas,updateItem} from '../dist/src/domain.js';
import {DATA_KEY,UI_KEY} from '../dist/src/repository.js';
import {VIEWS_KEY} from '../dist/src/workflows.js';

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
  w.localStorage.setItem(DATA_KEY,JSON.stringify(s));w.localStorage.setItem('entrelinhas-vida:day:v1','{"enabled":true}');w.localStorage.setItem(UI_KEY,JSON.stringify({visualVersion:3,dayLayout:'cards',dayStatus:'open'}));
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
    await t.test('criar subitens pelo mais funciona em lista, cartões e cada agrupamento',async()=>{
      for(const layout of ['compact','cards'])for(const group of ['none','area','priority','date']){
        await click('[data-action="ordering"]');fill('#view-layout',layout);fill('#group-by',group);await submit();
        const parent=structuredClone(state().items.b);
        assert.equal(w.document.querySelector('[data-drag-item="c"] [data-action="new-subitem"]'),null);
        await click('[data-action="new-subitem"][data-parent-id="b"]');
        assert.equal(node('#modal-title').textContent,'Adicionar subitem');assert.equal(node('#item-area').disabled,true);
        fill('#item-title','Nova etapa '+layout+' '+group);await submit();
        const child=Object.values(state().items).find(x=>!x.deleted&&x.parentId==='b');assert.ok(child);assert.equal(child.areaId,parent.areaId);
        assert.deepEqual(state().items.b,parent);assert.ok(node(`#subitems-b [data-drag-item="${child.id}"]`));
        await click('[data-action="workflow-undo"]');assert.equal(state().items[child.id].deleted,true);
      }
      await click('[data-action="ordering"]');fill('#view-layout','compact');fill('#group-by','none');await submit();
    });
    await t.test('controle global recolhe e expande, inclusive com busca, sem editar dados',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);
      await click('[data-action="collapse-subitems"]');assert.equal(w.document.querySelector('#subitems-p [data-drag-item="c"]'),null);
      assert.ok(node('[data-action="expand-subitems"]'));await click('[data-action="expand-subitems"]');assert.ok(node('#subitems-p [data-drag-item="c"]'));
      fill('#search-input','Teste p');await settle();await click('[data-action="collapse-subitems"]');assert.equal(w.document.querySelector('[data-drag-item="c"]'),null);
      await click('[data-action="expand-subitems"]');assert.ok(node('#subitems-p [data-drag-item="c"]'));await click('[data-action="clear"]');assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('remover um filtro conserva os demais e cancelar não aplica um rascunho',async()=>{
      await click('[data-action="filters"]');fill('#status-filter','pending');fill('#priority-filter','normal');await submit();
      assert.equal(w.document.querySelectorAll('.filter-chip').length,2);
      await click('[data-action="remove-filter"][data-filter="status"]');assert.equal(w.document.querySelectorAll('.filter-chip').length,1);
      await click('[data-action="filters"]');assert.equal(node('#status-filter').value,'all');assert.equal(node('#priority-filter').value,'normal');
      fill('#status-filter','done');await click('#cancel-view-options');await click('[data-action="filters"]');assert.equal(node('#status-filter').value,'all');await click('#cancel-view-options');await click('[data-action="clear"]');
    });
    await t.test('ordenação global de subitens persiste, favorita conserva e padrão restaura',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);
      for(const order of ['title','newest','priority','date']){
        await click('[data-action="ordering"]');fill('#subitem-sort-filter',order);await submit();
        assert.equal(node('.subitem-order').value,order);assert.equal(JSON.parse(w.localStorage.getItem(UI_KEY)).subitemOrder,order);
      }
      await click('[data-action="workflow-views"]');fill('#view-name','Etapas por data');await submit();
      assert.equal(JSON.parse(w.localStorage.getItem(VIEWS_KEY))[0].view.subitemOrder,'date');
      await click('[data-action="workflow-views"]');await click('[data-view-remove]');await click('[data-workflow-cancel]');
      await click('[data-action="ordering"]');await click('#reset-view-order');await submit();assert.equal(node('.subitem-order').value,'manual');assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('nova etapa fica visível mesmo quando a busca só correspondia à etapa anterior',async()=>{
      fill('#search-input','Teste c');await settle();await click('[data-action="new-subitem"][data-parent-id="p"]');fill('#item-title','Outra etapa');await submit();
      const child=Object.values(state().items).find(x=>!x.deleted&&x.title==='Outra etapa');assert.ok(node(`#subitems-p [data-drag-item="${child.id}"]`));assert.equal(node('#search-input').value,'');
      await click('[data-action="workflow-undo"]');assert.equal(state().items[child.id].deleted,true);
    });
    await t.test('abertura monta controles novos e não cria botões aninhados',()=>{
      assert.equal(w.document.querySelectorAll('[data-action="workflow-quick"]').length,9);
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
      await click('[data-action="expand-item"][data-id="p"]');
      await click('[data-action="workflow-mode"]');assert.equal(w.document.querySelectorAll('[data-action="toggle"]').length,0);await click('[data-action="workflow-all"]');assert.equal(w.document.querySelectorAll('[data-action="workflow-select"][aria-checked="true"]').length,2);
      await click('[data-action="workflow-bulk"]');fill('#bulk-date','2200-12-01');await submit();const saved=state();assert.equal(saved.items.p.date,'2200-12-01');assert.equal(saved.items.b.date,'2200-12-01');assert.equal(saved.items.c.date,'2200-11-12');assert.equal(saved.items.p.time,'14:35');assert.equal(w.document.querySelector('.bulk-bar'),null);
      await click('[data-action="workflow-undo"]');assert.equal(state().items.p.date,'2200-11-12');assert.equal(state().items.b.date,'2200-11-12');await click('[data-action="expand-item"][data-id="p"]');
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
    await t.test('Meu dia foi removido e preferências antigas somem sem alterar tarefas ou favoritas',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY),views=w.localStorage.getItem(VIEWS_KEY);
      assert.equal(w.document.querySelector('[data-page="day"]'),null);assert.equal(w.localStorage.getItem(legacyKey),null);assert.equal(w.localStorage.getItem('entrelinhas-vida:agenda-pairing:v1'),null);
      await click('[data-action="page"][data-page="settings"]');assert.doesNotMatch(node('#app').textContent,/Meu dia|Google Agenda/);assert.equal(w.localStorage.getItem(DATA_KEY),raw);assert.equal(w.localStorage.getItem(VIEWS_KEY),views);assert.equal(requests.length,0);
      await click('[data-action="home"]');fill('#search-input','');await settle();await click('[data-action="ordering"]');fill('#view-layout','compact');fill('#group-by','none');await submit();
    });
    await t.test('subitens aparecem abertos sob seu principal sem cópia independente',async()=>{
      assert.equal(node('[data-action="expand-item"][data-id="p"]').getAttribute('aria-expanded'),'true');assert.ok(node('[data-root-item][data-drag-item="p"] #subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);
      assert.deepEqual([...w.document.querySelectorAll('.compact-list > [data-drag-item]')].map(x=>x.dataset.dragItem),['p','b']);
    });
    await t.test('recolher e reabrir conserva a hierarquia e dados',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY),selector='[data-action="expand-item"][data-id="p"]';await click(selector);assert.equal(w.document.querySelector('[data-drag-item="c"]'),null);assert.deepEqual(JSON.parse(w.localStorage.getItem(UI_KEY)).collapsedItems,['p']);await click(selector);assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('busca por subitem mantém o principal e abre as etapas correspondentes',async()=>{
      await click('[data-action="expand-item"][data-id="p"]');const input=node('#search-input');input.focus();fill('#search-input','Teste c');await settle();assert.equal(w.document.activeElement.id,'search-input');assert.equal(w.document.querySelectorAll('[data-root-item]').length,1);assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);await click('[data-action="clear"]');await click('[data-action="expand-item"][data-id="p"]');
    });
    await t.test('buscar o principal revela seus subitens com títulos diferentes em todos os formatos',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY),selector='[data-action="expand-item"][data-id="p"]';
      if(node(selector).getAttribute('aria-expanded')==='true')await click(selector);
      fill('#search-input','Teste p');await settle();assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);
      await click(selector);assert.equal(w.document.querySelector('[data-drag-item="c"]'),null);await click('[data-action="expand-subitems"]');assert.ok(node('#subitems-p [data-drag-item="c"]'));
      for(const layout of ['compact','cards'])for(const group of ['none','area','priority','date']){await click('[data-action="ordering"]');fill('#view-layout',layout);fill('#group-by',group);await submit();assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);}
      assert.equal(w.localStorage.getItem(DATA_KEY),raw);await click('[data-action="clear"]');
    });
    await t.test('tela inicial permite revelar subitens recolhidos sem editar as tarefas',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);await click('[data-action="expand-item"][data-id="p"]');assert.ok(node('[data-action="expand-subitems"]'));await click('[data-action="page"][data-page="settings"]');await click('[data-action="home"]');
      assert.equal(w.document.querySelector('[data-drag-item="c"]'),null);await click('[data-action="expand-subitems"]');assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelector('[data-action="expand-subitems"]'),null);assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('selecionar exibidas inclui etapas mostradas pela correspondência do principal',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);fill('#search-input','Teste p');await settle();await click('[data-action="workflow-mode"]');await click('[data-action="workflow-all"]');
      assert.equal(w.document.querySelectorAll('[data-action="workflow-select"][aria-checked="true"]').length,2);assert.equal(w.document.querySelector('[data-action="workflow-select"][data-id="b"]'),null);
      await click('[data-action="workflow-mode"]');await click('[data-action="clear"]');assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });
    await t.test('prazo independente do subitem não separa a família no agrupamento por prazo',async()=>{
      await click('[data-action="workflow-quick"][data-id="c"][data-field="deadline"]');fill('#quick-date','2200-11-14');await submit();await click('[data-action="ordering"]');fill('#group-by','date');await submit();assert.equal(state().items.p.date,'2200-11-12');assert.equal(state().items.c.date,'2200-11-14');assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);await click('[data-action="workflow-undo"]');assert.equal(state().items.c.time,'00:00');
    });
    await t.test('cartões e todos os agrupamentos mantêm cada família reunida',async()=>{
      const raw=w.localStorage.getItem(DATA_KEY);for(const layout of ['compact','cards'])for(const group of ['none','area','priority','date']){await click('[data-action="ordering"]');fill('#view-layout',layout);fill('#group-by',group);await submit();assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);assert.equal(w.localStorage.getItem(DATA_KEY),raw);}
    });
    await t.test('concluir principal preserva andamento do subitem e Desfazer mantém vínculo',async()=>{
      await click('[data-action="toggle"][data-id="p"]');assert.equal(state().items.p.status,'done');assert.equal(state().items.c.status,'pending');assert.ok(node('#subitems-p [data-drag-item="c"]'));await click('[data-action="workflow-undo"]');assert.equal(state().items.p.status,'pending');assert.equal(state().items.c.parentId,'p');
    });
    await t.test('arquivar somente subitem exibe principal ativo como contexto e permite restaurar',async()=>{
      await click('[data-action="edit"][data-id="c"]');await click('#archive-item');assert.equal(state().items.c.archived,true);assert.equal(state().items.p.archived,false);await click('[data-action="archive-view"][data-mode="archived"]');assert.match(node('[data-drag-item="p"] > .parent-link').textContent,/principal ativo/);assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelector('[data-action="toggle"][data-id="p"]'),null);
      await click('[data-action="workflow-mode"]');await click('[data-action="workflow-all"]');assert.equal(w.document.querySelector('[data-action="workflow-select"][data-id="p"]'),null);assert.equal(w.document.querySelectorAll('[data-action="workflow-select"][aria-checked="true"]').length,1);await click('[data-action="workflow-mode"]');await click('[data-action="restore-item"][data-id="c"]');assert.equal(state().items.c.archived,false);assert.equal(state().items.p.archived,false);await click('[data-action="archive-view"][data-mode="active"]');
    });
    await t.test('arquivar família conserva filhos reunidos em todos os agrupamentos',async()=>{
      await click('[data-action="edit"][data-id="p"]');await click('#archive-item');await click('[data-action="archive-view"][data-mode="archived"]');for(const group of ['none','area','priority','date']){await click('[data-action="ordering"]');fill('#group-by',group);await submit();assert.ok(node('#subitems-p [data-drag-item="c"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="c"]').length,1);}await click('[data-action="restore-item"][data-id="p"]');await click('[data-action="archive-view"][data-mode="active"]');
    });

    await t.test('listas extensas paginam subitens dentro do principal e buscam além da janela',async()=>{
      await click('[data-action="ordering"]');fill('#group-by','none');fill('#view-layout','compact');await submit();
      const next=state();for(let i=0;i<145;i++)updateItem(next,'step-'+i,{title:'Etapa paginada '+i,notes:'',areaId:area,parentId:'p',date:'',time:'',status:'pending',priority:'normal'},'fixture');
      w.localStorage.setItem(DATA_KEY,JSON.stringify(next));w.dispatchEvent(new w.StorageEvent('storage',{key:DATA_KEY}));await settle();const raw=w.localStorage.getItem(DATA_KEY);
      assert.equal(w.document.querySelectorAll('#subitems-p [data-drag-item]').length,60);await click('[data-action="show-more"][data-collection="subitems-p"]');assert.equal(w.document.querySelectorAll('#subitems-p [data-drag-item]').length,120);await click('[data-action="show-more"][data-collection="subitems-p"]');assert.equal(w.document.querySelectorAll('#subitems-p [data-drag-item]').length,146);
      fill('#search-input','Etapa paginada 144');await settle();assert.equal(w.document.querySelectorAll('[data-root-item]').length,1);assert.ok(node('#subitems-p [data-drag-item="step-144"]'));assert.equal(w.document.querySelectorAll('[data-drag-item="step-144"]').length,1);assert.equal(w.localStorage.getItem(DATA_KEY),raw);
    });

  }finally{
    dom.window.close();for(const h of intervals)clearInterval(h);for(const h of timeouts)clearTimeout(h);globalThis.setInterval=nativeInterval;globalThis.setTimeout=nativeTimeout;
    for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
