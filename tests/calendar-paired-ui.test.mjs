import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createCalendarUI} from '../dist/src/calendar-ui.js';
import {PairedGoogleSession} from '../dist/src/calendar-session.js';
import {agendaPairKey} from '../dist/src/calendar-pairing.js';
import {CalendarPreferences} from '../dist/src/calendar.js';
import {service,memory,clientId,clientSecret,endpoint,origin} from './helpers/calendar-paired.mjs';
const connection={gistId:'abcde',token:'fictitious_pairing_token',secret:'fictitious_pairing_token'};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('PC e celular adotam agendas, restauram ao reabrir, renovam e desconectam sem alterar tarefas',async t=>{
 const f=service(),gist={public:false,files:{'retomar.enc.json':{content:'TASKS_UNCHANGED'}}},prior=globalThis.fetch,doms=[],toasts=[];t.after(()=>{globalThis.fetch=prior;for(const d of doms)d.window.close();});
 globalThis.fetch=async(url,options={})=>{assert.match(url,/^https:\/\/api.github.com\/gists\/abcde$/);assert.equal(options.headers.Authorization,'Bearer '+connection.token);if(options.method==='PATCH')Object.assign(gist.files,JSON.parse(options.body).files);return Response.json(gist);};
 await f.grant(await agendaPairKey(connection));
 const reader={calendars:async token=>{assert.match(token,/^access_fictitious_/);return [{id:'primary',name:'Principal',primary:true,color:'#123456'},{id:'secondary',name:'Outra agenda',color:'#654321'}];},events:async selected=>({events:selected.map(c=>({key:c.id,id:c.id,calendarId:c.id,calendarName:c.name,title:'Evento '+c.name,color:c.color,allDay:true,startDate:'2026-11-13',endDate:'2026-11-14',start:Date.parse('2026-11-13'),end:Date.parse('2026-11-14'),description:'',location:'',link:''})),ignored:0})};
 function device(id,disk=memory()){
  const dom=new JSDOM('<body><div id="modal"></div></body>',{url:origin});doms.push(dom);const w=dom.window;w.open=()=>{throw Error('Não pode abrir popup ao restaurar');};w.confirm=()=>true;
  const session=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,fetcher:f.fetcher,now:f.now});
  const ui=createCalendarUI({storage:disk,deviceId:id,getPairConnection:()=>connection,getState:()=>({items:{}}),getTasks:()=>[],getZone:()=>'UTC',onChange(){},onDisabled(){},openModal:(title,html)=>{w.document.querySelector('#modal').innerHTML='<dialog open>'+html+'</dialog>';return w.document.querySelector('dialog');},closeModal:()=>w.document.querySelector('dialog')?.remove(),onEdit(){},toast:text=>toasts.push(text),esc:String,icon:()=>'',target:w,session,reader,now:f.now});
  ui.restore({calendarDate:'2026-11-13'});return {ui,disk,w,session};
 }
 const diskA=memory();new CalendarPreferences(diskA).save({enabled:true,clientId,calendarIds:null});const a=device('A',diskA),b=device('B');await a.ui.syncPairing();await b.ui.syncPairing();assert.equal(b.session.accessToken,a.session.accessToken);assert.equal(new CalendarPreferences(b.disk).value.clientId,clientId);assert.match(b.ui.page(),/Evento Principal/);assert.match(b.ui.page(),/#123456/);
 await b.ui.action('calendar-calendars');const checks=b.w.document.querySelectorAll('[data-calendar-index]');checks[0].checked=false;checks[1].checked=true;await b.w.document.querySelector('form').onsubmit({preventDefault(){}});await settle();await b.ui.syncPairing();await a.ui.syncPairing();assert.deepEqual(new CalendarPreferences(a.disk).value.calendarIds,['secondary']);assert.match(a.ui.page(),/Evento Outra agenda/);assert.ok(!a.ui.page().includes('Evento Principal'));
 const reopened=device('B-reopen',b.disk);await reopened.ui.syncPairing();assert.match(reopened.ui.page(),/Evento Outra agenda/);f.advance(3600000);await Promise.all([a.ui.syncPairing(),reopened.ui.syncPairing()]);assert.equal(f.refreshes(),1);assert.ok(reopened.session.accessToken);assert.equal(gist.files['retomar.enc.json'].content,'TASKS_UNCHANGED');const persisted=JSON.stringify([...diskA.data,...b.disk.data,gist]);for(const secret of ['refresh_fictitious','access_fictitious',clientSecret])assert.ok(!persisted.includes(secret));
 await a.ui.action('calendar-disconnect');assert.equal(f.revoked(),true);const fresh=device('fresh',b.disk);await fresh.ui.syncPairing();assert.equal(fresh.session.accessToken,'');assert.ok(toasts.some(x=>x.includes('aparelhos pareados')));
});
test('configuração remota aguarda formulário e mantém Meu dia oculto no aparelho',async t=>{
 const {sealAgenda}=await import('../dist/src/calendar-pairing.js');const record={version:1,revision:{counter:2,deviceId:'remote'},settings:{clientId,calendarIds:['secondary']}};const content=await sealAgenda(record,connection.secret),prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({public:false,files:{'retomar-agenda.enc.json':{content}}});t.after(()=>globalThis.fetch=prior);
 const dom=new JSDOM('<body><dialog open><form><input value="rascunho"></form></dialog></body>',{url:origin});t.after(()=>dom.window.close());const disk=memory();new CalendarPreferences(disk).save({enabled:false,clientId:'',calendarIds:null});let restores=0;const ui=createCalendarUI({storage:disk,deviceId:'local',getPairConnection:()=>connection,getState:()=>({items:{}}),getTasks:()=>[],getZone:()=>'UTC',onChange(){},esc:String,icon:()=>'',target:dom.window,session:{accessToken:'',clear(){},restore(){restores++;}}});
 await ui.syncPairing();assert.equal(new CalendarPreferences(disk).value.clientId,'');assert.equal(dom.window.document.querySelector('input').value,'rascunho');dom.window.document.querySelector('dialog').remove();ui.resume();assert.deepEqual(new CalendarPreferences(disk).value,{enabled:false,...record.settings});assert.equal(restores,0);assert.equal(ui.enabled,false);
});
