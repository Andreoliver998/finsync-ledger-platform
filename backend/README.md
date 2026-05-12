# Financeiro Backend

Backend inicial para um sistema de gestão financeira pessoal usando **Node.js**, **Express**, **Prisma** e **MongoDB**.

## Funcionalidades incluídas

- Cadastro e login de usuário
- Autenticação com JWT
- CRUD de cartões
- CRUD de categorias
- CRUD de transações
- Consulta de resumo financeiro
- Integração Open Finance preparada via Pluggy Connect
- Prisma configurado para MongoDB
- Validação com Zod
- Middlewares de autenticação, erro, segurança, CORS e rate limit

## Instalação

```bash
npm install
```

Para instalar apenas a dependência de Open Finance:

```bash
npm install pluggy-sdk
```

Copie o `.env.example` para `.env`:

```bash
copy .env.example .env
```

Configure sua `DATABASE_URL`, `JWT_SECRET` e credenciais Pluggy:

```env
OPEN_FINANCE_PROVIDER=pluggy
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=
PLUGGY_WEBHOOK_URL=
PLUGGY_OAUTH_REDIRECT_URL=
```

`PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` ficam somente no backend. Não envie esses valores ao frontend.

Gere o client do Prisma:

```bash
npm run prisma:generate
```

Envie o schema para o MongoDB:

```bash
npm run prisma:push
```

Rode o servidor:

```bash
npm run dev
```

Para a futura integracao React com Pluggy Connect, consulte `docs/open-finance-react.md`.

## Rotas principais

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Cards

- `POST /api/cards`
- `GET /api/cards`
- `GET /api/cards/:id`
- `PUT /api/cards/:id`
- `DELETE /api/cards/:id`

### Categories

- `POST /api/categories`
- `GET /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Transactions

- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Summary

- `GET /api/summary/monthly?month=5&year=2026`

### Open Finance

- `POST /api/open-finance/connect-token`
- `GET /api/open-finance/connections`
- `POST /api/open-finance/connections`
- `GET /api/open-finance/items/:itemId/accounts`
- `GET /api/open-finance/accounts/:accountId/transactions`
- `GET /api/open-finance/items/:itemId/credit-cards`
- `POST /api/open-finance/webhook/pluggy`

As rotas Open Finance, exceto webhook, exigem `Authorization: Bearer <jwt>`.

## Fluxo Open Finance com Pluggy

1. Backend cria um `connectToken` temporário usando `clientUserId` do usuário autenticado.
2. Frontend abre o Pluggy Connect com esse `connectToken`.
3. Usuário autoriza Nubank ou outro banco pelo fluxo seguro da Pluggy/Open Finance.
4. Frontend recebe o `itemId` retornado pela Pluggy.
5. Backend salva uma `BankConnection` vinculada ao usuário autenticado.
6. Backend consulta contas, cartões de crédito e transações usando a API da Pluggy.

O backend não solicita CPF, senha bancária, SMS, MFA ou credenciais do banco. Também não armazena credenciais bancárias.

## Testes manuais

### Gerar connectToken

```http
POST /api/open-finance/connect-token
Authorization: Bearer TOKEN_JWT
Content-Type: application/json
```

Body vazio.

### Listar conexões

```http
GET /api/open-finance/connections
Authorization: Bearer TOKEN_JWT
```

### Salvar conexão após retorno do frontend

```http
POST /api/open-finance/connections
Authorization: Bearer TOKEN_JWT
Content-Type: application/json

{
  "itemId": "ITEM_ID_RETORNADO_PELA_PLUGGY",
  "institution": "Nubank",
  "status": "CONNECTED"
}
```

### Consultar dados Pluggy

```http
GET /api/open-finance/items/ITEM_ID_RETORNADO_PELA_PLUGGY/accounts
Authorization: Bearer TOKEN_JWT
```

```http
GET /api/open-finance/accounts/ACCOUNT_ID_RETORNADO_PELA_PLUGGY/transactions
Authorization: Bearer TOKEN_JWT
```

## Observação importante sobre integrações bancárias

Este projeto deixa uma camada `BankIntegrationService` preparada. Para uso real com banco/cartão, prefira APIs oficiais, Open Finance autorizado ou integração consentida. Não armazene senhas bancárias do usuário.
