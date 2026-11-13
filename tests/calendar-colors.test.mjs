import test from 'node:test';
import assert from 'node:assert/strict';
import {CalendarReader,normalizeEvent,calendarRange} from '../dist/src/calendar.js';

const calendar={id:'test@example.invalid',name:'Agenda fictícia',color:'#123456'},range=calendarRange('2026-11-13',1,'America/Sao_Paulo');
const event=(id,extra={})=>({id,start:{dateTime:'2026-11-13T10:00:00-03:00'},end:{dateTime:'2026-11-13T11:00:00-03:00'},...extra});
const palette={event:{'1':{background:'#7986cb'},'2':{background:'#33b679'}},calendar:{'1':{background:'#aabbcc'}}};
const json=body=>({ok:true,status:200,json:async()=>body});

test('cor específica prevalece e padrão/ID desconhecido herdam a agenda correta',()=>{
 assert.equal(normalizeEvent(event('a',{colorId:'1'}),calendar,{palette}).color,'#7986cb');
 for(const colorId of [undefined,'0','99','__proto__'])assert.equal(normalizeEvent(event('a',{colorId}),calendar,{palette}).color,'#123456');
 assert.equal(normalizeEvent(event('b'),{...calendar,id:'other',color:'#e67c73'},{palette}).color,'#e67c73');
 assert.equal(normalizeEvent(event('a'),{...calendar,color:'',colorId:'1'},{palette}).color,'#aabbcc');
});
test('rótulo personalizado prevalece sobre cor antiga e pertence à sua agenda',()=>{
 const row=event('a',{eventLabelId:'label',colorId:'1'});
 assert.equal(normalizeEvent(row,calendar,{palette,labels:{label:'#8e24aa'}}).color,'#8e24aa');
 assert.equal(normalizeEvent(row,calendar,{palette,labels:{label:'#f4511e'}}).color,'#f4511e');
 assert.equal(normalizeEvent(row,calendar,{palette,labels:{}}).color,'#7986cb');
});
test('somente cores hexadecimais válidas chegam às variáveis CSS',()=>{
 for(const bad of ['red','#fff','url(https://invalid)','";background:red','__proto__']){
  const e=normalizeEvent(event('a',{colorId:'1',eventLabelId:'label'}),{...calendar,color:bad},{palette:{event:{'1':{background:bad}}},labels:{label:bad}});
  assert.equal(e.color,'#14b8a6');
 }
});
test('leitura usa uma paleta por consulta e preserva cores em várias agendas',async()=>{
 const calls=[],reader=new CalendarReader(async(url,options)=>{calls.push({url,options});return json(new URL(url).pathname.endsWith('/colors')?palette:{items:[event('override',{colorId:'1'}),event('default')]});});
 const result=await reader.events([calendar,{...calendar,id:'other',color:'#f4511e'}],range,'test_token');
 assert.deepEqual(result.events.filter(e=>e.id==='override').map(e=>e.color),['#7986cb','#7986cb']);assert.deepEqual(result.events.filter(e=>e.id==='default').map(e=>e.color),['#123456','#f4511e']);assert.equal(result.colorWarning,'');
 assert.equal(calls.filter(c=>new URL(c.url).pathname.endsWith('/colors')).length,1);
 for(const {url,options} of calls){assert.equal(options.method,'GET');assert.equal(options.body,undefined);assert.ok(!url.includes('test_token'));if(url.includes('/events?')){assert.match(new URL(url).searchParams.get('fields'),/colorId,eventLabelId/);}}
});
test('rótulos são consultados apenas quando usados e com permissão opcional',async()=>{
 const calls=[],reader=new CalendarReader(async url=>{const path=new URL(url).pathname;calls.push(path);return json(path.endsWith('/events')?{items:[event('label',{eventLabelId:'custom'})]}:{labelProperties:{eventLabels:[{id:'custom',backgroundColor:'#8e24aa'}]}});});
 const without=await reader.events([calendar],range,'token');assert.equal(calls.length,1);assert.equal(without.events[0].color,'#123456');assert.match(without.colorWarning,/reconecte/);
 calls.length=0;const withLabels=await reader.events([calendar],range,'token',undefined,{includeLabels:true});assert.equal(calls.length,2);assert.equal(withLabels.events[0].color,'#8e24aa');assert.equal(withLabels.colorWarning,'');
});
test('mesmo ID de rótulo em duas agendas não mistura as cores',async()=>{
 const reader=new CalendarReader(async url=>{const path=new URL(url).pathname;return json(path.endsWith('/events')?{items:[event('e',{eventLabelId:'same'})]}:{labelProperties:{eventLabels:[{id:'same',backgroundColor:path.includes('/other')?'#f4511e':'#8e24aa'}]}});});
 const result=await reader.events([calendar,{...calendar,id:'other'}],range,'token',undefined,{includeLabels:true});assert.deepEqual(result.events.map(e=>e.color),['#8e24aa','#f4511e']);
});
test('falha de paleta/rótulo mantém eventos e informa que a cor foi substituída',async()=>{
 for(const kind of ['colors','labels']){
  const reader=new CalendarReader(async url=>new URL(url).pathname.endsWith('/events')?json({items:[event('a',kind==='colors'?{colorId:'1'}:{eventLabelId:'label'})]}):{ok:false,status:503});
  const result=await reader.events([calendar],range,'token',undefined,{includeLabels:true});assert.equal(result.events.length,1);assert.equal(result.events[0].color,'#123456');assert.match(result.colorWarning,/cores/);
 }
});
test('expiração e cancelamento durante cores não são ocultados como aviso parcial',async()=>{
 for(const status of [401,'abort']){
  const reader=new CalendarReader(async url=>{if(new URL(url).pathname.endsWith('/events'))return json({items:[event('a',{colorId:'1'})]});if(status==='abort')throw Object.assign(Error('cancelled'),{name:'AbortError'});return {ok:false,status};});
  await assert.rejects(reader.events([calendar],range,'token'),e=>status===401?e.status===401:e.name==='AbortError');
 }
});
test('paleta malformada ou cor desconhecida não esconde compromissos',async()=>{
 for(const colors of [{event:[],calendar:{}},{event:{},calendar:{}}]){
  const reader=new CalendarReader(async url=>json(new URL(url).pathname.endsWith('/events')?{items:[event('a',{colorId:'unknown'})]}:colors));const result=await reader.events([calendar],range,'token');assert.equal(result.events.length,1);assert.equal(result.events[0].color,'#123456');assert.ok(result.colorWarning);
 }
});
