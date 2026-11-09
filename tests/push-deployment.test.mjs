import test from 'node:test';
import assert from 'node:assert/strict';
import {APP_ORIGIN,hasCloudflareAuth,secretNames,ensureKeys,deploymentURL,verifyServer,deployPush} from '../server/deployment.mjs';
const endpoint='https://retomar-push.example.workers.dev';
async function configuration(){const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);return {publicKey:Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url')}}
const response=body=>Response.json(body,{headers:{'Access-Control-Allow-Origin':APP_ORIGIN}});
test('sem autenticação não inicia implantação nem altera o app',async()=>{
 let called=false;await assert.rejects(deployPush({authenticated:false,run:()=>called=true,write:()=>called=true}),/Falta autenticar/);assert.equal(called,false);
 assert.equal(hasCloudflareAuth({},()=>false,'/fixture'),false);assert.equal(hasCloudflareAuth({CLOUDFLARE_API_TOKEN:'ficticio',CLOUDFLARE_ACCOUNT_ID:'ficticio'},()=>false),true);
});
test('chaves existentes não são geradas novamente e configuração parcial é interrompida',async()=>{
 let calls=0;assert.deepEqual(await ensureKeys(['VAPID_PRIVATE_JWK','VAPID_PUBLIC_KEY'],()=>calls++),{created:false});assert.equal(calls,0);
 await assert.rejects(ensureKeys(['VAPID_PUBLIC_KEY'],()=>calls++),/parte das chaves/);assert.equal(calls,0);
});
test('primeira configuração envia um par correspondente somente por stdin',async()=>{
 let received;await ensureKeys([],async(args,options)=>{assert.deepEqual(args,['secret','bulk']);received=JSON.parse(options.input)});
 const jwk=JSON.parse(received.VAPID_PRIVATE_JWK);const publicPart={kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y};const key=await crypto.subtle.importKey('jwk',publicPart,{name:'ECDSA',namedCurve:'P-256'},true,['verify']);assert.equal(Buffer.from(await crypto.subtle.exportKey('raw',key)).toString('base64url'),received.VAPID_PUBLIC_KEY);
});
test('saída do Wrangler precisa identificar o Worker de produção sem ambiguidade',()=>{
 assert.equal(deploymentURL('Publicado '+endpoint+'\n'),endpoint);
 for(const text of ['https://outro.example.workers.dev','http://retomar-push.example.workers.dev',endpoint+'\nhttps://retomar-push.other.workers.dev'])assert.throws(()=>deploymentURL(text),/URL única/);
 assert.throws(()=>secretNames('{}'));assert.deepEqual(secretNames('[{"name":"VAPID_PUBLIC_KEY","type":"secret_text"}]'),['VAPID_PUBLIC_KEY']);
});
test('verificação exige resposta, CORS e chave pública válida antes de configurar o app',async()=>{
 const body=await configuration();assert.equal(await verifyServer(endpoint,async(url,options)=>{assert.equal(url,endpoint+'/config');assert.equal(options.headers.Origin,APP_ORIGIN);assert.equal(options.redirect,'error');return response(body)}),endpoint);
 await assert.rejects(verifyServer(endpoint,async()=>new Response('',{status:503})),/não confirmou/);
 await assert.rejects(verifyServer(endpoint,async()=>Response.json(body)),/origem/);
 await assert.rejects(verifyServer(endpoint,async()=>response({publicKey:'inválida'})),/Chave pública/);
});
test('implantação validada preserva chaves e grava somente o endpoint público',async()=>{
 const body=await configuration(),calls=[],writes=[];
 const result=await deployPush({authenticated:true,run:async args=>{calls.push(args);return args[0]==='deploy'?'Publicado '+endpoint:'[{"name":"VAPID_PRIVATE_JWK"},{"name":"VAPID_PUBLIC_KEY"}]'},fetcher:async()=>response(body),write:(...args)=>writes.push(args)});
 assert.deepEqual(calls,[['deploy'],['secret','list']]);assert.equal(writes.length,1);assert.equal(writes[0][0],'dist/src/push-config.js');assert.match(writes[0][1],/export const PUSH_SERVER=/);assert.ok(writes[0][1].includes(endpoint));assert.ok(!writes[0][1].includes(body.publicKey));assert.equal(result.deliveryVerified,false);
});
test('falha do servidor depois da implantação não habilita a integração no app',async()=>{
 let wrote=false;await assert.rejects(deployPush({authenticated:true,run:async args=>args[0]==='deploy'?endpoint:'[{"name":"VAPID_PRIVATE_JWK"},{"name":"VAPID_PUBLIC_KEY"}]',fetcher:async()=>new Response('',{status:503}),write:()=>wrote=true}));assert.equal(wrote,false);
});
