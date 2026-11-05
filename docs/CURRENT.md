# Estado atual — Retomar

- Produto: PWA Android/Chrome, prioritariamente celular Samsung S24.
- Versão do app: **0.9.1**. URL: https://sosoft142.github.io/Retomar/
- Repositório: `Sosoft142/Retomar`; produção na branch `main`; arquivos públicos em `dist/`.
- Sem framework/bundler de produção; módulos JavaScript e CSS estático.
- Dados locais e Gist criptografado preservam os identificadores históricos `entrelinhas-vida`.
- 0.9.1: controles de gerenciamento e arraste em linha própria, rótulos visíveis no celular, mais espaço entre botões/cartões e ícones do cabeçalho; fundos e sombras suavizados.
- 0.9.0: botão Gerenciar separado da alça de arraste; arquivamento reversível de qualquer tarefa, consulta de arquivadas e lote de concluídas nos filtros atuais. Pais com subitens não concluídos ficam fora do lote. Arquivo do pai oculta os filhos sem alterar seus conteúdos/revisões.
- Esquema de dados 4: migração automática dos esquemas 1–3, com IDs, Gist, chaves locais e status preservados. Atualizar os outros aparelhos antes de sincronizar; versões antigas rejeitam o novo esquema sem sobrescrever os dados.
- [Relatório desta atualização](reports/2026-11-05-arquivamento.md).
- Funcionalidades: áreas, prioridades, status, prazos, subitens, arraste, busca, cronograma, lembretes internos, backup, sincronização e histórico do navegador.
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
