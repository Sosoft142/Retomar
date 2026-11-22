import test from 'node:test';
import assert from 'node:assert/strict';
import {initialGym,validateGym,GymRepository,GYM_KEY,gymDate,moveGymEntry} from '../dist/src/gym.js';
import {descriptionLinks,videoInfo,createGymMedia} from '../dist/src/gym-media.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}};
test('roteiro original conserva os quatro treinos, séries, vídeos e caminhada',()=>{
  const s=validateGym(initialGym());assert.deepEqual(s.workouts.map(w=>w.name),['Pernas A','Superiores','Pernas B','Pernas C']);assert.deepEqual(s.workouts.map(w=>w.exercises.length),[4,4,5,4]);
  assert.equal(s.workouts[0].exercises[0].sets,'2');assert.equal(s.workouts[0].exercises[2].sets,'1');assert.equal(s.workouts[3].cardio,'20–25 min');
  for(const w of s.workouts)for(const e of w.exercises)assert.equal(descriptionLinks(e.description).map(videoInfo).filter(Boolean).length,1);
  s.workouts[0].exercises[0].name='Editado';assert.notEqual(initialGym().workouts[0].exercises[0].name,'Editado');
});
test('salvamento e reordenação da Academia preservam o Planejamento e outras janelas',async()=>{
  const storage=memory();storage.setItem('entrelinhas-vida:data:v1','planejamento intacto');const a=new GymRepository(storage),b=new GymRepository(storage);
  const before=a.load().workouts[0];await b.commit(s=>{s.workouts[1].day='Sábado'});
  await a.commit(s=>{s.workouts[0].name='A personalizado';moveGymEntry(s.workouts[0].exercises,'segunda-curl',-1)},{expected:{id:before.id,value:JSON.stringify(before)}});
  const saved=b.load();assert.equal(saved.workouts[1].day,'Sábado');assert.equal(saved.workouts[0].name,'A personalizado');assert.equal(saved.workouts[0].exercises[1].id,'segunda-curl');assert.equal(storage.getItem('entrelinhas-vida:data:v1'),'planejamento intacto');
  await assert.rejects(a.commit(s=>s.workouts[0].name='Antigo',{expected:{id:before.id,value:JSON.stringify(before)}}),/outra janela/);
});
test('marcação é por data e sobrevive à recarga sem propagar conclusão para outros treinos',async()=>{
  const storage=memory(),repo=new GymRepository(storage);await repo.commit(s=>s.sessions['2026-11-21']={'segunda-hip':true});
  const next=new GymRepository(storage).load();assert.equal(next.sessions['2026-11-21']['segunda-hip'],true);assert.equal(next.sessions['2026-11-22'],undefined);assert.equal(next.sessions['2026-11-21']['quarta-hip'],undefined);assert.equal(gymDate(new Date(2026,10,21,23,59)),'2026-11-21');
});
test('dados corrompidos e falhas de armazenamento não são substituídos por padrão',async()=>{
  const storage=memory(),repo=new GymRepository(storage);storage.setItem(GYM_KEY,'original corrompido');assert.throws(()=>repo.load(),/recuperação/);await assert.rejects(repo.commit(()=>{}),/recuperação/);assert.equal(storage.getItem(GYM_KEY),'original corrompido');
  const unavailable=new GymRepository({getItem:()=>null,setItem:()=>{throw Error('Quota')}});await assert.rejects(unavailable.commit(s=>s.workouts[0].name='novo'),/preservado/);
});
test('backup recusa IDs duplicados, URL executável, datas inexistentes e estrutura inesperada',()=>{
  for(const mutate of [s=>s.workouts[0].exercises.push(structuredClone(s.workouts[0].exercises[0])),s=>s.workouts[0].exercises[0].thumbnail='javascript:alert(1)',s=>s.sessions['2026-02-30']={},s=>s.unexpected=true]){const s=initialGym();mutate(s);assert.throws(()=>validateGym(s))}
});
test('restauração recupera dados corrompidos e recusa uma cópia atual que mudou',async()=>{
  const storage=memory(),repo=new GymRepository(storage);storage.setItem(GYM_KEY,'corrompido');const candidate=initialGym();candidate.workouts[0].name='Backup escolhido';
  await repo.commit(()=>{},{replace:candidate,expectedRaw:'corrompido'});assert.equal(repo.load().workouts[0].name,'Backup escolhido');
  await assert.rejects(repo.commit(()=>{},{replace:initialGym(),expectedRaw:'corrompido'}),/mudou/);assert.equal(repo.load().workouts[0].name,'Backup escolhido');
});
test('links reconhecem YouTube, Shorts, embed e Vimeo sem aceitar domínios falsos',()=>{
  for(const url of ['https://youtu.be/lltSvOW-wfI?t=2','https://www.youtube.com/shorts/lltSvOW-wfI','https://www.youtube.com/embed/lltSvOW-wfI','https://m.youtube.com/watch?v=lltSvOW-wfI'])assert.equal(videoInfo(url).id,'lltSvOW-wfI');
  for(const url of ['https://vimeo.com/1098109686','https://player.vimeo.com/video/1098109686','https://vimeo.com/1098109686/unlistedHash'])assert.equal(videoInfo(url).provider,'Vimeo');
  for(const url of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=lltSvOW-wfI','https://youtu.be/invalid','https://user:secret@vimeo.com/123'])assert.equal(videoInfo(url),null);
  assert.deepEqual(descriptionLinks('Veja https://youtu.be/lltSvOW-wfI.\nhttps://youtu.be/lltSvOW-wfI'),['https://youtu.be/lltSvOW-wfI']);
});
test('links entre parênteses, colchetes ou em Markdown geram miniaturas válidas',()=>{
  for(const description of ['Veja (https://youtu.be/lltSvOW-wfI).','[Demonstração](https://youtu.be/lltSvOW-wfI)','Vídeo [https://youtu.be/lltSvOW-wfI].'])assert.equal(videoInfo(descriptionLinks(description)[0]).id,'lltSvOW-wfI');
  assert.equal(videoInfo(descriptionLinks('[Vídeo](https://vimeo.com/1098109686).')[0]).id,'1098109686');
  assert.equal(descriptionLinks('Fonte https://example.org/exercise_(machine).')[0],'https://example.org/exercise_(machine)');
});
test('backup recusa nomes compostos apenas por caracteres invisíveis',()=>{
  for(const kind of ['workout','exercise']){const s=initialGym();(kind==='workout'?s.workouts[0]:s.workouts[0].exercises[0]).name='\u200b';assert.throws(()=>validateGym(s))}
});
test('erro síncrono na rede permite tentar carregar a miniatura novamente',async()=>{
  let calls=0;const media=createGymMedia({fetcher:()=>{if(++calls===1)throw Error('indisponível');return Promise.resolve({ok:true,json:async()=>({thumbnail_url:'https://i.vimeocdn.com/video/123.jpg'})})}}),info=videoInfo('https://vimeo.com/123');
  assert.equal(await media.thumbnail(info),'');assert.equal(await media.thumbnail(info),'https://i.vimeocdn.com/video/123.jpg');assert.equal(calls,2);
});
test('Vimeo usa só metadados de imagem, conserva URL não listada e permite nova tentativa após falha',async()=>{
  let calls=0;const info=videoInfo('https://vimeo.com/1098109686/unlistedHash'),media=createGymMedia({fetcher:async url=>{calls++;assert.ok(url.includes('unlistedHash'));if(calls===1)throw Error('offline');return {ok:true,json:async()=>({thumbnail_url:'https://i.vimeocdn.com/video/123_640.jpg',html:'<script>ignored</script>'})}}});
  assert.equal(await media.thumbnail(info),'');assert.equal(await media.thumbnail(info),'https://i.vimeocdn.com/video/123_640.jpg');assert.equal(await media.thumbnail(info),'https://i.vimeocdn.com/video/123_640.jpg');assert.equal(calls,2);
  const unsafe=createGymMedia({fetcher:async()=>({ok:true,json:async()=>({thumbnail_url:'https://untrusted.example/a.jpg'})})});assert.equal(await unsafe.thumbnail(info),'');
});
