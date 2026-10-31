import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../dist/src/navigation.js';

function fixture({entries=[null],index=0,blocked=false}={}){
  const target=new EventTarget(),queue=[],restored=[];
  let view={page:'plan',area:'all',query:'',windows:[]},modal=false,allowed=true,dismissals=0;
  target.scrollY=0;target.scrollTo=(_x,y)=>{target.scrollY=y};
  const clone=x=>structuredClone(x);
  target.history={
    get state(){return clone(entries[index])},
    replaceState(state){if(blocked)throw Error('History blocked');entries[index]=clone(state)},
    pushState(state){if(blocked)throw Error('History blocked');entries.splice(index+1);entries.push(clone(state));index++},
    back(){this.go(-1)},forward(){this.go(1)},
    go(delta){queue.push(()=>{const next=index+delta;if(next<0||next>=entries.length)return;index=next;const event=new Event('popstate');event.state=clone(entries[index]);target.dispatchEvent(event)})}
  };
  const nav=createNavigation({target,capture:()=>clone(view),restore:next=>{view=clone(next);restored.push(clone(next));nav.record()},hasModal:()=>modal,canCloseModal:()=>allowed,dismissModal:()=>{modal=false;dismissals++}});
  nav.start();
  return {target,nav,entries,restored,get index(){return index},get view(){return view},get modal(){return modal},get dismissals(){return dismissals},setAllowed:value=>{allowed=value},
    route(page,area=view.area){view={...view,page,area};nav.record()},filter(query){view.query=query;nav.record()},scroll(y){target.scrollY=y;target.dispatchEvent(new Event('scroll'))},
    open(){modal=true;nav.modalOpened()},close(){modal=false;nav.modalClosed()},flush(){let turns=0;while(queue.length){assert.ok(turns++<20,'no navigation loop');queue.shift()()}}
  };
}
test('início registra somente a tela atual, sem adicionar trava na saída',()=>{
  const f=fixture();assert.equal(f.entries.length,1);assert.equal(f.index,0);assert.equal(f.target.history.state.retomarNavigationV1.modal,false);
});
test('voltar e avançar restauram telas sem acrescentar entradas',()=>{
  const f=fixture();f.route('agenda');f.route('settings');assert.equal(f.entries.length,3);
  f.target.history.back();f.flush();assert.equal(f.view.page,'agenda');f.target.history.back();f.flush();assert.equal(f.view.page,'plan');
  f.target.history.forward();f.flush();assert.equal(f.view.page,'agenda');assert.equal(f.entries.length,3);
});
test('área, busca, janela de itens e rolagem voltam com a tela',()=>{
  const f=fixture();f.route('plan','estudos');f.filter('projeto');f.view.windows=[['all',180]];f.nav.record();f.scroll(1400);f.route('settings');
  f.target.history.back();f.flush();assert.equal(f.view.area,'estudos');assert.equal(f.view.query,'projeto');assert.deepEqual(f.view.windows,[['all',180]]);assert.equal(f.target.scrollY,1400);
});
test('filtros e atualizações da mesma tela não enchem o histórico',()=>{
  const f=fixture();let writes=0;const replace=f.target.history.replaceState;f.target.history.replaceState=state=>{writes++;replace(state)};
  for(let i=0;i<100;i++)f.filter('Busca '+i);assert.equal(f.entries.length,1);assert.equal(writes,0);
  f.route('settings');f.target.history.back();f.flush();assert.equal(f.view.query,'Busca 99');
});
test('recarregar uma tela também preserva sua busca e rolagem',()=>{
  const a=fixture();a.filter('Termo');a.scroll(450);a.target.dispatchEvent(new Event('beforeunload'));
  const b=fixture({entries:a.entries,index:a.index});assert.equal(b.view.query,'Termo');assert.equal(b.target.scrollY,450);
});
test('voltar fecha primeiro a janela e depois retorna à tela anterior',()=>{
  const f=fixture();f.route('settings');f.open();f.target.history.back();f.flush();assert.equal(f.modal,false);assert.equal(f.dismissals,1);assert.equal(f.view.page,'settings');
  f.target.history.back();f.flush();assert.equal(f.view.page,'plan');
});
test('cancelar, salvar e fechar pelo gesto nativo consomem a entrada da janela',()=>{
  const f=fixture();f.route('settings');f.open();f.close();f.flush();assert.equal(f.index,1);assert.equal(f.view.page,'settings');
  f.target.history.back();f.flush();assert.equal(f.view.page,'plan');
});
test('substituir uma janela por outra não cria uma etapa fantasma',()=>{
  const f=fixture();f.open();f.open();assert.equal(f.entries.length,2);f.close();f.flush();assert.equal(f.index,0);
});
test('recusar descarte no voltar preserva o formulário e a posição do histórico',()=>{
  const f=fixture();f.route('settings');f.open();f.setAllowed(false);f.target.history.back();f.flush();assert.equal(f.modal,true);assert.equal(f.index,2);assert.equal(f.dismissals,0);
  f.setAllowed(true);f.target.history.back();f.flush();assert.equal(f.modal,false);assert.equal(f.index,1);assert.equal(f.view.page,'settings');
});
test('abrir outra janela antes de terminar o fechamento não perde a nova janela',()=>{
  const f=fixture();f.route('settings');f.open();f.close();f.open();f.flush();assert.equal(f.modal,true);assert.equal(f.index,2);
  f.target.history.back();f.flush();assert.equal(f.modal,false);assert.equal(f.view.page,'settings');
});
test('troca rápida de tela enquanto a janela fecha é registrada após o voltar',()=>{
  const f=fixture();f.route('settings');f.open();f.close();f.route('areas');f.flush();assert.equal(f.view.page,'areas');
  f.target.history.back();f.flush();assert.equal(f.view.page,'settings');
});
test('recarregar restaura a tela, mas não reabre nem recupera um formulário',()=>{
  const a=fixture();a.route('settings');a.open();const b=fixture({entries:a.entries,index:a.index});assert.equal(b.view.page,'settings');assert.equal(b.modal,false);assert.equal(b.target.history.state.retomarNavigationV1.modal,false);
});
test('falha de acesso ao histórico mantém a navegação comum disponível',()=>{
  const f=fixture({blocked:true});assert.doesNotThrow(()=>{f.route('settings');f.open();f.close()});assert.equal(f.view.page,'settings');
});
test('histórico alheio ao app não é reescrito nem impede a saída',()=>{
  const f=fixture({entries:[{external:true},null],index:1});f.target.history.back();f.flush();assert.deepEqual(f.target.history.state,{external:true});assert.equal(f.restored.length,0);
});
