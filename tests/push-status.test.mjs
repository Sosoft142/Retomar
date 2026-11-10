import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem,setArchived} from '../dist/src/domain.js';
import {defaults} from '../dist/src/planning.js';
import {pushSchedule,pushScheduleDetails,pushDefaults,PushClient,PUSH_KEY,PUSH_ITEMS_KEY} from '../dist/src/push.js';
import {createPushUI} from '../dist/src/push-ui.js';
import {priorityIndicator,areaIndicator} from '../dist/src/rendering.js';
const instant=Date.parse('2026-11-10T15:00Z');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fixture(){
 const state=initialState(),areas=activeAreas(state),prefs=defaults();prefs.timeZone='America/Sao_Paulo';
 const add=(id,fields={})=>updateItem(state,id,{title:'Tarefa '+id,notes:'Observação privada',areaId:areas[0].id,date:'2026-11-11',time:'12:00',priority:'normal',status:'pending',...fields},'qa');
 return {state,prefs,areas,add,options:pushDefaults()};
}
test('diagnóstico explica cada exclusão sem divergir dos avisos efetivamente calculados',()=>{
 const f=fixture();for(const [id,fields]of Object.entries({valid:{},undated:{date:'',time:''},closed:{status:'done'},muted:{},priority:{priority:'low'},type:{parentId:'valid'},area:{areaId:f.areas[1].id},past:{date:'2026-11-09'}}))f.add(id,fields);
 f.options.priorities=['normal'];f.options.includeSubitems=false;f.options.areas=[f.areas[0].id];const overrides={muted:{mode:'off'}};
 const details=pushScheduleDetails(f.state,f.prefs,f.options,instant,overrides);
 assert.deepEqual(details.entries,pushSchedule(f.state,f.prefs,f.options,instant,overrides));
 assert.deepEqual(details.entries.map(x=>x.item),['valid']);
 assert.deepEqual(Object.fromEntries(details.excluded.map(x=>[x.item,x.reason])),{undated:'undated',closed:'closed',muted:'muted',priority:'priority',type:'type',area:'area',past:'past'});
 assert.ok(!JSON.stringify(details).includes('Observação privada'));
});
test('avisos adiados e período silencioso mantêm horário real no diagnóstico; horário inexistente é explicado',()=>{
 const f=fixture();f.add('night',{time:'23:00'});f.options.quietEnabled=true;
 const entry=pushScheduleDetails(f.state,f.prefs,f.options,instant).entries[0];assert.equal(entry.at,Date.parse('2026-11-12T11:00Z'));
 f.add('invalid',{date:'2026-03-08',time:'02:30'});f.prefs.timeZone='America/New_York';
 assert.equal(pushScheduleDetails(f.state,f.prefs,f.options,instant).excluded.find(x=>x.item==='invalid').reason,'invalid-time');
});
test('confirmação guarda apenas resultado aceito e não transforma pedido em recebimento',async()=>{
 const f=fixture();f.add('future',{date:'2200-01-01'});const disk=new Map(),changes=[];
 const client=new PushClient({storage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)},target:{},server:'https://push.test',getState:()=>f.state,getPreferences:()=>f.prefs,onChange:()=>changes.push(client.pending)});
 client.data={token:'test-only',confirmed:false,options:f.options,subscription:{}};
 let finish;client.request=()=>new Promise(resolve=>finish=resolve);
 const pending=client.upload(true);assert.equal(client.pending,true);assert.equal(client.verified,false);assert.equal(client.data.lastSchedule,undefined);
 finish({ok:true});await pending;
 assert.equal(client.pending,false);assert.equal(client.verified,true);assert.deepEqual(changes,[true,false]);
 assert.equal(client.data.lastSchedule.count,1);assert.equal(client.data.lastSchedule.nextAt,Date.parse('2200-01-01T14:45Z'));
 assert.ok(Number.isSafeInteger(client.data.lastSchedule.at));assert.equal(client.data.receivedAt,undefined);
 const accepted=structuredClone(client.data.lastSchedule);client.request=async()=>{throw Error('503')};updateItem(f.state,'future',{title:'Prazo alterado'},'qa');await client.sync();
 assert.deepEqual(client.data.lastSchedule,accepted);assert.equal(client.error,'503');
});
function uiFixture({data=null,permission='granted',result={ok:true}}={}){
 const f=fixture();f.add('next');const disk=new Map(data?[[PUSH_KEY,JSON.stringify(data)]]:[]);
 const storage={getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)};
 const target={isSecureContext:true,PushManager:{},Notification:{permission},navigator:{serviceWorker:{}},document:{querySelector:()=>null},fetch:async()=>Response.json(result)};
 let changes=0;
 const ui=createPushUI({storage,target,getState:()=>f.state,getPreferences:()=>f.prefs,esc,icon:()=>'<svg></svg>',toast:()=>{},onChange:()=>changes++,now:()=>instant});
 return {...f,ui,target,disk,changes:()=>changes};
}
test('prévia, permissão e ativação ficam distintas mesmo com um aviso futuro calculado',()=>{
 const f=uiFixture({permission:'default'}),html=f.ui.settings();
 assert.match(html,/Desativado neste aparelho/);assert.match(html,/Ainda não solicitada/);assert.match(html,/Próximo aviso calculado neste aparelho/);assert.match(html,/Tarefa next/);assert.match(html,/Ainda sem confirmação/);
 assert.doesNotMatch(html,/Agendamento confirmado/);f.target.Notification.permission='denied';assert.match(f.ui.settings(),/Permissão bloqueada no navegador/);
});
test('registro antigo exige revalidação e confirmação atualiza só o estado de notificações',async()=>{
 const f=uiFixture({data:{token:'test-only',confirmed:true,options:pushDefaults(),subscription:{}}});
 assert.match(f.ui.settings(),/Aguardando confirmação atual/);await f.ui.sync();
 assert.match(f.ui.settings(),/Agendamento confirmado/);assert.match(f.ui.settings(),/Último agendamento aceito pelo servidor/);
 assert.equal(f.changes(),0);assert.ok(JSON.parse(f.disk.get(PUSH_KEY)).lastSchedule);
});
test('falha preserva confirmação anterior e explica a fila pendente sem remontar o formulário',async()=>{
 const ack={at:instant-60000,count:2,nextAt:instant+3600000};
 const f=uiFixture({data:{token:'test-only',confirmed:true,options:pushDefaults(),subscription:{},lastSchedule:ack}});
 f.target.fetch=async()=>Response.json({error:'falha'},{status:503});
 await f.ui.sync();
 const html=f.ui.settings();assert.match(html,/Atualização pendente/);assert.match(html,/503/);assert.match(html,/A fila anterior pode continuar gerando avisos/);
 assert.deepEqual(JSON.parse(f.disk.get(PUSH_KEY)).lastSchedule,ack);assert.equal(f.changes(),0);
});
test('confirmação automática atualiza botões sem perder o formulário aberto',async()=>{
 const f=uiFixture({data:{token:'test-only',confirmed:false,options:pushDefaults(),subscription:{}}});
 const enable={classList:{toggle(){}},disabled:false},testButton={disabled:true},background={disabled:true};
 const nodes={'[data-action="planning-push-enable"]':enable,'[data-action="planning-push-test"]':testButton,'[data-action="planning-push-background"]':background};
 f.target.document.querySelector=selector=>nodes[selector]||null;
 let finish;f.target.fetch=()=>new Promise(resolve=>finish=resolve);
 const pending=f.ui.sync();await Promise.resolve();assert.equal(enable.disabled,true);assert.equal(testButton.disabled,true);
 finish(Response.json({ok:true}));await pending;
 assert.equal(enable.textContent,'Revalidar conexão');assert.equal(enable.disabled,false);assert.equal(testButton.disabled,false);assert.equal(background.disabled,false);assert.equal(f.changes(),0);
});
test('voltar à configuração anterior após falha reenvia e recupera confirmação',async()=>{
 const f=fixture();f.add('future',{date:'2200-01-01'});const disk=new Map();
 const client=new PushClient({storage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>disk.set(k,v)},target:{},server:'https://push.test',getState:()=>f.state,getPreferences:()=>f.prefs});
 client.data={token:'test-only',options:f.options,subscription:{}};
 let requests=0;client.request=async()=>{requests++;return {ok:true}};await client.sync();
 const title=f.state.items.future.title;updateItem(f.state,'future',{title:'Outro título'},'qa');client.request=async()=>{throw Error('503')};await client.sync();
 updateItem(f.state,'future',{title},'qa');client.request=async()=>{requests++;return {ok:true}};await client.sync();
 assert.equal(requests,2);assert.equal(client.error,'');assert.equal(client.verified,true);
});
test('motivo da ausência aparece na configuração e na tarefa; arquivamento retira o aviso',()=>{
 const f=uiFixture();updateItem(f.state,'next',{date:'',time:''},'qa');
 assert.match(f.ui.settings(),/Por que não há aviso calculado/);assert.match(f.ui.settings(),/Sem data/);assert.match(f.ui.itemSummary(f.state.items.next),/Sem data/);
 setArchived(f.state,'next',true,'qa');assert.match(f.ui.itemSummary(f.state.items.next),/arquivada: não gera avisos/);
});
test('opção silenciada e privacidade são refletidas sem expor títulos na prévia',()=>{
 const f=uiFixture({data:{options:{...pushDefaults(),private:true}}});assert.doesNotMatch(f.ui.settings(),/Tarefa next/);
 f.disk.set(PUSH_ITEMS_KEY,JSON.stringify({next:{mode:'off'}}));assert.match(f.ui.itemSummary(f.state.items.next),/Silenciadas neste aparelho/);
});
test('nome da prioridade fica visível e área escapa texto com marcação',()=>{
 const mark=priorityIndicator('urgent');assert.match(mark,/<span class="priority-name">Urgente<\/span>/);assert.match(mark,/title="Prioridade: Urgente"/);
 const area=areaIndicator({name:'Área <teste>'},esc);assert.match(area,/area-dot/);assert.match(area,/Área &lt;teste&gt;/);assert.doesNotMatch(area,/<teste>/);assert.match(areaIndicator(null,esc),/Sem área/);
});
