import test from 'node:test';
import assert from 'node:assert/strict';
import {createSyncUI,syncHeader} from '../dist/src/sync/ui.js';
import {Repository} from '../dist/src/repository.js';
test('falha local colore a nuvem de erro e permanece até uma gravação confirmada',t=>{
  const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{querySelectorAll:()=>[]}});
  t.after(()=>{for(const [key,descriptor]of [['localStorage',originalStorage],['document',originalDocument]]){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  const sync=createSyncUI({repo:{},icon:()=>'<svg></svg>',esc:String,isBlocked:()=>false});
  assert.match(sync.header(),/data-sync-state="local"/);
  sync.localFailure('Não foi possível salvar neste aparelho.');sync.refresh();
  assert.match(sync.header(),/data-sync-state="error"/);assert.match(sync.card(),/data-sync-state="error"/);
  sync.localSaved();assert.match(sync.header(),/data-sync-state="local"/);
});
test('falhas de acesso ou gravação local são identificadas sem confundir validação de dados',async()=>{
  const readFailure=new Repository({getItem:()=>{throw Error('Falha fictícia');}});
  assert.throws(()=>readFailure.load(),error=>error.code==='LOCAL_STORAGE_FAILED');
  const writeFailure=new Repository({getItem:()=>null,setItem:()=>{throw Error('Falha fictícia');}});
  await assert.rejects(writeFailure.commit(()=>{}),error=>error.code==='LOCAL_STORAGE_FAILED');
  const validStorage={getItem:()=>null,setItem:()=>{}},repo=new Repository(validStorage);
  await assert.rejects(repo.commit(s=>{s.schemaVersion=999;}),error=>error.code!=='LOCAL_STORAGE_FAILED');
});
test('a nuvem não tem texto visível nem visto, preservando a distinção acessível dos estados',()=>{
  const options={icon:name=>`<svg data-icon="${name}"></svg>`,esc:String};
  for(const kind of ['local','pending','syncing','confirmed','error']){
    const html=syncHeader({kind,message:'Conferência fictícia.'},options);
    assert.match(html,new RegExp('aria-busy="'+(kind==='syncing')+'"'));
    assert.match(html,/data-icon="cloud"/);assert.doesNotMatch(html,/<span|data-icon="check"|title=/);
    assert.match(html,/Conferência fictícia/);
  }
  assert.match(syncHeader({kind:'syncing'},options),/aria-label="Sincronizando/);
  assert.match(syncHeader({kind:'confirmed'},options),/aria-label="Sincronizado/);
});
test('agenda recebe o pareamento somente após conferir o backup e perde acesso ao desparear',async t=>{
 const {JSDOM}=await import('jsdom'),{saveConnection}=await import('../dist/src/sync/preferences.js'),{sealState}=await import('../dist/src/sync/crypto.js');
 const dom=new JSDOM('<body><div id="modal"></div></body>',{url:'https://retomar.example/'}),w=dom.window,prior=new Map(),timers=new Set(),intervals=new Set(),nativeTimeout=setTimeout,nativeInterval=setInterval;
 for(const [key,value] of Object.entries({document:w.document,window:w,navigator:w.navigator,fetch:async(url,options)=>{if(options.method==='PATCH')remote=JSON.parse(options.body).files['retomar.enc.json'].content;return Response.json({public:false,files:{'retomar.enc.json':{content:remote}}});}})){prior.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 globalThis.setTimeout=(...args)=>{const id=nativeTimeout(...args);id.unref();timers.add(id);return id;};globalThis.setInterval=(...args)=>{const id=nativeInterval(...args);id.unref();intervals.add(id);return id;};
 t.after(()=>{for(const id of timers)clearTimeout(id);for(const id of intervals)clearInterval(id);globalThis.setTimeout=nativeTimeout;globalThis.setInterval=nativeInterval;for(const [key,value]of prior)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];dom.window.close();});
 const storage=w.localStorage,repo=new Repository(storage),token='fictitious_pairing_token';let remote=await sealState(repo.load(),token),confirmed;const ready=new Promise(resolve=>confirmed=resolve);
 saveConnection(storage,{gistId:'abcde',token,remember:true});const ui=createSyncUI({repo,storage,icon:()=>'',esc:String,isBlocked:()=>false,toast(){},onApply(){},onPairingChanged:()=>confirmed(),openModal:(title,html)=>{w.document.querySelector('#modal').innerHTML=html;return w.document.querySelector('#modal');},closeModal:()=>{w.document.querySelector('#modal').innerHTML='';}});
 assert.equal(ui.connection(),null);ui.start();assert.equal(ui.connection(),null);let deadline;try{await Promise.race([ready,new Promise((resolve,reject)=>{deadline=nativeTimeout(()=>reject(Error('O backup não foi confirmado no prazo do teste.')),5000);})]);}finally{clearTimeout(deadline);}assert.deepEqual(ui.connection(),{gistId:'abcde',token,secret:token});ui.open();w.document.querySelector('#sync-disconnect').click();assert.equal(ui.connection(),null);assert.equal(storage.getItem('entrelinhas-vida:sync-credentials:v1'),null);
});
