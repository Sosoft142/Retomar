# Retomar 1.4.1 — PC, celular e formatos de visualização

## Escopo e método

Comparação da versão 1.4 publicada com a fonte local, seguida de leitura dos componentes, eventos e regras responsivas. O conteúdo de produção corresponde à árvore `bdb247ce7da24e957e77e01f17fce0d93ef68c45`. Nenhum navegador foi acessado. Nenhuma conta real foi autenticada.

Os fluxos foram exercitados por DOM em Node, sem recursos externos. As larguras configuradas são 320, 360, 390, 650, 651, 768, 1024 e 1280 px, com lista e cartões em cada uma: 16 combinações. As decisões de foco são avaliadas com ponteiro grosso nas configurações móveis e no perfil 768 px, e fino nas demais. A presença dos controles é simulada; esses testes **não executam layout, pintura, teclado virtual ou seletores nativos**. As larguras conferem decisões da aplicação e limites documentados, sem comprovar o resultado visual.

## Incongruências corrigidas

| Situação | Antes | Agora |
| --- | --- | --- |
| Entrar em seleção | Adicionar sumia no celular, mas continuava no cabeçalho do PC | Os dois atalhos gerais são ocultados durante a seleção |
| Andamento durante a seleção | O texto perdia a classe que define estilo e coluna na lista do PC | O rótulo mantém a classe, inclusive em cartões e subitens |
| Atualizações completas da tela | O controle com foco era removido e o foco se perdia | Foco retorna ao equivalente se ele existir e estiver disponível, sem solicitar rolagem |
| Limpar seleção | O botão focado desaparecia sem destino útil | O foco segue para Selecionar exibidas |
| Comandos que compartilham a mesma ação | Arquivadas, abas e Mostrar mais podiam ser confundidos com outro controle | A correspondência considera modo, página, coleção e demais identificadores da ação |
| Meu dia | Trocar data/período ou navegar descartava o foco | O campo ou comando equivalente conserva o foco após a atualização |

Os primeiros testes reproduziram as falhas de seleção e foco na versão anterior e passaram após as correções. Dados, esquema, sincronização, cores, dependências de produção e comportamento dos eventos do Google não foram modificados.

## Fluxos conferidos

Em cada combinação: alternância lista/cartões sem gravar tarefas; títulos longos; presença das mesmas ações rápidas; criação pelo atalho correspondente; foco inicial segundo o ponteiro; edição e recusa/aceitação do descarte de rascunho; expansão de subitem sem duplicação; prioridade independente do filho; conclusão sem concluir filhos; arquivamento e restauração da família; seleção de itens exibidos; edição de datas em lote e Desfazer preservando meia-noite; organização pelas setas; agrupamento por área, prioridade e prazo; busca por subitem; Meu dia em um/sete dias e retorno ao formato anterior.

Testes de eventos de arraste cobrem mouse, espera de 300 ms no toque, cancelamento por deslocamento antes da espera, proteção contra clique acidental, Escape, perda de foco da janela e alternativa pelas setas. Não substituem a sensação ou a rolagem efetivas em um aparelho.

A suíte existente também cobre concorrência, favoritos, histórico, persistência, backups, sincronização, integração Google simulada e retorno à versão 1.3. A folha CSS foi analisada sem erros de sintaxe; foram revisadas as regras de lista desktop, grade de cartões, subitens, formulários, ações fixas e limites de 650/1024 px. O CSS não precisou ser alterado nesta correção.

## Diferenças intencionais

| Uso | PC / largura maior | Celular / largura menor |
| --- | --- | --- |
| Adicionar | Botão no cabeçalho acima de 650 px | Botão flutuante até 650 px |
| Lista compacta | Colunas a partir de 1024 px | Informações em linhas dentro do item |
| Cartões | Grade adaptável ao espaço; observações visíveis | Grade se ajusta ao espaço; mesmas ações e observações |
| Editor de tarefa | Painel lateral a partir de 1024 px; janela intermediária abaixo disso | Folha inferior até 650 px |
| Filtros e ordenação | Janela posicionada junto ao comando | Folha inferior |
| Campo inicial ao criar | Título recebe autofocus com ponteiro fino | Título do formulário recebe autofocus com ponteiro grosso para evitar abrir o teclado automaticamente |
| Organização | Arraste por mouse e setas na alça | Segurar a alça para arrastar; conteúdo continua destinado à rolagem |

Lista e cartões compartilham tarefas, prazos, área, prioridade, andamento e ações. Os cartões mostram observações; a lista privilegia leitura compacta. Os subitens expandidos usam linhas compactas em ambos os formatos. O agrupamento por prazo mostra cada subitem por sua própria data, sem duplicar o pai.

As tarefas são locais até a sincronização configurada pelo Gist; não há sincronização automática entre dois aparelhos sem essa configuração. Formato, agrupamento, aparência, favoritas, notificações e opções da agenda são preferências por aparelho. Uma diferença nessas preferências entre PC e celular não significa perda ou divergência das tarefas.

## Limites e retorno

Continuam pendentes a inspeção visual real, cortes/sobreposições medidos, zoom, teclado virtual, gestos/voltar e seletores de data no Samsung S24, além da autenticação real do Google. Não é possível afirmar equivalência visual completa com os testes em Node. A configuração OAuth do Google continua necessária para consultar eventos privados.

O ponto anterior à agenda permanece intacto na branch `backup/retomar-1.3-antes-agenda-2026-11-11`, commit `c3897a5c61b954c0f62ba4be0d77748af939932a`. O mecanismo de retorno preserva o esquema das tarefas e cria um cache offline posterior ao instalado. Esta revisão atualiza o cache para v43 para distribuir as correções.
