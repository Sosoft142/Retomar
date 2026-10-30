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
  const prefs=defaults();prefs.calendar.timeZone='America/Sao_Paulo';
  if(mode==='direct'){prefs.version=1;Object.assign(prefs.calendar,{mode:'direct',clientId:'antigo',calendarId:'primary',colors:{},notification:'30'})}
  let raw=JSON.stringify(prefs),failSave=false;
  const calls={prepare:0,connect:0,disconnect:0,send:0,popups:0,edits:[],toasts:[],renders:0,modals:[]};
  const nodes={};
  const storage={getItem:key=>key===PLANNING_KEY?raw:null,setItem:(key,value)=>{if(failSave)throw Error('quota');raw=value}};
  const target={location:{href:'https://sosoft142.github.io/Retomar/'},document:{querySelector:()=>null,querySelectorAll:()=>[],activeElement:null},navigator:{},open:()=>{calls.popups++}};
  const ui=createPlanningUI({storage,getState:()=>state,icon:()=>'<svg></svg>',esc,target,now:()=>new Date('2026-10-30T15:00Z'),toast:(message,action)=>calls.toasts.push({message,action}),onEdit:id=>calls.edits.push(id),onOpen:()=>{calls.renders++},openModal:(title,body)=>{calls.modals.push({title,body});return {querySelector:selector=>nodes[selector]||={}}}});
  return {ui,state,calls,nodes,target,saved:()=>JSON.parse(raw),failSave:()=>{failSave=true}};
}
const href=html=>new URL(html.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'));
test('itens e subitens abrem por link nativo sem iniciar OAuth ou depender de popup em JavaScript',()=>{
  const f=fixture();for(const id of ['parent','child']){const html=f.ui.calendarButton(f.state.items[id]);assert.ok(html.startsWith('<a '));assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.equal(href(html).origin,'https://calendar.google.com');assert.equal(href(html).searchParams.get('action'),'TEMPLATE');assert.ok(!html.includes('<teste>'));}
  assert.equal(href(f.ui.calendarButton(f.state.items.child)).searchParams.get('text'),'[Urgente] Etapa & café <teste>');
  assert.deepEqual([f.calls.prepare,f.calls.connect,f.calls.popups,f.calls.send],[0,0,0,0]);
});
test('central de lembretes usa o mesmo link nativo com o prazo próprio do subitem',()=>{
  const f=fixture(),html=f.ui.page();assert.match(html,/data-action="planning-calendar-web" data-id="child"/);assert.match(html,/20261030T160000Z%2F20261030T163000Z/);assert.doesNotMatch(html,/data-action="planning-calendar-web" data-id="undated"/);
});
test('item sem data continua abrindo edição e nenhum evento é preparado',async()=>{
  const f=fixture();assert.ok(f.ui.calendarButton(f.state.items.undated).startsWith('<button '));await f.ui.action('planning-calendar',{id:'undated'});assert.deepEqual(f.calls.edits,['undated']);assert.equal(f.calls.modals.length,0);assert.equal(f.calls.connect,0);
});
test('abrir o link explica que falta salvar e oferece ajuda sem anunciar evento criado',async()=>{
  const f=fixture();await f.ui.action('planning-calendar-web',{id:'child'});const notice=f.calls.toasts.at(-1);assert.match(notice.message,/confirme em Salvar/);assert.doesNotMatch(notice.message,/adicionado e confirmado/);assert.equal(notice.action.label,'Não abriu?');notice.action.run();const modal=f.calls.modals.at(-1);assert.match(modal.body,/Abrir nesta aba/);assert.match(modal.body,/Copiar link do evento/);assert.ok(!modal.body.includes('<teste>'));assert.equal(f.calls.popups,0);
});
test('copiar o link tem alternativa manual quando a área de transferência não está disponível',async()=>{
  const f=fixture();await f.ui.action('planning-calendar',{id:'child'});let focused=0,selected=0;f.nodes['#calendar-manual-copy']={hidden:true};f.nodes['#calendar-event-link']={focus:()=>focused++,select:()=>selected++};await f.nodes['#calendar-copy-link'].onclick();assert.equal(f.nodes['#calendar-manual-copy'].hidden,false);assert.equal(focused,1);assert.equal(selected,1);assert.match(f.nodes['#calendar-copy-status'].textContent,/copie o link/);
});
test('copiar o link usa somente a URL preparada e não envia a tarefa ao Google',async()=>{
  const f=fixture();let copied='';f.target.navigator.clipboard={writeText:async value=>{copied=value}};await f.ui.action('planning-calendar',{id:'child'});await f.nodes['#calendar-copy-link'].onclick();assert.equal(new URL(copied).origin,'https://calendar.google.com');assert.match(f.nodes['#calendar-copy-status'].textContent,/Link copiado/);assert.equal(f.calls.send,0);
});
test('preferência antiga de envio direto é migrada antes de renderizar, sem autenticar',()=>{
  const f=fixture('direct'),before=JSON.stringify(f.state);assert.equal(f.saved().version,2);assert.equal(f.saved().calendar.clientId,undefined);assert.ok(f.ui.calendarButton(f.state.items.child).startsWith('<a '));assert.equal(JSON.stringify(f.state),before);assert.deepEqual([f.calls.prepare,f.calls.connect,f.calls.send],[0,0,0]);
});
test('página de configurações e ajuda de notificações não oferecem conexões nem configurações de API',async()=>{
  const f=fixture('direct'),html=f.ui.settings();assert.doesNotMatch(html,/OAuth|Conectar ao Google|Reconectar|Envio direto|avançada|client-id|calendar-colors/i);await f.ui.action('planning-calendar-notifications',{});const modal=f.calls.modals.at(-1);assert.equal(modal.title,'Notificações no Google Agenda');assert.match(modal.body,/Adicionar notificação/);assert.match(modal.body,/antecedência/);assert.match(modal.body,/não configura a antecedência automaticamente/);assert.equal(f.calls.send,0);
});
test('configurações do modo simples mostram os passos e não apresentam conexão como requisito',()=>{
  const f=fixture(),html=f.ui.settings();assert.match(html,/Adicionar sem configuração/);assert.match(html,/Toque em <strong>Salvar/);assert.doesNotMatch(html,/data-google-connect/);assert.doesNotMatch(html,/class="calendar-colors"/);assert.match(html,/Como definir notificações/);
});
