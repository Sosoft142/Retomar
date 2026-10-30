import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validateState,migrateState,activeAreas,activeItems,updateItem,deleteItem,undoDelete,removeArea,reorderAreas,moveItem,restoreSnapshot,stamp,validDate,selectItems,hasVisibleText,areaNameKey} from '../dist/src/domain.js';
import {Repository,DATA_KEY} from '../dist/src/repository.js';
import {comparable,mergeStates} from '../dist/src/sync/merge.js';
import {sealState} from '../dist/src/sync/crypto.js';
import {textFieldError,submitOnce,validToken} from '../dist/src/forms.js';
import {CollectionWindow} from '../dist/src/collections.js';

const clone=structuredClone;
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
function add(s,id='qa',extra={}){return updateItem(s,id,{title:'Item fictício',notes:'',areaId:activeAreas(s)[0].id,status:'pending',date:'',time:'',priority:'normal',...extra},'qa-device')}

test('texto invisível é rejeitado; emojis compostos, acentos e outros alfabetos continuam válidos',()=>{
  for(const text of ['', ' \t\n\u00a0', '\u200b\u200d\u2060', '\u0000\u0008', '\ufeff\u202e', '\ud800']){
    assert.equal(hasVisibleText(text),false,JSON.stringify(text));
    assert.ok(textFieldError(text,{required:true}));
    const s=initialState();add(s);s.items.qa.title=text;assert.throws(()=>validateState(s));
    s.items.qa.title='Válido';activeAreas(s)[0].name=text;assert.throws(()=>validateState(s));
  }
  for(const text of ['👩🏽‍💻','Família 👨‍👩‍👧‍👦','Saúde','Cafe\u0301','日本語','العربية'])assert.equal(hasVisibleText(text),true);
});
test('limites exatos de título, área e observações preservam HTML como texto e não cortam emojis',()=>{
  const s=initialState();activeAreas(s)[0].name='Á'.repeat(60);add(s,'qa',{title:'🧪'.repeat(100),notes:'<script>QA</script>'+ 'X'.repeat(4981),date:'2200-12-31',time:'23:59'});
  assert.equal(s.items.qa.notes.length,5000);validateState(s);
  assert.deepEqual(migrateState(JSON.parse(JSON.stringify(s))),s);
  for(const [key,length] of [['title',201],['notes',5001]]){const bad=clone(s);bad.items.qa[key]='X'.repeat(length);assert.throws(()=>validateState(bad));assert.match(textFieldError(bad.items.qa[key],{maxLength:length-1}),/máximo/)}
  const bad=clone(s);activeAreas(bad)[0].name='X'.repeat(61);assert.throws(()=>validateState(bad));
});
test('datas-limite, ano bissexto e horários inválidos não atravessam o domínio',()=>{
  for(const date of ['1900-01-01','2200-12-31','2000-02-29','2028-02-29'])assert.equal(validDate(date),true,date);
  for(const date of ['1899-12-31','2201-01-01','1900-02-29','2026-02-30','2026-13-01','2026-00-01','2026-04-31','0000-01-01','99999-01-01','2026-1-1','<script>'])assert.equal(validDate(date),false,date);
  for(const time of ['24:00','23:60','-1:00','9:00','12:00:00','NaN']){const s=initialState();add(s,'qa',{date:'2028-02-29',time});assert.throws(()=>validateState(s),time)}
  for(const time of ['00:00','23:59']){const s=initialState();add(s,'qa',{date:'1900-01-01',time});validateState(s)}
});
test('nomes equivalentes em Unicode têm a mesma chave de comparação',()=>{assert.equal(areaNameKey('  SAÚDE '),areaNameKey('Sau\u0301de'));assert.equal(areaNameKey('CAFÉ'),areaNameKey('cafe\u0301'));assert.notEqual(areaNameKey('Casa'),areaNameKey('Casas'))});
test('token malformado é bloqueado antes da rede, inclusive limites e caracteres invisíveis',()=>{
  for(const token of ['', 'x'.repeat(11),'x'.repeat(513),'ghp_abc\u200b1234567890','ghp_abc\n1234567890','ghp_abc\u00001234567890','🧪'.repeat(20),'<script>QA</script>'])assert.equal(validToken(token),false);
  for(const token of ['a'.repeat(12),'github_pat_'+ 'a'.repeat(80),'a'.repeat(512)])assert.equal(validToken(token),true);
});
test('envios simultâneos executam uma única gravação e permitem nova tentativa depois',async()=>{
  let release,calls=0;const gate=new Promise(resolve=>release=resolve);const submit=submitOnce(async()=>{calls++;await gate;return 'salvo'}),event={preventDefault(){}};
  const first=submit(event);await Promise.all(Array.from({length:100},()=>submit(event)));assert.equal(calls,1);release();assert.equal(await first,'salvo');await submit(event);assert.equal(calls,2);
});
test('falha no envio libera o formulário para correção e repetição',async()=>{let calls=0;const submit=submitOnce(async()=>{if(++calls===1)throw Error('quota fictícia');return 'ok'}),event={preventDefault(){}};await assert.rejects(submit(event),/quota/);assert.equal(await submit(event),'ok')});
test('identificadores perigosos, vazios ou alterados pelo HTML são rejeitados sem renomear registros',()=>{
  for(const id of ['', '__proto__','constructor','prototype','area\u0000quebrada','area\nquebrada','area\u200bquebrada',' area','a'.repeat(101),'\ud800']){
    const s=initialState(),old=activeAreas(s)[0],a={...old,id};delete s.areas[old.id];Object.defineProperty(s.areas,id,{value:a,enumerable:true});assert.throws(()=>validateState(s),JSON.stringify(id));
  }
});
test('campos extras profundos ou chaves de protótipo são rejeitados antes da combinação recursiva',()=>{
  for(const location of ['root','area','item','revision']){const s=initialState();add(s);const target=location==='root'?s:location==='area'?activeAreas(s)[0]:location==='item'?s.items.qa:s.items.qa.revision;let nested={};target.extra=nested;for(let i=0;i<20000;i++)nested=nested.next={};assert.throws(()=>validateState(s),error=>error.name==='Error');assert.throws(()=>mergeStates(s,initialState()),error=>error.name==='Error')}
  const s=initialState();Object.assign(activeAreas(s)[0].revision,JSON.parse('{"__proto__":{"polluted":"qa"}}'));assert.throws(()=>validateState(s));assert.equal({}.polluted,undefined);
});
test('arrays, campos ausentes, objetos inesperados e revisões inválidas são recusados',()=>{
  const mutations=[s=>s.items=[],s=>s.areas=[],s=>delete s.clock,s=>s.clock=NaN,s=>s.clock=Infinity,s=>s.clock=-1,s=>activeAreas(s)[0].order=-1,s=>activeAreas(s)[0].revision.counter=Number.MAX_SAFE_INTEGER+1,s=>s.items.qa.revision.deviceId='\u200b',s=>s.items.qa.title={},s=>s.items.qa.notes=null,s=>s.items.qa.status='absurdo',s=>s.items.qa.priority='extrema',s=>s.items.qa.order=.5,s=>s.items.qa.areaId='ausente',s=>activeAreas(s)[0].deleted=true];
  for(const mutate of mutations){const s=initialState();add(s);mutate(s);assert.throws(()=>validateState(s))}
});
test('restaurações inválidas e alterações inválidas deixam os bytes persistidos intactos',async()=>{
  const disk=storage(),repo=new Repository(disk);repo.load();await repo.commit(s=>add(s));const before=disk.getItem(DATA_KEY);
  for(const mutate of [s=>s.items.qa.title='\u200b',s=>s.items.qa.notes='x'.repeat(5001),s=>s.extra={nested:{value:'fictício'}},s=>s.items.qa.areaId='ausente']){const bad=JSON.parse(before);mutate(bad);await assert.rejects(repo.commit(()=>{},{replace:bad}));assert.equal(disk.getItem(DATA_KEY),before);await assert.rejects(repo.commit(mutate));assert.equal(disk.getItem(DATA_KEY),before)}
});
test('estouro da revisão e falta de espaço preservam a última cópia válida',async()=>{
  const disk=storage(),repo=new Repository(disk);repo.load();await repo.commit(s=>{add(s);s.clock=Number.MAX_SAFE_INTEGER});const before=disk.getItem(DATA_KEY);await assert.rejects(repo.commit(s=>updateItem(s,'qa',{title:'Não salvo'},'qa')),/revisões/);assert.equal(disk.getItem(DATA_KEY),before);
  disk.setItem=()=>{throw new DOMException('quota','QuotaExceededError')};await assert.rejects(repo.commit(s=>s.updatedAt='2026-10-29T00:00:00.000Z'),e=>e.code==='LOCAL_STORAGE_FAILED');assert.equal(disk.getItem(DATA_KEY),before);
});
test('capacidade de 20.000 itens é validada e 20.001 é recusado sem estouro de pilha',()=>{
  const s=initialState(),a=activeAreas(s)[0],now=new Date().toISOString();for(let i=0;i<20000;i++){const id='qa-'+i;s.items[id]={id,title:'Fictício '+i,notes:'',areaId:a.id,parentId:'',date:'',time:'',status:'pending',priority:'normal',order:i,createdAt:now,updatedAt:now,deleted:false,revision:{counter:0,deviceId:'qa'}}}validateState(s);const more=clone(s.items['qa-0']);more.id='qa-excedente';s.items[more.id]=more;assert.throws(()=>validateState(s),/limites/);
});
test('capacidade de 500 áreas inclui tombstones e recusa excedente',()=>{const s=initialState(),base=activeAreas(s)[0];s.areas={};for(let i=0;i<500;i++){const id='qa-area-'+i;s.areas[id]={...clone(base),id,order:i,deleted:i>0}}validateState(s);s.areas.extra={...clone(base),id:'extra',order:500};assert.throws(()=>validateState(s),/limites/)});
test('limite remoto é informado antes de criptografar e preserva a cópia local',async()=>{const s=initialState();for(let i=0;i<140;i++)add(s,'qa-'+i,{notes:'X'.repeat(5000)});const before=JSON.stringify(s);await assert.rejects(sealState(s,'token_ficticio_123456789'),/650 KB/);assert.equal(JSON.stringify(s),before)});
test('janela de renderização limita milhares de itens, conserva ordem e permite revelar todos',()=>{
  const window=new CollectionWindow(),items=Array.from({length:5000},(_,i)=>({id:i}));let result=window.take('all',items);assert.equal(result.visible.length,60);assert.equal(result.remaining,4940);
  while(result.remaining){window.more('all');window.begin();result=window.take('all',items)}assert.deepEqual(result.visible,items);assert.equal(items.length,5000);
  window.reset();window.begin();let count=0;for(let i=0;i<500;i++)count+=window.take('area-'+i,items.slice(0,40)).visible.length;assert.equal(count,240);window.more('area-499');window.begin();assert.equal(window.take('area-499',items).visible.length,60);
});
test('busca encontra o último registro mesmo quando ele não foi montado na tela',()=>{const s=initialState();for(let i=0;i<500;i++)add(s,'qa-'+i,{title:'Fictício '+i});const window=new CollectionWindow();assert.equal(window.take('all',activeItems(s)).visible.length,60);const found=selectItems(activeItems(s),{query:'Fictício 499'});assert.equal(found.length,1);window.reset();assert.equal(window.take('all',found).visible[0].id,'qa-499')});
test('2.000 operações aleatórias reproduzíveis conservam persistência, referências e combinação',async()=>{
  let seed=0x5eed053;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/0x100000000*n)},disk=storage(),repo=new Repository(disk);repo.load();let sequence=0;
  for(let i=0;i<2000;i++){
    const before=clone(repo.load());await repo.commit(s=>{const items=activeItems(s),areas=activeAreas(s),item=items[random(items.length)],area=areas[random(areas.length)];switch(random(8)){
      case 0:case 1:add(s,'fuzz-'+sequence++,{title:['🧪','<script>QA</script>','إعادة','X'.repeat(200)][random(4)],areaId:area.id,notes:'QA '.repeat(random(30)),priority:['urgent','high','normal','low'][random(4)]});break;
      case 2:if(item)updateItem(s,item.id,{title:'Editado '+i,date:i%2?'2028-02-29':'',time:''},'qa');break;
      case 3:if(item){const deleted=deleteItem(s,item.id,'qa');if(i%2)undoDelete(s,deleted,'qa')}break;
      case 4:if(item)moveItem(s,item.id,{areaId:area.id,priority:['urgent','high','normal','low'][random(4)],beforeId:items[random(items.length)]?.id},'qa');break;
      case 5:reorderAreas(s,area.id,areas[random(areas.length)]?.id,'qa');break;
      case 6:if(areas.length>2&&i%20===0)removeArea(s,area.id,areas.find(a=>a.id!==area.id).id,'qa');break;
      case 7:if(i%17===0)Object.assign(s,restoreSnapshot(s,before,'qa'));break;
    }});
    const current=new Repository(disk).load();validateState(current);
    if(i%100===0){const a=clone(current),b=clone(current);add(a,'branch-a-'+i,{title:'Offline A'});add(b,'branch-b-'+i,{title:'Offline B'});const merged=mergeStates(a,b);assert.equal(comparable(merged),comparable(mergeStates(b,a)));assert.equal(comparable(merged),comparable(mergeStates(merged,merged)));validateState(merged)}
  }
  assert.ok(sequence>400);assert.ok(Object.keys(repo.load().items).length>400);
});
