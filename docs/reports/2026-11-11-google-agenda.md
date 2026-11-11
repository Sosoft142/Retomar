# Retomar 1.4 — Meu dia e consulta do Google Agenda

## Resultado

- Meu dia reúne tarefas com prazo próprio e eventos autorizados, em um dia ou sete dias. Tarefas e eventos são identificados pela origem. Datas, horários, localização, descrição escapada e link permitido para o Google são exibidos.
- A conexão é opcional, com configuração de ID público no aparelho e autorização pela titular. Google Identity Services é carregado somente após o comando de preparar conexão. A janela de autorização só abre num toque posterior em Conectar.
- São solicitadas apenas as permissões de leitura de eventos e lista de agendas. O adaptador faz somente GET, usa token no cabeçalho, não segue redirects e trata expiração, permissão, quota, timeout e paginação. Uma consulta falha não é apresentada como lista completa atualizada.
- Token e eventos ficam em memória; a configuração fica em chave separada no aparelho. Esquema 4, dados existentes, Gist, favoritas, push e identidade PWA preservados. A consulta ao Google não escreve no repositório de tarefas.
- Desconectar ou desativar cancela consultas e invalida retornos tardios. Falhas na integração não impedem o planejamento local. A opção de desativação remove Meu dia neste aparelho.

## Retorno à versão anterior

Antes de editar, foi criada a branch `backup/retomar-1.3-antes-agenda-2026-11-11`, no commit `c3897a5c61b954c0f62ba4be0d77748af939932a`, árvore `766411070bfed498b547aaa6725b6cfa5d36e668`.

O script `scripts/calendar-rollback.mjs` confere a referência e prepara restauração local apenas em checkout sem edições pendentes. Repõe a fonte 1.3, retira arquivos da integração e cria uma versão nova de cache para alcançar aparelhos atualizados. Não altera histórico remoto, não publica e não acessa dados pessoais. Teste em checkout descartável executa a restauração, confere a remoção da experiência, a versão, o domínio de tarefas idêntico à base e a preservação de arquivo pessoal fora do Git; uma edição pendente bloqueia a restauração.

## Verificação

Testes de domínio e transporte cobrem somente leitura, paginação, eventos cancelados, recorrências, dias inteiros e término exclusivo, meia-noite, fuso e horário de verão, links permitidos, permissões, expiração, cancelamento e resposta tardia. Testes integrados de DOM exercitam Meu dia sem Google, configuração inválida, conexão fictícia, escape de texto, expiração sem repetição em ciclo, desconexão com resposta pendente e desativação preservando tarefas e favoritas. A suíte anterior de ações rápidas e lotes continua em execução.

`npm run verify` deve aprovar a fonte final antes de integrar; o CI confirma o mesmo conteúdo. Os módulos novos são incluídos no cache offline.

## Pendências explícitas

Falta a configuração do cliente OAuth da titular, que não foi fornecida nem criada nesta entrega. A integração fica preparada; somente a autorização real poderá confirmar a conexão com sua conta. O [guia](../GOOGLE-AGENDA.md) contém os passos.

Nenhum navegador foi acessado, em respeito à restrição da titular. Não houve revisão visual nem teste real de login/consulta, instalação ou funcionamento no S24. A consulta offline de tarefas permanece coberta; eventos do Google dependem de conexão e autorização e não são persistidos entre sessões.
