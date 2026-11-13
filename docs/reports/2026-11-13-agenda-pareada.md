# Retomar 1.6 — agenda nos aparelhos pareados

## Resultado e dependência de ativação

O ID público Google e a seleção de agendas acompanham o pareamento em `retomar-agenda.enc.json`, no mesmo Gist secreto, com criptografia e conferência próprias. O arquivo de tarefas existente, esquema 4, identidade PWA e chaves históricas não foram alterados. Ocultar Meu dia continua por aparelho.

A autorização contínua foi implementada no app e no Worker, mas **a ativação Cloudflare e a configuração do cliente Google estão pendentes pela titular**. O ambiente do agente não está autenticado nessa conta nem dispõe do segredo OAuth. A entrega do GitHub Pages habilita a sincronização de opções e prepara o modo contínuo; não torna uma autorização Google automaticamente compartilhada antes de publicar/configurar o Worker. Sem ativação, permanece o acesso por sessão existente.

## Comportamento implementado

- Acesso compartilhado somente após confirmação da sincronização. A credencial própria do serviço é derivada do token e Gist com HKDF; o token GitHub não é enviado ao Worker.
- Autorização Google explícita por código, com acesso offline, escopos de leitura, estado de uso único, PKCE, sessão da janela e recibo que distingue nova autorização de uma anterior.
- Segredo do cliente apenas no cofre Cloudflare. Autorização de renovação e acesso temporário armazenados criptografados por conta no servidor; somente acesso temporário é entregue à memória do app.
- Restauração em outros aparelhos e ao reabrir; renovação serializada; falhas transitórias preservam a cópia e revogação/expiração exige nova autorização.
- Desconexão compartilhada remove a conta e o fluxo pendente, tentando revogar no Google e informando quando essa revogação não foi confirmada.
- Opções com revisão determinística, proteção contra arquivo público/truncado/indecrifrável, migração da chave antiga e retenção de edição offline. Formulários abertos adiam a aplicação remota.
- Implantação interativa com entrada oculta, segredos por stdin, conservação das chaves VAPID e da chave de dados, conferência de endpoint/CORS/cliente e retorno público. Nenhuma credencial foi incluída no código.
- Cache offline v45 inclui os dois módulos novos. Lembretes e armazenamento Device preservados; novo armazenamento AgendaAccount independente.

## Validação

Testes automatizados em Node e DOM simulado cobrem pareamento entre dois aparelhos, seleção de agendas e cores preservadas, reabertura, renovação simultânea, negação e expiração de consentimento, cancelamento, callback repetido ou de outra sessão, credenciais fora de URLs/backup/armazenamento local, revogação, migração de chave e implantação simulada. A revisão também exercita os fluxos existentes de PC/celular, Lista/Cartões, tarefas, navegação, sincronização, push e PWA pela suíte completa.

O fluxo `npm run verify` executa a suíte completa, sintaxe de todos os módulos, resolução de imports locais e diferenças de espaço em branco. O log e a identificação da fonte ficam em `.work/verification.log` e `.work/verification.json`, e o CI preserva o registro como artefato de verificação.

Nenhum navegador foi acessado. DOM simulado não verifica pintura, layout físico, popup nativo, consentimento real ou entrega no S24. Google e Cloudflare foram simulados nos testes; ativação, login real e validação em PC/S24 continuam pendentes.

## Retorno e operação

O ponto anterior à agenda permanece na branch `backup/retomar-1.3-antes-agenda-2026-11-11`, commit `c3897a5c61b954c0f62ba4be0d77748af939932a`. O teste existente exercita a restauração em checkout descartável e conserva dados fora do Git.

Se o servidor já tiver sido ativado, revogue/desconecte a agenda compartilhada antes de restaurar o código antigo. O rollback da interface não remove uma autorização persistente cadastrada no Worker. A chave `AGENDA_DATA_KEY` deve ser conservada nas atualizações. Trocar o token de pareamento exige reautorizar o Google; a configuração pode migrar usando a chave anterior.

[Ativação e operação](../AGENDA-PAREADA.md) · [Guia geral e retorno](../GOOGLE-AGENDA.md).
