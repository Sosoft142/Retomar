# Retomar 0.9.0 — gerenciamento e arquivo

## Alterações

- Botão Gerenciar com ícone de engrenagem e borda própria, presente em cartões, lista, cronograma e subitens. O título passa a ser texto; seis pontos servem apenas para arrastar e mover pelas setas do teclado.
- Gerenciar abre os campos de edição e ações de arquivar/restaurar, mover/organizar e notificações. Alterações não salvas continuam exigindo confirmação antes de sair.
- Qualquer status pode ser arquivado. Concluídas têm atalho Arquivar. Ativas/Arquivadas permite consulta, busca e restauração; também participa do histórico de voltar/avançar.
- Arquivar concluídas atua nos filtros atuais, após confirmação. Pais com subitens não concluídos são preservados. Não há arquivamento automático ao concluir.
- Arquivar o pai oculta os filhos do planejamento e dos lembretes, sem editar seus conteúdos/revisões. A restauração do pai preserva filhos arquivados individualmente. Para restaurar um filho de pai arquivado, primeiro restaure o pai.
- Arquivamento acompanha o backup e a sincronização criptografada. O esquema 4 migra automaticamente esquemas 1–3, sem alterar IDs, chaves locais, status, conteúdo e revisões existentes. Versões antigas não abrem o esquema novo: atualizar os outros aparelhos antes de sincronizar.

## Verificação

Testes novos cobrem migração, todos os status, hierarquia, lote filtrado, proteção contra edição concorrente, convergência da sincronização, persistência, restauração após exclusão, backup criptografado e remoção dos lembretes internos/push. O teste de capacidade de 20.000 registros foi atualizado para o novo campo obrigatório, mantendo o mesmo limite e validações. A suíte completa é executada por npm run verify, com log em .work/verification.log, e pela CI antes de integrar.

No Chrome de teste, dados fictícios: abrir Gerenciar, salvar status, arquivar concluída pelo cartão, consultar e restaurar, arquivar pendente pelo formulário e executar o lote após confirmação. Inspeção visual em frames de 390 e 320 px, incluindo lista e caixa de edição. Sem teste em S24 físico. O servidor push continua inativo; a verificação do agendamento é local, sem prova de entrega real.

## Economia de tokens

Leitura do estado e mapa do projeto, pesquisas por símbolos, testes direcionados durante ajustes e log completo com saída resumida na verificação final. Não foram removidos testes nem verificações para reduzir contexto. Não há contagem disponível que permita informar percentual comprovado de redução de tokens.
