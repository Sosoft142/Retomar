# Retomar 1.3 — ações rápidas e visualizações

## Entrega

- Toque no prazo, na prioridade ou no andamento para abrir um formulário compacto. Cancelar, validação de data/horário e confirmação de descarte são preservados.
- Desfazer na barra e no aviso reverte a última alteração da sessão, incluindo edições, conclusão, área, reordenação, arquivamento e exclusão. Restaura apenas registros envolvidos, atribui revisões novas e recusa alterações posteriores nesses registros. Não persiste após recarregar e não oferece refazer.
- Selecionar troca temporariamente conclusão por seleção. Selecionar exibidas alcança apenas tarefas montadas na lista, incluindo subitens expandidos. Filtros alterados limpam a seleção. O painel permite prazo, área, prioridade, andamento e arquivar/restaurar. O lote inteiro é recusado se um registro mudou. Mudar data preserva horários próprios por padrão; remover prazo limpa data e horário. Transferir um subitem exige selecionar seu pai; os demais subitens acompanham a mudança de área do pai.
- Visualizações favoritas guardam área, busca, filtros, arquivo/ativas, formato, agrupamento, ordenação e ordem dos subitens neste aparelho. Até 20 nomes, com validação de duplicatas, renomeação e remoção. Armazenamento separado das tarefas, sem credenciais ou conteúdo dos itens. Não são incluídas no Gist ou no JSON de tarefas.

## Verificação e limites

Testes de domínio e repositório exercitam atomicidade, meia-noite, hierarquia, exclusão, arquivo, reordenação, conflitos e convergência de registros. Testes integrados em Node com jsdom executam a inicialização real de `app.js` e os fluxos de formulários, seleção, reversão e favoritas. O jsdom não abre navegador e não carrega recursos externos; autenticação e notificações reais não são acionadas. A dependência é somente de desenvolvimento, com instalação reproduzível no CI.

Suíte completa, sintaxe, imports e diferenças devem passar em `npm run verify` antes de integrar. O resultado fica em `.work/verification.log`; o CI confirma a fonte enviada.

A revisão automática bloqueou a abertura do preview local por considerar a ação incompatível com a proibição explícita de acesso ao navegador. Nenhum navegador foi acessado nesta entrega. Não houve revisão visual, medição de layout, nova instalação no S24, sincronização com a conta real ou entrega real de push. Essas verificações permanecem pendentes; testes de lógica e de DOM não as substituem.

## Conferência nos aparelhos reais — pendente

1. Conferir versão 1.3 no PC e no S24. Usar uma tarefa de teste e baixar uma cópia antes da conferência.
2. Criar a tarefa no PC; abrir o S24 e confirmar título, prazo e prioridade. Editar no S24 e conferir no PC após a confirmação da nuvem.
3. No S24 sem conexão, editar a tarefa. Reabrir o app ainda offline e conferir a persistência. Reconectar e verificar a mesma alteração no PC.
4. Usar edição rápida e lote, conferir subitens e testar Desfazer antes de fazer outra alteração. Conferir salvar/cancelar e teclado em tela estreita.
5. Aplicar uma favorita após recarregar o mesmo aparelho. Favoritas são locais, portanto não devem aparecer automaticamente no outro aparelho.
6. Usar o teste de notificações com app fechado, bloquear o S24 e conferir recebimento, horário, vibração e pop-up. O serviço aceitar o teste não comprova a apresentação no aparelho.

## Contratos preservados

Sem mudança no esquema 4, nas chaves de tarefas, na criptografia, na identidade da instalação ou no servidor push. O cache offline passa a incluir os dois módulos novos. A publicação permanece no mesmo GitHub Pages.
