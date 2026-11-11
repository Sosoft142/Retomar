# Retomar

Planejamento de vida em PWA. Produção: https://sosoft142.github.io/Retomar/

- [Estado atual e pendências](docs/CURRENT.md)
- [Mapa de código e testes](docs/MAP.md)
- [Orientação para desenvolvimento](AGENTS.md)
- [Comandos e publicação](scripts/README.md)
- [Histórico técnico completo até 0.8.2](docs/history/README-0.8.2.md)
- [Histórico de versões](CHANGELOG.md)

Dados locais e sincronização via Gist permanecem como antes. O servidor de notificações push está publicado; inscrição, entrega com o app fechado e vibração foram confirmadas pela titular no S24. O diagnóstico no app distingue agendamento aceito e recebimento real.

1.4: visão Meu dia com tarefas e consulta opcional do Google Agenda. Requer configuração OAuth e autorização da titular para acessar eventos privados. A versão 1.3 anterior está preservada para retorno. [Configurar e voltar à versão anterior](docs/GOOGLE-AGENDA.md) · [Relatório](docs/reports/2026-11-11-google-agenda.md).

Execute `npm ci --ignore-scripts` para instalar as dependências de teste. `npm test` mantém a suíte completa. `npm run verify` executa as verificações e apresenta um resumo, preservando o log completo em `.work/verification.log`. A dependência de DOM é usada somente nos testes em Node; o app publicado continua sem dependências de execução.
