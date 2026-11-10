import {uid,hasVisibleText,validateState,stamp,updateItem,setArchived} from './domain.js';

// Retém somente os registros alterados. Revisões antigas nunca são reaplicadas.
export function captureChange(state,operation){
  const before={};
  for(const kind of ['areas','items'])before[kind]=new Map(Object.entries(state[kind]).map(([id,value])=>[id,JSON.stringify(value)]));
  operation(state);
  const changes=[];
  for(const kind of ['areas','items'])for(const [id,value] of Object.entries(state[kind])){
    const after=JSON.stringify(value),previous=before[kind].get(id);
    if(previous!==after)changes.push({kind,id,before:previous?JSON.parse(previous):null,after});
  }
  return changes;
}
export function undoChange(state,changes,deviceId){
  if(!Array.isArray(changes)||!changes.length)throw Error('Não há alteração para desfazer.');
  for(const c of changes)if(JSON.stringify(state[c.kind]?.[c.id])!==c.after)throw Error('Uma tarefa ou área desta alteração mudou depois. Confira a versão atual antes de tentar novamente.');
  const next=structuredClone(state),now=new Date().toISOString();
  for(const c of changes){
    const record=c.before?structuredClone(c.before):{...next[c.kind][c.id],deleted:true};
    record.revision=stamp(next,deviceId);if(c.kind==='items')record.updatedAt=now;
    next[c.kind][c.id]=record;
  }
  // Uma tarefa nova pode ter recebido subitens depois da criação.
  try{validateState(next)}catch{throw Error('Há vínculos ou áreas que mudaram depois. Esta alteração não pode ser desfeita com segurança.');}
  Object.assign(state,next);
}
export function batchTargets(state,ids){
  return [...new Set(ids)].map(id=>{const t=state.items[id];if(!t||t.deleted)throw Error('Uma tarefa selecionada não está mais disponível.');return {id,revision:JSON.stringify(t.revision)};});
}
export function bulkChange(state,targets,change,deviceId){
  if(!Array.isArray(targets)||!targets.length)throw Error('Selecione pelo menos uma tarefa.');
  const ids=new Set(targets.map(t=>t.id));
  if(ids.size!==targets.length)throw Error('A seleção contém tarefas repetidas.');
  for(const target of targets){const t=state.items[target.id];if(!t||t.deleted||JSON.stringify(t.revision)!==target.revision)throw Error('Uma tarefa selecionada mudou em outra janela. Confira a seleção e tente novamente.');}
  const next=structuredClone(state),tasks=targets.map(t=>next.items[t.id]).sort((a,b)=>Number(!!a.parentId)-Number(!!b.parentId));
  if(!['deadline','area','priority','status','archive'].includes(change.kind))throw Error('Escolha uma alteração válida.');
  if(change.kind==='area')for(const t of tasks)if(t.parentId&&!ids.has(t.parentId)&&change.areaId!==t.areaId)throw Error('Para transferir um subitem de área, selecione também a tarefa principal.');
  for(const t of tasks){
    if(change.kind==='archive'){setArchived(next,t.id,change.archived,deviceId);continue;}
    let fields;
    if(change.kind==='deadline')fields=change.clear?{date:'',time:''}:{date:change.date,time:change.timeMode==='keep'?t.time:change.timeMode==='clear'?'':change.time};
    else if(change.kind==='area'){
      if(t.parentId&&ids.has(t.parentId))continue;
      fields={areaId:change.areaId};
    }else fields={[change.kind]:change.value};
    updateItem(next,t.id,fields,deviceId);
  }
  validateState(next);Object.assign(state,next);
}

const oneOf=(value,choices,fallback)=>choices.includes(value)?value:fallback;
export function cleanView(view={}){
  return {page:'plan',archiveMode:view.archiveMode===true,area:typeof view.area==='string'?view.area.slice(0,100):'all',
    status:oneOf(view.status,['all','open','pending','doing','done','canceled'],'all'),scope:oneOf(view.scope,['all','overdue','today','upcoming','undated'],'all'),
    query:typeof view.query==='string'?view.query.slice(0,200):'',priorityFilter:oneOf(view.priorityFilter,['all','urgent','high','normal','low'],'all'),
    layout:oneOf(view.layout,['compact','cards'],'compact'),groupBy:oneOf(view.groupBy,['none','area','priority','date'],'none'),
    sortOrder:oneOf(view.sortOrder,['manual','priority','date','title','newest'],'manual'),subitemOrder:oneOf(view.subitemOrder,['manual','priority','date'],'manual')};
}
export const VIEWS_KEY='entrelinhas-vida:views:v1';
export class SavedViews{
  constructor(storage,target=globalThis){this.storage=storage;this.target=target;}
  load(){
    const raw=this.storage.getItem(VIEWS_KEY);if(raw===null)return [];
    let values;try{values=JSON.parse(raw)}catch{throw Error('As visualizações salvas estão ilegíveis. Os dados existentes foram preservados.');}
    if(!Array.isArray(values)||values.length>20||values.some(v=>!v||typeof v.id!=='string'||!hasVisibleText(v.name)||v.name.length>60||typeof v.revision!=='string'||!v.view||typeof v.view!=='object')||new Set(values.map(v=>v.id)).size!==values.length)throw Error('As visualizações salvas precisam de recuperação. Os dados existentes foram preservados.');
    return values.map(v=>({...v,view:cleanView(v.view)}));
  }
  async edit(operation){
    const run=()=>{const values=this.load(),next=operation(values),raw=JSON.stringify(next);this.storage.setItem(VIEWS_KEY,raw);if(this.storage.getItem(VIEWS_KEY)!==raw)throw Error('Não foi possível salvar as visualizações neste aparelho.');return next;};
    return this.target.navigator?.locks?this.target.navigator.locks.request(VIEWS_KEY,run):run();
  }
  save(name,view,{id=null,expectedRevision=null}={}){
    name=name.trim();if(!hasVisibleText(name)||name.length>60)throw Error('Use um nome visível com até 60 caracteres.');
    return this.edit(values=>{
      const old=id?values.find(v=>v.id===id):null;
      if(id&&(!old||old.revision!==expectedRevision))throw Error('Esta visualização mudou em outra janela. Abra a lista novamente.');
      if(values.some(v=>v.id!==id&&v.name.normalize('NFC').toLocaleLowerCase('pt-BR')===name.normalize('NFC').toLocaleLowerCase('pt-BR')))throw Error('Já existe uma visualização com esse nome.');
      if(!id&&values.length>=20)throw Error('O limite é de 20 visualizações. Remova uma antes de salvar outra.');
      const record={id:id||uid(),name,view:cleanView(view),revision:uid()};
      return id?values.map(v=>v.id===id?record:v):[...values,record];
    });
  }
  remove(id,expectedRevision){return this.edit(values=>{const old=values.find(v=>v.id===id);if(!old||old.revision!==expectedRevision)throw Error('Esta visualização mudou. Abra a lista novamente.');return values.filter(v=>v.id!==id);});}
}
