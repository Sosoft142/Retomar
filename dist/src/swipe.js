export function swipeDecision(dx,dy,duration,width){
  if(Math.abs(dx)<28||Math.abs(dx)<Math.abs(dy)*1.4)return 0;
  const threshold=Math.max(42,Math.min(90,width*.18));
  return Math.abs(dx)>=threshold||(duration>0&&duration<350&&Math.abs(dx)/duration>.5)?(dx<0?1:-1):0;
}

// A rolagem vertical, a pinça, os campos e as alças continuam sob seus controles próprios.
export function bindSwipe(root,{canMove,onMove,isBlocked=()=>false,motion=()=>true,target=root.ownerDocument.defaultView}){
  root._swipeCleanup?.();const doc=root.ownerDocument;let active=null,frame=0,suppressUntil=0;
  const raf=fn=>target.requestAnimationFrame(fn),cancel=id=>target.cancelAnimationFrame(id);
  function reset(){
    cancel(frame);frame=0;
    const previous=active;active=null;
    if(previous){if(previous.locked&&motion()&&previous.surface.isConnected)previous.surface.animate?.([{transform:previous.surface.style.transform||'none',opacity:previous.surface.style.opacity||1},{transform:'translate3d(0,0,0)',opacity:1}],{duration:140,easing:'ease-out'});previous.surface.style.removeProperty('transform');previous.surface.style.removeProperty('opacity');previous.surface.style.removeProperty('will-change');try{root.releasePointerCapture(previous.pointerId)}catch{}}
    doc.documentElement.classList.remove('swiping');
  }
  function down(event){
    if(event.isPrimary===false){reset();return}
    if(active||event.button!==0||isBlocked())return;
    const surface=event.target.closest('[data-swipe-scope]');if(!surface||!root.contains(surface))return;
    const nav=surface.matches('nav'),control=event.target.closest('input,textarea,select,a,button,summary,[contenteditable], [data-drag-handle],[data-no-swipe]');
    if(control&&!(nav&&control.matches('button[data-action="page"],button[data-action="gym-select"]')))return;
    const width=doc.documentElement.clientWidth||target.innerWidth;
    if(event.clientX<24||event.clientX>width-24)return;
    active={surface,scope:surface.dataset.swipeScope,pointerId:event.pointerId,x:event.clientX,y:event.clientY,dx:0,dy:0,start:event.timeStamp,locked:false,width};
  }
  function move(event){
    if(!active||event.pointerId!==active.pointerId)return;
    if(isBlocked()||!active.surface.isConnected){reset();return}
    const dx=event.clientX-active.x,dy=event.clientY-active.y;
    if(!active.locked){
      if(Math.hypot(dx,dy)<10)return;
      if(Math.abs(dy)>Math.abs(dx)||!canMove(active.scope,dx<0?1:-1)){reset();return}
      if(Math.abs(dx)<Math.abs(dy)*1.4)return;
      active.locked=true;doc.documentElement.classList.add('swiping');
      try{root.setPointerCapture(active.pointerId)}catch{}
    }
    active.dx=dx;active.dy=dy;event.preventDefault();
    if(!motion()||frame)return;
    frame=raf(()=>{frame=0;if(!active?.locked)return;active.surface.style.willChange='transform';active.surface.style.transform=`translate3d(${Math.max(-100,Math.min(100,active.dx*.4))}px,0,0)`;active.surface.style.opacity=String(1-Math.min(.18,Math.abs(active.dx)/active.width*.25));});
  }
  function up(event){
    if(!active||event.pointerId!==active.pointerId)return;
    const entry=active,delta=entry.locked?swipeDecision(event.clientX-entry.x,event.clientY-entry.y,event.timeStamp-entry.start,entry.width):0;
    if(entry.locked)suppressUntil=Date.now()+400;
    reset();if(delta&&!isBlocked()&&canMove(entry.scope,delta))onMove(entry.scope,delta);
  }
  const cancelled=event=>{if(!event||event.pointerId===active?.pointerId)reset()};
  const clicked=event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation()}};
  const hidden=()=>{if(doc.hidden)reset()};
  root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move,{passive:false});target.addEventListener('pointerup',up);target.addEventListener('pointercancel',cancelled);root.addEventListener('lostpointercapture',cancelled);root.addEventListener('click',clicked,true);target.addEventListener('blur',reset);doc.addEventListener('visibilitychange',hidden);
  root._swipeCleanup=()=>{reset();root.removeEventListener('pointerdown',down);root.removeEventListener('pointermove',move);target.removeEventListener('pointerup',up);target.removeEventListener('pointercancel',cancelled);root.removeEventListener('lostpointercapture',cancelled);root.removeEventListener('click',clicked,true);target.removeEventListener('blur',reset);doc.removeEventListener('visibilitychange',hidden)};
  return root._swipeCleanup;
}
