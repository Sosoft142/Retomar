import {spawn} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const config='server/wrangler.jsonc';
const required=['VAPID_PRIVATE_JWK','VAPID_PUBLIC_KEY'];
export const APP_ORIGIN='https://sosoft142.github.io';
export function hasCloudflareAuth(env=process.env,exists=existsSync,home=homedir()){
  const folders=[resolve(env.XDG_CONFIG_HOME||resolve(home,'.config'),'.wrangler'),resolve(home,'.wrangler')];
  if(env.APPDATA)folders.push(resolve(env.APPDATA,'xdg.config','.wrangler'));
  return !!(env.CLOUDFLARE_API_TOKEN&&env.CLOUDFLARE_ACCOUNT_ID)||folders.some(folder=>['default.toml','default.enc'].some(file=>exists(resolve(folder,'config',file))));
}
export function wrangler(args,{input,platform=process.platform,env=process.env}={}){
  return new Promise((resolveResult,reject)=>{
    // Windows não executa .cmd sem shell. O npm fornecido por npm run é JavaScript:
    // invoque-o pelo Node para preservar caminhos com espaços e segredos por stdin.
    const windows=platform==='win32',npmCLI=env.npm_execpath;
    if(windows&&(typeof npmCLI!=='string'||!/(?:^|[\\/])npm-cli\.js$/i.test(npmCLI)||!existsSync(npmCLI)))throw Error('No Windows, execute pela pasta do projeto: npm.cmd run agenda:deploy ou npm.cmd run push:deploy.');
    const command=windows?process.execPath:'npx',parameters=windows?[npmCLI,'exec','--yes','--','wrangler@4',...args,'--config',config]:['--yes','wrangler@4',...args,'--config',config];
    const child=spawn(command,parameters,{cwd:root,env:{...env,CI:'true',WRANGLER_SEND_METRICS:'false'},stdio:['pipe','pipe','pipe'],shell:false});
    let stdout='',stderr='',settled=false;
    const timer=setTimeout(()=>{child.kill();finish(Error('O comando Cloudflare excedeu o tempo limite. Confira a implantação antes de repetir.'))},120000);
    function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolveResult(value)}
    child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>200000){child.kill();finish(Error('Saída inesperada da Cloudflare.'))}});
    child.stderr.on('data',chunk=>{stderr+=chunk;if(stderr.length>200000){child.kill();finish(Error('Saída inesperada da Cloudflare.'))}});
    child.on('error',()=>finish(Error('Não foi possível iniciar o Wrangler. Confira Node.js e npm.')));
    child.on('close',code=>finish(code===0?null:Error('A operação Cloudflare falhou ('+args.slice(0,2).join(' ')+'). Confira a autenticação, as permissões e a conta. Os segredos não foram exibidos.'),stdout.replace(/\u001b\[[0-9;]*m/g,'')));
    child.stdin.on('error',()=>{});child.stdin.end(input||'');
  });
}
export function secretNames(raw){
  const list=JSON.parse(raw);if(!Array.isArray(list)||list.some(x=>!x||typeof x.name!=='string'))throw Error('A lista de segredos da Cloudflare não pôde ser conferida.');
  return list.map(x=>x.name);
}
export async function ensureKeys(names,run=wrangler){
  const found=required.filter(name=>names.includes(name));
  if(found.length===required.length)return {created:false};
  if(found.length)throw Error('O serviço possui apenas parte das chaves VAPID. A operação foi interrompida para não invalidar inscrições existentes.');
  const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const jwk=await crypto.subtle.exportKey('jwk',pair.privateKey),publicKey=Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url');
  await run(['secret','bulk'],{input:JSON.stringify({VAPID_PRIVATE_JWK:JSON.stringify(jwk),VAPID_PUBLIC_KEY:publicKey})});
  return {created:true};
}
export function deploymentURL(output){
  const matches=[...output.matchAll(/https:\/\/[a-z0-9.-]+\.workers\.dev(?=\/?(?:\s|$))\/?/gi)].map(x=>new URL(x[0]));
  const urls=[...new Set(matches.filter(u=>u.hostname.startsWith('retomar-push.')&&u.hostname.split('.').length===4).map(u=>u.origin))];
  if(urls.length!==1)throw Error('Não foi possível identificar uma URL única do Worker retomar-push. O app não foi alterado.');
  return urls[0];
}
export async function verifyServer(url,fetcher=fetch){
  const endpoint=new URL(url);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.port||endpoint.pathname!=='/'||endpoint.search||endpoint.hash)throw Error('URL de servidor inválida.');
  const response=await fetcher(endpoint.origin+'/config',{headers:{Origin:APP_ORIGIN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok||response.headers.get('Access-Control-Allow-Origin')!==APP_ORIGIN)throw Error('O servidor não confirmou a configuração e a origem do app. O app não foi alterado.');
  const body=await response.json();
  if(typeof body?.publicKey!=='string'||!/^[A-Za-z0-9_-]{87}$/.test(body.publicKey))throw Error('Chave pública push inválida. O app não foi alterado.');
  await crypto.subtle.importKey('raw',Buffer.from(body.publicKey,'base64url'),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  return endpoint.origin;
}
export async function deployPush({run=wrangler,fetcher=fetch,write=(file,content)=>writeFileSync(resolve(root,file),content),authenticated=hasCloudflareAuth()}={}){
  if(!authenticated)throw Error('Falta autenticar a conta Cloudflare. Em um computador com este projeto, execute npx wrangler@4 login e depois npm run push:deploy. Não envie tokens ou senhas no chat.');
  // Deploy conserva os segredos existentes; a primeira publicação ainda responde 503 até receber as chaves.
  const output=await run(['deploy']);
  const url=deploymentURL(output);
  await ensureKeys(secretNames(await run(['secret','list'])),run);
  const verified=await verifyServer(url,fetcher);
  write('dist/src/push-config.js',"// Endpoint verificado; entrega exige inscrição e teste no aparelho.\nexport const PUSH_SERVER="+JSON.stringify(verified)+";\n");
  return {url:verified,configured:true,deliveryVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const result=await deployPush();console.log('Servidor publicado e /config validado: '+result.url);console.log('A URL foi configurada no app. Execute npm run verify e publique os arquivos pelo fluxo de revisão. A entrega ainda precisa de Enviar teste no aparelho.');}
  catch(error){console.error(error.message);process.exitCode=1}
}
