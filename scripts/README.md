# Fluxo com contexto delimitado

1. `npm run context -- status`; consulte `docs/CURRENT.md` e a linha relevante de `docs/MAP.md`.
2. `rg -n 'símbolo' CAMINHO`; `npm run context -- read CAMINHO INICIO FIM` limita a leitura a até 200 linhas/6.000 caracteres. Amplie quando necessário.
3. Implemente e execute os testes relacionados durante as edições.
4. Inclua novos arquivos pretendidos no Git e execute `npm run verify`: suíte completa, sintaxe/imports e diferenças. Falhas não são ocultadas; log integral em `.work/verification.log`.
5. `npm run release:prepare -- --base REF` exige fonte idêntica à verificada, lista mudanças e gera `.work/release.json`. Em manutenção sem alteração no produto, acrescente `--expect-no-runtime-change`.
6. No conector GitHub: confirme a HEAD atual e a árvore base, se `blobs` não estiver vazio, crie primeiro esses blobs binários pelo conector e confira os SHAs; depois use `treeElements` do arquivo preparado para criar a árvore, compare o SHA com a árvore local commitada e abra um PR. Não exporte a documentação histórica inteira quando ela não mudou. Nenhuma ferramenta escreve no GitHub automaticamente ou lê credenciais pessoais.
7. Aguarde CI e integre pelo fluxo autorizado. Para acompanhamento somente de leitura, `npm run release:watch -- --sha SHA --event pull_request`; depois, o SHA integrado com `--event push`. O conector é a alternativa quando a API pública não estiver acessível.

`release:prepare` é determinístico sobre a fonte atual e não faz deploy, commit, merge ou alteração de versão. Arquivos em `.work/` são intermediários ignorados pelo Git. Não guarde segredos neles. Não se deve editar a fonte entre a verificação e a preparação: isso invalida a aprovação anterior.

O Pages mantém o endereço, a identidade e os arquivos do app. Mudanças fora de `dist/` continuam passando pela suíte completa, mas não republicam o app. Acionamento manual do workflow continua publicando.
