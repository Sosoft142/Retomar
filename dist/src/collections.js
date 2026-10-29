// A busca e as contagens usam todos os itens; somente a montagem do DOM é limitada.
export class CollectionWindow{
  constructor({pageSize=60,initialBudget=240}={}){this.pageSize=pageSize;this.initialBudget=initialBudget;this.limits=new Map();this.begin()}
  begin(){this.used=0}
  reset(){this.limits.clear();this.begin()}
  take(key,items){if(!this.limits.has(key))this.limits.set(key,Math.min(this.pageSize,Math.max(0,this.initialBudget-this.used)));const visible=items.slice(0,this.limits.get(key));this.used+=visible.length;return {visible,remaining:items.length-visible.length,step:Math.min(this.pageSize,items.length-visible.length)}}
  more(key){this.limits.set(key,(this.limits.get(key)||0)+this.pageSize)}
}
