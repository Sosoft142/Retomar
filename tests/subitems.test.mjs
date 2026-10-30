import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateState,migrateState,activeAreas,activeItems,rootItems,subitemsOf,updateItem,deleteItem,undoDelete,moveItem,removeArea,restoreSnapshot,selectItems,selectPlanningItems,groupItems,stamp,SCHEMA_VERSION} from '../dist/src/domain.js';
import {Repository,DATA_KEY} from '../dist/src/repository.js';
import {mergeStates,comparable} from '../dist/src/sync/merge.js';
import {sealState,unsealState} from '../dist/src/sync/crypto.js';
import {SyncEngine} from '../dist/src/sync/engine.js';
const clone=structuredClone;
const disk=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
function add(s,id,extra={},device='A'){return updateItem(s,id,{title:'Fictício '+id,notes:'',areaId:activeAreas(s)[0].id,parentId:'',status:'pending',priority:'normal',date:'',time:'',...extra},device)}
function fixture(){const s=initialState();add(s,'parent');add(s,'other',{areaId:activeAreas(s)[1].id});add(s,'child-a',{parentId:'parent',priority:'low'});add(s,'child-b',{parentId:'parent',priority:'urgent',status:'doing',date:'2200-12-31',time:'23:59'});return s}

test('subitens persistem com identidade, prioridade, status, data e ordem independentes',async()=>{
  const storage=disk(),repo=new Repository(storage),state=fixture();await repo.commit(()=>{},{replace:state});const loaded=new Repository(storage).load();
  assert.equal(rootItems(loaded).length,2);assert.equal(subitemsOf(loaded,'parent').length,2);
  assert.equal(loaded.items['child-b'].priority,'urgent');assert.equal(loaded.items['child-b'].status,'doing');assert.equal(loaded.items['child-b'].date,'2200-12-31');assert.equal(loaded.items['child-b'].time,'23:59');
  assert.equal(loaded.items['child-a'].order,0);assert.equal(loaded.items['child-b'].order,1);validateState(loaded);
});
test('migração do esquema 2 preserva todos os campos anteriores sem alterar o arquivo de origem',()=>{
  const current=initialState();add(current,'legacy');const old=clone(current);old.schemaVersion=2;for(const t of Object.values(old.items))delete t.parentId;const before=clone(old),next=migrateState(old);
  assert.equal(next.schemaVersion,SCHEMA_VERSION);assert.equal(next.items.legacy.parentId,'');const {parentId,...rest}=next.items.legacy;assert.deepEqual(rest,old.items.legacy);assert.deepEqual(old,before);validateState(next);
});
test('vínculo de subitem não é descartado silenciosamente em arquivo que declara esquema antigo',()=>{const s=fixture();s.schemaVersion=2;assert.throws(()=>migrateState(s),/contém vínculos/)});
test('subitem herda a área e sua edição não modifica a revisão do item principal',()=>{
  const s=fixture(),before=clone(s.items.parent);assert.equal(s.items['child-a'].areaId,s.items.parent.areaId);
  updateItem(s,'child-a',{priority:'high',notes:'Nota independente',status:'done'},'B');assert.deepEqual(s.items.parent,before);assert.equal(s.items['child-b'].status,'doing');validateState(s);
});
test('referências ausentes, ciclos, níveis adicionais e áreas incoerentes são recusados',()=>{
  for(const change of [s=>s.items['child-a'].parentId='missing',s=>s.items['child-a'].parentId='child-a',s=>s.items['child-a'].parentId='child-b',s=>s.items.parent.parentId='child-a',s=>s.items.parent.deleted=true,s=>s.items['child-a'].areaId=s.items.other.areaId,s=>s.items['child-a'].parentId=null]){const s=fixture();change(s);assert.throws(()=>validateState(s))}
});
test('item com subitens não pode ser aninhado e operação inválida preserva o armazenamento',async()=>{
  const storage=disk(),repo=new Repository(storage);await repo.commit(()=>{},{replace:fixture()});const before=storage.getItem(DATA_KEY);
  await assert.rejects(repo.commit(s=>moveItem(s,'parent',{parentId:'other'},'B')),/já tem subitens/);assert.equal(storage.getItem(DATA_KEY),before);
  await assert.rejects(repo.commit(s=>updateItem(s,'child-a',{parentId:'missing'},'B')));assert.equal(storage.getItem(DATA_KEY),before);
});
test('ordem manual dos subitens não altera a ordem nem as revisões dos itens principais',()=>{
  const s=fixture(),parent=clone(s.items.parent),other=clone(s.items.other);moveItem(s,'child-b',{beforeId:'child-a'},'B');
  assert.deepEqual(selectItems(subitemsOf(s,'parent'),{order:'manual'}).map(t=>t.id),['child-b','child-a']);assert.deepEqual(s.items.parent,parent);assert.deepEqual(s.items.other,other);
  const children=clone(subitemsOf(s,'parent'));moveItem(s,'other',{beforeId:'parent'},'B');assert.deepEqual(subitemsOf(s,'parent'),children);validateState(s);
});
test('posição de outro grupo é rejeitada sem gravar alterações parciais',async()=>{const storage=disk(),repo=new Repository(storage);await repo.commit(()=>{},{replace:fixture()});const before=storage.getItem(DATA_KEY);await assert.rejects(repo.commit(s=>moveItem(s,'child-a',{beforeId:'other'},'B')),/mesmo grupo/);assert.equal(storage.getItem(DATA_KEY),before)});
test('subitens ordenam por prioridade ou data sem mudar sua ordem manual',()=>{
  const s=fixture(),before=subitemsOf(s,'parent').map(t=>[t.id,t.order]);assert.equal(selectItems(subitemsOf(s,'parent'),{order:'priority'})[0].id,'child-b');assert.equal(selectItems(subitemsOf(s,'parent'),{order:'date'})[0].id,'child-b');assert.deepEqual(subitemsOf(s,'parent').map(t=>[t.id,t.order]),before);
});
test('mover para outro item ou promover conserva ID, conteúdo e prioridade',()=>{
  const s=fixture(),before=clone(s.items['child-a']);moveItem(s,'child-a',{parentId:'other'},'B');assert.equal(s.items['child-a'].areaId,s.items.other.areaId);assert.equal(s.items['child-a'].parentId,'other');
  moveItem(s,'child-a',{parentId:'',areaId:s.items.parent.areaId},'B');assert.equal(s.items['child-a'].parentId,'');for(const key of ['id','title','notes','status','priority','createdAt'])assert.equal(s.items['child-a'][key],before[key]);validateState(s);
});
test('trocar área do pai move a área herdada sem simular uma edição dos subitens',()=>{
  const s=fixture(),before=clone(s.items['child-a']),area=activeAreas(s)[2].id;updateItem(s,'parent',{areaId:area},'A');assert.equal(s.items['child-a'].areaId,area);assert.deepEqual(s.items['child-a'].revision,before.revision);assert.equal(s.items['child-a'].updatedAt,before.updatedAt);validateState(s);
});
test('excluir área conserva o vínculo e transfere subitens abertos e encerrados',()=>{
  const s=fixture(),area=s.items.parent.areaId,target=activeAreas(s)[2].id;updateItem(s,'child-b',{status:'done'},'A');removeArea(s,area,target,'B');for(const id of ['parent','child-a','child-b'])assert.equal(s.items[id].areaId,target);assert.equal(s.items['child-b'].parentId,'parent');assert.equal(s.items['child-b'].status,'done');validateState(s);
});
test('concluir item principal não muda automaticamente o status dos subitens',()=>{const s=fixture();updateItem(s,'parent',{status:'done'},'A');assert.equal(s.items['child-a'].status,'pending');assert.equal(s.items['child-b'].status,'doing');assert.ok(selectPlanningItems(activeItems(s),{status:'open'}).some(t=>t.id==='parent'));validateState(s)});
test('busca e filtros de subitens revelam o item principal uma única vez',()=>{
  const s=fixture();updateItem(s,'child-a',{notes:'Palavra para procurar'},'A');updateItem(s,'child-b',{notes:'Palavra para procurar'},'A');
  assert.deepEqual(selectPlanningItems(activeItems(s),{query:'PROCURAR'}).map(t=>t.id),['parent']);assert.deepEqual(selectPlanningItems(activeItems(s),{priority:'urgent',status:'doing'}).map(t=>t.id),['parent']);assert.deepEqual(selectPlanningItems(activeItems(s),{query:'inexistente'}),[]);
});
test('cronograma considera a data e o status próprios de cada subitem',()=>{
  const s=fixture();updateItem(s,'parent',{date:'2200-12-31'},'A');updateItem(s,'child-a',{date:'1900-01-01'},'A');const groups=groupItems(activeItems(s),'2026-10-29');assert.ok(groups.overdue.some(t=>t.id==='child-a'));assert.ok(groups.upcoming.some(t=>t.id==='parent'));assert.ok(groups.upcoming.some(t=>t.id==='child-b'));
});
test('exclusão do pai e desfazer preservam estados e não ressuscitam subitens já excluídos',()=>{
  const s=fixture();add(s,'old-deleted',{parentId:'parent'});deleteItem(s,'old-deleted','A');const oldRevision=clone(s.items['old-deleted'].revision);updateItem(s,'child-b',{status:'done'},'A');
  const marker=deleteItem(s,'parent','A');assert.equal(marker.subitems.length,2);for(const id of ['parent','child-a','child-b'])assert.equal(s.items[id].deleted,true);
  undoDelete(s,marker,'B');assert.equal(s.items['child-b'].status,'done');for(const id of ['parent','child-a','child-b'])assert.equal(s.items[id].deleted,false);assert.equal(s.items['old-deleted'].deleted,true);assert.deepEqual(s.items['old-deleted'].revision,oldRevision);validateState(s);
});
test('desfazer rejeita alteração concorrente em subitem sem restaurar só parte do grupo',async()=>{
  const storage=disk(),repo=new Repository(storage);await repo.commit(()=>{},{replace:fixture()});let marker;await repo.commit(s=>{marker=deleteItem(s,'parent','A')});await repo.commit(s=>s.items['child-a'].revision=stamp(s,'B'));const before=storage.getItem(DATA_KEY);await assert.rejects(repo.commit(s=>undoDelete(s,marker,'A')),/outra alteração/);assert.equal(storage.getItem(DATA_KEY),before);
});
test('desfazer subitem após exclusão do pai o recupera como item principal',()=>{const s=fixture(),marker=deleteItem(s,'child-a','A');deleteItem(s,'parent','A');undoDelete(s,marker,'B');assert.equal(s.items['child-a'].parentId,'');assert.equal(s.items.parent.deleted,true);validateState(s)});
test('restaurar backup anterior aos subitens cria tombstones sem perder os IDs conhecidos',()=>{
  const s=fixture(),backup=clone(s);delete backup.items['child-a'];delete backup.items['child-b'];backup.schemaVersion=2;for(const t of Object.values(backup.items))delete t.parentId;const restored=restoreSnapshot(s,migrateState(backup),'B');assert.equal(restored.items['child-a'].deleted,true);assert.equal(restored.items['child-b'].deleted,true);assert.equal(restored.items.parent.deleted,false);validateState(restored);
});
test('criações offline e edições em subitens diferentes convergem sem sobrescrever o pai',()=>{
  const base=initialState();add(base,'parent');const a=clone(base),b=clone(base);add(a,'child-a',{parentId:'parent',priority:'urgent'},'A');add(b,'child-b',{parentId:'parent',priority:'low'},'B');const merged=mergeStates(a,b);assert.equal(subitemsOf(merged,'parent').length,2);assert.deepEqual(merged.items.parent,base.items.parent);
  const left=clone(merged),right=clone(merged);updateItem(left,'child-a',{notes:'Offline A'},'A');updateItem(right,'child-b',{status:'done'},'B');const next=mergeStates(left,right);assert.equal(next.items['child-a'].notes,'Offline A');assert.equal(next.items['child-b'].status,'done');assert.equal(comparable(next),comparable(mergeStates(right,left)));assert.equal(comparable(next),comparable(mergeStates(next,next)));
});
test('movimento do pai e edição offline do filho preservam o texto e a área herdada',()=>{
  const base=fixture(),a=clone(base),b=clone(base),area=activeAreas(base)[2].id;updateItem(a,'parent',{areaId:area},'A');updateItem(b,'child-a',{notes:'Nota offline que deve sobreviver'},'B');const merged=mergeStates(a,b);assert.equal(merged.items['child-a'].notes,'Nota offline que deve sobreviver');assert.equal(merged.items['child-a'].areaId,area);assert.deepEqual(merged.items['child-a'].revision,b.items['child-a'].revision);assert.equal(comparable(merged),comparable(mergeStates(b,a)));validateState(merged);
});
test('subitem criado enquanto o pai é excluído é recuperado sem ressuscitar o pai',()=>{
  const base=initialState();add(base,'parent');const a=clone(base),b=clone(base);deleteItem(a,'parent','A');add(b,'late-child',{parentId:'parent',notes:'Preservar'},'B');const merged=mergeStates(a,b);assert.equal(merged.items.parent.deleted,true);assert.equal(merged.items['late-child'].deleted,false);assert.equal(merged.items['late-child'].parentId,'');assert.equal(merged.items['late-child'].notes,'Preservar');assert.equal(comparable(merged),comparable(mergeStates(b,a)));validateState(merged);
});
test('ciclo causado por duas reorganizações concorrentes é reparado de forma determinística',()=>{
  const base=initialState();add(base,'one');add(base,'two');const a=clone(base),b=clone(base);moveItem(a,'one',{parentId:'two'},'A');moveItem(b,'two',{parentId:'one'},'B');const merged=mergeStates(a,b);assert.equal(rootItems(merged).length,2);assert.equal(comparable(merged),comparable(mergeStates(b,a)));assert.equal(comparable(merged),comparable(mergeStates(merged,merged)));validateState(merged);
});
test('backup criptografado conserva vínculos e não expõe títulos dos subitens',async()=>{const s=fixture(),secret='token-ficticio-subitens-123';const content=await sealState(s,secret);assert.ok(!content.includes('Fictício child-a'));assert.equal(comparable(await unsealState(content,secret)),comparable(s))});
test('motor sincroniza novos subitens com uma cópia remota do esquema anterior e relê antes do verde',async()=>{
  const storage=disk(),repo=new Repository(storage),base=initialState();add(base,'parent');let remote=clone(base);remote.schemaVersion=2;delete remote.items.parent.parentId;await repo.commit(()=>{},{replace:base});await repo.commit(s=>add(s,'child',{parentId:'parent',priority:'urgent'}));let reads=0,writes=0,confirmed=false;
  const engine=new SyncEngine({repo,gistId:'abcde06000',secret:'qa',adapter:{read:async()=>{reads++;return JSON.stringify(remote)},write:async(id,text)=>{writes++;remote=JSON.parse(text)}},seal:async s=>JSON.stringify(s),unseal:async text=>migrateState(JSON.parse(text)),onConfirmed:()=>{assert.ok(reads>=2);confirmed=true}});
  await engine.run();engine.stop();assert.equal(writes,1);assert.equal(confirmed,true);assert.equal(remote.schemaVersion,SCHEMA_VERSION);assert.equal(remote.items.child.parentId,'parent');assert.equal(remote.items.child.priority,'urgent');validateState(repo.load());
});
test('400 operações reproduzíveis com hierarquia conservam referências, persistência e convergência',async()=>{
  let seed=0x600;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/0x100000000*n)},storage=disk(),repo=new Repository(storage);await repo.commit(()=>{},{replace:fixture()});let seq=0;
  for(let i=0;i<400;i++){
    await repo.commit(s=>{const roots=rootItems(s),root=roots[random(roots.length)],children=activeItems(s).filter(t=>t.parentId),child=children[random(children.length)];switch(random(7)){
      case 0:add(s,'new-root-'+seq++);break;
      case 1:if(root)add(s,'new-child-'+seq++,{parentId:root.id,priority:['urgent','high','normal','low'][random(4)]});break;
      case 2:if(child)updateItem(s,child.id,{notes:'Nota '+i,status:['pending','doing','done'][random(3)]},'qa');break;
      case 3:if(child&&root)moveItem(s,child.id,{parentId:root.id},'qa');break;
      case 4:if(root)updateItem(s,root.id,{areaId:activeAreas(s)[random(activeAreas(s).length)].id},'qa');break;
      case 5:if(child){const marker=deleteItem(s,child.id,'qa');if(i%2)undoDelete(s,marker,'qa')}break;
      case 6:if(root&&roots.length>2){const marker=deleteItem(s,root.id,'qa');if(i%3)undoDelete(s,marker,'qa')}break;
    }});const state=new Repository(storage).load();validateState(state);
    if(i%40===0){const a=clone(state),b=clone(state),root=rootItems(state)[0];if(root){add(a,'offline-a-'+i,{parentId:root.id},'A');add(b,'offline-b-'+i,{parentId:root.id},'B');assert.equal(comparable(mergeStates(a,b)),comparable(mergeStates(b,a)))}}
  }
  assert.ok(seq>50);
});
