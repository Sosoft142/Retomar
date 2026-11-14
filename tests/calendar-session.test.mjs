import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {PairedGoogleSession} from '../dist/src/calendar-session.js';
import {agendaPairKey} from '../dist/src/calendar-pairing.js';
import {service,clientId,scope,endpoint,origin} from './helpers/calendar-paired.mjs';
const connection={gistId:'abcde',token:'fictitious_pairing_token',secret:'fictitious_pairing_token'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function target(t){const dom=new JSDOM('<body></body>',{url:origin});t.after(()=>dom.window.close());return dom.window;}
test('falha confirmada mantém janela aberta e mostra o motivo do servidor',async t=>{
 const f=service(),w=target(t);let values,closed=0;w.open=()=>({close(){closed++;}});
 w.HTMLFormElement.prototype.submit=function(){values=Object.fromEntries(new w.FormData(this));};
 const detail='O Google recusou as credenciais do servidor. Confira o cliente OAuth.';
 const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:(url,options)=>url.endsWith('/status')?Promise.resolve(Response.json({connected:false,failedAuthorizationId:values.authorizationId,failedAuthorizationMessage:detail})):f.fetcher(url,options)});
 await s.prepare();await assert.rejects(s.connect(clientId),e=>e.message===detail);assert.equal(closed,0);assert.equal(s.pending,null);assert.equal(s.accessToken,'');
});
test('falhas transitórias não interrompem consentimento e o prazo acompanha os dez minutos do servidor',async t=>{
 const f=service(),w=target(t),timers=[];let values,closed=0,statusCalls=0,done=false;
 w.open=()=>({close(){closed++;}});w.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};w.clearTimeout=()=>{};
 w.HTMLFormElement.prototype.submit=function(){values=Object.fromEntries(new w.FormData(this));};
 const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:(url,options)=>{
  if(url.endsWith('/status')){statusCalls++;if(statusCalls===1)throw TypeError('temporary network failure');if(statusCalls===2)return Promise.resolve(Response.json({},{status:503}));if(statusCalls===3)return Promise.resolve(Response.json({},{status:429}));}
  return f.fetcher(url,options);
 }});
 await s.prepare();const pending=s.connect(clientId).then(()=>{done=true;});await tick();assert.equal(done,false);assert.equal(closed,0);
 f.advance(121000);
 for(let i=0;i<3;i++){const timer=timers.shift();assert.equal(timer.ms,5000);await timer.fn();}
 assert.equal(done,false);assert.equal(closed,0);
 await f.grant(await agendaPairKey(connection),values.authorizationId);await timers.shift().fn();await pending;
 assert.equal(done,true);assert.equal(closed,1);assert.ok(s.accessToken);
});
test('expiração preserva a janela; cancelamento explícito fecha e limpa o fluxo',async t=>{
 for(const cancel of [false,true]){
  const f=service(),w=target(t),timers=[];let closed=0;w.open=()=>({close(){closed++;}});w.setTimeout=fn=>{timers.push(fn);return timers.length;};w.clearTimeout=()=>{};w.HTMLFormElement.prototype.submit=function(){};
  const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:(url,options)=>url.endsWith('/status')?Promise.resolve(Response.json({connected:false})):f.fetcher(url,options)});await s.prepare();const pending=s.connect(clientId),rejected=assert.rejects(pending,cancel?/cancelada/:/expirou/);await tick();
  if(cancel)s.clear();else{f.advance(600001);await timers.shift()();}
  await rejected;assert.equal(closed,cancel?1:0);assert.equal(s.pending,null);assert.equal(s.accessToken,'');
 }
});
test('dois aparelhos e nova sessão restauram acesso sem popup nem gravação de credencial',async t=>{const f=service(),key=await agendaPairKey(connection);await f.grant(key);for(let i=0;i<3;i++){const w=target(t);w.open=()=>{throw Error('Popup não autorizado');};const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,fetcher:f.fetcher,now:f.now});assert.equal(await s.restore(false,clientId),true);assert.ok(s.accessToken);assert.equal(s.shared,true);assert.equal(w.localStorage.length,0);}assert.equal(f.grants(),1);assert.equal(f.refreshes(),0);});
test('conta ausente usa espera e credencial permanece apenas no cabeçalho',async t=>{const f=service(),w=target(t),calls=[];const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:async(url,options)=>{calls.push({url,options});return f.fetcher(url,options);}});assert.equal(await s.restore(),false);assert.equal(await s.restore(),false);assert.equal(calls.filter(x=>x.url.endsWith('/token')).length,1);const call=calls.find(x=>x.url.endsWith('/token'));assert.match(call.options.headers.Authorization,/^Bearer [a-f0-9]{64}$/);assert.ok(!call.url.includes(connection.secret));assert.equal(call.options.credentials,'omit');});
test('clique envia POST em janela própria e exige recibo da nova autorização',async t=>{const f=service(),w=target(t),timers=[];let submitted;w.open=()=>({close(){}});w.setTimeout=fn=>{timers.push(fn);return timers.length;};w.clearTimeout=()=>{};w.HTMLFormElement.prototype.submit=function(){submitted={method:this.method,action:this.action,values:Object.fromEntries(new w.FormData(this))};};const key=await agendaPairKey(connection);await f.grant(key);const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:f.fetcher});await s.prepare();let done=false;const pending=s.connect(clientId).then(()=>done=true);assert.equal(submitted.method,'post');assert.equal(submitted.action,endpoint+'/agenda/auth/start');assert.equal(submitted.values.pairKey,key);assert.equal(w.document.querySelector('form'),null);await tick();assert.equal(done,false);await f.grant(key,submitted.values.authorizationId);await timers.shift()();await pending;assert.equal(done,true);assert.ok(s.accessToken);});
test('cliente divergente e resposta com refresh token não são aceitos',async t=>{const f=service(),s=new PairedGoogleSession({getConnection:()=>connection,target:target(t),server:endpoint,now:f.now,fetcher:f.fetcher});await assert.rejects(s.restore(false,'999-other.apps.googleusercontent.com'),/difere/);assert.throws(()=>s.accept({access_token:'temporary',expires_in:3600,scope,refresh_token:'leak'}),/servidor/);assert.equal(s.accessToken,'');});
test('desparear cancela retorno tardio e invalida credencial derivada',async t=>{const f=service(),key=await agendaPairKey(connection);await f.grant(key);let context=connection,release;const s=new PairedGoogleSession({getConnection:()=>context,target:target(t),server:endpoint,now:f.now,fetcher:async(url,options)=>{const r=await f.fetcher(url,options);if(url.endsWith('/token'))await new Promise(resolve=>release=resolve);return r;}});const job=s.restore();while(!release)await tick();context=null;s.connectionChanged();release();assert.equal(await job,false);assert.equal(s.accessToken,'');assert.equal(s.cap,'');});
test('servidor antigo conserva conexão por sessão',async t=>{let prepared=0;const local={identity:null,accessToken:'local_token',clear(){},prepare:async()=>{prepared++;}};const s=new PairedGoogleSession({getConnection:()=>connection,target:target(t),server:endpoint,local,fetcher:async()=>new Response('',{status:404})});assert.equal(await s.restore(),false);await s.prepare();assert.equal(prepared,1);assert.equal(s.shared,false);assert.equal(s.accessToken,'local_token');});
test('negação da nova autorização não aceita recibo de outra conexão',async t=>{const f=service(),w=target(t);w.open=()=>({close(){}});let values;w.HTMLFormElement.prototype.submit=function(){values=Object.fromEntries(new w.FormData(this));};const s=new PairedGoogleSession({getConnection:()=>connection,target:w,server:endpoint,now:f.now,fetcher:async(url,options)=>url.endsWith('/status')?Response.json({connected:true,authorizationId:'old',failedAuthorizationId:values.authorizationId}):f.fetcher(url,options)});await s.prepare();await assert.rejects(s.connect(clientId),/não foi concluída/);assert.equal(s.accessToken,'');});
