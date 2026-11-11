import {validDate,visibleItems,openItem} from './domain.js';
import {dateInZone,addDays,zonedInstant,validZone} from './planning.js';

export const CALENDAR_KEY='entrelinhas-vida:google-calendar:v1';
export const GOOGLE_SCOPES=['https://www.googleapis.com/auth/calendar.events.readonly','https://www.googleapis.com/auth/calendar.calendarlist.readonly'];
export const validClientId=value=>typeof value==='string'&&/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(value)&&value.length<=250;
export const calendarDefaults=()=>({enabled:true,clientId:'',calendarIds:null});
export function validateCalendarPreferences(value){
  if(!value||Array.isArray(value)||typeof value.enabled!=='boolean'||typeof value.clientId!=='string'||value.clientId&&!validClientId(value.clientId)||Object.keys(value).some(k=>!['enabled','clientId','calendarIds'].includes(k))||value.calendarIds!==null&&(!Array.isArray(value.calendarIds)||value.calendarIds.length>100||value.calendarIds.some(id=>typeof id!=='string'||!id||id.length>1024)||new Set(value.calendarIds).size!==value.calendarIds.length))throw Error('As opções da agenda precisam ser configuradas novamente.');
  return structuredClone(value);
}
export class CalendarPreferences{
  constructor(storage){this.storage=storage;this.error='';try{const raw=storage.getItem(CALENDAR_KEY);this.value=raw===null?calendarDefaults():validateCalendarPreferences(JSON.parse(raw));}catch{this.value={...calendarDefaults(),enabled:false};this.error='Não foi possível ler as opções da agenda. Suas tarefas estão preservadas. Salve as opções para configurar novamente.';}}
  save(value){const next=validateCalendarPreferences(value),raw=JSON.stringify(next);try{this.storage.setItem(CALENDAR_KEY,raw);if(this.storage.getItem(CALENDAR_KEY)!==raw)throw Error();}catch{throw Error('Não foi possível salvar as opções da agenda neste aparelho.');}this.value=next;this.error='';return next;}
}
export function loadGoogleIdentity(target=window){
  if(target.google?.accounts?.oauth2?.initTokenClient)return Promise.resolve(target.google.accounts.oauth2);
  const doc=target.document;
  return new Promise((resolve,reject)=>{
    const script=doc.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    const timer=target.setTimeout(()=>finish(Error('O Google não respondeu. Confira sua conexão e tente preparar novamente.')),15000);
    function finish(error){target.clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else resolve(target.google.accounts.oauth2);}
    script.onload=()=>target.google?.accounts?.oauth2?.initTokenClient?finish():finish(Error('Não foi possível preparar a conexão com o Google.'));
    script.onerror=()=>finish(Error('Não foi possível carregar a conexão com o Google. Confira sua conexão.'));
    doc.head.append(script);
  });
}
export class GoogleReadSession{
  constructor({target=window,load=()=>loadGoogleIdentity(target),now=()=>Date.now()}={}){Object.assign(this,{target,load,now});this.identity=null;this.token='';this.expiresAt=0;this.pending=null;this.epoch=0;this.preparing=null;}
  prepare(){if(this.identity)return Promise.resolve();if(this.preparing)return this.preparing;return this.preparing=Promise.resolve().then(()=>this.load()).then(identity=>{if(typeof identity?.initTokenClient!=='function')throw Error('A conexão do Google não está disponível.');this.identity=identity;}).finally(()=>{this.preparing=null;});}
  get accessToken(){return this.now()<this.expiresAt?this.token:'';}
  connect(clientId){
    if(!validClientId(clientId))return Promise.reject(Error('Configure primeiro o ID público de cliente do Google.'));
    if(!this.identity)return Promise.reject(Error('Prepare a conexão e toque novamente para autorizar o Google.'));
    if(this.pending)return this.pending.promise;
    this.token='';this.expiresAt=0;
    const epoch=++this.epoch;let resolve,reject,settled=false;
    const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});
    const timer=this.target.setTimeout(()=>finish(Error('A autorização não foi concluída. Toque em Conectar para tentar novamente.')),120000);
    const finish=(error,response)=>{
      if(epoch!==this.epoch||settled)return;settled=true;
      this.target.clearTimeout(timer);this.pending=null;
      if(error){reject(error);return;}
      const scopes=new Set(typeof response?.scope==='string'?response.scope.split(/\s+/):[]),expires=Number(response?.expires_in);
      if(response?.error||!GOOGLE_SCOPES.every(s=>scopes.has(s))){reject(Error('O Google não autorizou a consulta das agendas e dos eventos. Suas tarefas continuam disponíveis.'));return;}
      if(typeof response?.access_token!=='string'||!response.access_token||response.access_token.length>8192||/[\s\x00-\x1f\x7f]/.test(response.access_token)||!Number.isFinite(expires)||expires<=30){reject(Error('O Google retornou uma autorização inválida. Tente conectar novamente.'));return;}
      this.token=response.access_token;this.expiresAt=this.now()+(Math.min(expires,3600)-30)*1000;resolve();
    };
    this.pending={promise,reject:()=>{this.target.clearTimeout(timer);reject(Error('Conexão cancelada.'));}};
    try{this.identity.initTokenClient({client_id:clientId,scope:GOOGLE_SCOPES.join(' '),include_granted_scopes:false,callback:response=>finish(null,response),error_callback:e=>finish(Error(e?.type==='popup_failed_to_open'?'O Google não conseguiu abrir a autorização. Permita o pop-up desta página e tente novamente.':'A janela de autorização foi fechada. Você pode tentar novamente.'))}).requestAccessToken({prompt:'select_account'});}catch{finish(Error('Não foi possível iniciar a autorização do Google.'));}
    return promise;
  }
  clear(){this.epoch++;this.pending?.reject();this.pending=null;this.token='';this.expiresAt=0;}
}
const apiError=(message,status)=>Object.assign(Error(message),{status});
export class CalendarReader{
  constructor(fetcher=globalThis.fetch?.bind(globalThis)){this.fetcher=fetcher;}
  async request(path,params,token,signal){
    if(typeof token!=='string'||!token||/[\s\x00-\x1f\x7f]/.test(token))throw apiError('Conecte ao Google para consultar a agenda.',401);
    const url=new URL('https://www.googleapis.com/calendar/v3/'+path);for(const [key,value] of Object.entries(params))if(value!==undefined)url.searchParams.set(key,String(value));
    const controller=new AbortController();let timedOut=false;const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},15000);
    try{
      const response=await this.fetcher(url.href,{method:'GET',headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
      if(!response.ok)throw apiError(response.status===401?'O acesso ao Google expirou. Toque em Conectar para renovar.':response.status===403?'O Google não permitiu consultar esta agenda. Confira as permissões e a configuração da conexão.':response.status===429?'O Google limitou as consultas. Aguarde um pouco antes de atualizar.':'Não foi possível consultar o Google Agenda. Tente atualizar novamente.',response.status);
      let data;try{data=await response.json();}catch{throw Error('O Google Agenda retornou uma resposta inválida.');}
      if(!data||typeof data!=='object'||Array.isArray(data)||data.error||data.items!==undefined&&!Array.isArray(data.items)||data.nextPageToken!==undefined&&typeof data.nextPageToken!=='string')throw Error('O Google Agenda retornou uma lista inválida.');
      return {...data,items:data.items||[]};
    }catch(error){if(timedOut)throw Error('O Google demorou para responder. Tente atualizar novamente.');throw error;}
    finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  async pages(path,params,token,signal,limit){
    const items=[],seen=new Set();let pageToken;
    do{
      const data=await this.request(path,{...params,pageToken},token,signal);items.push(...data.items);
      if(items.length>limit)throw Error('Há muitos resultados. Selecione menos agendas ou um período menor.');
      pageToken=data.nextPageToken;if(pageToken){if(seen.has(pageToken))throw Error('O Google repetiu uma página de resultados. Tente atualizar novamente.');seen.add(pageToken);}
      if(seen.size>25)throw Error('A consulta excedeu o limite de páginas. Selecione um período menor.');
    }while(pageToken);
    return items;
  }
  async calendars(token,signal){
    const items=await this.pages('users/me/calendarList',{maxResults:250,minAccessRole:'reader',showHidden:true,fields:'nextPageToken,items(id,summary,summaryOverride,backgroundColor,primary,selected,deleted,accessRole)'},token,signal,500);
    const seen=new Set();return items.filter(c=>c&&!c.deleted&&typeof c.id==='string'&&c.id&&c.id.length<=1024&&!seen.has(c.id)&&seen.add(c.id)).map(c=>({id:c.id,name:String(c.summaryOverride||c.summary||'Agenda').slice(0,200),color:/^#[0-9a-f]{6}$/i.test(c.backgroundColor)?c.backgroundColor:'#14b8a6',primary:c.primary===true}));
  }
  async events(calendars,range,token,signal){
    const all=[];let ignored=0;
    // Consultas sequenciais reduzem picos de quota; uma falha não se apresenta como lista completa.
    for(const calendar of calendars){
      const rows=await this.pages('calendars/'+encodeURIComponent(calendar.id)+'/events',{timeMin:new Date(range.start).toISOString(),timeMax:new Date(range.end).toISOString(),timeZone:range.zone,singleEvents:true,orderBy:'startTime',showDeleted:false,maxResults:1000,fields:'nextPageToken,items(id,status,summary,location,description,htmlLink,start,end)'},token,signal,5000);
      for(const row of rows){if(row?.status==='cancelled')continue;const event=normalizeEvent(row,calendar);if(event)all.push(event);else ignored++;}
      if(all.length>5000)throw Error('Há mais de 5.000 eventos. Selecione menos agendas ou um período menor.');
    }
    return {events:[...new Map(all.map(e=>[e.key,e])).values()].sort((a,b)=>a.start-b.start||a.title.localeCompare(b.title,'pt-BR')),ignored};
  }
}
export function safeCalendarLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname==='calendar.google.com'||u.hostname==='www.google.com'&&u.pathname.startsWith('/calendar/'))&&u.href.length<=8192?u.href:'';}catch{return '';}}
function instant(part){
  if(typeof part?.dateTime!=='string')return NaN;
  if(!validDate(part.dateTime.slice(0,10)))return NaN;
  if(/(?:Z|[+-]\d{2}:\d{2})$/i.test(part.dateTime))return Date.parse(part.dateTime);
  const m=/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(part.dateTime);
  if(!m||!validZone(part.timeZone)||Number(m[3]||0)>59)return NaN;
  try{return zonedInstant(m[1],m[2],part.timeZone)+Number(m[3]||0)*1000;}catch{return NaN;}
}
export function normalizeEvent(row,calendar){
  if(!row||typeof row.id!=='string'||!row.id||row.id.length>1024)return null;
  const allDay=typeof row.start?.date==='string',start=allDay?Date.parse(row.start.date+'T00:00:00Z'):instant(row.start),end=allDay?Date.parse(row.end?.date+'T00:00:00Z'):instant(row.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||allDay&&(!validDate(row.start.date)||!validDate(row.end?.date)))return null;
  return {key:JSON.stringify([calendar.id,row.id]),id:row.id,calendarId:calendar.id,calendarName:calendar.name,color:calendar.color,title:String(row.summary||'Compromisso sem título').slice(0,1000),location:String(row.location||'').slice(0,2000),description:String(row.description||'').slice(0,5000),link:safeCalendarLink(row.htmlLink),allDay,start,end,startDate:allDay?row.start.date:'',endDate:allDay?row.end.date:''};
}
function dayStart(date,zone){
  for(let day=0;day<3;day++)for(let hour=0;hour<24;hour++){
    const candidate=addDays(date,day);try{const at=zonedInstant(candidate,String(hour).padStart(2,'0')+':00',zone);if(hour===0)return at;for(let minute=(hour-1)*60+1;minute<hour*60;minute++){try{return zonedInstant(candidate,String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),zone);}catch{}}return at;}catch{}
  }
  throw Error('Não foi possível calcular este dia no fuso selecionado.');
}
export function calendarRange(date,days,zone){if(!validDate(date)||![1,7].includes(days)||!validZone(zone))throw Error('Escolha uma data e um fuso válidos.');return {date,days,zone,start:dayStart(date,zone),end:dayStart(addDays(date,days),zone)};}
export function eventsOnDay(events,date,zone){const r=calendarRange(date,1,zone);return events.filter(e=>e.allDay?e.startDate<=date&&date<e.endDate:e.start<r.end&&e.end>r.start);}
export function tasksOnDay(state,date){return visibleItems(state).filter(t=>openItem(t)&&t.date===date).sort((a,b)=>(a.time||'24:00').localeCompare(b.time||'24:00')||a.order-b.order);}
export const calendarToday=zone=>dateInZone(new Date(),zone);
