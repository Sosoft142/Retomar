import {PUSH_SERVER} from '../dist/src/push-config.js';
import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {wrangler,hasCloudflareAuth,secretNames,ensureKeys,deploymentURL,verifyServer,APP_ORIGIN} from './deployment.mjs';

export async function deployAgenda({clientId,clientSecret,run=wrangler,fetcher=fetch,authenticated=hasCloudflareAuth(),expectedServer=PUSH_SERVER}={}){
  if(!authenticated)throw Error('Autentique sua conta com npx wrangler@4 login e execute npm run agenda:deploy. Nenhum segredo deve ser enviado pelo chat.');
  if(typeof clientId!=='string'||!/^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(clientId)||clientId.length>250||typeof clientSecret!=='string'||clientSecret.length<12||clientSecret.length>2048||/[\s\x00-\x1f\x7f]/.test(clientSecret))throw Error('Informe o ID e o segredo do mesmo cliente OAuth Web do Google.');
  const names=secretNames(await run(['secret','list'])),values={GOOGLE_CLIENT_ID:clientId,GOOGLE_CLIENT_SECRET:clientSecret};if(!names.includes('AGENDA_DATA_KEY'))values.AGENDA_DATA_KEY=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  // A chave de dados existente e o par VAPID nunca são trocados automaticamente.
  await ensureKeys(names,run);const output=await run(['deploy']),url=deploymentURL(output);if(url!==expectedServer)throw Error('O Worker publicado pertence a outro endereço. Confira a conta Cloudflare e o endpoint do app antes de ativar a agenda; nenhum segredo Google foi enviado.');await verifyServer(url,fetcher);
  const previous=await fetcher(url+'/agenda/config',{headers:{Origin:APP_ORIGIN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(previous.ok){const info=await previous.json();if(info.ready===true&&info.clientId!==clientId)throw Error('O servidor já usa outro cliente Google. A troca exige migração administrativa das autorizações. Conserve o ID atual; nenhum segredo Google foi substituído.');}
  await run(['secret','bulk'],{input:JSON.stringify(values)});const response=await fetcher(url+'/agenda/config',{headers:{Origin:APP_ORIGIN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok||response.headers.get('Access-Control-Allow-Origin')!==APP_ORIGIN)throw Error('O servidor não confirmou a ativação da agenda. As notificações existentes foram preservadas.');
  const config=await response.json();if(config.version!==1||config.ready!==true||config.clientId!==clientId||config.callbackURL!==url+'/agenda/oauth/callback')throw Error('A configuração contínua da agenda ainda não está pronta no servidor.');return {url,callbackURL:config.callbackURL,ready:true};
}
function question(prompt,{hidden=false}={}){return new Promise(resolveAnswer=>{let mute=false;const output=new Writable({write(chunk,encoding,done){if(!mute)process.stdout.write(chunk,encoding);done();}}),rl=createInterface({input:process.stdin,output,terminal:!!process.stdin.isTTY});process.stdout.write(prompt);mute=hidden;rl.question('',answer=>{mute=false;rl.close();if(hidden)process.stdout.write('\n');resolveAnswer(answer.trim());});});}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
  if(!hasCloudflareAuth())throw Error('Execute npx wrangler@4 login na sua conta e depois npm run agenda:deploy. O navegador será usado por você para autorizar a Cloudflare. Não envie credenciais pelo chat.');
  if(!process.stdin.isTTY)throw Error('Execute agenda:deploy em um terminal interativo para informar as credenciais com entrada oculta.');
  const clientId=await question('ID do cliente OAuth Web do Google: '),clientSecret=await question('Segredo desse cliente (entrada oculta): ',{hidden:true});const result=await deployAgenda({clientId,clientSecret});console.log('Servidor de agenda ativado. No cliente OAuth do Google, adicione a URI de redirecionamento autorizada: '+result.callbackURL);console.log('No Retomar, use o mesmo ID, mantenha o pareamento conectado e autorize Google Agenda uma vez. Os demais aparelhos poderão restaurar a conexão.');
}catch(e){console.error(e.message);process.exitCode=1;}}
