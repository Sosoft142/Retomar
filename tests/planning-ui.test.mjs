import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem} from '../dist/src/domain.js';
import {PLANNING_KEY,defaults} from '../dist/src/planning.js';
import {createPlanningUI} from '../dist/src/planning-ui.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fixture(mode='web'){
  const state=initialState(),areaId=activeAreas(state)[0].id;
  updateItem(state,'parent',{areaId,title:'Projeto',date:'2026-11-07',time:'',priority:'normal',status:'pending',notes:''},'qa');
  updateItem(state,'child',{areaId,parentId:'parent',title:'Etapa & café <teste>',date:'2026-10-30',time:'13:00',priority:'urgent',status:'pending',notes:''},'qa');
  updateItem(state,'undated',{areaId,title:'Sem data',date:'',time:'',priority:'normal',status:'pending',notes:''},'qa');
  const prefs=defaults();prefs.timeZone='America/Sao_Paulo';
  if(mode==='direct'){prefs.version=1;prefs.calendar={timeZone:prefs.timeZone,clientId:'antigo'};delete prefs.timeZone}
  let raw=JSON.stringify(prefs),failSave=false;
  const calls={prepare:0,connect:0,disconnect:0,send:0,popups:0,edits:[],toasts:[],renders:0,clocks:0,modals:[]};
  const nodes={};
  const storage={getItem:key=>key===PLANNING_KEY?raw:null,setItem:(key,value)=>{if(failSave)throw Error('quota');raw=value}};
  let instant=new Date('2026-10-30T15:00Z'),sequence=0;
  const listeners={window:new Map(),document:new Map()},timers=new Map();
  const events=group=>({addEventListener(type,fn){if(!listeners[group].has(type))listeners[group].set(type,new Set());listeners[group].get(type).add(fn)},removeEventListener(type,fn){listeners[group].get(type)?.delete(fn)}});
  const target={...events('window'),setInterval:(fn,delay)=>{const id=++sequence;timers.set(id,{fn,delay});return id},clearInterval:id=>timers.delete(id),location:{href:'https://sosoft142.github.io/Retomar/'},document:{...events('document'),hidden:false,documentElement:{classList:{contains:()=>false}},querySelector:()=>null,querySelectorAll:()=>[],activeElement:null},navigator:{},open:()=>{calls.popups++}};
  const ui=createPlanningUI({storage,getState:()=>state,icon:()=>'<svg></svg>',esc,target,now:()=>instant,onClockChange:()=>calls.clocks++,toast:(message,action)=>calls.toasts.push({message,action}),onEdit:id=>calls.edits.push(id),onOpen:()=>{calls.renders++},openModal:(title,body)=>{calls.modals.push({title,body});return {querySelector:selector=>nodes[selector]||={}}}});
  return {ui,state,calls,nodes,target,timers,emit:(group,type,event={})=>{for(const fn of listeners[group].get(type)||[])fn(event)},advance:date=>instant=new Date(date),saved:()=>JSON.parse(raw),failSave:()=>{failSave=true}};
}

test('servidor configurado permite ativação sem declarar o aparelho já inscrito',()=>{const f=fixture();const html=f.ui.settings();assert.match(html,/Desativado neste aparelho/);assert.doesNotMatch(html,/Servidor ainda não ativado|Google|OAuth|calendar|Agenda/);assert.match(html,/data-action="planning-push-enable" >Ativar neste aparelho/);assert.doesNotMatch(html,/Confirmado pelo servidor|data-action="planning-push-test"/)});
test('central usa o prazo próprio do subitem sem ações de agenda',()=>{const f=fixture(),html=f.ui.page();assert.match(html,/Etapa &amp; café &lt;teste&gt;/);assert.match(html,/13:00/);assert.doesNotMatch(html,/planning-calendar|calendar.google|Google Agenda/)});
test('migração da interface elimina credenciais antigas sem mudar tarefas',()=>{const f=fixture('direct');assert.equal(f.saved().version,3);assert.equal(f.saved().calendar,undefined);assert.equal(f.calls.connect,0);assert.equal(f.state.items.child.time,'13:00')});
test('cache da visualização de lembretes é invalidado por edição na mesma instância',()=>{const f=fixture();f.ui.beginRender();assert.match(f.ui.header(),/Lembretes: 1 /);updateItem(f.state,'child',{status:'done'},'qa');assert.match(f.ui.header(),/Lembretes: 0 /);updateItem(f.state,'undated',{date:'2026-10-30',time:'14:00'},'qa');assert.match(f.ui.header(),/Lembretes: 1 /);f.ui.beginRender();assert.match(f.ui.page(),/Sem data/)});

test('lembrete prioriza conteúdo com gerenciamento explícito e conclusão acessível',async()=>{
  const f=fixture(),html=f.ui.page();
  assert.match(html,/aria-label="Gerenciar: Etapa &amp; café &lt;teste&gt;"/);
  assert.match(html,/<h2 class="reminder-title">Etapa &amp; café &lt;teste&gt;<\/h2>/);
  assert.doesNotMatch(html,/<button class="reminder-title"/);
  assert.match(html,/aria-label="Concluir: Etapa &amp; café &lt;teste&gt;"/);
  assert.doesNotMatch(html,/<select|reminder-extra|data-action="planning-snooze"|data-action="planning-dismiss"/);
  assert.match(html,/aria-label="Andamento: Pendente"/);assert.match(html,/aria-label="Prioridade: Urgente"/);
  await f.ui.action('planning-edit',{id:'child'});assert.deepEqual(f.calls.edits,['child']);
});
test('configuração distingue central de notificações e conserva as opções existentes',async()=>{
  const f=fixture();await f.ui.action('planning-reminder-settings',{});const modal=f.calls.modals.at(-1);
  assert.match(modal.title,/central/);assert.match(modal.body,/1\. Mostrar na central/);assert.match(modal.body,/2\. Quais prazos exibir/);assert.match(modal.body,/3\. Ao tocar em Adiar/);
  for(const id of ['reminders-enabled','reminders-days','reminders-overdue','reminders-snooze','reminders-zone','clear-reminder-dismissals'])assert.ok(modal.body.includes('id="'+id+'"'));
  assert.match(f.ui.settings(),/Notificações com o app fechado/);
});

test('lembretes usam a cor da área, respeitam cor própria e mantêm sem área branco',()=>{
  const f=fixture();
  const areaId=f.state.items.child.areaId;
  f.state.areas[areaId].color='#3b82f6';
  updateItem(f.state,'custom',{title:'Cor própria',notes:'',date:'2026-10-30',time:'14:00',areaId,priority:'low',status:'pending',color:'#f97316'},'qa');
  updateItem(f.state,'no-area',{title:'Sem área com prazo',notes:'',date:'2026-10-30',time:'15:00',areaId:'',priority:'high',status:'pending'},'qa');
  const html=f.ui.page();
  assert.match(html,/style="--task-background:#3b82f6;--area-color:#3b82f6"/);
  assert.match(html,/style="--task-background:#f97316;--area-color:#3b82f6"/);
  assert.match(html,/style="--task-background:#ffffff;--area-color:#ffffff"/);
  assert.match(html,/class="priority-mark" aria-hidden="true">!!<\/i>/);
  assert.match(html,/<time class="reminder-date[^\"]*" datetime="2026-10-30T13:00">/);
  assert.match(html,/aria-label="Gerenciar: Cor própria"/);
});


test('retornar ao app e o relógio atualizam prazos vencidos sem interromper formulário ou busca',()=>{
  const f=fixture();f.ui.beginRender();assert.doesNotMatch(f.ui.page(),/Atrasado · Hoje às 13:00/);
  f.ui.start();assert.equal(f.ui.timeZone(),'America/Sao_Paulo');
  f.advance('2026-10-30T17:00Z');f.emit('window','focus');
  assert.equal(f.calls.clocks,1);assert.match(f.ui.page(),/Atrasado · Hoje às 13:00/);
  f.target.document.hidden=true;f.emit('document','visibilitychange');assert.equal(f.calls.clocks,1);
  f.target.document.hidden=false;f.emit('document','visibilitychange');assert.equal(f.calls.clocks,2);
  const tick=[...f.timers.values()].find(t=>t.delay===30000).fn;
  f.target.document.activeElement={matches:()=>true};tick();assert.equal(f.calls.clocks,2);
  f.target.document.activeElement=null;f.target.document.querySelector=selector=>selector==='dialog[open]'?{}:null;tick();assert.equal(f.calls.clocks,2);
  f.target.document.querySelector=()=>null;f.target.document.documentElement.classList.contains=()=>true;tick();assert.equal(f.calls.clocks,2);
  f.target.document.documentElement.classList.contains=()=>false;tick();assert.equal(f.calls.clocks,3);
  f.ui.dispose();assert.equal(f.timers.size,0);f.emit('window','focus');f.emit('document','visibilitychange');assert.equal(f.calls.clocks,3);
});
