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
