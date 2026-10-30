import test from 'node:test';
import assert from 'node:assert/strict';
import {bindItemSchedule,scheduleFieldErrors,fieldValidationMessage,checkForm} from '../dist/src/forms.js';
import {initialState,activeAreas,updateItem,validateState} from '../dist/src/domain.js';
import {Repository,DATA_KEY} from '../dist/src/repository.js';
class Field extends EventTarget{
  constructor(type,value=''){super();this.type=type;this.value=value;this.required=false;this.disabled=false;this.attrs=new Map();this.validity={badInput:false,stepMismatch:false};}
  setCustomValidity(value){this.validationMessage=value;this.validity.customError=!!value}
  removeAttribute(key){this.attrs.delete(key)}
  getAttribute(key){return this.attrs.get(key)||null}
  setAttribute(key,value){this.attrs.set(key,value)}
  closest(){return null}
  edit(value,event='input'){this.value=value;this.dispatchEvent(new Event(event))}
}
function form(date='',time=''){
 const dateInput=new Field('date',date),timeInput=new Field('time',time),dateOptional={},help={},clearButton=new EventTarget();let clears=0;
 const schedule=bindItemSchedule({dateInput,timeInput,dateOptional,help,clearButton,onClear:()=>clears++});
 return {dateInput,timeInput,dateOptional,help,clearButton,schedule,clears:()=>clears};
}
const disk=()=>{let raw=null;return {getItem:()=>raw,setItem:(key,value)=>raw=value}};
function add(s,id,extra={}){return updateItem(s,id,{title:'Fictício '+id,notes:'',areaId:activeAreas(s)[0].id,status:'pending',priority:'normal',date:'',time:'',...extra},'qa')}
test('horário pode ser preenchido primeiro; a falta de data é indicada sem descartar o horário',()=>{
 const f=form();assert.equal(f.timeInput.disabled,false);f.timeInput.edit('14:35');assert.equal(f.dateInput.required,true);assert.match(f.dateOptional.textContent,/necessária/);assert.equal(f.schedule.validate(),false);assert.match(f.dateInput.validationMessage,/data.*horário/);assert.equal(f.timeInput.value,'14:35');f.dateInput.edit('2026-11-16');assert.equal(f.schedule.validate(),true);assert.equal(f.timeInput.value,'14:35');
});
for(const event of ['input','change'])test('dependência da data responde ao evento '+event+', sem depender de perder o foco',()=>{
 const f=form();f.timeInput.edit('00:00',event);assert.equal(f.dateInput.required,true);f.timeInput.edit('',event);assert.equal(f.dateInput.required,false);assert.equal(f.schedule.validate(),true);
});
test('apagar a data durante a edição não apaga o horário; corrigir a data mantém a escolha',()=>{
 const f=form('2026-11-16','23:59');f.dateInput.edit('');assert.equal(f.timeInput.value,'23:59');assert.equal(f.schedule.validate(),false);f.dateInput.edit('2028-02-29');assert.equal(f.schedule.validate(),true);assert.equal(f.timeInput.value,'23:59');
});
test('comando explícito de remover a programação limpa os dois valores e os erros, sem bloquear o horário',()=>{
 const f=form('','10:30');f.schedule.validate();f.clearButton.dispatchEvent(new Event('click'));assert.equal(f.dateInput.value,'');assert.equal(f.timeInput.value,'');assert.equal(f.dateInput.required,false);assert.equal(f.timeInput.disabled,false);assert.equal(f.dateInput.validationMessage,'');assert.equal(f.schedule.validate(),true);assert.equal(f.clears(),1);f.timeInput.edit('11:45');assert.equal(f.timeInput.value,'11:45');
});
test('todos os 1440 minutos do dia são aceitos com data, inclusive meia-noite',()=>{
 for(let m=0;m<1440;m++){const time=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');assert.deepEqual(scheduleFieldErrors('2028-02-29',time),{},time)}
});
test('horários incompletos, fora do intervalo e com segundos têm mensagem junto ao horário',()=>{
 for(const time of ['9:00','24:00','12:60','12:','12:30:00','-1:00','abc'])assert.match(scheduleFieldErrors('2026-11-16',time).time,/horário completo/,time);
 assert.match(scheduleFieldErrors('2026-11-16','',{timeBadInput:true}).time,/horário completo/);assert.match(scheduleFieldErrors('2026-11-16','12:30',{timeStepMismatch:true}).time,/sem segundos/);
});
test('datas impossíveis e limites fora de 1900–2200 são rejeitados preservando horário',()=>{
 for(const date of ['2026-02-30','1900-02-29','1899-12-31','2201-01-01','2026-1-1'])assert.match(scheduleFieldErrors(date,'08:05').date,/data válida/,date);
 for(const date of ['1900-01-01','2000-02-29','2200-12-31'])assert.deepEqual(scheduleFieldErrors(date,'08:05'),{});
});
test('datas e horários parcialmente digitados não são tratados como campos opcionais vazios',()=>{
 const f=form();f.dateInput.validity.badInput=true;assert.equal(f.schedule.validate(),false);assert.match(f.dateInput.validationMessage,/data válida/);f.dateInput.validity.badInput=false;f.timeInput.validity.badInput=true;assert.equal(f.schedule.validate(),false);assert.match(f.timeInput.validationMessage,/horário completo/);
});
test('validação considera os valores atuais mesmo sem evento de edição',()=>{
 const f=form();f.timeInput.value='14:35';assert.equal(f.schedule.validate(),false);f.dateInput.value='2026-11-16';assert.equal(f.schedule.validate(),true);assert.equal(f.dateInput.validationMessage,'');
});
test('a mensagem específica de horário sem data prevalece sobre o erro genérico de campo obrigatório',()=>{
 assert.equal(fieldValidationMessage({type:'date',validity:{customError:true,valueMissing:true},validationMessage:'Escolha uma data para salvar este horário.'}),'Escolha uma data para salvar este horário.');
 assert.equal(fieldValidationMessage({type:'text',validity:{customError:true},validationMessage:'Preencha este campo com texto visível.'}),'Preencha este campo com texto visível.');
});
test('erros nativos de data e hora são apresentados em português',()=>{
 for(const flag of ['badInput','rangeUnderflow','rangeOverflow'])assert.match(fieldValidationMessage({type:'date',validity:{[flag]:true},validationMessage:'Native English'}),/data válida/);
 for(const flag of ['badInput','stepMismatch'])assert.match(fieldValidationMessage({type:'time',validity:{[flag]:true},validationMessage:'Native English'}),/horário completo/);
});
test('horário próprio do subitem persiste após reabrir e exportar sem modificar o horário do pai',async()=>{
 const storage=disk(),repo=new Repository(storage);await repo.commit(s=>{add(s,'parent',{date:'2026-11-16',time:'09:00'});add(s,'child',{parentId:'parent'})});
 const f=form();f.timeInput.edit('00:00');f.dateInput.edit('2028-02-29');assert.equal(f.schedule.validate(),true);
 await repo.commit(s=>updateItem(s,'child',{date:f.dateInput.value,time:f.timeInput.value},'qa'));const reopened=new Repository(storage).load();assert.equal(reopened.items.child.time,'00:00');assert.equal(reopened.items.child.date,'2028-02-29');assert.equal(reopened.items.parent.time,'09:00');validateState(JSON.parse(storage.getItem(DATA_KEY)));
});
test('horário inválido no subitem não altera os bytes de um planejamento válido',async()=>{
 const storage=disk(),repo=new Repository(storage);await repo.commit(s=>{add(s,'parent');add(s,'child',{parentId:'parent',date:'2026-11-16',time:'14:35'})});const before=storage.getItem(DATA_KEY);
 for(const fields of [{date:'',time:'14:35'},{time:'24:00'},{date:'2026-02-30'}]){await assert.rejects(repo.commit(s=>updateItem(s,'child',fields,'qa')));assert.equal(storage.getItem(DATA_KEY),before)}
});

test('validação genérica de texto preserva a explicação específica de uma conexão obrigatória',()=>{
 const field=new Field('text');field.required=true;field.focus=()=>{};field.setCustomValidity('Cole o ID público completo do cliente OAuth.');
 const form={querySelectorAll:()=>[field],checkValidity:()=>false,querySelector:()=>field};
 assert.equal(checkForm(form),false);assert.equal(field.validationMessage,'Cole o ID público completo do cliente OAuth.');
});
