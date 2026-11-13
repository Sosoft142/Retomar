import {AgendaAccount,handleAgenda} from '../../server/calendar-auth.js';
import {GOOGLE_SCOPES,GOOGLE_COLOR_SCOPE} from '../../dist/src/calendar.js';
export const clientId='12345-public.apps.googleusercontent.com',clientSecret='fictitious-server-secret',cap='a'.repeat(64),authId='b'.repeat(64),scope=[...GOOGLE_SCOPES,GOOGLE_COLOR_SCOPE].join(' '),origin='https://retomar.example',endpoint='https://retomar-push.example.workers.dev';
export function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
export function service(){
 let time=1000000,replyError='',revoked=false,refreshes=0,grants=0;const stores=new Map(),objects=new Map(),calls=[];
 const env={APP_ORIGIN:origin,GOOGLE_CLIENT_ID:clientId,GOOGLE_CLIENT_SECRET:clientSecret,AGENDA_DATA_KEY:'c'.repeat(64),now:()=>time,fetcher:async(url,options)=>{
  calls.push({url,options});const input=new URLSearchParams(options.body);
  if(url.endsWith('/revoke')){revoked=true;return Response.json({});}
  if(input.get('grant_type')==='refresh_token')refreshes++;else grants++;
  if(replyError)return Response.json({error:replyError},{status:replyError==='invalid_grant'?400:503});
  return Response.json({access_token:'access_fictitious_'+(refreshes+grants),expires_in:3600,scope,...(input.get('grant_type')==='authorization_code'?{refresh_token:'refresh_fictitious'}:{})});
 }};
 const ctxFor=id=>{if(!stores.has(id))stores.set(id,new Map());const data=stores.get(id);let queue=Promise.resolve();return {id,storage:{get:async k=>structuredClone(data.get(k)),put:async(k,v)=>{data.set(k,structuredClone(v));},delete:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])data.delete(k);}},blockConcurrencyWhile:fn=>{const job=queue.then(fn);queue=job.catch(()=>{});return job;}};};
 env.AGENDA_ACCOUNTS={idFromName:id=>id,get:id=>{if(!objects.has(id))objects.set(id,new AgendaAccount(ctxFor(id),env));return objects.get(id);}};
 async function fetcher(url,options={}){const headers=new Headers(options.headers);if(!headers.has('Origin'))headers.set('Origin',origin);return handleAgenda(new Request(url,{...options,headers}),env);}
 const call=(path,{key=cap,method='GET',body,cookie,headers={}}={})=>fetcher(endpoint+path,{method,headers:{...(key?{Authorization:'Bearer '+key}:{}),...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 async function start(key=cap,authorizationId=authId){return fetcher(endpoint+'/agenda/auth/start',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({pairKey:key,authorizationId})});}
 async function grant(key=cap,authorizationId=authId){const r=await start(key,authorizationId),url=new URL(r.headers.get('Location'));return call('/agenda/oauth/callback?state='+encodeURIComponent(url.searchParams.get('state'))+'&code=code_fictitious',{key:null,cookie:r.headers.get('Set-Cookie').split(';')[0]});}
 return {env,stores,objects,calls,fetcher,call,start,grant,advance:n=>time+=n,now:()=>time,error:v=>replyError=v,reopen:()=>objects.clear(),refreshes:()=>refreshes,grants:()=>grants,revoked:()=>revoked};
}
