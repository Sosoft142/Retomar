// O navegador oferece a instalação; aceitar o convite não confirma o WebAPK.
export function createInstallation({target=window,onChange=()=>{}}={}){
  const display=target.matchMedia('(display-mode: standalone)');
  let deferred=null,phase='waiting',epoch=0;
  const standalone=()=>display.matches||target.navigator.standalone===true;
  const messages={
    waiting:'O botão fica disponível quando o navegador permite instalar. Você pode continuar usando o site enquanto isso.',
    ready:'O navegador pedirá sua confirmação para instalar o Retomar.',
    prompting:'Confirme ou cancele a instalação na janela do navegador.',
    requested:'O pedido foi enviado ao navegador. Aguarde o ícone aparecer na lista de aplicativos; isso pode levar alguns instantes.',
    dismissed:'Você cancelou a instalação. O botão ficará disponível quando o navegador oferecer uma nova tentativa.',
    error:'O navegador não conseguiu iniciar a instalação. Recarregue a página para tentar novamente.'
  };
  function snapshot(){return {hidden:standalone(),phase,label:phase==='prompting'?'Aguardando confirmação…':phase==='requested'?'Instalação solicitada':'Instalar Retomar',message:messages[phase],enabled:!standalone()&&phase==='ready'&&!!deferred};}
  const notify=()=>onChange(snapshot());
  function offered(event){event.preventDefault();epoch++;deferred=event;phase='ready';notify();}
  function requested(){epoch++;deferred=null;phase='requested';notify();}
  function modeChanged(){epoch++;deferred=null;phase='waiting';notify();}
  target.addEventListener('beforeinstallprompt',offered);
  target.addEventListener('appinstalled',requested);
  if(display.addEventListener)display.addEventListener('change',modeChanged);else display.addListener?.(modeChanged);
  return {snapshot,async install(){
    if(!snapshot().enabled)return;
    const prompt=deferred,attempt=++epoch;deferred=null;phase='prompting';notify();
    try{await prompt.prompt();const choice=await prompt.userChoice;if(attempt===epoch&&phase==='prompting')phase=choice.outcome==='accepted'?'requested':'dismissed';}
    catch{if(attempt===epoch&&phase==='prompting')phase='error';}
    if(attempt===epoch)notify();
  },dispose(){epoch++;deferred=null;target.removeEventListener('beforeinstallprompt',offered);target.removeEventListener('appinstalled',requested);if(display.removeEventListener)display.removeEventListener('change',modeChanged);else display.removeListener?.(modeChanged);}};
}
