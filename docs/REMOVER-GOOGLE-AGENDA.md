# Limpeza externa após a remoção do Google Agenda

O Retomar 1.7 usa Meu dia somente para tarefas do próprio app. Não carrega o SDK Google, consulta eventos, abre autorização ou compartilha credenciais da agenda. A sincronização de tarefas pelo GitHub e as notificações push permanecem.

O código e o GitHub Pages são atualizados pelo fluxo do repositório. As operações abaixo dependem das suas contas Google e Cloudflare e devem ser realizadas manualmente. A atualização do app limpa as antigas preferências locais da integração em cada aparelho quando ele for aberto.

## 1. Retirar a autorização da conta Google

1. Abra [Conexões da Conta Google](https://myaccount.google.com/connections).
2. Localize a conexão usada pelo Retomar, que pode aparecer como **Retomar** ou **sosoft142.github.io**.
3. Abra os detalhes e remova o acesso correspondente. Se não existir uma conexão, prossiga.

Essa operação retira a permissão do aplicativo; os eventos existentes no Google Agenda permanecem na sua conta.

## 2. Excluir o cliente no Google Cloud

1. Abra [Google Auth Platform → Clientes](https://console.cloud.google.com/auth/clients).
2. Selecione o projeto usado para a integração do Retomar.
3. Abra o cliente OAuth criado para o Retomar e exclua-o, incluindo seus segredos.
4. Em **APIs e serviços → APIs e serviços ativados**, desative a **Google Calendar API** se ela foi ativada somente para este app.
5. Se o projeto inteiro foi criado exclusivamente para essa integração, também é possível encerrá-lo em **IAM e administrador → Configurações → Encerrar projeto**. Se o projeto atende outros serviços, remova somente o cliente e a API exclusivos do Retomar.

## 3. Atualizar e limpar a Cloudflare

O Worker **retomar-push** também atende às notificações. A limpeza deve conservar esse Worker, a classe **Device**, o vínculo **DEVICES** e as duas chaves **VAPID_PRIVATE_JWK** e **VAPID_PUBLIC_KEY**.

1. Baixe uma cópia atual do [repositório](https://github.com/Sosoft142/Retomar), em **Code → Download ZIP**.
2. Extraia em uma pasta nova. Abra a pasta que contém `package.json`; na barra de endereço do Explorador, digite `powershell` e pressione Enter.
3. Publique o servidor atualizado:

   ```powershell
   npx.cmd --yes wrangler@4 deploy --config server/wrangler.jsonc
   ```

   A configuração remove o vínculo da agenda e aplica a migração `v3-remove-agenda`, que exclui a classe **AgendaAccount** e os dados de autorização que ela armazenava. A classe **Device** não é apagada. A referência histórica à criação de AgendaAccount permanece no histórico de migrações para que a Cloudflare aplique corretamente a exclusão.

4. Após a confirmação da publicação, exclua somente estes três segredos, um comando por vez:

   ```powershell
   npx.cmd --yes wrangler@4 secret delete GOOGLE_CLIENT_ID --config server/wrangler.jsonc
   ```

   ```powershell
   npx.cmd --yes wrangler@4 secret delete GOOGLE_CLIENT_SECRET --config server/wrangler.jsonc
   ```

   ```powershell
   npx.cmd --yes wrangler@4 secret delete AGENDA_DATA_KEY --config server/wrangler.jsonc
   ```

5. No painel Cloudflare, confirme que **AgendaAccount** e **AGENDA_ACCOUNTS** desapareceram e que os três segredos acima não constam mais. **Device**, **DEVICES** e as chaves VAPID devem continuar presentes.
6. Use **Enviar teste** nas notificações do Retomar para conferir o funcionamento no aparelho.

Se o login da Cloudflare tiver expirado, execute `npx.cmd --yes wrangler@4 login` na mesma pasta e repita o comando que não terminou.

## 4. Remover a configuração antiga do Gist, se existir

1. Abra [Seus Gists](https://gist.github.com/) na conta usada para sincronizar o Retomar.
2. Localize **Retomar · backup criptografado**.
3. Se existir o arquivo **retomar-agenda.enc.json**, use **Edit**, remova somente esse arquivo e salve a edição.
4. Conserve **retomar.enc.json**, que contém o planejamento, e conserve o token usado para sincronizar seus aparelhos.

O app atualizado deixa de ler e gravar o arquivo antigo da agenda. O repositório principal já não inclui os módulos e guias de ativação removidos; commits e branches históricos continuam como histórico do projeto.

## 5. Conferir o app

Reabra o Retomar em cada aparelho e confira **Versão 1.7** nas Configurações. No PC, `Ctrl + Shift + R` força a atualização. Meu dia deve mostrar somente tarefas e suas opções locais; não deve haver conexão, configuração ou aviso do Google Agenda.

## Referências oficiais

- [Remover conexões da Conta Google](https://support.google.com/accounts/answer/13533235).
- [Gerenciar e excluir clientes OAuth](https://support.google.com/cloud/answer/15549257).
- [Excluir uma classe Durable Object e seus dados](https://developers.cloudflare.com/durable-objects/reference/durable-object-class-migrations-legacy/#delete-migration).
- [Comandos do Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/workers/).
- [Gerenciar arquivos de um Gist](https://docs.github.com/en/rest/gists/gists).
