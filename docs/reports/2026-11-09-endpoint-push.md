# Integração com o servidor push — 0.12.2

A titular forneceu o endpoint publicado https://retomar-push.sofiatorresmansur.workers.dev. A checagem direta de /config, usando a origem pública do app, confirmou resposta HTTPS bem-sucedida, CORS esperado e chave pública P-256 importável.

A URL foi configurada em dist/src/push-config.js. A interface passa a permitir Ativar neste aparelho; não declara aparelho inscrito nem mostra confirmação de entrega antes da ativação. Versão 0.12.2 e cache v32 distribuem a configuração atualizada. Identidade PWA, tarefas, esquema e Gist permanecem iguais.

A suíte completa e a CI devem aprovar a mesma árvore antes da publicação. O teste da interface verifica a distinção entre servidor configurado, aparelho desativado e envio confirmado. Não foram enviadas tarefas privadas nem criadas assinaturas fictícias no servidor público.

Ainda é necessário abrir a atualização no S24, ativar notificações, autorizar o navegador e usar Enviar teste. Depois, conferir aviso agendado com app fechado. Configuração válida não comprova alarmes, entrega pelo provedor nem permissões/bateria do Android.

Economia de tokens: leitura delimitada da integração e logs resumidos, preservando suíte completa. Sem base comparável para estimativa percentual.
