import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createDayUI} from '../dist/src/day-ui.js';

test('Meu dia pagina conteúdo local sem perder contagens',async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},tasks=Array.from({length:145},(_,i)=>({id:String(i),title:'Etapa '+i,parentId:'',date:'2200-11-12',time:'09:00',status:'pending',order:i}));let changes=0,created;
 const ui=createDayUI({storage,getState:()=>({items:{}}),getTasks:()=>tasks,getZone:()=>'America/Sao_Paulo',getLayout:()=>'compact',onChange:()=>changes++,onNew:d=>created=d,esc:s=>String(s),icon:()=>'',toast:()=>{}});
 await ui.action('day-date',{value:'2200-11-12'});
 function content(){const dom=new JSDOM(ui.page()),result={shown:dom.window.document.querySelectorAll('.day-task').length,text:dom.window.document.querySelector('.day-column-heading').textContent,more:dom.window.document.querySelector('[data-action="day-more"]')?.textContent};dom.window.close();return result;}
 assert.equal(content().shown,60);assert.match(content().text,/145 tarefas/);assert.match(content().more,/60 de 145/);
 await ui.action('day-more',{date:'2200-11-12'});assert.equal(content().shown,120);await ui.action('day-more',{date:'2200-11-12'});assert.equal(content().shown,145);assert.equal(content().more,undefined);
 await ui.action('day-new-task',{date:'2200-11-12'});assert.equal(created,'2200-11-12');await ui.action('day-new-task',{date:'invalid'});assert.equal(created,'2200-11-12');assert.equal(changes,3);
});
