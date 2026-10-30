import {hasVisibleText,validDate} from './domain.js';
export function clearFieldError(field){field.setCustomValidity('');field.removeAttribute('aria-invalid');const hint=field.closest('.field')?.querySelector('.field-error');if(hint)hint.remove();const ids=(field.getAttribute('aria-describedby')||'').split(' ').filter(x=>x&&x!==field.id+'-error');if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby')}
export function showFieldError(field,message){field.setAttribute('aria-invalid','true');const parent=field.closest('.field');if(!parent)return;let hint=parent.querySelector('.field-error');if(!hint){hint=document.createElement('small');hint.className='field-error';hint.id=field.id+'-error';parent.append(hint)}hint.textContent=message;const ids=new Set((field.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));ids.add(hint.id);field.setAttribute('aria-describedby',[...ids].join(' '))}
export function bindFormErrors(form){form.noValidate=true;for(const field of form.querySelectorAll('input,select,textarea')){field.addEventListener('input',()=>clearFieldError(field));field.addEventListener('change',()=>clearFieldError(field))}form.addEventListener('invalid',e=>{const f=e.target;const message=fieldValidationMessage(f);showFieldError(f,message)},true)}
export function checkForm(form){for(const field of form.querySelectorAll('input,textarea'))if(!field.disabled&&['text','search','textarea','password'].includes(field.type)){const message=textFieldError(field.value,field);if(message)field.setCustomValidity(message)}const valid=form.checkValidity();if(!valid){const first=form.querySelector(':invalid');const details=first?.closest('details');if(details)details.open=true;first?.focus()}return valid}
export const validToken=token=>typeof token==='string'&&token.length>=12&&token.length<=512&&/^[A-Za-z0-9_]+$/.test(token);
export function textFieldError(value,{required=false,maxLength=-1,minLength=-1}={}){if(required&&!hasVisibleText(value))return 'Preencha este campo com texto visível.';if(maxLength>=0&&value.length>maxLength)return `Use no máximo ${maxLength} caracteres.`;if(value&&minLength>=0&&value.length<minLength)return `Use pelo menos ${minLength} caracteres.`;return '';}
export function submitOnce(handler){let pending=false;return async event=>{event.preventDefault();if(pending)return;pending=true;try{return await handler(event)}finally{pending=false}};}

// O horário nunca é descartado por uma edição parcial da data.
export function scheduleFieldErrors(date,time,{dateBadInput=false,timeBadInput=false,timeStepMismatch=false}={}){
  const errors={};
  if(dateBadInput||(date&&!validDate(date)))errors.date='Escolha uma data válida entre 1900 e 2200.';
  else if((time||timeBadInput)&&!date)errors.date='Escolha uma data para salvar este horário.';
  if(timeBadInput||timeStepMismatch||(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))errors.time='Informe um horário completo entre 00:00 e 23:59, sem segundos.';
  return errors;
}
export function bindItemSchedule({dateInput,timeInput,dateOptional,help,clearButton,onClear=()=>{}}){
  const refresh=()=>{
    dateInput.required=!!timeInput.value||timeInput.validity.badInput;
    if(dateOptional)dateOptional.textContent=dateInput.required?'· necessária para o horário':'· opcional';
    help.textContent=(dateInput.value?'O seletor segue o formato deste aparelho.':'Pode preencher o horário primeiro; escolha também uma data antes de salvar.')+(/^([01]\d|2[0-3]):[0-5]\d$/.test(timeInput.value)?' Horário em 24 horas: '+timeInput.value+'.':'');
    clearFieldError(dateInput);clearFieldError(timeInput);
  };
  for(const input of [dateInput,timeInput])for(const event of ['input','change'])input.addEventListener(event,refresh);
  clearButton.addEventListener('click',()=>{dateInput.value='';timeInput.value='';refresh();onClear()});
  refresh();
  return {validate(){
    clearFieldError(dateInput);clearFieldError(timeInput);
    const errors=scheduleFieldErrors(dateInput.value,timeInput.value,{dateBadInput:dateInput.validity.badInput,timeBadInput:timeInput.validity.badInput,timeStepMismatch:timeInput.validity.stepMismatch});
    dateInput.setCustomValidity(errors.date||'');timeInput.setCustomValidity(errors.time||'');
    return Object.keys(errors).length===0;
  }};
}
export function refreshSelectHint(field){
  const text=field.selectedOptions[0]?.textContent||'',parent=field.closest('.field');if(!parent)return;
  let hint=parent.querySelector('.selected-value');
  if(!hint){hint=document.createElement('small');hint.className='field-help selected-value';hint.id=field.id+'-value';parent.append(hint);const ids=new Set((field.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));ids.add(hint.id);field.setAttribute('aria-describedby',[...ids].join(' '));}
  // O seletor nativo não permite quebra de linha; o valor extenso aparece logo abaixo.
  hint.textContent=text;const style=getComputedStyle(field),canvas=document.createElement('canvas'),context=canvas.getContext('2d');if(context)context.font=style.font;const available=field.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-24;hint.hidden=context?context.measureText(text).width<=available:text.length<=30;field.title=text;
}
export function bindSelectHint(field){field.addEventListener('change',()=>refreshSelectHint(field));refreshSelectHint(field)}
export function resizeTextArea(field){field.style.height='auto';field.style.height=(field.scrollHeight+field.offsetHeight-field.clientHeight)+'px'}
export function fitTextArea(field){field.addEventListener('input',()=>resizeTextArea(field));resizeTextArea(field)}

export function fieldValidationMessage(field){
  const v=field.validity;
  if(v.customError)return field.validationMessage;
  if(v.valueMissing)return 'Preencha este campo.';
  if(field.type==='time'&&(v.badInput||v.stepMismatch))return 'Informe um horário completo entre 00:00 e 23:59, sem segundos.';
  if(field.type==='date'&&(v.badInput||v.rangeUnderflow||v.rangeOverflow))return 'Escolha uma data válida entre 1900 e 2200.';
  if(v.rangeUnderflow||v.rangeOverflow)return 'Escolha um valor dentro do intervalo permitido.';
  if(v.typeMismatch||v.badInput)return 'Confira o valor informado.';
  return field.validationMessage;
}
