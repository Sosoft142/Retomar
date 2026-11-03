import {execFileSync} from 'node:child_process';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
export const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
export function git(...args){return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trimEnd()}
export function tracked(){return git('ls-files','-z').split('\0').filter(Boolean).sort()}
export function digest(){const hash=createHash('sha256');hash.update(git('ls-files','--stage','-z'));for(const name of tracked()){let bytes;try{bytes=readFileSync(resolve(root,name))}catch{bytes=Buffer.from('DELETED')};hash.update(name+'\0');hash.update(bytes);hash.update('\0')}return hash.digest('hex')}
export function safeFile(name){const file=realpathSync(resolve(root,name)),rel=relative(root,file);if(isAbsolute(rel)||rel.startsWith('../')||!tracked().includes(rel))throw Error('Leia somente arquivos rastreados dentro do projeto.');if(/(^|\/)(\.env(?:\..*)?|\.git)(\/|$)/.test(rel))throw Error('Arquivo de credenciais/metadados não permitido.');return file}
export function bounded(text,max=6000){return text.length>max?text.slice(0,max)+'\n[Saída limitada; refine a consulta.]':text}
export function changes(base){return git('diff','--name-status','--no-renames','-z',base,'--').split('\0').filter(Boolean).reduce((rows,part,i,all)=>{if(i%2===0)rows.push({status:part,path:all[i+1]});return rows},[])}
