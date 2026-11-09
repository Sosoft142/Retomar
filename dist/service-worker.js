const CACHE='entrelinhas-vida-shell-v34';
const SHELL=['./','./index.html','./retomar.css','./fonts/inter-latin.woff','./fonts/manrope-latin.woff','./fonts/space-grotesk-latin.woff','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./manifest.webmanifest','./src/app.js','./src/rendering.js','./src/navigation.js','./src/domain.js','./src/repository.js','./src/drag.js','./src/forms.js','./src/collections.js','./src/pwa.js','./src/planning.js','./src/planning-ui.js','./src/push.js','./src/push-ui.js','./src/push-config.js','./src/sync/connect.js','./src/sync/merge.js','./src/sync/crypto.js','./src/sync/gist.js','./src/sync/engine.js','./src/sync/preferences.js','./src/sync/ui.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('entrelinhas-vida-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const shellURLs=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||e.request.headers.has('authorization'))return;
  const key=new URL(u);key.search='';key.hash='';const shell=shellURLs.has(key.href);
  e.respondWith(fetch(e.request).then(r=>{
    if(shell&&r.ok&&r.type==='basic'){const clone=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key.href,clone)).catch(()=>{}))}
    return r;
  }).catch(async()=>{
    const cached=await caches.match(e.request)||(shell?await caches.match(key.href):null);if(cached)return cached;
    if(e.request.mode==='navigate'){const page=await caches.match(new URL('./index.html',self.registration.scope).href);if(page)return page}
    return Response.error();
  }));
});


self.addEventListener('push',event=>{event.waitUntil((async()=>{
  let message;try{message=event.data?.json()}catch{return}
  if(!message||typeof message.title!=='string')return;
  const test=/^retomar-prova-(\d{13})$/.exec(message.tag);
  const testTime=test?new Date(Number(test[1])).toLocaleTimeString('pt-BR'):'';
  const sentTime=Number.isSafeInteger(message.sentAt)?new Date(message.sentAt).toLocaleTimeString('pt-BR'):'';
  await self.registration.showNotification('Retomar',{
    body:test?message.title+' · previsto '+testTime+(sentTime?' · envio '+sentTime:'')+' · recebido '+new Date().toLocaleTimeString('pt-BR'):message.title.slice(0,200),
    ...(message.silent===true ? {silent:true} : {vibrate:[200,100,200],renotify:true}),
    requireInteraction:message.sticky===true,tag:String(message.tag||'retomar').slice(0,200),
    icon:new URL('./icon-192.png',self.registration.scope).href,
    badge:new URL('./icon-192.png',self.registration.scope).href,
    data:{item:!test&&typeof message.item==='string'?message.item.slice(0,200):''}
  });
})())});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
  const url=new URL('./',self.registration.scope);if(event.notification.data?.item)url.searchParams.set('item',event.notification.data.item);
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(client=>client.url.startsWith(self.registration.scope));
  if(existing){await existing.navigate(url.href);await existing.focus()}else await self.clients.openWindow(url.href);
})())});
