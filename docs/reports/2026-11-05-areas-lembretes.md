# Retomar 0.10.0 — áreas, lembretes e espaçamento

## Resultado

1. Áreas: substituição da grade permanente por seleção compacta de área e botão Organizar áreas. A seleção mantém filtros e histórico; criação, edição e reordenação ficam na tela de organização. Itens ainda podem mudar de área por Gerenciar → Mover/organizar e pelo agrupamento por área.
2. Central: cada lembrete tem Gerenciar, com a edição completa, arquivamento, organização e notificações da tarefa, e Concluir. O título passa a ser texto. Abrir e salvar o gerenciamento conserva a central em vez de mudar para Planejamento.
3. Ações temporárias: Adiar e Ocultar até amanhã ficam em Opções do aviso, separadas das ações da tarefa, com explicação e Desfazer. Não alteram o prazo nem concluem/arquivam a tarefa.
4. Configurações: a central diferencia Mostrar, Quais prazos exibir e Ao tocar em Adiar; fuso e reativação ficam em uma seção avançada. Notificações com o app fechado têm seção separada e prévia recolhida. Preferências, IDs de controles e validações preservados. O servidor push continua inativo; esta atualização não ativa envio.
5. Cores: prioridade urgente vermelha, alta laranja, normal azul e baixa cinza, sempre acompanhada de texto. Andamento tem rótulo explícito e aspecto neutro; conclusão mantém a marca de verificação. Cores de áreas continuam nas identificações da área.

## Verificação de uso e espaçamento

Dados exclusivamente fictícios no Chrome de teste, sem Gist pessoal ou envio push real. Filtrar Estudos retornou a tarefa correspondente; gerenciar um lembrete, editar o título e salvar manteve a central. Ocultar até amanhã removeu o aviso e Desfazer o restaurou. Opções da central foram alteradas e salvas. Arquivar pelo gerenciamento na central e tocar em Ver arquivadas levou à lista arquivada; o atalho foi corrigido para abrir Planejamento quando acionado de outra tela.

Inspeção em frames de 320 e 390 px. Capturas simultâneas inicialmente falharam; a revisão foi concluída com uma tela por vez. A seleção de áreas mediu cerca de 67 px de altura em 320 px. Largura de rolagem igual à largura útil observada nas duas larguras; caixas de configuração sem transbordamento horizontal. Ações dos lembretes têm altura mínima de 44 px e intervalo de 12 px, quebrando para linhas separadas quando necessário.

A inspeção identificou e corrigiu uma regra flex antiga que aumentava os seletores para cerca de 105 px de altura. Agora medem 44 px. Em 320 px, prioridade e andamento ficam em linhas separadas para exibir Em andamento integralmente; em cartões de 390 px, os seletores de andamento mediram 160 × 44 px. Sem teste em S24 físico nem medição nova de FPS ou latência.

A suíte completa continua obrigatória por npm run verify e CI; novos testes verificam os pontos de acesso do gerenciamento na central e a separação de configurações sem retirar controles existentes. Esquema 4, IDs, chaves locais, criptografia e sincronização mantidos.

## Economia de tokens

Foram usadas leitura por área, pesquisas de símbolos, testes direcionados e saída resumida da suíte completa, preservando o log detalhado. A revisão visual foi mantida e ampliada após encontrar defeitos. Não há contagem disponível para afirmar percentual comprovado de redução de tokens.
