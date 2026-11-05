import {PRIORITIES,visibleItems,openItem,validDate} from './domain.js';
export const PLANNING_KEY='entrelinhas-vida:planning:v1';
export const defaultTimeZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Sao_Paulo';
export function defaults(){return {version:3,timeZone:defaultTimeZone(),reminders:{enabled:true,aheadDays:3,overdue:true,snoozeMinutes:60},dismissals:{}}}
export const validTime=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function validZone(zone){try{return typeof zone==='string'&&zone.length<=100&&!!formatter(zone)}catch{return false}}
const own=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
export function validatePreferences(p){
  if(!own(p)||Object.keys(p).some(k=>!['version','timeZone','reminders','dismissals'].includes(k))||p.version!==3||!own(p.reminders)||!validZone(p.timeZone)||!own(p.dismissals))throw Error('As preferências de lembretes precisam ser configuradas novamente.');
  const r=p.reminders;
  if(typeof r.enabled!=='boolean'||typeof r.overdue!=='boolean'||![0,1,3,7,14,30].includes(r.aheadDays)||![15,30,60,180,1440].includes(r.snoozeMinutes))throw Error('Escolha uma antecedência e um adiamento válidos.');
  if(Object.keys(p.dismissals).length>20000)throw Error('Há muitos adiamentos neste aparelho. Limpe os avisos dispensados nas configurações.');
  for(const [id,d] of Object.entries(p.dismissals))if(!id||['__proto__','constructor','prototype'].includes(id)||!own(d)||typeof d.signature!=='string'||d.signature.length>500||!Number.isFinite(d.until)||d.until<0)throw Error('Há um adiamento inválido nas preferências.');
  return p;
}
export function migratePlanningPreferences(p){
  if(own(p)&&[1,2].includes(p.version)&&own(p.calendar))return validatePreferences({version:3,timeZone:p.calendar.timeZone,reminders:p.reminders,dismissals:p.dismissals});
  return validatePreferences(p);
}
export class PlanningPreferences{
  constructor(storage){this.storage=storage;this.value=defaults();this.error='';this.reload()}
  reload(){try{
    const raw=this.storage.getItem(PLANNING_KEY),parsed=raw===null?null:JSON.parse(raw);
    this.value=raw===null?defaults():structuredClone(migratePlanningPreferences(parsed));this.error='';
    if(parsed&&parsed.version!==3)try{this.save(this.value)}catch{this.error='Os lembretes estão ativos, mas não foi possível atualizar as preferências neste aparelho. Salve suas opções novamente.'}
  }catch{this.error='Não foi possível ler as preferências de lembretes. Os itens estão preservados; salve suas opções novamente.'}return this.value}
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
  const zone=prefs.timeZone,today=dateInZone(now,zone),last=addDays(today,prefs.reminders.aheadDays),cache=new Map(),rank=new Map(PRIORITIES.map((p,i)=>[p.id,i]));
  return visibleItems(state).filter(t=>openItem(t)&&t.date&&t.date<=last&&(prefs.reminders.overdue||t.date>=today)).flatMap(t=>{
    const dismissed=prefs.dismissals[t.id];if(dismissed?.signature===reminderSignature(t,zone)&&dismissed.until>+now)return [];
    const key=t.date+'|'+t.time;let cached=cache.get(key);
    if(!cached){let deadline,invalidTime=false;try{deadline=zonedInstant(t.date,t.time||'23:59',zone)+(t.time?0:59999)}catch{invalidTime=true;deadline=Date.parse(t.date+'T23:59:59Z')}cached={deadline,invalidTime};cache.set(key,cached)}const {deadline,invalidTime}=cached;
    const overdue=t.time?deadline<+now:t.date<today;
    if(overdue&&!prefs.reminders.overdue)return [];
    return [{item:t,deadline,overdue,invalidTime,group:overdue?'overdue':t.date===today?'today':'upcoming'}];
  }).sort((a,b)=>a.deadline-b.deadline||rank.get(a.item.priority)-rank.get(b.item.priority)||a.item.id.localeCompare(b.item.id));
}
function firstInstantOfDay(date,zone){for(let day=0;day<3;day++){const candidate=addDays(date,day);for(let hour=0;hour<24;hour++){let instant;try{instant=zonedInstant(candidate,String(hour).padStart(2,'0')+':00',zone)}catch{continue}if(hour>0)for(let minute=1;minute<60;minute++){try{return zonedInstant(candidate,String(hour-1).padStart(2,'0')+':'+String(minute).padStart(2,'0'),zone)}catch{}}return instant}}throw Error('Não foi possível calcular a virada do dia neste fuso.');}
export function postpone(prefs,item,now=new Date(),todayOnly=false){const next=structuredClone(prefs),zone=next.timeZone;for(const [id,d] of Object.entries(next.dismissals))if(d.until<=+now)delete next.dismissals[id];let until=+now+prefs.reminders.snoozeMinutes*60000;if(todayOnly){const tomorrow=addDays(dateInZone(now,zone),1);until=firstInstantOfDay(tomorrow,zone)}next.dismissals[item.id]={signature:reminderSignature(item,zone),until};return next}
export function reminderDate(entry,now=new Date(),zone=defaultTimeZone()){
  const t=entry.item,today=dateInZone(now,zone),day=t.date===today?'Hoje':t.date===addDays(today,1)?'Amanhã':new Date(t.date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',...(t.date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{})});
  return `${entry.overdue?'Atrasado · ':''}${day}${t.time?' às '+t.time:' · sem horário'}${entry.invalidTime?' · confira o fuso':''}`;
}
