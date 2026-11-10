# Retomar 1.1 — três primeiras melhorias

## Resultado

Esta etapa implementa somente os itens 1–3 da [lista de melhorias](../IMPROVEMENTS.md). A identidade com gradientes suaves, as cores de área e as cores próprias foram mantidas. Os itens 4–8 permanecem registrados para a avaliação e autorização da próxima etapa.

### 1. Subitens sem duplicação por prazo

Cada subitem aparece uma única vez, no grupo correspondente ao próprio prazo, com o texto “Subitem de …” identificando a tarefa principal. O agrupamento por prazo não volta a desenhar os filhos dentro do pai, mesmo que ele tenha ficado expandido em outra visualização. Nas visualizações hierárquicas, expandir e recolher subitens continua disponível.

### 2. Regra de atraso consistente

O planejamento, a busca de atrasados, os grupos por prazo e a central utilizam o mesmo cálculo de data, horário, status e fuso configurado. Um horário vencido hoje já fica marcado como atrasado. Sem horário, a tarefa vence somente na virada do dia do fuso escolhido. Concluídas, canceladas e tarefas sem data não recebem indicação de atraso.

O relógio da tela é renovado a cada 30 segundos durante o uso e ao retornar ao app. A atualização aguarda enquanto há formulário, busca em edição ou arraste, e restaura um controle focado se a atualização realmente precisar substituí-lo. O cálculo reutiliza conversões de prazos iguais dentro da renderização. Horários inexistentes por mudança de fuso continuam sinalizados para correção.

Essa atualização trata a classificação visual dos prazos. Não altera o agendamento do servidor push, as preferências por aparelho ou o esquema de dados.

### 3. Filtros e ordenação sobre o conteúdo

Os botões de funil e setas abrem um painel por vez, sem acrescentar os antigos formulários à altura da lista. No celular, o painel vem da parte inferior; no PC, fica junto ao botão acionado. O conteúdo pode rolar quando necessário e o rodapé permanece acessível. Os seletores têm rótulos visíveis; o foco inicial fica no título, sem abrir o teclado.

As escolhas passam a valer ao tocar em “Aplicar”. “Limpar seleção” prepara a remoção dos filtros, também confirmada por “Aplicar”. Alterações não aplicadas continuam protegidas pela confirmação de descarte do aplicativo. Após fechar, a tela mostra um resumo dos filtros, formato, agrupamento e ordem ativos. Formato, agrupamento e ordem continuam salvos neste aparelho.

## Verificação

- Suíte completa: **256 testes aprovados**, sem falhas. Sintaxe, imports locais e diferenças de espaço em branco aprovados por `npm run verify`.
- Cinco regressões novas cobrem concordância entre filtros, grupos e lembretes; instante exato do prazo; status diferentes com mesmo horário; virada do dia e fuso diferente do aparelho; horário inexistente; atualização ao retornar, proteção da edição e remoção dos observadores.
- Conferência visual no navegador em **320, 360, 390, 768 e 1200 px**, usando somente dados fictícios. Incluiu viewport com 500 px de altura, rolagem do painel e rodapé, textos longos, cores de área e cor própria.
- Fluxos exercitados: lista e cartões por prazo sem IDs duplicados; troca para hierarquia com pai expandido e retorno; aplicação, limpeza, descarte recusado e aceito; Escape e Voltar; restauração do foco; filtros sem resultados e recuperação; recarga com preferências salvas; concordância do atraso com a central.
- O limite de altura do painel foi corrigido depois da conferência em tela pequena. Não foi observado transbordamento horizontal nos cenários conferidos. O registro de erros do app na prévia ficou vazio.

A conferência móvel usa larguras de navegador. Não equivale a testar um S24 físico; nesta etapa não foi realizado novo teste de entrega, vibração ou pop-up de notificações no aparelho.

## Continuidade e consumo de contexto

A lista completa de oito melhorias está versionada em `docs/IMPROVEMENTS.md`, com situação e critérios de conclusão, e ligada ao mapa e ao estado atual. Foram utilizados o mapa do código, consultas dirigidas, testes por área durante as alterações e resumo da validação completa. Isso mantém contexto reutilizável para próximas atualizações. Não há uma medição comparável de tokens desta sessão para informar uma redução percentual confiável.
