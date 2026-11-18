# Histórico

## 1.9.0 — Subitens diretos e organização

Botão + no cartão para criar etapas; expandir/recolher todos alterna na visualização atual. Organização separa formato, agrupamento e ordem de itens/subitens, com título, mais recentes e restauração do padrão. Filtros ativos podem ser removidos individualmente. Criação, filtros, arquivo, favoritas, seleção e Desfazer verificados em lista, cartões e quatro agrupamentos. Revisão visual em PC e 360 px. Cache v50.

## 1.8.1 — Subitens na tela inicial e atualização do app

Busca pelo item principal passa a manter suas etapas, mesmo com títulos diferentes. Quando apenas uma etapa corresponde aos filtros, seu principal continua como contexto. Filtros revelam famílias recolhidas, respeitando novo recolhimento na sessão; Mostrar subitens reabre etapas ocultas sem alterar tarefas. Entrada versionada e revalidação dos arquivos do app evitam reutilizar código HTTP antigo após a publicação; offline e notificações preservados. Cache v49.

## 1.8 — Planejamento com itens e subitens reunidos

Removidos Meu dia, suas opções, módulos e preferências. O Planejamento mostra subitens abaixo do principal, abertos por padrão, em Lista compacta, Cartões e todos os agrupamentos. Prazo e prioridade organizam famílias pela tarefa principal; os subitens conservam suas informações próprias. Arquivadas reúne famílias e mostra o principal ativo como contexto quando somente um subitem está arquivado. Busca, filtros, recolhimento, paginação, ações rápidas, seleção, Desfazer e sincronização preservados. Cache v48.

## 1.7 — remoção da integração externa da agenda

Meu dia passa a usar somente tarefas do Retomar, mantendo seus formatos, filtros, ações e navegação. Removidos SDK, OAuth, leitura de eventos, compartilhamento de configuração, serviço e ferramentas da integração. Preferências antigas são limpas sem alterar tarefas ou o pareamento do GitHub. Cache v47. O Worker inclui migração para excluir apenas o armazenamento da integração, preservando notificações e suas chaves.

[Limpeza manual das contas externas](docs/REMOVER-GOOGLE-AGENDA.md). As versões descontinuadas permanecem no histórico Git.

## 1.5 — Meu dia integrado ao Planejamento

Lista/Cartões em um ou sete dias, com criação na data escolhida, conclusão, gerenciamento, ações rápidas e Desfazer sobre as mesmas tarefas do Planejamento. Busca, área e prioridade compartilhadas; andamento de Meu dia e formato independentes, salvos no aparelho. Subitens usam seus próprios prazos e não são duplicados; sair da seleção para outra tela restaura controles normais. Busca preserva foco e cursor.

## 1.4.1 — consistência entre PC e celular

Seleção oculta Adicionar no cabeçalho do PC, como já ocorria no celular; o andamento conserva seu rótulo e posicionamento ao selecionar. Renderizações mantêm foco no controle equivalente; limpar seleção retorna a Selecionar exibidas. A identificação de foco distingue abas, arquivo e listas com Mostrar mais. Meu dia conserva o foco na data, período e navegação.

Verificação funcional em Node para oito larguras e lista/cartões, incluindo toque, teclado, edição, descarte, subitens, arquivo e lote. Arraste exercitado por eventos simulados. Sem acesso ao navegador; medidas e aparência reais continuam pendentes. [Relatório](docs/reports/2026-11-13-paridade-pc-celular.md).

## 1.3 — ações rápidas, seleção e visualizações favoritas

Prazo, prioridade e andamento abrem editores compactos ao toque. Desfazer reverte a última alteração da sessão com revisões novas e rejeita registros alterados depois; inclui área, organização, arquivamento, edição e exclusão. A seleção substitui o controle de conclusão temporariamente e permite editar tarefas em lote, com revisão de concorrência e preservação da hierarquia. Visualizações favoritas salvam área, busca, filtros, agrupamento e ordenação neste aparelho e permitem aplicar, renomear e remover.

Dados, esquema, Gist, gradientes e identidade PWA preservados. Novos módulos incluídos no cache offline. [Relatório e pendências](docs/reports/2026-11-10-acoes-e-visualizacoes.md).

## 1.2 — lista, cartões, gerenciamento e avisos

Conclui os itens 4–8 da avaliação de usabilidade: lista compacta com colunas no PC, cartões em grade adaptável, editor lateral e ações agrupadas por finalidade. Nomes de prioridade e indicadores da cor da área ficam visíveis. Notificações distinguem cálculo local, permissão e agendamento aceito pelo servidor; falhas preservam o registro anterior e explicam a atualização pendente. Gradientes, dados, Gist e identidade PWA preservados.

[Relatório](docs/reports/2026-11-10-melhorias-4-8.md).

## 0.10.0 — áreas, lembretes e leitura visual

Áreas passam a usar seletor compacto e acesso a Organizar áreas. Cartões de lembretes oferecem Gerenciar e Concluir; adiar e ocultar até amanhã ficam em Opções do aviso, com explicação. Gerenciar abre as ações completas da tarefa e preserva a central ao salvar/fechar. Configurações da central organizadas em três grupos, separadas de push e opções avançadas. Prioridade usa cores e rótulos; andamento usa aparência neutra e texto explícito. Espaçamento revisto em 320/390 px, incluindo correção de altura e corte nos seletores. Sem mudança no esquema de dados.

[Relatório](docs/reports/2026-11-05-areas-lembretes.md).

## 0.9.1 — simplificação visual e espaçamento

Gerenciar e Mover passam para uma linha própria, com rótulos visíveis no celular. Mais espaço interno e entre cartões, controles de toque de 44 px e cabeçalho com ícones separados. Fundos e sombras mais discretos. Dados e funções preservados. Revisão visual em 320 e 390 px; edição e movimentação pelo teclado verificadas.

## 0.9.0 — gerenciamento e arquivamento

Botão próprio para gerenciar cartões e subitens; títulos deixam de abrir a edição e alças ficam exclusivas para arraste. Arquivo reversível em todos os status, atalho nas concluídas, lote que respeita filtros e preserva pais com subitens não concluídos. Arquivadas saem do planejamento, cronograma ativo e lembretes. Migração dos dados para esquema 4 preserva identidade, conteúdo e sincronização criptografada.

[Relatório](docs/reports/2026-11-05-arquivamento.md).

## 0.8.3 — fluidez de uso

Corrigido retorno ao topo/perda de foco ao salvar tarefas; foco restaurado nos seletores rápidos. Reaproveitamento de filtros, índice de subitens, texto pesquisável e conversões de fuso; resultados idênticos não remontam os controles. Grade de áreas ampliada em telas maiores e regras móveis substituídas removidas. Sem mudança no esquema dos dados, Gist ou identidade PWA.

[Relatório de revisão](docs/reports/2026-11-03-fluidez.md).

## Manutenção do fluxo de desenvolvimento — sem nova versão do app

Orientação curta, mapa de leitura por tarefa, estado atual separado do histórico e ferramentas determinísticas de verificação/preparação de publicação. Sem alterações em `dist/`, servidor ou dados. A versão do app permanece 0.8.2.

[Histórico integral até 0.8.2](docs/history/CHANGELOG-ate-0.8.2.md).
