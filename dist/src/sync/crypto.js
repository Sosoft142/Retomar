import {migrateState,validateState,APP_ID} from '../domain.js';
import {canonical} from './merge.js';
export const ENVELOPE_FORMAT='retomar-gist-encrypted-v1';
const ITERATIONS=310000,MAX_PLAINTEXT=650000,MAX_ENVELOPE=950000;
const encoder=new TextEncoder();
const b64=bytes=>{let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text)};
const unb64=text=>{if(typeof text!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(text)||text.length%4)throw Error('Envelope criptografado inválido.');return Uint8Array.from(atob(text),c=>c.charCodeAt(0))};
async function derive(secret,salt,iterations){if(typeof secret!=='string'||secret.length<12||secret.length>1024)throw Error('Use uma senha de sincronização com pelo menos 12 caracteres.');if(!globalThis.crypto?.subtle)throw Error('A criptografia exige um navegador atualizado em conexão HTTPS.');const material=await crypto.subtle.importKey('raw',encoder.encode(secret),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
export async function sealState(state,secret){const bytes=encoder.encode(canonical(validateState(state)));if(bytes.length>MAX_PLAINTEXT)throw Error('O planejamento excede o limite de sincronização desta versão (650 KB). Exporte um backup.');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await derive(secret,salt,ITERATIONS);const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);return JSON.stringify({format:ENVELOPE_FORMAT,appId:APP_ID,algorithm:'AES-GCM-256',kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))})}
export async function unsealState(text,secret){
  if(typeof text!=='string'||text.length>MAX_ENVELOPE)throw Error('O arquivo remoto excede o limite ou está incompleto.');let e;try{e=JSON.parse(text)}catch{throw Error('O arquivo remoto não é um JSON válido.')}
  if(!e||e.format!==ENVELOPE_FORMAT||e.appId!==APP_ID||e.algorithm!=='AES-GCM-256'||e.kdf!=='PBKDF2-SHA256'||!Number.isInteger(e.iterations)||e.iterations<100000||e.iterations>1000000)throw Error('O formato criptografado não é compatível com o Retomar.');
  const salt=unb64(e.salt),iv=unb64(e.iv),ciphertext=unb64(e.ciphertext);if(salt.length!==16||iv.length!==12||ciphertext.length<16)throw Error('Envelope criptografado inválido.');let plain;
  try{const key=await derive(secret,salt,e.iterations);plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext)}catch(err){if(err.name==='OperationError'){const error=Error('A senha ou o token não abriu este backup. Confira a chave usada no outro aparelho.');error.code='DECRYPT_FAILED';throw error}throw err}
  if(plain.byteLength>MAX_PLAINTEXT)throw Error('O arquivo remoto excede o limite de sincronização.');let state;try{state=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain))}catch{throw Error('O conteúdo descriptografado é inválido.')}return migrateState(state);
}
