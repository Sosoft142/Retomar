# Google Agenda nos aparelhos pareados

A versão 1.6 compartilha o ID público do cliente Google e as agendas selecionadas pelo mesmo Gist criptografado usado no pareamento. Ocultar Meu dia, formato e filtros de visualização continuam como preferências de cada aparelho. Eventos e credenciais Google não entram no backup de tarefas.

**Situação atual:** a titular ativou o servidor e `/agenda/config` confirmou `ready: true`. A autorização encontrou `405 Method not allowed` no início; a correção descrita abaixo ainda precisa ser republicada no Worker. A conexão Google real e a restauração entre aparelhos permanecem pendentes de confirmação. Enquanto `/agenda/config` não confirmar `ready: true`, a conexão antiga por sessão continua disponível. Publicar o app no GitHub Pages não publica o Worker.

## Ativar uma vez

Use o mesmo cliente OAuth do tipo **Aplicativo da Web** já configurado para o Retomar. Não crie uma credencial diferente para cada aparelho. Não envie senha, token, segredo de cliente ou chave criptográfica pelo chat.

1. No [Google Cloud Console](https://console.cloud.google.com/), abra o projeto que contém a Google Calendar API e o cliente usado no app. Preserve a origem JavaScript `https://sosoft142.github.io`.
2. No cliente OAuth, em **URIs de redirecionamento autorizados**, adicione exatamente:

   ```text
   https://retomar-push.sofiatorresmansur.workers.dev/agenda/oauth/callback
   ```

3. Se o projeto estiver em teste, mantenha a conta que autorizará a agenda na lista de **Usuários de teste**. O erro `403: access_denied` por falta de usuário aprovado precisa ser resolvido nessa configuração do Google.
4. Em um computador com Node.js e a cópia atual deste repositório, abra um terminal na pasta do projeto. Execute:

   ```sh
   npm ci --ignore-scripts
   npx wrangler@4 login
   npm run agenda:deploy
   ```

   No Windows/PowerShell, use os executáveis `.cmd` para executar os mesmos passos:

   ```powershell
   npm.cmd ci --ignore-scripts
   npx.cmd --yes wrangler@4 login
   npm.cmd run agenda:deploy
   ```

   Para obter uma cópia atual sem Git, abra o [repositório Retomar](https://github.com/Sosoft142/Retomar), use **Code → Download ZIP**, extraia o arquivo e abra a pasta `Retomar-main` que contém `package.json`. No Explorador de Arquivos, clique na barra do caminho da pasta, digite `powershell` e pressione Enter para abrir o terminal nesse local.

   Se uma cópia anterior pular o ID ou voltar ao prompt `PS ...>` com erro de credenciais, atualize somente o script na pasta do projeto:

   ```powershell
   Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/Sosoft142/Retomar/main/server/calendar-deployment.mjs" -OutFile ".\server\calendar-deployment.mjs"
   ```

   Depois execute este comando em uma linha:

   ```powershell
   npm.cmd run agenda:deploy -- --client-id (Read-Host "Cole o ID do cliente Google")
   ```

   O PowerShell pedirá o ID público primeiro. Cole o valor da página Google e pressione Enter. O script então pedirá apenas o segredo em entrada oculta. A leitura interativa comum também foi corrigida: mantém uma única interface, trata CRLF de colagem/terminal remoto, repete entradas inválidas e não avança com ID vazio. `--client-id` aceita somente o ID público; o segredo permanece fora dos argumentos e do histórico da leitura.

   O login Cloudflare é realizado por você na sua própria conta. O comando de implantação pede o ID público e o segredo do mesmo cliente Google; o segredo é digitado com entrada oculta. Ele é enviado ao cofre do Worker por entrada padrão, sem aparecer nos argumentos do comando ou no app. O comando verifica a conta/endereço, preserva as chaves VAPID e a chave de criptografia existente e confirma a configuração pública antes de declarar a ativação.
5. No Retomar, mantenha a sincronização conectada com o mesmo token nos aparelhos. Aguarde a conferência do backup. Em **Configurar agenda**, use o mesmo ID público do cliente do servidor.
6. Em **Meu dia**, prepare a conexão, se necessário, e escolha **Conectar aparelhos ao Google**. Autorize a consulta uma vez. Nos demais aparelhos, abra o app, aguarde a sincronização e entre em Meu dia. A conexão será restaurada sem novo consentimento, enquanto a autorização Google permanecer válida.

O comando usa `server/wrangler.jsonc`, publica o Worker existente e acrescenta o armazenamento `AgendaAccount`, mantendo o armazenamento `Device` das notificações. Ele não republica o GitHub Pages. Se a implantação indicar outro endereço ou um cliente Google diferente, interrompe a substituição de segredos Google; confira a conta e conserve o cliente atual. Trocar de cliente exige migração administrativa.

## Se a janela mostrar `Method not allowed`

Esse erro foi reproduzido no servidor e em Miniflare/workerd, com credenciais fictícias. O encaminhamento interno seguia o redirect OAuth, consumindo a resposta 303 antes de o cookie e o destino Google chegarem ao navegador. O servidor agora devolve esse redirect intacto. As requisições de troca, renovação e revogação também usam o modo `manual`, compatível com Workers, e rejeitam respostas 3xx.

Na cópia já usada para ativar o servidor, abra PowerShell na pasta `Retomar-main` e execute um comando por vez:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/Sosoft142/Retomar/main/server/calendar-auth.js" -OutFile ".\server\calendar-auth.js"
npx.cmd --yes wrangler@4 deploy --config server/wrangler.jsonc
```

Esses comandos atualizam o código do Worker e preservam os segredos cadastrados, incluindo `AGENDA_DATA_KEY` e as chaves push. Não é necessário executar `agenda:deploy` nem digitar o ID/segredo novamente. Após a publicação, feche a janela de erro e inicie uma nova conexão por **Meu dia → Conectar aparelhos ao Google**. Não abra `/agenda/auth/start` diretamente na barra de endereços: o fluxo começa por POST no aplicativo.

O teste em Miniflare reproduz o comportamento do runtime com chamadas Google simuladas; não equivale a consentimento na conta real. Referências: [Request e modos de redirect](https://developers.cloudflare.com/workers/runtime-apis/request/) e [fetch em Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/rpc/reserved-methods/).

## Como funciona

| Informação | Local |
| --- | --- |
| Tarefas e planejamento | Armazenamento local e arquivo criptografado existente `retomar.enc.json` |
| ID público Google e agendas escolhidas | Preferência local e novo arquivo criptografado `retomar-agenda.enc.json` no mesmo Gist secreto |
| Segredo OAuth do cliente | Cofre de segredos Cloudflare; nunca entregue ao app |
| Autorização de renovação do Google | Servidor, criptografada com AES-GCM e chave guardada no cofre |
| Acesso Google temporário e eventos consultados | Memória da sessão do app |
| Credencial de acesso ao serviço da agenda | Derivada do pareamento; enviada apenas no cabeçalho ou no POST inicial de autorização |

O token do GitHub não é enviado ao servidor da agenda. Cada conjunto pareado deriva uma credencial própria a partir do mesmo token e Gist. Os aparelhos só disponibilizam essa credencial após confirmar a sincronização. Trate o token de pareamento como uma credencial: ele dá acesso ao planejamento e à agenda compartilhada desse conjunto.

A autorização usa código OAuth, consentimento explícito, estado de uso único, PKCE e cookie de sessão restrito à janela de autorização. Somente leitura de eventos, lista e metadados opcionais das agendas. O servidor renova o acesso; o app continua consultando eventos diretamente pela Calendar API, sem copiar os eventos para o servidor.

## Uso, falhas e desconexão

- As escolhas de agendas acompanham a sincronização. Edições offline ficam pendentes; a atualização remota espera o fechamento de formulários abertos. Não há sincronização com um aparelho fechado.
- Uma configuração antiga não substitui automaticamente uma configuração que já existe no Gist. Arquivo público, truncado ou indecifrável gera erro e preserva as cópias existentes.
- A autorização pode ser revogada ou expirar. Em projetos Google com público externo e status **Testing**, autorizações que incluem Calendar normalmente expiram após sete dias; a titular precisará autorizar novamente. O app não contorna restrições de teste, verificação ou políticas do Google.
- **Desconectar aparelhos** remove a autorização do servidor e tenta revogá-la no Google. Se o Google não confirmar a revogação, o app informa isso; remova também o acesso nas permissões da conta Google. Outros aparelhos podem mostrar a última consulta até atualizar, e um acesso temporário já emitido pode continuar válido até a expiração ou revogação.
- **Desconectar este aparelho** na sincronização remove o pareamento e o acesso em memória somente desse aparelho. Não revoga a agenda dos demais. Ocultar Meu dia também não revoga a autorização compartilhada.
- Trocar o token de pareamento muda a credencial derivada e exige nova autorização da agenda. As opções criptografadas podem migrar com a chave anterior informada no fluxo existente de recuperação. Antes de trocar, desconecte a agenda compartilhada ou remova o acesso nas permissões Google para não deixar uma autorização antiga no servidor.
- Não substitua `AGENDA_DATA_KEY` em uma atualização: isso impede abrir as autorizações existentes. O comando conserva a chave já cadastrada. Uma migração de chave exige procedimento próprio.
- Sem internet, tarefas e funcionamento offline permanecem disponíveis. Eventos já consultados podem continuar visíveis nesta sessão; não há atualização garantida em segundo plano.

## Retornar à versão anterior

A versão 1.3 anterior à integração permanece na branch [backup/retomar-1.3-antes-agenda-2026-11-11](https://github.com/Sosoft142/Retomar/tree/backup/retomar-1.3-antes-agenda-2026-11-11), commit `c3897a5c61b954c0f62ba4be0d77748af939932a`. O esquema de tarefas e o arquivo criptografado existente não foram modificados.

Antes de retornar, use **Desconectar aparelhos** ou revogue o acesso na conta Google. Restaurar o código antigo não apaga uma autorização que já foi cadastrada no servidor. O [guia geral](GOOGLE-AGENDA.md#voltar-ao-estado-anterior) descreve a restauração e os testes.

## Verificação e limites

Testes em Node cobrem dois aparelhos, reabertura, renovação, concorrência, cancelamento, revogação, isolamento de credenciais, migração de chave e implantação simulada. A correção do redirecionamento foi conferida também em Miniflare/workerd. Simulação de DOM e chamadas Google fictícias não equivalem a revisão visual ou login real. Nenhum navegador da titular foi acessado. A titular ativou o servidor; o agente não tem autenticação Cloudflare para republicar a correção. Consentimento real e validação final em PC/S24 estão pendentes.

## Referências oficiais

- [OAuth para servidor Web e acesso offline](https://developers.google.com/identity/protocols/oauth2/web-server).
- [Modelo de autorização por código](https://developers.google.com/identity/oauth2/web/guides/use-code-model).
- [Proteção e armazenamento de credenciais](https://developers.google.com/identity/protocols/oauth2/resources/best-practices).
- [Público, modo de teste e validade](https://support.google.com/cloud/answer/15549945).
