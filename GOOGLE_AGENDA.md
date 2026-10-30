# Google Agenda no Retomar

O Retomar oferece somente a adição simples. O calendário ao lado de cada item ou subitem abre um evento preparado no Google Agenda; o salvamento é confirmado por você no Google. Não há conexão OAuth, ID de cliente, autorização de API ou envio direto no Retomar.

## Adicionar um evento

1. Defina uma data no item ou subitem e salve a tarefa.
2. Toque no ícone de calendário ao lado do título.
3. No Google Agenda, confira a conta, a agenda de destino, o título e os horários.
4. Escolha a cor e a notificação desejadas.
5. Toque em **Salvar** no Google.

Cada tarefa usa sua própria data, horário e prioridade. Enviar o item principal não inclui seus subitens automaticamente. Sem data, o botão abre a edição para você defini-la.

Em **Configurações → Google Agenda → Ajustar eventos**, você pode escolher duração, evento de dia inteiro ou horário padrão, inclusão das observações, prioridade no título e fuso horário. Essas preferências ficam neste aparelho.

## Notificações

Os eventos usam as notificações padrão da agenda escolhida. Para ajustar um aviso específico, procure **Notificação** ou **Adicionar notificação** na tela de criação do evento no Google. Se necessário, abra **Mais opções**. Escolha a antecedência e salve o evento.

A orientação está disponível em **Configurações → Google Agenda → Como definir notificações**, nos ajustes dos eventos e na ajuda **Não abriu?** após tocar no calendário de uma tarefa.

O Retomar não configura automaticamente a antecedência por esse link. Não há um seletor local que prometa aplicar um aviso sem enviá-lo. Para usar o mesmo aviso em novos eventos, ajuste as notificações padrão nas configurações da agenda no Google. No celular, o Google Agenda precisa ter permissão para enviar notificações.

Os lembretes no sino do Retomar são independentes: aparecem ao abrir e usar o aplicativo, conforme data, horário e antecedência configurada. Alertas com o Retomar fechado dependem do Google Agenda depois de salvar o evento.

## Se a agenda não abrir

Após tocar no calendário, use **Não abriu?** no aviso do Retomar. A ajuda oferece **Abrir Google Agenda**, **Abrir nesta aba** e **Copiar link do evento**. O link pode ser colado no Chrome ou Safari. Se a cópia automática não estiver disponível, o link aparece selecionável para copiar manualmente.

Se o Google mostrar uma página de apresentação, entre na conta Google e abra o link novamente. A conta Google é usada no próprio Google Agenda; o Retomar não pede credenciais ou autorização de API.

## Datas e reenvios

Itens e subitens usam horários independentes. Sem horário, a preferência pode ser dia inteiro ou um horário padrão. Eventos de dia inteiro têm fim exclusivo no início do dia seguinte. Eventos com horário respeitam a duração configurada e o fuso, incluindo mudanças de horário de verão. Um horário inexistente precisa ser corrigido antes da preparação do link.

Observações são incluídas somente quando a opção estiver marcada. O evento contém área, prioridade, contexto do item principal e um link para retornar à tarefa no Retomar.

Abrir um evento não confirma que ele foi salvo. Abrir o mesmo item novamente pode preparar outra cópia; confira a agenda antes de salvar. Alterar, concluir ou excluir uma tarefa no Retomar não modifica eventos já salvos no Google.

## Atualização de preferências antigas

A versão 0.7.2 remove o modo avançado e converte automaticamente as preferências anteriores para a adição simples. Duração, horário padrão, fuso, inclusão de notas/prioridade, lembretes internos e adiamentos são mantidos. Opções antigas de cliente OAuth, agenda de API, cores e aviso automático deixam de ser usadas e são removidas da preferência local quando a gravação é possível.

Se o armazenamento impedir a atualização das preferências, a sessão ainda usa somente a adição simples e mostra um aviso. As tarefas, a sincronização GitHub e os backups de planejamento permanecem no esquema 3.
