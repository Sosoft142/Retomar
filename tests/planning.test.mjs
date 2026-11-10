import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,activeAreas,updateItem,deleteItem,validateState,visibleItems,selectItems,groupItems} from '../dist/src/domain.js';
import {PLANNING_KEY,defaults,validatePreferences,PlanningPreferences,migratePlanningPreferences,validZone,zonedInstant,addDays,dateInZone,createDeadlineContext,dueReminders,postpone,reminderDate} from '../dist/src/planning.js';
const now=new Date('2026-10-30T15:00:00Z'),clone=structuredClone;
const prefs=()=>{const p=defaults();p.timeZone='America/Sao_Paulo';return p};
function add(s,id,fields={}){return updateItem(s,id,{title:'Fictício '+id,notes:'',areaId:activeAreas(s)[0].id,status:'pending',priority:'normal',date:'',time:'',...fields},'qa')}
function fixture(){const s=initialState();add(s,'parent',{date:'2026-11-06'});add(s,'child',{parentId:'parent',date:'2026-10-30',time:'13:00',priority:'urgent'});add(s,'late',{date:'2026-10-29',priority:'high'});add(s,'past-hour',{date:'2026-10-30',time:'08:00'});add(s,'date-only',{date:'2026-10-30',priority:'low'});add(s,'tomorrow',{date:'2026-10-31'});add(s,'far',{date:'2026-11-10',priority:'urgent'});add(s,'undated');add(s,'done',{parentId:'parent',date:'2026-10-30',status:'done'});return s}
function storage(raw=null){let value=raw;return {getItem:key=>key===PLANNING_KEY?value:null,setItem:(key,next)=>{value=next},raw:()=>value}}
test('preferências removem a agenda e preservam os lembretes',()=>{const p=prefs();validatePreferences(p);assert.equal(p.version,3);assert.ok(!('calendar' in p));assert.equal(p.reminders.enabled,true)});
test('avisos consideram os prazos próprios dos subitens, mesmo quando o prazo do pai está distante',()=>{const s=fixture(),ids=dueReminders(s,prefs(),now).map(x=>x.item.id);assert.ok(ids.includes('child'));for(const id of ['parent','undated','done','far'])assert.ok(!ids.includes(id));assert.equal(ids[0],'late');assert.equal(ids[1],'past-hour')});
test('concluir ou excluir uma etapa remove seu aviso; pai concluído conserva avisos das etapas abertas',()=>{const s=fixture();updateItem(s,'parent',{status:'done'},'qa');assert.ok(dueReminders(s,prefs(),now).some(x=>x.item.id==='child'));updateItem(s,'child',{status:'canceled'},'qa');deleteItem(s,'late','qa');assert.ok(dueReminders(s,prefs(),now).every(x=>!['parent','child','late'].includes(x.item.id)))});
test('data do pai não é herdada por subitem sem data nos lembretes',()=>{const s=initialState();add(s,'parent',{date:'2026-10-30'});add(s,'child',{parentId:'parent'});assert.deepEqual(dueReminders(s,prefs(),now).map(x=>x.item.id),['parent'])});
test('data e horário precedem prioridade; prioridade desempata o mesmo prazo',()=>{const s=initialState();add(s,'low',{date:'2026-10-30',time:'13:00',priority:'low'});add(s,'urgent',{date:'2026-10-31',time:'01:00',priority:'urgent'});add(s,'normal',{date:'2026-10-30',time:'14:00'});add(s,'tie-low',{date:'2026-10-30',time:'14:00',priority:'low'});add(s,'tie-high',{date:'2026-10-30',time:'14:00',priority:'high'});assert.deepEqual(dueReminders(s,prefs(),now).map(x=>x.item.id),['low','tie-high','normal','tie-low','urgent'])});
test('sem horário só fica atrasado após virar o dia, enquanto horário vencido hoje já fica atrasado',()=>{const list=dueReminders(fixture(),prefs(),now);assert.equal(list.find(x=>x.item.id==='date-only').overdue,false);assert.equal(list.find(x=>x.item.id==='past-hour').overdue,true);assert.equal(list.find(x=>x.item.id==='child').overdue,false);const atEnd=new Date('2026-10-31T02:59:59.999Z');assert.equal(dueReminders(fixture(),prefs(),atEnd).find(x=>x.item.id==='date-only').overdue,false);assert.equal(dueReminders(fixture(),prefs(),new Date(+atEnd+1)).find(x=>x.item.id==='date-only').overdue,true)});
test('antecedência e inclusão de atrasados são configuráveis, incluindo somente hoje',()=>{const p=prefs();p.reminders.aheadDays=0;p.reminders.overdue=false;assert.deepEqual(dueReminders(fixture(),p,now).map(x=>x.item.id),['child','date-only']);p.reminders.enabled=false;assert.deepEqual(dueReminders(fixture(),p,now),[])});
test('virada do dia usa o fuso configurado, inclusive quando o aparelho está em outro fuso',()=>{const instant=new Date('2026-10-31T01:00:00Z');assert.equal(dateInZone(instant,'UTC'),'2026-10-31');assert.equal(dateInZone(instant,'America/Sao_Paulo'),'2026-10-30');const p=prefs();p.reminders.aheadDays=0;p.reminders.overdue=false;assert.ok(!dueReminders(fixture(),p,instant).some(x=>x.item.id==='tomorrow'));p.timeZone='UTC';assert.ok(dueReminders(fixture(),p,instant).some(x=>x.item.id==='tomorrow'))});
test('horários de verão inexistentes são recusados e horários ambíguos escolhem a primeira ocorrência',()=>{assert.throws(()=>zonedInstant('2026-03-08','02:30','America/New_York'),/não existe/);assert.equal(new Date(zonedInstant('2026-11-01','01:30','America/New_York')).toISOString(),'2026-11-01T05:30:00.000Z');assert.equal(new Date(zonedInstant('2026-10-30','13:00','America/Sao_Paulo')).toISOString(),'2026-10-30T16:00:00.000Z')});
test('lembretes com horário inexistente continuam visíveis para correção, inclusive se compartilham o prazo',()=>{const s=initialState();add(s,'a',{date:'2026-03-08',time:'02:30'});add(s,'b',{date:'2026-03-08',time:'02:30'});const p=prefs();p.timeZone='America/New_York';const list=dueReminders(s,p,new Date('2026-03-08T05:00Z'));assert.equal(list.length,2);assert.ok(list.every(x=>x.invalidTime));assert.match(reminderDate(list[0],new Date('2026-03-08T05:00Z'),p.timeZone),/confira o fuso/)});
test('adiar oculta apenas o aviso e reaparece no prazo ou quando o item é editado',()=>{const s=fixture(),before=JSON.stringify(s),p=postpone(prefs(),s.items.child,now);assert.ok(!dueReminders(s,p,now).some(x=>x.item.id==='child'));assert.ok(dueReminders(s,p,new Date(+now+3600000)).some(x=>x.item.id==='child'));assert.equal(JSON.stringify(s),before);updateItem(s,'child',{priority:'high'},'qa');assert.ok(dueReminders(s,p,now).some(x=>x.item.id==='child'))});
test('dispensar hoje retorna no próximo dia sem concluir ou apagar a tarefa',()=>{const s=fixture(),p=postpone(prefs(),s.items.child,now,true);assert.equal(p.dismissals.child.until,Date.parse('2026-10-31T03:00:00Z'));assert.ok(!dueReminders(s,p,now).some(x=>x.item.id==='child'));assert.ok(dueReminders(s,p,new Date('2026-10-31T03:00:00Z')).some(x=>x.item.id==='child'));assert.equal(s.items.child.status,'pending');validateState(s)});
test('preferências e adiamentos persistem e são relidos sem tokens de autorização',()=>{const disk=storage(),store=new PlanningPreferences(disk),p=postpone(prefs(),fixture().items.child,now);store.save(p);assert.deepEqual(new PlanningPreferences(disk).value,p);assert.ok(!disk.raw().includes('access_token'));const changed=clone(p);changed.reminders.aheadDays=7;disk.setItem(PLANNING_KEY,JSON.stringify(changed));store.reload();assert.equal(store.value.reminders.aheadDays,7)});
test('preferências corrompidas são sinalizadas e os bytes originais ficam preservados até salvar',()=>{const disk=storage('{quebrado'),store=new PlanningPreferences(disk);assert.ok(store.error);assert.equal(disk.raw(),'{quebrado');validatePreferences(store.value);store.save(prefs());assert.equal(store.error,'')});
test('falha de gravação não substitui a última preferência confirmada em memória',()=>{const disk=storage(),store=new PlanningPreferences(disk);store.save(prefs());const before=disk.raw(),value=clone(store.value);disk.setItem=()=>{throw Error('quota')};const changed=clone(value);changed.reminders.enabled=false;assert.throws(()=>store.save(changed),/salvar/);assert.deepEqual(store.value,value);assert.equal(disk.raw(),before)});
test('opções inválidas e campos aposentados são recusados',()=>{for(const change of [p=>p.reminders.aheadDays=-1,p=>p.reminders.snoozeMinutes=0,p=>p.timeZone='Fuso/Inventado',p=>p.calendar={}]){const p=prefs();change(p);assert.throws(()=>validatePreferences(p))}});
test('rótulos distinguem hoje, amanhã e datas com ano, mantendo o horário completo',()=>{const s=fixture(),p=prefs(),list=dueReminders(s,p,now);assert.match(reminderDate(list.find(x=>x.item.id==='child'),now,p.timeZone),/^Hoje às 13:00/);assert.match(reminderDate(list.find(x=>x.item.id==='tomorrow'),now,p.timeZone),/^Amanhã · sem horário/);assert.match(reminderDate(list[0],now,p.timeZone),/^Atrasado/)});

test('dispensar hoje respeita a virada do dia quando a meia-noite não existe no fuso',()=>{
 const p=prefs();p.timeZone='America/Santiago';const s=fixture(),instant=new Date('2026-09-05T15:00:00Z');const next=postpone(p,s.items.child,instant,true);assert.equal(next.dismissals.child.until,Date.parse('2026-09-06T04:00:00Z'));
});
test('mudar o fuso reconsidera avisos adiados para outro prazo absoluto',()=>{
 const s=fixture(),p=postpone(prefs(),s.items.child,now);assert.ok(!dueReminders(s,p,now).some(x=>x.item.id==='child'));p.timeZone='UTC';assert.ok(dueReminders(s,p,now).some(x=>x.item.id==='child'));
});


for(const version of [1,2])test('migração da agenda v'+version+' preserva fuso, lembretes e adiamentos e apaga credenciais',()=>{
 const p=postpone(prefs(),fixture().items.child,now),old={version,calendar:{timeZone:p.timeZone,clientId:'old-secret'},reminders:p.reminders,dismissals:p.dismissals};
 const disk=storage(JSON.stringify(old)),store=new PlanningPreferences(disk);assert.equal(store.error,'');assert.deepEqual(store.value,p);assert.ok(!disk.raw().includes('calendar'));assert.ok(!disk.raw().includes('old-secret'));
});
test('falha de persistência da migração mantém os bytes e usa preferências sem agenda na sessão',()=>{
 const old={version:2,calendar:{timeZone:'America/Sao_Paulo'},reminders:prefs().reminders,dismissals:{}},raw=JSON.stringify(old),disk=storage(raw);disk.setItem=()=>{throw Error('quota')};const store=new PlanningPreferences(disk);assert.equal(store.value.version,3);assert.ok(!store.value.calendar);assert.equal(disk.raw(),raw);assert.ok(store.error);
});

test('filtro, agrupamento e lembretes concordam sobre horários vencidos hoje, sem data e encerrados',()=>{
 const s=fixture();add(s,'canceled',{date:'2026-10-29',time:'08:00',status:'canceled'});
 const clock=createDeadlineContext(now,prefs().timeZone),isOverdue=t=>clock.forItem(t).overdue,items=visibleItems(s);
 const filtered=selectItems(items,{scope:'overdue',today:clock.today,isOverdue}).map(t=>t.id).sort();
 const grouped=groupItems(items,clock.today,isOverdue).overdue.map(t=>t.id).sort();
 const reminders=dueReminders(s,prefs(),now).filter(x=>x.overdue).map(x=>x.item.id).sort();
 assert.deepEqual(filtered,['late','past-hour']);assert.deepEqual(grouped,filtered);assert.deepEqual(reminders,filtered);
 assert.equal(clock.forItem(s.items.undated).deadline,null);
});
test('um prazo só vence depois do instante exato e o cálculo compartilhado não confunde status',()=>{
 const s=initialState();add(s,'open',{date:'2026-10-30',time:'12:00'});add(s,'done',{date:'2026-10-30',time:'12:00',status:'done'});add(s,'canceled',{date:'2026-10-30',time:'12:00',status:'canceled'});
 const exact=createDeadlineContext(now,'America/Sao_Paulo');assert.equal(exact.forItem(s.items.open).overdue,false);
 const after=createDeadlineContext(new Date(+now+1),'America/Sao_Paulo');
 assert.equal(after.forItem(s.items.done).overdue,false);assert.equal(after.forItem(s.items.open).overdue,true);assert.equal(after.forItem(s.items.canceled).overdue,false);
 updateItem(s,'open',{status:'done'},'qa');assert.equal(after.forItem(s.items.open).overdue,false);
});
test('sem horário vence na virada do dia do fuso escolhido, inclusive para os filtros',()=>{
 const s=initialState();add(s,'date-only',{date:'2026-10-30'});
 for(const [instant,expected] of [['2026-10-31T02:59:59.999Z',false],['2026-10-31T03:00:00Z',true]]){
  const clock=createDeadlineContext(new Date(instant),'America/Sao_Paulo'),isOverdue=t=>clock.forItem(t).overdue;
  assert.equal(isOverdue(s.items['date-only']),expected);
  assert.equal(selectItems(visibleItems(s),{scope:'overdue',today:clock.today,isOverdue}).length,expected?1:0);
 }
 const instant=new Date('2026-10-31T01:00Z'),local=createDeadlineContext(instant,'America/Sao_Paulo'),utc=createDeadlineContext(instant,'UTC');
 assert.equal(local.today,'2026-10-30');assert.equal(utc.today,'2026-10-31');
 assert.equal(local.forItem(s.items['date-only']).overdue,false);assert.equal(utc.forItem(s.items['date-only']).overdue,true);
});
test('horário inexistente usa a mesma sinalização e classificação na lista e nos lembretes',()=>{
 const s=initialState();add(s,'dst',{date:'2026-03-08',time:'02:30'});const p=prefs();p.timeZone='America/New_York';
 const instant=new Date('2026-03-08T12:00Z'),clock=createDeadlineContext(instant,p.timeZone),entry=dueReminders(s,p,instant)[0];
 assert.equal(clock.forItem(s.items.dst).invalidTime,true);assert.equal(clock.forItem(s.items.dst).overdue,entry.overdue);assert.equal(clock.forItem(s.items.dst).deadline,entry.deadline);
});
