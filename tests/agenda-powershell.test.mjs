import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('Windows PowerShell 5.1 baixa o script e passa o ID do Read-Host pelo npm.cmd', {skip:process.platform!=='win32',timeout:120000}, async t=>{
 const temp=await mkdtemp(join(tmpdir(),'retomar-powershell-'));t.after(()=>rm(temp,{recursive:true,force:true}));
 const cwd=join(temp,'Retomar com espacos & (teste)');await mkdir(join(cwd,'server'),{recursive:true});await mkdir(join(cwd,'dist','src'),{recursive:true});
 const ref=process.env.RETOMAR_VERIFY_REF||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();assert.match(ref,/^[a-f0-9]{40}$/);
 await copyFile(join(root,'server','deployment.mjs'),join(cwd,'server','deployment.mjs'));await copyFile(join(root,'dist','src','push-config.js'),join(cwd,'dist','src','push-config.js'));
 // Projeto descartável: npm verdadeiro, argumentos de produção, nenhuma chamada Google/Cloudflare.
 await writeFile(join(cwd,'package.json'),JSON.stringify({name:'retomar-verificacao',version:'1.0.0',private:true,type:'module',scripts:{'agenda:deploy':'node audit.mjs'}}));
 await writeFile(join(cwd,'audit.mjs'),`const {agendaArguments}=await import(new URL('server/calendar-deployment.mjs',import.meta.url));\nconst args=process.argv.slice(2);const parsed=agendaArguments(args);console.log('AUDIT_RESULT:'+JSON.stringify({args,clientId:parsed.clientId}));\n`);
 const source='https://raw.githubusercontent.com/Sosoft142/Retomar/'+ref+'/server/calendar-deployment.mjs';
 const script=`$ErrorActionPreference = 'Stop'\r\n$ProgressPreference = 'SilentlyContinue'\r\nInvoke-WebRequest -UseBasicParsing -Uri "${source}" -OutFile ".\\server\\calendar-deployment.mjs" -TimeoutSec 30\r\nnpm.cmd run agenda:deploy -- --client-id (Read-Host "Cole o ID do cliente Google")\r\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\r\n`;
 await writeFile(join(cwd,'audit.ps1'),script);
 const powershell=join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),clientId='12345-public.apps.googleusercontent.com';
 const transcript=await new Promise((resolve,reject)=>{
  let output='',sent=false,settled=false;const child=spawn(powershell,['-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',join(cwd,'audit.ps1')],{cwd,env:{...process.env,NO_COLOR:'1'},stdio:['pipe','pipe','pipe'],windowsHide:true});
  const timer=setTimeout(()=>{child.kill();finish(Error('Tempo limite na verificação PowerShell: '+output));},90000);
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(output);}
  function collect(chunk){output+=chunk.toString();if(!sent&&output.includes('Cole o ID do cliente Google')){sent=true;child.stdin.end(clientId+'\r\n');}}
  child.stdout.on('data',collect);child.stderr.on('data',collect);child.stdin.on('error',()=>{});child.on('error',finish);child.on('close',code=>finish(code===0?null:Error('PowerShell encerrou com código '+code+': '+output)));
 });
 const result=transcript.match(/AUDIT_RESULT:(\{[^\r\n]+\})/);assert.ok(result,'Resultado ausente: '+transcript);assert.deepEqual(JSON.parse(result[1]),{args:['--client-id',clientId],clientId});assert.ok(!/ParserError|UnexpectedToken/.test(transcript));
 assert.deepEqual(await readFile(join(cwd,'server','calendar-deployment.mjs')),await readFile(join(root,'server','calendar-deployment.mjs')));
});
