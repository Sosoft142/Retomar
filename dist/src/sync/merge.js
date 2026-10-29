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
  const orphaned=Object.values(out.items).filter(t=>!t.deleted&&out.areas[t.areaId]?.deleted);
  if(!Object.values(out.areas).some(x=>!x.deleted)||orphaned.length){
    const id='retomar-recuperados';if(out.clock>=Number.MAX_SAFE_INTEGER)throw Error('O limite de revisões foi atingido.');
    const revision={counter:out.clock+1,deviceId:'merge-repair'};out.clock++;
    if(!out.areas[id]||out.areas[id].deleted)out.areas[id]={id,name:'Recuperados',color:COLORS[10],order:Math.max(0,...Object.values(out.areas).map(x=>x.order))+1,deleted:false,revision};
    for(const t of orphaned){t.areaId=id;t.revision=revision;t.updatedAt=out.updatedAt}
  }
  return validateState(out);
}
export function mergeLocal(local,remote){return pristine(local)?structuredClone(migrateState(remote)):mergeStates(local,remote)}
