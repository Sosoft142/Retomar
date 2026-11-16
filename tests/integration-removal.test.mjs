import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {clearRetiredPreferences} from '../dist/src/retired-preferences.js';
import worker,{Device} from '../server/worker.js';

test('aplicativo não contém SDK, endpoints ou módulos de integração externa removidos',()=>{
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):[join(dir,entry.name)]);
 for(const file of walk('dist').filter(name=>/\.(js|html|css)$/.test(name))){
  const text=readFileSync(file,'utf8');assert.doesNotMatch(text,/accounts\.google\.com|googleapis\.com\/(?:auth\/)?calendar|oauth2\.googleapis|gsi\/client|\/agenda\/(?:auth|oauth|token|status|config|account)/,file);
 }
 for(const file of ['dist/src/calendar.js','dist/src/calendar-ui.js','dist/src/calendar-pairing.js','dist/src/calendar-session.js','server/calendar-auth.js','server/calendar-deployment.mjs'])assert.equal(existsSync(file),false,file);
 const shell=readFileSync('dist/service-worker.js','utf8');assert.ok(shell.includes('./src/retired-preferences.js'));assert.doesNotMatch(shell,/src\/day(?:-ui)?\.js/);assert.doesNotMatch(shell,/src\/calendar/);
 const pkg=JSON.parse(readFileSync('package.json','utf8'));assert.equal(pkg.scripts['agenda:deploy'],undefined);assert.equal(pkg.devDependencies.miniflare,undefined);
});

test('limpeza local remove apenas opções antigas e conserva dados e credenciais de sincronização',()=>{
 const retired=['entrelinhas-vida:google-calendar:v1','entrelinhas-vida:agenda-pairing:v1','entrelinhas-vida:day:v1'];
 const data=new Map([[retired[0],JSON.stringify({enabled:false,clientId:'retired-id',calendarIds:['private-id']})],[retired[1],'retired-record'],[retired[2],'{"enabled":true}'],['tasks','TASKS'],['sync-token','KEEP_SYNC'],['push-key','KEEP_PUSH']]);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 clearRetiredPreferences(storage);for(const key of retired)assert.equal(data.has(key),false);
 assert.equal(data.get('tasks'),'TASKS');assert.equal(data.get('sync-token'),'KEEP_SYNC');assert.equal(data.get('push-key'),'KEEP_PUSH');
 clearRetiredPreferences(storage);assert.equal(data.get('tasks'),'TASKS');
 assert.doesNotThrow(()=>clearRetiredPreferences({removeItem(){throw Error('blocked');}}));
});

test('migração remove somente armazenamento externo e preserva a classe das notificações',async()=>{
 const config=JSON.parse(readFileSync('server/wrangler.jsonc','utf8'));
 assert.deepEqual(config.durable_objects.bindings,[{name:'DEVICES',class_name:'Device'}]);
 assert.deepEqual(config.migrations.at(-1),{tag:'v3-remove-agenda',deleted_classes:['AgendaAccount']});
 assert.deepEqual(config.migrations[0],{tag:'v1',new_sqlite_classes:['Device']});assert.equal(typeof Device,'function');
 const env={APP_ORIGIN:'https://retomar.example',VAPID_PRIVATE_JWK:'existing-private-key',VAPID_PUBLIC_KEY:'existing-public-key'};
 for(const key of ['AGENDA_ACCOUNTS','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','AGENDA_DATA_KEY'])Object.defineProperty(env,key,{get(){throw Error('Retired binding accessed: '+key);}});
 for(const path of ['/agenda/config','/agenda/auth/start','/agenda/oauth/callback','/agenda/status','/agenda/token','/agenda/account']){
  const r=await worker.fetch(new Request('https://retomar-worker.example'+path,{headers:{Origin:env.APP_ORIGIN}}),env);assert.equal(r.status,404,path);
 }
 const publicConfig=await worker.fetch(new Request('https://retomar-worker.example/config',{headers:{Origin:env.APP_ORIGIN}}),env);assert.equal(publicConfig.status,200);assert.deepEqual(await publicConfig.json(),{publicKey:'existing-public-key'});
});
