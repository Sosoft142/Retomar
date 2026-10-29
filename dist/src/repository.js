import {initialState,validateState,migrateState} from './domain.js';
export const DATA_KEY='entrelinhas-vida:data:v1';
export const UI_KEY='entrelinhas-vida:ui:v1';
export const DEVICE_KEY='entrelinhas-vida:device:v1';
function storageFailure(message){const error=new Error(message);error.code='LOCAL_STORAGE_FAILED';return error;}
export class Repository{
  constructor(storage){this.storage=storage;this.last=null;this.blocked=false;this.raw=''}
  load(){let raw;try{raw=this.storage.getItem(DATA_KEY)}catch{throw storageFailure('Não foi possível acessar os dados deste navegador. Confira as permissões de armazenamento.')}if(raw===null)return this.last ||= initialState();try{const parsed=migrateState(JSON.parse(raw));this.last=parsed;this.blocked=false;return parsed}catch(e){this.blocked=true;this.raw=raw;throw Error('Os dados locais precisam de recuperação. '+e.message)}}
  async commit(operation,{replace=null,skipUnchanged=false}={}){
    const run=()=>{
      if(this.blocked&&!replace)throw Error('Recupere os dados antes de continuar.');
      let previousRaw;try{previousRaw=this.storage.getItem(DATA_KEY)}catch{throw storageFailure('Não foi possível acessar os dados deste navegador. Seu formulário foi preservado.')}let base;
      if(replace)base=structuredClone(migrateState(replace));
      else{base=previousRaw===null?structuredClone(this.last||initialState()):structuredClone(migrateState(JSON.parse(previousRaw)))}
      const before=JSON.stringify(base);if(!replace)operation(base);validateState(base);
      // Uma conferência remota sem alterações não deve disparar eventos entre abas.
      if(skipUnchanged&&previousRaw===before&&JSON.stringify(base)===before){this.last=base;return base}
      base.updatedAt=new Date().toISOString();const raw=JSON.stringify(base);
      try{this.storage.setItem(DATA_KEY,raw);if(this.storage.getItem(DATA_KEY)!==raw)throw Error()}catch{throw storageFailure('Não foi possível salvar neste aparelho. Seu formulário foi preservado; tente novamente ou exporte uma cópia dos dados.')}
      this.blocked=false;this.raw='';this.last=base;return base;
    };
    if(globalThis.navigator?.locks){const result=await navigator.locks.request(DATA_KEY,()=>{try{return {value:run()}}catch(error){return {error}}});if(result.error)throw result.error;return result.value}return run();
  }
}
