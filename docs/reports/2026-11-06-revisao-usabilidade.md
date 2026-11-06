# Revisão de UI orientada ao uso — 0.12.0

A revisão aplica as preferências recorrentes: leitura antes de controles, edição identificável, cores consistentes, facilidade de arquivar e boa utilização da tela do celular.

## Alterações

- Planejamento: retirado o título visual repetido junto da aba. O título semântico permanece acessível. Quantidade em aberto e resumo de lembretes ficam em uma composição compacta; arquivos mantêm seu título próprio.
- Engrenagem com fundo e borda discretos, diferenciada da alça de arraste.
- Títulos usam Inter com espaçamento menos apertado. Prioridade e andamento passam a 13 px. Área usa texto neutro, sem ponto colorido competindo com prioridade.
- Datas do ano atual dispensam ano repetido; datas de outros anos o mantêm. Atrasos são escritos explicitamente, além da cor. Elemento time conserva data completa.
- Subitens aproveitam melhor a largura; metadados deixam de repetir o recuo do título. Na menor largura, a linha lateral adicional é retirada.
- Editor: andamento fora de Mais detalhes, observações opcionais recolhidas se vazias, área/prioridade lado a lado quando cabem e botão Salvar curto. Rodapé com fundo opaco para separar as ações do conteúdo rolável.
- Rótulo Andamento consistente no editor e filtros. Função antiga de data sem uso removida; regras novas integradas ao bloco atual de cartões sempre que possível.

## Verificação

Inspeção visual com tarefas fictícias em quadros de 320, 390 e 1024 px. Sem rolagem horizontal nas larguras medidas de 320 e 1024 px (larguras úteis 305 e 1009 px). Exercitados alteração de data/andamento e salvamento, criação de subitem longo, abertura de filtros, editor com observações vazias e preenchidas e central com prazo atrasado.

O teste é de navegador; não equivale a teste em Samsung físico nem com teclado virtual real. A suíte completa deve passar por npm run verify e pela CI antes de integrar. Dados e esquema 4 preservados, identidade da PWA e sincronização mantidas. Cache do service worker atualizado. Push real permanece inativo.

## Economia de tokens

Estado/mapa do projeto e buscas delimitadas orientaram a revisão. Testes relacionados foram usados durante a edição, com suíte completa ao finalizar e logs integrais preservados. Publicação por diferenças. Não há medição comparável que permita afirmar percentual de economia de tokens; a verificação visual foi mantida.
