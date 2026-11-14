import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {Miniflare} from 'miniflare';

test('Worker real conclui OAuth, renova e revoga usando fetch nativo',async t=>{
 const origin='https://retomar.example',endpoint='https://retomar-worker.example',cap='a'.repeat(64),authorizationId='b'.repeat(64);
 const clientId='12345-public.apps.googleusercontent.com',clientSecret='fictitious-worker-secret';
 const scope='https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.calendars.readonly';
 let grants=0,refreshes=0,revocations=0,challenge,clientRejected=false;
 const worker=new Miniflare({
  modules:true,modulesRules:[{type:'ESModule',include:['**/*.js']}],scriptPath:resolve('server/worker.js'),compatibilityDate:'2026-07-30',
  bindings:{APP_ORIGIN:origin,GOOGLE_CLIENT_ID:clientId,GOOGLE_CLIENT_SECRET:clientSecret,AGENDA_DATA_KEY:'c'.repeat(64)},
  durableObjects:{DEVICES:{className:'Device',useSQLite:true},AGENDA_ACCOUNTS:{className:'AgendaAccount',useSQLite:true}},
  // Intercepta a rede fora do Worker: preserva fetch nativo, Request, redirect e Durable Objects.
  outboundService:async request=>{
   const url=new URL(request.url),form=new URLSearchParams(await request.text());
   assert.equal(url.origin,'https://oauth2.googleapis.com');assert.equal(request.method,'POST');
   if(url.pathname==='/revoke'){assert.equal(form.get('token'),'fictitious-refresh');revocations++;return Response.json({});}
   assert.equal(url.pathname,'/token');assert.equal(form.get('client_id'),clientId);assert.equal(form.get('client_secret'),clientSecret);
   if(clientRejected)return Response.json({error:'invalid_client',error_description:'DO_NOT_EXPOSE_PROVIDER_DESCRIPTION'},{status:401});
   if(form.get('grant_type')==='authorization_code'){
    grants++;assert.equal(form.get('code'),'fictitious-code');assert.equal(form.get('redirect_uri'),endpoint+'/agenda/oauth/callback');
    assert.equal(createHash('sha256').update(form.get('code_verifier')).digest('base64url'),challenge);
   }else{assert.equal(form.get('grant_type'),'refresh_token');assert.equal(form.get('refresh_token'),'fictitious-refresh');refreshes++;}
   return Response.json({access_token:'fictitious-access-'+(grants+refreshes),expires_in:3600,scope,...(grants===1&&refreshes===0?{refresh_token:'fictitious-refresh'}:{})});
  }
 });
 t.after(()=>worker.dispose());
 const call=(path,{method='GET',body,headers={}}={})=>worker.dispatchFetch(endpoint+path,{method,redirect:'manual',headers:{Origin:origin,Authorization:'Bearer '+cap,...headers},...(body?{body}:{})});
 const start=await call('/agenda/auth/start',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({pairKey:cap,authorizationId})});
 assert.equal(start.status,303);
 const auth=new URL(start.headers.get('Location'));assert.equal(auth.origin,'https://accounts.google.com');assert.equal(auth.searchParams.get('scope'),scope);
 challenge=auth.searchParams.get('code_challenge');
 const cookie=start.headers.get('Set-Cookie');assert.match(cookie,/Secure; HttpOnly; SameSite=Lax/);
 const callback=await call('/agenda/oauth/callback?'+new URLSearchParams({state:auth.searchParams.get('state'),code:'fictitious-code'}),{headers:{Cookie:cookie.split(';')[0]}});
 assert.equal(callback.status,200);assert.match(await callback.text(),/Google Agenda conectado aos aparelhos pareados/);assert.equal(grants,1);
 const status=await (await call('/agenda/status')).json();assert.equal(status.connected,true);assert.equal(status.authorizationId,authorizationId);
 const token=await call('/agenda/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:true})});
 assert.equal(token.status,200);const value=await token.json();assert.equal(value.access_token,'fictitious-access-2');assert.equal(value.refresh_token,undefined);assert.equal(refreshes,1);
 const disconnected=await call('/agenda/account',{method:'DELETE'});assert.equal(disconnected.status,200);assert.deepEqual(await disconnected.json(),{ok:true,revoked:true});assert.equal(revocations,1);
 assert.equal((await (await call('/agenda/status')).json()).connected,false);
 clientRejected=true;
 const again=await call('/agenda/auth/start',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({pairKey:cap,authorizationId})});
 const failedAuth=new URL(again.headers.get('Location'));
 const rejected=await call('/agenda/oauth/callback?'+new URLSearchParams({state:failedAuth.searchParams.get('state'),code:'fictitious-code'}),{headers:{Cookie:again.headers.get('Set-Cookie').split(';')[0]}});
 assert.equal(rejected.status,502);const html=await rejected.text();assert.match(html,/recusou as credenciais/);assert.ok(!html.includes('DO_NOT_EXPOSE_PROVIDER_DESCRIPTION'));assert.ok(!html.includes(clientSecret));
 const failure=await (await call('/agenda/status')).json();assert.equal(failure.failedAuthorizationCode,'google_client');assert.equal(failure.failedAuthorizationId,authorizationId);assert.ok(html.includes(failure.failedAuthorizationMessage));
 const config=await (await call('/agenda/config')).json();assert.equal(config.build,'2026-11-14.1');
});
