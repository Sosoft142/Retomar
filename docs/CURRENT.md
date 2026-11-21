# Estado atual — Retomar

- Versão **1.10.0**, cache offline **v51**. Produção: https://sosoft142.github.io/Retomar/
- **Academia integrada**: aba própria com o roteiro original publicado em 13/11/2026 (Pernas A, Superiores, Pernas B e Pernas C), orientações, caminhadas e demonstrações. Treinos e exercícios podem ser criados, editados, excluídos e reordenados; séries, repetições, descanso, carga e descrição são editáveis. Links de YouTube (incluindo Shorts) e Vimeo no texto geram miniaturas, com prévia no formulário e opção de imagem própria.
- Revisão da Academia: edição e salvamento conferidos no navegador em PC e iframe de 360 px, sem rolagem horizontal; miniaturas YouTube carregadas. Testes exercitam concorrência entre janelas, recuperação, backup, links e integração com o Planejamento. Não equivale a testar gestos/teclado nativos no Android.
- **Dados da Academia**: chave independente `entrelinhas-vida:gym:v1`, backup/restauração próprios e marcações por data local. Não faz parte do Gist ou do JSON do Planejamento; essa limitação aparece na interface. Mantém esquema 4 e dados históricos do Planejamento. Formulários recusam sobrescrever treino alterado em outra janela; falhas de gravação preservam o formulário, e dados corrompidos permitem cópia para recuperação. Módulos incluídos no cache offline; vídeos e miniaturas dependem de rede.
- Repositório `Sosoft142/Retomar`, branch `main`, app estático em `dist/`, sem framework ou dependências de execução.
- Em 15/11/2026, a titular pediu a remoção integral da integração Google Agenda. SDK, consultas, OAuth, compartilhamento da agenda, opções de conexão, serviço e comando de implantação foram removidos do código atual.
- **Meu dia foi removido**, incluindo navegação, ajustes, módulos e preferências. Links e histórico antigos voltam ao Planejamento.
- **Itens e subitens reunidos**: etapas aparecem sob o principal, abertas por padrão e recolhíveis, em Lista compacta, Cartões, todos os agrupamentos e Arquivadas. Agrupamento por prazo/prioridade usa o principal; os prazos, prioridades e estados individuais permanecem intactos. Subitem arquivado sozinho mantém seu principal ativo como contexto, fora da seleção em lote.
- Correção da tela inicial: buscar pelo principal mantém suas etapas, mesmo com títulos diferentes. Buscar somente uma etapa mantém o principal como contexto. Mostrar subitens permite revelar etapas recolhidas sem editar tarefas. Entrada HTML versionada e revalidação dos arquivos do shell reduzem carregamento de código antigo após atualizar.
- **Subitens com acesso direto**: botão + no próprio cartão principal, mesmo sem etapas; fica oculto em Arquivadas e durante seleção. Criar mantém área/vínculo e abre a família. Se os filtros ocultariam a nova etapa, a busca e os filtros são limpos com aviso.
- **Expandir/recolher todos**: o mesmo controle alterna conforme as famílias da visualização atual; conserva a preferência local e funciona também durante buscas.
- **Organização**: painel distingue formato/agrupamento da ordem dos itens e subitens, inclui título e mais recentes para etapas e permite restaurar o padrão. Filtros ativos têm remoção individual; Aplicar, Cancelar, favoritas e navegação preservados.
- Busca e filtros mantêm o principal das etapas correspondentes; paginação conserva a hierarquia em listas extensas. Ações rápidas, seleção, Desfazer, esquema 4, chaves históricas `entrelinhas-vida`, Gist e preferências push preservados. A atualização limpa somente preferências dos recursos retirados.
- O servidor preparado remove as rotas e a classe da agenda. A migração `v3-remove-agenda` exclui somente `AgendaAccount`; preserva `Device`, `DEVICES` e VAPID. A migração anterior permanece declarada por compatibilidade com o Worker já publicado.
- **Limpeza nas contas externas ainda manual**: publicar o Worker atualizado, excluir os três segredos da agenda, retirar a permissão na conta Google, excluir o cliente OAuth e, se existir, o arquivo remoto de preferências da agenda. [Guia completo](REMOVER-GOOGLE-AGENDA.md). A atualização do GitHub Pages não publica o Worker.
- Notificações: inscrição, entrega com o S24 fechado e vibração foram confirmadas pela titular; apresentação de pop-up no aparelho segue dependente do Android. Preservar o Worker `retomar-push`, as chaves VAPID e os dados Device.
- Histórico de navegação, confirmação de descarte, identidade PWA, backup e funcionamento offline são contratos existentes.
- Validação desta revisão: testes integrados cobrem criação pelo + nos dois formatos e quatro agrupamentos, alternância global com busca, remoção individual de filtros, cancelamento, ordem/favoritas e criação sob filtros. Revisão visual no navegador isolado em PC e iframe de 360 px; não equivale a testar teclado e gestos nativos no Android. Suíte completa e CI obrigatórios antes da integração.

## Verificação e publicação

- `npm test`: suíte atual completa.
- `npm run verify`: suíte, sintaxe, imports e diferenças; logs em `.work/`.
- `npm run release:prepare -- --base REF`: pacote e integridade das alterações verificadas.
- CI obrigatório antes de integrar; Pages publica somente alterações de `dist/`.
- Histórico técnico: [até 0.8.2](history/README-0.8.2.md), [ações e visualizações](reports/2026-11-10-acoes-e-visualizacoes.md), [paridade PC/celular](reports/2026-11-13-paridade-pc-celular.md).
