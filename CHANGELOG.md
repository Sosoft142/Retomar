# 0.5.6 · Seta dos seletores no celular

Substituída a seta nativa dos seletores de prioridade e status por uma seta com espaço explicitamente reservado. A captura de revisão mostrou que a seta nativa ainda cortava a última letra de Urgente em 320 px, apesar de o cálculo da largura do texto indicar espaço suficiente. Urgente e Em andamento conferidos novamente na imagem final em 320 e 390 px. Cache atualizado para v13.

# 0.5.5 · Controles legíveis e nuvem sem texto

Seletores de prioridade e status passam a usar largura mínima relativa à fonte, espaço reservado para a seta e quebra de linha quando necessário. Corrigido o corte de Urgente e Em andamento no celular, inclusive com texto ampliado.

Configurações sai da navegação principal e passa a ser aberta por uma engrenagem de 44 × 44 px à direita da nuvem. Removida a inscrição de armazenamento local e backup do rodapé. A versão continua apenas no final de Configurações.

Nuvem com verde mais vivo e brilho: durante atividade há pulsação e giro de luz; depois da conferência o brilho fica estável. Sem texto visível, selo ou visto no cabeçalho. Rótulos acessíveis e detalhes do estado permanecem no diálogo e nas configurações. O protocolo de confirmação não mudou.

Adicionados gradiente ambiente em rotação, reflexos nos botões, movimento no gradiente da marca e bordas de luz nas áreas/guias ativas e barra de ações. Efeitos decorativos pausam durante edição, arraste e quando a página fica oculta; a opção de desativar movimento e a preferência do sistema são respeitadas.

79 testes aprovados; revisão em 320, 360, 390, 430, 650 e 1100 px, com fonte ampliada até 160%. Cache v12; dados, credenciais, instalação e criptografia preservados.

# 0.5.4 · Formulários e testes extremos

Impedidos títulos e nomes compostos apenas por caracteres invisíveis, duplicação de itens por envios simultâneos e áreas repetidas por diferentes representações Unicode do mesmo nome. Limites de texto conferidos explicitamente no envio, com mensagens junto aos campos. Tokens com caracteres de controle, invisíveis ou tamanho incompatível são recusados antes da conexão.

Validação de backups recusa campos desconhecidos e identificadores inseguros antes da serialização ou combinação. Isso impede que objetos extras profundamente aninhados provoquem estouro de pilha. Falhas de validação e armazenamento preservam a cópia persistida.

Listas extensas montam até 60 itens por grupo, com orçamento inicial de 240 por visualização e ação Mostrar mais. Busca, contagens, ordem e exportação continuam usando todos os dados. Corrigido transbordamento de cartões com nomes de área longos no celular. Revisados o singular da confirmação de restauração e a limpeza de filtros após restaurar.

Adicionados 18 testes, incluindo 2.000 operações aleatórias reproduzíveis, limites de 20.000 itens e 500 áreas, caracteres especiais, arquivos malformados e falhas de gravação. Cache v11, esquema e chaves de armazenamento preservados.

# 0.5.3 · Interface clara e ajustes no celular

Removidos o modo escuro, seu seletor e os estilos associados. A preferência antiga é descartada sem alterar as demais configurações. A versão aparece uma única vez, ao final de Configurações.

Revisados espaçamentos dos ícones, navegação e cartões. Áreas com altura mínima de 48 px, duas colunas em celulares menores e três em telas intermediárias. O fundo decorativo se dissipa nas bordas da janela, combinando com a cor clara declarada para as barras e a abertura do aplicativo. Sincronização e backup reunidos no mesmo cartão, preservando as ações de conectar, exportar e restaurar.

Cache atualizado para v10; identidade de instalação, dados locais e conexão preservados.

# 0.5.2 · Correção do transporte no navegador

Corrigida a captura de fetch no adaptador de Gist: a função nativa agora é vinculada ao contexto global. Antes, o navegador recusava a chamada com Illegal invocation antes de acessar o GitHub, e o app mostrava uma falha genérica de conexão. Regressões cobrem o transporte padrão e as operações GET/POST/PATCH com verificação do contexto. Cache atualizado para v9; dados, credenciais e criptografia preservados.

# 0.5.1 · Padrão de sincronização e instalação do Silhueta

Implementação iniciada novamente a partir da 0.5.0. Conexão só com token e descoberta automática do Gist. Nuvem de contorno sem fundo, dimensões 44/26 px, estados cinza/verde/vermelho, pulsação de opacidade de 1 s e indicação de falha local. Modal central com cantos de 28 px e rolagem interna. Gatilhos de 1,4 s e 45 s, preservando a conferência remota e os dados existentes.

Cartão Instalar Retomar antes da versão, botão habilitado apenas pelo convite do navegador, contador de tentativas e estados solicitado/cancelado/erro. Aceitação não é tratada como comprovação de instalação no Android. Cartão oculto somente nesta janela em modo standalone. Máscara própria, cores de tema claras, start_url ./index.html, identidade preservada e cache atualizado. Actions testa pull requests antes da publicação em main.

# 0.5.0 · Conexão simples e planejamento unificado

Conexão ao GitHub com token único, descoberta e criação automáticas do Gist e opção de manter o aparelho conectado, seguindo o Silhueta. Backups anteriores com senha continuam compatíveis e são recifrados com o token somente mediante envio e releitura conferidos. O destino e a identidade dos dados permanecem próprios do Retomar.

Planejamento reúne agrupamento por área, por prioridade e sem grupos. Lista compacta e Cartões são modos independentes do agrupamento e ficam salvos por aparelho. A lista compacta é o padrão inicial. Controles e grade de áreas reduzidos; ordenação no painel Filtros. Configurações reorganizadas em seções de aparência, sincronização, áreas, backups e ajuda. Títulos de guias e páginas padronizados.

Formulários e placeholders revisados; mensagens junto aos campos, rejeição de espaços em branco, limpeza dos erros de data/horário e adaptação das caixas e ações em telas estreitas. Dados, esquema 2, IDs e origem preservados.

# 0.4.0 · Organização e sincronização

Arraste de áreas e itens por alças, com ativação por toque prolongado, indicação de destino, rolagem de borda e alternativas por teclado/formulário. Ordem manual persistente e transferência de itens entre áreas. Quatro prioridades com identificação textual, símbolos, cores e visão própria; mover entre os grupos altera a prioridade. Paleta de 16 cores para áreas e 12 destaques. Ícone de retorno transparente, sem quadrado.

Sincronização local-first por GitHub Gist criptografado: destino exclusivo do Retomar, seleção explícita quando ambíguo, senha independente do token, credenciais opcionais por aparelho, combinação determinística por entidade, exclusões duráveis, releitura antes da confirmação, preservação de edição e novas alterações durante requisições. Estados acessíveis de nuvem, desconexão local e limites de concorrência documentados. Migração do esquema 1 para 2 e restauração com revisões novas. Origem, chaves e identidade da PWA preservadas.

# 0.3.1 · Movimento suave

Marca em Space Grotesk local, com degradê estático legível. Fundo com gradientes pulsantes lentos, ícones e controles translúcidos, resposta ao toque e entrada breve ao trocar de área ou visualização. Animações pausam durante edição, busca e segundo plano. Movimento pode ser desativado nas configurações e respeita a preferência de movimento reduzido do aparelho. Áreas, dados, origem, chaves e formato dos backups preservados. Cache atualizado para incluir a nova fonte.

# 0.3.0 · Retomar

Nome público alterado para Retomar na interface, título, manifesto, mensagens e arquivos de backup. Nova identidade visual com ícone de retomada, vidro fosco, degradês suaves, bordas arredondadas e temas claro e escuro. Manrope e Inter incluídas localmente com licenças. As áreas continuam em grade sem rolagem horizontal. Folhas de estilo antigas substituídas por uma única folha organizada. Identidade técnica e conteúdo dos backups preservados.

# 0.2.1

Visual simplificado: áreas em grade com nomes completos e sem rolagem horizontal, cabeçalho reduzido, busca à vista e controles de status, prazo, prioridade e ordenação reunidos em “Filtros”. Contadores e identificação de área repetidos nos cartões foram reduzidos. Dados, chaves e formato dos backups preservados.

# 0.2.0

Interface aproximada do modelo descrito no guia do Tracker de Leituras: abas no topo, visualização por área, cronograma, tabela no computador e cartões no celular, papel e vinho, seis cores de destaque, progresso por área e status diretamente editável. Busca, filtros combinados e ordenação. O esquema de dados, as chaves locais e a identidade de instalação foram preservados.

# 0.1.0

Primeira versão funcional: áreas da vida, itens datados e sem prazo, estados, prioridade, busca, agenda, temas, persistência local, exportação e restauração. Interface prioriza celular. Sincronização remota fica para uma etapa posterior.

