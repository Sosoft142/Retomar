import test from 'node:test';
import assert from 'node:assert/strict';
import {createSyncUI} from '../dist/src/sync/ui.js';
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
