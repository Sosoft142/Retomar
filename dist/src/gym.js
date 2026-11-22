import {DEFAULT_WORKOUTS} from './gym-data.js';
import {hasVisibleText} from './domain.js';
export const GYM_KEY='entrelinhas-vida:gym:v1';
export const gymPreferences=()=>({accent:'',layout:'cards',thumbnails:'large',descriptions:'collapsed',showProgress:true,showCardio:true,showGuidance:true,showCompleted:true,swipe:true,workoutColors:{},exerciseColors:{}});
export const validGymColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const text=(v,max)=>typeof v==='string'&&v.length<=max;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const shape=(v,keys)=>object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const id=v=>text(v,100)&&/^[\w-]+$/.test(v)&&!['__proto__','prototype','constructor'].includes(v);
export const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
export const gymDate=(now=new Date())=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
export const initialGym=()=>({appId:'retomar-academia',schemaVersion:2,workouts:structuredClone(DEFAULT_WORKOUTS),sessions:{},preferences:gymPreferences()});
export function validateGymPreferences(p){
  if(!shape(p,Object.keys(gymPreferences()))||(p.accent!==''&&!validGymColor(p.accent))||!['cards','list'].includes(p.layout)||!['large','compact','hidden'].includes(p.thumbnails)||!['collapsed','open','hidden'].includes(p.descriptions)||!['showProgress','showCardio','showGuidance','showCompleted','swipe'].every(k=>typeof p[k]==='boolean'))throw Error('As preferências da Academia são inválidas.');
  for(const kind of ['workoutColors','exerciseColors'])if(!object(p[kind])||Object.keys(p[kind]).length>10000||Object.entries(p[kind]).some(([key,value])=>!id(key)||!validGymColor(value)))throw Error('Há uma cor inválida na Academia.');
  return p;
}
export function migrateGym(input){
  if(input?.schemaVersion!==1)return validateGym(input);
  if(!shape(input,['appId','schemaVersion','workouts','sessions']))throw Error('A estrutura do backup antigo da Academia é inválida.');
  return validateGym({...structuredClone(input),schemaVersion:2,preferences:gymPreferences()});
}
export function validateGym(s){
  if(!shape(s,['appId','schemaVersion','workouts','sessions','preferences'])||s.appId!=='retomar-academia'||s.schemaVersion!==2||!Array.isArray(s.workouts)||s.workouts.length>50||!object(s.sessions))throw Error('Este arquivo não é um backup válido da Academia.');
  validateGymPreferences(s.preferences);
  const ids=new Set();
  for(const w of s.workouts){
    if(!shape(w,['id','name','focus','day','description','warmup','cardio','cardioNotes','notice','exercises'])||!id(w.id)||ids.has(w.id)||!text(w.name,100)||!hasVisibleText(w.name)||!['focus','day','warmup','cardio'].every(k=>text(w[k],200))||!['description','cardioNotes','notice'].every(k=>text(w[k],5000))||!Array.isArray(w.exercises)||w.exercises.length>200)throw Error('Há um treino inválido no arquivo da Academia.');
    ids.add(w.id);
    for(const e of w.exercises){
      if(!shape(e,['id','name','sets','reps','rest','load','description','thumbnail'])||!id(e.id)||ids.has(e.id)||!text(e.name,200)||!hasVisibleText(e.name)||!['sets','reps','rest','load'].every(k=>text(e[k],100))||!text(e.description,10000)||!text(e.thumbnail,2000)||(e.thumbnail&&!safeURL(e.thumbnail)))throw Error('Há um exercício inválido no arquivo da Academia.');
      ids.add(e.id);
    }
  }
  const dates=Object.entries(s.sessions);if(dates.length>10000)throw Error('O histórico da Academia excede o limite.');
  for(const [date,entries] of dates){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!object(entries)||Object.keys(entries).length>10000||Object.entries(entries).some(([key,v])=>!id(key)||v!==true))throw Error('Há uma marcação inválida no histórico da Academia.');}
  return s;
}
export class GymRepository{
  constructor(storage,target=globalThis){this.storage=storage;this.target=target;this.raw=null;}
  load(){let raw;this.raw=null;try{raw=this.storage.getItem(GYM_KEY)}catch{throw Error('Não foi possível acessar os treinos neste navegador.');}this.raw=raw;try{return raw===null?initialGym():migrateGym(JSON.parse(raw))}catch{throw Error('Os dados da Academia precisam de recuperação. Baixe uma cópia antes de restaurar um backup.');}}
  async commit(operation,{expected,expectedRaw,expectedPreferences,replace}={}){
    const run=()=>{
      if(expectedRaw!==undefined&&this.storage.getItem(GYM_KEY)!==expectedRaw)throw Error('A Academia mudou em outra janela. Reabra a restauração para preservar as alterações.');
      const current=replace?null:this.load();
      if(expected&&JSON.stringify(current.workouts.find(w=>w.id===expected.id))!==expected.value)throw Error('Este treino mudou em outra janela. Feche e reabra o formulário para usar a versão atual.');
      if(expectedPreferences&&JSON.stringify(current.preferences)!==expectedPreferences)throw Error('A personalização mudou em outra janela. Reabra o painel para conferir a versão atual.');
      const next=replace?structuredClone(migrateGym(replace)):current;if(!replace)operation(next);validateGym(next);
      const raw=JSON.stringify(next);try{this.storage.setItem(GYM_KEY,raw);if(this.storage.getItem(GYM_KEY)!==raw)throw Error();}catch{throw Error('Não foi possível salvar a Academia neste aparelho. Seu formulário foi preservado.');}this.raw=raw;return next;
    };
    if(this.target.navigator?.locks){const result=await this.target.navigator.locks.request(GYM_KEY,()=>{try{return {value:run()}}catch(error){return {error}}});if(result.error)throw result.error;return result.value}return run();
  }
}
export function moveGymEntry(list,id,delta){const i=list.findIndex(e=>e.id===id),j=i+delta;if(i<0||![-1,1].includes(delta)||j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];}
