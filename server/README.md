# Serviço de notificações Retomar

Este serviço ainda não foi publicado. É necessária uma conta Cloudflare com Workers e Durable Objects habilitados. O GitHub Pages continua hospedando o app no mesmo endereço; não é necessário migrar dados ou instalar outro app.

## Implantação pelo responsável técnico

Na raiz do repositório:

1. Execute `npx wrangler@4 login` e autorize sua conta Cloudflare.
2. Confira `server/wrangler.jsonc`, incluindo a origem do app.
3. **Somente na primeira implantação**, execute `node server/setup-keys.mjs`. O script gera as chaves e envia os segredos pelo stdin ao armazenamento de segredos do Worker. Não grava nem imprime a chave privada. Não execute novamente num serviço que já possui assinaturas: trocar a chave invalida inscrições existentes.
4. Execute `npx wrangler@4 deploy --config server/wrangler.jsonc` e guarde a URL retornada.
5. Verifique `/config` com o cabeçalho Origin `https://sosoft142.github.io`; deve retornar uma chave pública. Confira a assinatura e os alarmes no runtime real antes de ativar a integração.
6. Configure **somente a URL HTTPS do servidor** em `dist/src/push-config.js`, execute os testes e publique pelo fluxo habitual de PR/Pages. Nunca coloque chaves privadas em `dist/` ou no GitHub.
7. No Chrome do S24, ative as notificações nas Configurações e autorize a permissão. Use Enviar teste. Crie um item e um subitem fictícios com prazo próximo; feche o app e confira entrega, abertura e cancelamento depois de concluir/excluir. Repita com atualização de horário, falta de rede e permissão negada.

## Funcionamento e limites

Cada aparelho tem uma credencial aleatória local separada do token do Gist. O servidor identifica a fila por hash dessa credencial. Os dados enviados são título (ou mensagem genérica no modo privado), prazo calculado, identificador, opções de apresentação e assinatura push, sem notas. Filtros, antecedências e período silencioso são calculados no cliente. O service worker encaminha os pedidos de silêncio e permanência ao navegador; o sistema operacional pode não atendê-los. Recebe até 5.000 prazos por aparelho, com limite de corpo de 1,5 MB. A conta e eventuais custos de hospedagem pertencem ao titular do serviço.

As alterações e os adiamentos são enviados quando o app está aberto e conectado. Sem rede, a última fila confirmada pode continuar gerando avisos. Desativar elimina a fila remota e mantém um marcador de revogação sem conteúdo de tarefas. Outra aba não consegue recriar a fila com a mesma credencial; reativar explicitamente registra uma nova. As preferências locais são preservadas. Cada aparelho deve ser desativado separadamente.

Alarmes persistentes acionam o envio; respostas transitórias recebem até cinco novas tentativas, com espera crescente. Respostas 404/410 eliminam a assinatura expirada. Mensagens com atraso superior a uma hora são descartadas para evitar uma enxurrada tardia. Tags estáveis deduplicam entregas confirmadas e agrupam notificações no navegador; timeouts de rede ainda podem ocasionar reenvio. O sistema operacional e o provedor podem atrasar ou suprimir avisos; não há garantia de entrega exata.

Origem permitida, credencial por aparelho, tamanho, estrutura, endpoints dos provedores e limite por IP são verificados. CORS não substitui controle de acesso: em uma implantação pública de grande escala, acrescente autenticação de conta ou convite para controlar novos registros e custos. Não use registros contendo títulos, credenciais ou assinaturas em logs.
