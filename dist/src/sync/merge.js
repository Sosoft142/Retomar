import {APP_ID,SCHEMA_VERSION,validateState,migrateState,COLORS} from '../domain.js';
export function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'}
export function comparable(s){return canonical({appId:s.appId,schemaVersion:s.schemaVersion,datasetId:s.datasetId,clock:s.clock,areas:s.areas,items:s.items})}
export function compareRevision(a,b){return a.counter-b.counter||(a.deviceId<b.deviceId?-1:a.deviceId>b.deviceId?1:0)}
export const pristine=s=>s.clock===0&&Object.keys(s.items).length===0&&Object.values(s.areas).every(a=>a.revision.counter===0&&a.revision.deviceId==='initial');
export function mergeStates(left,right){
  const a=migrateState(left),b=migrateState(right);if(a.datasetId!==b.datasetId)throw Error('Os conjuntos de dados são diferentes.');
  const out={appId:APP_ID,schemaVersion:SCHEMA_VERSION,datasetId:a.datasetId,clock:Math.max(a.clock,b.clock),updatedAt:a.updatedAt>b.updatedAt?a.updatedAt:b.updatedAt,areas:{},items:{}};
  for(const kind of ['areas','items'])for(const id of [...new Set([...Object.keys(a[kind]),...Object.keys(b[kind])])].sort()){
    const x=a[kind][id],y=b[kind][id];let winner;if(!x||!y)winner=x||y;else{const diff=compareRevision(x.revision,y.revision);winner=diff>0?x:diff<0?y:canonical(x)>=canonical(y)?x:y}out[kind][id]=structuredClone(winner);
  }
  let repairRevision;
  const revision=()=>{if(!repairRevision){if(out.clock>=Number.MAX_SAFE_INTEGER)throw Error('O limite de revisões foi atingido.');repairRevision={counter:++out.clock,deviceId:'merge-repair'};}return repairRevision};
  const touch=t=>{t.revision=revision();t.updatedAt=out.updatedAt};
  const items=Object.values(out.items).filter(t=>!t.deleted);
  // Decide todos os vínculos inválidos antes de reparar: o resultado não depende da ordem.
  const broken=items.filter(t=>t.parentId&&(!out.items[t.parentId]||out.items[t.parentId].deleted||out.items[t.parentId].parentId||t.parentId===t.id));
  for(const t of broken){t.parentId='';touch(t);}
  const recovered='retomar-recuperados';
  if(!Object.values(out.areas).some(x=>!x.deleted)||items.some(t=>!t.parentId&&out.areas[t.areaId]?.deleted)){
    if(!out.areas[recovered]||out.areas[recovered].deleted)out.areas[recovered]={id:recovered,name:'Recuperados',color:COLORS[10],order:Math.max(0,...Object.values(out.areas).map(x=>x.order))+1,deleted:false,revision:revision()};
    for(const t of items.filter(t=>!t.parentId&&out.areas[t.areaId]?.deleted)){t.areaId=recovered;touch(t);}
  }
  // Normalizar a área herdada não deve competir com uma edição offline do subitem.
  for(const t of items.filter(t=>t.parentId))t.areaId=out.items[t.parentId].areaId;
  return validateState(out);
}
export function mergeLocal(local,remote){return pristine(local)?structuredClone(migrateState(remote)):mergeStates(local,remote)}
