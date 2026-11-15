# Retomar

Planejamento de vida em PWA. Produção: https://sosoft142.github.io/Retomar/

- [Estado atual e pendências](docs/CURRENT.md)
- [Mapa de código e testes](docs/MAP.md)
- [Orientação para desenvolvimento](AGENTS.md)
- [Comandos e publicação](scripts/README.md)
- [Histórico técnico completo até 0.8.2](docs/history/README-0.8.2.md)
- [Histórico de versões](CHANGELOG.md)

Dados locais e sincronização via Gist permanecem como antes. O servidor de notificações push está publicado; inscrição, entrega com o app fechado e vibração foram confirmadas pela titular no S24. O diagnóstico no app distingue agendamento aceito e recebimento real.

1.7: integração Google Agenda removida do app e do código do servidor. Meu dia conserva as tarefas do Planejamento, Lista/Cartões, um/sete dias, filtros, ações rápidas e Desfazer. Preferências antigas da integração são limpas localmente; tarefas, sincronização e notificações permanecem. [Passo a passo da limpeza externa](docs/REMOVER-GOOGLE-AGENDA.md).

Execute `npm ci --ignore-scripts` para instalar as dependências de teste. `npm test` mantém a suíte completa. `npm run verify` executa as verificações e apresenta um resumo, preservando o log completo em `.work/verification.log`. A dependência de DOM é usada somente nos testes em Node; o app publicado continua sem dependências de execução.
