# Fluidez e personalização — 22/11/2026

Versão 1.11.0, cache v53. Solicitação: testar a fluidez e os gestos do Retomar e ampliar a personalização da Academia.

## Alterações

- Painel Personalizar: cor herdada do Retomar, paleta de 16 cores ou escolha livre; cartões/lista; miniaturas grandes, compactas ou somente links; descrições recolhidas, abertas ou ocultas. Opções para progresso, caminhada, orientações, exercícios feitos e deslize entre treinos.
- Editores de treino e exercício incluem cor própria, com herança da guia ou do treino. Restaurar aparência padrão exige salvar o rascunho e conserva o roteiro e as marcações.
- Academia passa ao esquema 2, com preferências no backup próprio. Carregar ou restaurar o esquema 1 acrescenta os padrões sem alterar treinos e histórico. A leitura não grava automaticamente. Chave local preservada; Planejamento permanece no esquema 4. A Academia continua fora do Gist e do JSON do Planejamento, conforme aviso visível.
- Marcação diária atualiza o progresso e os controles existentes, preservando imagens, descrições abertas e foco. Ocultar exercícios feitos requer nova renderização para retirar o cartão da lista.
- Deslize na barra de seções alterna as duas guias; no conteúdo e na navegação dos treinos alterna o treino. Sem retorno circular. Há indicação visual durante o gesto e respeito à preferência de movimento reduzido. Campos, links, detalhes, alças, bordas do sistema, seleção e formulários não iniciam troca de tela.
- Cancelamento por gesto vertical, segundo dedo, perda de captura, saída da janela ou falta de destino. Soltar fora do app antes da captura não prende a próxima tentativa; clique posterior ao arraste é suprimido.
- Reordenação recalcula destino enquanto a tela rola nas bordas, usa tempo entre quadros para a velocidade e evita recriar realce quando o destino é igual. Um segundo dedo cancela; eventos de outro ponteiro não concluem o arraste.

## Verificação

Regressões automatizadas cobrem migração não destrutiva, opções/cores inválidas, persistência/backup, concorrência, cancelamento de rascunho, restauração de aparência, preservação dos nós e imagens, progresso diário, limites e bloqueios de gestos, rolagem vertical, movimento reduzido, cliques acidentais, segundo dedo, destino durante rolagem e integração com o app completo.

No navegador isolado foram executados deslizes por entrada de ponteiro entre as guias e entre treinos. A revisão em PC e iframe de 360 px conferiu o visual violeta, lista, miniaturas compactas, descrições abertas, painel rolável e salvamento de somente links/ocultação de orientações. Sem transbordamento horizontal. Rolagem vertical manteve o treino; marcar exercício atualizou o progresso e conservou foco e descrição aberta.

Esses testes não medem quadros por segundo, atraso de entrada ou gestos nativos em aparelho Android. Instalação, teclado virtual e integração com o gesto de voltar do sistema ainda dependem de aparelho físico. A suíte completa, sintaxe, imports e diferenças são verificadas por `npm run verify`; CI é obrigatório antes da integração.
