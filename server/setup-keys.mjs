// Run once for a NEW service, after Cloudflare login. Secret material only travels over stdin.
import {spawn} from 'node:child_process';
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.privateKey);
const publicKey=Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url');
const child=spawn('npx',['--yes','wrangler@4','secret','bulk','--config','server/wrangler.jsonc'],{stdio:['pipe','inherit','inherit']});
child.stdin.end(JSON.stringify({VAPID_PRIVATE_JWK:JSON.stringify(jwk),VAPID_PUBLIC_KEY:publicKey}));
child.on('exit',code=>process.exit(code??1));
