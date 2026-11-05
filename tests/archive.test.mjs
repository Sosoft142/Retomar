import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem,validateState,migrateState,visibleItems,archivedItems,setArchived,completedToArchive,removeArea,deleteItem,undoDelete} from '../dist/src/domain.js';
import {Repository,DATA_KEY} from '../dist/src/repository.js';
import {mergeStates,comparable} from '../dist/src/sync/merge.js';
import {sealState,unsealState} from '../dist/src/sync/crypto.js';
import {pushSchedule} from '../dist/src/push.js';
import {dueReminders,defaults} from '../dist/src/planning.js';
const clone=structuredClone;
function fixture(){const s=initialState(),areaId=activeAreas(s)[0].id;for(const [id,fields] of [['parent',{}],['child',{parentId:'parent'}],['done',{status:'done'}],['canceled',{status:'canceled'}]])updateItem(s,id,{title:id,notes:'Preservar',areaId,date:'2026-11-05',time:'14:00',priority:'normal',status:'pending',...fields},'qa');return s;}
test('migração v3 preserva identidade, revisões, conteúdo e vínculos sem modificar a origem',()=>{
 const s=fixture();s.schemaVersion=3;for(const t of Object.values(s.items))delete t.archived;const before=clone(s),next=migrateState(s);assert.deepEqual(s,before);assert.equal(next.schemaVersion,4);
 for(const id in s.items){const {archived,...rest}=next.items[id];assert.equal(archived,false);assert.deepEqual(rest,s.items[id]);}validateState(next);
});
test('qualquer status pode ser arquivado e restaurado sem mudar conteúdo ou status',()=>{
 for(const status of ['pending','doing','done','canceled']){const s=fixture();updateItem(s,'done',{status},'qa');const before=clone(s.items.done);setArchived(s,'done',true,'qa');assert.equal(visibleItems(s).some(t=>t.id==='done'),false);assert.equal(archivedItems(s).some(t=>t.id==='done'),true);setArchived(s,'done',false,'qa');for(const key of ['title','notes','areaId','parentId','date','time','priority','status','order','createdAt'])assert.equal(s.items.done[key],before[key]);validateState(s);}
});
test('arquivo do pai oculta subitens sem competir com revisões e preserva arquivo individual ao restaurar',()=>{
 const s=fixture();setArchived(s,'child',true,'qa');const child=clone(s.items.child);setArchived(s,'parent',true,'qa');assert.deepEqual(s.items.child,child);assert.equal(archivedItems(s).length,2);assert.throws(()=>setArchived(s,'child',false,'qa'),/principal/);setArchived(s,'parent',false,'qa');assert.equal(s.items.child.archived,true);setArchived(s,'child',false,'qa');assert.equal(visibleItems(s).length,4);
});
test('arquivamento em lote preserva pai com subitem aberto e respeita lista filtrada',()=>{
 const s=fixture();updateItem(s,'parent',{status:'done'},'qa');assert.deepEqual(completedToArchive(s).map(t=>t.id),['done']);updateItem(s,'child',{status:'done'},'qa');assert.equal(completedToArchive(s).length,3);assert.deepEqual(completedToArchive(s,[s.items.child]).map(t=>t.id),['child']);
});
test('arquivados e filhos de pai arquivado saem dos lembretes',()=>{
 const s=fixture(),prefs=defaults();prefs.timeZone='America/Sao_Paulo';const now=new Date('2026-11-05T13:00:00Z');assert.ok(dueReminders(s,prefs,now).some(t=>t.item.id==='child'));setArchived(s,'parent',true,'qa');assert.equal(dueReminders(s,prefs,now).some(t=>['parent','child'].includes(t.item.id)),false);
});
test('edição concorrente não é sobrescrita por comando de arquivar antigo',()=>{
 const s=fixture(),revision=JSON.stringify(s.items.done.revision);updateItem(s,'done',{notes:'Outra aba'},'other');assert.throws(()=>setArchived(s,'done',true,'qa',revision),/mudou/);assert.equal(s.items.done.archived,false);
});
test('arquivo e edição offline convergem sem perder filho ou ressuscitar pai',()=>{
 const s=fixture(),a=clone(s),b=clone(s);setArchived(a,'parent',true,'a');updateItem(b,'child',{notes:'Offline'},'b');const merged=mergeStates(a,b);assert.equal(merged.items.child.notes,'Offline');assert.equal(visibleItems(merged).some(t=>t.id==='child'),false);assert.equal(comparable(merged),comparable(mergeStates(b,a)));assert.equal(comparable(merged),comparable(mergeStates(merged,merged)));
});
test('backup e persistência mantêm arquivo; excluir área transfere arquivados; desfazer exclusão preserva arquivo',async()=>{
 const s=fixture();setArchived(s,'parent',true,'qa');const values=new Map([[DATA_KEY,JSON.stringify(s)]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},repo=new Repository(storage);repo.load();await repo.commit(x=>removeArea(x,s.items.parent.areaId,activeAreas(s)[1].id,'qa'));const next=new Repository(storage).load();assert.equal(next.items.parent.archived,true);assert.equal(next.items.child.areaId,activeAreas(s)[1].id);const marker=deleteItem(next,'parent','qa');undoDelete(next,marker,'qa');assert.equal(next.items.parent.archived,true);validateState(next);
});
test('validação recusa estado de arquivo inválido e versão antiga não oculta arquivo silenciosamente',()=>{
 const s=fixture();s.items.done.archived='true';assert.throws(()=>validateState(s));s.items.done.archived=true;s.schemaVersion=3;assert.throws(()=>migrateState(s),/arquivamento/);
});

test('backup criptografado preserva o arquivo e a agenda push omite toda a família arquivada',async()=>{
 const s=fixture(),prefs=defaults(),now=new Date('2026-11-05T13:00:00Z');assert.ok(pushSchedule(s,prefs,{},+now).some(t=>t.item==='child'));setArchived(s,'parent',true,'qa');const sealed=await sealState(s,'fixture-secret');assert.equal((await unsealState(sealed,'fixture-secret')).items.parent.archived,true);assert.equal(pushSchedule(s,prefs,{},+now).some(t=>['parent','child'].includes(t.item)),false);
});
