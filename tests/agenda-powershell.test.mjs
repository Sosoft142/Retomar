import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('Windows PowerShell 5.1 baixa o script e passa o ID do Read-Host pelo npm.cmd', {skip:process.platform!=='win32'||process.env.RETOMAR_WINDOWS_CONSOLE!=='1',timeout:120000}, async t=>{
 const temp=await mkdtemp(join(tmpdir(),'retomar-powershell-'));t.after(()=>rm(temp,{recursive:true,force:true}));
 const cwd=join(temp,'Retomar com espacos & (teste)');await mkdir(join(cwd,'server'),{recursive:true});await mkdir(join(cwd,'dist','src'),{recursive:true});
 const ref=process.env.RETOMAR_VERIFY_REF||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();assert.match(ref,/^[a-f0-9]{40}$/);
 await copyFile(join(root,'server','deployment.mjs'),join(cwd,'server','deployment.mjs'));await copyFile(join(root,'dist','src','push-config.js'),join(cwd,'dist','src','push-config.js'));
 // Projeto descartável: npm verdadeiro, argumentos de produção, nenhuma chamada Google/Cloudflare.
 await writeFile(join(cwd,'package.json'),JSON.stringify({name:'retomar-verificacao',version:'1.0.0',private:true,type:'module',scripts:{'agenda:deploy':'node audit.mjs'}}));
 await writeFile(join(cwd,'audit.mjs'),`const {agendaArguments,readAgendaCredentials}=await import(new URL('server/calendar-deployment.mjs',import.meta.url));\nconst args=process.argv.slice(2);const parsed=agendaArguments(args);const credentials=await readAgendaCredentials(parsed);console.log('AUDIT_RESULT:'+JSON.stringify({argumentsOK:args.length===2&&args[0]==='--client-id'&&parsed.clientId==='12345-public.apps.googleusercontent.com',secretOK:credentials.clientSecret==='fictitious_terminal_secret',tty:!!process.stdin.isTTY}));\n`);
 const source='https://raw.githubusercontent.com/Sosoft142/Retomar/'+ref+'/server/calendar-deployment.mjs';
 const script=`$ErrorActionPreference = 'Stop'\r\n$ProgressPreference = 'SilentlyContinue'\r\nInvoke-WebRequest -UseBasicParsing -Uri "${source}" -OutFile ".\\server\\calendar-deployment.mjs" -TimeoutSec 30\r\nnpm.cmd run agenda:deploy -- --client-id (Read-Host "Cole o ID do cliente Google")\r\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\r\n`;
 await writeFile(join(cwd,'audit.ps1'),script);
 const powershell=join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
 const result=await new Promise((resolve,reject)=>{
  let output='',settled=false;const child=spawn('python',[join(root,'tests','helpers','windows-console.py'),cwd,powershell,join(cwd,'audit.ps1')],{cwd,env:{...process.env,PYTHONIOENCODING:'utf-8'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  const timer=setTimeout(()=>{child.kill();finish(Error('Tempo limite na verificação PowerShell: '+output));},110000);
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);if(error){reject(error);return;}const result=output.match(/^WINDOWS_CONSOLE_RESULT:(.+)$/m);if(!result){reject(Error('Resultado de console ausente: '+output));return;}try{resolve(JSON.parse(result[1]));}catch(e){reject(e);}}
  child.stdout.on('data',chunk=>output+=chunk.toString());child.stderr.on('data',chunk=>output+=chunk.toString());child.on('error',finish);child.on('close',code=>finish(code===0?null:Error('Console Windows encerrou com código '+code+': '+output)));
 });
 assert.equal(result.stage,2);assert.equal(result.exitStatus,0);assert.equal(result.error,'');const marker=result.output.match(/AUDIT_RESULT:(\{[^\r\n]+\})/);assert.ok(marker,'Resultado ausente: '+result.output);assert.deepEqual(JSON.parse(marker[1]),{argumentsOK:true,secretOK:true,tty:true});assert.ok(!/ParserError|UnexpectedToken/.test(result.output));assert.ok(!result.output.includes('fictitious_terminal_secret'),'O segredo fictício não deve aparecer no console');
 // Compare com o blob Git: checkout Windows pode converter LF em CRLF.
 assert.deepEqual(await readFile(join(cwd,'server','calendar-deployment.mjs')),execFileSync('git',['show','HEAD:server/calendar-deployment.mjs'],{cwd:root}));
});
