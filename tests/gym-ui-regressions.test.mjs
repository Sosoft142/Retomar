import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createGymUI} from '../dist/src/gym-ui.js';
import {GYM_KEY,initialGym} from '../dist/src/gym.js';
import {bindFormErrors} from '../dist/src/forms.js';
import {createGymMedia} from '../dist/src/gym-media.js';

async function fixture(run){
  const dom=new JSDOM('<main id="app"></main><div id="dialog-root"></div>',{url:'https://retomar.example/'}),w=dom.window,originals=new Map();
  for(const [key,value] of Object.entries({document:w.document,FormData:w.FormData})){originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true})}
  const values=new Map(),downloads=[],messages=[];let date=new Date(2026,10,21,23,59),failDownload=false,release;
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  w.confirm=()=>true;
  const node=selector=>{const value=w.document.querySelector(selector);assert.ok(value,selector);return value};
  const close=()=>{node('#dialog-root').innerHTML=''};
  let ui;
  const render=()=>{node('#app').innerHTML=ui.page();ui.bind()};
  const openModal=(title,body)=>{node('#dialog-root').innerHTML=`<dialog open><h2>${title}</h2>${body}</dialog>`;node('#dialog-root').querySelectorAll('form').forEach(bindFormErrors);return node('#dialog-root')};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  ui=createGymUI({storage,target:w,esc,icon:()=>'',openModal,closeModal:close,toast:message=>messages.push(message),render,download:(content,name)=>{if(failDownload)throw Error('Download bloqueado');downloads.push({content,name})},now:()=>date});
  const fill=(selector,value)=>{const e=node(selector);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}))};
  const importData=async data=>{const input=node('#gym-backup-file');Object.defineProperty(input,'files',{value:[{size:100,text:async()=>JSON.stringify(data)}],configurable:true});await input.onchange({target:input})};
  try{render();await run({ui,w,storage,values,downloads,messages,node,fill,close,render,importData,submit:()=>{const form=node('dialog form'),event=new w.Event('submit',{cancelable:true});Object.defineProperty(event,'target',{value:form});return form.onsubmit(event)},failDownload:()=>{failDownload=true},nextDay:()=>{date=new Date(2026,10,22,0,1)},deferSave:()=>{Object.defineProperty(w.navigator,'locks',{configurable:true,value:{request:(_name,run)=>new Promise(resolve=>{release=()=>resolve(run())})}})},releaseSave:()=>release()})}
  finally{dom.window.close();for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
}

test('backup vazio pode ser copiado e recuperado sem substituir antes da confirmação',()=>fixture(async f=>{
  f.values.set(GYM_KEY,'');f.render();await f.ui.action('gym-export',{});assert.equal(f.downloads[0]?.content,'');
  await f.importData(initialGym());assert.equal(f.values.get(GYM_KEY),'');assert.doesNotThrow(()=>f.node('#gym-copy').onclick());assert.equal(f.downloads.at(-1).content,'');assert.equal(f.node('#gym-restore').disabled,false);
  await f.node('#gym-restore').onclick(new f.w.Event('click',{cancelable:true}));assert.equal(JSON.parse(f.values.get(GYM_KEY)).workouts.length,4);
}));
test('falha ao baixar cópia conserva restauração bloqueada e informa o erro',()=>fixture(async f=>{
  await f.importData(initialGym());f.failDownload();assert.doesNotThrow(()=>f.node('#gym-copy').onclick());assert.equal(f.node('#gym-restore').disabled,true);assert.match(f.node('.formerror').textContent,/Download bloqueado/);assert.equal(f.values.get(GYM_KEY),undefined);
}));
test('salvamento pendente não fecha outro formulário aberto depois',()=>fixture(async f=>{
  await f.ui.action('gym-edit-exercise',{workout:'segunda',id:'segunda-hip'});f.fill('#gym-load','20 kg');f.deferSave();const pending=f.submit();f.close();await f.ui.action('gym-edit-workout',{id:'terca'});f.fill('#gym-name','Rascunho preservado');f.releaseSave();await pending;
  assert.equal(f.node('#gym-name').value,'Rascunho preservado');assert.equal(JSON.parse(f.values.get(GYM_KEY)).workouts[0].exercises[0].load,'20 kg');
}));
test('mudança de dia limpa a visualização e recusa marcar uma caixa do dia anterior',()=>fixture(async f=>{
  const first=f.node('[data-gym-check="segunda-hip"]');first.checked=true;await first.onchange();assert.equal(Object.keys(JSON.parse(f.values.get(GYM_KEY)).sessions)[0],'2026-11-21');
  const stale=f.node('[data-gym-check="segunda-hip"]');f.nextDay();stale.checked=false;await stale.onchange();assert.equal(JSON.parse(f.values.get(GYM_KEY)).sessions['2026-11-22'],undefined);assert.equal(f.node('[data-gym-check="segunda-hip"]').checked,false);
  assert.match(f.messages.at(-1),/dia/);
}));
test('relógio atualiza marcações sem regravar o histórico do dia anterior',()=>fixture(async f=>{
  const input=f.node('[data-gym-check="segunda-hip"]');input.checked=true;await input.onchange();const raw=f.values.get(GYM_KEY);f.nextDay();f.ui.refreshDate();assert.equal(f.node('[data-gym-check="segunda-hip"]').checked,false);assert.equal(f.values.get(GYM_KEY),raw);
}));
test('foco retorna à caixa quando o navegador o remove ao desativar o campo durante a gravação',()=>fixture(async f=>{
  const input=f.node('[data-gym-check="segunda-hip"]');input.focus();input.checked=true;f.deferSave();const pending=input.onchange();input.blur();f.releaseSave();await pending;assert.equal(f.w.document.activeElement.id,'gym-check-segunda-hip');
}));
test('leitura lenta de arquivo não substitui um rascunho aberto durante a espera',()=>fixture(async f=>{
  let finish;const file=f.node('#gym-backup-file');Object.defineProperty(file,'files',{value:[{size:100,text:()=>new Promise(resolve=>finish=resolve)}]});const pending=file.onchange({target:file});
  await f.ui.action('gym-edit-workout',{id:'segunda'});f.fill('#gym-name','Rascunho novo');finish(JSON.stringify(initialGym()));await pending;assert.equal(f.node('#gym-name').value,'Rascunho novo');assert.match(f.messages.at(-1),/formulário/);
}));
test('erro de salvamento atrasado não aparece no formulário de outro treino',()=>fixture(async f=>{
  await f.ui.action('gym-edit-workout',{id:'segunda'});f.fill('#gym-name','Alterado');f.deferSave();f.storage.setItem=()=>{throw Error('Quota')};const pending=f.submit();f.close();await f.ui.action('gym-edit-workout',{id:'terca'});f.fill('#gym-name','Outro rascunho');f.releaseSave();await pending;
  assert.equal(f.node('#gym-name').value,'Outro rascunho');assert.equal(f.node('.formerror').textContent,'');assert.match(f.messages.at(-1),/preservado/);
}));
test('reaplicar miniaturas simultaneamente mantém uma imagem por vídeo',()=>fixture(async f=>{
  const media=createGymMedia(),root=f.node('#app');await Promise.all([media.hydrate(root),media.hydrate(root)]);for(const video of root.querySelectorAll('[data-gym-video]'))assert.equal(video.querySelectorAll('img').length,1);
}));
test('marcar exercício preserva os cartões, descrições abertas e imagens já carregadas',()=>fixture(async f=>{
  await Promise.resolve();const card=f.node('[data-gym-exercise="segunda-hip"]'),other=f.node('[data-gym-exercise="segunda-abd"]'),details=card.querySelector('details'),image=card.querySelector('img');details.open=true;
  const input=card.querySelector('input');input.checked=true;await input.onchange();assert.equal(f.node('[data-gym-exercise="segunda-hip"]'),card);assert.equal(f.node('[data-gym-exercise="segunda-abd"]'),other);assert.equal(card.querySelector('details'),details);assert.equal(details.open,true);assert.equal(card.querySelector('img'),image);assert.match(f.node('.gym-progress-head').textContent,/1 de 4/);
}));
test('painel personaliza visual, oculta blocos e conserva preferências no backup',()=>fixture(async f=>{
  await f.ui.action('gym-personalize',{});f.node('[data-gym-color="#ec4899"]').onclick();f.fill('[name="layout"]','list');f.fill('[name="thumbnails"]','hidden');f.fill('[name="descriptions"]','open');f.node('[name="showCardio"]').checked=false;f.node('[name="showGuidance"]').checked=false;await f.submit();
  const s=JSON.parse(f.values.get(GYM_KEY));assert.equal(s.preferences.accent,'#ec4899');assert.equal(s.preferences.layout,'list');assert.ok(f.node('.gym-layout-list'));assert.equal(f.w.document.querySelector('.gym-video'),null);assert.ok(f.node('.gym-video-links a'));assert.equal(f.node('.gym-description').open,true);assert.equal(f.w.document.querySelector('.gym-note'),null);await f.ui.action('gym-export',{});assert.deepEqual(JSON.parse(f.downloads[0].content).preferences,s.preferences);
}));
test('cores individuais e restaurar aparência não mudam o conteúdo dos treinos',()=>fixture(async f=>{
  const initial=initialGym().workouts;await f.ui.action('gym-edit-workout',{id:'segunda'});f.node('[data-gym-color="#8b5cf6"]').onclick();await f.submit();assert.equal(JSON.parse(f.values.get(GYM_KEY)).preferences.workoutColors.segunda,'#8b5cf6');
  await f.ui.action('gym-edit-exercise',{workout:'segunda',id:'segunda-hip'});f.node('[data-gym-color="#3b82f6"]').onclick();await f.submit();assert.equal(JSON.parse(f.values.get(GYM_KEY)).preferences.exerciseColors['segunda-hip'],'#3b82f6');
  await f.ui.action('gym-personalize',{});f.node('#gym-pref-reset').onclick();await f.submit();const next=JSON.parse(f.values.get(GYM_KEY));assert.deepEqual(next.preferences.workoutColors,{});assert.deepEqual(next.preferences.exerciseColors,{});assert.deepEqual(next.workouts,initial);
}));
test('ocultar feitos conserva os dados e o gesto só troca para um treino disponível',()=>fixture(async f=>{
  assert.equal(f.ui.canSwipe(-1),false);assert.equal(f.ui.canSwipe(1),true);f.ui.swipe(1);assert.equal(f.node('.gym-page').dataset.gymWorkout,'terca');
  await f.ui.action('gym-personalize',{});f.node('[name="showCompleted"]').checked=false;f.node('[name="swipe"]').checked=false;await f.submit();assert.equal(f.ui.canSwipe(1),false);const input=f.node('[data-gym-check="terca-reverse"]');input.checked=true;await input.onchange();assert.equal(f.w.document.querySelector('[data-gym-exercise="terca-reverse"]'),null);assert.equal(f.node('.gym-progress').value,1);
}));
test('cancelar uma personalização e recusar conflito não grava o rascunho',()=>fixture(async f=>{
  await f.ui.action('gym-personalize',{});f.fill('[name="layout"]','list');f.close();assert.equal(f.values.get(GYM_KEY),undefined);await f.ui.action('gym-personalize',{});const next=initialGym();next.preferences.thumbnails='compact';f.values.set(GYM_KEY,JSON.stringify(next));await f.submit();assert.match(f.node('.formerror').textContent,/outra janela/);assert.equal(JSON.parse(f.values.get(GYM_KEY)).preferences.thumbnails,'compact');
}));
