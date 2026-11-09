# Estado atual — Retomar

A titular confirmou entrega no horário com o S24 fechado e vibração. A apresentação de pop-up permanece pendente de verificação no aparelho.

O S24 confirmou a inscrição. O log de /test identificou redirect inválido no Worker. O envio agora usa o modo manual compatível com a Cloudflare e trata respostas 3xx como falha. A titular confirmou o recebimento do teste no S24 após a correção.

- 1.0.1: lembretes usam as mesmas cores e prioridade visual do planejamento. Busca, botão Áreas, recuos e formulário corrigidos após revisão responsiva. [Relatório visual](reports/2026-11-09-alinhamento-lembretes.md).
- Produto: PWA Android/Chrome, prioritariamente celular Samsung S24.
- Versão do app: **1.0.1**. URL: https://sosoft142.github.io/Retomar/
- Repositório: `Sosoft142/Retomar`; produção na branch `main`; arquivos públicos em `dist/`.
- Sem framework/bundler de produção; módulos JavaScript e CSS estático.
- Dados locais e Gist criptografado preservam os identificadores históricos `entrelinhas-vida`.
- 0.12.2: endpoint push publicado pela titular e validado por HTTPS, CORS e chave pública P-256; integração habilitada para inscrição por aparelho. Entrega com app fechado ainda depende do teste no S24. [Relatório da integração](reports/2026-11-09-endpoint-push.md).
- 0.12.1: check-up geral; organização protege revisão concorrente, reordenação respeita filtros e preserva arquivados, indicador de filtros atualiza, armazenamento bloqueado recebe tratamento e cache offline tem gravação tolerante a falhas e escopo limitado. [Relatório do check-up](reports/2026-11-07-checkup.md).
- 0.12.0: resumo superior sem título visual repetido, botões de gerenciamento reconhecíveis, datas compactas com atraso escrito, tipografia de leitura revisada, subitens menos recuados e andamento sempre visível no editor. [Relatório da revisão de usabilidade](reports/2026-11-06-revisao-usabilidade.md). Critérios de interface em [UI.md](UI.md).
- 0.11.0: cartões centrados em título/prazo, prioridade e andamento como texto compacto, engrenagem para edição, subitens/avisos no gerenciamento, arquivo e botão de adicionar reduzidos. Agrupamento e visualização ficam em Filtros. [Relatório de hierarquia dos cartões](reports/2026-11-06-hierarquia-cartoes.md).
- 0.10.0: áreas em seletor compacto, gerenciamento completo sem sair da central de lembretes, ações temporárias no gerenciamento (revisado em 0.11.0), configurações separadas de central/push, prioridade colorida e andamento neutro com rótulos.
- [Relatório de áreas, lembretes e espaçamento](reports/2026-11-05-areas-lembretes.md).
- 0.9.1: controles de gerenciamento e arraste em linha própria, rótulos visíveis no celular, mais espaço entre botões/cartões e ícones do cabeçalho; fundos e sombras suavizados.
- 0.9.0: botão Gerenciar separado da alça de arraste; arquivamento reversível de qualquer tarefa, consulta de arquivadas e lote de concluídas nos filtros atuais. Pais com subitens não concluídos ficam fora do lote. Arquivo do pai oculta os filhos sem alterar seus conteúdos/revisões.
- Esquema de dados 4: migração automática dos esquemas 1–3, com IDs, Gist, chaves locais e status preservados. Atualizar os outros aparelhos antes de sincronizar; versões antigas rejeitam o novo esquema sem sobrescrever os dados.
- [Relatório desta atualização](reports/2026-11-05-arquivamento.md).
- Funcionalidades: áreas, prioridades, status, prazos, subitens, arraste, busca, cronograma, lembretes internos, backup, sincronização e histórico do navegador.
- Implantação push simplificada por `npm run push:deploy`: preserva chaves existentes e só configura o endpoint após validar `/config`. A titular publicou o Worker; endpoint validado em 9/11. A autenticação Cloudflare segue fora deste ambiente. [Relatório da tentativa](reports/2026-11-08-implantacao-push.md).
- Google Agenda removido. Push: preferências gerais e por tarefa, prévia e servidor preparado; servidor publicado em `https://retomar-push.sofiatorresmansur.workers.dev`; inscrição, entrega com o app fechado e vibração confirmadas pela titular.
- Preferências de notificações e ajustes por tarefa são por aparelho; não são sincronizados pelo Gist.
- Suíte ampliada nesta revisão: testes de foco, busca e invalidação dos cálculos. Resultado da fonte atual: `npm run verify`; logs não são documentação de estado permanente.
- 0.8.3: foco e posição preservados ao salvar; menos cálculos e remontagens repetidos; grade de áreas mais legível em telas maiores. Dados, esquema, Gist e identidade PWA preservados.
- [Relatório de fluidez e economia de contexto](reports/2026-11-03-fluidez.md).

## Verificação e publicação

- `npm test`: suíte completa existente, sem redução.
- `npm run verify`: execução completa com resumo e log detalhado em `.work/`.
- `npm run release:prepare -- --base REF`: diferenças, integridade de `dist/`, confirmação de verificação atual e pacote de alterações para o conector.
- CI executa verificação completa; Pages só republica quando `dist/` muda ou há acionamento manual.
- Fonte atual e Git são a referência para comportamento; consultar o histórico apenas para investigar decisões antigas.

0.12.4: retorno pelo nome/ícone, proteção do formulário e foco inicial sem teclado ao gerenciar. Teste agendado em dois minutos usa o alarme do Worker existente e informa horário previsto e recebido. Pequenos envios da fila podem terminar após sair da página. O atraso real no S24 ainda depende de medição no aparelho.

S24: a titular confirmou entrega com o app fechado com quatro minutos de atraso. Worker atualizado no repositório para urgência alta e marcação do instante de tentativa. Publicação na Cloudflare e nova medição no aparelho pendentes.
Tarefas admitem Sem área e a criação reutiliza a última área salva no aparelho.

1.0 reúne agrupamento e cronograma no painel Ordenar. Filtros usam funil. Lista reduzida, prazos com ícones, fundo derivado da área e cor opcional por tarefa, prioridade sinalizada no ícone. Área padrão reutiliza a última escolha ao criar no aparelho. Versões maiores seguem 1.0, 1.1 até 1.9 e 2.0; correções podem usar terceiro número.
Cores personalizadas acompanham o item no backup e na sincronização, com campo opcional validado para arquivos anteriores. Configurações organizadas em seções expansíveis. Revisão visual móvel realizada. Pop-up do Android permanece dependente da categoria de notificação do aparelho; entrega e vibração foram confirmadas pela titular.
