# Estado atual — Retomar

- Versão **1.8.1**, cache offline **v49**. Produção: https://sosoft142.github.io/Retomar/
- Repositório `Sosoft142/Retomar`, branch `main`, app estático em `dist/`, sem framework ou dependências de execução.
- Em 15/11/2026, a titular pediu a remoção integral da integração Google Agenda. SDK, consultas, OAuth, compartilhamento da agenda, opções de conexão, serviço e comando de implantação foram removidos do código atual.
- **Meu dia foi removido**, incluindo navegação, ajustes, módulos e preferências. Links e histórico antigos voltam ao Planejamento.
- **Itens e subitens reunidos**: etapas aparecem sob o principal, abertas por padrão e recolhíveis, em Lista compacta, Cartões, todos os agrupamentos e Arquivadas. Agrupamento por prazo/prioridade usa o principal; os prazos, prioridades e estados individuais permanecem intactos. Subitem arquivado sozinho mantém seu principal ativo como contexto, fora da seleção em lote.
- Correção da tela inicial: buscar pelo principal mantém suas etapas, mesmo com títulos diferentes. Buscar somente uma etapa mantém o principal como contexto. Mostrar subitens permite revelar etapas recolhidas sem editar tarefas. Entrada HTML versionada e revalidação dos arquivos do shell reduzem carregamento de código antigo após atualizar.
- Busca e filtros mantêm o principal das etapas correspondentes; paginação conserva a hierarquia em listas extensas. Ações rápidas, seleção, Desfazer, esquema 4, chaves históricas `entrelinhas-vida`, Gist e preferências push preservados. A atualização limpa somente preferências dos recursos retirados.
- O servidor preparado remove as rotas e a classe da agenda. A migração `v3-remove-agenda` exclui somente `AgendaAccount`; preserva `Device`, `DEVICES` e VAPID. A migração anterior permanece declarada por compatibilidade com o Worker já publicado.
- **Limpeza nas contas externas ainda manual**: publicar o Worker atualizado, excluir os três segredos da agenda, retirar a permissão na conta Google, excluir o cliente OAuth e, se existir, o arquivo remoto de preferências da agenda. [Guia completo](REMOVER-GOOGLE-AGENDA.md). A atualização do GitHub Pages não publica o Worker.
- Notificações: inscrição, entrega com o S24 fechado e vibração foram confirmadas pela titular; apresentação de pop-up no aparelho segue dependente do Android. Preservar o Worker `retomar-push`, as chaves VAPID e os dados Device.
- Histórico de navegação, confirmação de descarte, identidade PWA, backup e funcionamento offline são contratos existentes.
- Validação: regressões de remoção e limpeza local, fluxos de tarefas e sincronização, paridade PC/celular e publicação push no Windows. Nesta revisão o ambiente local e o navegador isolado estão indisponíveis: verificação completa e preparação da publicação são executadas pelo CI; a conferência visual no aparelho da titular continua pendente.

## Verificação e publicação

- `npm test`: suíte atual completa.
- `npm run verify`: suíte, sintaxe, imports e diferenças; logs em `.work/`.
- `npm run release:prepare -- --base REF`: pacote e integridade das alterações verificadas.
- CI obrigatório antes de integrar; Pages publica somente alterações de `dist/`.
- Histórico técnico: [até 0.8.2](history/README-0.8.2.md), [ações e visualizações](reports/2026-11-10-acoes-e-visualizacoes.md), [paridade PC/celular](reports/2026-11-13-paridade-pc-celular.md).
