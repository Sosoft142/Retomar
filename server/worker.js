import {sendPush,validSubscription} from './webpush.js';
import {handleAgenda} from './calendar-auth.js';
export {AgendaAccount} from './calendar-auth.js';
export function validateEntries(entries,now=Date.now()){
  if(!Array.isArray(entries)||entries.length>5000)throw Error('Too many deadlines');
  const tags=new Set();
  return entries.map(e=>{if(!e||typeof e.tag!=='string'||e.tag.length>1000||tags.has(e.tag)||typeof e.item!=='string'||!e.item||e.item.length>200||typeof e.title!=='string'||!e.title.trim()||e.title.length>200||!Number.isSafeInteger(e.at)||e.at<now-300000||e.at>Date.parse('2201-01-01T00:00:00Z'))throw Error('Invalid deadline');tags.add(e.tag);if((e.silent!==undefined&&typeof e.silent!=='boolean')||(e.sticky!==undefined&&typeof e.sticky!=='boolean'))throw Error('Invalid presentation');return {tag:e.tag,item:e.item,title:e.title,at:e.at,silent:e.silent===true,sticky:e.sticky===true}});
}
export async function readLimitedBody(request,limit=1500000){
  const reader=request.body?.getReader();if(!reader)return '';
  const chunks=[];let length=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();const error=Error('Payload too large');error.status=413;throw error}chunks.push(value)}}finally{reader.releaseLock()}
  const joined=new Uint8Array(length);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length}return new TextDecoder('utf-8',{fatal:true}).decode(joined);
}
const json=(body,status=200)=>Response.json(body,{status});
export default {async fetch(request,env){
  if(new URL(request.url).pathname.startsWith('/agenda/'))return handleAgenda(request,env);
  const origin=request.headers.get('Origin');
  if(origin!==env.APP_ORIGIN)return json({error:'Origin not allowed'},403);
  const cors={'Access-Control-Allow-Origin':env.APP_ORIGIN,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin','Cache-Control':'no-store'};
  const wrap=response=>{const next=new Response(response.body,response);for(const [k,v] of Object.entries(cors))next.headers.set(k,v);return next};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!env.VAPID_PRIVATE_JWK||!env.VAPID_PUBLIC_KEY)return wrap(json({error:'Push not configured'},503));
  const url=new URL(request.url);
  if(url.pathname==='/config'&&request.method==='GET')return wrap(json({publicKey:env.VAPID_PUBLIC_KEY}));
  if(!['/schedule','/test'].includes(url.pathname))return wrap(json({error:'Not found'},404));
  const token=request.headers.get('Authorization')?.match(/^Bearer ([a-zA-Z0-9-]{64,128})$/)?.[1];if(!token)return wrap(json({error:'Unauthorized'},401));
  if(Number(request.headers.get('Content-Length')||0)>1500000)return wrap(json({error:'Payload too large'},413));
  if(env.REQUEST_LIMITER){const result=await env.REQUEST_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!result.success)return wrap(json({error:'Rate limit'},429))}
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const id=env.DEVICES.idFromName(Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''));
  try{return wrap(await env.DEVICES.get(id).fetch(request))}catch{return wrap(json({error:'Notification service unavailable'},503))}
}};
export class Device{
  constructor(ctx,env){this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS jobs(tag TEXT PRIMARY KEY, item TEXT, title TEXT, at INTEGER, attempts INTEGER DEFAULT 0)');
    if(!this.sql.exec('PRAGMA table_info(jobs)').toArray().some(c=>c.name==='presentation'))this.sql.exec("ALTER TABLE jobs ADD COLUMN presentation TEXT DEFAULT '{}'");
    this.sql.exec('CREATE TABLE IF NOT EXISTS sent(tag TEXT PRIMARY KEY, at INTEGER)');
  }
  async arm(){const row=this.sql.exec('SELECT MIN(at) AS at FROM jobs').toArray()[0];if(row?.at!==null&&row?.at!==undefined)await this.ctx.storage.setAlarm(Math.max(Date.now()+1000,row.at));else await this.ctx.storage.deleteAlarm()}
  async fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{
    const path=new URL(request.url).pathname;
    if(path==='/schedule'&&request.method==='DELETE'){this.sql.exec('DELETE FROM jobs');this.sql.exec('DELETE FROM sent');await this.ctx.storage.delete(['subscription','expired','testAt']);await this.ctx.storage.put('revoked',true);await this.ctx.storage.deleteAlarm();return json({ok:true})}
    if(path==='/test'&&request.method==='POST'){
      const subscription=await this.ctx.storage.get('subscription');if(!subscription)return json({error:'Not registered'},409);
      const last=await this.ctx.storage.get('testAt')||0;if(Date.now()-last<60000)return json({error:'Wait a minute'},429);
      await this.ctx.storage.put('testAt',Date.now());const response=await sendPush(subscription,{title:'Notificações do Retomar ativadas.',tag:'retomar-test'},this.env);
      return json({ok:response.ok},response.ok?200:502);
    }
    if(path!=='/schedule'||request.method!=='POST')return json({error:'Method not allowed'},405);
    if(await this.ctx.storage.get('revoked'))return json({error:'Device revoked'},410);
    let body,entries;try{const raw=await readLimitedBody(request);body=JSON.parse(raw);if(!validSubscription(body.subscription))throw Error();entries=validateEntries(body.entries)}catch(error){return json({error:error.status===413?'Payload too large':'Invalid schedule'},error.status===413?413:400)}
    this.ctx.storage.transactionSync(()=>{this.sql.exec('DELETE FROM jobs');for(const e of entries)this.sql.exec('INSERT INTO jobs(tag,item,title,at,presentation) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM sent WHERE tag=?)',e.tag,e.item,e.title,e.at,JSON.stringify({silent:e.silent,sticky:e.sticky}),e.tag)});
    await this.ctx.storage.put('subscription',body.subscription);await this.arm();return json({ok:true,count:entries.length});
  })}
  async alarm(){return this.ctx.blockConcurrencyWhile(async()=>{
    const subscription=await this.ctx.storage.get('subscription');if(!subscription)return;
    const now=Date.now(),jobs=this.sql.exec('SELECT * FROM jobs WHERE at<=? ORDER BY at LIMIT 10',now).toArray();
    await Promise.all(jobs.map(async job=>{try{
      if(now-job.at>3600000){this.sql.exec('DELETE FROM jobs WHERE tag=?',job.tag);return}
      const response=await sendPush(subscription,{title:job.title,item:job.item,tag:job.tag,sentAt:Date.now(),...JSON.parse(job.presentation||'{}')},this.env);
      if(response.status===404||response.status===410){await this.ctx.storage.put('expired',true);return}
      if(!response.ok)throw Error('Delivery failed');
      this.ctx.storage.transactionSync(()=>{this.sql.exec('INSERT OR REPLACE INTO sent(tag,at) VALUES(?,?)',job.tag,now);this.sql.exec('DELETE FROM jobs WHERE tag=?',job.tag)});
    }catch{if(job.attempts>=5)this.sql.exec('DELETE FROM jobs WHERE tag=?',job.tag);else this.sql.exec('UPDATE jobs SET at=?, attempts=attempts+1 WHERE tag=?',now+Math.min(900000,60000*2**job.attempts),job.tag)}}));
    if(await this.ctx.storage.get('expired')){this.sql.exec('DELETE FROM jobs');this.sql.exec('DELETE FROM sent');await this.ctx.storage.delete(['subscription','expired','testAt']);await this.ctx.storage.deleteAlarm();return}
    this.sql.exec('DELETE FROM sent WHERE at<?',now-180*86400000);await this.arm();
  })}
}
