import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem,setArchived,moveItem,reorderAreas,validateState,isArchived,deleteItem} from '../dist/src/domain.js';
import {captureChange,undoChange,bulkChange,batchTargets,SavedViews,VIEWS_KEY,cleanView} from '../dist/src/workflows.js';
import {Repository,DATA_KEY} from '../dist/src/repository.js';
import {mergeStates} from '../dist/src/sync/merge.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
function fixture(){const s=initialState(),[a,b]=activeAreas(s);for(const [id,parentId] of [['p',''],['c','p'],['b','']])updateItem(s,id,{title:id,notes:'Preservar',areaId:a.id,parentId,date:'2026-11-12',time:id==='c'?'00:00':'14:35',priority:'normal',status:'pending'},'qa');return {s,a,b};}
const withoutRevision=t=>{const {revision,updatedAt,...fields}=t;return fields;};
test('desfazer prazo e prioridade restaura conteúdo com revisão nova, sem voltar o relógio',()=>{
 const {s}=fixture(),before=structuredClone(s.items.p),changes=captureChange(s,s=>updateItem(s,'p',{date:'2026-12-01',priority:'urgent'},'qa')),clock=s.clock;
 undoChange(s,changes,'qa');assert.deepEqual(withoutRevision(s.items.p),withoutRevision(before));assert.ok(s.clock>clock);assert.ok(s.items.p.revision.counter>clock);validateState(s);
});
test('desfazer área inclui subitens derivados e preserva vínculos e cores próprias',()=>{
 const {s,b}=fixture();updateItem(s,'c',{color:'#123456'},'qa');const before=structuredClone(s),changes=captureChange(s,s=>updateItem(s,'p',{areaId:b.id},'qa'));
 assert.equal(changes.length,2);undoChange(s,changes,'qa');assert.equal(s.items.c.areaId,before.items.c.areaId);assert.equal(s.items.c.color,'#123456');assert.equal(s.items.c.parentId,'p');validateState(s);
});
test('desfazer recusa alteração posterior e conserva todos os bytes ao falhar',()=>{
 const {s}=fixture(),changes=captureChange(s,s=>updateItem(s,'p',{priority:'high'},'qa'));updateItem(s,'p',{notes:'Outra janela'},'remote');const raw=JSON.stringify(s);
 assert.throws(()=>undoChange(s,changes,'qa'),/mudou depois/);assert.equal(JSON.stringify(s),raw);
});
test('desfazer preserva alterações independentes de outra tarefa e converge na sincronização',()=>{
 const {s}=fixture(),before=structuredClone(s),changes=captureChange(s,s=>updateItem(s,'p',{priority:'high'},'qa'));
 const remote=structuredClone(s);updateItem(remote,'b',{notes:'Alteração remota'},'remote');undoChange(s,changes,'qa');const merged=mergeStates(s,remote);
 assert.equal(merged.items.p.priority,before.items.p.priority);assert.equal(merged.items.b.notes,'Alteração remota');validateState(merged);
});
test('desfazer criação mantém tombstone e recusa quebra de subitem criado depois',()=>{
 const {s,a}=fixture(),changes=captureChange(s,s=>updateItem(s,'new',{title:'Nova',areaId:a.id,notes:'',date:'',time:'',priority:'normal',status:'pending'},'qa'));
 const childState=structuredClone(s);updateItem(childState,'late',{title:'Etapa',parentId:'new',notes:'',date:'',time:'',priority:'normal',status:'pending'},'remote');const raw=JSON.stringify(childState);
 assert.throws(()=>undoChange(childState,changes,'qa'),/vínculos/);assert.equal(JSON.stringify(childState),raw);undoChange(s,changes,'qa');assert.equal(s.items.new.deleted,true);validateState(s);
});
test('desfazer arquivamento do pai preserva arquivo individual anterior',()=>{
 const {s}=fixture();setArchived(s,'c',true,'qa');const changes=captureChange(s,s=>setArchived(s,'p',true,'qa'));undoChange(s,changes,'qa');assert.equal(s.items.p.archived,false);assert.equal(s.items.c.archived,true);validateState(s);
});
test('desfazer exclusão restaura tarefa, subitens e conteúdo sem ressuscitar exclusões antigas',()=>{
 const {s}=fixture();updateItem(s,'old',{title:'Antiga',parentId:'p',notes:'',date:'',time:'',priority:'normal',status:'done'},'qa');deleteItem(s,'old','qa');const before=structuredClone(s),changes=captureChange(s,s=>deleteItem(s,'p','qa'));
 undoChange(s,changes,'qa');assert.equal(s.items.p.deleted,false);assert.equal(s.items.c.deleted,false);assert.deepEqual(s.items.old,before.items.old);assert.equal(s.items.c.parentId,'p');validateState(s);
});
test('desfazer reordenação recupera posições de todos os pares alterados',()=>{
 const {s}=fixture(),before=Object.fromEntries(Object.values(s.items).map(t=>[t.id,t.order])),changes=captureChange(s,s=>moveItem(s,'b',{beforeId:'p'},'qa'));
 undoChange(s,changes,'qa');for(const [id,order] of Object.entries(before))assert.equal(s.items[id].order,order);validateState(s);
 const areas=structuredClone(s.areas),areaChange=captureChange(s,s=>reorderAreas(s,activeAreas(s)[1].id,activeAreas(s)[0].id,'qa'));undoChange(s,areaChange,'qa');for(const id in areas)assert.equal(s.areas[id].order,areas[id].order);
});
test('lote de prazos respeita meia-noite, preserva horários distintos e não toca tarefas fora da seleção',()=>{
 const {s}=fixture(),other=structuredClone(s.items.b);bulkChange(s,batchTargets(s,['p','c']),{kind:'deadline',date:'2026-11-20',timeMode:'keep'},'qa');assert.equal(s.items.p.time,'14:35');assert.equal(s.items.c.time,'00:00');assert.equal(s.items.c.date,'2026-11-20');assert.deepEqual(s.items.b,other);
 bulkChange(s,batchTargets(s,['p']),{kind:'deadline',clear:true},'qa');assert.equal(s.items.p.time,'');assert.equal(s.items.p.date,'');assert.equal(s.items.c.date,'2026-11-20');
});
test('data inválida, destino removido ou revisão antiga recusam o lote inteiro',()=>{
 for(const change of [{kind:'deadline',date:'2026-02-30',timeMode:'keep'},{kind:'area',areaId:'missing'},{kind:'priority',value:'fake'}]){const {s}=fixture(),raw=JSON.stringify(s);assert.throws(()=>bulkChange(s,batchTargets(s,['p','b']),change,'qa'));assert.equal(JSON.stringify(s),raw);}
 const {s}=fixture(),targets=batchTargets(s,['p','b']);updateItem(s,'b',{notes:'Outra janela'},'remote');const raw=JSON.stringify(s);assert.throws(()=>bulkChange(s,targets,{kind:'status',value:'done'},'qa'),/mudou em outra janela/);assert.equal(JSON.stringify(s),raw);
});
test('transferência em lote mantém famílias e exige selecionar o pai de um subitem',()=>{
 const {s,b}=fixture(),raw=JSON.stringify(s);assert.throws(()=>bulkChange(s,batchTargets(s,['c']),{kind:'area',areaId:b.id},'qa'),/tarefa principal/);assert.equal(JSON.stringify(s),raw);
 bulkChange(s,batchTargets(s,['c','p']),{kind:'area',areaId:b.id},'qa');assert.equal(s.items.p.areaId,b.id);assert.equal(s.items.c.areaId,b.id);assert.equal(s.items.c.parentId,'p');validateState(s);
});
test('arquivar/restaurar seleção respeita pais e arquivos individuais',()=>{
 const {s}=fixture();bulkChange(s,batchTargets(s,['p']),{kind:'archive',archived:true},'qa');assert.ok(isArchived(s,s.items.c));const raw=JSON.stringify(s);
 assert.throws(()=>bulkChange(s,batchTargets(s,['c']),{kind:'archive',archived:false},'qa'),/principal/);assert.equal(JSON.stringify(s),raw);
 bulkChange(s,batchTargets(s,['c','p']),{kind:'archive',archived:false},'qa');assert.equal(isArchived(s,s.items.c),false);validateState(s);
});
test('lote e desfazer persistem após reabrir e usam revisões monotônicas',async()=>{
 const storage=memory(),repo=new Repository(storage),{s}=fixture();await repo.commit(()=>{},{replace:s});let changes;
 await repo.commit(s=>{changes=captureChange(s,s=>bulkChange(s,batchTargets(s,['p','b']),{kind:'priority',value:'urgent'},'qa'));});
 const changed=repo.load().clock;await repo.commit(s=>undoChange(s,changes,'qa'));const reopened=new Repository(storage).load();assert.ok(reopened.clock>changed);assert.equal(reopened.items.p.priority,'normal');validateState(JSON.parse(storage.getItem(DATA_KEY)));
});
test('visualizações restauram combinações sem guardar itens, credenciais ou campos desconhecidos',async()=>{
 const storage=memory(),views=new SavedViews(storage,{}),view={area:'',status:'open',scope:'today',query:'café',priorityFilter:'high',layout:'cards',groupBy:'priority',sortOrder:'date',subitemOrder:'priority',token:'segredo',items:{p:'não guardar'}};
 await views.save('Hoje',view);const saved=new SavedViews(storage,{}).load()[0];assert.equal(saved.view.area,'');assert.equal(saved.view.layout,'cards');assert.equal(saved.view.scope,'today');assert.equal(saved.view.query,'café');assert.ok(!storage.getItem(VIEWS_KEY).includes('segredo'));assert.ok(!storage.getItem(VIEWS_KEY).includes('não guardar'));assert.deepEqual(saved.view,cleanView(view));
});
test('visualizações antigas ou adulteradas normalizam filtros sem injetar campos',()=>{assert.deepEqual(cleanView({status:'fake',layout:'fake',area:1,query:'a'.repeat(300),archiveMode:true}),{page:'plan',archiveMode:true,area:'all',status:'all',scope:'all',query:'a'.repeat(200),priorityFilter:'all',layout:'compact',groupBy:'none',sortOrder:'manual',subitemOrder:'manual'});});
test('renomear e remover não sobrescrevem revisão concorrente nem outras visualizações',async()=>{
 const storage=memory(),a=new SavedViews(storage,{}),b=new SavedViews(storage,{});await a.save('Uma',{});const first=a.load()[0];await b.save('Duas',{});await a.save('Nova',first.view,{id:first.id,expectedRevision:first.revision});assert.equal(a.load().length,2);
 await assert.rejects(b.remove(first.id,first.revision),/mudou/);const updated=a.load().find(v=>v.id===first.id);await a.remove(updated.id,updated.revision);assert.equal(a.load()[0].name,'Duas');
});
test('nomes duplicados, invisíveis e limite não alteram visualizações existentes',async()=>{
 const storage=memory(),views=new SavedViews(storage,{});await views.save('Café',{});const raw=storage.getItem(VIEWS_KEY);await assert.rejects(views.save('cafe\u0301',{}),/Já existe/);assert.equal(storage.getItem(VIEWS_KEY),raw);assert.throws(()=>views.save('\u200b',{}),/visível/);
 for(let i=1;i<20;i++)await views.save('Vista '+i,{});const full=storage.getItem(VIEWS_KEY);await assert.rejects(views.save('Outra',{}),/limite/);assert.equal(storage.getItem(VIEWS_KEY),full);
});
test('armazenamento corrompido e falha de gravação não são apresentados como sucesso',async()=>{
 const storage=memory();storage.setItem(VIEWS_KEY,'{bad');const views=new SavedViews(storage,{});assert.throws(()=>views.load(),/ilegíveis/);await assert.rejects(views.save('Uma',{}),/ilegíveis/);assert.equal(storage.getItem(VIEWS_KEY),'{bad');
 const fail=new SavedViews({getItem:()=>null,setItem:()=>{throw Error('quota')}},{});await assert.rejects(fail.save('Uma',{}),/quota/);
});
