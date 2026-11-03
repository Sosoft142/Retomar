import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {root,tracked,digest,bounded} from './workflow-lib.mjs';
const folder=resolve(root,'.work');mkdirSync(folder,{recursive:true});
const before=digest(),log=[];let failed=false;
function run(name,command,args){const r=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});const output=(r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:'');log.push(`\n## ${name}\n${output}`);if(r.status!==0){failed=true;console.error(name+': FALHOU\n'+bounded(output.slice(-5000),5000))}return output}
const tests=tracked().filter(p=>/^tests\/.*\.test\.mjs$/.test(p));
if(!tests.length){failed=true;console.error('Nenhum teste encontrado. A verificação não pode ser aprovada.');}
else{const output=run('Suíte completa',process.execPath,['--test','--test-reporter=spec',...tests]);console.log(output.split('\n').filter(line=>/tests \d+|pass \d+|fail \d+|duration_ms/.test(line)).join('\n'));}
for(const file of tracked().filter(p=>/\.(mjs|js)$/.test(p))){
 run('Sintaxe '+file,process.execPath,['--check',file]);
 const source=readFileSync(resolve(root,file),'utf8');for(const [,name] of source.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)){try{readFileSync(resolve(root,dirname(file),name))}catch{failed=true;log.push('Import local ausente: '+file+' → '+name);console.error('Import local ausente: '+file+' → '+name)}}
}
run('Diferenças de espaço em branco','git',['diff','--check','HEAD','--']);
const after=digest();if(before!==after){failed=true;console.error('A fonte mudou durante a verificação. Execute novamente sobre a fonte final.');}
writeFileSync(resolve(folder,'verification.log'),log.join('\n'));
writeFileSync(resolve(folder,'verification.json'),JSON.stringify({ok:!failed,sourceDigest:after,checkedAt:new Date().toISOString(),testFiles:tests.length},null,2));
console.log(failed?'Verificação reprovada.':'Suíte completa, sintaxe, imports e diferenças: aprovados.');console.log('Log completo: .work/verification.log');process.exitCode=failed?1:0;
