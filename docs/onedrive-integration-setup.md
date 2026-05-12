# OneDrive Integration Setup

## Objetivo

Integrar o FinSync Ledger ao OneDrive como caixa de entrada de arquivos CSV, mantendo o MongoDB como persistência principal.

## Azure App Registration

1. Acesse Microsoft Entra ID.
2. Crie uma App Registration do tipo web.
3. Configure redirect URI:
   - local: `http://localhost:3334/api/onedrive/callback`
   - produção: `https://api-ledger.paytech.app.br/api/onedrive/callback`
4. Gere um `Client Secret`.
5. Copie também o `Directory (tenant) ID`.
6. Em API permissions, adicione:
   - `offline_access`
   - `Files.Read`
   - `User.Read`
7. Garanta consentimento conforme o tenant exigir.

## Variáveis de ambiente

Backend:

```env
ENABLE_PLUGGY=false
MICROSOFT_CLIENT_ID=
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3334/api/onedrive/callback
MICROSOFT_SCOPES=offline_access Files.Read User.Read
TOKEN_ENCRYPTION_SECRET=
```

## Segurança

- nunca expor `MICROSOFT_CLIENT_SECRET` ao frontend
- nunca expor `MICROSOFT_TENANT_ID` como segredo; ele pode existir na documentação de deploy, mas não deve ser hardcoded em frontend
- nunca expor `accessToken` ou `refreshToken`
- tokens ficam armazenados criptografados
- `state` OAuth é assinado e vinculado ao `userId`

## Pastas esperadas

- `/FinSync-Ledger/Entrada`
- `/FinSync-Ledger/Processados`
- `/FinSync-Ledger/Erros`
- `/FinSync-Ledger/Arquivo`

Observação:
- com `Files.Read`, a aplicação consegue listar e baixar arquivos
- mover arquivos para `Processados`/`Erros` exigirá escopo de escrita em fase futura
