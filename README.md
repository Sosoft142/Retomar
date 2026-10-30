# Retomar · Planejamento de vida

Versão 0.7.0. Aplicativo pessoal em português, orientado ao celular. Funciona como PWA estática, com dados locais e sincronização opcional por GitHub Gist.

## Interface

A interface usa somente o modo claro. Cor de destaque e movimento continuam configuráveis. Configurações reúne sincronização e cópia de segurança em um único cartão; a versão fica apenas no final dessa página. O fundo se dissipa nas bordas para combinar com a cor clara das barras do aplicativo. Os cartões de área têm pelo menos 48 px de altura e a grade se adapta à largura da tela.

## Organização

As guias principais são Planejamento e Cronograma. Configurações é aberta pela engrenagem à direita da nuvem no cabeçalho. Os nomes também aparecem nos títulos das páginas. Planejamento reúne os agrupamentos por área, por prioridade e sem grupos; qualquer agrupamento pode usar Lista compacta ou Cartões. Lista compacta sem grupos é o padrão inicial, pensado para consultar mais itens ao mesmo tempo. O modo escolhido fica salvo nas preferências deste aparelho. Ordenação, prazo, status e prioridade ficam no painel Filtros.

- Áreas em grade, sempre visíveis, com 16 cores vivas. Há 12 cores de destaque para a interface.
- Segure a alça de pontos para arrastar áreas e itens. A alça reserva o gesto; o restante da tela continua disponível para rolagem. No toque, a ativação ocorre após 300 ms.
- No agrupamento por área, solte um item em outra área para transferi-lo. No agrupamento por prioridade, solte em outro grupo para alterar sua prioridade. As datas não mudam com o arraste.
- Minha ordem preserva a sequência manual; também há ordenação por prioridade, data, título e criação. A sequência global é filtrada por área ou grupo na apresentação.
- Quatro prioridades: urgente, alta, normal e baixa. Cada uma possui rótulo, símbolo, faixa e cor; a prioridade pode ser alterada diretamente na lista.
- Uma pressão breve na alça abre opções de área, prioridade e posição. As setas com foco na alça movem itens; Alt + setas nas guias move áreas. A tela de áreas mantém os botões de mover.
- Busca, filtros, status direto, cronograma e datas/horários opcionais.
- Sino de lembretes por data e horário, com adiamento e dispensar por hoje.
- Botão de Google Agenda por item e subitem, com preparação de evento ou envio direto configurável com cores por prioridade.
- Ícone de retorno sem quadrado de fundo, inclusive nos arquivos de instalação. O sistema do aparelho pode aplicar sua própria moldura ao ícone instalado.
- Vidro fosco, modo claro, fontes locais Space Grotesk, Manrope e Inter. Luz ambiente em rotação; botões com gradientes estáticos, sem pulsação, reflexos móveis ou bordas animadas. Os efeitos decorativos pausam durante edição e arraste, respeitam movimento reduzido e podem ser desativados em Configurações. O rodapé não exibe mais a inscrição de armazenamento local e backup.

Os seletores de prioridade e status reservam espaço conforme a fonte e podem mudar de linha. A seta tem uma área própria para evitar cortes provocados pelos controles nativos do navegador. Isso mantém Urgente e Em andamento completos em telas estreitas ou com texto ampliado.

## Subitens

Em cada item de Planejamento, toque em Subitens para expandir ou recolher a lista e em + Subitem para criar uma etapa. Cada subitem tem título, prioridade, status, data/horário opcionais e observações próprios. O contador mostra quantos foram concluídos; concluir o item principal não conclui as etapas automaticamente.

A lista de etapas pode usar Minha ordem, Prioridade ou Data. Segure a alça para arrastar; pelo teclado, use as setas. Tocar na alça abre Organizar subitem, com escolha de posição, outro item principal ou Sem vínculo para promover a etapa a item principal. Há um nível de subitens. Um item que já tem etapas não pode ser aninhado em outro.

Os subitens acompanham a área do item principal. Mover o pai de área preserva suas etapas. A busca e os filtros encontram subitens e mantêm o pai como contexto; resultados correspondentes podem ser expandidos automaticamente. No cronograma, cada etapa aparece pelo seu próprio prazo, com um vínculo para voltar ao item principal.

Listas extensas usam Mostrar mais. O estado de expansão e a forma de ordenar etapas são preferências deste aparelho. Os dados das etapas entram no backup e na sincronização.

Ao excluir um item principal, seus subitens ativos também são excluídos, com marcadores preservados. Desfazer restaura o grupo quando não houve alteração concorrente; etapas anteriormente excluídas não são ressuscitadas.

## Lembretes e Google Agenda

O sino à esquerda da nuvem abre os prazos próximos e atrasados de todas as áreas. Cada item ou subitem usa a própria data e o próprio horário; tarefas sem data ou encerradas ficam fora dos avisos. A ordenação considera o prazo antes da prioridade. Sem horário, o atraso começa depois do fim da data. Antecedência por dias, inclusão de atrasados e duração do adiamento são configuráveis. Dispensar hoje e adiar ocultam somente o aviso, com opção de desfazer. Mudanças no prazo ou no fuso fazem o aviso ser reconsiderado.

O ícone de calendário em cada tarefa prepara um evento no Google Agenda para conferência e salvamento, sem exigir um projeto OAuth. Cor, aviso e agenda de destino devem ser conferidos no Google nesse modo. Para adicionar diretamente com cores e avisos, configure um ID público OAuth próprio e autorize o Google. Não é usado o token do GitHub. O modo direto permite escolher uma agenda pertencente à conta, duração, tratamento de itens sem horário, fuso, aviso e quatro cores distintas. Observações só são enviadas se a opção estiver marcada.

O envio direto usa um vínculo estável por item e agenda. Reenvios atualizam o mesmo evento, com verificação da revisão e releitura de confirmação. Não há alteração automática de eventos ao editar, concluir ou excluir tarefas no Retomar. O token do Google fica somente na memória da sessão; preferências e adiamentos ficam neste aparelho, separados dos dados sincronizados e dos backups. As credenciais da conexão do ChatGPT não são copiadas para o app.

Os lembretes internos funcionam ao abrir e usar o Retomar. Alertas com o app fechado são responsabilidade dos avisos dos eventos adicionados ao Google Agenda. As instruções para configurar o envio direto estão em [GOOGLE_AGENDA.md](GOOGLE_AGENDA.md) e no próprio formulário de configurações.

## Validação e listas extensas

Títulos e áreas exigem texto visível. Limites: 200 caracteres no título, 60 no nome da área e 5.000 nas observações (unidades UTF-16, como nos campos HTML). Emojis compostos e outros alfabetos são preservados. A comparação de nomes de áreas usa Unicode NFC para impedir duplicatas visualmente equivalentes. Envios simultâneos do mesmo formulário executam uma única operação.

Listas começam com até 60 itens por grupo e um orçamento inicial de 240 itens por visualização. Use Mostrar mais para ampliar uma lista. Busca, filtros, contagens e backups continuam incluindo todos os registros; não há remoção ou corte dos dados. Mudar os filtros, a área ou o modo de visualização reinicia a janela da lista.

Backups com campos desconhecidos, referências inválidas ou identificadores inseguros são recusados, preservando a cópia local e o arquivo original. O esquema de dados é a versão 3, com migração automática dos backups das versões 1 e 2.

## Sincronização com GitHub

Configurações → Sincronização, ou o ícone de nuvem no cabeçalho. O fluxo reproduz o do Silhueta: um campo de token, Manter conectado neste aparelho e Conectar e sincronizar. Use o mesmo token clássico com permissão gist no celular e no computador. O aplicativo localiza o backup do Retomar automaticamente ou cria um Gist secreto se a busca completa não encontrar nenhum. Quando houver vários, utiliza o mais recente. A janela de conexão pede apenas o token: o ID do Gist é encontrado e memorizado automaticamente, sem campo manual. O arquivo remoto continua sendo `retomar.enc.json`, separado do Silhueta.

O próprio token autentica e fornece a chave de derivação da criptografia, como no Silhueta. Por isso, os aparelhos precisam usar o mesmo token para abrir a cópia remota. Guarde uma cópia da credencial e backups JSON independentes; trocar o token exige a chave anterior para abrir o arquivo já cifrado. A opção Manter conectado começa marcada, seguindo a referência; quando marcada, o token fica salvo neste navegador. Desmarcada, ele fica apenas na memória da sessão. As exportações do domínio nunca incluem credenciais.

Compatibilidade com 0.4: credenciais antigas já guardadas permitem abrir o backup e recifrá-lo com o token. Se a senha anterior não estiver guardada, há um campo opcional em Conexão anterior ou outro backup. A senha antiga só é removida das preferências após uma rodada que envia e relê o arquivo usando exclusivamente a nova chave. Falha de abertura, envio ou conferência mantém a conexão anterior recuperável; não se cria um backup vazio para substituir um arquivo que não pôde ser aberto.

Os dados são salvos e conferidos primeiro no aparelho. O motor baixa, descriptografa, valida, combina revisões, envia quando necessário, relê e só confirma após comparar o conteúdo remoto e a cópia local atual. Alterações durante criptografia/requisições são recombinadas. Formulários abertos e gestos de arraste adiam a rodada. Web Locks coordenam abas quando disponíveis. O app agenda uma rodada após alterações, ao reconectar e ao voltar à página, e confere periodicamente com a página visível. Não há sincronização prometida com o aplicativo fechado.

Estados da nuvem: cinza (local ou pendente), verde piscando somente pela opacidade (em andamento), verde fixo sem brilho extra (conferido neste aparelho) e vermelho (erro). O cabeçalho mostra somente o ícone de nuvem, sem texto ou visto. Há rótulos acessíveis e detalhes no diálogo. Movimento reduzido desativa as animações. Desconectar preserva o planejamento e o Gist.

## Dados, versões e limites

Esquema 3, envelope `retomar-gist-encrypted-v1`. A migração do esquema 1 conserva IDs, revisões e dados, acrescenta a ordem e converte as seis cores antigas para a paleta viva. Chaves locais e `appId: entrelinhas-vida` permanecem estáveis. O armazenamento e a instalação pertencem à origem em que o aplicativo é aberto. Backups antigos são migrados ao ler; o novo backup requer uma versão compatível do aplicativo. Antes de sincronizar subitens, atualize/reabra o Retomar na versão 0.6.0 ou posterior em todos os aparelhos. Versões antigas não entendem o esquema 3 e recusam seu conteúdo, preservando a cópia local.

Cada área, item principal e subitem são uma unidade de combinação, com revisão lógica `(counter, deviceId)` e desempate determinístico. Subitens usam IDs e revisões próprios, ligados por parentId. A área herdada é normalizada a partir do pai sem competir com uma edição de conteúdo do subitem. Um vínculo tornado inválido por exclusão ou reorganização concorrente é reparado promovendo a etapa a item principal, sem ressuscitar o pai. Ciclos e níveis adicionais são recusados na entrada e reparados de forma determinística quando resultam da combinação de duas cópias individualmente válidas. A mesma entidade editada simultaneamente em dois aparelhos tem uma versão vencedora; não há editor de conflitos. Ordenação faz parte da entidade. Exclusões permanecem como tombstones. Se uma edição concorrente apontar para uma área excluída, o item é conservado na área Recuperados. Restaurar um backup sobre dados válidos atribui revisões novas e mantém exclusões dos registros conhecidos ausentes na cópia restaurada.

O transporte usa snapshots completos em Gist secreto, com AES-GCM-256, PBKDF2-SHA256 de 310.000 iterações, salt de 16 bytes e IV de 12 bytes aleatórios por envelope. Limite desta implementação: 650 KB de conteúdo de domínio antes de cifrar. Arquivos remotos truncados, incompatíveis ou que falhem na abertura não são aplicados. Gist secreto não equivale a armazenamento privado por controle de acesso; a proteção do conteúdo é a criptografia. Os dados locais continuam legíveis pelo aplicativo.

A releitura de Gist não é uma transação distribuída. Uma gravação posterior pode substituir uma cópia já conferida; as próximas rodadas combinam as versões ainda existentes nos aparelhos. Não se promete ausência de perdas sob concorrência ilimitada. Há espera progressiva para falhas temporárias e respeito às indicações de limite do GitHub; erros de autenticação exigem nova tentativa manual ou atualização da conexão.

O repositório confere gravações locais e preserva dados corrompidos para recuperação. JSON exportado é legível e contém IDs, revisões e exclusões, sem credenciais. Mantenha cópias independentes. Sem Web Locks, alterações exatamente simultâneas entre abas ainda podem competir. A primeira carga e preparação do cache offline exigem conexão. Instalação em aparelho físico e fluxo remoto real exigem validação adicional no ambiente final.

## Código e verificação

- `dist/src/domain.js`: modelo, migração, validação, prioridades e organização.
- `dist/src/repository.js`: leitura e gravação local verificadas.
- `dist/src/drag.js`: gesto por ponteiro, alças e alternativa por teclado.
- `dist/src/sync/`: combinação pura, criptografia, adaptador Gist, motor e conexão visual.
- `dist/src/forms.js`: mensagens de validação ligadas aos campos e foco no primeiro erro.
- `dist/src/planning.js`: preferências, cálculos de prazo/fuso e eventos de agenda.
- `dist/src/google-calendar.js`: autorização em memória e adaptador Google com vínculo estável.
- `dist/src/planning-ui.js`: lembretes, ações por tarefa e configurações.
- `dist/src/app.js`: interface. `dist/retomar.css`: apresentação.
- `npm test`: cenários de domínio, migração, organização, criptografia, transporte e concorrência com dados fictícios e rede simulada. São 172 testes nesta versão, incluindo 53 novos cenários de lembretes, Google Agenda e preservação das mensagens específicas de formulário.

Base arquitetural: guia do Silhueta 2.9.18. Fluxo de conexão e organização de Configurações conferidos novamente no código do Silhueta 2.9.18 para esta versão. Endpoints e permissões conferidos na documentação primária do GitHub: https://docs.github.com/en/rest/gists/gists. A API está fixada em 2026-03-10. Nenhum teste utiliza token pessoal ou altera Gists de produção.

## Formulários

Campos com rótulos visíveis, textos de exemplo curtos e indicação de campos opcionais. Título ou nome de área vazio, inclusive composto somente por espaços, é rejeitado com mensagem junto ao campo. Datas respeitam o intervalo 1900–2200; um horário precisa de uma data para ser salvo, mas os dois campos podem ser preenchidos em qualquer ordem. Editar ou apagar a data preserva o horário digitado e indica o que falta. Deixar sem data e horário é o comando explícito para limpar ambos. O seletor usa o formato do aparelho, com confirmação do horário em 24 horas na ajuda. Mensagens têm associação por aria-describedby e aria-invalid; o primeiro campo inválido recebe foco. Conteúdo válido continua em edição quando ocorre falha do domínio ou do armazenamento. Formulários têm rolagem interna, cabeçalho fixo e ações que se ajustam em telas estreitas. No celular os campos ocupam toda a largura; títulos e nomes de áreas se ajustam ao conteúdo. Valores extensos são mostrados completos abaixo dos seletores quando não cabem na caixa.

## Publicação no GitHub Pages

O fluxo `.github/workflows/pages.yml` testa o código e publica somente `dist/` a cada atualização de `main`. Em Settings → Pages, a origem da publicação deve ser GitHub Actions. Não é necessário cadastrar um token pessoal como segredo do repositório: a publicação utiliza o `GITHUB_TOKEN` temporário fornecido pelo GitHub Actions.

Para executar localmente: `python -m http.server 8000 --directory dist`. Abra `http://localhost:8000`. Para verificar: `npm test` (Node.js 22 ou posterior). Não há dependências a instalar nem etapa de compilação.

### Transferir o planejamento de outro endereço

O navegador mantém um armazenamento diferente para cada origem. Antes de passar do ChatGPT Sites para o GitHub Pages, exporte uma cópia JSON em Configurações → Sincronização e backup. No novo endereço, importe essa cópia; ou conecte-se com exatamente o mesmo token já usado no Retomar para localizar e abrir o backup remoto existente. Verifique seus itens no novo endereço antes de deixar de usar o anterior.

O token é uma credencial pessoal, não um código distribuído com o aplicativo. Para sincronizar, use um token pessoal clássico com somente a permissão `gist`, inserido diretamente no Retomar. Não envie o token para issues, commits ou arquivos deste repositório. Se o Silhueta já usa um token com permissão `gist`, ele também pode ser utilizado aqui; os arquivos remotos dos dois aplicativos são separados.

## Padrão de sincronização e instalação

A versão 0.5.1 foi implementada a partir da base 0.5.0, seguindo Padrao_Sincronizacao_Instalacao_Apps.md, baseado no Silhueta 2.9.18. O salvamento local agenda sincronização após aproximadamente 1,4 s; abertura, retomada, retorno da internet e conferência a cada 45 s com a página visível completam os gatilhos. O motor conserva a combinação determinística por registro, marcadores de exclusão e releitura antes de confirmar.

A nuvem do cabeçalho tem botão de 44 × 44 px e SVG de 26 × 26 px, sem fundo ou texto visível. Cinza #7a747d indica local/pendente; verde #009b59 piscando em um ciclo de 1 s indica atividade; o verde fixo confirma a releitura; vermelho #b04852 indica erro. Não há texto visível, visto, halo, giro ou brilho extra no ícone. Falha de armazenamento local também fica vermelha até uma gravação bem-sucedida. As animações respeitam movimento reduzido.

Configurações inclui Instalar Retomar antes da versão. O botão começa desabilitado e só habilita após beforeinstallprompt. O evento é consumido uma vez; userChoice resolve a tentativa, e um contador impede respostas antigas de alterar uma oferta nova. Aceitação e appinstalled mostram Instalação solicitada: não afirmam que o WebAPK terminou. O cartão só é ocultado em display-mode: standalone ou navigator.standalone. Nenhuma flag permanente de instalação é guardada. Sem convite, o cartão explica a instalação pelo menu.

Manifest e service worker mantêm os mesmos caminhos e identidade id ./; o start_url é ./index.html, com scope ./ e cores claras #edf3f6. Ícones normais continuam transparentes e há uma máscara própria 512 × 512. O cache v17 inclui o controlador e a máscara, mantém rede primeiro e alternativa offline, exclui requisições autenticadas e limpa somente o prefixo deste projeto. Dados locais e credenciais conservam as chaves existentes. O nome histórico entrelinhas-vida é preservado nos identificadores para compatibilidade.

O fluxo de Actions valida pull requests e publica dist/ somente após alterações em main. A publicação usa o GITHUB_TOKEN temporário; o token pessoal de sincronização nunca é enviado ao repositório.

## Transporte no navegador

O adaptador captura fetch ligado a globalThis. A função nativa exige o contexto de Window/WorkerGlobalScope; chamá-la como método do adaptador causava Illegal invocation antes de qualquer requisição, mascarado como falha de rede. Testes incluem funções que exigem o contexto global, além de respostas simuladas. A correção 0.5.2 não altera token, criptografia, backup, identidade ou preferências existentes.

