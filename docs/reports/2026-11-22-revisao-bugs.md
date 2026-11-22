# Revisão de bugs — Retomar 1.10.1

Revisão da versão 1.10.0 publicada, com leitura dos módulos de tarefas, vínculos, persistência, navegação, sincronização e Academia. As correções se concentram nas falhas reproduzidas ou identificadas na Academia e no relógio compartilhado; não alteram o esquema 4 do Planejamento.

| Caso | Comportamento corrigido | Evidência |
| --- | --- | --- |
| Armazenamento da Academia contém uma string vazia | A cópia preserva exatamente os bytes, e restaurar um backup válido é possível após a cópia | Teste de exportação e restauração com dados vazios |
| Download da cópia lança erro | A janela apresenta o erro e mantém Restaurar bloqueado | Teste com download indisponível |
| Salvamento termina após abrir outro formulário | O resultado atualiza os dados, conservando o novo rascunho; falhas não aparecem na janela errada | Testes com trava de gravação controlada |
| Arquivo demora para ser lido | A restauração não substitui um formulário aberto durante a espera | Teste com leitura adiada |
| Vídeos estão entre parênteses, colchetes ou em Markdown | O link e a miniatura usam a URL correta, preservando parênteses válidos de URLs genéricas | Testes de análise e revisão no navegador |
| Miniaturas são hidratadas em paralelo ou a rede falha antes de responder | Uma imagem por vídeo; uma falha síncrona não bloqueia tentativas futuras | Testes de DOM e rede simulada |
| O dia muda com a Academia aberta | O relógio atualiza a tela; clicar em uma caixa antiga atualiza a visualização antes de marcar o novo dia | Relógio injetado nos testes, sem alterar a hora do sistema |
| Caixa de exercício permanece com foco | O foco é recuperado após salvar e deixa de impedir a atualização periódica | Teste integrado, simulação da perda de foco ao desativar o campo, teste do relógio e confirmação no navegador |
| Backup contém nome invisível | Validação rejeita o nome antes da gravação | Testes de validação |

Foram mantidos o roteiro original, os dados existentes, a identidade PWA, as chaves locais, o Gist criptografado e as preferências push. A Academia continua com backup próprio e sem sincronização no Gist.

A verificação inclui a suíte completa, sintaxe, imports, diferenças de espaço em branco e revisão no navegador em PC e iframe de 360 px. Sincronização com uma conta real, recebimento de push, teclado e gestos nativos no S24 não são comprovados por esses testes. As falhas de rede, concorrência e relógio são verificadas por cenários controlados. Os logs completos ficam em `.work/verification.log` e no artefato da CI.
