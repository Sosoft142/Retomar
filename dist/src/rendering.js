import {PRIORITIES} from './domain.js';

// Preserva os controles e seus eventos quando os resultados visíveis não mudaram.
const previousMarkup=new WeakMap();
export function updateMarkup(target,markup){
  if(!target||previousMarkup.get(target)===markup)return false;
  target.innerHTML=markup;previousMarkup.set(target,markup);return true;
}

export function updateFilterIndicator(button,count){
  if(!button)return;
  button.classList.toggle('selected',count>0||button.getAttribute('aria-expanded')==='true');
  const label=button.querySelector('span');if(label)label.textContent='Filtros'+(count?' · '+count:'');
}

// Mesmas cores e identificação de prioridade no planejamento e nos lembretes.
export function taskAppearance(item,areas){
  const areaColor=areas[item.areaId]?.color||'#ffffff';
  return `style="--task-background:${item.color||areaColor};--area-color:${areaColor}"`;
}
export function priorityIndicator(id){
  const priority=PRIORITIES.find(p=>p.id===id);
  return `<span class="task-priority-label" aria-label="Prioridade: ${priority.label}"><i class="priority-mark" aria-hidden="true">${priority.symbol}</i><span class="sr-only">${priority.label}</span></span>`;
}
