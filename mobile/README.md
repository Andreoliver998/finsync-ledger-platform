# FinSync Mobile (Android)

App Android do **FinSync** construído com React Native + Expo. Consome a API
existente em `backend/` sem alterar contratos.

> Esta pasta é independente do monorepo raiz (não está no `workspaces`). Tem o
> próprio `package.json` para evitar conflitos com o frontend web e o backend.

---

## Stack

- React Native 0.81.x + Expo SDK 54 (Nova Arquitetura habilitada)
- React Navigation 7 (Native Stack + Bottom Tabs)
- TanStack Query 5 (cache, refetch e estados de erro/loading)
- Axios + Interceptors Bearer
- expo-secure-store (Android Keystore para o JWT — nunca AsyncStorage)
- react-hook-form + Zod
- @shopify/flash-list
- react-native-svg (grafo de relacionamentos)

---

## Estrutura

```
mobile/
  App.js
  app.json
  babel.config.js
  metro.config.js
  jsconfig.json
  src/
    bootstrap/
    navigation/
      RootNavigator.js
      AuthStack.js
      AppTabs.js
      DashboardStack.js
      TransactionsStack.js
      SearchStack.js
      ProfileStack.js
      navigationTheme.js
      screenOptions.js
    screens/
    features/
      auth/        (LoginScreen, RegisterScreen, AuthLoadingScreen, schemas)
      dashboard/   (DashboardScreen + api/dashboardApi)
      transactions/(TransactionsScreen, TransactionDetailsScreen, api)
      search/      (FinancialSearchScreen + api)
      financialProfile/    (FinancialProfileScreen + api)
      intelligentReading/  (IntelligentReadingScreen + api)
      relationshipGraph/   (RelationshipGraphScreen + api)
      settings/    (SettingsScreen)
    components/  (AppScreen, AppCard, AppButton, AppInput, MetricCard, TransactionRow, InsightCard, EmptyState, LoadingSkeleton, ErrorState, SectionHeader,
                  ScreenIntro, QuickPeriodChips, ActionCard, InfoHint, SmartEmptyState, SmartErrorState,
                  MetricProgressBar, FinancialMiniChart, RankingList, InsightBadge, AmountTrendCard)
    services/    (api.js, tokenStorage.js, queryClient.js)
    hooks/       (useAuth, useDebouncedValue)
    contexts/    (AuthContext)
    utils/       (errors, money, date)
    theme/       (colors, spacing, typography, index)
    types/       (JSDoc typedefs)
```

Aliases configurados em `babel.config.js` (via `babel-plugin-module-resolver`)
e em `jsconfig.json` (para IntelliSense no VS Code):

```
@bootstrap/*  @navigation/*  @screens/*  @features/*  @components/*
@services/*  @hooks/*  @contexts/*  @utils/*  @theme/*  @types/*
```

---

## Melhorias Premium (v2 — Mai/2026)

### Telas melhoradas

| Tela | O que mudou |
| --- | --- |
| **FinancialProfileScreen** | Dossiê investigativo completo: fluxo financeiro com barra proporcional (entrada vs saída), badge de confiança, período analisado (primeira → última aparição), barra de ações (buscar, grafo, novo, exportar), transações relacionadas clicáveis, maior transação destacada. |
| **IntelligentReadingScreen** | Reescrita completa: suporte à payload rica da API (narrative, moneyFlow, pixAnalysis, merchantAnalysis, peopleAnalysis, paymentMethodAnalysis, recurrenceAnalysis, alerts, recommendations, insights legados). Estado vazio com navegação para outras telas. Badge de confiança. |
| **RelationshipGraphScreen** | Nós SVG interativos com `onPress` que abrem o dossiê financeiro da entidade. Cards de "Top conexões" com barra de força relacional e ícone por tipo de entidade. Instrução visual de uso. |
| **ProfileStack** | `TransactionDetailsScreen` adicionada à stack, permitindo navegação de transações relacionadas diretamente do dossiê. |

### Utilitários novos

`src/utils/formatters.js`:
- `formatEntityType(type)` — label humano por tipo
- `getEntityColor(type)` / `getEntityBg(type)` / `getEntityIcon(type)` — visual por tipo
- `getDirectionColor(direction)` — verde/vermelho por direção financeira
- `getMethodIcon(method)` — ícone por método de pagamento
- `formatPercent(value)` — formata decimal (0.36) ou percentual (36) como "36%"
- `inferEntityType(name)` — infere o tipo a partir do nome

### Como testar o dossiê financeiro

1. Abra a aba **Perfil** → tela inicial mostra o launcher
2. Digite "Enilton" e selecione tipo "Pessoa" → toque "Abrir dossiê"
3. O dossiê exibe: fluxo financeiro, relacionamento, métodos, categorias, sinais
4. Toque em "Buscar" na barra de ações → abre busca com prefill
5. Toque em "Grafo" → abre o grafo de relacionamentos
6. Toque em um nó do grafo → abre dossiê da entidade tocada

### Como testar a Leitura Inteligente

1. Abra a aba **Dashboard** → role até o botão de Leitura Inteligente
2. Se a API retornar dados, verá: narrativa, fluxo, PIX, merchants, pessoas, métodos, alertas
3. Se não houver dados, verá estado vazio com botões de navegação
4. Pull-to-refresh força nova consulta ao endpoint

### Validação com dados reais

```bash
# Emulador Android — confirme que o backend está de pé
EXPO_PUBLIC_API_URL=http://10.0.2.2:3334/api

# Testar endpoint diretamente
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3334/api/ledger/financial-profile?type=person&q=Enilton

curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3334/api/ledger/intelligent-reading
```

### Observações sobre endpoints

- `GET /api/ledger/intelligent-reading` — resposta pode incluir campos `moneyFlow`, `pixAnalysis`, `merchantAnalysis`, `peopleAnalysis`, `paymentMethodAnalysis`, `recurrenceAnalysis`, `alerts`, `recommendations` além dos `insights` legados
- `GET /api/ledger/financial-profile` — pode retornar `totalSent`/`totalReceived`, `firstSeen`/`lastSeen`, `confidence`, `relatedTransactions`, `largestTransaction` para habilitar as novas seções do dossiê
- `GET /api/ledger/relationship-graph` — os nós devem incluir `type` ou `entityType` para colorir corretamente; sem esse campo, o tipo é inferido pelo nome

---

## Componentes visuais (Fase 2)

Gráficos e visualizações são **mobile-first e leves** — implementados com `View` e `StyleSheet`,
sem dependências pesadas de SVG. Isso garante compatibilidade total com a Nova Arquitetura do
React Native e zero overhead de bridge para renderização.

| Componente | Descrição |
| --- | --- |
| `MetricProgressBar` | Barra de progresso horizontal com label, valor/total, tone e caption. Tones: `positive`, `negative`, `accent`, `primary`, `secondary`, `warning`, `neutral`. |
| `FinancialMiniChart` | Barra de composição receitas vs. despesas com proporcionalidade por `flex`. Mostra legenda e indicador de tendência (+/- resultado). |
| `RankingList` | Lista ranqueada com barras proporcionais (mínimo 2% para visibilidade). Suporta `labelKey`, `valueKey`, `tone`, `maxItems` e `showAmount`. |
| `InsightBadge` | Badge pill com ícone + label. Variantes preset: `positivo`, `atencao`, `alto-gasto`, `sem-dados`, `pix`, `debito`, `credito`, `transferencia`, `boleto`, `entrada`, `saida`, `neutro`. Aceita props customizadas `icon`, `label`, `color`, `bg`. Tamanhos: `md` e `sm`. |
| `AmountTrendCard` | Card com valor formatado em BRL e delta de tendência (↑↓) com cor automática. |

### Componentes de UX (Fase 1)

| Componente | Descrição |
| --- | --- |
| `ScreenIntro` | Bloco introdutório com ícone e descrição no topo das telas analíticas. |
| `QuickPeriodChips` | Chips horizontais para seleção de período (7 dias, 30 dias, 90 dias, Ano). |
| `ActionCard` | Card pressável com círculo de ícone, título, subtítulo e chevron. |
| `InfoHint` | Box inline com ícone para dicas contextuais. Tones: `info`, `warning`, `success`, `primary`. |
| `SmartEmptyState` | Estado vazio com sugestões de busca em chips clicáveis. |
| `SmartErrorState` | Estado de erro com mapeamento contextual por código (rede, 401, 403, 404, 500). |

---

## Como rodar (Android Studio / Emulator)

### 1. Pré-requisitos

- Node.js 20+
- Android Studio com pelo menos um AVD criado (recomendado: Pixel 7, API 34)
- JDK 17
- Variáveis de ambiente: `ANDROID_HOME`, `JAVA_HOME`

### 2. Instalar dependências

```bash
cd mobile
npm install
```

### 3. Backend rodando

O backend FinSync escuta em `http://localhost:3334/api` (porta vinda de
`backend/src/config/env.js`) e sobe em `0.0.0.0`, então aceita conexões da rede local.
Garanta que `npm run dev` está ativo dentro de `backend/`
**antes** de iniciar o app.

### 4. Base URL da API

Valores corretos por ambiente:

Para **Android Emulator**:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3334/api
```

Para **celular físico**:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3334/api
```

O Android Emulator **não enxerga `localhost`** do host — ele usa `10.0.2.2`.
Os fallbacks em `app.json` continuam como referência:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrlAndroid": "http://10.0.2.2:3334/api",
      "apiBaseUrlIos": "http://localhost:3334/api",
      "apiBaseUrlDevice": "http://192.168.0.10:3334/api"
    }
  }
}
```

Para **Android Emulator**, o `mobile/.env` deste projeto já está configurado com:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3334/api
```

Para **dispositivo físico**, troque temporariamente o `.env` para o IP da sua máquina:

```
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3334/api
```

O client mobile aceita `EXPO_PUBLIC_API_URL` como chave principal e também lê
`EXPO_PUBLIC_API_BASE_URL` por compatibilidade com a versão inicial do setup.

### 4.1 Descobrir o IP local

No Windows:

```bash
ipconfig
```

Procure o `Endereço IPv4` da interface Wi-Fi ou Ethernet.

Exemplo real desta máquina no momento da correção:

```text
192.168.1.103
```

### 4.2 Testar no celular

No navegador do celular, abra:

```text
http://SEU_IP_LOCAL:3334/api/health
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

### 5. Iniciar o app

```bash
# Modo Metro (recomendado para iterar)
npx expo start --clear --port 8082

# Em outro terminal, pressione 'a' para abrir no Android Emulator,
# ou diretamente:
npx expo run:android
```

### 6. Abrir no Android Studio

```bash
# Gera a pasta android/ nativa (apenas se for fazer build standalone)
npx expo prebuild --platform android

# Abra ./android no Android Studio
```

> Para o fluxo de desenvolvimento normal, **não é necessário** rodar `prebuild`.
> O Expo Go (até onde os pacotes nativos permitirem) ou o `expo run:android`
> já cobrem o ciclo dev.

Passo a passo no Android Studio:

1. Abra o Android Studio.
2. Use `More Actions` → `Virtual Device Manager` e inicie um emulator Android.
3. Na pasta `mobile`, confirme que o `.env` está com `http://10.0.2.2:3334/api`.
4. Rode `npx expo start --clear --port 8082`.
5. Com o emulator aberto, pressione `a` no terminal do Expo.
6. Se precisar do projeto nativo Android, rode `npx expo prebuild --platform android` e abra `mobile/android`.

---

## Endpoints consumidos

| Tela                       | Endpoint                                   |
| -------------------------- | ------------------------------------------ |
| LoginScreen                | `POST /api/auth/login`                     |
| RegisterScreen             | `POST /api/auth/register`                  |
| Hidratação de sessão       | `GET  /api/auth/me`                        |
| Logout                     | `POST /api/auth/logout`                    |
| DashboardScreen            | `GET  /api/sync/dashboard-summary`         |
| TransactionsScreen         | `GET  /api/dashboard/all-transactions`     |
| TransactionDetailsScreen   | `GET  /api/transactions/:transactionId`    |
| FinancialSearchScreen      | `GET  /api/ledger/search`                  |
| FinancialProfileScreen     | `GET  /api/ledger/financial-profile`       |
| IntelligentReadingScreen   | `GET  /api/ledger/intelligent-reading`     |
| RelationshipGraphScreen    | `GET  /api/ledger/relationship-graph`      |

Todas as rotas (exceto login/register) são chamadas com `Authorization: Bearer <jwt>`
adicionado automaticamente pelo interceptor em `src/services/api.js`.

---

## Segurança

- JWT é persistido apenas via **`expo-secure-store`** (Android Keystore).
- O token é mantido em memória durante a sessão para evitar I/O por request,
  mas o SecureStore é a **source of truth** após reload do app.
- Resposta **401** dispara: limpar token, limpar `QueryClient` e redirecionar
  para a `AuthStack`.
- Nada de logs com token ou payloads financeiros sensíveis.
- Estrutura preparada para refresh token (vide `registerUnauthorizedHandler`).

---

## Tema (dark premium)

Tokens em `src/theme/colors.js`:

| Token        | Cor       |
| ------------ | --------- |
| background   | `#0D0D1A` |
| surface      | `#12122B` |
| surface2     | `#1A1A35` |
| primary      | `#7C3AED` |
| secondary    | `#06B6D4` |
| accent       | `#9DFF2C` |
| action       | `#FB9B36` |
| text         | `#F1F5F9` |
| muted        | `#94A3B8` |

---

## Roadmap (fora desta fase)

- Importação CSV nativa
- OneDrive OAuth mobile
- Biometria (LocalAuthentication)
- Notificações push
- Offline cache profundo
- IA conversacional

---

## Comandos úteis

```bash
npm start              # Inicia o Metro
npm run android        # Compila e abre no Emulator
npm run prebuild       # Gera o projeto Android nativo
npx expo-doctor        # Checagem de saúde do projeto Expo
```

## Troubleshooting

- `icon.png` / `splash.png` não encontrado:
  verifique se a pasta `mobile/assets/` existe. Ela faz parte do setup do Expo.
- `Network Error` no login:
  confirme que o backend está de pé em `http://localhost:3334` e que
  `http://10.0.2.2:3334/api` está no `.env` ao usar Android Emulator.
- celular abre o app mas não autentica:
  teste `http://SEU_IP_LOCAL:3334/api/health` no navegador do celular.
  Se não abrir, o problema está na rede local, firewall do Windows ou IP incorreto.
- o erro ainda mostra `10.0.2.2` no celular físico:
  feche o Expo Go, rode `npx expo start --clear --port 8082` novamente e escaneie
  o QR Code de novo para forçar um bundle com `.env` atualizado.
- o emulator abre o app mas o login falha:
  confirme que o backend está rodando em `3334` e que o bundle foi reiniciado
  depois da mudança no `.env`.
- `401 Unauthorized` após abrir o app:
  o mobile limpa a sessão automaticamente e volta para a `AuthStack`. Faça login novamente.
- Emulator abre mas o app não instala:
  execute `adb devices`, confirme o AVD ativo e rode `npx expo run:android`.
- Problemas de cache do Metro:
  rode `npx expo start -c`.
- Projeto não abre no Android Studio:
  gere antes a pasta nativa com `npx expo prebuild --platform android`.
