import test from 'node:test';
import assert from 'node:assert/strict';
import {updateMarkup} from '../dist/src/rendering.js';
import {initialState,activeAreas,updateItem,selectItems} from '../dist/src/domain.js';
import {restoreUIFocus} from '../dist/src/forms.js';
function button({connected=false,visible=true,action='edit',id='task',elementId='',disabled=false}={}){return {isConnected:connected,id:elementId,disabled,dataset:{action,id},getClientRects:()=>visible?[{}]:[],focus(options){this.focused=options}}}
function root(nodes){return {getElementById:id=>nodes.find(n=>n.id===id),querySelectorAll:selector=>selector.startsWith('[data-')?nodes:nodes.filter(n=>n.dataset.action==='page')}}
test('salvar mantém foco na tarefa recriada, sem chamar rolagem para o topo',()=>{const old=button(),header=button({action:'new',id:undefined}),replacement=button();const target=restoreUIFocus(old,root([header,replacement]));assert.equal(target,replacement);assert.deepEqual(replacement.focused,{preventScroll:true});assert.equal(header.focused,undefined)});
test('cancelar formulário sem renderização devolve o foco ao mesmo controle',()=>{const old=button({connected:true});assert.equal(restoreUIFocus(old,root([])),old);assert.deepEqual(old.focused,{preventScroll:true})});
test('exclusão usa alternativa visível e ignora botões ocultos ou desativados',()=>{const old=button(),hidden=button({action:'page',visible:false}),disabled=button({action:'page',disabled:true}),visible=button({action:'page'});assert.equal(restoreUIFocus(old,root([hidden,disabled,visible])),visible);assert.deepEqual(visible.focused,{preventScroll:true})});
test('foco equivalente de outro item não é confundido com o item editado',()=>{const old=button({id:'a'}),wrong=button({id:'b'}),correct=button({id:'a'});assert.equal(restoreUIFocus(old,root([wrong,correct])),correct)});
test('fechar edição rápida retorna ao mesmo campo da mesma tarefa',()=>{const old=button(),wrong=button(),correct=button();old.dataset.field='priority';wrong.dataset.field='deadline';correct.dataset.field='priority';assert.equal(restoreUIFocus(old,root([wrong,correct])),correct)});
test('foco distingue Ativas/Arquivadas e abas com a mesma ação',()=>{
  for(const [action,key,value,other] of [['archive-view','mode','archived','active'],['page','page','day','plan'],['show-more','collection','subitems-a','all'],['day-layout','layout','cards','compact'],['calendar-more','date','2200-11-13','2200-11-12']]){
    const old=button({action}),wrong=button({action}),correct=button({action});old.dataset[key]=value;wrong.dataset[key]=other;correct.dataset[key]=value;
    assert.equal(restoreUIFocus(old,root([wrong,correct])),correct);
  }
});

test('mudança de status retorna ao seletor da mesma tarefa sem rolar',()=>{const old=button();old.dataset={itemStatus:'task'};const recreated=button();recreated.dataset={itemStatus:'task'};assert.equal(restoreUIFocus(old,root([recreated])),recreated);assert.deepEqual(recreated.focused,{preventScroll:true})});

test('resultados iguais preservam controles existentes e mudanças reais atualizam a lista',()=>{let writes=0;const target={set innerHTML(value){writes++;this.saved=value}};assert.equal(updateMarkup(target,'<p>Lista</p>'),true);assert.equal(updateMarkup(target,'<p>Lista</p>'),false);assert.equal(writes,1);assert.equal(updateMarkup(target,'<p>Outro resultado</p>'),true);assert.equal(writes,2)});
test('busca reutilizada reflete edição de título e notas, inclusive na mesma instância',()=>{const s=initialState(),areaId=activeAreas(s)[0].id;updateItem(s,'a',{title:'Café',notes:'primeira',areaId,priority:'normal',status:'pending',date:'',time:''},'qa');const item=s.items.a;assert.equal(selectItems([item],{query:'CAFÉ'}).length,1);item.title='Revisão';item.notes='segunda';assert.equal(selectItems([item],{query:'café'}).length,0);assert.equal(selectItems([item],{query:'SEGUNDA'}).length,1);item.notes='x'.repeat(4000)+' documento';assert.equal(selectItems([item],{query:'documento'}).length,1)});
