import {dateInZone} from './planning.js';

export const DAY_KEY='entrelinhas-vida:day:v1';
const retiredKeys=['entrelinhas-vida:google-calendar:v1','entrelinhas-vida:agenda-pairing:v1'];
export const dayToday=zone=>dateInZone(new Date(),zone);

export class DayPreferences{
  constructor(storage){
    this.storage=storage;this.value={enabled:true};this.error='';
    try{
      const raw=storage.getItem(DAY_KEY),legacy=raw===null?storage.getItem(retiredKeys[0]):null;
      const saved=JSON.parse(raw??legacy??'null');
      if(typeof saved?.enabled==='boolean')this.value.enabled=saved.enabled;
      if(raw===null&&legacy!==null)storage.setItem(DAY_KEY,JSON.stringify(this.value));
    }catch{this.error='Não foi possível ler a preferência de Meu dia. Suas tarefas estão preservadas.';}
    // A limpeza não lê credenciais nem toca em tarefas, backups ou preferências push.
    for(const key of retiredKeys)try{storage.removeItem?.(key);}catch{}
  }
  save(enabled){
    const next={enabled:enabled===true},raw=JSON.stringify(next);
    try{this.storage.setItem(DAY_KEY,raw);if(this.storage.getItem(DAY_KEY)!==raw)throw Error();}catch{throw Error('Não foi possível salvar a preferência de Meu dia neste aparelho.');}
    this.value=next;this.error='';
  }
}
