const scopes=['https://www.googleapis.com/auth/calendar.events.readonly','https://www.googleapis.com/auth/calendar.calendarlist.readonly','https://www.googleapis.com/auth/calendar.calendars.readonly'];
const encoder=new TextEncoder(),hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''),random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const error=(message,status)=>Object.assign(Error(message),{status});
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
const messages={
  google_client:'O Google recusou as credenciais do servidor. Confira se o ID e o segredo cadastrados na Cloudflare pertencem ao mesmo cliente OAuth.',
  google_code:'O Google recusou o código de autorização. Inicie uma nova conexão pelo Retomar e confira o endereço de retorno cadastrado no Google Cloud.',
  google_permissions:'As permissões necessárias não foram concedidas. Autorize a consulta dos eventos e da lista de agendas.',
  google_refresh:'O Google não forneceu a autorização de acesso contínuo. Inicie uma nova conexão e confirme o consentimento.',
  google_denied:'A autorização do Google não foi concluída. Inicie novamente a conexão pelo Retomar.',
  google_timeout:'O servidor excedeu o tempo de espera ao consultar o Google. Tente conectar novamente.',
  google_network:'O servidor não conseguiu concluir a comunicação com o Google. Tente novamente.',
  google_reply:'O Google retornou uma resposta inesperada. Tente conectar novamente.',
  google_unavailable:'O Google não confirmou a autorização. Tente novamente mais tarde.',
  authorization_expired:'A solicitação expirou. Inicie uma nova conexão pelo Retomar.',
  authorization_code_missing:'O Google não retornou um código de autorização válido. Inicie uma nova conexão pelo Retomar.',
  storage_unavailable:'O servidor não conseguiu ler a autorização salva. A configuração de criptografia precisa ser verificada.',
  service_unavailable:'Não foi possível concluir a conexão no servidor. Tente novamente pelo Retomar.'
};
const issueCode=code=>Object.hasOwn(messages,code)?code:'service_unavailable',message=code=>messages[issueCode(code)];
const problem=(code,status)=>Object.assign(error(message(code),status),{code:issueCode(code)});
const ready=env=>!!env.AGENDA_ACCOUNTS&&/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(env.GOOGLE_CLIENT_ID||'')&&typeof env.GOOGLE_CLIENT_SECRET==='string'&&env.GOOGLE_CLIENT_SECRET.length>=12&&/^[a-f0-9]{64}$/i.test(env.AGENDA_DATA_KEY||'');
async function limited(request){const reader=request.body?.getReader();if(!reader)return '';let raw='',size=0;const decoder=new TextDecoder('utf-8',{fatal:true});try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw error('Request too large',413);}raw+=decoder.decode(value,{stream:true});}return raw+decoder.decode();}finally{reader.releaseLock();}}
function page(text,status=200,cookie){return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Retomar · Google Agenda</title><h1>Retomar</h1><p>'+text+'</p><p>Volte ao aplicativo para continuar.</p></html>',{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",...(cookie?{'Set-Cookie':cookie}:{})}});}
export async function handleAgenda(request,env){
  const url=new URL(request.url),callback=url.pathname==='/agenda/oauth/callback';
  const cors={'Access-Control-Allow-Origin':env.APP_ORIGIN,'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Vary':'Origin'};
  const wrap=r=>{const next=new Response(r.body,r);for(const [key,value] of Object.entries(cors))next.headers.set(key,value);return next;};
  if(!callback&&request.headers.get('Origin')!==env.APP_ORIGIN)return json({error:'Origin not allowed'},403);
  if(!callback&&request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(url.pathname==='/agenda/config'&&request.method==='GET')return wrap(json({version:1,build:'2026-11-14.1',ready:ready(env),clientId:ready(env)?env.GOOGLE_CLIENT_ID:'',callbackURL:url.origin+'/agenda/oauth/callback'}));
  if(!ready(env))return callback?page('A conexão compartilhada ainda não foi ativada no servidor.',503):wrap(json({error:'Agenda service not configured'},503));
  if(env.REQUEST_LIMITER){const result=await env.REQUEST_LIMITER.limit({key:'agenda:'+String(request.headers.get('CF-Connecting-IP')||'unknown')});if(!result.success)return callback?page('Aguarde um pouco e tente conectar novamente.',429):wrap(json({error:'Rate limit'},429));}
  try{
    let account,body;
    if(callback){if(request.method!=='GET')return page('Solicitação inválida.',405);const match=/^([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(url.searchParams.get('state')||'');if(!match)return page('A autorização não corresponde a uma conexão iniciada no Retomar.',400);account=match[1];}
    else if(url.pathname==='/agenda/auth/start'&&request.method==='POST'){
      if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return wrap(json({error:'Expected form'},415));
      const form=new URLSearchParams(await limited(request)),key=form.get('pairKey');if(!/^[a-f0-9]{64}$/.test(key||'')||!/^[a-f0-9]{64}$/.test(form.get('authorizationId')||''))return wrap(json({error:'Invalid authorization'},400));account=await hash(key);body=JSON.stringify({authorizationId:form.get('authorizationId')});
    }else{
      if(!['/agenda/status','/agenda/token','/agenda/account'].includes(url.pathname))return wrap(json({error:'Not found'},404));
      const key=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!key)return wrap(json({error:'Unauthorized'},401));account=await hash(key);if(request.method==='POST')body=await limited(request);
    }
    const headers=new Headers(request.headers);headers.delete('Content-Length');headers.delete('Authorization');headers.set('X-Retomar-Agenda-Account',account);if(body!==undefined)headers.set('Content-Type','application/json');
    // O redirect OAuth e o cookie precisam chegar ao navegador, sem serem seguidos pelo stub.
    const forwarded=new Request(request.url,{method:request.method,headers,redirect:'manual',...(body!==undefined?{body}:{})});
    const response=await env.AGENDA_ACCOUNTS.get(env.AGENDA_ACCOUNTS.idFromName(account)).fetch(forwarded);return callback?response:wrap(response);
  }catch(e){return callback?page('Não foi possível concluir a conexão. Tente novamente pelo Retomar.',e.status||503):wrap(json({error:e.status===413?'Request too large':'Agenda service unavailable'},e.status||503));}
}
export class AgendaAccount{
  constructor(ctx,env){this.ctx=ctx;this.env=env;this.fetcher=env.fetcher||fetch.bind(globalThis);this.now=env.now||Date.now;}
  async encryptionKey(){return crypto.subtle.importKey('raw',Uint8Array.from(this.env.AGENDA_DATA_KEY.match(/../g),s=>parseInt(s,16)),'AES-GCM',false,['encrypt','decrypt']);}
  async seal(value){const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('retomar-agenda-v1:'+String(this.ctx.id))},await this.encryptionKey(),encoder.encode(JSON.stringify(value)));return {iv:b64(iv),cipher:b64(new Uint8Array(cipher))};}
  async load(){const value=await this.ctx.storage.get('account');if(!value)return null;try{const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(value.iv),additionalData:encoder.encode('retomar-agenda-v1:'+String(this.ctx.id))},await this.encryptionKey(),unb64(value.cipher));return JSON.parse(new TextDecoder().decode(plain));}catch{throw problem('storage_unavailable',503);}}
  async failed(authorizationId,code,status,cookie){code=issueCode(code);await this.ctx.storage.put('failedAuthorizationId',authorizationId);await this.ctx.storage.put('failedAuthorization',{authorizationId,code});return page(message(code),status,cookie);}
  async tokens(values){
    let r,text;
    try{r=await this.fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:this.env.GOOGLE_CLIENT_ID,client_secret:this.env.GOOGLE_CLIENT_SECRET,...values}),redirect:'manual',signal:AbortSignal.timeout(15000)});text=await r.text();}catch(e){throw problem(['TimeoutError','AbortError'].includes(e.name)?'google_timeout':'google_network',503);}
    if(text.length>65536)throw problem('google_reply',502);let value;try{value=JSON.parse(text);}catch{throw problem('google_reply',502);}
    if(!value||typeof value!=='object'||Array.isArray(value))throw problem('google_reply',502);
    if(!r.ok){if(value.error==='invalid_grant')throw problem('google_code',401);if(['invalid_client','unauthorized_client'].includes(value.error))throw problem('google_client',502);if(value.error==='invalid_scope')throw problem('google_permissions',502);if(value.error==='access_denied')throw problem('google_denied',403);throw problem('google_unavailable',502);}
    if(typeof value.access_token!=='string'||!value.access_token||value.access_token.length>8192||/[\s\x00-\x1f\x7f]/.test(value.access_token)||!Number.isFinite(Number(value.expires_in))||Number(value.expires_in)<=60)throw problem('google_reply',502);return value;
  }
  fetch(request){return this.ctx.blockConcurrencyWhile(async()=>{
    const url=new URL(request.url),storage=this.ctx.storage;let authorizationId='',clearCookie;
    try{
      if(url.pathname==='/agenda/auth/start'&&request.method==='POST'){
        const input=JSON.parse(await limited(request));if(!/^[a-f0-9]{64}$/.test(input.authorizationId||''))return json({error:'Invalid authorization'},400);
        const nonce=random(),cookie=random(),verifier=random(),account=request.headers.get('X-Retomar-Agenda-Account');if(!/^[a-f0-9]{64}$/.test(account||''))return json({error:'Invalid account'},400);
        const state=account+'.'+nonce,redirectURI=url.origin+'/agenda/oauth/callback';await storage.put('pending',{state,cookieHash:await hash(cookie),verifier,redirectURI,authorizationId:input.authorizationId,expiresAt:this.now()+600000});
        const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');for(const [k,v] of Object.entries({client_id:this.env.GOOGLE_CLIENT_ID,redirect_uri:redirectURI,response_type:'code',scope:scopes.join(' '),access_type:'offline',prompt:'consent select_account',include_granted_scopes:'false',state,code_challenge_method:'S256',code_challenge:b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))))}))auth.searchParams.set(k,v);
        return new Response(null,{status:303,headers:{Location:auth.href,'Set-Cookie':`__Host-retomar-agenda-${nonce.slice(0,16)}=${cookie}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
      }
      if(url.pathname==='/agenda/oauth/callback'&&request.method==='GET'){
        const pending=await storage.get('pending'),state=url.searchParams.get('state')||'',nonce=state.split('.')[1]||'',name='__Host-retomar-agenda-'+nonce.slice(0,16),cookie=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1),clear=`${name}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
        if(!pending||pending.state!==state||!cookie||!/^[a-f0-9]{64}$/.test(cookie)||await hash(cookie)!==pending.cookieHash)return page('A autorização não pertence a esta sessão. Abra a conexão pelo Retomar.',400);
        authorizationId=pending.authorizationId;clearCookie=clear;await storage.delete('pending');if(pending.expiresAt<this.now())return await this.failed(authorizationId,'authorization_expired',410,clear);
        if(url.searchParams.has('error'))return await this.failed(authorizationId,'google_denied',400,clear);
        const code=url.searchParams.get('code');if(!code||code.length>8192)return await this.failed(authorizationId,'authorization_code_missing',400,clear);
        const value=await this.tokens({code,grant_type:'authorization_code',redirect_uri:pending.redirectURI,code_verifier:pending.verifier}),granted=String(value.scope||'').split(/\s+/).filter(Boolean);
        if(!scopes.slice(0,2).every(s=>granted.includes(s))||granted.some(s=>!scopes.includes(s)))return await this.failed(authorizationId,'google_permissions',400,clear);
        if(typeof value.refresh_token!=='string'||!value.refresh_token||value.refresh_token.length>8192||/[\s\x00-\x1f\x7f]/.test(value.refresh_token))return await this.failed(authorizationId,'google_refresh',400,clear);
        await storage.put('account',await this.seal({refreshToken:value.refresh_token,accessToken:value.access_token,expiresAt:this.now()+Math.min(Number(value.expires_in),3600)*1000,scope:granted.join(' '),authorizationId:pending.authorizationId}));await storage.delete(['failedAuthorizationId','failedAuthorization']);return page('Google Agenda conectado aos aparelhos pareados.',200,clear);
      }
      if(url.pathname==='/agenda/status'&&request.method==='GET'){const account=await this.load(),failedAuthorizationId=await storage.get('failedAuthorizationId')||'',failed=await storage.get('failedAuthorization'),code=failedAuthorizationId&&failed?.authorizationId===failedAuthorizationId?issueCode(failed.code):'';return json({connected:!!account,authorizationId:account?.authorizationId||'',failedAuthorizationId,failedAuthorizationCode:code,failedAuthorizationMessage:code?message(code):''});}
      if(url.pathname==='/agenda/account'&&request.method==='DELETE'){
        const account=await this.load();await storage.delete(['account','pending','failedAuthorizationId','failedAuthorization']);let revoked=true;if(account)try{const r=await this.fetcher('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:account.refreshToken}),redirect:'manual',signal:AbortSignal.timeout(10000)});revoked=r.ok;}catch{revoked=false;}return json({ok:true,revoked});
      }
      if(url.pathname==='/agenda/token'&&request.method==='POST'){
        const input=JSON.parse(await limited(request)||'{}');if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='force')||input.force!==undefined&&typeof input.force!=='boolean')return json({error:'Invalid request'},400);
        let account=await this.load();if(!account)return json({error:'Connect Google Agenda'},401);
        if(input.force||account.expiresAt<=this.now()+60000){const value=await this.tokens({refresh_token:account.refreshToken,grant_type:'refresh_token'}),granted=value.scope?String(value.scope).split(/\s+/).filter(Boolean):account.scope.split(' ');if(!scopes.slice(0,2).every(s=>granted.includes(s))||granted.some(s=>!scopes.includes(s)))throw error('Authorization expired',401);if(value.refresh_token!==undefined&&(typeof value.refresh_token!=='string'||!value.refresh_token||value.refresh_token.length>8192||/[\s\x00-\x1f\x7f]/.test(value.refresh_token)))throw error('Invalid refresh reply',502);account={...account,accessToken:value.access_token,expiresAt:this.now()+Math.min(Number(value.expires_in),3600)*1000,scope:granted.join(' '),...(value.refresh_token?{refreshToken:value.refresh_token}:{})};await storage.put('account',await this.seal(account));}
        return json({access_token:account.accessToken,expires_in:Math.floor((account.expiresAt-this.now())/1000),scope:account.scope});
      }
      return json({error:'Method not allowed'},405);
    }catch(e){if(e.status===401&&url.pathname==='/agenda/token')await storage.delete('account');if(url.pathname==='/agenda/oauth/callback'){if(authorizationId)try{return await this.failed(authorizationId,e.code,e.status||503,clearCookie);}catch{}return page(message(e.code),e.status||503,clearCookie);}return json({error:e.status===401?'Authorization expired':'Agenda service unavailable',message:message(e.code)},e.status||503);}
  });}
}
