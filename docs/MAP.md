# Onde procurar

Lista de melhorias acordadas e próximas etapas: [IMPROVEMENTS.md](IMPROVEMENTS.md).

| Objetivo | Fonte | Testes relacionados |
| --- | --- | --- |
| Paridade PC/celular, lista/cartões e mouse/toque/teclado | `app.js`, `workflow-ui.js`, `forms.js`, `drag.js`, `retomar.css` | `responsive-ui`, `drag`, `fluency`; DOM Node, sem revisão visual real |
| Meu dia, autorização Google e consulta somente leitura | `dist/src/calendar.js`, `calendar-ui.js`; `docs/GOOGLE-AGENDA.md` | `calendar`, `calendar-colors`, `day-planning`, `workflow-ui`, `responsive-ui`; conta real e revisão visual pendentes |
| Pareamento da agenda, autorização contínua e ativação pendente | `calendar-pairing.js`, `calendar-session.js`, `server/calendar-auth.js`, `server/calendar-deployment.mjs`; `docs/AGENDA-PAREADA.md` | `calendar-pairing`, `calendar-session`, `calendar-auth`, `calendar-deployment`, `calendar-paired-ui`, `agenda-input`, `sync-ui` |
| Retornar à versão anterior à agenda | `scripts/calendar-rollback.mjs` | `calendar-rollback`; ponto preservado 1.3 |
| Ações rápidas, seleção/lote, reversão e visualizações locais | `dist/src/workflows.js`, `workflow-ui.js`, integração em `app.js` | `workflows`, `workflow-ui`, `fluency`; revisão visual pendente em 1.3 |
| Renderização, ações e formulários do app | `dist/src/app.js`, `dist/src/rendering.js`, `dist/retomar.css` | `forms`, `fluency`, `extreme`; revisão visual |
| Validação, prioridades e hierarquia | `dist/src/domain.js` | `core`, `subitems`, `extreme`, `checkup` |
| Persistência e recuperação | `dist/src/repository.js` | `core`, `extreme`, `checkup` |
| Voltar, janelas e rolagem | `dist/src/navigation.js` | `navigation` |
| Arraste e listas extensas | `dist/src/drag.js`, `collections.js` | `subitems`, `extreme` |
| Lembretes internos e fuso | `dist/src/planning.js`, `planning-ui.js` | `planning`, `planning-ui` |
| Preferências e ajustes push | `dist/src/push.js`, `push-ui.js` | `push`, `push-customization` |
| Envio e implantação push — endpoint publicado | `server/`, `server/deployment.mjs` | `push`, `push-customization`, `push-deployment` |
| Gist, criptografia, combinação e conexão | `dist/src/sync/` | `sync`, `connection`, `transport`, `sync-ui` |
| Instalação e cache offline | `dist/src/pwa.js`, `dist/service-worker.js`, manifest | `pwa`, `service-worker`; verificar instalação quando alterada |
| Ferramentas de desenvolvimento | `scripts/`, `.github/workflows/pages.yml` | `workflow-tools`; `npm run verify` |

Os nomes da coluna de testes correspondem a `tests/NOME.test.mjs`. Localize o símbolo com `rg -n 'símbolo' CAMINHO`; leia o trecho e suas dependências, não todo o repositório. Para mudanças transversais, amplie o escopo antes de editar.
