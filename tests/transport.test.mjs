import test from 'node:test';
import assert from 'node:assert/strict';
import {GistAdapter,SYNC_FILE} from '../dist/src/sync/gist.js';
function requireGlobalReceiver(receiver){
  if(receiver!==globalThis)throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
}
test('fetch nativo capturado mantém o contexto global exigido pelo navegador',async t=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'fetch');let calls=0;
  Object.defineProperty(globalThis,'fetch',{configurable:true,writable:true,value:function(url,options){
    requireGlobalReceiver(this);calls++;assert.equal(url,'https://api.github.com/gists?per_page=100&page=1');
    assert.equal(options.headers.Authorization,'Bearer token-ficticio');return Promise.resolve(new Response('[]'));
  }});
  t.after(()=>Object.defineProperty(globalThis,'fetch',original));
  const adapter=new GistAdapter('token-ficticio');assert.deepEqual(await adapter.discover(),[]);assert.equal(calls,1);
});
test('GET, POST e PATCH conservam o contexto global do transporte injetado',async()=>{
  const id='abcde12345',calls=[];let content='envelope-ficticio-inicial';
  const adapter=new GistAdapter('token-ficticio',{fetchImpl:function(url,options){
    requireGlobalReceiver(this);calls.push(options.method);
    let result;
    if(options.method==='POST'||options.method==='PATCH'){content=JSON.parse(options.body).files[SYNC_FILE].content;result={id,public:false};}
    else if(url.includes('?'))result=[{id,public:false,updated_at:'2026-10-29',files:{[SYNC_FILE]:{}}}];
    else result={id,public:false,files:{[SYNC_FILE]:{content}}};
    return Promise.resolve(new Response(JSON.stringify(result)));
  }});
  assert.equal((await adapter.discover())[0].id,id);assert.equal(await adapter.create(content),id);
  assert.equal(await adapter.read(id),content);await adapter.write(id,'envelope-ficticio-atualizado');
  assert.equal(await adapter.read(id),'envelope-ficticio-atualizado');assert.deepEqual(calls,['GET','POST','GET','PATCH','GET']);
});
