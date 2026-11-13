import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough,Writable} from 'node:stream';
import {stripVTControlCharacters} from 'node:util';
import {readAgendaCredentials,agendaArguments,deployAgenda} from '../server/calendar-deployment.mjs';
const clientId='12345-public.apps.googleusercontent.com',secret='fictitious_terminal_secret';
function terminal(){const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};let transcript='';const output=new Writable({write(chunk,encoding,done){transcript+=chunk.toString();done();}});output.isTTY=true;output.columns=120;return {input,output,text:()=>stripVTControlCharacters(transcript),visible:()=>{const clear=transcript.lastIndexOf('\x1b[0J');return stripVTControlCharacters(transcript.slice(clear<0?0:clear+4));}};}
test('terminal mantém ID visível e aguarda cada resposta sem exibir o segredo',async()=>{
 const t=terminal(),job=readAgendaCredentials(t);assert.match(t.visible(),/ID do cliente OAuth Web do Google/);t.input.write(clientId+'\r');assert.match(t.visible(),/Segredo desse cliente/);const before=t.text();t.input.write(secret);assert.equal(t.text(),before);t.input.write('\r');assert.deepEqual(await job,{clientId,clientSecret:secret});assert.ok(!t.text().includes(secret));assert.equal(t.input.listenerCount('error'),0);
});
test('colar as duas respostas com CRLF no mesmo envio preserva a ordem e oculta o segredo',async()=>{
 const t=terminal(),job=readAgendaCredentials(t);t.input.write(clientId+'\r\n'+secret+'\r\n');assert.deepEqual(await job,{clientId,clientSecret:secret});assert.ok(!t.text().includes(secret));
});
test('ID vazio ou incompleto não avança para o segredo nem encerra o script',async()=>{
 const t=terminal(),job=readAgendaCredentials(t);t.input.write('\r\n');assert.match(t.text(),/ID inválido/);assert.match(t.visible(),/ID do cliente/);assert.ok(!t.text().includes('Segredo desse cliente'));t.input.write('incompleto\r');assert.match(t.visible(),/ID do cliente/);t.input.write(clientId+'\r'+secret+'\r');assert.deepEqual(await job,{clientId,clientSecret:secret});
});
test('ID informado no comando pede somente segredo e repete entrada vazia ou trocada',async()=>{
 const t=terminal(),job=readAgendaCredentials({...t,clientId});assert.match(t.visible(),/Segredo desse cliente/);assert.ok(!t.text().includes('ID do cliente OAuth'));t.input.write('\r');assert.match(t.text(),/Segredo inválido/);t.input.write(clientId+'\r');assert.match(t.visible(),/Segredo desse cliente/);assert.ok(!t.text().includes(clientId));t.input.write(secret+'\r');assert.deepEqual(await job,{clientId,clientSecret:secret});assert.ok(!t.text().includes(secret));
});
test('cancelar com Ctrl+C rejeita a leitura e limpa a entrada sem expor credencial parcial',async()=>{
 const t=terminal(),job=readAgendaCredentials({...t,clientId}),rejected=assert.rejects(job,/cancelada/);t.input.write('partial_secret');t.input.write('\x03');await rejected;assert.ok(!t.text().includes('partial_secret'));assert.equal(t.input.listenerCount('error'),0);
});
test('fechar a entrada termina com erro claro em vez de publicar credenciais vazias',async()=>{
 const t=terminal(),job=readAgendaCredentials(t),rejected=assert.rejects(job,/entrada foi encerrada/);t.input.end();await rejected;
});
test('argumento aceita ID público e rejeita segredo ou parâmetros adicionais sem repeti-los no erro',()=>{
 assert.deepEqual(agendaArguments([]),{});assert.deepEqual(agendaArguments(['--client-id',clientId]),{clientId});assert.deepEqual(agendaArguments(['--client-id='+clientId]),{clientId});for(const args of [['--client-secret',secret],['--client-id',clientId,secret],['--client-id','incompleto']])assert.throws(()=>agendaArguments(args),e=>/Use agenda:deploy/.test(e.message)&&!e.message.includes(secret));
});
test('ID inválido definido previamente não abre uma solicitação de segredo',async()=>{
 const t=terminal();await assert.rejects(readAgendaCredentials({...t,clientId:'wrong'}),/ID público Google válido/);assert.equal(t.text(),'');
});
test('ID colado como segredo é recusado antes de qualquer operação Cloudflare',async()=>{
 let calls=0;await assert.rejects(deployAgenda({authenticated:true,clientId,clientSecret:clientId,run:()=>calls++}),/Informe o ID e o segredo/);assert.equal(calls,0);
});
