import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem,moveItem,setArchived,selectMovePeers,validateState,selectItems} from '../dist/src/domain.js';
import {Repository,DATA_KEY,browserStorage} from '../dist/src/repository.js';
import {updateFilterIndicator} from '../dist/src/rendering.js';
function fixture(){const s=initialState(),areas=activeAreas(s);for(const [id,extra] of [['a',{}],['hidden',{}],['b',{}],['other',{areaId:areas[1].id}]])updateItem(s,id,{title:id,areaId:areas[0].id,notes:'',date:'',time:'',priority:'normal',status:'pending',...extra},'qa');return s}
test('organização antiga não sobrescreve prioridade, vínculo ou área alterados em outra janela',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},repo=new Repository(storage);
 await repo.commit(()=>{},{replace:fixture()});const revision=JSON.stringify(repo.load().items.a.revision);
 await repo.commit(s=>updateItem(s,'a',{priority:'urgent'},'other'));const before=storage.getItem(DATA_KEY);
 await assert.rejects(repo.commit(s=>moveItem(s,'a',{priority:'normal',areaId:activeAreas(s)[1].id,expectedRevision:revision},'qa')),/mudou/);
 assert.equal(storage.getItem(DATA_KEY),before);assert.equal(repo.load().items.a.priority,'urgent');
});
test('reordenar tarefas visíveis não altera registros arquivados nem seus adiamentos por revisão',()=>{
 const s=fixture();setArchived(s,'hidden',true,'qa');const hidden=structuredClone(s.items.hidden);
 moveItem(s,'b',{beforeId:'a'},'qa');assert.deepEqual(s.items.hidden,hidden);
 assert.deepEqual(selectItems(Object.values(s.items).filter(t=>!t.archived),{order:'manual'}).map(t=>t.id),['b','a','other']);validateState(s);
 assert.throws(()=>moveItem(s,'hidden',{beforeId:'a'},'qa'),/Restaure/);
 assert.throws(()=>moveItem(s,'a',{beforeId:'hidden'},'qa'),/mesmo grupo/);
});
test('pares de reordenação respeitam área, busca, prioridade e subitens correspondentes',()=>{
 const s=fixture(),area=s.items.a.areaId;setArchived(s,'hidden',true,'qa');
 assert.deepEqual(selectMovePeers(s,'a',{area}).map(t=>t.id),['a','b']);
 updateItem(s,'a',{title:'Pesquisar A'},'qa');updateItem(s,'b',{title:'Pesquisar B'},'qa');
 assert.deepEqual(selectMovePeers(s,'a',{query:'Pesquisar'}).map(t=>t.id),['a','b']);
 updateItem(s,'b',{priority:'urgent'},'qa');assert.deepEqual(selectMovePeers(s,'a',{priorityBoard:true}).map(t=>t.id),['a','other']);
 updateItem(s,'child',{title:'Etapa achável',areaId:area,parentId:'a',notes:'',date:'',time:'',priority:'normal',status:'pending'},'qa');
 assert.deepEqual(selectMovePeers(s,'a',{query:'achável'}).map(t=>t.id),['a']);
 assert.deepEqual(selectMovePeers(s,'child',{query:'achável'}).map(t=>t.id),['child']);
});
test('acesso bloqueado ao getter de armazenamento vira erro de recuperação, sem falhar ao criar o adaptador',async()=>{
 const target={get localStorage(){throw new DOMException('Blocked','SecurityError')}};
 const storage=browserStorage(target),repo=new Repository(storage);
 assert.throws(()=>repo.load(),e=>e.code==='LOCAL_STORAGE_FAILED');
 await assert.rejects(repo.commit(()=>{}),e=>e.code==='LOCAL_STORAGE_FAILED');
});
test('indicador acompanha filtros ativos sem substituir o botão ou perder estado de expansão',()=>{
 const label={textContent:''},button={selected:false,classList:{toggle(name,value){button.selected=value}},getAttribute:()=>button.expanded?'true':'false',querySelector:()=>label};
 updateFilterIndicator(button,2);assert.equal(label.textContent,'Filtros · 2');assert.equal(button.selected,true);
 updateFilterIndicator(button,0);assert.equal(label.textContent,'Filtros');assert.equal(button.selected,false);
 button.expanded=true;updateFilterIndicator(button,0);assert.equal(button.selected,true);
});
