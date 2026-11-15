# Estado atual — Retomar

- Versão **1.7**, cache offline **v47**. Produção: https://sosoft142.github.io/Retomar/
- Repositório `Sosoft142/Retomar`, branch `main`, app estático em `dist/`, sem framework ou dependências de execução.
- Em 15/11/2026, a titular pediu a remoção integral da integração Google Agenda. SDK, consultas, OAuth, compartilhamento da agenda, opções de conexão, serviço e comando de implantação foram removidos do código atual.
- **Meu dia permanece para tarefas do Retomar**: um/sete dias, Lista/Cartões, busca, área, prioridade, andamento, criação na data escolhida, gerenciamento, ações rápidas, seleção do Planejamento e Desfazer preservados. A preferência Mostrar/Ocultar Meu dia é local e independente de autorização externa.
- A atualização migra somente a preferência de visibilidade e apaga as duas antigas chaves locais da integração. Dados das tarefas, esquema 4, chaves históricas `entrelinhas-vida`, Gist, credenciais de sincronização e preferências push preservados.
- O servidor preparado remove as rotas e a classe da agenda. A migração `v3-remove-agenda` exclui somente `AgendaAccount`; preserva `Device`, `DEVICES` e VAPID. A migração anterior permanece declarada por compatibilidade com o Worker já publicado.
- **Limpeza nas contas externas ainda manual**: publicar o Worker atualizado, excluir os três segredos da agenda, retirar a permissão na conta Google, excluir o cliente OAuth e, se existir, o arquivo remoto de preferências da agenda. [Guia completo](REMOVER-GOOGLE-AGENDA.md). A atualização do GitHub Pages não publica o Worker.
- Notificações: inscrição, entrega com o S24 fechado e vibração foram confirmadas pela titular; apresentação de pop-up no aparelho segue dependente do Android. Preservar o Worker `retomar-push`, as chaves VAPID e os dados Device.
- Histórico de navegação, confirmação de descarte, identidade PWA, backup e funcionamento offline são contratos existentes.
- Validação: regressões de remoção e limpeza local, fluxos de tarefas e sincronização, paridade PC/celular e publicação push no Windows. A revisão visual deve usar uma sessão isolada, sem acesso às contas privadas da titular.

## Verificação e publicação

- `npm test`: suíte atual completa.
- `npm run verify`: suíte, sintaxe, imports e diferenças; logs em `.work/`.
- `npm run release:prepare -- --base REF`: pacote e integridade das alterações verificadas.
- CI obrigatório antes de integrar; Pages publica somente alterações de `dist/`.
- Histórico técnico: [até 0.8.2](history/README-0.8.2.md), [ações e visualizações](reports/2026-11-10-acoes-e-visualizacoes.md), [paridade PC/celular](reports/2026-11-13-paridade-pc-celular.md).
