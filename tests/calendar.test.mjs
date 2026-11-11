import test from 'node:test';
import assert from 'node:assert/strict';
import {CalendarPreferences,CALENDAR_KEY,GOOGLE_SCOPES,GoogleReadSession,CalendarReader,normalizeEvent,safeCalendarLink,calendarRange,eventsOnDay,tasksOnDay} from '../dist/src/calendar.js';
import {initialState,activeAreas,updateItem,setArchived} from '../dist/src/domain.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const calendar={id:'primary@example.invalid',name:'Agenda de teste',color:'#123456'};
const event=(id,start='2026-11-11T09:00:00-03:00',end='2026-11-11T10:00:00-03:00')=>({id,summary:'Reunião <script>',start:{dateTime:start},end:{dateTime:end},htmlLink:'https://calendar.google.com/calendar/event?eid=test'});
const response=items=>({ok:true,status:200,json:async()=>({items})});
function authFixture(){let config,requests=0,time=1000;const timers=new Map();let sequence=0;const identity={initTokenClient(c){config=c;return {requestAccessToken(){requests++;}}}};const session=new GoogleReadSession({target:{setTimeout:f=>{timers.set(++sequence,f);return sequence;},clearTimeout:id=>timers.delete(id)},load:async()=>identity,now:()=>time});return {session,timers,config:()=>config,requests:()=>requests,advance:n=>time+=n,authorize:extra=>config.callback({access_token:'token_ficticio',expires_in:3600,scope:GOOGLE_SCOPES.join(' '),...extra})};}
test('preferências guardam somente configuração, sem tokens nem eventos',()=>{
 const disk=memory(),p=new CalendarPreferences(disk);p.save({enabled:true,clientId:'12345-public.apps.googleusercontent.com',calendarIds:['teste@example.invalid']});assert.equal(new CalendarPreferences(disk).value.calendarIds[0],'teste@example.invalid');const before=disk.getItem(CALENDAR_KEY);assert.throws(()=>p.save({...p.value,access_token:'segredo'}));assert.equal(disk.getItem(CALENDAR_KEY),before);
});
test('opções corrompidas ou quota não apagam tarefas nem declaram sucesso',()=>{
 const disk=memory();disk.setItem(CALENDAR_KEY,'{bad');const p=new CalendarPreferences(disk);assert.equal(p.value.enabled,false);assert.ok(p.error);assert.equal(disk.getItem(CALENDAR_KEY),'{bad');
 const fail=new CalendarPreferences({getItem:()=>null,setItem:()=>{throw Error('quota');}});assert.throws(()=>fail.save({enabled:true,clientId:'',calendarIds:null}),/Não foi possível salvar/);
});
test('OAuth solicita somente as duas permissões de consulta e apenas após conectar',async()=>{
 const f=authFixture();assert.equal(f.requests(),0);await f.session.prepare();assert.equal(f.requests(),0);const pending=f.session.connect('12345-public.apps.googleusercontent.com');assert.equal(f.requests(),1);assert.equal(f.config().include_granted_scopes,false);assert.deepEqual(f.config().scope.split(' '),GOOGLE_SCOPES);f.authorize();await pending;assert.equal(f.session.accessToken,'token_ficticio');f.advance(3570001);assert.equal(f.session.accessToken,'');
});
test('conexão duplicada compartilha solicitação e negação parcial não guarda autorização',async()=>{
 const f=authFixture();await f.session.prepare();const p=f.session.connect('12345-public.apps.googleusercontent.com');assert.equal(f.session.connect('12345-public.apps.googleusercontent.com'),p);assert.equal(f.requests(),1);f.authorize({scope:GOOGLE_SCOPES[0]});await assert.rejects(p,/não autorizou/);assert.equal(f.session.accessToken,'');
});
test('cancelar conexão invalida retorno tardio e remove token da memória',async()=>{
 const f=authFixture();await f.session.prepare();const p=f.session.connect('12345-public.apps.googleusercontent.com'),rejection=assert.rejects(p,/cancelada/);f.session.clear();f.authorize();await rejection;assert.equal(f.session.accessToken,'');assert.equal(f.timers.size,0);
});
test('autorização expira por tempo limite e pode ser solicitada novamente',async()=>{
 const f=authFixture();await f.session.prepare();const p=f.session.connect('12345-public.apps.googleusercontent.com');[...f.timers.values()][0]();await assert.rejects(p,/não foi concluída/);const next=f.session.connect('12345-public.apps.googleusercontent.com');f.authorize();await next;assert.equal(f.session.accessToken,'token_ficticio');f.session.clear();assert.equal(f.session.accessToken,'');
});
test('pop-up bloqueado e token malformado viram erro sem credenciais persistidas',async()=>{
 const f=authFixture();await f.session.prepare();let p=f.session.connect('12345-public.apps.googleusercontent.com');f.config().error_callback({type:'popup_failed_to_open'});await assert.rejects(p,/pop-up/);p=f.session.connect('12345-public.apps.googleusercontent.com');f.authorize({access_token:'bad\r\nheader'});await assert.rejects(p,/inválida/);assert.equal(f.session.accessToken,'');
});
test('adaptador faz apenas GET, pagina agendas e não envia token na URL',async()=>{
 const calls=[],reader=new CalendarReader(async(url,options)=>{calls.push({url,options});const page=new URL(url).searchParams.get('pageToken');return {ok:true,json:async()=>page?{items:[{id:'b',summary:'Outra',backgroundColor:'red'}]}:{items:[{id:'a',summary:'Principal',primary:true,backgroundColor:'#123456'}],nextPageToken:'page2'}};});
 const list=await reader.calendars('unit_token');assert.equal(list.length,2);assert.equal(list[1].color,'#14b8a6');for(const call of calls){assert.equal(call.options.method,'GET');assert.equal(call.options.credentials,'omit');assert.equal(call.options.redirect,'error');assert.equal(call.options.headers.Authorization,'Bearer unit_token');assert.ok(!call.url.includes('unit_token'));assert.equal(call.options.body,undefined);}
});
test('página repetida e limite de resultados falham sem anunciar lista completa',async()=>{
 const reader=new CalendarReader(async()=>({ok:true,json:async()=>({items:[],nextPageToken:'repeated'})}));await assert.rejects(reader.calendars('unit_token'),/repetiu/);
 const many=new CalendarReader(async()=>response(Array(501).fill({id:'a'})));await assert.rejects(many.calendars('unit_token'),/muitos resultados/);
});
test('lista vazia pode omitir items, mas resposta de erro não vira sucesso vazio',async()=>{
 const empty=new CalendarReader(async()=>({ok:true,json:async()=>({})}));assert.deepEqual(await empty.calendars('unit_token'),[]);
 const bad=new CalendarReader(async()=>({ok:true,json:async()=>({error:{message:'failed'}})}));await assert.rejects(bad.calendars('unit_token'),/lista inválida/);
});
test('eventos expandem recorrências, deduplicam páginas e ignoram cancelamentos e datas inválidas',async()=>{
 const calls=[],reader=new CalendarReader(async(url,options)=>{calls.push({url,options});return response([event('a'),event('a'),{...event('c'),status:'cancelled'},event('broken','invalid','invalid')]);});
 const result=await reader.events([calendar],calendarRange('2026-11-11',7,'America/Sao_Paulo'),'unit_token');assert.equal(result.events.length,1);assert.equal(result.ignored,1);const url=new URL(calls[0].url);assert.equal(url.searchParams.get('singleEvents'),'true');assert.equal(url.searchParams.get('orderBy'),'startTime');assert.equal(url.searchParams.get('timeZone'),'America/Sao_Paulo');assert.equal(url.searchParams.get('timeMin'),'2026-11-11T03:00:00.000Z');assert.equal(url.searchParams.get('timeMax'),'2026-11-18T03:00:00.000Z');
});
test('dia inteiro usa término exclusivo e evento atravessando meia-noite aparece nos dias corretos',()=>{
 const all=normalizeEvent({id:'all',start:{date:'2026-11-11'},end:{date:'2026-11-13'}},calendar),night=normalizeEvent(event('night','2026-11-11T23:00:00-03:00','2026-11-12T01:00:00-03:00'),calendar);
 assert.equal(eventsOnDay([all,night],'2026-11-11','America/Sao_Paulo').length,2);assert.equal(eventsOnDay([all,night],'2026-11-12','America/Sao_Paulo').length,2);assert.equal(eventsOnDay([all,night],'2026-11-13','America/Sao_Paulo').length,0);
});
test('faixa diária considera transição de horário de verão sem inventar meia-noite',()=>{
 const r=calendarRange('2018-11-04',1,'America/Sao_Paulo');assert.equal(new Date(r.start).toISOString(),'2018-11-04T03:00:00.000Z');assert.equal(r.end-r.start,23*3600000);
});
test('links não permitem JavaScript, credenciais ou destinos externos',()=>{
 for(const link of ['javascript:alert(1)','https://evil.example/calendar/','https://www.google.com.evil.example/calendar/','https://user:pass@calendar.google.com/calendar/','https://www.google.com/search?q=test'])assert.equal(safeCalendarLink(link),'');assert.ok(safeCalendarLink('https://www.google.com/calendar/event?eid=test'));
});
test('401, 403 e 429 preservam código e apresentam erros utilizáveis',async()=>{
 for(const status of [401,403,429]){const reader=new CalendarReader(async()=>({ok:false,status}));await assert.rejects(reader.calendars('unit_token'),e=>e.status===status&&/Google/.test(e.message));}
});
test('tarefas do dia respeitam prazo próprio do subitem, arquivo e andamento',()=>{
 const s=initialState(),areaId=activeAreas(s)[0].id;for(const [id,parentId,date] of [['p','','2026-11-11'],['c','p','2026-11-12'],['b','','2026-11-11']])updateItem(s,id,{title:id,areaId,parentId,date,time:'00:00',notes:'',priority:'normal',status:'pending'},'test');assert.deepEqual(tasksOnDay(s,'2026-11-11').map(t=>t.id),['p','b']);assert.equal(tasksOnDay(s,'2026-11-12')[0].id,'c');setArchived(s,'p',true,'test');updateItem(s,'b',{status:'done'},'test');assert.deepEqual(tasksOnDay(s,'2026-11-11'),[]);assert.deepEqual(tasksOnDay(s,'2026-11-12'),[]);
});
