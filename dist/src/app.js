import {createCalendarUI} from './calendar-ui.js';
import {captureChange,undoChange,cleanView} from './workflows.js';
import {createWorkflowUI} from './workflow-ui.js';
import {updateMarkup,updateFilterIndicator,taskAppearance,priorityIndicator,areaIndicator} from './rendering.js';
import {createNavigation} from './navigation.js';
import {CollectionWindow} from './collections.js';
import {APP_ID,COLORS,PALETTE,PRIORITIES,STATUS_LABELS,areaNameKey,migrateState,reorderAreas,moveItem,restoreSnapshot,uid,initialState,activeAreas,activeItems,visibleItems,archivedItems,isArchived,setArchived,completedToArchive,rootItems,subitemsOf,selectPlanningItems,openItem,localDate,validDate,validateState,stamp,updateItem,deleteItem,removeArea,groupItems,selectItems,selectMovePeers} from './domain.js';
import {Repository,browserStorage,DATA_KEY,UI_KEY,DEVICE_KEY} from './repository.js';
import {bindDrag} from './drag.js';
import {createSyncUI} from './sync/ui.js';
import {bindFormErrors,checkForm,submitOnce,bindItemSchedule,bindSelectHint,refreshSelectHint,fitTextArea,resizeTextArea,restoreUIFocus} from './forms.js';
import {createInstallation} from './pwa.js';
import {createPlanningUI} from './planning-ui.js';
import {createDeadlineContext,dateInZone} from './planning.js';
const VERSION='1.6.1';
const collections=new CollectionWindow();
const installation=createInstallation({onChange:updateInstallControls});
let syncUI,planningUI,navigation,workflowUI,calendarUI,lastUndo=null,undoBusy=false;
const ICONS={archive:'<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8M10 12h4"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',gear:'<path d="m9 3-.5 2.5-1.4.8-2.4-.8-2.4 4.2 1.9 1.7v1.6l-1.9 1.7 2.4 4.2 2.4-.8 1.4.8L9 21h6l.5-2.5 1.4-.8 2.4.8 2.4-4.2-1.9-1.7v-1.6l1.9-1.7-2.4-4.2-2.4.8-1.4-.8L15 3Z"/><circle cx="12" cy="12" r="3"/>',cloud:'<path d="M7 18h10a4 4 0 0 0 .3-8A5.5 5.5 0 0 0 6.6 9a4.5 4.5 0 0 0 .4 9Z"/>',grip:'<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',resume:'<path d="M4 9a8 8 0 1 1 .6 7M4 4v5h5"/>',appearance:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4 9 9 0 0 0-9-8Z"/><circle cx="7.5" cy="11" r=".7"/><circle cx="10" cy="7.5" r=".7"/><circle cx="14.5" cy="7.5" r=".7"/><circle cx="17" cy="11" r=".7"/>',list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18"/>',settings:'<path d="M3 7h3m6 0h9M3 17h9m6 0h3"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 4 4L19 6"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',edit:'<path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z"/>',leaf:'<path d="M20 4C8 3 3 8 6 15c7 4 14-1 14-11Z"/><path d="M4 21 15 10"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',box:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9h8M8 13h5"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',device:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',flag:'<path d="M5 21V4c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'};
ICONS.star='<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>';
ICONS.filter='<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>';ICONS.sort='<path d="M8 3v18m-4-4 4 4 4-4M16 21V3m-4 4 4-4 4 4"/>';
const icon=n=>`<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||ICONS.box}</svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areaStyle=a=>`style="--area-color:${a?.color||COLORS[0]}"`;
const storage=browserStorage();
const repo=new Repository(storage);
let fatal='',state,deviceId,ui={accent:'teal',visualVersion:3,motion:'subtle'};
try{state=repo.load()}catch(e){fatal=e.message;state=initialState()}
try{const savedUI=JSON.parse(storage.getItem(UI_KEY)||'{}');ui={...ui,...savedUI};if(Object.hasOwn(ui,'theme')){delete ui.theme;storage.setItem(UI_KEY,JSON.stringify(ui))}if(savedUI.visualVersion!==3){ui.accent='teal';ui.visualVersion=3;storage.setItem(UI_KEY,JSON.stringify(ui))}deviceId=storage.getItem(DEVICE_KEY);if(!deviceId){deviceId=uid();storage.setItem(DEVICE_KEY,deviceId)}}catch{deviceId=uid()}
let archiveMode=false;
let page='plan',area='all',status='all',scope='all',query='',priorityFilter='all',sortOrder=['manual','priority','date','title','newest'].includes(ui.order)?ui.order:'manual',toastTimer,returnFocus,modalDirty=false;
let deadlines=null;
let childIndex=new Map(),indexedState=null,indexedArchive=null,viewItems=null,viewFiltered=null;
function beginView(){const now=new Date();deadlines=createDeadlineContext(now,planningUI?.timeZone());viewItems=null;viewFiltered=null;planningUI?.beginRender(now);}
const expandedItems=new Set(Array.isArray(ui.expandedItems)?ui.expandedItems.filter(id=>Object.hasOwn(state.items,id)&&!state.items[id].deleted&&!state.items[id].parentId):[]),collapsedMatches=new Set();
let subitemOrder=['manual','priority','date'].includes(ui.subitemOrder)?ui.subitemOrder:'manual';
let groupBy=['area','priority','none','date'].includes(ui.groupBy)?ui.groupBy:'none',layout=ui.layout==='cards'?'cards':'compact';
document.documentElement.dataset.accent=ui.accent||'teal';
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
function motionEnabled(){return ui.motion!=='off'&&!motionPreference.matches}
function syncVisualMotion(){const root=document.documentElement;root.dataset.motion=motionEnabled()?'subtle':'off';const typing=document.activeElement?.matches('input,textarea,select');root.dataset.pageHidden=String(document.hidden);root.dataset.ambientPaused=String(!motionEnabled()||document.hidden||!!typing||!!document.querySelector('dialog[open]'))}
function enterView(){if(!motionEnabled())return;const content=document.querySelector('#task-results')||document.querySelector('main');content?.animate?.([{opacity:.94,transform:'translate3d(0,3px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.3,1)'})}
const today=()=>deadlines?.today||dateInZone(new Date(),planningUI?.timeZone());
const isTaskOverdue=t=>deadlines.forItem(t).overdue;
const dateLabel=(date,opts={day:'numeric',month:'short'})=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',opts).replace('.','');
const statusLabel=STATUS_LABELS;
function saveUI(){try{storage.setItem(UI_KEY,JSON.stringify(ui))}catch{toast('A preferência de aparência vale apenas nesta sessão.')}}
function toast(message,action){clearTimeout(toastTimer);const el=document.querySelector('#toasts');el.innerHTML=`<div class="toast"><span>${esc(message)}</span>${action?`<button id="toast-action">${esc(action.label)}</button>`:''}</div>`;if(action)document.querySelector('#toast-action').onclick=()=>{el.innerHTML='';action.run()};toastTimer=setTimeout(()=>el.innerHTML='',action?9000:5500)}
function showUndo(message){toast(message,lastUndo?{label:'Desfazer',run:undoLast}:undefined)}
async function mutate(operation,message,{replace=null,undoable=true}={}){
  let changes=null;
  try{
    state=await repo.commit(s=>{if(undoable)changes=captureChange(s,operation);else operation(s)},{replace});
    fatal='';if(replace)lastUndo=null;else if(changes?.length)lastUndo=changes;
    syncUI?.localSaved();render();syncUI?.changed();if(message)showUndo(message);return true;
  }catch(e){if(e.code==='LOCAL_STORAGE_FAILED')syncUI?.localFailure(e.message);const err=document.querySelector('.formerror');if(err)err.textContent=e.message;else toast(e.message);return false;}
}
async function undoLast(){
  if(!lastUndo||fatal||undoBusy)return;
  undoBusy=true;const entry=lastUndo,focus=document.activeElement;
  try{if(await mutate(s=>undoChange(s,entry,deviceId),null,{undoable:false})){if(lastUndo===entry)lastUndo=null;render();toast('Alteração desfeita.');restoreUIFocus(focus);}}finally{undoBusy=false;}
}

function navButton(p,label,i){return `<button data-action="page" data-page="${p}" class="view-tab ${page===p?'active':''}" ${page===p?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`}
function render(){
  const focus=document.activeElement,hadAppFocus=!!focus?.closest('#app'),caret=typeof focus?.selectionStart==='number'?[focus.selectionStart,focus.selectionEnd]:null;
  if(page==='day'&&calendarUI&&!calendarUI.enabled)page='plan';
  beginView();
  document.title=(archiveMode&&['plan','agenda'].includes(page)?'Arquivadas':({plan:'Planejamento',day:'Meu dia',agenda:'Cronograma',areas:'Áreas',settings:'Configurações',reminders:'Lembretes'})[page])+' · Retomar';
  indexChildren();
  workflowUI?.reconcile();
  const areas=activeAreas(state);if(area!==''&&area!=='all'&&!areas.some(a=>a.id===area))area='all';
  navigation?.record();
  document.querySelector('#app').innerHTML=`<div class="tracker-shell ${workflowUI?.selecting?'is-selecting':''}" data-page="${page}"><header class="masthead"><button type="button" class="brand" data-action="home" aria-label="Retomar, voltar ao planejamento"><span class="brandmark">${icon('resume')}</span><div class="brand-copy"><span class="brandname">Retomar</span><span class="brandcaption">Planejamento de vida</span></div></button><div class="header-actions">${['plan','agenda','day'].includes(page)&&!workflowUI?.selecting?`<button class="btn primary desktop-add" data-action="new">${icon('plus')} Adicionar item</button>`:''}<div class="header-tools">${planningUI?.header()||''}${syncUI?.header()||''}<button type="button" class="settings-trigger ${page==='settings'?'selected':''}" data-action="page" data-page="settings" aria-label="Configurações" title="Configurações" ${page==='settings'?'aria-current="page"':''}>${icon('gear')}</button></div></div></header><nav class="viewnav ${calendarUI?.enabled?'calendar-nav':''}" aria-label="Visualização do planejamento">${navButton('plan','Planejamento','grid')}${calendarUI?.enabled?navButton('day','Meu dia','calendar'):''}</nav><main>${fatal?`<div class="errorbanner" role="alert">${esc(fatal)}<br>Os dados existentes serão preservados. <button data-action="raw">Baixar cópia para recuperação</button> <button data-action="page" data-page="settings">Restaurar backup</button></div>`:''}${page==='plan'?renderPlan():page==='day'?calendarUI?.page()||'':page==='agenda'?renderAgenda():page==='areas'?renderAreas():page==='reminders'?planningUI.page():renderSettings()}</main></div>${['plan','agenda','day'].includes(page)&&!workflowUI?.selecting?`<div class="mobile-actions"><button class="btn primary" data-action="new" aria-label="Adicionar tarefa">${icon('plus')}<span>Adicionar</span></button></div>`:''}`;
  bindApp();
  navigation?.record();
  syncVisualMotion();
  syncUI?.refresh();
  planningUI?.syncPush();
  if(hadAppFocus&&!focus.isConnected&&document.activeElement===document.body&&!document.querySelector('dialog[open]')){const target=restoreUIFocus(focus);if(caret&&target?.setSelectionRange)try{target.setSelectionRange(...caret)}catch{}}
  if(page==='day')calendarUI?.enter();
}
function taskAreas(){return [{id:'',name:'Sem área',color:'#64748b'},...activeAreas(state)]}
function areaTabs(){return `<section class="area-selector" aria-label="Áreas da vida"><div class="field"><label class="sr-only" for="area-filter">Área</label><select id="area-filter"><option value="all" ${area==='all'?'selected':''}>Todas as áreas</option>${taskAreas().map(a=>`<option value="${esc(a.id)}" ${area===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div><button class="btn secondary" data-action="areas" aria-label="Organizar áreas" title="Organizar áreas">${icon('grid')}<span>Áreas</span></button></section>`}

function indexChildren(){const archived=archiveMode&&['plan','agenda'].includes(page);if(indexedState===state&&indexedArchive===archived)return;indexedState=state;indexedArchive=archived;childIndex=new Map();for(const t of (archived?archivedItems(state):visibleItems(state)))if(t.parentId){if(!childIndex.has(t.parentId))childIndex.set(t.parentId,[]);childIndex.get(t.parentId).push(t)}}
const childrenOf=id=>childIndex.get(id)||[];
function persistExpanded(){ui.expandedItems=[...expandedItems].filter(id=>state.items[id]&&!state.items[id].deleted&&!state.items[id].parentId).slice(-500);saveUI()}
function filterOptions(){return {status,scope,query,priority:priorityFilter,order:sortOrder,today:today(),isOverdue:isTaskOverdue}}
function isExpanded(t){return expandedItems.has(t.id)||(filtersActive()&&!collapsedMatches.has(t.id)&&selectItems(childrenOf(t.id),filterOptions()).length>0)}
function areaItems(){return viewItems??=(archiveMode?archivedItems(state):visibleItems(state)).filter(t=>area==='all'||t.areaId===area)}
const viewChoices={
  layout:[['compact','Lista compacta'],['cards','Cartões']],
  group:[['none','Sem agrupamento'],['area','Área'],['priority','Prioridade'],['date','Prazo']],
  order:[['manual','Minha ordem'],['priority','Prioridade'],['date','Data'],['title','Título'],['newest','Mais recentes']],
  status:[['all','Todos'],['open','Em aberto'],['pending','Pendente'],['doing','Em andamento'],['done','Concluído'],['canceled','Cancelado']],
  scope:[['all','Com e sem data'],['overdue','Atrasados'],['today','Hoje'],['upcoming','Próximos'],['undated','Sem data']],
  priority:[['all','Todas'],...PRIORITIES.map(p=>[p.id,p.label])]
};
function viewSelection(){
  const selected=[];
  if(status!=='all')selected.push(viewChoices.status.find(([id])=>id===status)?.[1]);
  if(scope!=='all')selected.push(viewChoices.scope.find(([id])=>id===scope)?.[1]);
  if(priorityFilter!=='all')selected.push('Prioridade '+viewChoices.priority.find(([id])=>id===priorityFilter)?.[1]?.toLocaleLowerCase('pt-BR'));
  if(layout==='cards')selected.push('Cartões');
  if(groupBy!=='none')selected.push('Agrupado por '+viewChoices.group.find(([id])=>id===groupBy)?.[1]?.toLocaleLowerCase('pt-BR'));
  if(sortOrder!=='manual')selected.push('Ordem por '+viewChoices.order.find(([id])=>id===sortOrder)?.[1]?.toLocaleLowerCase('pt-BR'));
  return `<p id="view-selection" class="view-selection" aria-label="Visualização atual" aria-live="polite" ${selected.length?'':'hidden'}>${selected.filter(Boolean).map(esc).join(' · ')}</p>`;
}
function controls(){
  const count=[status!=='all',scope!=='all',priorityFilter!=='all'].filter(Boolean).length;
  const ordered=layout!=='compact'||groupBy!=='none'||sortOrder!=='manual';
  return `<section class="filter-panel" aria-label="Busca e filtros"><div class="filter-main"><div class="searchline">${icon('search')}<label class="sr-only" for="search-input">Buscar itens e subitens</label><input id="search-input" type="search" maxlength="200" value="${esc(query)}" placeholder="Buscar"></div><button class="filter-toggle ${count?'selected':''}" data-action="filters" aria-haspopup="dialog">${icon('filter')}<span>Filtros${count?' · '+count:''}</span></button><button class="filter-toggle ${ordered?'selected':''}" data-action="ordering" aria-haspopup="dialog">${icon('sort')}<span>Ordenar</span></button></div>${viewSelection()}</section>`;
}
function openViewOptions(kind){
  const filters=kind==='filters',trigger=document.querySelector(`[data-action="${kind}"]`);
  const fields=filters?[
    ['status-filter','Andamento',viewChoices.status,status],
    ['scope-filter','Prazo',viewChoices.scope,scope],
    ['priority-filter','Prioridade',viewChoices.priority,priorityFilter]
  ]:[
    ['view-layout','Formato',viewChoices.layout,layout],
    ['group-by','Agrupar por',viewChoices.group,groupBy],
    ['sort-filter','Ordenar por',viewChoices.order,sortOrder]
  ];
  const root=openModal(filters?'Filtros':'Ordenar e agrupar',`<form id="view-options-form">${fields.map(([id,label,options,current])=>`<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map(([value,text])=>`<option value="${value}" ${value===current?'selected':''}>${text}</option>`).join('')}</select></div>`).join('')}${filters?'<button type="button" class="textbtn" id="reset-view-filters">Limpar seleção</button>':''}<div class="dialogactions"><button type="button" class="btn secondary" id="cancel-view-options">Cancelar</button><button type="submit" class="btn primary">Aplicar</button></div></form>`,{className:'view-options-dialog'});
  const dialog=root.querySelector('dialog');
  root.querySelector('#close-modal').setAttribute('aria-label',filters?'Fechar filtros':'Fechar ordenação');
  function position(){
    const rect=trigger.getBoundingClientRect(),width=Math.min(380,window.innerWidth-32);
    const left=Math.max(16,Math.min(rect.right-width,window.innerWidth-width-16));
    const top=Math.max(16,Math.min(rect.bottom+8,window.innerHeight-dialog.offsetHeight-16));
    dialog.style.setProperty('--options-left',left+'px');dialog.style.setProperty('--options-top',top+'px');
  }
  position();window.addEventListener('resize',position);
  dialog.addEventListener('close',()=>window.removeEventListener('resize',position),{once:true});
  root.querySelector('#cancel-view-options').onclick=()=>closeModal();
  root.querySelector('#reset-view-filters')?.addEventListener('click',()=>{
    for(const [id] of fields)root.querySelector('#'+id).value='all';
    modalDirty=true;
  });
  root.querySelector('form').onsubmit=submitOnce(async e=>{
    if(!checkForm(e.target))return;
    if(filters){status=root.querySelector('#status-filter').value;scope=root.querySelector('#scope-filter').value;priorityFilter=root.querySelector('#priority-filter').value}
    else{
      layout=root.querySelector('#view-layout').value;groupBy=root.querySelector('#group-by').value;sortOrder=root.querySelector('#sort-filter').value;
      ui.layout=layout;ui.groupBy=groupBy;ui.order=sortOrder;saveUI();
    }
    collapsedMatches.clear();collections.reset();render();closeModal(true);
  });
}

function archiveToolbar(){const count=archivedItems(state).length,candidates=completedToArchive(state,selectItems(areaItems(),filterOptions()));return `<section id="archive-toolbar" class="archive-toolbar" aria-label="Arquivo de tarefas"><div class="archive-tabs" role="group" aria-label="Mostrar tarefas"><button data-action="archive-view" data-mode="active" aria-pressed="${!archiveMode}">Ativas</button><button data-action="archive-view" data-mode="archived" aria-pressed="${archiveMode}">Arquivadas <span>${count}</span></button></div>${!archiveMode&&candidates.length?`<button class="textbtn" data-action="archive-completed">Arquivar concluídas (${candidates.length})</button>`:''}</section>`}

function manageButton(t){return `<button class="manage-task" data-action="edit" data-id="${esc(t.id)}" aria-label="Gerenciar: ${esc(t.title)}" title="Editar e gerenciar tarefa">${icon('gear')}<span class="sr-only">Gerenciar</span></button>`}

function archiveButton(t){return isArchived(state,t)?`<button class="textbtn task-archive" data-action="restore-item" data-id="${esc(t.id)}">${icon('resume')} Restaurar</button>`:t.status==='done'?`<button class="textbtn task-archive" data-action="archive-item" data-id="${esc(t.id)}">${icon('archive')} Arquivar</button>`:''}
function pageHeading(title,subtitle){return `<div class="page-heading"><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>`}
function timelineView(){return page==='agenda'||page==='plan'&&groupBy==='date'}
function priorityView(){return !archiveMode&&page==='plan'&&groupBy==='priority'}

function orderToolbar(){const active=filtersActive();return `<div id="results-summary" class="results-caption" ${active?'':'hidden'}>${active?`<span>${filtered().length} ${filtered().length===1?'resultado':'resultados'}</span><button class="textbtn" data-action="clear">Limpar filtros</button>`:''}</div>`}
function openSummary(list){const main=list.filter(t=>!t.parentId&&openItem(t)).length,sub=list.filter(t=>t.parentId&&openItem(t)).length;return sub?`${main} ${main===1?'item':'itens'} e ${sub} ${sub===1?'subitem':'subitens'} em aberto`:`${main} ${main===1?'item em aberto':'itens em aberto'}`}
function renderPlan(){return `<div class="planning-overview ${archiveMode?'is-archive':''}">${pageHeading(archiveMode?'Arquivadas':'Planejamento',archiveMode?'Preservadas para consultar ou restaurar.':openSummary(areaItems()))}${planningUI?.summary()||''}</div>${areaTabs()}${controls()}${archiveToolbar()}${workflowUI?.toolbar()||''}${orderToolbar()}<div id="task-results" class="results layout-${layout} group-${groupBy} ${priorityView()?'priority-board':''}" aria-live="polite">${planningResults()}</div>`}
const dayLayout=()=>ui.dayLayout==='compact'?'compact':'cards';
const dayStatus=()=>['open','all',...Object.keys(statusLabel)].includes(ui.dayStatus)?ui.dayStatus:'open';
function dayTasks(){return selectItems(visibleItems(state).filter(t=>area==='all'||t.areaId===area),{query,priority:priorityFilter,status:dayStatus(),scope:'all',order:'date'});}
function dayTools(){return `<section class="day-planning-tools" aria-label="Tarefas do Planejamento em Meu dia"><div class="day-planning-toolbar"><div class="day-layout-tabs" role="group" aria-label="Formato de Meu dia">${[['compact','list','Lista'],['cards','grid','Cartões']].map(([id,i,label])=>`<button type="button" data-action="day-layout" data-layout="${id}" aria-pressed="${dayLayout()===id}">${icon(i)}${label}</button>`).join('')}</div><button type="button" class="textbtn" data-action="page" data-page="plan">${icon('arrow')} Abrir Planejamento</button>${lastUndo?`<button type="button" class="textbtn" data-action="workflow-undo">${icon('resume')} Desfazer</button>`:''}</div>${areaTabs()}<div class="day-task-filters"><div class="searchline">${icon('search')}<label class="sr-only" for="search-input">Buscar tarefas e eventos</label><input id="search-input" type="search" maxlength="200" value="${esc(query)}" placeholder="Buscar tarefas e eventos"></div><div class="field"><label for="day-status">Tarefas</label><select id="day-status">${[['open','Em aberto'],['all','Todos os andamentos'],...Object.entries(statusLabel)].map(([id,label])=>`<option value="${id}" ${dayStatus()===id?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label for="day-priority">Prioridade das tarefas</label><select id="day-priority"><option value="all">Todas</option>${PRIORITIES.map(p=>`<option value="${p.id}" ${priorityFilter===p.id?'selected':''}>${p.label}</option>`).join('')}</select></div><button type="button" class="textbtn" data-action="day-clear">Limpar filtros</button></div><p class="field-help">Busca, área e prioridade são compartilhadas com o Planejamento. A busca inclui eventos do Google; área, prioridade e andamento filtram apenas tarefas.</p></section>`;}

function planningResults(){collections.begin();if(groupBy==='date')return renderTimeline();return archiveMode?(filtered().length?itemCollection(filtered(),'archive'):empty('Nenhuma tarefa arquivada nestes filtros.','As tarefas arquivadas aparecerão aqui e poderão ser restauradas.','Ver tarefas ativas','active-view')):priorityView()?renderPriorityResults():renderResults()}
function renderPriorityResults(){const items=filtered();return PRIORITIES.map(p=>{const list=items.filter(t=>openItem(t)&&t.priority===p.id);return `<section class="priority-lane priority-${p.id}" data-drop-priority="${p.id}" aria-label="Prioridade ${p.label}"><div class="priority-lane-head"><h2><span aria-hidden="true">${p.symbol}</span> ${p.label}</h2><span class="section-count">${list.length}</span><button class="iconbtn" data-action="new" data-priority="${p.id}" aria-label="Adicionar item de prioridade ${p.label}">${icon('plus')}</button></div>${list.length?itemCollection(list,'priority-'+p.id):'<p class="lane-empty">Nenhum item. Solte aqui para adicionar.</p>'}</section>`}).join('')+(!items.some(openItem)?'<p class="empty-inline">Nenhum item em aberto neste grupo de filtros.</p>':'')+(items.some(t=>!openItem(t))?`<section class="priority-closed"><h2>Encerrados</h2>${itemCollection(items.filter(t=>!openItem(t)),'closed')}</section>`:'')}
function filtered(){return viewFiltered??=(page==='agenda'||groupBy==='date'||archiveMode?selectItems:selectPlanningItems)(areaItems(),filterOptions())}
function filtersActive(){return status!=='all'||scope!=='all'||!!query.trim()||priorityFilter!=='all'}
function renderResults(){const list=filtered();if(!list.length){const has=areaItems().length>0;const title=has?'Nenhum item corresponde aos filtros.':area==='all'?'Seu planejamento começa aqui.':`Nenhum item em ${esc(state.areas[area]?.name??'Sem área')}.`;return empty(title,has?'Ajuste a busca ou limpe os filtros para consultar os outros itens.':'Adicione um item com ou sem data. Você poderá editar tudo depois.',has?'Limpar filtros':'Adicionar primeiro item',has?'clear':'new',!activeItems(state).length)}return groupBy==='none'?itemCollection(list):taskAreas().filter(a=>list.some(t=>t.areaId===a.id)).map(a=>areaSection(a,list.filter(t=>t.areaId===a.id))).join('')}
function areaSection(a,items){const all=visibleItems(state).filter(t=>!t.parentId&&t.areaId===a.id),done=all.filter(t=>t.status==='done').length,total=all.filter(t=>t.status!=='canceled').length;return `<section class="area-section" data-drop-area="${esc(a.id)}" ${areaStyle(a)} aria-label="Itens de ${esc(a.name)}"><div class="area-section-head"><div class="area-section-title"><i class="dot"></i><h2>${esc(a.name)}</h2><span class="section-count mono">${items.length}</span></div><div class="area-section-actions"><span class="area-progress" aria-label="${done} de ${total} itens concluídos"><span class="mini-progress"><i style="width:${total?Math.round(100*done/total):0}%"></i></span><span class="mono">${done}/${total}</span><span class="progress-label">concluídos</span></span><button class="iconbtn" data-action="new" data-area-id="${esc(a.id)}" aria-label="Adicionar item em ${esc(a.name)}" title="Adicionar item">${icon('plus')}</button></div></div>${itemCollection(items,'area-'+a.id)}</section>`}

function completion(t){if(workflowUI?.selecting)return workflowUI.selectionButton(t);return `<button class="taskcheck ${t.status}" data-action="toggle" data-id="${esc(t.id)}" aria-label="${t.status==='done'?'Reabrir':'Concluir'}: ${esc(t.title)}" aria-pressed="${t.status==='done'}"><span class="checkbox">${t.status==='done'?icon('check'):t.status==='canceled'?icon('close'):t.status==='doing'?'<i></i>':''}</span></button>`}

function dragHandle(t){return page==='agenda'||page==='day'||archiveMode?'':`<button class="drag-handle" data-drag-handle data-id="${esc(t.id)}" aria-label="Mover: ${esc(t.title)}" title="Segure para arrastar. Pelo teclado, use as setas.">${icon('grip')}<span class="sr-only">Mover</span></button>`}
function compactDue(t){
  if(!t.date)return '<span class="no-date">Sem data</span>';
  const {overdue,invalidTime}=deadlines.forItem(t),sameYear=t.date.slice(0,4)===today().slice(0,4);
  const label=t.date===today()?'Hoje':dateLabel(t.date,{day:'2-digit',month:'2-digit',...(sameYear?{}:{year:'numeric'})});
  return `<time class="due-date ${overdue?'late':''}" datetime="${t.date}${t.time?'T'+t.time:''}" title="${esc(t.date+(t.time?' '+t.time:''))}">${overdue?'Atrasado · ':''}${icon('calendar')}${label}${t.time?` <span>${icon('clock')}${esc(t.time)}</span>`:''}${invalidTime?'<small>Confira o fuso</small>':''}</time>`;
}
function itemAttributes(t){return `data-drag-item="${esc(t.id)}" data-parent-id="${esc(t.parentId)}" ${t.parentId?'':'data-root-item'} data-drag-label="${esc(t.title)}" ${taskAppearance(t,state.areas)}`}
function parentContext(t){
  const parent=t.parentId&&state.items[t.parentId];
  return parent&&(archiveMode||timelineView()||page==='day')?`<p class="parent-link">Subitem de ${esc(parent.title)}</p>`:'';
}
function subitemFooter(t){
  if(t.parentId||archiveMode||timelineView()||page==='day')return '';
  const children=childrenOf(t.id);if(!children.length)return '';const done=children.filter(x=>x.status==='done').length,open=page==='plan'&&isExpanded(t),panelId='subitems-'+t.id;
  const bar=`<div class="subitems-bar"><button type="button" class="subitems-toggle" data-action="${page==='agenda'?'reveal-parent':'expand-item'}" data-id="${esc(t.id)}" aria-expanded="${open}" ${page==='plan'?`aria-controls="${esc(panelId)}"`:''} aria-label="${open?'Recolher':'Expandir'} subitens de ${esc(t.title)}">${icon('right')}<span>${children.length} ${children.length===1?'subitem':'subitens'}</span><span class="subitems-progress" aria-label="${done} de ${children.length} subitens concluídos">${done}/${children.length}</span></button></div>`;

  if(page!=='plan')return bar;
  if(!open)return bar+`<div id="${esc(panelId)}" hidden></div>`;
  const matching=filtersActive()?selectItems(children,filterOptions()):children,ordered=selectItems(matching,{order:subitemOrder}),{visible,remaining,step}=collections.take('subitems-'+t.id,ordered);
  return bar+`<section id="${esc(panelId)}" class="subitems-panel" data-drop-parent="${esc(t.id)}" aria-label="Subitens de ${esc(t.title)}"><div class="subitems-heading"><span>${filtersActive()?matching.length+' de '+children.length+' '+(children.length===1?'subitem':'subitens')+' nos filtros':'Pequenas etapas'}</span><div class="subitems-order-field"><label class="sr-only" for="suborder-${esc(t.id)}">Ordenar subitens de ${esc(t.title)}</label><select id="suborder-${esc(t.id)}" class="subitem-order"><option value="manual" ${subitemOrder==='manual'?'selected':''}>Minha ordem</option><option value="priority" ${subitemOrder==='priority'?'selected':''}>Prioridade</option><option value="date" ${subitemOrder==='date'?'selected':''}>Data</option></select></div></div>${visible.length?`<div class="subitems-list">${visible.map(compactTask).join('')}</div>`:`<p class="subitems-empty">${children.length?'Nenhum subitem corresponde aos filtros.':'Adicione etapas para acompanhar este item.'}</p>`}${remaining?`<div class="collection-more"><p>${visible.length} de ${matching.length} subitens nesta lista</p><button class="btn secondary" data-action="show-more" data-collection="subitems-${esc(t.id)}">Mostrar mais ${step}</button></div>`:''}</section>`;
}
function taskView(t,detailed=false){const a=state.areas[t.areaId];return `<article class="${detailed?'task':'compact-task'} task-content priority-${t.priority} ${t.parentId?'subitem-row':''} ${!openItem(t)?'closed':''} ${workflowUI?.isSelected(t.id)?'is-selected':''}" ${itemAttributes(t)}>${parentContext(t)}<div class="task-head">${completion(t)}<h3 class="task-title">${esc(t.title)}</h3>${manageButton(t)}</div><div class="task-information">${workflowUI?.quickField(t,'deadline',compactDue(t))||compactDue(t)}${areaIndicator(a,esc)}</div>${detailed&&t.notes?`<p class="task-note">${esc(t.notes)}</p>`:''}<div class="task-tags">${workflowUI?.quickField(t,'priority',priorityIndicator(t.priority))||priorityIndicator(t.priority)}${workflowUI?.quickField(t,'status',`<span>${esc(statusLabel[t.status])}</span>`)||`<span class="task-status-label">${esc(statusLabel[t.status])}</span>`}${archiveButton(t)}${dragHandle(t)}</div>${subitemFooter(t)}</article>`}
function compactTask(t){return taskView(t)}
function taskCard(t){return taskView(t,true)}
function listColumns(){return '<div class="list-columns" aria-hidden="true"><span>Tarefa</span><span>Prazo</span><span>Área</span><span>Prioridade</span><span>Andamento</span></div>'}
function itemCollection(items,key='all'){const {visible,remaining,step}=collections.take(key,items);return (layout==='compact'?`<div class="compact-list">${listColumns()}${visible.map(compactTask).join('')}</div>`:`<div class="card-list">${visible.map(taskCard).join('')}</div>`)+(remaining?`<div class="collection-more"><p>${visible.length} de ${items.length} itens nesta lista</p><button class="btn secondary" data-action="show-more" data-collection="${esc(key)}">Mostrar mais ${step} ${step===1?'item':'itens'}</button></div>`:'')}

function empty(title,text,label,action,example=false){return `<div class="empty"><span class="emptyicon">${icon('list')}</span><h2>${title}</h2><p>${text}</p><button class="btn primary" data-action="${action}">${icon(action==='new'?'plus':'settings')}${label}</button>${example?'<button class="textbtn example" data-action="example">Ver com exemplos fictícios</button>':''}</div>`}
const groupLabels={overdue:'Atrasados',today:'Hoje',upcoming:'Próximos',undated:'Sem data',closed:'Encerrados'};
function renderAgenda(){const items=filtered(),groups=groupItems(items,today(),isTaskOverdue);return `${pageHeading(archiveMode?'Arquivadas':'Cronograma',archiveMode?'Tarefas arquivadas organizadas por prazo.':'Itens organizados por prazo.')}${planningUI?.summary()||''}${areaTabs()}${controls()}${archiveToolbar()}${workflowUI?.toolbar()||''}${orderToolbar()}<div id="task-results" class="results layout-${layout}" aria-live="polite">${renderTimeline(groups)}</div>`}
function renderTimeline(groups=groupItems(filtered(),today(),isTaskOverdue)){collections.begin();if(!Object.values(groups).some(v=>v.length))return empty('Nenhum item neste cronograma.','Adicione um item ou ajuste os filtros para consultar outros prazos.','Limpar filtros','clear');return Object.entries(groups).filter(([,items])=>items.length).map(([k,items])=>`<section class="timeline-section" aria-label="${groupLabels[k]}"><div class="timeline-heading ${k==='overdue'?'late':''}">${icon(k==='undated'?'box':k==='closed'?'check':'calendar')}<h2>${groupLabels[k]}</h2><span class="section-count mono">${items.length}</span></div>${itemCollection(selectItems(items,{order:sortOrder}),'timeline-'+k)}</section>`).join('')}
function renderAreas(){return `${pageHeading('Áreas','Organize nomes, cores e posições.')}<div class="between" style="margin-bottom:20px"><button class="textbtn" data-action="page" data-page="plan">${icon('left')} Voltar ao planejamento</button><button class="btn primary" data-action="new-area">${icon('plus')} Nova área</button></div><div class="areagrid">${activeAreas(state).map(a=>`<article class="areacard" data-drag-area="${esc(a.id)}" data-drag-label="${esc(a.name)}"><div class="between"><div class="areaicon" ${areaStyle(a)}>${icon('box')}</div><button class="iconbtn" data-action="edit-area" data-id="${esc(a.id)}" aria-label="Editar área ${esc(a.name)}">${icon('edit')}</button></div><h3>${esc(a.name)}</h3><p>${openSummary(visibleItems(state).filter(t=>t.areaId===a.id))}</p><div class="areaactions"><button class="drag-handle" data-drag-handle aria-label="Arrastar área ${esc(a.name)}">${icon('grip')}</button><button data-action="move-area" data-id="${esc(a.id)}" data-delta="-1" aria-label="Mover ${esc(a.name)} para antes">${icon('up')}</button><button data-action="move-area" data-id="${esc(a.id)}" data-delta="1" aria-label="Mover ${esc(a.name)} para depois">${icon('down')}</button><button data-action="area" data-id="${esc(a.id)}">Abrir área ${icon('arrow')}</button></div></article>`).join('')}</div>`}
function installSection(){const info=installation.snapshot();return `<section id="retomar-install-section" class="settingscard install-section" ${info.hidden?'hidden':''} aria-labelledby="install-heading"><h2 id="install-heading">Instalar Retomar</h2><p id="install-status" role="status" aria-live="polite">${esc(info.message)}</p><button id="install-app-button" class="btn primary" data-action="install" aria-describedby="install-status" ${info.enabled?'':'disabled'}>${icon('download')}<span data-install-label>${esc(info.label)}</span></button><p class="field-help">Sem o botão habilitado, use o menu do Chrome → Adicionar à tela inicial → Instalar. No iPhone ou iPad, use Compartilhar → Adicionar à Tela de Início no Safari.</p></section>`;}
function updateInstallControls(){const section=document.querySelector('#retomar-install-section');if(!section)return;const info=installation.snapshot();section.hidden=info.hidden;document.querySelector('#install-status').textContent=info.message;const button=document.querySelector('#install-app-button');button.disabled=!info.enabled;button.querySelector('[data-install-label]').textContent=info.label;}
function backupSection(){return `<div class="settings-backup"><h3>Cópia de segurança neste aparelho</h3><p>Baixe uma cópia ou restaure um planejamento.</p><div class="settings-buttons"><button class="btn secondary" data-action="export">${icon('download')} Baixar backup</button><button class="btn secondary" data-action="import">${icon('upload')} Restaurar backup</button></div><input hidden type="file" id="backup-file" accept="application/json,.json"><details class="settings-details"><summary>Onde meus dados ficam?</summary><p>Os itens são salvos neste navegador. A conexão com o GitHub mantém uma cópia criptografada para sincronizar entre aparelhos. O JSON baixado contém os dados legíveis e não inclui credenciais.</p></details></div>`}
function renderSettings(){return `${pageHeading('Configurações','Preferências e dados do aplicativo.')}<div class="settings-stack"><section class="settingscard"><div class="settings-heading"><span class="settings-icon">${icon('appearance')}</span><div><h2>Aparência</h2><p>Escolha como o Retomar aparece neste aparelho.</p></div></div><div class="settings-fields"><div class="field"><label for="accent">Cor de destaque</label><select id="accent">${[['teal','Turquesa'],['blue','Azul vivo'],['purple','Violeta'],['wine','Rosa'],['green','Verde'],['ochre','Dourado'],['coral','Coral'],['cyan','Ciano'],['indigo','Índigo'],['fuchsia','Fúcsia'],['orange','Laranja'],['lime','Lima']].map(([v,l])=>`<option value="${v}" ${(ui.accent||'teal')===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label for="motion">Movimento</label><select id="motion"><option value="subtle" ${ui.motion!=='off'?'selected':''}>Suave</option><option value="off" ${ui.motion==='off'?'selected':''}>Desativado</option></select></div></div><p class="field-help">Alterações salvas automaticamente neste aparelho. A preferência de movimento reduzido do sistema é respeitada.</p></section>${planningUI?.settings()||''}${calendarUI?.settings()||''}${syncUI?.card(backupSection())||''}<section class="settingscard"><div class="settings-heading"><span class="settings-icon">${icon('grid')}</span><div><h2>Áreas</h2><p>Edite os nomes, as cores e a ordem das suas áreas.</p></div></div><button class="btn secondary" data-action="areas">Organizar áreas ${icon('arrow')}</button></section><section class="settingscard"><div class="settings-heading"><span class="settings-icon">${icon('device')}</span><div><h2>Ajuda</h2><p>Orientações de uso.</p></div></div><details class="settings-details"><summary>Como organizar meus itens?</summary><p>Em Planejamento, escolha o agrupamento por área, por prioridade ou sem grupos. Alterne entre Lista compacta e Cartões. Toque no prazo, na prioridade ou no andamento para alterar rapidamente. Use Selecionar para ações em lote e Visualizações para salvar filtros neste aparelho. Desfazer reverte a última alteração desta sessão, se os registros não tiverem mudado depois. Use Gerenciar para editar, mover, arquivar ou configurar notificações. Os seis pontos servem somente para arrastar. Em Arquivadas, restaure tarefas quando quiser. Arquivar um item também oculta seus subitens; restaurá-lo preserva os subitens arquivados individualmente. No agrupamento por prioridade, arraste entre os grupos para mudar a prioridade. Pelo teclado, use as setas na alça ou Alt + setas nas áreas. Crie etapas em Gerenciar → Adicionar subitem. Toque no contador de subitens para expandir as etapas. Prioridade, andamento e datas são alterados em Gerenciar. A lista de etapas pode usar sua ordem manual, prioridade ou data. Concluir o item principal não conclui os subitens automaticamente.</p></details><details class="settings-details"><summary>Como voltar à tela anterior?</summary><p>Use o gesto ou botão de voltar do Android, ou o voltar do navegador. Uma janela aberta é fechada primeiro; depois, você retorna à tela anterior. Se houver texto alterado no formulário, o app pede confirmação antes de descartar.</p></details></section>${installSection()}</div><p class="version">Retomar · Versão ${VERSION}</p>`}
function bindApp(){
  if(page==='settings')document.querySelectorAll('.settings-stack>.settingscard').forEach(card=>{
    const title=card.querySelector('h2')?.textContent;if(!title)return;
    const details=document.createElement('details'),summary=document.createElement('summary');
    details.className='settings-category';summary.textContent=title;details.append(summary);
    const heading=card.querySelector('.settings-heading');
    const status=heading?.querySelector('[role="status"]');
    if(status){status.classList.add('settings-status');details.append(status)}
    const indicator=heading?.querySelector('[data-sync-indicator]');if(indicator)summary.append(indicator);
    if(heading)heading.remove();
    while(card.firstChild)details.append(card.firstChild);card.append(details);
  });
  const areaSelect=document.querySelector('#area-filter');if(areaSelect)areaSelect.onchange=async e=>{await action('area',{id:e.target.value});document.querySelector('#area-filter')?.focus({preventScroll:true})};
  document.querySelector('#app').onclick=async e=>{const b=e.target.closest('[data-action]');if(!b)return;const previous=page+'|'+area;await action(b.dataset.action,b.dataset);if(previous!==page+'|'+area&&!document.querySelector('dialog[open]'))enterView()};
  const search=document.querySelector('#search-input');if(search)search.oninput=e=>{query=e.target.value;collapsedMatches.clear();collections.reset();refreshResults()};
  bindDrag(document.querySelector('#app'),{onDrop:applyDrop,onMove:moveByDelta,onAnnounce:announceMove});
  const accent=document.querySelector('#accent');if(accent)accent.onchange=e=>{ui.accent=e.target.value;document.documentElement.dataset.accent=ui.accent;saveUI()};
  const motion=document.querySelector('#motion');if(motion)motion.onchange=e=>{ui.motion=e.target.value;syncVisualMotion();saveUI()};
  document.querySelectorAll('.subitem-order').forEach(el=>el.onchange=e=>{const id=e.target.id;subitemOrder=e.target.value;ui.subitemOrder=subitemOrder;saveUI();collections.reset();refreshResults();document.getElementById(id)?.focus()});
  for(const [id,key] of [['day-status','dayStatus'],['day-priority','priorityFilter']]){const field=document.getElementById(id);if(field)field.onchange=e=>{if(key==='priorityFilter')priorityFilter=e.target.value;else{ui.dayStatus=e.target.value;saveUI();}render();};}
  const calendarDate=document.querySelector('#calendar-date');if(calendarDate)calendarDate.onchange=e=>calendarUI.action('calendar-date',{value:e.target.value});
  const calendarSpan=document.querySelector('#calendar-span');if(calendarSpan)calendarSpan.onchange=e=>calendarUI.action('calendar-span',{value:e.target.value});
  const file=document.querySelector('#backup-file');if(file)file.onchange=importFile;
}
function refreshResults(){if(page==='day'){render();return;}beginView();workflowUI?.reconcile();const workflowTools=document.querySelector('#workflow-toolbar');if(workflowTools)workflowTools.outerHTML=workflowUI.toolbar();updateFilterIndicator(document.querySelector('.filter-toggle'),[status!=='all',scope!=='all',priorityFilter!=='all'].filter(Boolean).length);navigation?.record();indexChildren();const summary=document.querySelector('#results-summary');if(summary)summary.outerHTML=orderToolbar();const selection=document.querySelector('#view-selection');if(selection)selection.outerHTML=viewSelection();const archiveTools=document.querySelector('#archive-toolbar');if(archiveTools)archiveTools.outerHTML=archiveToolbar();const results=document.querySelector('#task-results');const changed=updateMarkup(results,page==='agenda'?renderTimeline():planningResults());if(changed)bindApp();navigation?.record();syncVisualMotion()}
async function action(name,d={}){
  if(name==='day-layout'){if(['compact','cards'].includes(d.layout)){ui.dayLayout=d.layout;saveUI();render();}return;}
  if(name==='day-clear'){area='all';query='';priorityFilter='all';ui.dayStatus='open';saveUI();render();return;}
  if(name.startsWith('calendar-')){await calendarUI.action(name,d);return;}

  if(name.startsWith('workflow-')){if(fatal&&name!=='workflow-views'){toast('Recupere os dados antes de editar.');return;}try{await workflowUI.action(name,d)}catch(e){toast(e.message)}return;}
  if(name==='home'){
    if(document.querySelector('dialog[open]')&&!closeModal())return;
    await action('page',{page:'plan'});return;
  }
  if(name.startsWith('planning-')){await planningUI.action(name,d);return}
  if(['page','area','areas','status','scope','undated','clear','priority-filter'].includes(name)){collections.reset();collapsedMatches.clear();}
  if(name==='active-view'){await action('archive-view',{mode:'active'});return}
  if(name==='archive-view'){if(!['plan','agenda'].includes(page))page='plan';archiveMode=d.mode==='archived';status='all';scope='all';query='';priorityFilter='all';collections.reset();render();return}
  if(name==='archive-item'||name==='restore-item'){await archiveTask(d.id,name==='archive-item');return}
  if(name==='archive-completed'){await archiveCompleted();return}
  if(name==='show-more'){const before=[...document.querySelectorAll('[data-drag-item]')].map(el=>el.dataset.dragItem);collections.more(d.collection);refreshResults();[...document.querySelectorAll('[data-drag-item]')].find(el=>!before.includes(el.dataset.dragItem))?.querySelector('.manage-task')?.focus();return}
  if(name==='expand-item'){const t=state.items[d.id];if(!t||t.deleted||t.parentId)return;if(isExpanded(t)){expandedItems.delete(d.id);collapsedMatches.add(d.id)}else{expandedItems.add(d.id);collapsedMatches.delete(d.id)}persistExpanded();refreshResults();document.querySelector(`[data-action="expand-item"][data-id="${CSS.escape(d.id)}"]`)?.focus();return}
  if(name==='reveal-parent'){const t=state.items[d.id];if(!t||t.deleted)return;page='plan';archiveMode=isArchived(state,t);area=t.areaId;query='';scope='all';status='all';priorityFilter='all';collections.reset();expandedItems.add(t.id);persistExpanded();render();document.querySelector(`[data-action="expand-item"][data-id="${CSS.escape(t.id)}"]`)?.focus();return}
  if(name==='new-subitem'){if(fatal){toast('Recupere os dados em Configurações antes de editar.');return}itemModal(null,null,null,d.parentId);return}
  if(name==='sync')syncUI.open();
  else if(name==='move-item')moveModal(d.id);
  else if(name==='priority-filter'){priorityFilter=priorityFilter===d.priority?'all':d.priority;render()}
  else if(name==='page'){page=d.page==='agenda'?'plan':d.page;render();window.scrollTo(0,0)}
  else if(name==='area'){area=d.id;if(!['plan','agenda','day'].includes(page))page='plan';render()}
  else if(name==='areas'){page='areas';render();window.scrollTo(0,0)}
  else if(name==='status'){status=d.status;render()}
  else if(name==='scope'){page='plan';scope=d.scope;status='open';render()}
  else if(name==='undated'){page='plan';scope='undated';status='open';area='all';query='';render()}
  else if(name==='ordering'||name==='filters')openViewOptions(name)
  else if(name==='clear'){status='all';scope='all';priorityFilter='all';query='';render()}
  else if(name==='new'||name==='edit'){if(fatal){toast('Recupere os dados em Configurações antes de editar.');return}itemModal(name==='edit'?d.id:null,d.areaId??(page==='day'&&area!=='all'?area:undefined),d.priority,undefined,page==='day'?calendarUI.snapshot().calendarDate:'')}
  else if(name==='toggle'){if(fatal)return;await mutate(s=>{const t=s.items[d.id];if(!t||t.deleted)throw Error('Este item não está mais disponível.');updateItem(s,t.id,{status:t.status==='done'?'pending':'done'},deviceId)},'Alteração salva neste aparelho.')}
  else if(name==='new-area'||name==='edit-area'){if(fatal){toast('Recupere os dados antes de editar.');return}areaModal(d.id)}
  else if(name==='move-area'){await mutate(s=>{const list=activeAreas(s),i=list.findIndex(a=>a.id===d.id),j=i+Number(d.delta);if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];list.forEach((a,k)=>{if(a.order!==k){a.order=k;a.revision=stamp(s,deviceId)}})})}
  else if(name==='export')exportBackup();
  else if(name==='raw'){if(repo.raw)download(repo.raw,'retomar-recuperacao-'+today()+'.txt','text/plain');else toast('Não há uma cópia corrompida disponível para baixar.')}
  else if(name==='import')document.querySelector('#backup-file').click();
  else if(name==='example')exampleModal();
  else if(name==='install')await installation.install();
}
async function archiveTask(id,archived,expectedRevision){
  if(fatal)return false;const t=state.items[id];if(!t||t.deleted)return false;
  if(archived&&!t.parentId&&subitemsOf(state,id).length&&!confirm('Arquivar este item também retira seus subitens da vista e dos lembretes. Continuar?'))return false;
  const ok=await mutate(s=>setArchived(s,id,archived,deviceId,expectedRevision||JSON.stringify(t.revision)));
  if(ok){showUndo(archived?'Tarefa arquivada.':'Tarefa restaurada.');restoreUIFocus(returnFocus)}return ok;
}
async function archiveCompleted(){
  if(fatal)return;const tasks=completedToArchive(state,selectItems(areaItems(),filterOptions()));
  if(!tasks.length)return;
  if(!confirm(`Arquivar ${tasks.length} tarefa(s) concluída(s) destes filtros? Itens com subitens ainda em aberto serão preservados. Você poderá restaurar depois.`))return;
  const ok=await mutate(s=>{const eligible=new Set(completedToArchive(s).map(t=>t.id));for(const t of tasks){if(!eligible.has(t.id))throw Error('As tarefas mudaram. Confira a lista antes de arquivar.');setArchived(s,t.id,true,deviceId,JSON.stringify(t.revision));}});
  if(ok)showUndo('Concluídas arquivadas.');
}
function announceMove(message){document.querySelector('#drag-announcement').textContent=message}
function manualOrder(subitem=false){if(subitem){subitemOrder='manual';ui.subitemOrder='manual'}else{sortOrder='manual';ui.order='manual'}saveUI()}
function nextId(list,targetId,position){const at=list.findIndex(x=>x.id===targetId);return position==='before'?targetId:list[at+1]?.id||null}
async function applyDrop({type,id,target}){
  if(fatal||!target)return;
  let destinationParent='';
  const ok=await mutate(s=>{
    if(type==='area'){const list=activeAreas(s).filter(a=>a.id!==id);reorderAreas(s,id,nextId(list,target.id,target.position),deviceId);return}
    const moving=s.items[id];if(!moving||moving.deleted)throw Error('O item não está mais disponível.');
    let areaId=moving.areaId,priority=moving.priority,parentId=moving.parentId,beforeId=null;
    if(target.type==='area'){areaId=target.id;parentId=''}
    else if(target.type==='priority')priority=target.id;
    else if(target.type==='parent'){parentId=target.id;areaId=s.items[parentId]?.areaId}
    else {
      const other=s.items[target.id];if(!other||other.deleted)throw Error('O destino não está mais disponível.');
      parentId=other.parentId;
      if(parentId)areaId=other.areaId;else if(priorityView())priority=other.priority;else if(groupBy==='area')areaId=other.areaId;
      const list=selectItems(visibleItems(s).filter(t=>t.id!==id&&t.parentId===parentId&&(parentId?true:priorityView()?t.priority===priority:groupBy==='area'?t.areaId===areaId:true)),{order:'manual'});
      beforeId=nextId(list,other.id,target.position);
    }
    moveItem(s,id,{areaId,parentId,priority,beforeId},deviceId);destinationParent=parentId;
  },type==='area'?'Ordem das áreas salva.':'Organização salva.');
  if(ok){manualOrder(!!destinationParent);if(destinationParent){expandedItems.add(destinationParent);persistExpanded()}render();announceMove(type==='area'?'Área movida.':'Item movido.');}
}
async function moveByDelta({type,id,delta}){
  const moving=state.items[id];manualOrder(type!=='area'&&!!moving?.parentId);
  const ok=await mutate(s=>{
    const list=type==='area'?activeAreas(s):selectMovePeers(s,id,{...filterOptions(),area,groupBy,priorityBoard:priorityView()});
    const index=list.findIndex(x=>x.id===id),to=index+delta;if(index<0||to<0||to>=list.length)return;
    const rest=list.filter(x=>x.id!==id),beforeId=rest[to]?.id||null;if(type==='area')reorderAreas(s,id,beforeId,deviceId);else moveItem(s,id,{beforeId},deviceId);
  });
  if(ok){announceMove('Ordem atualizada.');const nodes=[...document.querySelectorAll(type==='area'?`[data-drag-area="${CSS.escape(id)}"]`:`[data-drag-item="${CSS.escape(id)}"] > .task-tags [data-drag-handle]`)];nodes.find(n=>n.getClientRects().length)?.focus()}
}
function moveModal(id){
  const t=state.items[id];if(!t||t.deleted)return;
  const revision=JSON.stringify(t.revision),hasChildren=subitemsOf(state,id).length>0;
  const root=openModal(t.parentId?'Organizar subitem':'Organizar item',`<form id="move-item-form"><div class="formerror" role="alert"></div><p class="confirmtext">${esc(t.title)}</p><div class="field"><label for="move-area">Área</label><select data-full-value id="move-area">${taskAreas().map(a=>`<option value="${esc(a.id)}" ${a.id===t.areaId?'selected':''}>${esc(a.name)}</option>`).join('')}</select></div><div class="field"><label for="move-parent">Item principal</label><select data-full-value id="move-parent" ${hasChildren?'disabled':''}></select><small class="field-help">${hasChildren?'Este item já tem subitens. Ao mudar a área, eles acompanham o item.':'Escolha um item para aninhar ou deixe sem vínculo para usar como item principal.'}</small></div><div class="field"><label for="move-priority">Prioridade</label><select id="move-priority">${PRIORITIES.map(p=>`<option value="${p.id}" ${p.id===t.priority?'selected':''}>${p.symbol} ${p.label}</option>`).join('')}</select></div><div class="field"><label for="move-position">Posição</label><select data-full-value id="move-position"></select></div><p class="small muted">Segure a alça de pontos para arrastar. Na alça, use as setas do teclado para mover dentro da lista.</p><div class="dialogactions"><button type="button" class="btn secondary" id="cancel-move">Cancelar</button><button class="btn primary" type="submit">Salvar organização</button></div></form>`);
  const areaField=root.querySelector('#move-area'),parentField=root.querySelector('#move-parent'),position=root.querySelector('#move-position');
  const positions=(initial=false)=>{
    const all=selectItems(visibleItems(state).filter(x=>x.areaId===areaField.value&&x.parentId===parentField.value),{order:'manual'}),index=all.findIndex(x=>x.id===id),siblings=all.filter(x=>x.id!==id);
    const before=initial&&index>=0?all[index+1]?.id||'':'';
    position.innerHTML='<option value="">No final</option>'+siblings.map(x=>`<option value="${esc(x.id)}" ${x.id===before?'selected':''}>Antes de: ${esc(x.title)}</option>`).join('');refreshSelectHint(position);
  };
  const parents=(selected='')=>{parentField.innerHTML='<option value="">Sem vínculo · item principal</option>'+(hasChildren?'':visibleItems(state).filter(x=>!x.parentId&&x.id!==id&&x.areaId===areaField.value).map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.title)}</option>`).join(''));refreshSelectHint(parentField);};
  parents(t.parentId);positions(true);areaField.onchange=()=>{parents();positions()};parentField.onchange=()=>positions();
  root.querySelector('#cancel-move').onclick=()=>closeModal();
  root.querySelector('form').onsubmit=submitOnce(async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;const areaId=areaField.value,parentId=parentField.value,priority=root.querySelector('#move-priority').value,beforeId=position.value||null;const ok=await mutate(s=>moveItem(s,id,{areaId,parentId,priority,beforeId,expectedRevision:revision},deviceId),'Organização salva.');if(ok){manualOrder(!!parentId);if(parentId){expandedItems.add(parentId);persistExpanded()}render();closeModal(true)}else button.disabled=false});
}

function openModal(title,body,{id='',className=''}={}){returnFocus=document.activeElement;modalDirty=false;const root=document.querySelector('#dialog-root');root.innerHTML=`<dialog ${id?`id="${esc(id)}"`: ''} ${className?`class="${esc(className)}"`: ''} role="dialog" aria-labelledby="modal-title"><div class="dialoghead"><button type="button" class="iconbtn" id="modal-home" aria-label="Voltar ao planejamento">${icon('resume')}</button><h2 id="modal-title" tabindex="-1">${title}</h2><button class="iconbtn" id="close-modal" aria-label="Fechar formulário">${icon('close')}</button></div><div class="dialogbody">${body}</div></dialog>`;const dialog=root.querySelector('dialog');root.querySelectorAll('form').forEach(bindFormErrors);const initialField=dialog.querySelector('[autofocus]');if(initialField&&window.matchMedia('(pointer: coarse)').matches)initialField.removeAttribute('autofocus');
  if(!dialog.querySelector('[autofocus]'))root.querySelector('#modal-title').setAttribute('autofocus','');
  dialog.showModal();root.querySelector('#modal-home').onclick=()=>action('home');navigation?.modalOpened();root.querySelectorAll('select[data-full-value]').forEach(bindSelectHint);root.querySelector('#close-modal').onclick=()=>closeModal();dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal()});dialog.addEventListener('input',()=>modalDirty=true);dialog.addEventListener('change',()=>modalDirty=true);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});syncVisualMotion();return root}
function canCloseModal(){return !modalDirty||confirm('Descartar as alterações deste formulário?')}
function closeModal(force=false,fromHistory=false){if(!force&&!canCloseModal())return false;const dialog=document.querySelector('dialog');if(!dialog)return true;dialog.close();document.querySelectorAll('.is-editing').forEach(el=>el.classList.remove('is-editing'));document.querySelector('#dialog-root').innerHTML='';modalDirty=false;if(!fromHistory)navigation?.modalClosed();restoreUIFocus(returnFocus);syncVisualMotion();syncUI?.cancelConnection();syncUI?.resume();calendarUI?.resume();return true}
function itemModal(id,defaultArea,defaultPriority,defaultParent,defaultDate=''){
  const existing=id?state.items[id]:null;if(id&&(!existing||existing.deleted)){toast('Este item não está disponível.');return}
  const parentId=existing?.parentId||defaultParent||'',parent=parentId?state.items[parentId]:null;
  if(parentId&&(!parent||parent.deleted||parent.parentId)){toast('O item principal não está mais disponível.');return}
  const t=existing||{parentId,title:'',notes:'',date:validDate(defaultDate)?defaultDate:'',time:'',areaId:parent?.areaId??(defaultArea!==undefined?defaultArea:state.areas[ui.lastTaskArea]&&!state.areas[ui.lastTaskArea].deleted?ui.lastTaskArea:''),status:'pending',priority:defaultPriority||'normal'},revision=existing?JSON.stringify(existing.revision):null;
  const root=openModal(id?(parentId?'Gerenciar subitem':'Gerenciar tarefa'):(parentId?'Adicionar subitem':'Adicionar tarefa'),`<form id="item-form"><div class="formerror" role="alert"></div><input type="hidden" name="parentId" value="${esc(parentId)}">${parent?`<p class="subitem-context">Subitem de <strong>${esc(parent.title)}</strong></p><input type="hidden" name="areaId" value="${esc(parent.areaId)}">`:''}<div class="field"><label for="item-title">Título da tarefa</label><textarea id="item-title" class="short-text" name="title" rows="2" maxlength="200" required ${id?'':'autofocus'} autocomplete="off" placeholder="Ex.: revisar o projeto"></textarea></div><div class="fieldsrow"><div class="field"><label for="item-area"><i id="area-swatch" class="color-swatch"></i> Área</label><select id="item-area" data-full-value name="areaId" ${parent?'disabled aria-describedby="subitem-area-help"':''}>${taskAreas().map(a=>`<option value="${esc(a.id)}" ${t.areaId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select>${parent?'<small id="subitem-area-help" class="field-help">Acompanha a área da tarefa principal.</small>':''}</div><div class="field"><label for="item-priority"><i id="priority-swatch" class="color-swatch"></i> Prioridade</label><select name="priority" id="item-priority">${PRIORITIES.map(p=>`<option value="${p.id}" ${t.priority===p.id?'selected':''}>${p.symbol} ${p.label}</option>`).join('')}</select></div></div><div class="field"><label for="item-status">Andamento</label><select id="item-status" name="status">${Object.entries(statusLabel).map(([k,l])=>`<option value="${k}" ${t.status===k?'selected':''}>${l}</option>`).join('')}</select></div><fieldset class="editor-deadline"><legend>Prazo</legend><div class="fieldsrow"><div class="field"><label for="item-date">Data <span class="muted" id="item-date-optional">· opcional</span></label><input type="date" id="item-date" name="date" min="1900-01-01" max="2200-12-31" value="${esc(t.date)}"></div><div class="field"><label for="item-time">Horário <span class="muted">· opcional</span></label><input type="time" id="item-time" name="time" step="60" value="${esc(t.time)}" aria-describedby="item-time-help"></div></div><small class="field-help" id="item-time-help" aria-live="polite"></small><button type="button" class="textbtn" id="clear-date">Remover data e horário</button></fieldset><details class="editor-section" ${t.notes?'open':''}><summary>Observações${t.notes?' · preenchidas':''}</summary><div class="field"><label for="item-notes">Detalhes e próximos passos <span class="muted">· opcional</span></label><textarea id="item-notes" name="notes" maxlength="5000" placeholder="Detalhes, links ou próximos passos"></textarea></div></details><details class="editor-section"><summary>Aparência do cartão</summary><label class="planning-check"><input type="checkbox" id="item-auto-color" ${t.color?'':'checked'}><span>Usar a cor da área</span></label><div class="field"><label for="item-color">Cor personalizada</label><input type="color" id="item-color" value="${t.color||state.areas[t.areaId]?.color||'#ffffff'}"></div></details>${id?`<details class="editor-section"><summary>Notificações e lembretes</summary>${planningUI.itemPushSummary(t)}<p class="field-help">Mudanças no prazo serão consideradas depois de salvar a tarefa. Os ajustes de aviso valem neste aparelho.</p><div class="editor-action-list"><button type="button" class="editor-action" id="notify-item">${icon('bell')}<span><strong>Configurar notificações</strong><small>Antecedência e silenciamento desta tarefa</small></span>${icon('right')}</button>${page==='reminders'?`<button type="button" class="editor-action" id="task-snooze">${icon('clock')}<span><strong>Adiar lembrete</strong><small>Usar o intervalo escolhido na central</small></span>${icon('right')}</button><button type="button" class="editor-action" id="task-dismiss">${icon('bell')}<span><strong>Ocultar lembrete até amanhã</strong><small>A tarefa continua no planejamento</small></span>${icon('right')}</button>`:''}</div></details><details class="editor-section"><summary>Organizar tarefa</summary><div class="editor-action-list">${!t.parentId&&!isArchived(state,t)?`<button type="button" class="editor-action" id="add-child">${icon('plus')}<span><strong>Adicionar subitem</strong><small>Dividir esta tarefa em etapas</small></span>${icon('right')}</button>`:''}${!isArchived(state,t)?`<button type="button" class="editor-action" id="organize-item">${icon('arrow')}<span><strong>Mover ou vincular tarefa</strong><small>Escolher área, posição ou tarefa principal</small></span>${icon('right')}</button>`:''}<button type="button" class="editor-action" id="archive-item">${icon(isArchived(state,t)?'resume':'archive')}<span><strong>${isArchived(state,t)?'Restaurar tarefa':'Arquivar tarefa'}</strong><small>${isArchived(state,t)?'Voltar à lista de tarefas ativas':'Retirar da lista e dos avisos, sem excluir'}</small></span>${icon('right')}</button></div></details><details class="editor-section editor-danger"><summary>Excluir tarefa</summary><p class="field-help">${!t.parentId&&childrenOf(t.id).length?'A exclusão também inclui os subitens. ':''}Depois de excluir, use Desfazer enquanto esta for a última alteração da sessão.</p><button type="button" class="btn danger" id="delete-item">${icon('trash')} Excluir tarefa</button></details>`:''}<div class="dialogactions"><button type="button" class="btn secondary" id="cancel-item">Cancelar</button><button class="btn primary" type="submit">${id?'Salvar alterações':parentId?'Adicionar subitem':'Adicionar tarefa'}</button></div><p class="field-help save-note">Salvo neste aparelho, mesmo sem conexão.</p></form>`,{className:'item-editor'});
  if(id)for(const el of document.querySelectorAll(`[data-drag-item="${CSS.escape(id)}"]`))el.classList.add('is-editing');
  root.querySelector('#item-title').value=t.title;root.querySelector('#item-notes').value=t.notes;
  const form=root.querySelector('form'),dateInput=root.querySelector('#item-date'),timeInput=root.querySelector('#item-time');
  const areaField=root.querySelector('#item-area'),priorityField=root.querySelector('#item-priority');
  const paint=()=>{root.querySelector('#area-swatch').style.background=state.areas[areaField.value]?.color||'#ffffff';root.querySelector('#priority-swatch').className='color-swatch priority-'+priorityField.value;root.querySelector('#item-color').disabled=root.querySelector('#item-auto-color').checked};
  areaField.addEventListener('change',paint);priorityField.addEventListener('change',paint);root.querySelector('#item-auto-color').addEventListener('change',paint);paint();
  fitTextArea(root.querySelector('#item-title'));
  const schedule=bindItemSchedule({dateInput,timeInput,dateOptional:root.querySelector('#item-date-optional'),help:root.querySelector('#item-time-help'),clearButton:root.querySelector('#clear-date'),onClear:()=>{modalDirty=true}});
  root.querySelector('#cancel-item').onclick=()=>closeModal();
  root.querySelector('#add-child')?.addEventListener('click',()=>{if(closeModal())itemModal(null,null,null,id)});
  for(const [selector,actionName] of [['#task-snooze','planning-snooze'],['#task-dismiss','planning-dismiss']])root.querySelector(selector)?.addEventListener('click',()=>{if(closeModal())planningUI.action(actionName,{id})});
  root.querySelector('#archive-item')?.addEventListener('click',async()=>{if(!canCloseModal())return;const ok=await archiveTask(id,!isArchived(state,t),revision);if(ok)closeModal(true)});
  root.querySelector('#organize-item')?.addEventListener('click',()=>{if(closeModal())moveModal(id)});
  root.querySelector('#notify-item')?.addEventListener('click',()=>{if(closeModal())planningUI.action('planning-push-item',{id})});
  form.onsubmit=submitOnce(async e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(form));fields.title=fields.title.trim();fields.notes=(fields.notes||'').trim();fields.time=fields.time||'';fields.color=root.querySelector('#item-auto-color').checked?'':root.querySelector('#item-color').value;
    schedule.validate();if(!checkForm(form))return;if(revision)fields.expectedRevision=revision;
    const submit=form.querySelector('[type=submit]');submit.disabled=true;const ok=await mutate(s=>{if(fields.areaId!==''&&(!s.areas[fields.areaId]||s.areas[fields.areaId].deleted))throw Error('Esta área foi removida. Reabra o formulário e escolha outra área.');updateItem(s,id||uid(),fields,deviceId)},parentId?'Subitem salvo neste aparelho.':'Item salvo neste aparelho.');if(ok){if(!id&&!parentId){ui.lastTaskArea=fields.areaId;saveUI();if(area!=='all'&&area!==fields.areaId){area=fields.areaId;render()}}if(!id&&archiveMode){archiveMode=false;render()}if(parentId){expandedItems.add(parentId);collapsedMatches.delete(parentId);persistExpanded();render()}closeModal(true)}else submit.disabled=false;
  });
  root.querySelector('#delete-item')?.addEventListener('click',async()=>{if(!confirm(`Excluir “${t.title}”${!t.parentId&&childrenOf(t.id).length?' e seus subitens':''}? Você poderá desfazer enquanto esta for a última alteração da sessão.`))return;const ok=await mutate(s=>{const current=s.items[id];if(JSON.stringify(current?.revision)!==revision)throw Error('O item mudou em outra janela. Reabra antes de excluir.');deleteItem(s,id,deviceId)});if(ok){closeModal(true);showUndo('Item excluído.')}});
}
function areaModal(id){const a=id?state.areas[id]:null;let color=a?.color||COLORS[activeAreas(state).length%COLORS.length];const revision=a?JSON.stringify(a.revision):null;const root=openModal(a?'Editar área':'Nova área',`<form id="area-form"><div class="formerror" role="alert"></div><div class="field"><label for="area-name">Nome da área</label><textarea id="area-name" class="short-text" rows="2" name="name" maxlength="60" required autofocus placeholder="Ex.: Projetos pessoais">${esc(a?.name||'')}</textarea></div><div class="field"><label>Cor de identificação</label><div class="colors" role="group" aria-label="Cor da área">${COLORS.map((c,i)=>`<button type="button" class="colorchoice ${color===c?'chosen':''}" style="--area-color:${c}" data-color="${c}" aria-label="${PALETTE[i][1]}" aria-pressed="${color===c}"></button>`).join('')}</div></div><div class="dialogactions">${a?`<button class="btn danger delete" type="button" id="remove-area" aria-label="Excluir área">${icon('trash')}</button>`:''}<button class="btn secondary" type="button" id="cancel-area">Cancelar</button><button class="btn primary" type="submit">Salvar área</button></div></form>`);fitTextArea(root.querySelector('#area-name'));root.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;modalDirty=true;root.querySelectorAll('[data-color]').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',x===b?'true':'false')})});root.querySelector('#cancel-area').onclick=()=>closeModal();root.querySelector('#area-form').onsubmit=submitOnce(async e=>{e.preventDefault();const name=root.querySelector('#area-name').value.trim();if(!checkForm(e.target))return;const submit=e.target.querySelector('[type=submit]');submit.disabled=true;const ok=await mutate(s=>{if(a&&(s.areas[id]?.deleted||JSON.stringify(s.areas[id]?.revision)!==revision))throw Error('Esta área mudou em outra janela. Reabra o formulário.');if(activeAreas(s).some(x=>x.id!==id&&areaNameKey(x.name)===areaNameKey(name)))throw Error('Já existe uma área com esse nome.');const aid=id||uid();s.areas[aid]={id:aid,name,color,order:a?s.areas[id].order:Math.max(-1,...activeAreas(s).map(x=>x.order))+1,deleted:false,revision:stamp(s,deviceId)}},'Área salva.');submit.disabled=false;if(ok)closeModal(true)});root.querySelector('#remove-area')?.addEventListener('click',()=>removeAreaModal(id))}
function removeAreaModal(id){if(activeAreas(state).length<2){document.querySelector('.formerror').textContent='Mantenha pelo menos uma área no planejamento.';return}const a=state.areas[id],count=activeItems(state).filter(t=>t.areaId===id).length;const root=openModal('Excluir área',`<form id="remove-area-form"><div class="formerror" role="alert"></div><p class="confirmtext">Excluir a área “${esc(a.name)}”? ${count?`Seus itens e subitens serão movidos para a área escolhida abaixo, incluindo os encerrados.`:'Esta área não contém itens.'}</p>${count?`<div class="field"><label for="target-area">Mover os itens para</label><select data-full-value id="target-area" name="target">${activeAreas(state).filter(x=>x.id!==id).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>`:''}<div class="dialogactions"><button class="btn secondary" type="button" id="cancel-removal">Cancelar</button><button class="btn danger" type="submit">Excluir área</button></div></form>`);root.querySelector('#cancel-removal').onclick=()=>closeModal(true);root.querySelector('form').onsubmit=submitOnce(async e=>{e.preventDefault();const target=root.querySelector('#target-area')?.value;const ok=await mutate(s=>removeArea(s,id,target,deviceId),'Área excluída; itens preservados.');if(ok)closeModal(true)})}
function download(content,name,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportBackup(){if(fatal){toast('Baixe a cópia para recuperação antes de exportar.');return}try{const current=repo.load();download(JSON.stringify(current,null,2),'retomar-backup-'+today()+'.json');toast('Download do backup solicitado. Confira a pasta de downloads.')}catch(e){toast(e.message)}}
async function importFile(e){const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>5*1024*1024){toast('O arquivo excede o limite de 5 MB.');return}let candidate;try{candidate=migrateState(JSON.parse(await file.text()))}catch(err){toast('Backup não importado. '+(err instanceof SyntaxError?'O arquivo não é um JSON válido.':err.message));return}const count=rootItems(candidate).length,childCount=activeItems(candidate).filter(t=>t.parentId).length;const root=openModal('Restaurar backup',`<div class="formerror" role="alert"></div><p class="confirmtext">Este backup contém <strong>${count} ${count===1?'item':'itens'}</strong>${childCount?` e <strong>${childCount} ${childCount===1?'subitem':'subitens'}</strong>`:''} e <strong>${activeAreas(candidate).length} áreas</strong>. A restauração substituirá o planejamento deste aparelho.<br><br>Antes da troca, será solicitado o download de uma cópia dos dados atuais. Confira se o navegador permite o download.</p><div class="dialogactions"><button class="btn secondary" id="cancel-import">Cancelar</button><button class="btn primary" id="confirm-import">Restaurar backup</button></div>`);root.querySelector('#cancel-import').onclick=()=>closeModal(true);root.querySelector('#confirm-import').onclick=submitOnce(async e=>{e.target.disabled=true;try{if(repo.raw)download(repo.raw,'retomar-antes-da-restauracao-'+Date.now()+'.txt','text/plain');else download(JSON.stringify(repo.load(),null,2),'retomar-antes-da-restauracao-'+Date.now()+'.json');const ok=fatal?await mutate(()=>{},'Backup restaurado neste aparelho.',{replace:candidate}):await mutate(s=>Object.assign(s,restoreSnapshot(s,candidate,deviceId)),'Backup restaurado neste aparelho.');if(ok){archiveMode=false;area='all';scope='all';status='all';priorityFilter='all';query='';collections.reset();expandedItems.clear();collapsedMatches.clear();persistExpanded();render();closeModal(true)}}catch(err){root.querySelector('.formerror').textContent=err.message}e.target.disabled=false})}
function exampleModal(){const root=openModal('Experimentar o planejamento',`<p class="confirmtext">Adicionar quatro itens fictícios às suas áreas? Eles serão salvos neste aparelho e você poderá editá-los ou excluí-los depois.</p><div class="dialogactions"><button class="btn secondary" id="cancel-example">Cancelar</button><button class="btn primary" id="confirm-example">Adicionar exemplos</button></div>`);root.querySelector('#cancel-example').onclick=()=>closeModal(true);root.querySelector('#confirm-example').onclick=submitOnce(async()=>{const ok=await mutate(s=>{const areas=activeAreas(s),find=name=>areas.find(a=>a.name===name)?.id||areas[0].id;const next=new Date();next.setDate(next.getDate()+2);for(const data of [{title:'Separar os textos da semana',areaId:find('Estudos'),date:today(),time:'',status:'pending',priority:'high',notes:'Exemplo fictício · escolha por onde começar.'},{title:'Reservar um momento para caminhar',areaId:find('Saúde'),date:today(),time:'17:00',status:'pending',priority:'normal',notes:''},{title:'Organizar uma gaveta de cada vez',areaId:find('Casa'),date:localDate(next),time:'',status:'doing',priority:'normal',notes:''},{title:'Anotar ideias para um projeto pessoal',areaId:find('Pessoal'),date:'',time:'',status:'pending',priority:'normal',notes:'Sem pressa: a data pode ficar para depois.'}])updateItem(s,uid(),data,deviceId)},'Exemplos fictícios adicionados.');if(ok)closeModal(true)})}
window.addEventListener('storage',e=>{if(e.key!==DATA_KEY)return;try{state=repo.load();fatal='';render();syncUI?.changed();if(document.querySelector('dialog'))toast('O planejamento foi atualizado em outra janela. Seu formulário foi preservado.')}catch(err){fatal=err.message;syncUI?.localFailure(err.message);render()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{state=repo.load();fatal=''}catch(e){fatal=e.message;syncUI?.localFailure(e.message)}planningUI?.reload();render();syncUI?.resume()}});
document.addEventListener('visibilitychange',syncVisualMotion);
document.addEventListener('focusin',syncVisualMotion);
document.addEventListener('focusout',()=>queueMicrotask(syncVisualMotion));
motionPreference.addEventListener?.('change',syncVisualMotion);
window.addEventListener('resize',()=>{document.querySelectorAll('textarea.short-text').forEach(resizeTextArea);document.querySelectorAll('select[data-full-value]').forEach(refreshSelectHint)});
window.addEventListener('beforeunload',e=>{if(modalDirty){e.preventDefault();e.returnValue=''}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{});
syncUI=createSyncUI({repo,icon,esc,openModal,closeModal,toast,onExport:exportBackup,onApply:next=>{state=next;fatal='';render()},isBlocked:()=>!!fatal||modalDirty,onPairingChanged:()=>{void calendarUI?.syncPairing();}});
if(fatal)syncUI.localFailure(fatal);
planningUI=createPlanningUI({storage,getState:()=>state,icon,esc,openModal,closeModal,toast,
  onOpen:open=>{if(open){page='reminders';window.scrollTo(0,0)}render()},
  onEdit:id=>{const t=state.items[id];if(!t||t.deleted)return;if(fatal){toast('Recupere os dados antes de editar.');return}itemModal(id)},
  onClockChange:()=>{if(page==='day'&&!document.querySelector('dialog[open]')){render();return;}if(page==='plan'||page==='agenda'){const focus=document.hasFocus()?document.activeElement:null;refreshResults();if(focus&&!focus.isConnected)restoreUIFocus(focus)}},
  onComplete:id=>{if(fatal)return;const current=state.items[id];if(!current||current.deleted)return;return mutate(s=>updateItem(s,id,{status:'done',expectedRevision:JSON.stringify(current.revision)},deviceId),'Tarefa concluída. O lembrete foi retirado.')}
});
const linkedId=new URLSearchParams(location.search).get('item'),linked=linkedId&&state.items[linkedId];if(linked&&!linked.deleted){page='plan';archiveMode=isArchived(state,linked);area=linked.areaId;if(linked.parentId)expandedItems.add(linked.parentId)}
function captureView(){return {...calendarUI?.snapshot(),page,archiveMode,area,status,scope,query,priorityFilter,layout,groupBy,sortOrder,subitemOrder,dayLayout:ui.dayLayout,dayStatus:ui.dayStatus,windows:[...collections.limits]}}
function restoreView(view){
  calendarUI?.restore(view);
  if(['compact','cards'].includes(view.dayLayout))ui.dayLayout=view.dayLayout;
  if(['open','all',...Object.keys(statusLabel)].includes(view.dayStatus))ui.dayStatus=view.dayStatus;
  const saved=cleanView(view);for(const key of ['layout','groupBy','sortOrder','subitemOrder'])if(!Object.hasOwn(view,key))delete saved[key];
  if(saved.layout)layout=saved.layout;if(saved.groupBy)groupBy=saved.groupBy;if(saved.sortOrder)sortOrder=saved.sortOrder;if(saved.subitemOrder)subitemOrder=saved.subitemOrder;
  archiveMode=view.archiveMode===true;
  page=view.page==='agenda'?'plan':['plan','day','areas','settings','reminders'].includes(view.page)?view.page:'plan';
  area=view.area===''||view.area==='all'||activeAreas(state).some(a=>a.id===view.area)?view.area:'all';
  status=['all','open',...Object.keys(statusLabel)].includes(view.status)?view.status:'all';
  scope=['all','overdue','today','upcoming','undated'].includes(view.scope)?view.scope:'all';
  query=typeof view.query==='string'?view.query.slice(0,200):'';
  priorityFilter=['all',...PRIORITIES.map(p=>p.id)].includes(view.priorityFilter)?view.priorityFilter:'all';
  collapsedMatches.clear();collections.reset();
  if(Array.isArray(view.windows))for(const entry of view.windows.slice(0,1000))if(Array.isArray(entry)&&typeof entry[0]==='string'&&Number.isSafeInteger(entry[1])&&entry[1]>=0&&entry[1]<=10000)collections.limits.set(entry[0],entry[1]);
  render();enterView();
}
calendarUI=createCalendarUI({storage,deviceId,getPairConnection:()=>syncUI?.connection()||null,getState:()=>state,getZone:()=>planningUI.timeZone(),onChange:()=>{if(['day','settings'].includes(page)&&!document.querySelector('dialog[open]'))render()},onDisabled:()=>{if(page==='day')page='plan';render()},openModal,closeModal,getTasks:dayTasks,getQuery:()=>query,getLayout:dayLayout,renderTask:taskView,renderTools:dayTools,onNew:date=>{if(fatal){toast('Recupere os dados antes de editar.');return;}itemModal(null,area==='all'?undefined:area,undefined,undefined,date)},onEdit:id=>{if(fatal){toast('Recupere os dados antes de editar.');return;}itemModal(id)},toast,esc,icon});
navigation=createNavigation({capture:captureView,restore:restoreView,hasModal:()=>!!document.querySelector('dialog[open]'),canCloseModal,dismissModal:()=>closeModal(true,true)});
navigation.start();
workflowUI=createWorkflowUI({storage,getState:()=>state,getView:captureView,getSelectable:()=>[...new Map([...filtered(),...selectItems(areaItems(),filterOptions())].map(t=>[t.id,t])).values()],getUndo:()=>lastUndo,onUndo:undoLast,
  onApplyView:view=>{ui.layout=view.layout;ui.groupBy=view.groupBy;ui.order=view.sortOrder;ui.subitemOrder=view.subitemOrder;saveUI();restoreView(view)},onRefresh:render,mutate,deviceId,openModal,closeModal,toast,esc,icon});

render();
if(linked&&!linked.deleted){const button=document.querySelector(`[data-action="edit"][data-id="${CSS.escape(linked.id)}"]`);button?.scrollIntoView({block:'center'});button?.focus({preventScroll:true})}
syncUI.start();
planningUI.start();

