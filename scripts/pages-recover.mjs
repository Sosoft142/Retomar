// Recuperação operacional somente quando o commit de main indica um alvo exato.
const target=/^Recuperar Pages: ([a-f0-9]{40})$/m.exec(process.env.RECOVERY_MESSAGE||'')?.[1];
if(target){
  const base=`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pages/deployments/${target}`;
  const headers={Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const request=(url,method='GET')=>fetch(url,{method,headers,signal:AbortSignal.timeout(20000)});
  const cancel=await request(base+'/cancel','POST');
  if(!cancel.ok&&cancel.status!==404)throw Error(`Cancelamento da implantação interrompida falhou: HTTP ${cancel.status}`);
  console.log('Cancelamento solicitado para a implantação explicitamente indicada.');
  let finished=cancel.status===404;
  for(let attempt=0;!finished&&attempt<6;attempt++){
    await new Promise(resolve=>setTimeout(resolve,5000));
    const response=await request(base);
    if(response.status===404){finished=true;break;}
    if(!response.ok)throw Error(`Consulta da implantação interrompida falhou: HTTP ${response.status}`);
    const {status}=await response.json();finished=['succeed','failed','canceled','cancelled'].includes(status);
  }
  if(!finished)throw Error('O GitHub Pages ainda mantém a implantação antiga em andamento após o cancelamento.');
}
