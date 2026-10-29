import test from 'node:test';
import assert from 'node:assert/strict';
import {createInstallation} from '../dist/src/pwa.js';
function fixture({standalone=false,iosStandalone=false}={}){
  const target=new EventTarget(),media=new EventTarget(),states=[];
  media.matches=standalone;target.navigator={standalone:iosStandalone};target.matchMedia=()=>media;
  const install=createInstallation({target,onChange:s=>states.push(s)});
  function offer(prompt,choice=Promise.resolve({outcome:'accepted'})){
    const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=prompt;event.userChoice=choice;
    target.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
  }
  return {target,media,states,install,offer};
}
test('botão começa desabilitado e só habilita com oferta do navegador',async()=>{
  const f=fixture();assert.equal(f.install.snapshot().enabled,false);await f.install.install();
  f.offer(async()=>{});assert.equal(f.install.snapshot().enabled,true);assert.equal(f.install.snapshot().hidden,false);f.install.dispose();
});
test('aceitar o convite solicita a instalação sem declarar o WebAPK instalado',async()=>{
  const f=fixture();let calls=0;f.offer(async()=>{calls++;});await f.install.install();await f.install.install();
  assert.equal(calls,1);assert.equal(f.install.snapshot().phase,'requested');assert.equal(f.install.snapshot().hidden,false);assert.equal(f.install.snapshot().enabled,false);f.install.dispose();
});
test('cancelamento aguarda nova oferta e não reutiliza o evento',async()=>{
  const f=fixture();let calls=0;f.offer(async()=>{calls++;},Promise.resolve({outcome:'dismissed'}));
  await f.install.install();await f.install.install();assert.equal(calls,1);assert.equal(f.install.snapshot().phase,'dismissed');assert.equal(f.install.snapshot().enabled,false);
  f.offer(async()=>{calls++;});assert.equal(f.install.snapshot().enabled,true);await f.install.install();assert.equal(calls,2);f.install.dispose();
});
test('resposta antiga não sobrescreve uma nova oferta de instalação',async()=>{
  const f=fixture();let finish;f.offer(async()=>{},new Promise(resolve=>finish=resolve));
  const pending=f.install.install();assert.equal(f.install.snapshot().phase,'prompting');await f.install.install();
  f.offer(async()=>{});finish({outcome:'dismissed'});await pending;
  assert.equal(f.install.snapshot().phase,'ready');assert.equal(f.install.snapshot().enabled,true);f.install.dispose();
});
test('appinstalled mantém solicitação visível até esta janela ficar standalone',async()=>{
  const f=fixture();let finish;f.offer(async()=>{},new Promise(resolve=>finish=resolve));const pending=f.install.install();
  f.target.dispatchEvent(new Event('appinstalled'));finish({outcome:'dismissed'});await pending;
  assert.equal(f.install.snapshot().phase,'requested');assert.equal(f.install.snapshot().hidden,false);
  f.media.matches=true;f.media.dispatchEvent(new Event('change'));assert.equal(f.install.snapshot().hidden,true);
  f.media.matches=false;f.media.dispatchEvent(new Event('change'));assert.equal(f.install.snapshot().hidden,false);assert.equal(f.install.snapshot().enabled,false);f.install.dispose();
});
test('standalone inicial e navigator.standalone ocultam somente o cartão nesta janela',()=>{
  for(const option of [{standalone:true},{iosStandalone:true}]){const f=fixture(option);assert.equal(f.install.snapshot().hidden,true);assert.equal(f.install.snapshot().enabled,false);f.install.dispose();}
});
test('erro do convite não fica preso no estado de espera',async()=>{
  const f=fixture();f.offer(async()=>{throw Error('Falha fictícia');});await f.install.install();
  assert.equal(f.install.snapshot().phase,'error');assert.equal(f.install.snapshot().enabled,false);assert.equal(f.install.snapshot().hidden,false);f.install.dispose();
});
