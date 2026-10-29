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

