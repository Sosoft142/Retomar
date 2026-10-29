# Retomar · Planejamento de vida

Versão 0.5.1. Aplicativo pessoal em português, orientado ao celular. Funciona como PWA estática, com dados locais e sincronização opcional por GitHub Gist.

## Organização

As guias principais são Planejamento, Cronograma e Configurações. Os nomes também aparecem nos títulos das páginas. Planejamento reúne os agrupamentos por área, por prioridade e sem grupos; qualquer agrupamento pode usar Lista compacta ou Cartões. Lista compacta sem grupos é o padrão inicial, pensado para consultar mais itens ao mesmo tempo. O modo escolhido fica salvo nas preferências deste aparelho. Ordenação, prazo, status e prioridade ficam no painel Filtros.

- Áreas em grade, sempre visíveis, com 16 cores vivas. Há 12 cores de destaque para a interface.
- Segure a alça de pontos para arrastar áreas e itens. A alça reserva o gesto; o restante da tela continua disponível para rolagem. No toque, a ativação ocorre após 300 ms.
- No agrupamento por área, solte um item em outra área para transferi-lo. No agrupamento por prioridade, solte em outro grupo para alterar sua prioridade. As datas não mudam com o arraste.
- Minha ordem preserva a sequência manual; também há ordenação por prioridade, data, título e criação. A sequência global é filtrada por área ou grupo na apresentação.
- Quatro prioridades: urgente, alta, normal e baixa. Cada uma possui rótulo, símbolo, faixa e cor; a prioridade pode ser alterada diretamente na lista.
- Uma pressão breve na alça abre opções de área, prioridade e posição. As setas com foco na alça movem itens; Alt + setas nas guias move áreas. A tela de áreas mantém os botões de mover.
- Busca, filtros, status direto, cronograma e datas/horários opcionais.
- Ícone de retorno sem quadrado de fundo, inclusive nos arquivos de instalação. O sistema do aparelho pode aplicar sua própria moldura ao ícone instalado.
- Vidro fosco, temas claro e escuro, fontes locais Space Grotesk, Manrope e Inter. Gradientes suaves pausam durante edição e respeitam movimento reduzido.

## Sincronização com GitHub

Configurações → Sincronização, ou o ícone de nuvem no cabeçalho. O fluxo reproduz o do Silhueta: um campo de token, Manter conectado neste aparelho e Conectar e sincronizar. Use o mesmo token clássico com permissão gist no celular e no computador. O aplicativo localiza o backup do Retomar automaticamente ou cria um Gist secreto se a busca completa não encontrar nenhum. Quando houver vários, utiliza o mais recente. A janela de conexão pede apenas o token: o ID do Gist é encontrado e memorizado automaticamente, sem campo manual. O arquivo remoto continua sendo `retomar.enc.json`, separado do Silhueta.

O próprio token autentica e fornece a chave de derivação da criptografia, como no Silhueta. Por isso, os aparelhos precisam usar o mesmo token para abrir a cópia remota. Guarde uma cópia da credencial e backups JSON independentes; trocar o token exige a chave anterior para abrir o arquivo já cifrado. A opção Manter conectado começa marcada, seguindo a referência; quando marcada, o token fica salvo neste navegador. Desmarcada, ele fica apenas na memória da sessão. As exportações do domínio nunca incluem credenciais.

Compatibilidade com 0.4: credenciais antigas já guardadas permitem abrir o backup e recifrá-lo com o token. Se a senha anterior não estiver guardada, há um campo opcional em Conexão anterior ou outro backup. A senha antiga só é removida das preferências após uma rodada que envia e relê o arquivo usando exclusivamente a nova chave. Falha de abertura, envio ou conferência mantém a conexão anterior recuperável; não se cria um backup vazio para substituir um arquivo que não pôde ser aberto.

Os dados são salvos e conferidos primeiro no aparelho. O motor baixa, descriptografa, valida, combina revisões, envia quando necessário, relê e só confirma após comparar o conteúdo remoto e a cópia local atual. Alterações durante criptografia/requisições são recombinadas. Formulários abertos e gestos de arraste adiam a rodada. Web Locks coordenam abas quando disponíveis. O app agenda uma rodada após alterações, ao reconectar e ao voltar à página, e confere periodicamente com a página visível. Não há sincronização prometida com o aplicativo fechado.

Estados da nuvem: cinza (local ou pendente), verde pulsante (em andamento), verde fixo (conferido neste aparelho) e vermelho (erro). Há rótulos acessíveis e detalhes no diálogo. Movimento reduzido desativa a pulsação. Desconectar preserva o planejamento e o Gist.

## Dados, versões e limites

Esquema 2, envelope `retomar-gist-encrypted-v1`. A migração do esquema 1 conserva IDs, revisões e dados, acrescenta a ordem e converte as seis cores antigas para a paleta viva. Chaves locais e `appId: entrelinhas-vida` permanecem estáveis. O armazenamento e a instalação pertencem à origem em que o aplicativo é aberto. Backups antigos são migrados ao ler; o novo backup requer uma versão compatível do aplicativo.

Cada área e cada item são uma unidade de combinação, com revisão lógica `(counter, deviceId)` e desempate determinístico. A mesma entidade editada simultaneamente em dois aparelhos tem uma versão vencedora; não há editor de conflitos. Ordenação faz parte da entidade. Exclusões permanecem como tombstones. Se uma edição concorrente apontar para uma área excluída, o item é conservado na área Recuperados. Restaurar um backup sobre dados válidos atribui revisões novas e mantém exclusões dos registros conhecidos ausentes na cópia restaurada.

O transporte usa snapshots completos em Gist secreto, com AES-GCM-256, PBKDF2-SHA256 de 310.000 iterações, salt de 16 bytes e IV de 12 bytes aleatórios por envelope. Limite desta implementação: 650 KB de conteúdo de domínio antes de cifrar. Arquivos remotos truncados, incompatíveis ou que falhem na abertura não são aplicados. Gist secreto não equivale a armazenamento privado por controle de acesso; a proteção do conteúdo é a criptografia. Os dados locais continuam legíveis pelo aplicativo.

A releitura de Gist não é uma transação distribuída. Uma gravação posterior pode substituir uma cópia já conferida; as próximas rodadas combinam as versões ainda existentes nos aparelhos. Não se promete ausência de perdas sob concorrência ilimitada. Há espera progressiva para falhas temporárias e respeito às indicações de limite do GitHub; erros de autenticação exigem nova tentativa manual ou atualização da conexão.

O repositório confere gravações locais e preserva dados corrompidos para recuperação. JSON exportado é legível e contém IDs, revisões e exclusões, sem credenciais. Mantenha cópias independentes. Sem Web Locks, alterações exatamente simultâneas entre abas ainda podem competir. A primeira carga e preparação do cache offline exigem conexão. Instalação em aparelho físico e fluxo remoto real exigem validação adicional no ambiente final.

## Código e verificação

- `dist/src/domain.js`: modelo, migração, validação, prioridades e organização.
- `dist/src/repository.js`: leitura e gravação local verificadas.
- `dist/src/drag.js`: gesto por ponteiro, alças e alternativa por teclado.
- `dist/src/sync/`: combinação pura, criptografia, adaptador Gist, motor e conexão visual.
- `dist/src/forms.js`: mensagens de validação ligadas aos campos e foco no primeiro erro.
- `dist/src/app.js`: interface. `dist/retomar.css`: apresentação.
- `npm test`: cenários de domínio, migração, organização, criptografia, transporte e concorrência com dados fictícios e rede simulada.

Base arquitetural: guia do Silhueta 2.9.18. Fluxo de conexão e organização de Configurações conferidos novamente no código do Silhueta 2.9.18 para esta versão. Endpoints e permissões conferidos na documentação primária do GitHub: https://docs.github.com/en/rest/gists/gists. A API está fixada em 2026-03-10. Nenhum teste utiliza token pessoal ou altera Gists de produção.

## Formulários

Campos com rótulos visíveis, textos de exemplo curtos e indicação de campos opcionais. Título ou nome de área vazio, inclusive composto somente por espaços, é rejeitado com mensagem junto ao campo. Datas respeitam o intervalo 1900–2200; horário depende de data. Deixar sem data limpa o horário e os erros relacionados. Mensagens têm associação por aria-describedby e aria-invalid; o primeiro campo inválido recebe foco. Conteúdo válido continua em edição quando ocorre falha do domínio ou do armazenamento. Formulários têm rolagem interna, cabeçalho fixo e ações que se ajustam em telas estreitas.

## Publicação no GitHub Pages

O fluxo `.github/workflows/pages.yml` testa o código e publica somente `dist/` a cada atualização de `main`. Em Settings → Pages, a origem da publicação deve ser GitHub Actions. Não é necessário cadastrar um token pessoal como segredo do repositório: a publicação utiliza o `GITHUB_TOKEN` temporário fornecido pelo GitHub Actions.

Para executar localmente: `python -m http.server 8000 --directory dist`. Abra `http://localhost:8000`. Para verificar: `npm test` (Node.js 22 ou posterior). Não há dependências a instalar nem etapa de compilação.

### Transferir o planejamento de outro endereço

O navegador mantém um armazenamento diferente para cada origem. Antes de passar do ChatGPT Sites para o GitHub Pages, exporte uma cópia JSON em Configurações → Backups. No novo endereço, importe essa cópia; ou conecte-se com exatamente o mesmo token já usado no Retomar para localizar e abrir o backup remoto existente. Verifique seus itens no novo endereço antes de deixar de usar o anterior.

O token é uma credencial pessoal, não um código distribuído com o aplicativo. Para sincronizar, use um token pessoal clássico com somente a permissão `gist`, inserido diretamente no Retomar. Não envie o token para issues, commits ou arquivos deste repositório. Se o Silhueta já usa um token com permissão `gist`, ele também pode ser utilizado aqui; os arquivos remotos dos dois aplicativos são separados.

## Padrão de sincronização e instalação

A versão 0.5.1 foi implementada a partir da base 0.5.0, seguindo Padrao_Sincronizacao_Instalacao_Apps.md, baseado no Silhueta 2.9.18. O salvamento local agenda sincronização após aproximadamente 1,4 s; abertura, retomada, retorno da internet e conferência a cada 45 s com a página visível completam os gatilhos. O motor conserva a combinação determinística por registro, marcadores de exclusão e releitura antes de confirmar.

A nuvem do cabeçalho tem botão de 44 × 44 px e SVG de 26 × 26 px, sem fundo ou texto visível. Cinza #7a747d indica local/pendente, verde #34784c pulsante indica atividade, verde fixo confirma a releitura e vermelho #b04852 indica erro. Falha de armazenamento local também fica vermelha até uma gravação bem-sucedida. A pulsação de 1 s altera somente opacidade e respeita movimento reduzido.

Configurações inclui Instalar Retomar antes da versão. O botão começa desabilitado e só habilita após beforeinstallprompt. O evento é consumido uma vez; userChoice resolve a tentativa, e um contador impede respostas antigas de alterar uma oferta nova. Aceitação e appinstalled mostram Instalação solicitada: não afirmam que o WebAPK terminou. O cartão só é ocultado em display-mode: standalone ou navigator.standalone. Nenhuma flag permanente de instalação é guardada. Sem convite, o cartão explica a instalação pelo menu.

Manifest e service worker mantêm os mesmos caminhos e identidade id ./; o start_url é ./index.html, com scope ./ e cores claras #edf3f6. Ícones normais continuam transparentes e há uma máscara própria 512 × 512. O cache v8 inclui o controlador e a máscara, mantém rede primeiro e alternativa offline, exclui requisições autenticadas e limpa somente o prefixo deste projeto. Dados locais e credenciais conservam as chaves existentes. O nome histórico entrelinhas-vida é preservado nos identificadores para compatibilidade.

O fluxo de Actions valida pull requests e publica dist/ somente após alterações em main. A publicação usa o GITHUB_TOKEN temporário; o token pessoal de sincronização nunca é enviado ao repositório.
