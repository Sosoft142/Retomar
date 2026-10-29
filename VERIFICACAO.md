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

