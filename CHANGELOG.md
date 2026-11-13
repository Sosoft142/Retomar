# Histórico

## 1.6 — agenda e pareamento entre aparelhos

ID público Google e seleção de agendas são sincronizados em arquivo criptografado próprio no mesmo Gist; formulário aberto adia alterações remotas. Ocultar Meu dia continua por aparelho. Tarefas e esquema de dados preservados.

Preparados OAuth por código no servidor, renovação compartilhada, credencial derivada do pareamento, armazenamento criptografado, proteção por estado/PKCE/cookie e desconexão global com resultado de revogação. Configuração de implantação conserva VAPID e chave de dados. **Ativação Cloudflare e cadastro do cliente Google pendentes pela titular**: publicar o app não ativa o Worker. Conexão por sessão mantida como alternativa até a ativação. Cache offline v45.

[Guia de ativação](docs/AGENDA-PAREADA.md) · [Relatório e limites](docs/reports/2026-11-13-agenda-pareada.md).

## 1.5 — Meu dia integrado e cores do Google Agenda

Lista/Cartões em um ou sete dias, com criação na data escolhida, conclusão, gerenciamento, ações rápidas e Desfazer sobre as mesmas tarefas do Planejamento. Busca, área e prioridade compartilhadas; andamento de Meu dia e formato independentes, salvos no aparelho. Subitens usam seus próprios prazos e não são duplicados; sair da seleção para outra tela restaura controles normais. Busca preserva foco e cursor.

Eventos consultam a paleta do Google e usam cor individual, rótulo personalizado quando autorizado e cor padrão da agenda. Atualizar relê a lista de agendas e suas cores. O acesso de metadados para rótulos é opcional e somente de leitura. Fundos, bordas e indicadores de cor reforçados, com legendas mais escuras. Conteúdo por dia tem Mostrar mais, mantendo contagens completas.

Dados, Gist, identidade PWA e retorno 1.3 preservados; cache offline v44. Sem navegador na validação. [Relatório](docs/reports/2026-11-13-meu-dia-cores-planejamento.md).

## 1.4.1 — consistência entre PC e celular

Seleção oculta Adicionar no cabeçalho do PC, como já ocorria no celular; o andamento conserva seu rótulo e posicionamento ao selecionar. Renderizações mantêm foco no controle equivalente; limpar seleção retorna a Selecionar exibidas. A identificação de foco distingue abas, arquivo e listas com Mostrar mais. Meu dia conserva o foco na data, período e navegação.

Verificação funcional em Node para oito larguras e lista/cartões, incluindo toque, teclado, edição, descarte, subitens, arquivo e lote. Arraste exercitado por eventos simulados. Sem acesso ao navegador; medidas e aparência reais continuam pendentes. [Relatório](docs/reports/2026-11-13-paridade-pc-celular.md).

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
