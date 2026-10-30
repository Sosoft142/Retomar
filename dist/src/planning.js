import {APP_ID,PRIORITIES,activeItems,openItem,validDate} from './domain.js';
export const PLANNING_KEY='entrelinhas-vida:planning:v1';
export const EVENT_COLORS=[['11','Vermelho','#dc2127'],['6','Laranja','#ffb878'],['9','Azul','#5484ed'],['3','Violeta','#dbadff'],['1','Lavanda','#a4bdfc'],['2','Menta','#7ae7bf'],['4','Coral','#ff887c'],['5','Amarelo','#fbd75b'],['7','Ciano','#46d6db'],['8','Cinza','#e1e1e1'],['10','Verde','#51b749']];
export const defaultTimeZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Sao_Paulo';
export function defaults(){return {version:1,reminders:{enabled:true,aheadDays:3,overdue:true,snoozeMinutes:60},calendar:{mode:'web',clientId:'',calendarId:'primary',duration:30,undatedTime:'allDay',defaultTime:'09:00',timeZone:defaultTimeZone(),notification:'default',includeNotes:false,priorityTitle:true,colors:{urgent:'11',high:'6',normal:'9',low:'3'}},dismissals:{}}}
export const validTime=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const validClientId=v=>typeof v==='string'&&/^\d{6,30}-[a-z0-9_-]{10,150}\.apps\.googleusercontent\.com$/i.test(v);
export function validZone(zone){try{return typeof zone==='string'&&zone.length<=100&&!!new Intl.DateTimeFormat('en',{timeZone:zone}).format(0)}catch{return false}}
const own=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
export function validatePreferences(p){
  if(!own(p)||p.version!==1||!own(p.reminders)||!own(p.calendar)||!own(p.dismissals))throw Error('As preferências de lembretes precisam ser configuradas novamente.');
  const r=p.reminders,c=p.calendar;
  if(typeof r.enabled!=='boolean'||typeof r.overdue!=='boolean'||![0,1,3,7,14,30].includes(r.aheadDays)||![15,30,60,180,1440].includes(r.snoozeMinutes))throw Error('Escolha uma antecedência e um adiamento válidos.');
  if(!['web','direct'].includes(c.mode)||typeof c.clientId!=='string'||(c.clientId&&!validClientId(c.clientId))||(c.mode==='direct'&&!validClientId(c.clientId)))throw Error('Para o envio direto, informe o ID público de cliente OAuth do Google.');
  if(typeof c.calendarId!=='string'||!c.calendarId.trim()||c.calendarId.length>300||/[\p{Cc}\p{Cs}]/u.test(c.calendarId))throw Error('Escolha uma agenda válida.');
  if(![15,30,45,60,90,120,180].includes(c.duration)||!['allDay','defaultTime'].includes(c.undatedTime)||!validTime(c.defaultTime)||!validZone(c.timeZone))throw Error('Confira a duração, o horário padrão e o fuso horário.');
  if(!['default','none','0','5','10','15','30','60','1440'].includes(String(c.notification))||typeof c.includeNotes!=='boolean'||typeof c.priorityTitle!=='boolean')throw Error('Confira as opções do evento.');
  if(!own(c.colors)||!PRIORITIES.every(p=>EVENT_COLORS.some(([id])=>id===c.colors[p.id])))throw Error('Escolha uma cor do Google Agenda para cada prioridade.');
  if(new Set(PRIORITIES.map(p=>c.colors[p.id])).size!==PRIORITIES.length)throw Error('Escolha uma cor diferente para cada prioridade.');
  if(Object.keys(p.dismissals).length>20000)throw Error('Há muitos adiamentos neste aparelho. Limpe os avisos dispensados nas configurações.');
  for(const [id,d] of Object.entries(p.dismissals))if(!id||['__proto__','constructor','prototype'].includes(id)||!own(d)||typeof d.signature!=='string'||d.signature.length>500||!Number.isFinite(d.until)||d.until<0)throw Error('Há um adiamento inválido nas preferências.');
  return p;
}
export class PlanningPreferences{
  constructor(storage){this.storage=storage;this.value=defaults();this.error='';this.reload()}
  reload(){try{const raw=this.storage.getItem(PLANNING_KEY);this.value=raw===null?defaults():validatePreferences(JSON.parse(raw));this.error=''}catch{this.error='Não foi possível ler as preferências de lembretes. Os itens estão preservados; salve suas opções novamente.'}return this.value}
  save(value){const next=structuredClone(validatePreferences(value)),raw=JSON.stringify(next);try{this.storage.setItem(PLANNING_KEY,raw);if(this.storage.getItem(PLANNING_KEY)!==raw)throw Error()}catch{throw Error('Não foi possível salvar estas preferências. Confira o armazenamento do navegador.')}this.value=next;this.error='';return next}
}
const formatters=new Map();
function formatter(zone){if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return formatters.get(zone)}
function zoneParts(ms,zone){const parts=Object.fromEntries(formatter(zone).formatToParts(new Date(ms)).map(x=>[x.type,x.value]));return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`,epoch:Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second)}}
export const dateInZone=(now=new Date(),zone=defaultTimeZone())=>zoneParts(+now,zone).date;
export function addDays(date,days){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function zonedInstant(date,time,zone){
  if(!validDate(date)||!validTime(time)||!validZone(zone))throw Error('Confira a data, o horário e o fuso horário.');
  const desired=Date.parse(date+'T'+time+':00Z'),offsets=new Set([-86400000,0,86400000].map(delta=>zoneParts(desired+delta,zone).epoch-(desired+delta)));
  const matches=[...offsets].map(offset=>desired-offset).filter(ms=>{const p=zoneParts(ms,zone);return p.date===date&&p.time===time});
  if(!matches.length)throw Error('Este horário não existe no fuso escolhido devido à mudança de horário. Escolha outro horário.');
  return Math.min(...matches);
}
export const reminderSignature=(t,zone)=>JSON.stringify([t.date,t.time,t.revision?.counter,t.revision?.deviceId,zone]);
export function dueReminders(state,prefs,now=new Date()){
  if(!prefs.reminders.enabled)return [];
  const zone=prefs.calendar.timeZone,today=dateInZone(now,zone),last=addDays(today,prefs.reminders.aheadDays),cache=new Map(),rank=new Map(PRIORITIES.map((p,i)=>[p.id,i]));
  return activeItems(state).filter(t=>openItem(t)&&t.date&&t.date<=last&&(prefs.reminders.overdue||t.date>=today)).flatMap(t=>{
    const dismissed=prefs.dismissals[t.id];if(dismissed?.signature===reminderSignature(t,zone)&&dismissed.until>+now)return [];
    const key=t.date+'|'+t.time;let cached=cache.get(key);
    if(!cached){let deadline,invalidTime=false;try{deadline=zonedInstant(t.date,t.time||'23:59',zone)+(t.time?0:59999)}catch{invalidTime=true;deadline=Date.parse(t.date+'T23:59:59Z')}cached={deadline,invalidTime};cache.set(key,cached)}const {deadline,invalidTime}=cached;
    const overdue=t.time?deadline<+now:t.date<today;
    if(overdue&&!prefs.reminders.overdue)return [];
    return [{item:t,deadline,overdue,invalidTime,group:overdue?'overdue':t.date===today?'today':'upcoming'}];
  }).sort((a,b)=>a.deadline-b.deadline||rank.get(a.item.priority)-rank.get(b.item.priority)||a.item.id.localeCompare(b.item.id));
}
function firstInstantOfDay(date,zone){for(let day=0;day<3;day++){const candidate=addDays(date,day);for(let hour=0;hour<24;hour++){let instant;try{instant=zonedInstant(candidate,String(hour).padStart(2,'0')+':00',zone)}catch{continue}if(hour>0)for(let minute=1;minute<60;minute++){try{return zonedInstant(candidate,String(hour-1).padStart(2,'0')+':'+String(minute).padStart(2,'0'),zone)}catch{}}return instant}}throw Error('Não foi possível calcular a virada do dia neste fuso.');}
export function postpone(prefs,item,now=new Date(),todayOnly=false){const next=structuredClone(prefs),zone=next.calendar.timeZone;for(const [id,d] of Object.entries(next.dismissals))if(d.until<=+now)delete next.dismissals[id];let until=+now+prefs.reminders.snoozeMinutes*60000;if(todayOnly){const tomorrow=addDays(dateInZone(now,zone),1);until=firstInstantOfDay(tomorrow,zone)}next.dismissals[item.id]={signature:reminderSignature(item,zone),until};return next}
export function reminderDate(entry,now=new Date(),zone=defaultTimeZone()){
  const t=entry.item,today=dateInZone(now,zone),day=t.date===today?'Hoje':t.date===addDays(today,1)?'Amanhã':new Date(t.date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',...(t.date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{})});
  return `${entry.overdue?'Atrasado · ':''}${day}${t.time?' às '+t.time:' · sem horário'}${entry.invalidTime?' · confira o fuso':''}`;
}
function taskForCalendar(state,id){const t=state.items[id];if(!t||t.deleted)throw Error('Este item não está disponível.');if(!t.date)throw Error('Defina uma data antes de enviar ao Google Agenda.');return t}
const escapeDescription=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export function returnLink(base,id){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('item',id);return url.href}
export function calendarEvent(state,id,config,appUrl){
  const t=taskForCalendar(state,id),p=PRIORITIES.find(p=>p.id===t.priority),parent=t.parentId?state.items[t.parentId]:null;
  const lines=['Retomar · '+(t.parentId?'Subitem':'Item'),'Área: '+state.areas[t.areaId]?.name,'Prioridade: '+p.label,...(parent?['Item principal: '+parent.title]:[]),...(config.includeNotes&&t.notes?['',t.notes]:[]),...(appUrl?['','Abrir no Retomar: '+returnLink(appUrl,id)]:[])];
  const summary=(config.priorityTitle?'['+p.label+'] ':'')+t.title,description=lines.map(escapeDescription).join('\n');
  let start,end;
  const time=t.time||(config.undatedTime==='defaultTime'?config.defaultTime:'');
  if(time){const ms=zonedInstant(t.date,time,config.timeZone);start={dateTime:new Date(ms).toISOString(),timeZone:config.timeZone};end={dateTime:new Date(ms+config.duration*60000).toISOString(),timeZone:config.timeZone}}
  else{start={date:t.date};end={date:addDays(t.date,1)}}
  const reminders=config.notification==='default'?{useDefault:true}:{useDefault:false,overrides:config.notification==='none'?[]:[{method:'popup',minutes:Number(config.notification)}]};
  return {summary,description,start,end,colorId:config.colors[t.priority],reminders,transparency:time?'opaque':'transparent',extendedProperties:{private:{retomarApp:APP_ID,retomarItem:t.id,retomarDataset:state.datasetId}}};
}
export function calendarTemplate(state,id,config,appUrl){
  const event=calendarEvent(state,id,config,appUrl),stamp=v=>v.replace(/[-:]|\.\d{3}/g,''),dates=event.start.date?stamp(event.start.date)+'/'+stamp(event.end.date):stamp(event.start.dateTime)+'/'+stamp(event.end.dateTime),url=new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action','TEMPLATE');url.searchParams.set('text',event.summary);url.searchParams.set('dates',dates);url.searchParams.set('details',event.description);url.searchParams.set('ctz',config.timeZone);if(config.calendarId!=='primary')url.searchParams.set('src',config.calendarId);return url.href;
}
export async function calendarEventId(itemId,dataset='principal'){
  const bytes=new TextEncoder().encode(JSON.stringify([APP_ID,dataset,itemId])),id='retomar'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');if(id.length>1024)throw Error('O identificador deste item é grande demais para o Google Agenda.');return id;
}
export function safeCalendarLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&((u.hostname==='calendar.google.com')||(u.hostname==='www.google.com'&&u.pathname.startsWith('/calendar/')))?u.href:''}catch{return ''}}
