# Verificação 0.7.3 — cabeçalho, ícones e brilho da nuvem

160 testes existentes aprovados. Esta atualização altera o cabeçalho, os desenhos e o CSS dos ícones; domínio, formulários e protocolo de sincronização não foram alterados.

QA isolado retomar-073-qa com dados fictícios e estados da nuvem simulados visualmente, sem credenciais ou chamadas de sincronização reais. Cabeçalho revisado em 320, 360, 390, 650, 768, 900 e 1100 px, sem rolagem horizontal. Subtítulo permanece à direita do nome e os centros verticais do símbolo, nome, subtítulo e controles do cabeçalho coincidem (tolerância inferior a 0,02 px). Na menor largura o nome e a assinatura diminuem para caber completos.

Traço computado dos ícones no planejamento, nas configurações e no formulário de adicionar item: 1,7 px. Formulário aberto e fechado normalmente, sem transbordamento horizontal. O contorno dos filtros deixou de usar círculos preenchidos; nuvem recebeu curva limpa e leve. Formas SVG preservam a espessura ao mudar de tamanho.

Cinco estados visuais conferidos: local, pendente e erro sem brilho ou animação; sincronizando com retomar-cloud-glow; confirmado com o mesmo brilho verde fixo e sem animação. Nenhum texto ou check foi adicionado à nuvem. Com movimento desativado, a animação é removida e o brilho permanece estático. Regra global existente de movimento reduzido também desativa animações. O brilho é um drop-shadow de 2–4 px no contorno, sem fundo ou halo circular.

Cache shell-v20. Captura visual local retomar-073-cabecalho.jpg registra planejamento e configurações em duas larguras de celular. O ensaio visual não mede uma sincronização real; o motor permanece coberto pelas suítes existentes.

# Verificação 0.7.2 — somente adição simples e orientação de notificações

160 testes aprovados. Foram retirados os testes exclusivos do adaptador OAuth/Calendar API removido. Permanecem aprovadas as suítes de domínio, hierarquia, persistência, concorrência, sincronização GitHub, criptografia, instalação, formulários, datas/fusos, lembretes internos e links de agenda.

A migração de preferências 1 para 2 foi exercitada com envio direto antigo, ID inválido, cores repetidas e agenda de destino anterior: campos aposentados são retirados e as opções comuns, lembretes e adiamentos são preservados. Gravação bloqueada mantém a adição simples em memória sem sobrescrever os bytes antigos. Ajuste comum inválido recusa a migração e sinaliza o erro; dados de tarefas não são alterados.

QA isolado retomar-072-qa com tarefas fictícias e preferência antiga de modo direto carregada na abertura. Itens e subitens renderizaram links nativos, e as configurações passaram a mostrar somente o fluxo simples. Não há botões de conexão Google, campos OAuth, modo, agenda de API ou aviso automático. Ajuda de notificações aberta no cartão e no formulário; explica a escolha no Google antes de Salvar e o uso do padrão da agenda.

Duração de 45 minutos e horário padrão 08:15 salvos em tela de 320 px, refletidos no cartão. Ajuda e formulário revisados em 320, 390, 650 e 1100 px sem rolagem lateral, inclusive com fonte de 22 px em 320 px. A lista e o formulário mantêm seus controles, e a instrução de notificação não afirma aplicar um alarme automaticamente.

Imports locais e todos os recursos do cache foram conferidos. O módulo de autorização e escrita no Google foi excluído; nenhum módulo distribuído referencia Google Identity Services, createGoogleSession ou GoogleCalendarAdapter. Cache v19, app 0.7.2, tarefas no esquema 3. Não houve criação de evento real nem teste de entrega de notificações em telefone físico; a cor, o aviso e o salvamento final são ações no Google Agenda. Instalação física e Gist autenticado não foram revalidados nesta alteração.

# Verificação 0.7.1 — adição simples no Google Agenda

183 testes aprovados (172 anteriores e 11 novos). Os cenários novos cobrem links nativos de itens/subitens, prazo próprio, títulos escapados e codificados, ajuda sem confirmação falsa, cópia automática/manual, item sem data abrindo edição, ativação do modo simples preservando tarefas e preferências, quota e cancelamento de autorização sem envio. O modo simples ignora o destino antigo do envio direto.

QA isolado com chaves retomar-071-qa, dados fictícios e integração direta simulada; nenhuma conta real ou credencial usada. No navegador, duração de 45 minutos e horário padrão 08:15 foram salvos sem OAuth e refletidos na outra janela. ID incompleto foi recusado no modo direto; voltar ao simples permitiu salvar mesmo após editar ID inválido e cores repetidas. Ativação do direto com ID fictício e retorno pelo botão Usar sem configuração conferidos. Não houve gravação real no Google.

Clique no link nativo do subitem abriu uma aba externa. Em sessão anônima, o Google apresentou sua página de divulgação, como na revisão anterior. A montagem de título, data, horário e duração foi conferida no link e nos testes; preenchimento após login e salvamento real não foram validados ao vivo. A ajuda Não abriu? abriu o diálogo com links nativos para nova aba/mesma aba e cópia; copiar o link retornou a confirmação de cópia. A alternativa manual foi exercitada automaticamente sem Clipboard API.

Diálogo de ajuda e formulário de ajustes conferidos sem rolagem horizontal em 320, 390, 650 e 1100 px. Fonte de 22 px conferida em 320 px, inclusive valor completo de modo extenso abaixo do seletor. Configuração técnica recolhida por padrão no modo simples. Esquema 3 mantido, versão 0.7.1 e cache v18; Gist, criptografia, identidade de instalação e dados de tarefas não alterados. OAuth autenticado, instalação física e comportamento do seletor Android não foram revalidados.

# Verificação 0.7.0 — lembretes e Google Agenda

## Testes automatizados

172 testes aprovados: 119 anteriores e 53 novos cenários. A suíte de prazos cobre itens/subitens, exclusão e conclusão, data sem horário, virada do dia em outro fuso, antecedência, atrasados, ordem por prazo, adiamento, dispensar hoje, mudança de fuso, persistência e falhas de armazenamento. Transições de horário de verão incluem horário inexistente, primeira ocorrência de horário ambíguo e dia que começa depois da meia-noite.

Eventos testados com campos próprios do subitem, contexto do pai, quatro cores distintas, duração, horário padrão, dia inteiro com término exclusivo, fim de ano, ano bissexto, avisos padrão/nenhum/minuto zero/antecedência, observações opcionais escapadas, links de retorno e IDs estáveis em caracteres aceitos pelo Google. O vínculo estável independe de Web Crypto; a primeira tentativa no preview HTTP identificou essa dependência e a implementação foi ajustada. Criptografia da sincronização GitHub permanece inalterada.

Adaptador Google testado com transporte simulado: criação e releitura, reenvio por PATCH, revisão por If-Match, envios concorrentes, resposta perdida após criação, recuperação de 409, vínculo inesperado, evento excluído, 412, cor/título/prazo divergentes na confirmação, expiração, permissão negada, quota, codificação do destino e paginação de agendas próprias. Sessão OAuth simulada cobre escopos mínimos solicitados, memória sem persistir token, validade, cancelamento, negação, resposta malformada, pop-up compartilhado, descarte de retorno tardio, troca de cliente e repetição de carregamento após falha.

A validação genérica de texto mantém a mensagem específica do ID OAuth quando o campo obrigatório está vazio. Nenhuma credencial real foi usada nos testes.

## Navegador e interface

- Cópia de QA com dados fictícios, namespace retomar-070-qa, service worker desativado somente nessa cópia e Google explicitamente simulado. Fixtures e adaptadores de teste ficam fora da distribuição.
- Resumo e sino mostram os prazos esperados; pai distante não oculta um subitem próximo. Data, horário, prioridade, tipo e contexto do item principal aparecem na central.
- Adiar e desfazer conferidos; dispensar hoje persistiu após recarga e limpar avisos reativou a etapa. Concluir retirou o lembrete; reabrir a tarefa voltou a exibi-lo. Desativar avisos mostrou o estado vazio apropriado e contador zero.
- Antecedência, atrasados e intervalo de adiamento conferidos; alterações apareceram também na outra janela. Cabeçalho em 320 px mantém sino, nuvem e engrenagem sem sobreposição.
- Google Agenda: ausência de data abriu a edição da tarefa. Modo direto sem ID público, ID malformado, fuso inválido e cores repetidas foram recusados. Os campos de cores/avisos ficam desativados no modo de preparação, com explicação visível. Foram conferidas duração, aviso e escolha de agenda na simulação.
- Envio simulado de subitem criou um evento; reenviar manteve um único evento e confirmou atualização. Quatro tarefas exercitaram cores 11/6/9/3. Escolher outra agenda gerou um vínculo separado para a etapa no novo destino. Não houve escrita em agenda real.
- Abertura do modo de preparação exerceu o botão real com tarefa fictícia. No navegador anônimo, o Google redirecionou à página pública do Calendar; não houve login nem salvamento. Os parâmetros do link foram conferidos automaticamente, e o preenchimento após login permanece sem validação ao vivo.
- Planejamento, Cronograma, Lembretes e Configurações sem rolagem lateral em 320, 390, 650 e 1100 px. Formulário de Google Agenda conferido nas quatro larguras e com texto de 22 px em 320 px. Lembretes também conferidos com texto ampliado. Mensagens e controles permanecem visíveis na rolagem do diálogo.

## Limites e ativação externa

A autorização real do Google não foi executada. É necessário um ID público de cliente OAuth próprio, origem autorizada e permissão da conta para testar o envio autenticado e os avisos reais. O modo padrão de preparação abre o Google para o usuário conferir e salvar; não confirma criação nem aplica cores pela URL. Conexões do ChatGPT não são credenciais de execução do app estático.

Os lembretes internos são calculados com o Retomar aberto ou retomado. O app não agenda notificações de sistema em segundo plano; alertas com ele fechado dependem do Google Agenda. Preferências e adiamentos são locais; os dados das tarefas continuam na sincronização GitHub. Esquema 3 mantido, versão 0.7.0 e cache v17. Instalação física, seletor Android e sincronização autenticada real não foram revalidados nesta alteração.

# Verificação 0.6.1 — horários e caixas de formulário

## Testes automatizados

119 testes aprovados, com 14 novos cenários em tests/forms.test.mjs. Todos os 1440 minutos do dia são aceitos com data; meia-noite, ano bissexto e extremos de 1900–2200 exercitados. Data impossível, horário fora do intervalo, segundos e campos parcialmente preenchidos recusados com mensagens específicas. Eventos input e change atualizam a dependência dos campos sem esperar a perda de foco. Hora digitada antes da data ou durante uma edição parcial não é descartada; limpar a programação requer o comando explícito. Persistência/reabertura e backup conservam o horário independente do subitem; falhas de validação deixam os bytes anteriores intactos. As suítes existentes de domínio, concorrência, criptografia, transporte, instalação e hierarquia permanecem aprovadas.

## Navegador e interface

- Dados exclusivamente fictícios, chaves retomar-061-qa e registro de service worker desativado apenas na cópia de QA. Nenhum token ou Gist pessoal utilizado. Páginas auxiliares e ajustes de QA não entram na distribuição.
- Reprodução: subitem sem data tinha horário desativado. Data preenchida primeiro liberava o campo e permitia salvar. Na correção, criação e edição aceitam o horário primeiro; salvar sem data mostra a mensagem junto à data e mantém o horário digitado. Correção posterior, gravação, reabertura e cronograma conferidos, inclusive 00:00, 00:05, 14:30 e 23:59.
- Título só com espaços recusado junto ao campo. Título de 200 caracteres com acentos e emoji gravado e reaberto; observações com 5000 caracteres e trecho HTML literal preservadas. Um preenchimento acima de 5000 foi bloqueado sem descartar o restante do formulário. Datas anteriores a 1900 e hora com segundos provocaram erros próprios; correções permitiram salvar.
- Nome de área com 60 caracteres conferido e salvo. Nome duplicado com espaços e caixa diferente recusado. Títulos e nomes extensos quebram linha; o ajuste de altura inclui a borda e responde à mudança de largura, evitando um corte de dois pixels observado no título extenso.
- Organizar subitem mostra o nome completo de área de 60 caracteres e pai de 200 caracteres. Alterar a área atualiza vínculo, posições e seus textos auxiliares. Destino extenso de exclusão de área conferido sem executar a exclusão.
- Formulário de sincronização com token fictício de formato inválido apresenta erro antes de consultar o GitHub. Rótulos e caixas cabem em 320 px. Descarte de edição confirmado no diálogo nativo do navegador.
- Lista compacta, cartões e formulário de edição revisados em 320, 390, 650 e 1100 px sem rolagem lateral. Caixa de título de 200 caracteres, campos e cartões também conferidos com texto de 22 px em tela de 320 px. Configurações e versão no final da página conferidas.

## Compatibilidade e limites

Esquema 3, identidade da instalação, chaves locais, Gist e credenciais preservados. Cache v16 e versão 0.6.1. O horário continua vinculado a uma data; um compromisso sem data permanece permitido sem horário. Não houve migração nova nem alteração no protocolo de sincronização. Sincronização autenticada entre aparelhos, instalação física e seletor nativo em Android real não foram revalidados; a revisão interativa ocorreu no Chrome em larguras móveis.

# Verificação 0.6.0 — expansão e hierarquia

## Testes automatizados

- 105 testes aprovados: os 79 existentes e 26 novos casos de subitens. A suíte inclui 2.000 operações aleatórias anteriores e mais 400 operações reproduzíveis com criação, reordenação, transferência, exclusão, desfazer, mudança de área e combinação de etapas.
- Persistência e exportação/importação preservam IDs, vínculos, prioridades, status, prazos, notas, ordem e marcadores de exclusão. Migração do esquema 2 conserva todos os campos anteriores; migração do esquema 1 continua convertendo cores e ordem. A origem não é alterada pela migração.
- Validação rejeita pais ausentes, ciclos, níveis adicionais, referências inseguras e áreas incoerentes. Operações inválidas não gravam alterações parciais.
- Ordem manual das etapas não altera a ordem nem as revisões dos pais. Troca de área do pai atualiza a área herdada sem criar uma edição de conteúdo no filho. Conclusão do pai é independente da conclusão das etapas.
- Exclusão do pai e Desfazer tratam o grupo; não ressuscitam etapas já excluídas e rejeitam alterações concorrentes antes de restaurar parcialmente. Backup antigo cria tombstones para etapas ausentes na restauração.
- Combinação testada com criações offline independentes, edições em etapas diferentes, mudança de área do pai com nota offline no filho, subitem criado enquanto o pai é excluído e ciclos provocados por reorganizações concorrentes. Resultados válidos, comutativos e idempotentes nos cenários exercitados.
- AES-GCM real preserva os vínculos no envelope e não expõe títulos. Motor com transporte simulado migra cópia remota do esquema 2, envia novos subitens e relê antes de confirmar.

## Navegador e interface

- Revisão somente com dados fictícios e chaves retomar-060-qa, sem token ou Gist pessoal. Adaptadores de QA, fixtures e páginas auxiliares não fazem parte da distribuição.
- Criação de subitem pelo formulário com título, prioridade urgente e data; campo vazio recusado. Área herdada desabilitada no formulário, com explicação visível. Item novo apareceu dentro do pai, que foi expandido automaticamente.
- Recolhimento permaneceu após recarga. Ordenação por prioridade e manual conferidas; seta do teclado e arraste real entre duas etapas alteraram a ordem e mantiveram a hierarquia.
- Formulário Organizar transferiu uma etapa para outro pai em outra área. Busca por seu título mostrou somente o pai correspondente e a etapa. O cronograma apresentou a data do subitem e permitiu voltar ao pai expandido.
- Contador de etapas concluídas atualizado na interface. Concluir o pai não concluiu as etapas; título de uma etapa pendente permaneceu sem tachado dentro do pai encerrado.
- Telas de 320, 390, 650 e 1100 px sem rolagem lateral; lista compacta e cartões conferidos. Texto dos controles ampliado a 160% sem transbordamento do corpo nas telas de celular.
- Lista de 120 subitens montou 60 inicialmente; Mostrar mais revelou os 120 e a busca encontrou o subitem 119. Contagens e backup continuam incluindo a lista completa.
- Exclusão/desfazer do grupo foi validada automaticamente. A tentativa adicional de conferência via diálogo nativo do navegador encontrou uma falha de controle da janela de teste e não é contada como verificação visual concluída.

## Compatibilidade e limites

Esquema 3 e cache v15. A origem do app, manifest, appId, chaves de dados e credenciais são preservados. É necessário atualizar/reabrir o app em todos os aparelhos na versão 0.6.0 ou posterior para interpretar os subitens; o backup antigo é migrado automaticamente. A expansão é preferência local.

Sincronização autenticada entre aparelhos, instalação física e gesto de toque prolongado em celular real não foram revalidados. O arraste foi exercitado com ponteiro no Chrome; concorrência e criptografia foram exercitadas com dados fictícios nos testes automatizados.

# Verificação 0.5.7 — retirada dos efeitos dos botões e da nuvem

- Dez testes direcionados de interface de sincronização e instalação aprovados, sem mudança de comportamento do motor ou dos dados.
- CSS revisado: removidos os ciclos de gradiente, reflexo e borda de luz dos botões e da barra de ações; excluídos seus keyframes e regras de pausa sem uso.
- A nuvem em atividade usa somente o keyframe de opacidade retomar-cloud-pulse, de 1 s. Não há pseudo-elemento circular de giro ou filtros de brilho; indicadores das configurações também ficam sem halo. Estado confirmado permanece verde fixo.
- Rótulos acessíveis, estados cinza/verde/vermelho e restrições de movimento reduzido mantidos. Sem texto ou visto visível no cabeçalho. Cache v14.
- A verificação desta alteração é de código e testes automatizados; não houve nova revisão em navegador ou aparelho físico.

# Verificação 0.5.6 — conferência visual da seta

- O cálculo do espaço interno não considerava a área adicional usada pela seta nativa. Uma captura revelou a última letra de Urgente cortada em 320 px.
- Corrigido com appearance none e seta vetorial no fundo, limitada à área reservada à direita. O campo continua sendo um select nativo para teclado, leitor de tela e abertura das opções.
- Captura final em 320 e 390 px mostra Urgente e Em andamento completos. Sem rolagem lateral, nuvem com um único SVG sem texto ou visto e engrenagem à direita.
- As demais verificações de fonte ampliada, navegação e movimento da 0.5.5 permanecem aplicáveis. Cache v13; nenhuma alteração no protocolo ou nos dados.

# Verificação 0.5.5 — seletores, cabeçalho e movimento

- 79 testes automatizados aprovados, incluindo regressão para a nuvem sem texto visível, visto ou tooltip, com distinção acessível de atividade e confirmação.
- Revisão com dados fictícios em 320, 360, 390, 430, 650 e 1100 px: sem rolagem lateral; seletores de prioridade e status medidos pela fonte e pelo espaço interno. A captura posterior ainda identificou corte em Urgente em 320 px por causa da seta nativa, corrigido na 0.5.6.
- Texto ampliado a 160% (19,2 px nos controles) em 320 e 390 px: seletores mudam de linha, mantendo os valores completos e sem ultrapassar os cartões. Lista compacta e Cartões conferidos.
- Na largura de 320 px, o texto Urgente mediu 58 px em espaço útil de 71 px; Em andamento mediu 86 px em 106 px. As medidas são pontuais, dependem da fonte e do navegador.
- Cabeçalho com nuvem e engrenagem separadas por 5 px, cada uma com alvo de 44 × 44 px. Configurações abre pelo ícone, marca a página atual e mantém acesso às preferências, backup e instalação. Navegação principal com Planejamento e Cronograma; sem inscrição de armazenamento no rodapé.
- Nuvem contém um único SVG, sem texto, tooltip ou visto. Durante rodada simulada: aria-busy true, giro de luz e pulsação, verde vivo. Depois das leituras de conferência: aria-busy false, giro interrompido e brilho fixo. Rótulos acessíveis preservados.
- Ambiente de navegador HTTP usou adaptadores exclusivos de transporte e criptografia simulados, executando o motor de sincronização para conferir os estados visuais; nenhum token ou Gist pessoal foi usado. Esses adaptadores e os dados de QA não entram na publicação. A criptografia real continua coberta pela suíte automatizada.
- Efeitos de gradiente e brilho conferidos: órbita ambiente, marca, reflexo dos botões e bordas de luz. Foco na busca pausou os efeitos decorativos. Movimento Desativado removeu as animações da marca, ambiente e botões; Suave reativou a órbita. CSS de movimento reduzido e pausa quando a página fica oculta conferidos no código.
- Cache atualizado para v12. Protocolo de sincronização, releitura antes do verde, esquema de dados, chaves, manifesto e origem de instalação preservados.

Limites: aparência das barras nativas do Android, instalação física, desempenho das animações em celular real e sincronização autenticada entre aparelhos não foram revalidados nesta rodada.

# Verificação 0.5.4 — testes extremos

## Falhas reproduzidas e correções

| Cenário na 0.5.3 | Resultado após a correção |
| --- | --- |
| Título feito apenas de caracteres invisíveis era salvo | Erro junto ao campo, também bloqueado no domínio/importação |
| Dois requestSubmit consecutivos criavam dois itens | Uma gravação; testes com 100 envios simultâneos |
| Área Saúde podia ser repetida usando acento Unicode decomposto | Comparação NFC detecta a duplicata |
| Campos acima do maxlength inseridos programaticamente dependiam apenas da validação do domínio | Erro específico e foco no campo, incluindo detalhes recolhidos |
| Backup aceitava ID com NUL e campos extras com 20.000 níveis; combinação lançava RangeError | Rejeição antes de operações recursivas; cópia original intacta |
| Nome de área com 60 caracteres provocava largura de conteúdo de 533 px em janela de 320 px | Corpo com 305/305 px, metadados quebram linha |
| 1.000 itens montavam 29.511 elementos; uma busca levou 324 ms | Montagem limitada com Mostrar mais e busca sobre o conjunto completo |

## Verificações executadas

- 78 testes automatizados: os 60 anteriores e 18 novos cenários. O teste aleatório usa semente fixa 0x5eed053 e 2.000 operações de criação, edição, exclusão, desfazer, movimentação, restauração e persistência; também confere combinação comutativa e idempotente de alterações independentes.
- Domínio: 20.000 itens aceitos, 20.001 recusados; 500 áreas incluindo tombstones aceitas, 501 recusadas. Datas de 1900 a 2200, ano bissexto, horários 00:00/23:59, títulos de 200 unidades UTF-16, nomes de 60 e observações de 5.000. Limites excedidos, NaN, Infinity, IDs perigosos, enums inválidos, órfãos e revisões inconsistentes recusados.
- Navegador Chrome, ambiente isolado sem Gist ou token pessoal: criação e edição, campos vazios/invisíveis, título de 201, área de 61 e observações de 5.001 caracteres, correção dos erros, data fora do intervalo, retirada de data/horário e envio simultâneo. Emojis compostos preservados. HTML com onerror exibido como texto; nenhum elemento img injetado.
- Importação pelo seletor de arquivo real: JSON truncado, campo extra com 20.000 níveis, data impossível e arquivo maior que 5 MB recusados. Estado fictício preservado. Backup válido restaurado; cópia anterior baixada e validada, contendo o item de 5.000 caracteres nas observações.
- 5.000 registros no navegador: 60 itens montados inicialmente, 1.986 elementos no DOM; busca medida entre 13 e 25 ms nesta rodada. Na versão original, o teste com 5.000 registros provocou lentidão e timeout de uma interação. Essas medições são pontuais, dependem do ambiente e não constituem garantia de desempenho em celular.
- Mostrar mais aumentou a lista de 60 para 120; a busca encontrou o registro 4.999 fora da janela inicial. Agrupamento por prioridade exibiu contagens completas, 240 itens montados inicialmente e acesso ao grupo Encerrados; seu botão ampliou para 300. Cartões e cronograma também respeitaram as janelas.
- Revisão em 320 e 390 px com nomes/extremos: lista, cartões, agrupamento por área, tela de áreas e configurações sem rolagem lateral após a correção. Token vazio ou contendo caractere invisível recusado junto ao campo, sem conexão.
- Falha de quota, revisão máxima, restauração inválida e tamanho remoto acima de 650 KB deixam os dados anteriores preservados nos testes automatizados. Identidade do app, credenciais, criptografia e esquema mantidos; o módulo de listas foi incluído no cache v11.

Limites: a capacidade de 20.000 itens foi validada no domínio, não como promessa de armazenamento no aparelho. O navegador foi exercitado com até 5.000 registros. A sincronização autenticada entre dois aparelhos, a instalação física no Android e a abertura offline não foram revalidadas; a suíte de sincronização usa rede simulada.

# Verificação 0.5.3 — interface clara e espaçamento

- 60 testes existentes aprovados; sintaxe dos módulos verificada.
- Revisão visual no Chrome com telas responsivas de 320, 360, 430 e 650 px, além da apresentação desktop. Nenhuma rolagem lateral nas larguras inspecionadas; nomes padrão das áreas legíveis, cartões de pelo menos 48 px e guias sem transbordamento.
- Configurações sem seletor de tema; um único número de versão no final, após o cartão de instalação. Cor de destaque e movimento preservados.
- Ações de backup e campo de restauração dentro do cartão de sincronização. Abertura do diálogo de conexão pelo cartão confirmada, sem inserir credenciais.
- Fundo da página, meta de tema e manifesto alinhados em #edf3f6; o gradiente desaparece nas bordas. Barras nativas do Android não são reproduzidas na revisão de navegador e precisam de conferência no aparelho.
- As revisões visuais usaram armazenamento de teste vazio, sem dados ou tokens pessoais. Cache v10, identidade do manifesto e chaves de armazenamento preservados.

# Verificação 0.5.2 — transporte nativo

- Reproduzido em Chrome: armazenar fetch nativo como método do adaptador causava TypeError/Illegal invocation antes de enviar a requisição. Uma chamada global ao mesmo recurso respondeu HTTP 200.
- Após vincular a função a globalThis, o adaptador padrão passou a receber a resposta de autenticação do GitHub. A interface exibiu a mensagem de token inválido esperada para a credencial deliberadamente fictícia, em vez da falha genérica de acesso. Nenhum token pessoal, criação de Gist ou alteração de dados remotos foi usado nessa verificação.
- 60 testes aprovados, incluindo duas regressões com função que exige contexto global: transporte padrão e GET/POST/PATCH.
- Sintaxe e diferenças verificadas; cache atualizado para v9. Criptografia, dados, identificadores e preferências de conexão não alterados.

# Verificação 0.5.1 — padrão do Silhueta

Implementação refeita a partir da base 0.5.0 conforme Padrao_Sincronizacao_Instalacao_Apps.md.

- 58 testes aprovados: persistência, migração, combinação de registros, exclusões, criptografia, Gist com rede simulada e conferência antes do verde; sete cenários de instalação e duas regressões de falha local/nuvem.
- Revisão desktop, 390 px e 320 px. Conteúdo sem transbordamento horizontal, nuvem 44 × 44 px, SVG 26 × 26 px, botão de instalação com 44 px. Modal com margens de 15 px, rolagem interna, fundo claro e texto/botão legíveis no tema escuro. Campo de token obrigatório com erro junto ao campo; nenhum campo manual de ID do Gist. Escape fecha o modal.
- Manifest: id ./ preservado, start_url ./index.html, scope ./, PNG 192/512 e máscara 512 própria; meta/tema/fundo #edf3f6. Os 24 caminhos do cache estão presentes; a requisição autenticada do GitHub não participa do cache.
- A instalação real no aparelho e a sincronização com token pessoal não foram executadas. Não se declara conclusão do WebAPK por appinstalled. Testes e telas de revisão usam somente dados fictícios.

# Verificação da versão 0.5.0 · Simplificação

- 49 testes automatizados passaram. Os novos testes cobrem token único, busca do destino mais recente, criação automática, destino já associado, 404 versus erro de autenticação, chave incorreta e recifragem do backup anterior.
- A migração criptográfica só confirma quando a releitura abre com o token novo, sem usar a senha anterior. Um servidor simulado que ignora a gravação não produz confirmação.
- Preferências de token único e compatibilidade com credenciais antigas conferidas nos testes. O domínio continua fora do armazenamento de credenciais.
- Navegador: três guias principais — Planejamento, Cronograma e Configurações. Agrupamentos e layouts alternados na mesma guia; Área + Cartões permaneceu após recarga.
- Lista compacta conferida em computador e telas de 390 e 320 pixels. Linhas entre 84 e 93 pixels no conjunto de exemplos da tela de 320. Corpo de 305/305 pixels e grade de 257/257 pixels, sem rolagem horizontal.
- Arraste entre os grupos de prioridade moveu um item de Alta para Urgente. Reorganização por teclado no modo Sem grupos alterou a ordem e preservou as áreas dos itens.
- Formulário de 320 pixels: caixas de 252 pixels, sem ultrapassar o diálogo (303/303 pixels). Título vazio e composto só por espaços rejeitados; data fora do intervalo rejeitada; Deixar sem data removeu o erro e desativou o horário. Item sem data salvo após a correção.
- Nome de área vazio rejeitado junto ao campo. Placeholders de título, área, observações e token revisados.
- Diálogo de sincronização: apenas o token obrigatório; Manter conectado marcado; campos de recuperação recolhidos. Envio vazio mostra erro inline, sem chamar a API.
- Configurações claras e escuras inspecionadas em tela estreita. Rótulos ligados aos respectivos IDs; nenhum ID duplicado nessa página.
- Dados fictícios usados no preview, sem token pessoal. Página auxiliar e registros de teste não são incluídos na publicação.

Limites: testes remotos usam rede simulada; a conta pessoal do GitHub não foi conectada durante a verificação. Toque prolongado em aparelho físico, instalação e offline HTTPS não foram revalidados. Permanecem os limites de consistência eventual da API de Gists documentados no README.

# Verificação da versão 0.4.0 · Organização e sincronização

- 41 testes automatizados passaram, incluindo os 15 cenários anteriores e novos cenários de migração, ordem, combinação, criptografia e protocolo de sincronização.
- Casos verificados: criações offline independentes, desempate por revisão lógica, exclusão com cópia antiga, item concorrente em área removida, adoção remota por aparelho novo, restauração com revisões novas, senha incorreta, ciphertext adulterado, envelope incompatível, arquivo truncado, token recusado, criação de Gist secreto, edição durante requisição/criptografia, segunda alteração remota na releitura, falha de gravação local e cancelamento da conexão durante GET.
- Uma conferência sem alterações não grava novamente o domínio nem gera uma sequência de eventos entre abas.
- O transporte dos testes usa dados fictícios e adaptador/rede simulados. Nenhum Gist pessoal foi lido ou alterado e não foi usado token pessoal.
- No navegador, a alça de Finanças foi arrastada para antes de Pessoal, com alteração da ordem confirmada.
- Um item urgente foi arrastado para a faixa Alta e teve a prioridade atualizada.
- A opção de organizar por toque breve abriu o formulário; área, prioridade e posição foram alteradas e salvas.
- A seta do teclado moveu um item para antes do anterior na mesma área.
- Mudanças reapareceram nos dois quadros do preview, verificando o evento de armazenamento entre contextos.
- Paleta de áreas: 16 opções. Cor de destaque: 12 opções. Tema claro, tema escuro e destaque Fúcsia verificados visualmente.
- Visões de computador, 390 e 320 pixels conferidas. Em 320, largura e conteúdo do corpo: 305/305 pixels; grade de áreas: 259/259 pixels. Navegação com três guias na mesma linha, sem rolagem horizontal.
- Formulário de conexão com GitHub renderizado no celular: destino existente ou criação explícita, token, senha e opção de lembrar desmarcada. Nenhuma credencial foi preenchida no navegador de QA.
- Ícones SVG e PNG com fundo transparente; recursos do cache conferidos. Identidade e origem de instalação mantidas.
- Exemplos fictícios usados no preview; nenhum estado ou página auxiliar distribuído.

Limites: o gesto foi validado no navegador com ponteiro e com alternativa por teclado; o toque prolongado não foi validado em celular físico. A sincronização real com um Gist da usuária depende de configuração no aparelho e não foi executada nesta entrega. Testes simulados não substituem a conferência entre dois aparelhos reais. Instalação e abertura offline em origem HTTPS não foram revalidadas nesta versão. A API de Gists não oferece neste fluxo uma transação distribuída; os limites de concorrência estão documentados no README e na ajuda da conexão.

# Verificação da versão 0.3.1 · Movimento suave

- Sintaxe do aplicativo e do service worker conferida.
- Space Grotesk confirmada no estilo computado da marca; fonte local e licença incluídas.
- Gradiente ativo com ciclo de 22 segundos em tela de celular; pausa confirmada ao focar a busca e ao abrir o formulário de edição.
- Movimento Desativado remove a animação; preferência mantida após recarga. Suave reativado na interface.
- Temas claro e escuro inspecionados no navegador; ícones, marca e áreas legíveis.
- Grade na largura de 320 pixels: conteúdo e largura de 257/257 pixels, sem rolagem horizontal.
- Registros fictícios existentes mantidos na interface. Nenhum registro de teste ou página auxiliar incluído na distribuição.
- Modelo de dados e repositório não foram alterados. A suíte de domínio da versão anterior não foi repetida para esta mudança de apresentação.

A regra de movimento reduzido foi implementada em CSS e na interface. Instalação em celular físico e funcionamento offline em origem HTTPS não foram revalidados nesta versão.

# Verificação da versão 0.3.0 · Retomar

- 15 testes automatizados passaram, incluindo persistência, restauração, validação e preservação de IDs.
- Sintaxe do JavaScript conferida.
- Novo nome verificado na interface, título e manifesto de instalação.
- Fontes locais e arquivos referenciados pelo cache conferidos; Manrope confirmada no estilo computado da marca.
- Interface verificada em tela ampla e nas larguras de 390 e 320 pixels.
- Grade de 320 pixels: largura e conteúdo de 257/257 pixels, sem rolagem horizontal e com todas as áreas visíveis.
- Temas claro e escuro, configurações e formulário de edição verificados.
- Os registros fictícios da versão anterior continuaram acessíveis. Nenhum dado de teste foi incluído na distribuição.

Limites anteriores sobre instalação em celular físico e funcionamento offline em origem HTTPS permanecem aplicáveis.

# Verificação da versão 0.2.1

- Sintaxe do JavaScript conferida.
- Todas as áreas e a ação de criar área visíveis nas telas de 390 e 320 pixels.
- Grade sem rolagem horizontal: largura e conteúdo de 343/343 pixels e 279/279 pixels.
- Seleção da última área e retorno à visão de todas as áreas verificados.
- Painel de filtros abre e fecha, mantém seleções, aplica o filtro sem data e permite limpar os filtros.
- Registros fictícios já existentes permaneceram acessíveis; não foram incluídos na distribuição.
- Modelo de dados e persistência não foram alterados; não foi adicionada uma suíte de testes para a mudança visual.

# Verificação da versão 0.2.0

- 15 testes automatizados passaram: persistência e recuperação anteriores, filtros combinados, ordenação e prazos sem data.
- Interface verificada em tela ampla e em larguras de 390 e 320 pixels.
- Status alterado diretamente na tabela; busca confirmou o estado atualizado.
- Status alterado diretamente no cartão; o progresso da área foi atualizado.
- Item sem data cadastrado na área previamente selecionada; itens anteriores preservados.
- Cronograma, filtros adicionais e filtro de itens sem data verificados na interface.
- Dados fictícios usados na verificação; não incluídos na distribuição.

Limites de instalação e offline permanecem os da verificação anterior. A sincronização remota não faz parte desta entrega.

# Verificação da versão 0.1.0

- 12 testes automatizados passaram com `node --test`.
- JavaScript verificado com `node --check`.
- Interface inspecionada no navegador com largura ampla e em iframes de 390 e 320 pixels.
- Criação de item sem data, criação com data e horário, conclusão, reabertura e edição verificadas na interface.
- Área personalizada criada e sua cor selecionada na interface.
- Alteração em outra janela preservou o formulário em edição; o rascunho pôde ser salvo.
- Recarga preservou os itens, suas áreas e estados.
- Backup baixado pelo navegador, selecionado pelo controle de arquivo e restaurado com confirmação de sucesso; cópia anterior solicitada antes da substituição.

Limites: instalação em aparelho físico, comportamento offline em origem HTTPS e sincronização remota não foram validados no navegador de preview HTTP. Sincronização remota não faz parte desta versão. Os dados utilizados nos testes eram fictícios e não fazem parte da distribuição.

