# Revisão visual — Retomar 1.0.1

## Correções

A central de lembretes ainda mostrava fundo branco, borda e texto coloridos por prioridade. Agora, planejamento e central reutilizam a mesma definição de fundo e o mesmo indicador de prioridade. A cor personalizada prevalece sobre a área, e tarefas sem área usam branco quando não têm cor própria.

Foram corrigidos a lupa fora da busca, a largura do botão Áreas, os recuos inconsistentes de prazos e subitens e o alinhamento entre conclusão, título e engrenagem. Os cartões em grade deixam de esticar para acompanhar a altura de um vizinho com subitens expandidos. A barra da central acompanha a largura dos lembretes no computador.

O rodapé do editor comprimia o botão Excluir até deixar seu texto na vertical. A distribuição agora mantém Excluir, Cancelar e Salvar na mesma linha nas larguras verificadas. Cabeçalho, campos, controles de cor e ações secundárias também foram conferidos. A organização em categorias preserva o status de ativação das notificações, antes removido junto com o cabeçalho.

## Conferência no navegador

Foram usados dados fictícios na prévia local, com título longo, tarefa em andamento, subitem, prazo atrasado, tarefa sem área, tarefa concluída e cor personalizada.

| Largura da prévia | Conferência |
| --- | --- |
| 320 px | Busca em linha própria, lista, cartões, lembretes e rodapé do editor |
| 360 px | Lembretes, editor e ações de aviso, arquivo e organização |
| 390 px | Planejamento, subitem expandido, lembretes, cores e conclusão pela central |
| 430 px | Lembretes e configurações expandidas |
| 1200 px | Planejamento em duas colunas, lembretes e status nas configurações |

Os contêineres inspecionados não apresentaram transbordamento horizontal. A conferência incluiu capturas e medições de dimensões e cores computadas. Concluir uma tarefa pela central retirou o lembrete e atualizou o contador.

A suíte completa deve aprovar a árvore publicada. O teste de regressão acrescentado confere o fundo da área, a cor própria, o branco sem área, o ícone de prioridade e o prazo semântico na central. A revisão usa o navegador remoto e não substitui uma conferência no S24 físico.

## Uso de contexto

As leituras foram delimitadas às regras e componentes envolvidos. A central e o planejamento passam a reutilizar a apresentação de cores e prioridade. Não há uma base de medição de tokens que permita informar uma economia percentual.
