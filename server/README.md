# Serviço de notificações Retomar

Servidor publicado: https://retomar-push.sofiatorresmansur.workers.dev. A configuração pública foi validada em 9/11/2026; a entrega precisa ser confirmada no aparelho. Para administrar o serviço, é necessária a conta Cloudflare titular. O GitHub Pages continua hospedando o app no mesmo endereço; não é necessário migrar dados ou instalar outro app.

## Implantação simplificada

Na raiz de uma cópia deste repositório, com Node.js e npm instalados:

1. Autentique sua própria conta: `npx wrangler@4 login`. A autorização ocorre na Cloudflare; não envie tokens ou senhas no chat.
2. Execute `npm run push:deploy`.

O segundo comando publica o Worker, confere os nomes dos segredos existentes e cria as chaves VAPID **somente quando as duas estão ausentes**. Se já existem, preserva o par; se existe apenas uma, interrompe sem trocar chaves. O material privado segue apenas por stdin para o armazenamento de segredos do Worker, sem arquivo de chaves nem impressão no console.

Depois, valida a URL pública do Worker de produção, a resposta de `/config`, a origem permitida e a chave pública P-256. Só após essa conferência atualiza `dist/src/push-config.js`. Uma falha não escreve uma URL não verificada no app. A conta deve permitir Workers, Durable Objects e os recursos de `server/wrangler.jsonc`; erros de conta ou permissão precisam ser resolvidos pelo titular.

A publicação do Worker e a publicação do app são etapas diferentes: após o comando ter sucesso, execute `npm run verify` e integre/publique a alteração de `dist/src/push-config.js` pelo fluxo de PR/Pages. O app continua no GitHub Pages, com os mesmos dados e instalação. Sem autenticação, o comando encerra antes de chamar a Cloudflare.

O comando antigo `node server/setup-keys.mjs` continua disponível para um serviço já existente, mas agora também verifica os segredos e preserva chaves em uso. Use o fluxo simplificado para a primeira implantação.

### Conferência final no aparelho

No Chrome do S24, ative as notificações no app e autorize a permissão. Use Enviar teste. Crie um item e um subitem fictícios com prazo próximo; feche o app e confira entrega, abertura e cancelamento depois de concluir/excluir. Repita com atualização de horário, falta de rede e permissão negada. `/config` validado **não comprova entrega push**, alarmes persistentes nem comportamento do Android.

A sincronização entre aparelhos deve ser conferida com uma tarefa fictícia: criar em um aparelho, aguardar confirmação na nuvem, recuperar no outro, editar e conferir o retorno. Para offline, abrir o app já instalado, desligar a conexão, editar, fechar/reabrir e reconectar. Esses testes requerem os aparelhos e uma conexão Gist real; não podem ser substituídos por testes de lógica.

Referências do fornecedor: [comandos do Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/workers/) e [segredos do Worker](https://developers.cloudflare.com/workers/configuration/secrets/).

## Funcionamento e limites

Cada aparelho tem uma credencial aleatória local separada do token do Gist. O servidor identifica a fila por hash dessa credencial. Os dados enviados são título (ou mensagem genérica no modo privado), prazo calculado, identificador, opções de apresentação e assinatura push, sem notas. Filtros, antecedências e período silencioso são calculados no cliente. O service worker encaminha os pedidos de silêncio e permanência ao navegador; o sistema operacional pode não atendê-los. Recebe até 5.000 prazos por aparelho, com limite de corpo de 1,5 MB. A conta e eventuais custos de hospedagem pertencem ao titular do serviço.

As alterações e os adiamentos são enviados quando o app está aberto e conectado. Sem rede, a última fila confirmada pode continuar gerando avisos. Desativar elimina a fila remota e mantém um marcador de revogação sem conteúdo de tarefas. Outra aba não consegue recriar a fila com a mesma credencial; reativar explicitamente registra uma nova. As preferências locais são preservadas. Cada aparelho deve ser desativado separadamente.

Alarmes persistentes acionam o envio; respostas transitórias recebem até cinco novas tentativas, com espera crescente. Respostas 404/410 eliminam a assinatura expirada. Mensagens com atraso superior a uma hora são descartadas para evitar uma enxurrada tardia. Tags estáveis deduplicam entregas confirmadas e agrupam notificações no navegador; timeouts de rede ainda podem ocasionar reenvio. O sistema operacional e o provedor podem atrasar ou suprimir avisos; não há garantia de entrega exata.

Origem permitida, credencial por aparelho, tamanho, estrutura, endpoints dos provedores e limite por IP são verificados. CORS não substitui controle de acesso: em uma implantação pública de grande escala, acrescente autenticação de conta ou convite para controlar novos registros e custos. Não use registros contendo títulos, credenciais ou assinaturas em logs.
