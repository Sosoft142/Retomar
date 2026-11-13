import {GoogleReadSession,GOOGLE_SCOPES,GOOGLE_COLOR_SCOPE,validClientId} from './calendar.js';
import {agendaPairKey} from './calendar-pairing.js';
import {PUSH_SERVER} from './push-config.js';

const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const failure=(message,status)=>Object.assign(Error(message),{status});
export class PairedGoogleSession{
  constructor({getConnection,target=window,fetcher=target.fetch?.bind(target)||globalThis.fetch?.bind(globalThis),server=PUSH_SERVER,now=()=>Date.now(),local=new GoogleReadSession({target})}={}){Object.assign(this,{getConnection,target,fetcher,server,now,local});this.mode='session';this.info=null;this.probedAt=0;this.context='';this.cap='';this.token='';this.expiresAt=0;this.colorMetadata=false;this.pending=null;this.epoch=0;this.retryAt=0;this.force=false;this.restoring=null;this.probing=null;}
  get identity(){return this.mode==='shared'?(this.cap?{shared:true}:null):this.local.identity;}
  get accessToken(){return this.mode==='shared'?(this.now()<this.expiresAt?this.token:''):this.local.accessToken;}
  get shared(){return this.mode==='shared';}
  async probe(force=false){
    if(!this.server)return {ready:false};if(this.info&&!force&&this.now()-this.probedAt<60000)return this.info;if(this.probing)return this.probing;
    this.probing=(async()=>{try{const r=await this.fetcher(this.server+'/agenda/config',{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)return this.info={ready:false};const value=await r.json();this.info=value?.version===1&&value.ready===true&&validClientId(value.clientId)?{ready:true,clientId:value.clientId}:{ready:false};return this.info;}catch{return this.info={ready:false};}finally{this.probedAt=this.now();this.probing=null;}})();return this.probing;
  }
  async prepareShared(force=false){
    const ctx=this.getConnection();if(!ctx){if(this.context)this.connectionChanged();return false;}const info=await this.probe(force);if(!info.ready)return false;
    const context=ctx.gistId+'\0'+ctx.secret;if(context!==this.context){const cap=await agendaPairKey(ctx);if(this.getConnection()?.gistId!==ctx.gistId||this.getConnection()?.secret!==ctx.secret)return false;this.clear();this.context=context;this.cap=cap;this.retryAt=0;this.force=false;}
    this.mode='shared';return true;
  }
  async prepare(){if(await this.prepareShared(true))return;this.mode='session';await this.local.prepare();}
  async request(path,{method='GET',body}={}){
    const ctx=this.getConnection();if(!this.cap||!ctx||ctx.gistId+'\0'+ctx.secret!==this.context)throw failure('Conecte novamente a sincronização deste aparelho.',401);
    const r=await this.fetcher(this.server+path,{method,credentials:'omit',cache:'no-store',redirect:'error',headers:{Authorization:'Bearer '+this.cap,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw failure(r.status===401?'Autorize novamente o Google Agenda para retomar a conexão compartilhada.':r.status===429?'Aguarde um pouco antes de tentar novamente.':'Não foi possível acessar a conexão compartilhada da agenda.',r.status);return r.json();
  }
  accept(value){const granted=typeof value?.scope==='string'?value.scope.split(/\s+/):[];if(Object.hasOwn(value||{},'refresh_token')||!GOOGLE_SCOPES.every(s=>granted.includes(s))||typeof value?.access_token!=='string'||!value.access_token||value.access_token.length>8192||/[\s\x00-\x1f\x7f]/.test(value.access_token)||!Number.isFinite(Number(value.expires_in))||Number(value.expires_in)<=30)throw Error('O servidor não confirmou uma autorização válida da agenda.');this.token=value.access_token;this.expiresAt=this.now()+(Math.min(Number(value.expires_in),3600)-30)*1000;this.colorMetadata=granted.includes(GOOGLE_COLOR_SCOPE);this.force=false;}
  async restore(force=false,clientId=''){
    if(this.pending)return false;if(this.restoring)return this.restoring;
    const work=Promise.resolve().then(async()=>{try{if(!await this.prepareShared())return false;if(clientId&&clientId!==this.info.clientId)throw Error('O ID Google salvo difere do cliente do servidor. Confira Configurar agenda.');if(this.accessToken&&!force)return true;if(!force&&this.now()<this.retryAt)return false;const epoch=this.epoch;this.retryAt=this.now()+45000;const value=await this.request('/agenda/token',{method:'POST',body:{force:this.force||force}});if(epoch!==this.epoch)return false;this.accept(value);return true;}catch(e){if(e.status===401)return false;throw e;}finally{if(this.restoring===work)this.restoring=null;}});this.restoring=work;return work;
  }
  connect(clientId){
    if(!this.shared)return this.local.connect(clientId).then(()=>{this.colorMetadata=this.local.colorMetadata;});
    if(!this.cap||clientId!==this.info?.clientId)return Promise.reject(Error('O ID Google salvo precisa corresponder ao cliente configurado no servidor. Confira Configurar agenda.'));
    if(this.pending)return this.pending.promise;
    const authorizationId=random(),name='retomar-agenda-'+authorizationId,epoch=this.epoch;let popup;
    try{popup=this.target.open('about:blank',name,'popup,width=520,height=700');}catch{}if(!popup)return Promise.reject(Error('Permita a janela de autorização do Google para conectar a agenda.'));
    let resolve,reject,timer;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;}),deadline=this.now()+120000;
    const finish=err=>{if(this.pending?.promise!==promise)return;this.target.clearTimeout(timer);this.pending=null;try{popup.close();}catch{}err?reject(err):resolve();};this.pending={promise,cancel:()=>finish(Error('Conexão cancelada.'))};
    // A navegação nasce no clique. A credencial segue por POST, nunca pela URL.
    try{const doc=this.target.document,form=doc.createElement('form');form.method='POST';form.action=this.server+'/agenda/auth/start';form.target=name;form.hidden=true;for(const [key,value] of Object.entries({pairKey:this.cap,authorizationId})){const input=doc.createElement('input');input.type='hidden';input.name=key;input.value=value;form.append(input);}doc.body.append(form);try{form.submit();}finally{form.remove();}}catch{finish(Error('Não foi possível abrir a conexão compartilhada.'));return promise;}
    const poll=async()=>{try{if(epoch!==this.epoch)return finish(Error('Conexão cancelada.'));if(this.now()>=deadline)return finish(Error('A autorização não foi concluída. Tente conectar novamente.'));const value=await this.request('/agenda/status');if(this.pending?.promise!==promise)return;if(value.failedAuthorizationId===authorizationId)return finish(Error('A autorização do Google não foi concluída. Confira a janela e tente novamente.'));if(value.connected&&value.authorizationId===authorizationId){const token=await this.request('/agenda/token',{method:'POST',body:{force:false}});if(epoch!==this.epoch)return;this.accept(token);finish();return;}timer=this.target.setTimeout(poll,1500);}catch(e){finish(e);}};void poll();return promise;
  }
  async disconnect(){const result=this.shared?await this.request('/agenda/account',{method:'DELETE'}):null;this.clear();this.retryAt=this.now()+45000;return result;}
  clear(){this.epoch++;this.pending?.cancel();this.pending=null;this.token='';this.expiresAt=0;this.colorMetadata=false;this.force=true;this.local.clear();}
  connectionChanged(){this.clear();this.context='';this.cap='';this.mode='session';this.retryAt=0;this.restoring=null;}
}
