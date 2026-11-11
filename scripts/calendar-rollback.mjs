import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const checkpoint={version:'1.3',commit:'c3897a5c61b954c0f62ba4be0d77748af939932a',tree:'766411070bfed498b547aaa6725b6cfa5d36e668',branch:'backup/retomar-1.3-antes-agenda-2026-11-11'};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
try{
  const args=process.argv.slice(2);if(args.length!==1||!['--check','--prepare'].includes(args[0]))throw Error('Use --check para conferir a cópia preservada ou --prepare para preparar a restauração local. Nada é publicado por este comando.');
  const root=git('rev-parse','--show-toplevel');process.chdir(root);
  if(JSON.parse(readFileSync('package.json','utf8')).name!=='retomar')throw Error('Execute no repositório Retomar.');
  git('cat-file','-e',checkpoint.tree+'^{tree}');
  const saved=JSON.parse(git('show',checkpoint.tree+':package.json'));if(saved.version!=='1.3')throw Error('A cópia preservada não corresponde à versão 1.3.');
  const currentWorker=readFileSync('dist/service-worker.js','utf8'),previousWorker=git('show',checkpoint.tree+':dist/service-worker.js');
  const cache=source=>Number(/shell-v(\d+)/.exec(source)?.[1]||0),nextCache=Math.max(cache(currentWorker),cache(previousWorker))+1;
  if(args[0]==='--check'){console.log(JSON.stringify({...checkpoint,available:true,nextCache},null,2));process.exit(0);}
  if(git('status','--porcelain','--untracked-files=no'))throw Error('Há alterações locais. Salve-as em um commit antes de preparar a restauração.');
  git('restore','--source='+checkpoint.tree,'--staged','--worktree','--','.');
  // Um cache novo substitui a versão experimental em instalações já abertas.
  writeFileSync(resolve(root,'dist/service-worker.js'),previousWorker.replace(/shell-v\d+/,'shell-v'+nextCache)+'\n');
  git('add','dist/service-worker.js');
  console.log('Versão 1.3 preparada localmente, com cache v'+nextCache+'. Nenhum dado pessoal ou evento do Google foi alterado. Execute npm ci --ignore-scripts e npm run verify, revise as diferenças e publique pelo fluxo normal.');
}catch(error){console.error(error.message);process.exitCode=1;}
