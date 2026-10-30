import {APP_ID} from './domain.js';
import {calendarEventId,safeCalendarLink,validClientId} from './planning.js';
export const GOOGLE_SCOPES=['https://www.googleapis.com/auth/calendar.events.owned','https://www.googleapis.com/auth/calendar.calendarlist.readonly'];
const BASE='https://www.googleapis.com/calendar/v3';
function apiError(status){const error=new Error(status===401?'A autorização do Google expirou. Conecte novamente.':status===403?'O Google não permitiu esta ação. Confira as permissões e se a agenda pertence à conta conectada.':status===404?'A agenda ou o evento não foi encontrado no Google.':status===410?'Este evento foi removido no Google. Use Abrir no Google Agenda para criar outro.':status===412?'O evento mudou no Google durante o envio. Confira e toque novamente para atualizar.':status===429?'O Google recebeu muitas solicitações. Aguarde um pouco e tente novamente.':'Não foi possível confirmar o envio ao Google Agenda. Tocar novamente no envio direto usa o mesmo vínculo, sem criar outra cópia.');error.status=status;return error}
export class GoogleCalendarAdapter{
  constructor({token,fetcher=(...args)=>globalThis.fetch(...args),onUnauthorized=()=>{},timeout=15000}){this.token=token;this.fetcher=fetcher;this.onUnauthorized=onUnauthorized;this.timeout=timeout;this.pending=new Map()}
  async request(path,{method='GET',body,etag,allowMissing=false}={}){
    const token=this.token();if(!token)throw apiError(401);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeout);
    try{const response=await this.fetcher(BASE+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{}),...(etag?{'If-Match':etag}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store'});
      if(allowMissing&&response.status===404)return null;
      if(!response.ok){if(response.status===401)this.onUnauthorized();throw apiError(response.status)}
      let result;try{result=await response.json()}catch{throw Error('O Google enviou uma resposta que não pôde ser confirmada. Tente novamente.')}
      if(!result||typeof result!=='object')throw Error('O Google não confirmou a resposta.');return result;
    }catch(error){if(Number.isInteger(error.status))throw error;if(error.name==='AbortError'||error instanceof TypeError)throw apiError(0);throw error}finally{clearTimeout(timer)}
  }
  async calendars(){let token='',items=[];for(let n=0;n<10;n++){const query=new URLSearchParams({minAccessRole:'owner',maxResults:'100',showDeleted:'false',...(token?{pageToken:token}:{})}),data=await this.request('/users/me/calendarList?'+query);items.push(...(data.items||[]).filter(c=>c.accessRole==='owner'&&c.id&&typeof c.summary==='string').map(c=>({id:c.id,name:c.summary,primary:!!c.primary})));if(!data.nextPageToken)return items;token=data.nextPageToken}throw Error('Há muitas agendas para listar. A agenda principal continua disponível.')}
  upsert(calendarId,event){
    const key=calendarId+'|'+event.extendedProperties.private.retomarItem;if(this.pending.has(key))return this.pending.get(key);
    const run=this.performUpsert(calendarId,event).finally(()=>this.pending.delete(key));this.pending.set(key,run);return run;
  }
  async performUpsert(calendarId,event){
    const itemId=event.extendedProperties.private.retomarItem,id=await calendarEventId(itemId,event.extendedProperties.private.retomarDataset),collection='/calendars/'+encodeURIComponent(calendarId)+'/events',path=collection+'/'+id;
    const check=data=>{if(!data||data.id!==id)throw Error('O Google não confirmou o vínculo deste evento.');if(data.status==='cancelled')throw apiError(410);const privateData=data.extendedProperties?.private;if(privateData?.retomarApp!==APP_ID||privateData?.retomarItem!==itemId||privateData?.retomarDataset!==event.extendedProperties.private.retomarDataset)throw Error('O evento encontrado não tem o vínculo esperado com este item. Nenhum dado foi alterado.');return data};
    let existing=await this.request(path,{allowMissing:true}),updated=!!existing;
    if(existing){check(existing);if(!existing.etag)throw Error('O Google não forneceu a revisão do evento. Tente novamente antes de atualizar.');await this.request(path,{method:'PATCH',body:event,etag:existing.etag})}
    else{try{await this.request(collection,{method:'POST',body:{id,...event}})}catch(error){if(error.status!==409)throw error;existing=check(await this.request(path));if(!existing.etag)throw Error('Não foi possível conferir a revisão deste evento. Tente novamente.');await this.request(path,{method:'PATCH',body:event,etag:existing.etag});updated=true}}
    const confirmed=check(await this.request(path));
    const sameBoundary=(a,b)=>a?.date?b?.date===a.date:!!b?.dateTime&&Date.parse(a?.dateTime)===Date.parse(b.dateTime);
    if(confirmed.summary!==event.summary||confirmed.colorId!==event.colorId||!sameBoundary(event.start,confirmed.start)||!sameBoundary(event.end,confirmed.end))throw Error('O Google respondeu, mas ainda não confirmou o título, a cor e o prazo enviados. Confira o evento e tente novamente.');
    return {id,updated,link:safeCalendarLink(confirmed.htmlLink),event:confirmed};
  }
}
export function loadGoogleIdentity(target=window){
  if(target.google?.accounts?.oauth2)return Promise.resolve();
  return new Promise((resolve,reject)=>{const script=target.document.createElement('script');let settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);script.onload=null;script.onerror=null;if(error){script.remove();reject(error)}else resolve()};const timer=setTimeout(()=>finish(Error('O Google demorou para responder. Confira a conexão e tente preparar a conexão novamente.')),12000);script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=()=>finish(target.google?.accounts?.oauth2?null:Error('Não foi possível preparar a conexão com o Google.'));script.onerror=()=>finish(Error('Não foi possível carregar a conexão do Google. Confira a rede e os bloqueadores de conteúdo.'));target.document.head.append(script)});
}
export function createGoogleSession({target=window,load=()=>loadGoogleIdentity(target),onChange=()=>{},now=()=>Date.now()}={}){
  let accessToken='',expires=0,phase='idle',message='',loading=null,pending=null,cancel=null,epoch=0,clientId='';
  const token=()=>expires>now()+30000?accessToken:'';
  const snapshot=()=>({phase:phase==='connected'&&!token()?'ready':phase,connected:!!token(),ready:!!target.google?.accounts?.oauth2,message:phase==='connected'&&!token()?'A autorização do Google expirou. Conecte novamente.':message});
  const notify=()=>onChange(snapshot());
  function invalidate(){accessToken='';expires=0;phase=target.google?.accounts?.oauth2?'ready':'idle';notify()}
  return {token,snapshot,invalidate,
    prepare(){if(loading)return loading;phase='loading';message='Preparando conexão com o Google…';notify();loading=load().then(()=>{phase=token()?'connected':'ready';message='Pronto para conectar ao Google.';notify()},error=>{phase='error';message=error.message;notify();throw error}).finally(()=>loading=null);return loading},
    connect(id){
      if(!validClientId(id))return Promise.reject(Error('Configure o ID público de cliente OAuth do Google.'));
      if(pending)return pending;
      if(!target.google?.accounts?.oauth2)return Promise.reject(Error('Prepare a conexão e toque em Conectar ao Google.'));
      const attempt=++epoch;clientId=id;accessToken='';expires=0;phase='authorizing';message='Confirme a conta e as permissões na janela do Google.';notify();
      let resolve,reject;const job=new Promise((yes,no)=>{resolve=yes;reject=no});pending=job;
      let timer,settled=false;const fail=error=>{if(settled||attempt!==epoch)return;settled=true;clearTimeout(timer);phase='ready';message=error.message;pending=null;cancel=null;notify();reject(error)};cancel=fail;
      const accept=response=>{if(settled||attempt!==epoch)return;if(!response||typeof response!=='object'){fail(Error('O Google não confirmou a autorização.'));return}if(response.error){fail(Error(response.error==='access_denied'?'Você não autorizou o acesso ao Google Agenda.':'Não foi possível autorizar o Google. Confira o projeto OAuth e as permissões.'));return}
        const api=target.google.accounts.oauth2;let granted=false;try{granted=typeof api.hasGrantedAllScopes==='function'?api.hasGrantedAllScopes(response,...GOOGLE_SCOPES):GOOGLE_SCOPES.every(scope=>(response.scope||'').split(' ').includes(scope))}catch{fail(Error('Não foi possível conferir as permissões do Google.'));return}
        if(!granted||typeof response.access_token!=='string'||!/^\S{10,4096}$/.test(response.access_token)||!Number.isFinite(Number(response.expires_in))||Number(response.expires_in)<=30){fail(Error('Autorize as permissões de eventos e de lista de agendas para o envio direto.'));return}
        settled=true;clearTimeout(timer);accessToken=response.access_token;expires=now()+Math.min(Number(response.expires_in),86400)*1000;clientId=id;phase='connected';message='Google conectado nesta sessão. Os envios são feitos ao tocar no botão de cada item.';pending=null;cancel=null;notify();resolve(true);
      };
      try{const client=target.google.accounts.oauth2.initTokenClient({client_id:id,scope:GOOGLE_SCOPES.join(' '),callback:accept,error_callback:error=>fail(Error(error.type==='popup_closed'?'Conexão com o Google cancelada.':error.type==='popup_failed_to_open'?'O navegador bloqueou a janela do Google. Permita pop-ups para o Retomar e tente novamente.':'Não foi possível abrir a autorização do Google.'))});timer=setTimeout(()=>fail(Error('A autorização do Google não foi concluída. Tente conectar novamente.')),120000);client.requestAccessToken({prompt:'select_account'})}catch{fail(Error('Não foi possível iniciar a autorização do Google.'))}
      return job;
    },
    disconnect(){cancel?.(Error('Conexão com o Google cancelada.'));epoch++;const previous=accessToken;invalidate();message='Google desconectado neste aparelho.';if(previous&&target.google?.accounts?.oauth2)try{target.google.accounts.oauth2.revoke(previous,()=>{})}catch{};notify()},
    reset(id=''){if(id!==clientId){cancel?.(Error('A configuração da conexão foi alterada.'));epoch++;accessToken='';expires=0;clientId=id;phase=target.google?.accounts?.oauth2?'ready':'idle';message='';notify()}}
  };
}
