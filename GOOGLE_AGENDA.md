# Google Agenda no Retomar

O ícone de calendário ao lado de cada item e subitem usa a data e o horário próprios dessa tarefa. A ação envia somente aquela tarefa; os subitens não são incluídos automaticamente ao enviar o item principal.

## Adicionar sem configurar OAuth

Este é o modo simples, padrão do aplicativo. Não é preciso criar projeto no Google Cloud, colar código ou conectar o Retomar ao Google.

1. Coloque uma data no item ou subitem e salve.
2. Toque no ícone de calendário ao lado do título da tarefa.
3. O Google Agenda abre com título, data, horário e duração preparados. Se solicitado, entre na sua conta Google.
4. Confira a conta e a agenda de destino, escolha a cor e o aviso e toque em **Salvar** no Google.

Se você já escolheu o envio direto e ficou preso na configuração, abra **Configurações → Google Agenda → Usar sem configuração**. Isso muda somente o modo de adição deste aparelho; tarefas e opções de eventos permanecem preservadas. O mesmo botão está no formulário de ajustes quando o envio direto está selecionado.

Em **Configurações → Google Agenda → Ajustar eventos**, duração, tratamento dos itens sem horário e inclusão de observações/prioridade ficam disponíveis sem configurar conexão. O fuso fica em uma seção recolhível.

### Se a agenda não abrir

Ao tocar no calendário, aparece um aviso com **Não abriu?**. Essa opção oferece um link para tentar de novo, **Abrir nesta aba** e **Copiar link do evento**. Você pode colar o link no Chrome ou Safari. Se o navegador não permitir a cópia automática, o link aparece selecionável para copiar manualmente. Se aparecer uma página de apresentação do Google, entre na conta Google e abra o link novamente.

O app usa um link nativo para abrir o evento, sem depender de uma janela criada por JavaScript. O destino antigo do envio direto não é imposto no modo simples; você escolhe a conta/agenda na tela do Google.

Abrir o evento **não comprova que ele foi salvo**. O Retomar não recebe a confirmação do modo simples. Abrir novamente pode preparar outro evento; confira sua agenda antes de salvar para evitar duplicatas.

## Cores e envio direto

No modo simples, a prioridade pode ir no título e a cor é escolhida no Google ao salvar. As cores automáticas e os avisos configurados pelo Retomar pertencem ao **envio direto**, disponível em **Ajustar eventos → Conexão avançada e cores automáticas**.

O envio direto continua exigindo um cliente OAuth e autorização do Google. Depois dessa preparação, o botão adiciona o evento com a cor da prioridade, o aviso e a duração escolhidos. Reenviar a mesma tarefa à mesma agenda atualiza o evento vinculado, com confirmação somente após a resposta e a releitura no Google. Se a autorização falhar ou for cancelada, o aviso oferece **Usar sem configuração**.

As cores iniciais do envio direto são Urgente em vermelho, Alta em laranja, Normal em azul e Baixa em violeta. É possível escolher outras cores do Google, mantendo quatro cores diferentes.

## Preparar a conexão direta uma vez

O Google exige um cliente OAuth próprio do aplicativo para autorizar o acesso. O ID desse cliente é público. Ele **não é o token do GitHub**, uma senha, o segredo do cliente ou uma chave de API.

1. Entre no [Google Cloud Console](https://console.cloud.google.com/apis/credentials), com a conta que vai administrar essa configuração.
2. Crie ou selecione um projeto. Na biblioteca de APIs, ative **Google Calendar API**.
3. Configure a tela de consentimento do Google Auth Platform com o nome Retomar e os dados solicitados pelo Google. Para uso pessoal, pode manter o projeto em teste e adicionar a conta que utilizará o app como usuária de teste.
4. Na configuração de acesso aos dados, use estes escopos:
   - `https://www.googleapis.com/auth/calendar.events.owned`
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
5. Crie um **ID de cliente OAuth**, do tipo **Aplicativo da Web**.
6. Em **Origens JavaScript autorizadas**, adicione exatamente `https://sosoft142.github.io`. A origem não inclui `/Retomar/`. O fluxo de token no navegador não exige um redirecionamento próprio do Retomar.
7. Copie o ID público terminado em `.apps.googleusercontent.com`.
8. No Retomar, abra **Configurações → Google Agenda → Ajustar eventos → Conexão avançada e cores automáticas**, escolha **Envio direto com cores**, cole o ID público e salve.
9. Toque em **Conectar ao Google**, escolha a conta e autorize as permissões. Se o app avisar que está preparando a conexão, aguarde e toque novamente.
10. Em **Ajustar eventos → Conexão avançada e cores automáticas**, escolha a agenda de destino entre as agendas que pertencem à conta conectada. A opção Agenda principal fica disponível por padrão.

A autorização de acesso fica somente na memória desta sessão. Fechar/recarregar o app ou expirar a autorização pode exigir conectar novamente; o botão do item também pode iniciar essa autorização. As preferências e o ID público ficam neste aparelho. Para usar outro aparelho, configure suas opções nele.

Se o Google bloquear o acesso, confira o ID completo, a origem autorizada, a API habilitada, a conta de teste e as permissões. A janela de autorização precisa poder abrir. Não digite senhas ou segredos do Google nos campos do Retomar.

## Datas, horários e avisos

- O item precisa ter uma data antes do envio. Se faltar, o botão abre a edição para você defini-la e salvar.
- O horário do subitem é independente do horário do item principal.
- Se não houver horário, escolha entre evento de dia inteiro e horário padrão.
- Eventos de dia inteiro terminam no início do dia seguinte. Os avisos do Google são calculados em relação ao início do evento; o padrão da agenda pode ser mais adequado para esses eventos.
- A duração vale para eventos com horário. O fuso escolhido também define os dias e os horários dos lembretes dentro do Retomar.
- Datas em mudanças de horário de verão são verificadas; um horário inexistente precisa ser corrigido antes de enviar.
- As observações só são enviadas se essa opção estiver marcada. O evento inclui a área, a prioridade, o contexto do item principal quando for subitem e um link para voltar ao item no Retomar.

## Reenvios e alterações

O envio direto usa um ID estável baseado na identidade do app, no conjunto de dados e no item. Reenviar à mesma agenda atualiza os campos gerenciados pelo Retomar e conserva campos externos como local e participantes. A atualização usa a revisão do evento para evitar sobrescrever uma alteração concorrente sem perceber.

Uma falha de rede não é anunciada como sucesso. Tentar novamente usa o mesmo vínculo, inclusive se a criação tiver ocorrido e a resposta tiver se perdido. Se o evento tiver sido removido no Google, o app avisa e não o ressuscita automaticamente; nesse caso, use o modo Abrir no Google Agenda para preparar outro evento.

Esta é uma adição ou atualização solicitada pelo botão. Alterar, concluir ou excluir uma tarefa no Retomar não altera automaticamente o evento no Google; reenviar atualiza seus dados, e a remoção de um evento é feita no próprio Google Agenda.

## Lembretes dentro do app

O sino abre os avisos ordenados pela data e pelo horário, com a prioridade como desempate. Você pode configurar a antecedência, incluir atrasados, adiar um aviso ou dispensá-lo por hoje. Adiar e dispensar não concluem nem apagam tarefas. Um prazo alterado volta a ser considerado. Tarefas sem data, concluídas, canceladas ou excluídas não geram avisos.

Os avisos internos aparecem ao abrir ou usar o Retomar. Para alertas com o aplicativo fechado, adicione o evento ao Google Agenda e configure seu aviso. As preferências e os adiamentos ficam neste aparelho; os prazos das tarefas continuam sincronizando pelo GitHub.

## Referências técnicas

- [Exemplo oficial de Calendar no navegador](https://github.com/googleworkspace/browser-samples/blob/main/calendar/quickstart/index.html)
- [Modelo de token do Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Campos oficiais de eventos e APIs, publicados pelo Google](https://github.com/googleapis/google-api-python-client/blob/main/googleapiclient/discovery_cache/documents/calendar.v3.json)

O envio autenticado com uma conta real exige o ID público e a autorização descritos acima. Os testes de desenvolvimento exercitam a montagem dos eventos, as cores, os avisos e a proteção contra duplicação com dados e transporte simulados; não criam compromissos na sua agenda real.
