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
  const calls={prepare:0,connect:0,disconnect:0,send:0,popups:0,edits:[],toasts:[],renders:0,modals:[]};
  const nodes={};
  const storage={getItem:key=>key===PLANNING_KEY?raw:null,setItem:(key,value)=>{if(failSave)throw Error('quota');raw=value}};
  const target={location:{href:'https://sosoft142.github.io/Retomar/'},document:{querySelector:()=>null,querySelectorAll:()=>[],activeElement:null},navigator:{},open:()=>{calls.popups++}};
  const ui=createPlanningUI({storage,getState:()=>state,icon:()=>'<svg></svg>',esc,target,now:()=>new Date('2026-10-30T15:00Z'),toast:(message,action)=>calls.toasts.push({message,action}),onEdit:id=>calls.edits.push(id),onOpen:()=>{calls.renders++},openModal:(title,body)=>{calls.modals.push({title,body});return {querySelector:selector=>nodes[selector]||={}}}});
  return {ui,state,calls,nodes,target,saved:()=>JSON.parse(raw),failSave:()=>{failSave=true}};
}

test('configurações mostram lembretes e explicam que push ainda não está ativo',()=>{const f=fixture();const html=f.ui.settings();assert.match(html,/Servidor ainda não ativado/);assert.doesNotMatch(html,/Google|OAuth|calendar|Agenda/);assert.match(html,/planning-push-enable" disabled/)});
test('central usa o prazo próprio do subitem sem ações de agenda',()=>{const f=fixture(),html=f.ui.page();assert.match(html,/Etapa &amp; café &lt;teste&gt;/);assert.match(html,/13:00/);assert.doesNotMatch(html,/planning-calendar|calendar.google|Google Agenda/)});
test('migração da interface elimina credenciais antigas sem mudar tarefas',()=>{const f=fixture('direct');assert.equal(f.saved().version,3);assert.equal(f.saved().calendar,undefined);assert.equal(f.calls.connect,0);assert.equal(f.state.items.child.time,'13:00')});
test('cache da visualização de lembretes é invalidado por edição na mesma instância',()=>{const f=fixture();f.ui.beginRender();assert.match(f.ui.header(),/Lembretes: 1 /);updateItem(f.state,'child',{status:'done'},'qa');assert.match(f.ui.header(),/Lembretes: 0 /);updateItem(f.state,'undated',{date:'2026-10-30',time:'14:00'},'qa');assert.match(f.ui.header(),/Lembretes: 1 /);f.ui.beginRender();assert.match(f.ui.page(),/Sem data/)});

test('lembrete oferece gerenciamento explícito e separa ações da tarefa das ações do aviso',async()=>{
  const f=fixture(),html=f.ui.page();
  assert.match(html,/aria-label="Gerenciar: Etapa &amp; café &lt;teste&gt;"/);
  assert.match(html,/<h2 class="reminder-title">Etapa &amp; café &lt;teste&gt;<\/h2>/);
  assert.doesNotMatch(html,/<button class="reminder-title"/);
  assert.match(html,/<details class="reminder-extra"><summary>Opções do aviso<\/summary>/);
  assert.match(html,/Ocultar até amanhã/);assert.match(html,/Andamento: Pendente/);assert.match(html,/Prioridade: !! Urgente/);
  await f.ui.action('planning-edit',{id:'child'});assert.deepEqual(f.calls.edits,['child']);
});
test('configuração distingue central de notificações e conserva as opções existentes',async()=>{
  const f=fixture();await f.ui.action('planning-reminder-settings',{});const modal=f.calls.modals.at(-1);
  assert.match(modal.title,/central/);assert.match(modal.body,/1\. Mostrar na central/);assert.match(modal.body,/2\. Quais prazos exibir/);assert.match(modal.body,/3\. Ao tocar em Adiar/);
  for(const id of ['reminders-enabled','reminders-days','reminders-overdue','reminders-snooze','reminders-zone','clear-reminder-dismissals'])assert.ok(modal.body.includes('id="'+id+'"'));
  assert.match(f.ui.settings(),/Notificações com o app fechado/);
});
