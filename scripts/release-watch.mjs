import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),sha=args[args.indexOf('--sha')+1],event=args.includes('--event')?args[args.indexOf('--event')+1]:null;
if(args.includes('--help')){console.log('release:watch -- --sha SHA [--event push|pull_request]\nSomente leitura. Usa gh autenticado se disponível; senão, API pública. Sem credenciais em argumentos ou arquivos.');process.exit(0)}
if(!/^[a-f0-9]{40}$/.test(sha||'')||(event&&!['push','pull_request'].includes(event))){console.error('Informe --sha SHA completo e evento válido.');process.exit(1)}
let useGh=false;try{execFileSync('gh',['auth','status'],{stdio:'ignore',timeout:5000});useGh=true}catch{}
let previous='';
try{for(let attempt=0;attempt<90;attempt++){
 const path=`repos/Sosoft142/Retomar/actions/runs?head_sha=${sha}&per_page=5`;
 let data;if(useGh)data=JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8',timeout:20000,maxBuffer:1024*1024}));else{const response=await fetch('https://api.github.com/'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'retomar-release-watch'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('GitHub respondeu '+response.status+'; use o conector conectado.');data=await response.json()}
 const run=data.workflow_runs.find(r=>!event||r.event===event),state=run?`${run.id}: ${run.status}${run.conclusion?' / '+run.conclusion:''}`:'Aguardando criação da execução';
 if(state!==previous){console.log(state);previous=state}
 if(run?.status==='completed'){process.exitCode=run.conclusion==='success'?0:1;break}
 if(attempt===89)throw Error('Tempo de acompanhamento esgotado; a execução não foi cancelada.');await new Promise(resolve=>setTimeout(resolve,10000));
}}catch(error){console.error(error.message);process.exitCode=1}
