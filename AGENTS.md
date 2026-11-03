# Retomar — orientação de desenvolvimento

## Começar com contexto suficiente
- Leia `docs/CURRENT.md` para o estado atual e `docs/MAP.md` para localizar a área da tarefa.
- Use `npm run context -- status` para ver mudanças. Pesquise com `rg -n` antes de ler código extenso; leia trechos com `npm run context -- read CAMINHO INICIO FIM`.
- Amplie a leitura quando dependências, falhas ou dúvidas exigirem. Nunca economize contexto omitindo informação necessária à correção.
- Não leia arquivos inteiros, históricos ou arquivos gerados por rotina. Consulte `docs/history/` somente quando uma decisão anterior importar.
- Mantenha instruções curtas. Atualize o estado atual ao mudar comportamento, versão ou pendências; preserve o histórico em separado.

## Preservar o produto
- Fonte de execução em `dist/`; identidade PWA, chaves locais, Gist criptografado e esquema dos dados são contratos existentes.
- Preservar dados, instalação, funcionamento offline, histórico de navegação e confirmação de descarte.
- Preferências push são por aparelho. Servidor push ainda não implantado; não anunciar envio ativo sem verificação real.
- Antes de implementar integração externa, verificar acesso e dependências necessárias. Não pedir tokens ou senhas no chat.

## Verificar sem reduzir qualidade
- Durante edições, execute os testes relacionados. Antes de integrar/publicar, execute `npm run verify`: suíte completa, sintaxe, imports e diferenças de espaço em branco.
- Logs completos ficam em `.work/verification.log`; o resumo não substitui investigar falhas.
- Mudanças de interface exigem revisão no navegador nas larguras afetadas. Mudanças apenas de documentação/ferramentas não exigem refazer capturas da interface intacta.
- Não repetir verificações para a mesma fonte inalterada sem justificativa. Mudou a fonte ou surgiu dúvida: revalidar o necessário.
- Refatorações, corte de testes e redução de validações não fazem parte de uma otimização de contexto.

## Publicar pelo caminho disponível
- Execute `npm run release:prepare -- --base REF` após verificar; inspecione o manifesto e as diferenças.
- Neste ambiente, GitHub conectado é o caminho de escrita disponível. Git por HTTPS não possui autenticação: não repetir tentativas nem configurar credenciais pessoais.
- Use os conectores GitHub para criar árvore/commit/branch/PR. A preparação exporta somente arquivos alterados e verifica a identidade do conteúdo.
- Integrar somente após CI aprovada; conferir o resultado da publicação. Se houver acesso `gh` autenticado, `release:watch` pode resumir as execuções; caso contrário, usar o conector.
- Alterações sem mudanças em `dist/` não precisam republicar o Pages. Não atualizar a versão do app por manutenção apenas deste fluxo.
