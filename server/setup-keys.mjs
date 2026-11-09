// Legacy entry point: never rotate keys that are already in use.
import {ensureKeys,hasCloudflareAuth,secretNames,wrangler} from './deployment.mjs';
try{
  if(!hasCloudflareAuth())throw Error('Autentique sua conta com npx wrangler@4 login antes de configurar as chaves.');
  const result=await ensureKeys(secretNames(await wrangler(['secret','list'])));
  console.log(result.created?'Chaves criadas no armazenamento de segredos do Worker.':'As chaves existentes foram preservadas.');
}catch(error){console.error(error.message);process.exitCode=1}
