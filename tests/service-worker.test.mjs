import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/service-worker.js',import.meta.url),'utf8'),scope='https://example.test/Retomar/';
function fixture({offline=false,quota=false,entries=new Map()}={}){
 const handlers={},writes=[],waits=[],response={ok:true,type:'basic',clone(){return this}};
 const cache={put:async(key,value)=>{if(quota)throw Error('quota');writes.push(key);entries.set(key,value)},addAll:async()=>{}};
 const caches={open:async()=>cache,match:async request=>entries.get(typeof request==='string'?request:request.url),keys:async()=>[],delete:async()=>true};
 vm.runInNewContext(source,{URL,Response,caches,fetch:async()=>{if(offline)throw Error('offline');return response},self:{registration:{scope},location:{origin:new URL(scope).origin},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting(){}}});
 async function get(path,extra={}){let result;const event={request:{url:new URL(path,scope).href,method:'GET',mode:'cors',headers:{has:()=>false},...extra},respondWith:p=>result=p,waitUntil:p=>waits.push(p)};handlers.fetch(event);const value=await result;await Promise.all(waits);return value}
 return {get,writes,response};
}
test('offline recupera recurso conhecido mesmo com parâmetro de versão',async()=>{
 const cached={body:'css salvo'},f=fixture({offline:true,entries:new Map([[scope+'retomar.css',cached]])});assert.equal(await f.get('retomar.css?v=2'),cached);
});
test('offline usa a página inicial salva na navegação com link para tarefa',async()=>{
 const cached={body:'app salvo'},f=fixture({offline:true,entries:new Map([[scope+'index.html',cached]])});assert.equal(await f.get('?item=ficticio',{mode:'navigate'}),cached);
});
test('quota no cache não produz rejeição nem impede a resposta online',async()=>{
 const f=fixture({quota:true});assert.equal(await f.get('src/app.js'),f.response);
});
test('cache dinâmico fica limitado aos arquivos do app e normaliza parâmetros',async()=>{
 const f=fixture();await f.get('retomar.css?v=2');await f.get('arquivo-fora-do-app.json');assert.deepEqual(f.writes,[scope+'retomar.css']);
});
test('não intercepta autorização, outros domínios nem gravações',async()=>{
 const f=fixture();assert.equal(await f.get('src/app.js',{headers:{has:()=>true}}),undefined);assert.equal(await f.get('https://outro.test/file'),undefined);assert.equal(await f.get('src/app.js',{method:'POST'}),undefined);
});
