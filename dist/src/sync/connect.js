import {sealState,unsealState} from './crypto.js';
export async function openWithKeys(content,token,legacySecret){
  try{return {state:await unsealState(content,token),legacy:false}}
  catch(error){if(error.code!=='DECRYPT_FAILED')throw error;if(!legacySecret){error.message='Não foi possível abrir o backup com este token. Use o mesmo token do outro aparelho. Se usava uma senha no Retomar anterior, informe-a em “Conexão anterior”.';throw error}return {state:await unsealState(content,legacySecret),legacy:true}}
}
export async function prepareConnection({repo,adapter,token,preferredId='',legacySecret='',signal}){
  let gistId=preferredId,content;
  if(gistId){try{content=await adapter.read(gistId,signal)}catch(e){if(e.status!==404)throw e;gistId=''}}
  if(!gistId){const candidates=await adapter.discover(signal);candidates.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))||a.id.localeCompare(b.id));gistId=candidates[0]?.id||'';if(gistId)content=await adapter.read(gistId,signal)}
  if(!gistId){const encrypted=await sealState(repo.load(),token);if(signal?.aborted)throw new DOMException('Cancelado','AbortError');gistId=await adapter.create(encrypted,signal);return {gistId,legacySecret:'',created:true}}
  const opened=await openWithKeys(content,token,legacySecret);return {gistId,legacySecret:opened.legacy?legacySecret:'',created:false};
}
