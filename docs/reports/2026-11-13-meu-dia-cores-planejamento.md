# Retomar 1.5 — Meu dia, Planejamento e cores da agenda

## Resultado

Meu dia permite usar as mesmas tarefas do Planejamento em Lista ou Cartões, dentro de um dia ou sete dias. É possível criar na data escolhida, concluir, gerenciar, alterar prazo, prioridade e andamento e desfazer sem sair da tela. Os eventos do Google passam a respeitar a cor individual e a cor da agenda; há suporte à leitura de cores de rótulos personalizados quando autorizado.

## Integração das tarefas

Não há cópia ou conversão de registros: os controles reutilizam a renderização e os comandos existentes. Alterações seguem o mesmo repositório, esquema 4, proteção de revisão nos formulários, captura para Desfazer e sincronização criptografada. O calendário do Google continua somente para leitura; criar uma tarefa em Meu dia cria um registro do Retomar.

| Controle | Comportamento |
| --- | --- |
| Lista | Dias em sequência, tarefas compactas e eventos com apresentação reduzida |
| Cartões | Tarefas com observações; sete dias em grade adaptável |
| Busca | Compartilhada com o Planejamento; inclui título/local/descrição/agenda dos eventos |
| Área e prioridade | Compartilhadas com o Planejamento; afetam apenas tarefas |
| Andamento | Independente em Meu dia, inicialmente Em aberto; salvo no aparelho |
| Criar no cabeçalho do dia | Data daquele dia e área selecionada previamente preenchidas |
| Adicionar geral | Usa a data inicial do período de Meu dia |
| Concluir e Desfazer | Mesmo registro e mesma reversão do Planejamento; filhos mantêm seu andamento |
| Formato | Preferência local independente do formato do Planejamento; incluída no histórico de navegação |

Subitens aparecem no dia do próprio prazo, uma vez por dia; não se expande uma cópia da família dentro do pai. A identificação do pai permanece visível. A seleção em lote é encerrada ao sair do Planejamento, evitando levar caixas de seleção sem barra de ações para Meu dia. Busca preserva foco e cursor após atualizar a tela. Ao vir de Arquivadas, a contagem de subitens no editor de Meu dia usa os itens ativos, mantendo o aviso correto de exclusão da família. A criação também passa a respeitar explicitamente a área recebida pelo atalho.

O conteúdo de cada dia é montado em lotes de 60, com contagens calculadas sobre a consulta inteira e Mostrar mais local. Alternar formato ou filtros não solicita eventos novamente.

## Cores do Google

A leitura anterior solicitava apenas os dados básicos dos eventos e aplicava `calendar.backgroundColor` a todos. Agora solicita também `colorId` e `eventLabelId`. Usa a definição da paleta do endpoint Colors; para um rótulo personalizado, consulta `Calendars.get` com máscara limitada às cores dos rótulos. A ordem de preferência é rótulo válido → cor individual válida → cor da agenda → alternativa segura. Cores aceitas são apenas hexadecimais de seis dígitos. IDs iguais de rótulos em agendas diferentes são resolvidos separadamente.

A conexão mantém os dois escopos obrigatórios de eventos/lista e solicita opcionalmente `calendar.calendars.readonly` para metadados de rótulos. Recusar a opção adicional não impede a consulta normal; se um evento usar rótulo, a tela explica a limitação de cor e orienta reconectar. Todas as chamadas continuam GET, sem escrita de eventos/configurações.

Atualizar relê a lista de agendas, os eventos e as definições de cor. Falhas apenas de cor mantêm os eventos visíveis com aviso; expiração e cancelamento continuam tratados como interrupção da consulta. Token, eventos, paletas e metadados permanecem em memória; nada foi acrescentado aos dados de tarefas, backup, Gist ou push.

Borda e indicador usam a cor recebida; fundo em gradiente tem misturas de 24%/12% sobre branco. Legendas/links dos eventos foram escurecidos para conservar leitura nos fundos reforçados. Isso preserva as categorias de cor fornecidas pela API com a linguagem visual do Retomar, sem prometer reprodução idêntica da interface do Google.

## Verificação e limites

Testes de paleta, preferência de cores, rótulos, validação CSS, falhas parciais, autorização parcial, expiração e cancelamento. DOM integrado exercita criação, conclusão, edição rápida, Desfazer, busca/área/prioridade, andamento, subitens, cursor, independência dos formatos, troca de cores e ausência de novas consultas por filtros. Matriz funcional de oito larguras configuradas e lista/cartões ampliada para os dois formatos de Meu dia. Teste dedicado verifica paginação e contagens de um dia com 145 tarefas.

Nenhum navegador ou conta Google real foi acessado. DOM em Node não calcula layout real, cortes, zoom ou teclado virtual; CSS é analisado sintaticamente. Autorização, paletas e respostas de transporte são fictícias. A conferência visual e a comparação com as cores da conta da titular permanecem pendentes.

Dados, identidade PWA, dependências, Gist e servidor push preservados. Cache offline v44. O ponto anterior à agenda continua na branch `backup/retomar-1.3-antes-agenda-2026-11-11`, commit `c3897a5c61b954c0f62ba4be0d77748af939932a`, com o mecanismo de retorno existente.

## Referências técnicas

- [Colors](https://developers.google.com/workspace/calendar/api/v3/reference/colors) e [Colors.get](https://developers.google.com/workspace/calendar/api/v3/reference/colors/get).
- [Events](https://developers.google.com/workspace/calendar/api/v3/reference/events) e [CalendarList](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList).
- [Rótulos](https://developers.google.com/workspace/calendar/api/guides/labels) e [Calendars.get](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/get).
