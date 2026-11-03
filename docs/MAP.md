# Onde procurar

| Objetivo | Fonte | Testes relacionados |
| --- | --- | --- |
| Renderização, ações e formulários do app | `dist/src/app.js`, `dist/retomar.css` | `forms`, `extreme`; revisão visual |
| Validação, prioridades e hierarquia | `dist/src/domain.js` | `core`, `subitems`, `extreme` |
| Persistência e recuperação | `dist/src/repository.js` | `core`, `extreme` |
| Voltar, janelas e rolagem | `dist/src/navigation.js` | `navigation` |
| Arraste e listas extensas | `dist/src/drag.js`, `collections.js` | `subitems`, `extreme` |
| Lembretes internos e fuso | `dist/src/planning.js`, `planning-ui.js` | `planning`, `planning-ui` |
| Preferências e ajustes push | `dist/src/push.js`, `push-ui.js` | `push`, `push-customization` |
| Envio push — ainda sem implantação | `server/` | `push`, `push-customization` |
| Gist, criptografia, combinação e conexão | `dist/src/sync/` | `sync`, `connection`, `transport`, `sync-ui` |
| Instalação e cache offline | `dist/src/pwa.js`, `dist/service-worker.js`, manifest | `pwa`; verificar instalação quando alterada |
| Ferramentas de desenvolvimento | `scripts/`, `.github/workflows/pages.yml` | `workflow-tools`; `npm run verify` |

Os nomes da coluna de testes correspondem a `tests/NOME.test.mjs`. Localize o símbolo com `rg -n 'símbolo' CAMINHO`; leia o trecho e suas dependências, não todo o repositório. Para mudanças transversais, amplie o escopo antes de editar.
