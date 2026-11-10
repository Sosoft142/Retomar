import {PRIORITIES,STATUS_LABELS,updateItem,activeAreas} from './domain.js';
import {SavedViews,batchTargets,bulkChange,cleanView} from './workflows.js';
import {submitOnce,checkForm,bindItemSchedule,restoreUIFocus,clearFieldError} from './forms.js';

export function createWorkflowUI({storage,getState,getView,getSelectable,getUndo,onUndo,onApplyView,onRefresh,mutate,deviceId,openModal,closeModal,toast,esc,icon}){
  const views=new SavedViews(storage),selected=new Set();let selecting=false,viewKey='';
  const priorities=PRIORITIES.map(p=>[p.id,p.label]),statuses=Object.entries(STATUS_LABELS);
  const options=(values,current)=>values.map(([value,label])=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(label)}</option>`).join('');
  const actions=(label='Salvar')=>`<div class="dialogactions"><button type="button" class="btn secondary" data-workflow-cancel>Cancelar</button><button type="submit" class="btn primary">${label}</button></div>`;
  const error=()=>'<p class="formerror" role="alert" tabindex="-1"></p>';
  function prepare(root,save){
    root.querySelector('[data-workflow-cancel]').onclick=()=>closeModal();
    root.querySelector('form').onsubmit=submitOnce(async event=>{
      if(!checkForm(event.target))return;
      const button=event.target.querySelector('[type=submit]');button.disabled=true;
      try{await save(event.target)}catch(e){const field=root.querySelector('.formerror');field.textContent=e.message;field.focus();field.scrollIntoView({block:'nearest'});}
      finally{button.disabled=false;}
    });
  }
  function reconcile(){
    const key=JSON.stringify(cleanView(getView()));
    if(viewKey&&key!==viewKey)selected.clear();viewKey=key;
    const allowed=new Set(getSelectable().map(t=>t.id));
    for(const id of selected)if(!allowed.has(id))selected.delete(id);
  }
  function toolbar(){
    return `<div id="workflow-toolbar" class="workflow-toolbar"><div class="workflow-tools"><button type="button" class="textbtn" data-action="workflow-views">${icon('star')} Visualizações</button><button type="button" class="textbtn ${selecting?'selected':''}" data-action="workflow-mode" aria-pressed="${selecting}">${icon('check')} ${selecting?'Sair da seleção':'Selecionar'}</button>${getUndo()?`<button type="button" class="textbtn" data-action="workflow-undo" aria-label="Desfazer última alteração">${icon('resume')} Desfazer</button>`:''}</div>${selecting?`<section class="bulk-bar" aria-label="Ações das tarefas selecionadas"><strong role="status">${selected.size} ${selected.size===1?'selecionada':'selecionadas'}</strong><button type="button" class="textbtn" data-action="workflow-all">Selecionar exibidas</button>${selected.size?'<button type="button" class="textbtn" data-action="workflow-none">Limpar seleção</button>':''}<button type="button" class="btn primary" data-action="workflow-bulk" ${selected.size?'':'disabled'}>Alterar seleção</button></section>`:''}</div>`;
  }
  function selectionButton(t){return `<button type="button" role="checkbox" aria-checked="${selected.has(t.id)}" class="taskcheck selection-check ${selected.has(t.id)?'chosen':''}" data-action="workflow-select" data-id="${esc(t.id)}" aria-label="Selecionar: ${esc(t.title)}"><span class="checkbox">${selected.has(t.id)?icon('check'):''}</span></button>`;}
  function quickField(t,field,markup){
    if(selecting)return markup;
    const title=field==='deadline'?'prazo':field==='priority'?'prioridade':'andamento';
    const cls=field==='deadline'?(t.date?'due-date':'no-date'):field==='priority'?'task-priority-label':'task-status-label';
    return `<button type="button" class="quick-edit ${cls}" data-action="workflow-quick" data-id="${esc(t.id)}" data-field="${field}" aria-label="Alterar ${title} de ${esc(t.title)}" title="Alterar ${title}">${markup}</button>`;
  }
  function quickModal(id,field){
    const task=getState().items[id];if(!task||task.deleted)throw Error('Esta tarefa não está mais disponível.');
    if(!['deadline','priority','status'].includes(field))return;
    const revision=JSON.stringify(task.revision),label=field==='deadline'?'Alterar prazo':field==='priority'?'Alterar prioridade':'Alterar andamento';
    const fields=field==='deadline'?`<div class="fieldsrow"><div class="field"><label for="quick-date">Data <span id="quick-date-optional">· opcional</span></label><input id="quick-date" type="date" min="1900-01-01" max="2200-12-31" value="${task.date}"></div><div class="field"><label for="quick-time">Horário · opcional</label><input id="quick-time" type="time" step="60" value="${task.time}"></div></div><small class="field-help" id="quick-schedule-help"></small><button type="button" class="textbtn" id="quick-clear">Remover data e horário</button>`:`<div class="field"><label for="quick-value">${field==='priority'?'Prioridade':'Andamento'}</label><select id="quick-value">${options(field==='priority'?priorities:statuses,task[field])}</select></div>`;
    const root=openModal(label,`<form>${error()}<p class="quick-task-name">${esc(task.title)}</p>${fields}${actions('Salvar alteração')}</form>`,{className:'quick-dialog'});
    const schedule=field==='deadline'?bindItemSchedule({dateInput:root.querySelector('#quick-date'),timeInput:root.querySelector('#quick-time'),dateOptional:root.querySelector('#quick-date-optional'),help:root.querySelector('#quick-schedule-help'),clearButton:root.querySelector('#quick-clear'),onClear:()=>root.querySelector('#quick-date').dispatchEvent(new root.ownerDocument.defaultView.Event('change',{bubbles:true}))}):null;
    prepare(root,async()=>{
      if(schedule&&!schedule.validate()){checkForm(root.querySelector('form'));return;}
      const fields=field==='deadline'?{date:root.querySelector('#quick-date').value,time:root.querySelector('#quick-time').value}:{[field]:root.querySelector('#quick-value').value};
      if(await mutate(s=>updateItem(s,id,{...fields,expectedRevision:revision},deviceId),'Alteração salva.'))closeModal(true);
    });
  }
  function bulkModal(){
    reconcile();const targets=batchTargets(getState(),selected);if(!targets.length)return;
    const areas=[['','Sem área'],...activeAreas(getState()).map(a=>[a.id,a.name])],archived=getView().archiveMode;
    const root=openModal('Alterar tarefas selecionadas',`<form id="bulk-form">${error()}<p class="confirmtext">${targets.length} ${targets.length===1?'tarefa selecionada':'tarefas selecionadas'}. A alteração será aplicada a toda a seleção.</p><div class="field"><label for="bulk-kind">O que alterar</label><select id="bulk-kind">${options([['deadline','Prazo'],['area','Área'],['priority','Prioridade'],['status','Andamento'],['archive',archived?'Restaurar tarefas':'Arquivar tarefas']],'deadline')}</select></div><div id="bulk-fields"></div><p class="field-help" id="bulk-family-note"></p>${actions('Aplicar à seleção')}</form>`,{className:'bulk-dialog'});
    const kind=root.querySelector('#bulk-kind'),container=root.querySelector('#bulk-fields'),note=root.querySelector('#bulk-family-note');
    function fields(){
      container.innerHTML=kind.value==='deadline'?`<div class="field"><label for="bulk-date-mode">Data</label><select id="bulk-date-mode">${options([['set','Definir uma data'],['clear','Remover data e horário']],'set')}</select></div><div class="field"><label for="bulk-date">Nova data</label><input type="date" id="bulk-date" min="1900-01-01" max="2200-12-31" required></div><div class="field"><label for="bulk-time-mode">Horário</label><select id="bulk-time-mode">${options([['keep','Manter o horário de cada tarefa'],['set','Definir o mesmo horário'],['clear','Remover horário']],'keep')}</select></div><div class="field"><label for="bulk-time">Novo horário</label><input type="time" id="bulk-time" step="60" disabled></div>`:kind.value==='area'?`<div class="field"><label for="bulk-value">Área de destino</label><select id="bulk-value">${options(areas,'')}</select></div>`:['priority','status'].includes(kind.value)?`<div class="field"><label for="bulk-value">${kind.value==='priority'?'Prioridade':'Andamento'}</label><select id="bulk-value">${options(kind.value==='priority'?priorities:statuses,kind.value==='priority'?'normal':'pending')}</select></div>`:`<p class="confirmtext">${archived?'As tarefas voltarão ao planejamento.':'As tarefas sairão do planejamento e dos avisos. Elas poderão ser restauradas depois.'}</p>`;
      note.textContent=kind.value==='area'?'Ao transferir uma tarefa principal, todos os seus subitens acompanham a área. Para transferir apenas um subitem, selecione também a tarefa principal.':kind.value==='archive'?'Arquivar uma tarefa principal também oculta seus subitens. Para restaurar um subitem, restaure também a tarefa principal.':'Cada subitem mantém seu prazo e andamento, exceto quando também estiver selecionado.';
      container.querySelectorAll('input,select').forEach(field=>{field.addEventListener('input',()=>clearFieldError(field));field.addEventListener('change',()=>clearFieldError(field));});
      if(kind.value==='deadline'){
        const update=()=>{const clear=root.querySelector('#bulk-date-mode').value==='clear',mode=root.querySelector('#bulk-time-mode').value;root.querySelector('#bulk-date').disabled=clear;root.querySelector('#bulk-time-mode').disabled=clear;root.querySelector('#bulk-time').disabled=clear||mode!=='set';root.querySelector('#bulk-time').required=!clear&&mode==='set';};
        root.querySelector('#bulk-date-mode').onchange=update;root.querySelector('#bulk-time-mode').onchange=update;update();
      }
    }
    kind.onchange=fields;fields();
    prepare(root,async()=>{
      const change={kind:kind.value};
      if(change.kind==='deadline')Object.assign(change,{clear:root.querySelector('#bulk-date-mode').value==='clear',date:root.querySelector('#bulk-date').value,timeMode:root.querySelector('#bulk-time-mode').value,time:root.querySelector('#bulk-time').value});
      else if(change.kind==='area')change.areaId=root.querySelector('#bulk-value').value;
      else if(change.kind==='archive')change.archived=!archived;
      else change.value=root.querySelector('#bulk-value').value;
      if(await mutate(s=>bulkChange(s,targets,change,deviceId),`${targets.length} tarefa(s) atualizada(s).`)){selected.clear();selecting=false;onRefresh();closeModal(true);}
    });
  }
  function savedModal(){
    const current=cleanView(getView()),saved=views.load();
    const root=openModal('Visualizações favoritas',`<form>${error()}<p class="field-help">Salve a área, a busca, os filtros e a organização atuais. As visualizações ficam neste aparelho e não alteram suas tarefas.</p><div class="field"><label for="view-name">Nome da visualização atual</label><input id="view-name" type="text" maxlength="60" required placeholder="Ex.: Estudos da semana"></div><div class="saved-views">${saved.length?saved.map(v=>`<div class="saved-view"><button type="button" class="saved-view-apply" data-view-apply="${esc(v.id)}"><strong>${esc(v.name)}</strong><small>${v.view.archiveMode?'Arquivadas':'Ativas'} · ${v.view.layout==='cards'?'Cartões':'Lista'}${v.view.query?' · Busca: '+esc(v.view.query):''}</small></button><button type="button" class="iconbtn" data-view-rename="${esc(v.id)}" aria-label="Renomear ${esc(v.name)}">${icon('edit')}</button><button type="button" class="iconbtn" data-view-remove="${esc(v.id)}" aria-label="Remover ${esc(v.name)}">${icon('trash')}</button></div>`).join(''):'<p class="field-help">Nenhuma visualização salva ainda.</p>'}</div>${actions('Salvar visualização')}</form>`,{className:'saved-views-dialog'});
    prepare(root,async()=>{await views.save(root.querySelector('#view-name').value,current);closeModal(true);toast('Visualização salva neste aparelho.');});
    const showError=e=>{root.querySelector('.formerror').textContent=e.message;root.querySelector('.formerror').focus();};
    root.querySelectorAll('[data-view-apply]').forEach(button=>button.onclick=()=>{try{const item=views.load().find(v=>v.id===button.dataset.viewApply);if(!item)throw Error('Esta visualização não está mais disponível.');const area=item.view.area;if(area!==''&&area!=='all'&&(!getState().areas[area]||getState().areas[area].deleted))throw Error('A área desta visualização foi removida. Escolha outra visualização.');if(!closeModal())return;selected.clear();onApplyView(item.view);toast('Visualização aplicada: '+item.name);}catch(e){showError(e);}});
    root.querySelectorAll('[data-view-remove]').forEach(button=>button.onclick=async()=>{const item=saved.find(v=>v.id===button.dataset.viewRemove);if(!confirm(`Remover a visualização “${item.name}”? Suas tarefas serão preservadas.`))return;try{await views.remove(item.id,item.revision);button.closest('.saved-view').remove();toast('Visualização removida.');}catch(e){showError(e);}});
    root.querySelectorAll('[data-view-rename]').forEach(button=>button.onclick=()=>{
      const item=saved.find(v=>v.id===button.dataset.viewRename);if(!closeModal())return;
      const edit=openModal('Renomear visualização',`<form>${error()}<div class="field"><label for="view-rename">Nome</label><input id="view-rename" type="text" required maxlength="60" value="${esc(item.name)}"></div>${actions('Salvar nome')}</form>`);
      prepare(edit,async()=>{await views.save(edit.querySelector('#view-rename').value,item.view,{id:item.id,expectedRevision:item.revision});closeModal(true);toast('Nome da visualização atualizado.');});
    });
  }
  async function action(name,data){
    if(name==='workflow-mode'){selecting=!selecting;selected.clear();onRefresh();return;}
    if(name==='workflow-select'){const focus=document.activeElement;if(selected.has(data.id))selected.delete(data.id);else selected.add(data.id);onRefresh();restoreUIFocus(focus);return;}
    if(name==='workflow-all'){for(const node of document.querySelectorAll('[data-action="workflow-select"]'))selected.add(node.dataset.id);onRefresh();return;}
    if(name==='workflow-none'){selected.clear();onRefresh();return;}
    if(name==='workflow-undo'){await onUndo();return;}
    if(name==='workflow-bulk'){bulkModal();return;}
    if(name==='workflow-views'){savedModal();return;}
    if(name==='workflow-quick')quickModal(data.id,data.field);
  }
  return {toolbar,quickField,selectionButton,reconcile,action,get selecting(){return selecting},isSelected:id=>selected.has(id)};
}
