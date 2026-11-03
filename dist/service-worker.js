const CACHE='entrelinhas-vida-shell-v25';
const SHELL=['./','./index.html','./retomar.css','./fonts/inter-latin.woff','./fonts/manrope-latin.woff','./fonts/space-grotesk-latin.woff','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./manifest.webmanifest','./src/app.js','./src/rendering.js','./src/navigation.js','./src/domain.js','./src/repository.js','./src/drag.js','./src/forms.js','./src/collections.js','./src/pwa.js','./src/planning.js','./src/planning-ui.js','./src/push.js','./src/push-ui.js','./src/push-config.js','./src/sync/connect.js','./src/sync/merge.js','./src/sync/crypto.js','./src/sync/gist.js','./src/sync/engine.js','./src/sync/preferences.js','./src/sync/ui.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('entrelinhas-vida-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||e.request.headers.has('authorization'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone))}return r}).catch(async()=>{const cached=await caches.match(e.request);if(cached)return cached;if(e.request.mode==='navigate'){const page=await caches.match('./index.html');if(page)return page}return Response.error()}))});


self.addEventListener('push',event=>{event.waitUntil((async()=>{
  let message;try{message=event.data?.json()}catch{return}
  if(!message||typeof message.title!=='string')return;
  await self.registration.showNotification('Retomar',{
    body:message.title.slice(0,200),silent:message.silent===true,requireInteraction:message.sticky===true,tag:String(message.tag||'retomar').slice(0,200),
    icon:new URL('./icon-192.png',self.registration.scope).href,
    badge:new URL('./icon-192.png',self.registration.scope).href,
    data:{item:typeof message.item==='string'?message.item.slice(0,200):''}
  });
})())});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
  const url=new URL('./',self.registration.scope);if(event.notification.data?.item)url.searchParams.set('item',event.notification.data.item);
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(client=>client.url.startsWith(self.registration.scope));
  if(existing){await existing.navigate(url.href);await existing.focus()}else await self.clients.openWindow(url.href);
})())});
