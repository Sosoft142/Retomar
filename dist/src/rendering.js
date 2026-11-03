// Preserva os controles e seus eventos quando os resultados visíveis não mudaram.
const previousMarkup=new WeakMap();
export function updateMarkup(target,markup){
  if(!target||previousMarkup.get(target)===markup)return false;
  target.innerHTML=markup;previousMarkup.set(target,markup);return true;
}
