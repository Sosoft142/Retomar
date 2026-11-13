# Consultar Google Agenda no Retomar

A visão **Meu dia** mostra tarefas e compromissos em um dia ou sete dias, em Lista ou Cartões. As tarefas são as mesmas do Planejamento: é possível criar no dia escolhido, concluir, gerenciar, alterar prazo/prioridade/andamento e desfazer diretamente aqui. A conexão é opcional e somente para leitura. As tarefas funcionam sem configurar o Google.

## Conexão entre aparelhos

Desde a versão 1.6, o ID público e a seleção de agendas acompanham o pareamento. A conexão contínua exige uma ativação única do servidor e uma autorização Google. Siga o [guia de agenda pareada](AGENDA-PAREADA.md). Sem essa ativação, os passos abaixo mantêm a conexão por sessão.

## Configuração inicial pela titular

É necessário um ID público de cliente do Google para este app. A conexão do Google Agenda no ChatGPT não fornece essa configuração ao Retomar. Não envie senha, token ou segredo de cliente pelo chat.

1. No [Google Cloud Console](https://console.cloud.google.com/), selecione ou crie um projeto e ative **Google Calendar API** na biblioteca de APIs.
2. Configure a plataforma Google Auth com o nome Retomar e seu e-mail de contato. Para uma conta pessoal, use público **Externo**. Enquanto estiver em teste, inclua seu próprio e-mail em **Usuários de teste**.
3. Em acesso a dados, configure os escopos de consulta `https://www.googleapis.com/auth/calendar.events.readonly` e `https://www.googleapis.com/auth/calendar.calendarlist.readonly`. Para reproduzir cores de rótulos personalizados, inclua também `https://www.googleapis.com/auth/calendar.calendars.readonly`, uma leitura opcional dos metadados/configurações das agendas. Sem autorizar essa opção, eventos e cores padrão continuam disponíveis.
4. Em clientes, crie um cliente OAuth do tipo **Aplicativo da Web**. Adicione a origem JavaScript **`https://sosoft142.github.io`**, sem `/Retomar/`. Este fluxo usa a janela do Google; não há segredo de cliente para colar no app.
5. Copie o **ID do cliente**, terminado em `.apps.googleusercontent.com`.
6. No Retomar, abra **Configurações → Meu dia e Google Agenda → Configurar agenda**, cole o ID público e salve.
7. Em **Meu dia**, toque em **Preparar conexão com Google**. Depois, toque em **Conectar Google Agenda**, escolha sua conta e autorize a leitura.
8. Use **Escolher agendas** para selecionar quais compromissos aparecem. A agenda principal é a seleção inicial. **Atualizar** consulta novamente o período visível.

Se o Google indicar origem incorreta, confira a origem do passo 4. Se a conta não puder autorizar um projeto em teste, confira o e-mail em Usuários de teste. Não é necessário tornar sua agenda pública. A disponibilização para outras pessoas pode exigir configuração e revisão adicionais do Google.

## Cores e ligação com o Planejamento

- A cor individual do evento tem prioridade sobre a cor padrão da agenda. A paleta é consultada no próprio Google; cores de rótulos personalizados são lidas nos metadados da agenda, quando a opção correspondente foi autorizada.
- Eventos sem cor própria usam a cor da agenda. **Atualizar** relê eventos, paleta e cores das agendas. Caso uma cor não possa ser consultada, os eventos continuam visíveis com uma indicação de que houve substituição da cor.
- Após atualizar o app, reconecte ao Google. Para rótulos personalizados, autorize também a leitura das configurações das agendas. A conexão continua somente para consulta, sem criação, alteração ou exclusão de eventos.
- Lista apresenta os dias em sequência; Cartões distribui os dias em uma grade adaptável no período de sete dias. Um dia mantém apenas a data escolhida. A escolha fica neste aparelho e não muda o formato do Planejamento.
- A busca, a área e a prioridade são compartilhadas com o Planejamento. Busca inclui eventos do Google; área, prioridade e andamento filtram apenas tarefas. O andamento de Meu dia é independente e começa em Em aberto.
- Criar pelo botão de um dia já preenche a data e a área selecionadas. Os atalhos gerais de Adicionar usam a data inicial do período. As tarefas são salvas no Retomar e acompanham o backup e a sincronização existentes.
- Concluir ou editar uma tarefa atualiza o mesmo registro usado pelo Planejamento. Desfazer fica disponível em Meu dia. Subitens mantêm seus próprios prazos; concluir o pai não conclui os filhos.
- Dias com muitos registros exibem 60 inicialmente; **Mostrar mais** acrescenta 60 sem consultar novamente a agenda. Contagens e busca usam o conteúdo completo carregado.

## Funcionamento e privacidade

- A Calendar API de eventos é chamada apenas por GET. O Retomar não cria, altera ou exclui eventos e não muda notificações do Google.
- O acesso temporário e os eventos ficam na memória. Não entram no armazenamento de tarefas, JSON de backup ou Gist. Com o servidor ativado, a autorização de renovação fica criptografada no servidor e permite restaurar o acesso ao reabrir. Sem a ativação, é necessário reconectar após fechar ou recarregar.
- No modo por sessão, Desconectar limpa a memória local. No modo contínuo, Desconectar aparelhos remove a autorização compartilhada e tenta revogá-la no Google. O resultado da revogação é informado; as permissões na conta Google também permitem removê-la.
- O ID público e as agendas selecionadas acompanham o pareamento em um arquivo criptografado separado. Ocultar Meu dia continua sendo uma preferência por aparelho. Eventos não são transformados em tarefas.
- Sem internet, as tarefas continuam disponíveis. Uma consulta já carregada pode continuar visível nesta sessão, identificada pela data da última consulta. Não há promessa de atualização em segundo plano.
- Horários seguem o fuso escolhido nos lembretes do Retomar. Eventos de dia inteiro respeitam a data final exclusiva; recorrências são expandidas pelo Google para o período solicitado.

## Voltar ao estado anterior

Para ocultar o recurso neste aparelho, desmarque **Mostrar Meu dia neste aparelho** nas opções. Isso não restaura o código antigo, mas desconecta a sessão e retira a aba.

Se a conexão contínua estiver ativa, desconecte os aparelhos ou revogue a permissão Google antes de restaurar: voltar ao código antigo não remove a autorização do servidor.

Para restaurar o app inteiro, a versão **1.3 anterior à integração** foi preservada:

- Branch: [`backup/retomar-1.3-antes-agenda-2026-11-11`](https://github.com/Sosoft142/Retomar/tree/backup/retomar-1.3-antes-agenda-2026-11-11).
- Commit: `c3897a5c61b954c0f62ba4be0d77748af939932a`.
- Árvore: `766411070bfed498b547aaa6725b6cfa5d36e668`.

A titular pode pedir no chat: **“Voltar para a versão 1.3 anterior à agenda.”** A restauração deve repor o código preservado, executar as verificações e publicar pelo fluxo normal, sem restaurar nem substituir seus dados pessoais.

Para manutenção técnica, `node scripts/calendar-rollback.mjs --check` confere a cópia preservada. Em checkout limpo, `--prepare` restaura a fonte anterior localmente e atribui um cache novo para substituir a instalação experimental. Esse comando não publica: depois são necessários `npm ci --ignore-scripts`, `npm run verify`, revisão, integração e publicação. Um teste usa um repositório descartável para exercitar a restauração real e a preservação de arquivos fora do Git.

## Fontes oficiais

- [Configuração e exemplo JavaScript](https://developers.google.com/workspace/calendar/api/quickstart/js).
- [Consentimento e usuários de teste](https://developers.google.com/workspace/guides/configure-oauth-consent).
- [Autorização e validade do acesso](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
- [Paleta de cores](https://developers.google.com/workspace/calendar/api/v3/reference/colors).
- [Rótulos personalizados](https://developers.google.com/workspace/calendar/api/guides/labels).
- [Permissões da Calendar API](https://developers.google.com/workspace/calendar/api/auth).

## Limites desta entrega

Sem acesso ao navegador da titular. Autorização e dados reais do Google não foram usados na validação pelo agente. Testes de transporte, autorização e DOM usam respostas fictícias. A revisão visual, o login real e a instalação no S24 permanecem pendentes.
