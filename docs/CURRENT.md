# Estado atual — Retomar

- Produto: PWA Android/Chrome, prioritariamente celular Samsung S24.
- Versão do app: **0.12.1**. URL: https://sosoft142.github.io/Retomar/
- Repositório: `Sosoft142/Retomar`; produção na branch `main`; arquivos públicos em `dist/`.
- Sem framework/bundler de produção; módulos JavaScript e CSS estático.
- Dados locais e Gist criptografado preservam os identificadores históricos `entrelinhas-vida`.
- 0.12.1: check-up geral; organização protege revisão concorrente, reordenação respeita filtros e preserva arquivados, indicador de filtros atualiza, armazenamento bloqueado recebe tratamento e cache offline tem gravação tolerante a falhas e escopo limitado. [Relatório do check-up](reports/2026-11-07-checkup.md).
- 0.12.0: resumo superior sem título visual repetido, botões de gerenciamento reconhecíveis, datas compactas com atraso escrito, tipografia de leitura revisada, subitens menos recuados e andamento sempre visível no editor. [Relatório da revisão de usabilidade](reports/2026-11-06-revisao-usabilidade.md). Critérios de interface em [UI.md](UI.md).
- 0.11.0: cartões centrados em título/prazo, prioridade e andamento como texto compacto, engrenagem para edição, subitens/avisos no gerenciamento, arquivo e botão de adicionar reduzidos. Agrupamento e visualização ficam em Filtros. [Relatório de hierarquia dos cartões](reports/2026-11-06-hierarquia-cartoes.md).
- 0.10.0: áreas em seletor compacto, gerenciamento completo sem sair da central de lembretes, ações temporárias no gerenciamento (revisado em 0.11.0), configurações separadas de central/push, prioridade colorida e andamento neutro com rótulos.
- [Relatório de áreas, lembretes e espaçamento](reports/2026-11-05-areas-lembretes.md).
- 0.9.1: controles de gerenciamento e arraste em linha própria, rótulos visíveis no celular, mais espaço entre botões/cartões e ícones do cabeçalho; fundos e sombras suavizados.
- 0.9.0: botão Gerenciar separado da alça de arraste; arquivamento reversível de qualquer tarefa, consulta de arquivadas e lote de concluídas nos filtros atuais. Pais com subitens não concluídos ficam fora do lote. Arquivo do pai oculta os filhos sem alterar seus conteúdos/revisões.
- Esquema de dados 4: migração automática dos esquemas 1–3, com IDs, Gist, chaves locais e status preservados. Atualizar os outros aparelhos antes de sincronizar; versões antigas rejeitam o novo esquema sem sobrescrever os dados.
- [Relatório desta atualização](reports/2026-11-05-arquivamento.md).
- Funcionalidades: áreas, prioridades, status, prazos, subitens, arraste, busca, cronograma, lembretes internos, backup, sincronização e histórico do navegador.
- Implantação push simplificada por `npm run push:deploy`: preserva chaves existentes e só configura o endpoint após validar `/config`. Execução neste ambiente interrompida por falta de autenticação Cloudflare; envio real segue inativo. [Relatório da tentativa](reports/2026-11-08-implantacao-push.md).
- Google Agenda removido. Push: preferências gerais e por tarefa, prévia e servidor preparado; **envio real inativo**, sem conta/implantação Cloudflare disponível.
- Preferências de notificações e ajustes por tarefa são por aparelho; não são sincronizados pelo Gist.
- Suíte ampliada nesta revisão: testes de foco, busca e invalidação dos cálculos. Resultado da fonte atual: `npm run verify`; logs não são documentação de estado permanente.
- 0.8.3: foco e posição preservados ao salvar; menos cálculos e remontagens repetidos; grade de áreas mais legível em telas maiores. Dados, esquema, Gist e identidade PWA preservados.
- [Relatório de fluidez e economia de contexto](reports/2026-11-03-fluidez.md).

## Verificação e publicação

- `npm test`: suíte completa existente, sem redução.
- `npm run verify`: execução completa com resumo e log detalhado em `.work/`.
- `npm run release:prepare -- --base REF`: diferenças, integridade de `dist/`, confirmação de verificação atual e pacote de alterações para o conector.
- CI executa verificação completa; Pages só republica quando `dist/` muda ou há acionamento manual.
- Fonte atual e Git são a referência para comportamento; consultar o histórico apenas para investigar decisões antigas.
