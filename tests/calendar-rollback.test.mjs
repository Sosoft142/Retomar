import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const repo=resolve(new URL('..',import.meta.url).pathname),script=join(repo,'scripts/calendar-rollback.mjs');
test('ponto anterior à agenda existe e comando de conferência não muda a fonte',()=>{
 const before=execFileSync('git',['diff','HEAD','--'],{cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024});
 const result=spawnSync(process.execPath,[script,'--check'],{cwd:repo,encoding:'utf8'});assert.equal(result.status,0,result.stderr);const value=JSON.parse(result.stdout);assert.equal(value.version,'1.3');assert.equal(value.tree,'766411070bfed498b547aaa6725b6cfa5d36e668');assert.equal(value.available,true);
 assert.equal(execFileSync('git',['diff','HEAD','--'],{cwd:repo,encoding:'utf8',maxBuffer:16*1024*1024}),before);
});
test('restauração real em checkout descartável remove a integração e mantém arquivos pessoais fora do Git',()=>{
 const folder=mkdtempSync(join(tmpdir(),'retomar-calendar-rollback-'));
 try{
  execFileSync('git',['clone','--shared','--quiet',repo,folder]);
  const git=(...args)=>execFileSync('git',args,{cwd:folder,encoding:'utf8'}).trim();
  git('config','user.name','Teste');git('config','user.email','test@example.invalid');
  const p=join(folder,'package.json'),pkg=JSON.parse(readFileSync(p,'utf8'));pkg.version='1.4';writeFileSync(p,JSON.stringify(pkg));
  writeFileSync(join(folder,'dist/calendar-experiment.js'),'experimental');writeFileSync(join(folder,'dist/service-worker.js'),readFileSync(join(folder,'dist/service-worker.js'),'utf8').replace(/shell-v\d+/,'shell-v42'));git('add','.');git('commit','-qm','Simular integração');
  writeFileSync(join(folder,'planejamento-pessoal.json'),'preservar');
  let result=spawnSync(process.execPath,[script,'--prepare'],{cwd:folder,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(readFileSync(p,'utf8')).version,'1.3');assert.equal(existsSync(join(folder,'dist/calendar-experiment.js')),false);assert.match(readFileSync(join(folder,'dist/service-worker.js'),'utf8'),/shell-v43/);assert.equal(readFileSync(join(folder,'planejamento-pessoal.json'),'utf8'),'preservar');
  assert.equal(git('hash-object','dist/src/domain.js'),git('rev-parse','766411070bfed498b547aaa6725b6cfa5d36e668:dist/src/domain.js'));
  writeFileSync(join(folder,'README.md'),'Edição não salva');result=spawnSync(process.execPath,[script,'--prepare'],{cwd:folder,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/alterações locais/);assert.equal(readFileSync(join(folder,'README.md'),'utf8'),'Edição não salva');
 }finally{rmSync(folder,{recursive:true,force:true});}
});
