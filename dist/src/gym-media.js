import {safeURL} from './gym.js';
export function descriptionURLs(description){
  const found=[];
  for(const match of description.matchAll(/https:\/\/[^\s<>"']+/gi)){
    let label=match[0],previous;
    do{previous=label;label=label.replace(/[.,;!?]+$/,'');for(const [open,close] of [['(',')'],['[',']'],['{','}']])while(label.endsWith(close)&&label.split(close).length>label.split(open).length)label=label.slice(0,-1)}while(previous!==label);
    const url=safeURL(label);if(url)found.push({start:match.index,end:match.index+label.length,label,url});
  }
  return found;
}
export const descriptionLinks=description=>[...new Set(descriptionURLs(description).map(link=>link.url))];
export function videoInfo(value){
  const safe=safeURL(value);if(!safe)return null;const u=new URL(safe),host=u.hostname.replace(/^www\./,'');let id='';
  if(host==='youtu.be')id=u.pathname.split('/')[1];
  else if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  if(id&&/^[\w-]{11}$/.test(id))return {provider:'YouTube',id,url:safe,thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`};
  if(['vimeo.com','player.vimeo.com'].includes(host)){
    id=u.pathname.match(/(?:^\/|\/video\/|\/videos\/|\/)(\d+)(?:\/[^/]*)?\/?$/)?.[1];
    if(id)return {provider:'Vimeo',id,url:safe,thumbnail:''};
  }
  return null;
}
export function createGymMedia({fetcher=(...args)=>fetch(...args)}={}){
  const cache=new Map(),pending=new Map();
  async function thumbnail(info){
    if(info.thumbnail)return info.thumbnail;
    if(cache.has(info.url))return cache.get(info.url);
    if(pending.has(info.url))return pending.get(info.url);
    const request=Promise.resolve().then(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const r=await fetcher('https://vimeo.com/api/oembed.json?url='+encodeURIComponent(info.url)+'&width=640',{credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});if(!r.ok)return '';const json=await r.json(),url=safeURL(json.thumbnail_url),host=url?new URL(url).hostname:'';const result=host==='i.vimeocdn.com'||host.endsWith('.vimeocdn.com')?url:'';if(result)cache.set(info.url,result);return result;}catch{return ''}finally{clearTimeout(timer);pending.delete(info.url)}});
    pending.set(info.url,request);return request;
  }
  async function hydrate(root){
    const figures=[...root.querySelectorAll('[data-gym-video]')];
    await Promise.all(figures.map(async figure=>{const info=videoInfo(figure.dataset.gymVideo);if(!info||figure.querySelector('img'))return;const url=await thumbnail(info);if(!url||!figure.isConnected||figure.querySelector('img'))return;const img=figure.ownerDocument.createElement('img');img.alt='Miniatura do vídeo no '+info.provider;img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();img.src=url;figure.prepend(img);}));
    root.querySelectorAll('img[data-gym-thumbnail]').forEach(img=>{img.onerror=()=>img.remove()});
  }
  return {hydrate,thumbnail};
}
