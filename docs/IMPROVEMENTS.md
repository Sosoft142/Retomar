# Melhorias de design e usabilidade

Lista da avaliação do Retomar 1.0.2, mantida para continuidade do projeto. Os itens 1–3 foram entregues na versão 1.1. A titular autorizou em seguida os itens 4–8, concluídos na versão 1.2.

| Item | Melhoria | Critério de conclusão | Situação |
| --- | --- | --- | --- |
| 1 | Eliminar subitens duplicados no agrupamento por prazo | Cada subitem aparece uma vez, no próprio prazo, com identificação da tarefa principal. Expandir o pai em outra visualização não produz duplicações ao voltar para prazo. | Concluído em 1.1 |
| 2 | Usar a mesma regra de atraso em todo o app | Planejamento, filtro de atrasados, grupos por prazo e central usam data, horário, status e fuso configurado. Sem horário vence na virada do dia. A indicação se atualiza durante o uso e ao retornar ao app. | Concluído em 1.1 |
| 3 | Reduzir o espaço ocupado por filtros e ordenação | Um painel por vez, sobre o conteúdo: folha inferior no celular e janela compacta junto ao botão no PC. Escolhas aplicadas ficam resumidas na tela. Aplicar, limpar, cancelar e voltar preservam um funcionamento previsível. | Concluído em 1.1 |
| 4 | Diferenciar melhor lista compacta e cartões | Lista efetivamente mais densa, com leitura rápida; cartões com hierarquia própria e espaço proporcional ao conteúdo. | Concluído em 1.2 |
| 5 | Aproveitar melhor a versão para PC | Colunas alinhadas na lista, editor contextual lateral e melhor ocupação da grade, evitando grandes vazios. | Concluído em 1.2 |
| 6 | Tornar o estado das notificações concreto | Informar próximo aviso previsto, confirmação do servidor e motivos pelos quais não há aviso calculado. Distinguir configuração, inscrição, agendamento e recebimento real. | Concluído em 1.2 |
| 7 | Simplificar Gerenciar item | Nomes mais claros, ações relacionadas reunidas e melhor organização das opções na parte inferior. | Concluído em 1.2 |
| 8 | Melhorar a leitura de informações secundárias | Rever contraste/tamanho, facilitar a descoberta dos nomes de prioridade e usar pequeno indicador da cor da área. | Concluído em 1.2 |

## Critérios permanentes

- Manter a identidade com gradientes claros, transparência e cores suaves, incluindo fundos derivados da área e cores próprias dos itens.
- Priorizar título, prazo e andamento. Engrenagem explícita para gerenciar, controles com espaço confortável e sem teclado automático ao abrir gerenciamento/configurações.
- Verificar celular e PC. Preservar dados, funcionamento offline, sincronização, arquivamento e confirmação de descarte.
- A lista original 1–8 está concluída. Novas funcionalidades e mudanças de escopo dependem das próximas solicitações da titular.

## Próxima etapa autorizada — 1.3

| Recomendação | Situação |
| --- | --- |
| Validar PC/S24, sincronização offline e notificações reais | Pendente de execução nos aparelhos; navegador e conta real não acessados. Roteiro no relatório. |
| Edição rápida de prazo, prioridade e andamento | Implementada; testada por lógica e simulação de DOM em Node. |
| Desfazer ampliado | Implementado com proteção de concorrência e revisões monotônicas. |
| Seleção e ações em lote | Implementadas com aplicação integral, verificação de revisões e proteção dos vínculos. |
| Visualizações favoritas | Implementadas: salvar, aplicar, renomear e remover; parâmetros salvos por aparelho. |

Revisão visual de 1.3 pendente: a titular proibiu o acesso ao navegador. Essa restrição tem precedência sobre o fluxo de revisão visual. Não declarar os testes em Node como conferência de layout ou teste real no S24.
