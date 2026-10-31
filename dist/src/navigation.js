// Só telas e janelas abertas ocupam o histórico. Dados e credenciais ficam fora dele.
const KEY='retomarNavigationV1';
export function createNavigation({target=window,capture,restore,hasModal,canCloseModal,dismissModal}){
  const history=target.history;
  let current=null,pending=null,queuedModal=false,restoring=false,enabled=true;
  const key=view=>view.page+'|'+view.area;
  const read=state=>{
    const entry=state?.[KEY];
    return entry&&typeof entry.session==='string'&&Number.isSafeInteger(entry.index)&&entry.index>=0&&entry.view&&typeof entry.view.page==='string'&&typeof entry.view.area==='string'?entry:null;
  };
  function write(entry,replace=false){
    if(!enabled)return false;
    try{history[replace?'replaceState':'pushState']({...history.state,[KEY]:entry},'');return true}
    catch{enabled=false;return false}
  }
  function replace(){write(current,true)}
  function record(){
    if(!enabled||!current||restoring||pending)return;
    const view=capture();
    if(key(view)===key(current.view)){current={...current,view};return}
    replace();
    current={session:current.session,index:current.index+1,view,scrollY:0,modal:false};
    write(current);
  }
  function modalOpened(){
    if(!enabled||!current)return;
    if(pending){queuedModal=true;return}
    record();
    if(current.modal)return;
    current={...current,view:capture(),scrollY:target.scrollY||0};replace();
    current={...current,index:current.index+1,modal:true};write(current);
  }
  function modalClosed(){
    queuedModal=false;
    if(!enabled||!current?.modal||pending)return;
    pending='close';history.back();
  }
  function flush(){
    record();
    if(queuedModal&&hasModal()){queuedModal=false;modalOpened()}
  }
  function apply(entry){
    // Avançar/recarregar não reabre um formulário nem recupera seu texto descartado.
    current={...entry,modal:false};replace();restoring=true;
    try{restore(current.view);target.scrollTo(0,Math.max(0,Number(current.scrollY)||0))}
    finally{restoring=false}
  }
  function popped(event){
    const next=read(event.state);
    if(!enabled||!next||next.session!==current?.session)return;
    if(pending){current=next;pending=null;flush();return}
    if(hasModal()&&!canCloseModal()){
      const delta=current.index-next.index;
      if(delta){pending='restore';history.go(delta)}
      return;
    }
    if(hasModal())dismissModal();
    apply(next);
  }
  const scrolled=()=>{if(current&&!pending&&!restoring&&!current.modal)current.scrollY=target.scrollY||0};
  const leaving=()=>{if(current&&!pending){current.view=capture();scrolled();replace()}};
  function start(){
    const saved=read(history.state);
    current=saved||{session:Date.now().toString(36)+Math.random().toString(36).slice(2),index:0,view:capture(),scrollY:target.scrollY||0,modal:false};
    try{history.scrollRestoration='manual'}catch{}
    if(saved)apply(saved);else replace();
    target.addEventListener('popstate',popped);target.addEventListener('scroll',scrolled,{passive:true});
    target.addEventListener('beforeunload',leaving);
  }
  return {start,record,modalOpened,modalClosed,dispose(){target.removeEventListener('popstate',popped);target.removeEventListener('scroll',scrolled);target.removeEventListener('beforeunload',leaving)}};
}
