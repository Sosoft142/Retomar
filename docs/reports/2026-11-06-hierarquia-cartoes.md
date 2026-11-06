# Revisão de hierarquia e usabilidade — 0.11.0

A captura enviada evidenciou uma falha de hierarquia: controles permanentes ocupavam mais espaço que o conteúdo. A revisão anterior aumentou áreas de ação sem resolver a leitura da lista.

## Mudanças

- Título com 17 px, quebra integral de linhas e peso destacado; prazo com 14 px e maior contraste.
- Prioridade e andamento apresentados como texto compacto, sem dois seletores grandes por cartão. A edição permanece na engrenagem, separada da alça de arraste.
- Conclusão acessível diretamente pelo marcador; arquivamento rápido das concluídas e restauração preservados.
- Adicionar subitem passa ao gerenciamento; o resumo de progresso só aparece quando existem filhos.
- Lembretes compartilham a hierarquia de conteúdo. Adiar e ocultar aviso ficam no gerenciamento da tarefa.
- Abas de arquivo leves, seletor compacto de áreas, agrupamento/visualização dentro de Filtros e um único botão flutuante de adicionar.
- Renderização de cartões e lista consolidada em taskView, evitando duas estruturas divergentes.

## Verificação

Revisão visual no navegador com dados fictícios, em quadros de 390 e 320 px. Na largura de 390 px, cartões simples mediram aproximadamente 150–153 px; o subitem com título longo mediu 186 px. Um pai expandido naturalmente cresce para mostrar o conteúdo dos filhos. Em 320 px não houve rolagem horizontal (largura útil e largura total iguais: 305 px, descontada a barra de rolagem do navegador).

Foram exercitados edição de prioridade/andamento, criação e expansão/recolhimento de subitem longo, conclusão, arquivamento, consulta de arquivadas, restauração e adiamento de lembrete pela engrenagem. Capturas preenchidas foram inspecionadas; não se tratou apenas de medir botões. Não houve teste em aparelho Samsung físico nem medição de FPS.

A validação completa usa npm run verify, incluindo a suíte existente, sintaxe, imports e espaço em branco. A CI deve aprovar a mesma árvore antes da integração.

## Contratos preservados

Esquema 4, conteúdo das tarefas, chaves locais, sincronização criptografada, identidade da instalação e cache offline preservados. Cache do service worker atualizado para distribuir os novos arquivos. O envio push real continua inativo: esta revisão visual não implanta o servidor.

## Consumo de tokens

Foram usados mapa/estado atual, buscas delimitadas, testes relacionados durante a edição e um resumo da verificação completa, mantendo os logs detalhados locais. A publicação transporta apenas as diferenças. Não há telemetria comparável para calcular redução percentual de tokens; não se atribui uma economia numérica sem medição. A revisão visual preenchida e a suíte completa foram mantidas.
