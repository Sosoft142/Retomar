import {readFileSync} from 'node:fs';
import {git,safeFile,bounded} from './workflow-lib.mjs';
try{
 const [command,...args]=process.argv.slice(2);
 if(command==='status')console.log(bounded(git('status','--short')+'\n'+git('log','-1','--oneline'),3000));
 else if(command==='read'){
  const [path,startText='1',endText]=args,start=Number(startText),end=endText?Number(endText):start+59;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end-start>=200)throw Error('Informe de 1 a 200 linhas. Amplie em trechos se necessário.');
  const rows=readFileSync(safeFile(path),'utf8').split('\n');console.log(bounded(rows.slice(start-1,end).map((line,i)=>`${start+i}: ${line}`).join('\n')));
 }else if(command==='diff'){if(!args[0])throw Error('Informe a referência base.');console.log(bounded(git('diff','--stat',args[0],'--'),4000))}
 else if(command==='--help'||!command)console.log('context status | read CAMINHO [INICIO FIM] | diff REF\nPesquisa: rg -n "símbolo" CAMINHO. Saídas são limitadas; refine a consulta.');
 else throw Error('Comando desconhecido. Use --help.');
}catch(error){console.error(error.message);process.exitCode=1}
