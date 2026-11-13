import {PUSH_SERVER} from '../dist/src/push-config.js';
import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {wrangler,hasCloudflareAuth,secretNames,ensureKeys,deploymentURL,verifyServer,APP_ORIGIN} from './deployment.mjs';

const validClientId=value=>typeof value==='string'&&/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(value)&&value.length<=250;
const validClientSecret=value=>typeof value==='string'&&value.length>=12&&value.length<=2048&&!/[\s\x00-\x1f\x7f]/.test(value)&&!validClientId(value);

export async function deployAgenda({clientId,clientSecret,run=wrangler,fetcher=fetch,authenticated=hasCloudflareAuth(),expectedServer=PUSH_SERVER}={}){
  if(!authenticated)throw Error('Autentique sua conta com npx wrangler@4 login e execute npm run agenda:deploy. Nenhum segredo deve ser enviado pelo chat.');
  if(!validClientId(clientId)||!validClientSecret(clientSecret))throw Error('Informe o ID e o segredo do mesmo cliente OAuth Web do Google.');
  const names=secretNames(await run(['secret','list'])),values={GOOGLE_CLIENT_ID:clientId,GOOGLE_CLIENT_SECRET:clientSecret};if(!names.includes('AGENDA_DATA_KEY'))values.AGENDA_DATA_KEY=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  // A chave de dados existente e o par VAPID nunca são trocados automaticamente.
  await ensureKeys(names,run);const output=await run(['deploy']),url=deploymentURL(output);if(url!==expectedServer)throw Error('O Worker publicado pertence a outro endereço. Confira a conta Cloudflare e o endpoint do app antes de ativar a agenda; nenhum segredo Google foi enviado.');await verifyServer(url,fetcher);
  const previous=await fetcher(url+'/agenda/config',{headers:{Origin:APP_ORIGIN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(previous.ok){const info=await previous.json();if(info.ready===true&&info.clientId!==clientId)throw Error('O servidor já usa outro cliente Google. A troca exige migração administrativa das autorizações. Conserve o ID atual; nenhum segredo Google foi substituído.');}
  await run(['secret','bulk'],{input:JSON.stringify(values)});const response=await fetcher(url+'/agenda/config',{headers:{Origin:APP_ORIGIN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok||response.headers.get('Access-Control-Allow-Origin')!==APP_ORIGIN)throw Error('O servidor não confirmou a ativação da agenda. As notificações existentes foram preservadas.');
  const config=await response.json();if(config.version!==1||config.ready!==true||config.clientId!==clientId||config.callbackURL!==url+'/agenda/oauth/callback')throw Error('A configuração contínua da agenda ainda não está pronta no servidor.');return {url,callbackURL:config.callbackURL,ready:true};
}
export function agendaArguments(args){
  if(!args.length)return {};
  const value=args.length===2&&args[0]==='--client-id'?args[1]:args.length===1&&args[0].startsWith('--client-id=')?args[0].slice(12):'';
  if(!validClientId(value))throw Error('Use agenda:deploy ou agenda:deploy -- --client-id seguido do ID público completo. O segredo é informado apenas na entrada oculta.');
  return {clientId:value};
}
export function readAgendaCredentials({input=process.stdin,output=process.stdout,clientId=''}={}){
  if(clientId&&!validClientId(clientId))return Promise.reject(Error('Informe um ID público Google válido antes do segredo.'));
  return new Promise((resolveAnswer,reject)=>{
    let hidden=false,settled=false,phase=clientId?'secret':'id';
    const sink=new Writable({write(chunk,encoding,done){if(!hidden)output.write(chunk,encoding);done();}});
    // Uma única interface preserva linhas coladas e trata CRLF remoto como uma quebra.
    // O rótulo pertence ao readline para não ser apagado pela atualização do cursor.
    const rl=createInterface({input,output:sink,terminal:!!input.isTTY,crlfDelay:Infinity,historySize:0});
    function prompt(){hidden=false;rl.setPrompt(phase==='id'?'ID do cliente OAuth Web do Google: ':'Segredo desse cliente (entrada oculta): ');rl.prompt();hidden=phase==='secret';}
    function finish(error,value){if(settled)return;settled=true;hidden=false;input.removeListener('error',inputError);rl.close();sink.end();error?reject(error):resolveAnswer(value);}
    rl.on('line',line=>{
      if(settled)return;const value=line.trim();
      if(phase==='id'){
        if(!validClientId(value)){output.write('ID inválido. Cole o ID completo, terminado em .apps.googleusercontent.com.\n');prompt();return;}
        clientId=value;phase='secret';prompt();return;
      }
      output.write('\n');
      if(!validClientSecret(value)){output.write('Segredo inválido. Cole a chave secreta do mesmo cliente Google.\n');prompt();return;}
      finish(null,{clientId,clientSecret:value});
    });
    rl.on('SIGINT',()=>{output.write('\n');finish(Error('Operação cancelada antes da publicação.'));});
    rl.on('close',()=>{if(!settled)finish(Error('A entrada foi encerrada antes de receber as credenciais. Execute o comando novamente.'));});
    rl.on('error',()=>finish(Error('Não foi possível ler as credenciais neste terminal.')));
    function inputError(){finish(Error('Não foi possível ler as credenciais neste terminal.'));}
    input.once('error',inputError);
    prompt();
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
  if(!hasCloudflareAuth())throw Error('Execute npx wrangler@4 login na sua conta e depois npm run agenda:deploy. O navegador será usado por você para autorizar a Cloudflare. Não envie credenciais pelo chat.');
  if(!process.stdin.isTTY)throw Error('Execute agenda:deploy em um terminal interativo para informar as credenciais com entrada oculta.');
  const preset=agendaArguments(process.argv.slice(2));const {clientId,clientSecret}=await readAgendaCredentials(preset);console.log('Credenciais recebidas. Publicando o servidor; mantenha esta janela aberta.');const result=await deployAgenda({clientId,clientSecret});console.log('Servidor de agenda ativado. No cliente OAuth do Google, adicione a URI de redirecionamento autorizada: '+result.callbackURL);console.log('No Retomar, use o mesmo ID, mantenha o pareamento conectado e autorize Google Agenda uma vez. Os demais aparelhos poderão restaurar a conexão.');
}catch(e){console.error(e.message);process.exitCode=1;}}
