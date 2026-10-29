export const APP_ID='entrelinhas-vida';
export const SCHEMA_VERSION=2;
export const LEGACY_COLORS=['#687c61','#9a7456','#787194','#a16162','#587e91','#a28a45'];
export const PALETTE=[['#14b8a6','Turquesa'],['#3b82f6','Azul vivo'],['#8b5cf6','Violeta'],['#ec4899','Rosa'],['#f97316','Laranja'],['#eab308','Amarelo'],['#22c55e','Verde'],['#06b6d4','Ciano'],['#6366f1','Índigo'],['#d946ef','Fúcsia'],['#ef4444','Vermelho'],['#84cc16','Lima'],['#0d9488','Petróleo'],['#2563eb','Cobalto'],['#a855f7','Ametista'],['#f43f5e','Coral']];
export const COLORS=PALETTE.map(([c])=>c);
export const PRIORITIES=[{id:'urgent',label:'Urgente',symbol:'!!'},{id:'high',label:'Alta',symbol:'↑'},{id:'normal',label:'Normal',symbol:'•'},{id:'low',label:'Baixa',symbol:'↓'}];
export const STATUSES=['pending','doing','done','canceled'];
export const uid=()=>{if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
export function initialState(){return {appId:APP_ID,schemaVersion:SCHEMA_VERSION,datasetId:'principal',clock:0,updatedAt:new Date().toISOString(),areas:Object.fromEntries(['Pessoal','Estudos','Saúde','Casa','Trabalho','Finanças'].map((name,i)=>{const id=uid();return [id,{id,name,color:COLORS[i],order:i,deleted:false,revision:{counter:0,deviceId:'initial'}}]})),items:{}}}
export function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v&&v>='1900-01-01'&&v<='2200-12-31'}
const str=(v,max=5000)=>typeof v==='string'&&v.length<=max;
export const hasVisibleText=value=>typeof value==='string'&&value.replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cs}]/gu,'').length>0;
export const areaNameKey=name=>name.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const shape=(value,keys)=>record(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const ROOT_KEYS=['appId','schemaVersion','datasetId','clock','updatedAt','areas','items'];
const AREA_KEYS=['id','name','color','order','deleted','revision'];
const ITEM_KEYS=['id','title','notes','areaId','date','time','status','priority','order','createdAt','updatedAt','deleted','revision'];
const rev=r=>shape(r,['counter','deviceId'])&&Number.isSafeInteger(r.counter)&&r.counter>=0&&str(r.deviceId,100)&&hasVisibleText(r.deviceId);
const safeId=id=>str(id,100)&&id&&!/[\p{White_Space}\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cs}]/u.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function validateState(s){
  if(!s||s.appId!==APP_ID)throw Error('Este arquivo não é um backup do Retomar.');
  if(s.schemaVersion!==SCHEMA_VERSION)throw Error('A versão deste backup é incompatível. Preserve o arquivo e use uma versão compatível do aplicativo.');
  if(!shape(s,ROOT_KEYS))throw Error('A estrutura do backup contém campos ausentes ou não reconhecidos. Preserve o arquivo original.');
  if(s.datasetId!=='principal'||!Number.isSafeInteger(s.clock)||s.clock<0||!str(s.updatedAt,50)||!Number.isFinite(Date.parse(s.updatedAt)))throw Error('Os metadados do backup são inválidos.');
  for(const key of ['areas','items'])if(!record(s[key]))throw Error('A estrutura do backup é inválida.');
  const areas=Object.entries(s.areas),items=Object.entries(s.items);if(areas.length>500||items.length>20000)throw Error('O arquivo excede os limites desta versão.');
  const ids=new Set();let maxClock=0;
  for(const [id,a] of areas){if(!safeId(id)||ids.has(id)||!shape(a,AREA_KEYS)||a.id!==id||!str(a.name,60)||!hasVisibleText(a.name)||![...COLORS,...LEGACY_COLORS].includes(a.color)||!Number.isSafeInteger(a.order)||a.order<0||typeof a.deleted!=='boolean'||!rev(a.revision))throw Error('Há uma área inválida no backup.');ids.add(id);maxClock=Math.max(maxClock,a.revision.counter)}
  if(!areas.some(([,a])=>!a.deleted))throw Error('O planejamento precisa de pelo menos uma área.');
  for(const [id,t] of items){if(!safeId(id)||ids.has(id)||!shape(t,ITEM_KEYS)||t.id!==id||!str(t.title,200)||!hasVisibleText(t.title)||!str(t.notes)||!STATUSES.includes(t.status)||!PRIORITIES.some(p=>p.id===t.priority)||!Number.isSafeInteger(t.order)||t.order<0||!str(t.date,10)||(t.date&&!validDate(t.date))||!str(t.time,5)||(t.time&&(!t.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)))||typeof t.deleted!=='boolean'||!rev(t.revision)||!str(t.createdAt,50)||!Number.isFinite(Date.parse(t.createdAt))||!str(t.updatedAt,50)||!Number.isFinite(Date.parse(t.updatedAt))||!str(t.areaId,100)||!Object.hasOwn(s.areas,t.areaId)||(!t.deleted&&s.areas[t.areaId].deleted))throw Error('Há um item inválido ou sem área correspondente no backup.');ids.add(id);maxClock=Math.max(maxClock,t.revision.counter)}
  if(s.clock<maxClock)throw Error('As revisões do backup são inconsistentes.');return s;
}
export function migrateState(input){
  if(input?.schemaVersion!==1)return validateState(input);
  const s=structuredClone(input);s.schemaVersion=2;
  // A migração conserva identidade e revisões. O mapa de cores é determinístico.
  for(const a of Object.values(s.areas||{})){const i=LEGACY_COLORS.indexOf(a?.color);if(i>=0)a.color=COLORS[i]}
  Object.values(s.items||{}).sort((a,b)=>String(a?.createdAt).localeCompare(String(b?.createdAt))||String(a?.id).localeCompare(String(b?.id))).forEach((t,i)=>{t.order=i});
  return validateState(s);
}
export const activeAreas=s=>Object.values(s.areas).filter(a=>!a.deleted).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
export const activeItems=s=>Object.values(s.items).filter(t=>!t.deleted);
export const openItem=t=>t.status==='pending'||t.status==='doing';
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function stamp(s,deviceId){if(s.clock>=Number.MAX_SAFE_INTEGER)throw Error('O limite de revisões foi atingido. Exporte uma cópia dos dados.');return {counter:++s.clock,deviceId}}
export function updateItem(s,id,fields,deviceId){const prev=s.items[id];if(prev?.deleted)throw Error('Este item foi excluído em outra janela.');if(prev&&fields.expectedRevision&&JSON.stringify(prev.revision)!==fields.expectedRevision)throw Error('Este item mudou em outra janela. Feche e abra o formulário para conferir a versão atual.');const {expectedRevision,...data}=fields;const now=new Date().toISOString();s.items[id]={id,createdAt:prev?.createdAt||now,order:prev?.order??Math.max(-1,...activeItems(s).map(t=>t.order))+1,...prev,...data,deleted:false,updatedAt:now,revision:stamp(s,deviceId)};return s.items[id]}
export function deleteItem(s,id,deviceId){const t=s.items[id];if(!t||t.deleted)throw Error('Este item já foi excluído.');t.deleted=true;t.updatedAt=new Date().toISOString();t.revision=stamp(s,deviceId);return structuredClone(t)}
export function undoDelete(s,deleted,deviceId){const t=s.items[deleted.id];if(!t?.deleted||JSON.stringify(t.revision)!==JSON.stringify(deleted.revision))throw Error('O item recebeu outra alteração e não pode ser restaurado por esta ação.');if(s.areas[t.areaId]?.deleted)t.areaId=activeAreas(s)[0].id;t.deleted=false;t.updatedAt=new Date().toISOString();t.revision=stamp(s,deviceId)}
export function removeArea(s,id,target,deviceId){const a=s.areas[id];if(!a||a.deleted)throw Error('Esta área já foi removida.');if(activeAreas(s).length<2)throw Error('Mantenha pelo menos uma área.');const linked=activeItems(s).filter(t=>t.areaId===id);if(linked.length&&(!s.areas[target]||s.areas[target].deleted||target===id))throw Error('Escolha uma área para receber os itens.');for(const t of linked)updateItem(s,t.id,{areaId:target},deviceId);a.deleted=true;a.revision=stamp(s,deviceId)}
export function reorderAreas(s,id,beforeId,deviceId){const list=activeAreas(s),moving=list.find(a=>a.id===id);if(!moving)throw Error('Esta área não está mais disponível.');const rest=list.filter(a=>a.id!==id);const at=beforeId?rest.findIndex(a=>a.id===beforeId):-1;rest.splice(at<0?rest.length:at,0,moving);rest.forEach((a,i)=>{if(a.order!==i){a.order=i;a.revision=stamp(s,deviceId)}})}
export function moveItem(s,id,{beforeId=null,areaId,priority}={},deviceId){
  const t=s.items[id];if(!t||t.deleted)throw Error('Este item não está mais disponível.');
  areaId=areaId||t.areaId;if(!s.areas[areaId]||s.areas[areaId].deleted)throw Error('A área de destino não está mais disponível.');
  if(priority&&!PRIORITIES.some(p=>p.id===priority))throw Error('Prioridade inválida.');
  if(t.areaId!==areaId||(priority&&t.priority!==priority))updateItem(s,id,{areaId,priority:priority||t.priority},deviceId);
  const list=selectItems(activeItems(s).filter(x=>x.id!==id),{order:'manual'});const at=beforeId?list.findIndex(x=>x.id===beforeId):-1;list.splice(at<0?list.length:at,0,s.items[id]);
  list.forEach((x,i)=>{if(x.order!==i)updateItem(s,x.id,{order:i},deviceId)});
}
export function groupItems(items,today){const out={overdue:[],today:[],upcoming:[],undated:[],closed:[]};for(const t of items){const key=!openItem(t)?'closed':!t.date?'undated':t.date<today?'overdue':t.date===today?'today':'upcoming';out[key].push(t)}for(const key in out)out[key]=selectItems(out[key],{order:'date'});return out}
export function selectItems(items,{status='all',scope='all',query='',priority='all',order='date',today}={}){
  const q=query.trim().toLocaleLowerCase('pt-BR');const result=items.filter(t=>!t.deleted&&(status==='all'||(status==='open'?openItem(t):status==='closed'?!openItem(t):t.status===status))&&(priority==='all'||t.priority===priority)&&(!q||(t.title+' '+t.notes).toLocaleLowerCase('pt-BR').includes(q))&&(scope==='all'||(scope==='undated'?!t.date:scope==='today'?t.date===today:scope==='overdue'?!!t.date&&t.date<today&&openItem(t):!!t.date&&t.date>today&&openItem(t))));
  const byDate=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'23:59').localeCompare(b.time||'23:59');const byPriority=(a,b)=>PRIORITIES.findIndex(p=>p.id===a.priority)-PRIORITIES.findIndex(p=>p.id===b.priority);
  return result.sort((a,b)=>(order==='manual'?a.order-b.order:order==='title'?a.title.localeCompare(b.title,'pt-BR'):order==='newest'?b.createdAt.localeCompare(a.createdAt):order==='priority'?byPriority(a,b)||a.order-b.order||byDate(a,b):byDate(a,b)||byPriority(a,b))||a.id.localeCompare(b.id));
}
export function restoreSnapshot(current,candidate,deviceId){const next=structuredClone(validateState(candidate));next.clock=Math.max(current.clock,next.clock);for(const kind of ['areas','items']){for(const [id,entity] of Object.entries(current[kind]))if(!next[kind][id])next[kind][id]={...structuredClone(entity),deleted:true};for(const entity of Object.values(next[kind]))entity.revision=stamp(next,deviceId)}next.updatedAt=new Date().toISOString();return validateState(next)}
