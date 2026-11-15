import {DayPreferences,dayToday} from './day.js';
import {addDays} from './planning.js';
import {visibleItems,openItem,validDate} from './domain.js';

export function createDayUI({storage,getState,getZone,onChange,onDisabled,onEdit,onNew=()=>{},getTasks=()=>visibleItems(getState()).filter(openItem),getLayout=()=>'cards',renderTask,renderTools=()=>'',toast,esc,icon}){
  const prefs=new DayPreferences(storage),limits=new Map();let date=dayToday(getZone()),span=1;
  const labelDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'});
  function taskMarkup(task){
    if(renderTask)return `<div class="day-task"><p class="day-task-source">Tarefa · Retomar</p>${renderTask(task,getLayout()==='cards')}</div>`;
    const parent=task.parentId&&getState().items[task.parentId];
    return `<article class="day-task"><div class="day-entry-head"><span class="day-entry-time">${task.time?esc(task.time):'Sem horário'}</span><span class="day-entry-source">Tarefa · Retomar</span></div><div class="day-task-title"><h3>${esc(task.title)}</h3><button type="button" class="iconbtn" data-action="day-edit-task" data-id="${esc(task.id)}" aria-label="Gerenciar: ${esc(task.title)}">${icon('gear')}</button></div>${parent?`<p class="field-help">Subitem de ${esc(parent.title)}</p>`:''}</article>`;
  }
  function dayMarkup(d,filteredTasks){
    const tasks=filteredTasks.filter(t=>t.date===d),limit=limits.get(d)||60,shown=tasks.slice(0,limit),remaining=tasks.length-shown.length;
    return `<section class="day-column" aria-label="${esc(labelDay(d))}"><div class="day-column-heading"><div><h2>${esc(d===dayToday(getZone())?'Hoje · '+labelDay(d):labelDay(d))}</h2><span>${tasks.length} ${tasks.length===1?'tarefa':'tarefas'}</span></div><button type="button" class="iconbtn" data-action="day-new-task" data-date="${d}" aria-label="Adicionar tarefa em ${esc(labelDay(d))}">${icon('plus')}</button></div><div class="day-entries results layout-${getLayout()}">${shown.map(taskMarkup).join('')}</div>${remaining?`<button type="button" class="btn secondary day-more" data-action="day-more" data-date="${d}">Mostrar mais ${Math.min(60,remaining)} · ${shown.length} de ${tasks.length}</button>`:''}${!tasks.length?'<p class="day-empty">Nenhuma tarefa corresponde a este dia e aos filtros.</p>':''}</section>`;
  }
  function page(){
    const tasks=getTasks().slice().sort((a,b)=>(a.time||'24:00').localeCompare(b.time||'24:00')||a.order-b.order),undated=tasks.filter(t=>!t.date).length,overdue=tasks.filter(t=>openItem(t)&&t.date&&t.date<dayToday(getZone())).length;
    return `<div class="page-heading"><h1>Meu dia</h1><p>Tarefas do seu planejamento. Fuso: ${esc(getZone())}.</p></div><section class="day-controls" aria-label="Período de Meu dia"><button type="button" class="iconbtn" data-action="day-prev" aria-label="Período anterior">${icon('left')}</button><div class="field"><label for="day-date">A partir de</label><input type="date" id="day-date" min="1900-01-01" max="2200-12-24" value="${date}"></div><div class="field"><label for="day-span">Período</label><select id="day-span"><option value="1" ${span===1?'selected':''}>Um dia</option><option value="7" ${span===7?'selected':''}>Sete dias</option></select></div><button type="button" class="iconbtn" data-action="day-next" aria-label="Próximo período">${icon('right')}</button><button type="button" class="textbtn" data-action="day-today">Hoje</button></section>${renderTools()}<div class="day-grid ${span===7&&getLayout()==='cards'?'day-grid-week':''}">${Array.from({length:span},(_,i)=>dayMarkup(addDays(date,i),tasks)).join('')}</div><div class="day-other-tasks">${overdue?`<button type="button" class="textbtn" data-action="scope" data-scope="overdue">${overdue} tarefa(s) de dias anteriores</button>`:''}${undated?`<button type="button" class="textbtn" data-action="undated">${undated} tarefa(s) sem data</button>`:''}</div>`;
  }
  function settings(){return `<section class="settingscard"><div class="settings-heading"><span class="settings-icon">${icon('calendar')}</span><div><h2>Meu dia</h2><p>Organize as tarefas de um dia ou de sete dias.</p></div></div><p class="field-help">${prefs.value.enabled?'A visão Meu dia está disponível.':'A visão Meu dia está oculta. Seu planejamento continua disponível.'}</p>${prefs.error?`<p class="planning-warning">${esc(prefs.error)}</p>`:''}<button type="button" class="btn secondary" data-action="day-visibility" aria-pressed="${prefs.value.enabled}">${prefs.value.enabled?'Ocultar Meu dia':'Mostrar Meu dia'}</button></section>`;}
  async function action(name,data={}){
    try{
      if(name==='day-visibility'){prefs.save(!prefs.value.enabled);if(!prefs.value.enabled)onDisabled();onChange();return;}
      if(name==='day-edit-task'){onEdit(data.id);return;}
      if(name==='day-new-task'){if(validDate(data.date))onNew(data.date);return;}
      if(name==='day-more'){if(validDate(data.date)){limits.set(data.date,(limits.get(data.date)||60)+60);onChange();}return;}
      if(!prefs.value.enabled)return;
      if(name==='day-prev'||name==='day-next'){const next=addDays(date,name==='day-prev'?-span:span);if(!validDate(next)||next>'2200-12-24')throw Error('O período está fora do intervalo disponível.');date=next;}
      else if(name==='day-today')date=dayToday(getZone());
      else if(name==='day-date'){if(!validDate(data.value)||data.value>'2200-12-24')throw Error('Escolha uma data válida.');date=data.value;}
      else if(name==='day-span'){if(!['1','7'].includes(String(data.value)))return;span=Number(data.value);}
      else return;
      onChange();
    }catch(e){toast(e.message||'Não foi possível atualizar Meu dia.');}
  }
  return {page,settings,action,get enabled(){return prefs.value.enabled},snapshot:()=>({dayDate:date,daySpan:span}),restore(view){const savedDate=view.dayDate??view.calendarDate,savedSpan=view.daySpan??view.calendarSpan;if(validDate(savedDate)&&savedDate<='2200-12-24')date=savedDate;if([1,7].includes(savedSpan))span=savedSpan;}};
}
