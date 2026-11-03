import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {root,git,digest,changes} from './workflow-lib.mjs';
try{
 const args=process.argv.slice(2),position=args.indexOf('--base');if(position<0||!args[position+1])throw Error('Use --base REF para definir a fonte comparada.');
 const base=git('rev-parse','--verify',args[position+1]+'^{commit}');
 const proof=JSON.parse(readFileSync(resolve(root,'.work/verification.json'),'utf8'));
 if(!proof.ok||proof.sourceDigest!==digest())throw Error('A fonte atual ainda não possui verificação completa aprovada. Execute npm run verify.');
 const files=changes(base),runtimeChanged=files.some(f=>f.path.startsWith('dist/'));
 const untracked=git('ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean).filter(p=>!p.startsWith('.openai/'));
 if(untracked.length)throw Error('Inclua os novos arquivos pretendidos no Git antes de preparar: '+untracked.join(', '));
 if(args.includes('--expect-no-runtime-change')&&runtimeChanged)throw Error('dist/ foi alterado; a promessa de manutenção sem mudança no app não foi atendida.');
 if(!files.length)throw Error('Nenhuma alteração em relação à base.');
 const blobs=[];
 const treeElements=files.map(f=>{
  if(/(^|\/)(\.env(?:\..*)?)(\/|$)/.test(f.path))throw Error('Não exportar arquivos de credenciais: '+f.path);
  const mode=git('ls-files','--stage','--',f.path).split(' ')[0]||'100644';
  if(f.status==='D')return {path:f.path,mode:'100644',type:'blob',sha:null};
  if(!['100644','100755'].includes(mode))throw Error('Tipo de arquivo requer revisão específica antes de exportar: '+f.path);
  const bytes=readFileSync(resolve(root,f.path));let content;
  try{content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);if(bytes.includes(0))throw Error()}catch{
   const sha=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
   blobs.push({path:f.path,encoding:'base64',content:bytes.toString('base64'),sha});return {path:f.path,mode,type:'blob',sha};
  }
  return {path:f.path,mode,type:'blob',content};
 });
 const manifest={base,localHead:git('rev-parse','HEAD'),sourceDigest:digest(),runtimeChanged,version:JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version,files,treeElements,blobs};
 mkdirSync(resolve(root,'.work'),{recursive:true});writeFileSync(resolve(root,'.work/release.json'),JSON.stringify(manifest));
 console.log(JSON.stringify({base,version:manifest.version,files:files.length,binaryBlobs:blobs.length,runtimeChanged,verified:true,payload:'.work/release.json'},null,2));
}catch(error){console.error(error.message);process.exitCode=1}
