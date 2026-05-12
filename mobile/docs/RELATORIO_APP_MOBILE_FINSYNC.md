# Relatório Técnico e Visual — FinSync Mobile

## 1. Visão geral do FinSync Mobile

O **FinSync Mobile** é um aplicativo financeiro focado em transformar histórico bancário e transacional em uma experiência de leitura analítica no celular. Em vez de atuar apenas como extrato, o app tenta organizar dados financeiros em quatro camadas:

- autenticação e sessão segura;
- visão consolidada do comportamento financeiro;
- exploração de transações e detalhes;
- leitura investigativa com busca, dossiê financeiro, insights e relacionamento entre entidades.

Na prática, o app já funciona como um **cliente mobile analítico** da API FinSync, consumindo resumos, transações, busca semântica e perfis financeiros a partir do backend existente.

---

## 2. Objetivo do app

O app resolve o problema de **entender o histórico financeiro com mais contexto e menos esforço**. Ele tenta responder perguntas como:

- para onde o dinheiro está indo;
- quais padrões de comportamento existem;
- quais pessoas, empresas, bancos, categorias e métodos aparecem com mais relevância;
- como uma transação se conecta com um contexto maior;
- quais sinais financeiros merecem atenção.

O valor do produto não está apenas em listar dados, mas em **traduzir movimentações em interpretação financeira**.

---

## 3. Público-alvo

O produto parece atender principalmente:

- usuários pessoa física que querem entender seus gastos e hábitos;
- usuários com perfil investigativo ou analítico;
- profissionais financeiros ou consultivos que precisam ler comportamento transacional;
- pessoas que desejam transformar extratos em contexto, não apenas em listagem.

Em estágio futuro, a mesma base pode evoluir para:

- gestores financeiros;
- auditoria pessoal/corporativa leve;
- análise operacional de pessoas e empresas.

---

## 4. Funcionalidades atuais

### Login

- tela de autenticação com e-mail e senha;
- validação via `react-hook-form` + `zod`;
- integração com `POST /api/auth/login`;
- exibição de erro amigável;
- armazenamento seguro do JWT em `expo-secure-store`.

### Cadastro

- criação de conta com nome, e-mail e senha;
- validação de formulário;
- integração com `POST /api/auth/register`;
- login automático após retorno com token.

### Hidratação de sessão

- leitura do token no cold start;
- chamada de `GET /api/auth/me`;
- restauração de usuário autenticado;
- limpeza automática da sessão quando ocorre `401`.

### Dashboard

- saudação personalizada;
- saldo consolidado;
- métricas de receitas, despesas, resultado e categorias;
- bloco de insight com atalho para Leitura Inteligente;
- lista de movimentações recentes;
- pull-to-refresh.

### Transações

- listagem completa de lançamentos;
- filtro textual local;
- lista performática com `FlashList`;
- navegação para detalhe.

### Detalhe da transação

- valor em destaque;
- descrição e categoria;
- banco, método, origem e identificador;
- seção opcional de leitura contextual;
- lista opcional de movimentos relacionados.

### Busca Inteligente

- busca textual em histórico;
- uso de debounce;
- retorno de resultados transacionais;
- headline/resumo analítico quando a API envia metadados;
- CTA para abrir dossiê financeiro com `type` e `q`.

### Perfil Financeiro

- launcher amigável quando aberto sem parâmetros;
- seletor de tipo: `person`, `merchant`, `bank`, `paymentMethod`, `category`;
- campo de busca e exemplos rápidos;
- carregamento do dossiê quando há parâmetros válidos;
- exibição de indicadores, destaques e recomendações.

### Relationship Graph

- grafo simplificado com `react-native-svg`;
- visualização circular de entidades e arestas;
- ranking de entidades mais relevantes.

### Leitura Inteligente

- headline principal;
- resumo textual;
- cards de insights detectados;
- exibição opcional de payload bruto textual.

### Configurações

- dados da conta;
- baseURL da API e timeout;
- status de segurança da sessão;
- logout com confirmação.

---

## 5. Mapa de telas

| Tela | Rota / screen | O que mostra | Endpoint usado | Status |
| --- | --- | --- | --- | --- |
| Auth Loading | `AuthLoadingScreen` | hidratação de sessão | `GET /api/auth/me` | pronto |
| Login | `Login` | acesso por e-mail/senha | `POST /api/auth/login` | pronto |
| Cadastro | `Register` | criação de conta | `POST /api/auth/register` | pronto |
| Dashboard | `Dashboard` | visão consolidada, métricas e recentes | `GET /api/sync/dashboard-summary` | pronto |
| Detalhe da transação | `TransactionDetails` | valor, metadados, explicação e relacionados | `GET /api/transactions/:transactionId` | pronto |
| Transações | `Transactions` | lista completa com busca local | `GET /api/dashboard/all-transactions` | pronto |
| Busca Inteligente | `FinancialSearch` | busca analítica no histórico | `GET /api/ledger/search` | pronto |
| Perfil Financeiro | `FinancialProfile` | launcher ou dossiê financeiro | `GET /api/ledger/financial-profile` | parcial |
| Leitura Inteligente | `IntelligentReading` | insights e interpretação | `GET /api/ledger/intelligent-reading` | parcial |
| Relationship Graph | `RelationshipGraph` | mapa simplificado de entidades | `GET /api/ledger/relationship-graph` | parcial |
| Configurações | `SettingsTab` | conta, conexão, sessão e logout | `POST /api/auth/logout` | pronto |

### Observação de navegação

As bottom tabs atuais são:

- `DashboardTab`
- `TransactionsTab`
- `SearchTab`
- `ProfileTab`
- `SettingsTab`

Cada tab principal usa stack própria, com exceção de Ajustes, que hoje é tela direta.

---

## 6. Jornada do usuário

### Fluxo principal

1. O usuário abre o app.
2. O `AuthLoadingScreen` verifica se existe token salvo.
3. Se a sessão for válida, o app entra nas tabs; se não, vai para Login.
4. Após login, o usuário cai no Dashboard.
5. No Dashboard ele vê saldo, receitas, despesas, resumo e movimentos recentes.
6. Ao tocar em uma movimentação, abre o detalhe da transação.
7. Pela aba Transações, ele explora o histórico completo com filtro textual.
8. Pela aba Busca, ele pesquisa termos como empresa, banco, PIX ou categoria.
9. Pela busca, pode abrir um dossiê financeiro contextual.
10. Pela aba Perfil, pode iniciar diretamente um dossiê manual.
11. Dentro do ecossistema analítico, pode evoluir para Leitura Inteligente e Relationship Graph.

### Leitura da jornada

O app já tem uma jornada coerente entre:

- visão macro;
- exploração operacional;
- interpretação analítica.

O principal ponto a evoluir é a **costura entre essas camadas**, para que o usuário entenda naturalmente por que deveria sair de uma lista e entrar em um dossiê, insight ou grafo.

---

## 7. APIs consumidas

| Método | Rota | Finalidade | Tela / módulo |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | autenticar usuário | Login |
| `POST` | `/api/auth/register` | cadastrar usuário | Cadastro |
| `GET` | `/api/auth/me` | restaurar sessão | Auth Loading / AuthContext |
| `POST` | `/api/auth/logout` | encerrar sessão | Configurações / AuthContext |
| `GET` | `/api/sync/dashboard-summary` | resumo consolidado | Dashboard |
| `GET` | `/api/dashboard/metrics` | métricas adicionais disponíveis | API dashboard, hoje sem uso relevante visível na tela |
| `GET` | `/api/dashboard/all-transactions` | lista de lançamentos | Transações |
| `GET` | `/api/transactions/:transactionId` | detalhe de transação | Detalhe da transação |
| `GET` | `/api/ledger/search` | busca no histórico | Busca Inteligente |
| `GET` | `/api/ledger/financial-profile` | dossiê por entidade/tipo | Perfil Financeiro |
| `GET` | `/api/ledger/intelligent-reading` | leitura analítica global | Leitura Inteligente |
| `GET` | `/api/ledger/relationship-graph` | mapa de entidades e conexões | Relationship Graph |

### Integração técnica

- cliente HTTP baseado em `axios`;
- `Bearer Token` automático via interceptor;
- timeout configurável;
- limpeza automática da sessão ao receber `401`;
- debug de `baseURL` em desenvolvimento;
- JWT nunca salvo em `AsyncStorage`.

---

## 8. Avaliação UX/UI atual

### Visual

O app já possui uma base visual boa para um produto financeiro premium:

- fundo escuro consistente;
- cores fortes e bem definidas;
- bom contraste em títulos e CTAs;
- cards com atmosfera de painel analítico.

### Clareza

Os módulos principais são claros:

- Dashboard;
- Transações;
- Busca;
- Perfil;
- Ajustes.

O problema de clareza aparece quando a experiência fica mais analítica. Termos como:

- dossiê;
- leitura inteligente;
- relacionamento;
- perfil financeiro;

ainda não são sempre explicados com suficiente contexto para um usuário comum.

### Hierarquia da informação

Pontos positivos:

- títulos fortes;
- métricas em posição destacada;
- seções bem separadas;
- loading, empty e error com linguagem visual consistente.

Pontos a melhorar:

- excesso de dependência em texto corrido para explicar insight;
- ausência de gráficos ou elementos comparativos rápidos;
- navegação entre screens analíticas ainda pouco conectada.

### Legibilidade

Boa em geral, especialmente:

- contraste de texto;
- tamanhos de títulos;
- blocos de cards.

Limitações:

- algumas telas longas podem ficar densas em aparelhos menores;
- dados analíticos complexos ainda aparecem de forma mais textual do que visual.

### Botões

Os CTAs principais funcionam bem:

- Entrar;
- Criar conta;
- Abrir dossiê;
- Tentar novamente;
- Sair da conta.

Ainda faltam ações mais progressivas e contextuais, como:

- “ver mais”;
- “comparar período”;
- “filtrar por banco”;
- “fixar busca”;
- “explorar relacionamento”.

### Navegação

A navegação por tabs é simples e boa para uso recorrente. O ponto fraco é que o módulo Perfil mistura dois papéis:

- launcher de dossiê;
- hub analítico.

Isso pode ser refinado em uma próxima versão.

### Cards

Os cards têm boa qualidade visual e ajudam a organizar a informação. Ainda assim, muitos deles são **estáticos**. O app pode ganhar valor percebido ao tornar cards mais interativos e exploráveis.

### Responsividade

Para React Native e uso Android, a base está sólida. Há bom uso de:

- `SafeArea`;
- scroll;
- `FlashList`;
- skeleton de carregamento;
- espaçamento consistente.

### Experiência em tela pequena

Funciona, mas módulos analíticos mais densos ainda não aproveitam padrões mobile mais fortes como:

- bottom sheet;
- cards expansíveis;
- accordions;
- filtros horizontais;
- quick actions persistentes.

---

## 9. Problemas identificados

### P0 e estabilidade

- Houve inconsistência recente entre telas que exigiam parâmetros e eram abertas sem contexto, especialmente no Perfil Financeiro.
- Algumas respostas da API possuem shape heterogêneo, o que já exigiu proteção contra renderização de objetos em `<Text>`.
- O app depende de boa padronização do backend para payloads analíticos; hoje a UI precisa absorver variações de campos como `summary`, `title`, `label`, `name` e `relationshipSummary`.

### UX e produto

- Perfil Financeiro ainda depende demais de texto e pouco de visualização.
- Relationship Graph é funcional, mas simples demais para comunicar valor de forma imediata.
- Busca Inteligente já navega para dossiê, mas a inferência de tipo é heurística e pode errar.
- O usuário não recebe explicação suficiente sobre o que é cada módulo analítico.

### Governança técnica

- `lint` ainda é placeholder, sem ESLint real.
- não há `typecheck` formal;
- não há suíte de testes mobile;
- documentação principal do mobile está parcialmente defasada: o `README` menciona Expo SDK 52 / RN 0.76, enquanto `package.json` está em Expo SDK 54 / RN 0.81.

### Interatividade

- faltam filtros rápidos por período;
- faltam comparações visuais;
- faltam gráficos resumidos;
- faltam drill-downs visuais entre dashboard, busca, perfil e relacionamento.

---

## 10. Oportunidades para deixar mais interativo

- Tornar cards do Dashboard clicáveis para abrir visões filtradas.
- Adicionar chips de período: `7 dias`, `30 dias`, `90 dias`, `ano`.
- Permitir preview de transação em modal/bottom sheet antes do detalhe completo.
- Adicionar filtros rápidos em Transações: banco, método, categoria, valor.
- Incluir sugestões de busca em tempo real na Busca Inteligente.
- Transformar o launcher de Perfil em um mini hub com atalho para dossiês recentes.
- Permitir tocar em entidades do grafo para abrir dossiê diretamente.
- Exibir linha do tempo financeira com eventos relevantes.
- Criar cards “investigue agora” baseados em anomalias detectadas.
- Adicionar assistente financeiro conversacional com prompts prontos.

---

## 11. Oportunidades para deixar mais visual

- Gráfico simples de receitas vs despesas no Dashboard.
- Barra de composição por categoria.
- Indicador circular de saúde financeira.
- Timeline mensal com picos de entrada e saída.
- Heatmap de recorrência de gastos.
- Ícones por categoria, banco e método de pagamento.
- Ranking visual de pessoas/empresas mais frequentes.
- Mini grafo resumido no Dashboard com top conexões.
- Badges de comportamento: recorrente, sazonal, atípico, concentrado.
- Paleta semântica por tipo de movimentação e por método de pagamento.

---

## 12. Oportunidades para deixar mais compreensível

- Explicar em linguagem humana o propósito de cada módulo analítico.
- Incluir textos curtos como “o que esta tela faz”.
- Adicionar exemplos visíveis de busca logo na tela de Busca.
- Adicionar microcópias melhores em estados vazios.
- Explicar porque um insight importa e qual ação o usuário pode tomar.
- Trocar rótulos excessivamente técnicos por linguagem orientada a benefício.
- Mostrar resumos executivos antes dos dados detalhados.
- Exibir tooltips ou notas curtas para `dossiê`, `leitura` e `relacionamentos`.

---

## 13. Melhorias por prioridade

### P0 — essencial

- Consolidar payloads analíticos e reduzir variação de shape na UI.
- Implementar lint real e checagens mínimas de qualidade.
- Revisar mensagens de erro de rede, autenticação e ausência de dados.
- Corrigir drift documental entre README e dependências atuais.
- Garantir navegação consistente entre Busca, Perfil, Leitura e Grafo.

### P1 — importante

- Adicionar filtros rápidos e chips de período.
- Melhorar a explicação de cada tela analítica.
- Criar estados vazios mais didáticos e acionáveis.
- Transformar cards principais em elementos exploráveis.
- Melhorar o detalhamento de transações relacionadas.

### P2 — visual/interativo

- Adicionar gráficos leves no Dashboard.
- Introduzir bottom sheets e previews contextuais.
- Melhorar o Relationship Graph com interação por toque.
- Criar ranking visual de entidades.
- Adicionar badges e indicadores comportamentais.

### P3 — futuro avançado

- Assistente financeiro conversacional.
- análise preditiva;
- alertas inteligentes;
- score financeiro interno;
- modo auditor e relatórios explicáveis.

---

## 14. Roadmap recomendado

### Fase 1: corrigir bugs e navegação

- padronizar fluxos de params entre busca, perfil e detalhe;
- fortalecer resiliência contra payloads heterogêneos;
- consolidar mensagens de erro e estados vazios;
- alinhar documentação técnica com o projeto atual.

### Fase 2: melhorar telas atuais

- reforçar clareza do Dashboard;
- adicionar filtros em Transações;
- enriquecer detalhe da transação;
- melhorar launcher do Perfil com histórico recente e recomendações.

### Fase 3: adicionar interatividade

- cards clicáveis;
- bottom sheets;
- atalhos contextuais;
- dossiês recentes;
- navegação cruzada entre insights, entidades e transações.

### Fase 4: gráficos e visualização

- receitas vs despesas;
- composição por categoria;
- timeline financeira;
- ranking visual;
- mini visualizações no Dashboard e no Perfil.

### Fase 5: IA financeira conversacional

- perguntas em linguagem natural;
- resumos diários e mensais;
- recomendações acionáveis;
- explicação de padrões;
- detecção narrativa de anomalias.

---

## 15. Sugestão de novas funcionalidades

- resumo financeiro diário;
- alertas inteligentes de gasto fora do padrão;
- metas financeiras;
- orçamento por categoria;
- análise de recorrência;
- score financeiro interno;
- monitoramento de PIX;
- ranking de empresas e pessoas;
- dossiê detalhado por entidade;
- notificações com eventos relevantes;
- modo auditor;
- relatório mensal automático;
- comparador de períodos;
- feed de insights acionáveis;
- favoritos de entidades e buscas.

---

## 16. Conclusão executiva

O **estado atual do FinSync Mobile é bom como base funcional e conceitual**. O app já tem:

- autenticação segura;
- integração real com backend;
- navegação coerente;
- módulos de dashboard, transações e detalhe bem estabelecidos;
- proposta analítica diferenciada no mobile.

O maior potencial do produto está na camada que o diferencia de um app financeiro comum: **interpretação, contexto e relacionamento entre dados**. Essa visão já existe no app, mas ainda está mais forte no conceito do que na experiência visual e interativa.

Os próximos passos mais recomendados são:

1. consolidar robustez e clareza dos módulos analíticos;
2. melhorar a transição entre exploração e interpretação;
3. introduzir visualizações simples e interações móveis mais fortes;
4. evoluir para uma experiência de inteligência financeira verdadeiramente orientada a decisão.

Se a execução seguir essa direção, o FinSync Mobile pode sair de um bom cliente financeiro com leitura analítica para um **produto mobile premium de inteligência financeira**, com proposta realmente distinta no mercado.
