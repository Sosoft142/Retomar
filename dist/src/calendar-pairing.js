import {GistAdapter} from './sync/gist.js';
import {validateCalendarPreferences} from './calendar.js';

export const AGENDA_FILE='retomar-agenda.enc.json';
const META_KEY='entrelinhas-vida:agenda-pairing:v1',FORMAT='retomar-agenda-encrypted-v1',encoder=new TextEncoder();
const b64=bytes=>{let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
const bytes=text=>{if(typeof text!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(text)||text.length%4)throw Error('Configuração criptografada inválida.');return Uint8Array.from(atob(text),c=>c.charCodeAt(0));};
const settings=p=>{validateCalendarPreferences({enabled:true,...p});if(Object.keys(p).some(k=>!['clientId','calendarIds'].includes(k)))throw Error('Configuração da agenda inválida.');return structuredClone(p);};
export function validateAgendaRecord(r){
  if(!r||Array.isArray(r)||r.version!==1||Object.keys(r).sort().join(',')!=='revision,settings,version'||!r.revision||Array.isArray(r.revision)||Object.keys(r.revision).sort().join(',')!=='counter,deviceId'||!Number.isSafeInteger(r.revision.counter)||r.revision.counter<1||typeof r.revision.deviceId!=='string'||!r.revision.deviceId||r.revision.deviceId.length>100)throw Error('Registro de agenda inválido.');
  settings(r.settings);return structuredClone(r);
}
export function mergeAgendaRecords(a,b){if(!a)return b&&validateAgendaRecord(b);if(!b)return validateAgendaRecord(a);validateAgendaRecord(a);validateAgendaRecord(b);const delta=a.revision.counter-b.revision.counter||(a.revision.deviceId<b.revision.deviceId?-1:a.revision.deviceId>b.revision.deviceId?1:0);return structuredClone(delta>0?a:delta<0?b:JSON.stringify(a)>=JSON.stringify(b)?a:b);}
async function key(secret,salt,iterations){if(typeof secret!=='string'||secret.length<12||secret.length>1024)throw Error('Conecte a sincronização para proteger as opções da agenda.');const source=await crypto.subtle.importKey('raw',encoder.encode(secret),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},source,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
export async function sealAgenda(record,secret){validateAgendaRecord(record);const plain=encoder.encode(JSON.stringify(record));if(plain.length>150000)throw Error('Configuração de agenda grande demais.');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(FORMAT)},await key(secret,salt,310000),plain);return JSON.stringify({format:FORMAT,iterations:310000,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))});}
export async function unsealAgenda(text,secret){
  if(typeof text!=='string'||text.length>220000)throw Error('Configuração da agenda incompleta ou grande demais.');const e=JSON.parse(text);if(e?.format!==FORMAT||!Number.isInteger(e.iterations)||e.iterations<100000||e.iterations>1000000)throw Error('Formato da agenda incompatível.');const salt=bytes(e.salt),iv=bytes(e.iv),ciphertext=bytes(e.ciphertext);if(salt.length!==16||iv.length!==12||ciphertext.length<16)throw Error('Configuração criptografada inválida.');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:encoder.encode(FORMAT)},await key(secret,salt,e.iterations),ciphertext);if(plain.byteLength>150000)throw Error('Configuração da agenda grande demais.');return validateAgendaRecord(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain)));
}
// Credencial própria do serviço: o token GitHub nunca é enviado ao servidor de agenda.
export async function agendaPairKey({gistId,secret}){if(!/^[a-f0-9]{5,64}$/i.test(gistId)||typeof secret!=='string'||secret.length<12||secret.length>1024)throw Error('Conecte a sincronização antes da agenda compartilhada.');const source=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveBits']);const result=await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:encoder.encode(gistId.toLowerCase()),info:encoder.encode('retomar-agenda-broker-v1')},source,256);return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}
export class CalendarPairing{
  constructor({storage,deviceId,getConnection,getSettings,onSettings,onState=()=>{},adapterFactory=token=>new GistAdapter(token)}){Object.assign(this,{storage,deviceId,getConnection,getSettings,onSettings,onState,adapterFactory});this.running=null;this.epoch=0;this.context='';this.message='Conecte a sincronização para compartilhar as opções da agenda.';}
  load(){try{const raw=this.storage.getItem(META_KEY);if(raw===null)return null;const data=JSON.parse(raw);if(!data||Object.keys(data).sort().join(',')!=='dirty,gistId,record'||!/^[a-f0-9]{5,64}$/i.test(data.gistId||'')||typeof data.dirty!=='boolean')throw Error();validateAgendaRecord(data.record);return data;}catch{throw Error('As opções locais de compartilhamento precisam ser recuperadas; nenhuma cópia foi substituída.');}}
  changed(){const ctx=this.getConnection(),old=this.load(),gistId=ctx?.gistId||old?.gistId;if(!gistId)return;const record=validateAgendaRecord({version:1,revision:{counter:(old?.gistId===gistId?old.record?.revision.counter||0:0)+1,deviceId:this.deviceId},settings:settings(this.getSettings())});this.storage.setItem(META_KEY,JSON.stringify({gistId,record,dirty:true}));void this.sync();}
  reset(){this.epoch++;this.context='';this.message='Conexão compartilhada indisponível neste aparelho.';this.onState(this.message);}
  async sync(){
    const ctx=this.getConnection();if(!ctx){this.reset();return false;}const context=ctx.gistId+'\0'+ctx.secret;if(this.running&&context===this.context)return this.running;const epoch=++this.epoch;this.context=context;
    let rewriteRemote=false;const adapter=this.adapterFactory(ctx.token),valid=()=>{if(epoch!==this.epoch||this.getConnection()?.gistId!==ctx.gistId||this.getConnection()?.secret!==ctx.secret)throw Error('Compartilhamento alterado durante a consulta.');};
    const read=async()=>{const g=await adapter.request('/gists/'+ctx.gistId);valid();if(g.public!==false)throw Error('A agenda exige o Gist secreto do pareamento.');const f=g.files?.[AGENDA_FILE];if(!f)return null;if(g.truncated||f.truncated||typeof f.content!=='string'||f.content.length>220000)throw Error('A configuração remota da agenda está incompleta.');try{const value=await unsealAgenda(f.content,ctx.secret);rewriteRemote=false;return value;}catch(e){if(!ctx.previousSecret)throw e;const value=await unsealAgenda(f.content,ctx.previousSecret);rewriteRemote=true;return value;}};
    const run=(async()=>{try{
      const previous=this.load();let local=previous;if(local?.gistId!==ctx.gistId)local=null;let remote=await read();valid();
      // Migração só publica a configuração antiga quando ainda não existe uma cópia remota.
      if(!previous&&!remote&&this.getSettings().clientId)local={record:{version:1,revision:{counter:1,deviceId:this.deviceId},settings:settings(this.getSettings())},dirty:true};
      for(let attempt=0;attempt<4;attempt++){
        const fresh=this.load();if(fresh?.gistId===ctx.gistId)local=fresh;
        const winner=mergeAgendaRecords(local?.record,remote);if(!winner){this.message='Opções da agenda serão compartilhadas depois de configurar a conexão.';this.onState(this.message);return true;}
        if(rewriteRemote||JSON.stringify(winner)!==JSON.stringify(remote)){const content=await sealAgenda(winner,ctx.secret);valid();await adapter.request('/gists/'+ctx.gistId,{method:'PATCH',body:{files:{[AGENDA_FILE]:{content}}}});valid();remote=await read();valid();if(JSON.stringify(mergeAgendaRecords(winner,remote))!==JSON.stringify(remote)){local={record:winner,dirty:true};continue;}}
        const latest=this.load();if(latest?.gistId===ctx.gistId&&latest.dirty&&JSON.stringify(latest.record)!==JSON.stringify(local?.record)){local=latest;continue;}
        const merged=mergeAgendaRecords(winner,remote);this.storage.setItem(META_KEY,JSON.stringify({gistId:ctx.gistId,record:merged,dirty:false}));this.onSettings(merged.settings);this.message='Configuração da agenda compartilhada com os aparelhos pareados.';this.onState(this.message);return true;
      }throw Error('As opções mudaram em outro aparelho. A sincronização da agenda será repetida.');
    }catch(e){if(epoch===this.epoch){this.message=e.message||'Não foi possível compartilhar as opções da agenda.';this.onState(this.message);}return false;}finally{if(epoch===this.epoch)this.running=null;}})();this.running=run;return run;
  }
}
