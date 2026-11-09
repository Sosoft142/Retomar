// RFC 8291 aes128gcm payload encryption and RFC 8292 VAPID, using Web Crypto only.
const enc=new TextEncoder();
export const unbase64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export const base64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const join=(...a)=>{const result=new Uint8Array(a.reduce((n,b)=>n+b.length,0));let i=0;for(const b of a){result.set(b,i);i+=b.length}return result};
async function hkdf(key,salt,info,length){const k=await crypto.subtle.importKey('raw',key,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,length*8))}
export function validEndpoint(endpoint){try{const u=new URL(endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.href.length<4096&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.notify.windows.com'))}catch{return false}}
export function validSubscription(s){try{return validEndpoint(s?.endpoint)&&unbase64(s.keys.p256dh).length===65&&unbase64(s.keys.auth).length===16}catch{return false}}
export async function encryptedBody(subscription,payload){
  const receiver=unbase64(subscription.keys.p256dh),auth=unbase64(subscription.keys.auth);
  const ephemeral=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const sender=new Uint8Array(await crypto.subtle.exportKey('raw',ephemeral.publicKey));
  const publicKey=await crypto.subtle.importKey('raw',receiver,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:publicKey},ephemeral.privateKey,256));
  const ikm=await hkdf(shared,auth,join(enc.encode('WebPush: info\0'),receiver,sender),32),salt=crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(ikm,salt,enc.encode('Content-Encoding: aes128gcm\0'),16),nonce=await hkdf(ikm,salt,enc.encode('Content-Encoding: nonce\0'),12);
  const plain=join(enc.encode(JSON.stringify(payload)),new Uint8Array([2]));if(plain.length>3900)throw Error('Notification too large');
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,plain));
  return join(salt,new Uint8Array([0,0,16,0,65]),sender,cipher);
}
export async function sendPush(subscription,payload,env,fetcher=fetch){
  if(!validSubscription(subscription))throw Error('Invalid subscription');
  const privateKey=JSON.parse(env.VAPID_PRIVATE_JWK),header=base64(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),claims=base64(enc.encode(JSON.stringify({aud:new URL(subscription.endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:env.VAPID_SUBJECT})));
  const input=header+'.'+claims,key=await crypto.subtle.importKey('jwk',privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(input));
  return fetcher(subscription.endpoint,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{Authorization:'vapid t='+input+'.'+base64(signature)+', k='+env.VAPID_PUBLIC_KEY,TTL:'3600','Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',Urgency:'normal'},body:await encryptedBody(subscription,payload)});
}
