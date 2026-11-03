# Estado atual — Retomar

- Produto: PWA Android/Chrome, prioritariamente celular Samsung S24.
- Versão do app: **0.8.2**. URL: https://sosoft142.github.io/Retomar/
- Repositório: `Sosoft142/Retomar`; produção na branch `main`; arquivos públicos em `dist/`.
- Sem framework/bundler de produção; módulos JavaScript e CSS estático.
- Dados locais e Gist criptografado preservam os identificadores históricos `entrelinhas-vida`.
- Funcionalidades: áreas, prioridades, status, prazos, subitens, arraste, busca, cronograma, lembretes internos, backup, sincronização e histórico do navegador.
- Google Agenda removido. Push: preferências gerais e por tarefa, prévia e servidor preparado; **envio real inativo**, sem conta/implantação Cloudflare disponível.
- Preferências de notificações e ajustes por tarefa são por aparelho; não são sincronizados pelo Gist.
- Última suíte do produto antes desta manutenção: 203 testes aprovados. Resultado da fonte atual: `npm run verify`; logs não são documentação de estado permanente.
- Esta manutenção muda orientação, documentação e ferramentas de desenvolvimento; não altera os arquivos públicos, dados ou versão do app.

## Verificação e publicação

- `npm test`: suíte completa existente, sem redução.
- `npm run verify`: execução completa com resumo e log detalhado em `.work/`.
- `npm run release:prepare -- --base REF`: diferenças, integridade de `dist/`, confirmação de verificação atual e pacote de alterações para o conector.
- CI executa verificação completa; Pages só republica quando `dist/` muda ou há acionamento manual.
- Fonte atual e Git são a referência para comportamento; consultar o histórico apenas para investigar decisões antigas.
