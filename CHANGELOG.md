# Histórico

## 1.4 — Meu dia e Google Agenda opcional

Consulta de compromissos em um dia ou sete dias, junto às tarefas, com seleção de agendas. Acesso somente de leitura, token e eventos em memória, conexão iniciada pela titular e falhas isoladas do planejamento. A configuração OAuth do Google precisa ser feita pela titular; o recurso pode ser usado apenas com tarefas ou desativado.

Versão 1.3 preservada antes da integração em branch própria, com preparação e teste de restauração. [Configuração e retorno](docs/GOOGLE-AGENDA.md) · [Relatório e limites](docs/reports/2026-11-11-google-agenda.md).

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
