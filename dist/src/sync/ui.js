import {checkForm,validToken} from '../forms.js';
import {GistAdapter} from './gist.js';
import {openWithKeys,prepareConnection} from './connect.js';
import {unsealState} from './crypto.js';
import {SyncEngine} from './engine.js';
import {loadSync,saveConnection,disconnect as clearConnection,SYNC_CONFIG_KEY,SYNC_CREDENTIAL_KEY} from './preferences.js';
export function createSyncUI({repo,icon,esc,openModal,closeModal,toast,onApply,onExport,isBlocked}){
  const saved=loadSync(localStorage);
  let config=saved.config,credentials=saved.credentials,engine=null,connecting=false,connectionController=null,connectionEpoch=0,localError='';
  let status={kind:config.gistId?'pending':'local',message:config.gistId?'Conecte com o mesmo token para conferir seus dados.':'Conecte para usar o mesmo planejamento nos seus aparelhos.'};
  const labels={local:'Não conectado',pending:'Envio pendente',syncing:'Sincronizando',confirmed:'Sincronizado',error:'Sincronização não confirmada'};
  const currentStatus=()=>localError?{kind:'error',message:localError}:status;
  const dateText=()=>config.confirmedAt&&Number.isFinite(Date.parse(config.confirmedAt))?'Última confirmação neste aparelho: '+new Date(config.confirmedAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'Ainda sem confirmação neste aparelho';
  function refresh(){
    const visible=currentStatus();
    for(const b of document.querySelectorAll('[data-sync-indicator]')){b.dataset.syncState=visible.kind;b.setAttribute('aria-label',labels[visible.kind]+'. '+visible.message+' Abrir sincronização.');b.title=labels[visible.kind]+'. '+visible.message;}
    for(const el of document.querySelectorAll('[data-sync-label]'))el.textContent=labels[visible.kind];
    for(const el of document.querySelectorAll('[data-sync-message]'))el.textContent=visible.message;
    for(const el of document.querySelectorAll('[data-sync-date]'))el.textContent=dateText();
  }
  function setStatus(next){status=next;refresh();}
  function startEngine(){
    engine?.stop();if(!credentials||!config.gistId)return;
    const token=credentials.token;let legacyKey=credentials.secret!==token?credentials.secret:'';
    engine=new SyncEngine({repo,adapter:new GistAdapter(token),secret:token,gistId:config.gistId,rewriteRemote:!!legacyKey,verifyUnseal:unsealState,unseal:async text=>(await openWithKeys(text,token,legacyKey)).state,
      isEditing:()=>!!localError||isBlocked()||document.activeElement?.matches('input,textarea,select')||!!document.querySelector('dialog[open]')||document.documentElement.classList.contains('drag-active'),
      isOnline:()=>navigator.onLine!==false,onState:setStatus,onApply,onConfirmed:({confirmedAt})=>{
        legacyKey='';config={...config,confirmedAt,mode:'token'};credentials={...credentials,secret:token};
        try{saveConnection(localStorage,{...credentials,...config})}catch{toast('Sincronização conferida. Não foi possível atualizar a preferência de conexão neste aparelho.');}
      },lock:navigator.locks?fn=>navigator.locks.request('entrelinhas-vida:sync:'+config.gistId,{ifAvailable:true},lock=>fn(!!lock)):null});
    engine.schedule(500);
  }
  function attach({gistId,token,legacySecret,remember}){
    config={gistId,confirmedAt:'',mode:legacySecret?'password':'token'};credentials={token,secret:legacySecret||token,remember};
    try{saveConnection(localStorage,{gistId,...credentials})}catch{toast('Conexão ativa nesta sessão. Não foi possível manter o token salvo neste aparelho.');}
    startEngine();
  }
  function header(){const visible=currentStatus();return `<button type="button" class="sync-trigger sync-indicator" data-action="sync" data-sync-indicator data-sync-state="${visible.kind}" aria-label="${esc(labels[visible.kind]+'. Abrir sincronização.')}" aria-haspopup="dialog" aria-controls="retomar-sync-modal" title="${esc(labels[visible.kind])}">${icon('cloud')}</button>`;}
  function card(backupContent=''){const visible=currentStatus();return `<section class="settingscard sync-card"><div class="settings-heading"><span class="settings-icon">${icon('cloud')}</span><div><h2>Sincronização e backup</h2><p>Seus dados no celular e no computador.</p></div><span class="sync-dot" data-sync-indicator data-sync-state="${visible.kind}" aria-label="${esc(labels[visible.kind])}"></span></div><div class="settings-summary"><span><strong data-sync-label>${labels[visible.kind]}</strong><small data-sync-date>${esc(dateText())}</small></span><button class="btn secondary" data-action="sync">${engine?'Gerenciar conexão':'Conectar ao GitHub'}</button></div>${backupContent}</section>`;}
  function open(){
    const connected=!!engine,visible=currentStatus();
    const root=openModal('Sincronização',`
      <div class="sync-state-banner" data-sync-indicator data-sync-state="${visible.kind}">${icon('cloud')}<strong data-sync-label>${labels[visible.kind]}</strong></div>
      <div class="sync-summary"><h3>Seus dados nos dois aparelhos.</h3><p>Use o mesmo token do GitHub no celular e no computador. O backup do Retomar é encontrado ou criado automaticamente.</p></div>
      <form id="sync-form"><div class="formerror" role="alert"></div>
        ${connected?'':`<div class="field"><label for="sync-token">Token do GitHub</label><input id="sync-token" type="password" required minlength="12" maxlength="512" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Cole seu token do GitHub" aria-describedby="sync-token-help"><small class="field-help" id="sync-token-help">Pode usar o mesmo token do Silhueta, com a permissão gist.</small></div><label class="remember-choice"><input type="checkbox" id="sync-remember" checked><span>Manter conectado neste aparelho</span></label><p class="field-help">Marcada: o token fica neste navegador. Desmarcada: vale apenas enquanto esta sessão estiver aberta.</p>`}
        <div class="sync-main-action"><button class="btn primary full" id="connect-sync" type="submit">${connected?'Sincronizar agora':'Conectar e sincronizar'}</button></div>
        <p class="sync-feedback" data-sync-message role="status" aria-live="polite">${esc(visible.message)}</p><p class="small muted" data-sync-date>${esc(dateText())}</p>
        ${connected?'':`<details class="sync-help" id="legacy-details"><summary>Recuperar uma conexão antiga</summary><p>Somente se o Retomar anterior usava outra senha ou outro token. Depois da conferência, o backup passa a usar o token informado acima.</p><div class="field"><label for="sync-secret">Senha ou token anterior · opcional</label><input id="sync-secret" type="password" maxlength="1024" autocomplete="off" placeholder="Senha ou token anterior"></div></details><details class="sync-help"><summary>Como obter o token</summary><p>No GitHub, crie um token clássico com a permissão <strong>gist</strong>. O ID do backup é guardado automaticamente.</p><a class="textbtn" href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">Abrir tokens do GitHub ${icon('arrow')}</a><p>O token também protege o backup. Use o mesmo nos aparelhos e guarde uma cópia para abrir os dados se precisar trocar a credencial.</p></details>`}
        <p class="sync-caution">Verde confirma a cópia deste aparelho após reler o backup. Abra o app no outro aparelho para receber as alterações.</p>
        <div class="sync-footer">${connected?'<button class="textbtn" type="button" id="sync-disconnect">Desconectar este aparelho</button>':'<button class="textbtn" type="button" id="sync-cancel">Cancelar</button>'}<button class="textbtn" type="button" id="sync-export">Baixar cópia dos dados</button></div>
      </form>`,{id:'retomar-sync-modal',className:'sync-modal'});
    root.querySelector('#sync-export').onclick=onExport;
    root.querySelector('#sync-cancel')?.addEventListener('click',()=>closeModal(true));
    root.querySelector('#sync-disconnect')?.addEventListener('click',()=>{
      engine.stop();engine=null;credentials=null;config={};
      try{clearConnection(localStorage)}catch{toast('Não foi possível remover a configuração salva. Confira o armazenamento do navegador.');}
      closeModal(true);setStatus({kind:'local',message:'Desconectado neste aparelho. Seu planejamento e o backup foram preservados.'});onApply(repo.load());toast('Aparelho desconectado.');
    });
    root.querySelector('#sync-form').onsubmit=async event=>{
      event.preventDefault();if(connected){closeModal(true);engine?.run({manual:true});return;}if(connecting)return;
      const error=root.querySelector('.formerror'),button=root.querySelector('#connect-sync'),input=root.querySelector('#sync-token');error.textContent='';input.setCustomValidity('');
      const token=input.value.trim();if(!validToken(token)){input.setCustomValidity('Cole um token válido do GitHub, sem espaços ou caracteres especiais.');input.checkValidity();input.focus();return;}
      if(!checkForm(event.target))return;
      const remember=root.querySelector('#sync-remember').checked,legacySecret=root.querySelector('#sync-secret').value;
      connecting=true;button.disabled=true;button.textContent='Conferindo backup…';connectionController=new AbortController();const signal=connectionController.signal,attempt=++connectionEpoch;
      setStatus({kind:'syncing',message:'Procurando e conferindo o backup do Retomar.'});
      try{
        const prepared=await prepareConnection({repo,adapter:new GistAdapter(token),token,preferredId:config.gistId||'',legacySecret,signal});
        if(signal.aborted||attempt!==connectionEpoch)return;
        attach({...prepared,token,remember});closeModal(true);onApply(repo.load());toast(prepared.created?'Backup criado. Conferindo a sincronização.':'Backup encontrado. Conferindo a sincronização.');engine?.run({manual:true});
      }catch(err){
        if(signal.aborted||attempt!==connectionEpoch)return;
        const message=err.message||'Não foi possível conectar. Os dados locais foram mantidos.';error.textContent=message;setStatus({kind:'error',message});
        if(err.code==='DECRYPT_FAILED'){root.querySelector('#legacy-details').open=true;root.querySelector('#sync-secret').focus();}
      }finally{if(attempt===connectionEpoch){connecting=false;button.disabled=false;button.textContent='Conectar e sincronizar';}}
    };
    root.querySelector('#sync-token')?.addEventListener('input',event=>{event.target.setCustomValidity('');event.target.removeAttribute('aria-invalid');});
  }
  return {header,card,open,refresh,
    localFailure(message){localError=message;refresh();},localSaved(){localError='';refresh();},
    start(){startEngine();document.addEventListener('focusout',()=>queueMicrotask(()=>engine?.schedule(1400)));window.addEventListener('online',()=>engine?.run());window.addEventListener('storage',event=>{
      if(event.key!==SYNC_CONFIG_KEY&&event.key!==SYNC_CREDENTIAL_KEY)return;
      const next=loadSync(localStorage);
      if(next.config.gistId!==config.gistId||JSON.stringify(next.credentials)!==JSON.stringify(credentials?.remember?credentials:null)){
        engine?.stop();engine=null;config=next.config;credentials=next.credentials;setStatus({kind:config.gistId?'pending':'local',message:config.gistId?'Conexão atualizada em outra aba.':'Conecte para sincronizar seus dados.'});startEngine();
      }
    });setInterval(()=>{if(!document.hidden)engine?.run();},45000);},
    changed(){engine?.changed();},resume(){engine?.schedule(700);},
    cancelConnection(){connectionEpoch++;connectionController?.abort();connecting=false;if(!engine&&status.kind==='syncing')setStatus({kind:'local',message:'Conexão interrompida. Os dados continuam neste aparelho.'});},
    hasConnection:()=>!!config.gistId
  };
}

