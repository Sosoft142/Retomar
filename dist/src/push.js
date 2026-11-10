import {visibleItems,openItem} from './domain.js';
import {zonedInstant,validTime,reminderSignature,dateInZone,addDays} from './planning.js';
export const PUSH_KEY='entrelinhas-vida:push:v1';
export const PUSH_ITEMS_KEY='entrelinhas-vida:push-items:v1';
export function validateItemPush(value){
  if(!value||!['default','off','custom'].includes(value.mode))throw Error('Escolha uma opção de notificação.');
  if(value.mode==='custom'&&![0,5,15,30,60,180,1440].includes(value.minutes))throw Error('Escolha uma antecedência válida.');
  return value.mode==='custom'?{mode:'custom',minutes:value.minutes}:{mode:value.mode};
}
export function loadItemPush(storage){try{const raw=JSON.parse(storage.getItem(PUSH_ITEMS_KEY)||'{}');if(!raw||Array.isArray(raw)||typeof raw!=='object'||Object.keys(raw).length>20000)throw Error();const result={};for(const [id,value] of Object.entries(raw)){if(['__proto__','constructor','prototype'].includes(id)||id.length>100)throw Error();result[id]=validateItemPush(value)}return result}catch{throw Error('Não foi possível ler os ajustes de notificações por tarefa. Os dados foram preservados; recupere essas preferências antes de atualizar o push.')}}
export const pushDefaults=()=>({minutes:15,defaultTime:'09:00',priorities:['urgent','high','normal','low'],priorityMinutes:{urgent:15,high:15,normal:15,low:15},includeItems:true,includeSubitems:true,areas:[],atDeadline:false,quietEnabled:false,quietStart:'22:00',quietEnd:'08:00',private:false,silent:false,sticky:false});
export function validatePushOptions(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Confira as opções das notificações.');
  const defaults=pushDefaults(),o={...defaults,...value,priorityMinutes:{...defaults.priorityMinutes,...value.priorityMinutes}};
  if(!o.quietEnabled){if(!validTime(o.quietStart))o.quietStart=defaults.quietStart;if(!validTime(o.quietEnd))o.quietEnd=defaults.quietEnd;}
  const allowed=[0,5,15,30,60,180,1440],priorities=defaults.priorities;
  if(!allowed.includes(o.minutes)||!validTime(o.defaultTime)||!validTime(o.quietStart)||!validTime(o.quietEnd))throw Error('Confira a antecedência e os horários dos avisos.');
  for(const key of ['includeItems','includeSubitems','atDeadline','quietEnabled','private','silent','sticky'])if(typeof o[key]!=='boolean')throw Error('Confira as opções das notificações.');
  if(!Array.isArray(o.priorities)||!o.priorities.length||new Set(o.priorities).size!==o.priorities.length||o.priorities.some(x=>!priorities.includes(x)))throw Error('Selecione pelo menos uma prioridade.');
  if(!Array.isArray(o.areas)||o.areas.length>500||new Set(o.areas).size!==o.areas.length||o.areas.some(x=>typeof x!=='string'||!x||x.length>200))throw Error('Confira as áreas selecionadas.');
  if(!o.includeItems&&!o.includeSubitems)throw Error('Selecione itens, subitens ou ambos.');
  if(o.quietEnabled&&o.quietStart===o.quietEnd)throw Error('O início e o fim do período silencioso precisam ser diferentes.');
  for(const priority of priorities){if(!value.priorityMinutes)o.priorityMinutes[priority]=o.minutes;if(!allowed.includes(o.priorityMinutes[priority]))throw Error('Confira a antecedência de cada prioridade.');}
  return structuredClone(Object.fromEntries(Object.keys(defaults).map(key=>[key,o[key]])));
}
const quietFormatters=new Map();
function outsideQuiet(at,o,zone){
  if(!o.quietEnabled)return at;
  if(!quietFormatters.has(zone))quietFormatters.set(zone,new Intl.DateTimeFormat('en',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));
  const parts=Object.fromEntries(quietFormatters.get(zone).formatToParts(at).map(x=>[x.type,x.value])),time=parts.hour+':'+parts.minute;
  const overnight=o.quietStart>o.quietEnd,inside=overnight?(time>=o.quietStart||time<o.quietEnd):(time>=o.quietStart&&time<o.quietEnd);
  if(!inside)return at;
  const date=addDays(dateInZone(new Date(at),zone),overnight&&time>=o.quietStart?1:0);
  return zonedInstant(date,o.quietEnd,zone);
}
export function pushScheduleDetails(state,prefs,options,now=Date.now(),overrides={}){
  const o=validatePushOptions(options),entries=[],excluded=[];
  for(const t of visibleItems(state)){
    const skip=reason=>excluded.push({item:t.id,reason});
    const override=overrides[t.id]?validateItemPush(overrides[t.id]):{mode:'default'};
    if(!openItem(t)){skip('closed');continue}
    if(!t.date){skip('undated');continue}
    if(override.mode==='off'){skip('muted');continue}
    if(!o.priorities.includes(t.priority)){skip('priority');continue}
    if(t.parentId?!o.includeSubitems:!o.includeItems){skip('type');continue}
    if(o.areas.length&&!o.areas.includes(t.areaId)){skip('area');continue}
    let due;try{due=zonedInstant(t.date,t.time||o.defaultTime,prefs.timeZone)}catch{skip('invalid-time');continue}
    const leads=override.mode==='custom'?[override.minutes]:[...new Set([o.priorityMinutes[t.priority],...(o.atDeadline?[0]:[])])];
    const emitted=new Set(),before=entries.length;let invalidTime=false;
    for(const lead of leads){
      const at=due-lead*60000,dismissal=prefs.dismissals[t.id];
      const deferred=dismissal?.signature===reminderSignature(t,prefs.timeZone)?Math.max(at,dismissal.until):at;
      let sendAt;try{sendAt=outsideQuiet(deferred,o,prefs.timeZone)}catch{invalidTime=true;continue}
      if(sendAt<now-60000||emitted.has(sendAt))continue;
      emitted.add(sendAt);
      entries.push({tag:JSON.stringify([t.id,t.date,t.time,o.defaultTime,prefs.timeZone,sendAt]),item:t.id,title:o.private?'Você tem uma tarefa para acompanhar.':t.title,at:sendAt,silent:o.silent,sticky:o.sticky});
    }
    if(entries.length===before)skip(invalidTime?'invalid-time':'past');
  }
  if(entries.length>5000)throw Error('Há mais de 5.000 avisos programados. Reduza as áreas, prioridades ou avisos adicionais.');
  return {entries:entries.sort((a,b)=>a.at-b.at||a.item.localeCompare(b.item)),excluded};
}
export const pushSchedule=(...args)=>pushScheduleDetails(...args).entries;
export function keyBytes(key){return Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
export class PushClient{
  constructor({storage,target=window,server,getState,getPreferences,onChange=()=>{}}){Object.assign(this,{storage,target,server,getState,getPreferences,onChange});this.data=null;this.error='';this.pending=false;this.verified=false;this.tail=Promise.resolve();this.fingerprint='';try{this.data=JSON.parse(storage.getItem(PUSH_KEY)||'null')}catch{this.error='Não foi possível ler a configuração push.'}}
  supported(){return this.target.isSecureContext&&!!this.target.navigator?.serviceWorker&&!!this.target.PushManager&&!!this.target.Notification}
  get active(){return !!this.data?.token&&this.data.confirmed===true}
  options(){try{return validatePushOptions(this.data?.options||pushDefaults())}catch{this.error='As preferências de notificações precisam ser salvas novamente.';return pushDefaults()}}
  async saveOptions(options){return this.queue(async()=>{const next={...this.data,options:validatePushOptions(options)};this.persist(next);if(next.token){try{await this.upload(true)}catch(error){this.error='Preferências salvas neste aparelho, mas não foi possível atualizar o servidor. A fila anterior ainda pode gerar avisos. Tente novamente.';this.onChange();throw Error(this.error)}}this.onChange()})}
  async request(path,body,token=this.data?.token,method='POST'){
    const serialized=body===undefined?undefined:JSON.stringify(body);
    // Keep small schedule updates alive if Android closes the page during upload.
    const keepalive=path==='/schedule'&&serialized!==undefined&&new TextEncoder().encode(serialized).length<=32768;
    const response=await this.target.fetch(this.server+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},keepalive,...(serialized===undefined?{}:{body:serialized}),signal:AbortSignal.timeout(20000),cache:'no-store',credentials:'omit'});
    if(!response.ok){const error=Error(response.status===410?'Este registro foi desativado. Ative novamente para registrar o aparelho.':'Não foi possível atualizar as notificações ('+response.status+'). Tente novamente.');error.status=response.status;throw error;}
    return response.json();
  }
  persist(data){const raw=JSON.stringify(data);this.storage.setItem(PUSH_KEY,raw);if(this.storage.getItem(PUSH_KEY)!==raw)throw Error('Não foi possível salvar as notificações neste aparelho.');this.data=data}
  queue(fn){const result=this.tail.then(fn,fn);this.tail=result.catch(()=>{});return result}
  async enable(options){return this.queue(async()=>{
    if(!this.server)throw Error('O serviço push ainda não está ativado. Os lembretes dentro do app continuam funcionando.');
    if(!this.supported())throw Error('Este navegador não oferece notificações push. Abra no Chrome atualizado.');
    options=validatePushOptions(options);
    const permission=await this.target.Notification.requestPermission();
    if(permission!=='granted')throw Error('Permissão de notificações não concedida. Você pode alterá-la nas configurações do navegador.');
    const config=await this.request('/config',undefined,null,'GET');
    const registration=await this.target.navigator.serviceWorker.ready;
    const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
    const prior=this.data,token=prior?.token||this.target.crypto.randomUUID()+this.target.crypto.randomUUID();
    const next={...prior,token,options,subscription:subscription.toJSON(),confirmed:false};
    // Persist the capability before sending anything, so a failed save leaves no orphan server record.
    this.persist(next);
    try{try{await this.upload(true)}catch(error){if(error.status!==410)throw error;this.persist({...this.data,token:this.target.crypto.randomUUID()+this.target.crypto.randomUUID(),confirmed:false});await this.upload(true)}this.error='';this.onChange()}catch(error){this.error=error.message;this.onChange();throw error}
  })}
  async upload(force=false){if(!this.data?.token||!this.server)return;
    const entries=pushSchedule(this.getState(),this.getPreferences(),this.options(),Date.now(),loadItemPush(this.storage));
    const testAt=this.data.backgroundTestAt;
    if(Number.isSafeInteger(testAt)&&testAt>=Date.now()-60000){
      entries.push({tag:'retomar-prova-'+testAt,item:'retomar-prova',title:'Teste com o Retomar fechado',at:testAt,silent:this.options().silent});
    }
    const body={subscription:this.data.subscription,entries};const fingerprint=JSON.stringify(body);
    if(!force&&!this.error&&fingerprint===this.fingerprint)return;
    this.pending=true;this.onChange();
    try{
      const result=await this.request('/schedule',body);if(result?.ok!==true)throw Error('O servidor não confirmou o agendamento. Tente novamente.');
      const nextAt=entries.length?Math.min(...entries.map(e=>e.at)):null;
      this.persist({...this.data,confirmed:true,lastSchedule:{at:Date.now(),count:entries.length,nextAt}});
      this.fingerprint=fingerprint;this.verified=true;this.error='';
    }finally{this.pending=false;this.onChange()}
  }
  sync(){return this.queue(async()=>{if(!this.data?.token)return;try{await this.upload()}catch(error){if(this.error!==error.message){this.error=error.message;this.onChange()}}})}
  disable(){return this.queue(async()=>{if(!this.data?.token)return;
    // Delete server schedule before forgetting the device capability.
    const result=await this.request('/schedule',undefined,undefined,'DELETE');if(result?.ok!==true)throw Error('O servidor não confirmou o cancelamento. Tente novamente.');
    const options=this.options();this.persist({...this.data,confirmed:false});
    const registration=await this.target.navigator.serviceWorker.ready;try{await (await registration.pushManager.getSubscription())?.unsubscribe()}finally{this.persist({options})}
    this.fingerprint='';this.verified=false;this.error='';this.onChange();
  })}
  backgroundTest(){return this.queue(async()=>{
    if(!this.active)throw Error('Ative as notificações primeiro.');
    const now=Date.now(),pending=this.data.backgroundTestAt;
    const at=pending>now?pending:now+120000;
    this.persist({...this.data,backgroundTestAt:at});
    await this.upload(true);
    return at;
  })}
  test(){return this.queue(async()=>{if(!this.active)throw Error('Ative as notificações primeiro.');const result=await this.request('/test',{});if(result?.ok!==true)throw Error('O serviço não confirmou o envio do teste.');this.persist({...this.data,lastTestAcceptedAt:Date.now()});this.onChange()})}
}
