import {comparable,mergeStates,mergeLocal} from './merge.js';
import {sealState,unsealState} from './crypto.js';
export class SyncEngine{
  constructor({repo,adapter,secret,gistId,isEditing=()=>false,isOnline=()=>true,onState=()=>{},onApply=()=>{},onConfirmed=()=>{},seal=sealState,unseal=unsealState,lock=null,rewriteRemote=false,verifyUnseal=null}){Object.assign(this,{repo,adapter,secret,gistId,isEditing,isOnline,onState,onApply,onConfirmed,seal,unseal,lock,rewriteRemote,verifyUnseal});this.active=true;this.busy=false;this.queued=false;this.timer=null;this.failures=0;this.halted=false;this.controller=new AbortController();this.status={kind:'pending',message:'Aguardando a primeira conferência.'}}
  emit(kind,message){if(!this.active)return;this.status={kind,message};this.onState(this.status)}
  stop(){this.active=false;clearTimeout(this.timer);this.controller.abort();this.secret='';this.adapter.token=''}
  changed(){this.queued=true;if(this.halted)return;if(!this.busy)this.emit('pending','Alterações salvas neste aparelho; envio pendente.');this.schedule(1200)}
  schedule(delay=1200){if(!this.active||this.halted)return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.run(),delay)}
  async run({manual=false}={}){
    if(!this.active)return;if(manual){this.halted=false;this.failures=0}if(this.halted)return;
    if(this.busy){this.queued=true;return this.running}
    clearTimeout(this.timer);
    if(!this.isOnline()){this.emit('pending','Sem conexão. O envio será retomado quando a internet voltar.');return}
    if(this.isEditing()){this.emit('pending','A sincronização continuará ao fechar o formulário.');return}
    this.busy=true;this.queued=false;this.emit('syncing','Conferindo e combinando as alterações.');
    this.running=(async()=>{
      let failed=false;
      try{if(this.lock)await this.lock(async acquired=>{if(!acquired){this.emit('pending','Outra aba está sincronizando.');this.schedule(3500);return}await this.round()});else await this.round();this.failures=0}
      catch(e){failed=true;if(!this.active)return;if(e.name==='AbortError')return;this.emit('error',e.message||'A sincronização falhou. Os dados locais foram mantidos.');this.failures++;if(e.retryable&&this.failures<=3)this.schedule(Math.max(e.delay||0,[0,2000,7000,20000][this.failures]));else this.halted=true}
      finally{this.busy=false;if(this.active&&this.queued&&!this.halted&&!failed)this.schedule()}
    })();return this.running;
  }
  ensure(){if(!this.active||this.controller.signal.aborted)throw new DOMException('Cancelado','AbortError')}
  defer(){if(this.isEditing()){this.emit('pending','A sincronização continuará ao fechar o formulário.');return true}return false}
  async round(){
    let carry=null;
    for(let pass=0;pass<3;pass++){
      this.ensure();if(this.defer())return;
      const remote=await this.unseal(await this.adapter.read(this.gistId,this.controller.signal),this.secret);this.ensure();
      carry=carry?mergeStates(carry,remote):remote;
      const local=this.repo.load(),localBefore=comparable(local),merged=mergeLocal(local,carry);
      if(this.defer())return;
      if(this.rewriteRemote||comparable(merged)!==comparable(remote)){
        const encrypted=await this.seal(merged,this.secret);this.ensure();if(this.defer())return;
        // Criptografar é assíncrono: uma edição feita nesse intervalo exige nova combinação.
        if(comparable(this.repo.load())!==localBefore){carry=merged;continue}
        await this.adapter.write(this.gistId,encrypted,this.controller.signal);this.ensure();
      }
      const verified=await (this.verifyUnseal||this.unseal)(await this.adapter.read(this.gistId,this.controller.signal),this.secret);this.ensure();carry=mergeStates(merged,verified);
      if(comparable(carry)!==comparable(verified))continue;
      if(this.defer())return;
      let deferred=false,applied=false;
      const saved=await this.repo.commit(s=>{this.ensure();if(this.isEditing()){deferred=true;throw Error('edição em andamento')}const next=mergeLocal(s,verified);if(comparable(s)!==comparable(next)){Object.assign(s,next);applied=true}},{skipUnchanged:true}).catch(e=>{if(deferred)return null;throw e});
      this.ensure();if(deferred){this.defer();return}if(applied)this.onApply(saved);
      if(comparable(saved)!==comparable(verified)){this.emit('pending','Há uma nova alteração local aguardando envio.');this.queued=true;return}
      this.queued=false;this.rewriteRemote=false;const confirmedAt=new Date().toISOString();this.onConfirmed({gistId:this.gistId,confirmedAt});this.emit('confirmed','A cópia deste aparelho foi conferida no GitHub.');return;
    }
    this.emit('pending','Foram encontradas alterações durante a conferência. Uma nova rodada será feita.');this.queued=true;
  }
}
