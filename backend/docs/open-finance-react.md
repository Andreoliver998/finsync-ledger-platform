# Open Finance React

Este documento descreve a integração futura do frontend React com Pluggy Connect. Ele nao implementa tela completa; serve como referencia segura para consumo dos endpoints do backend.

## Regras de seguranca

- O React nunca deve receber `PLUGGY_CLIENT_SECRET`.
- O React nunca deve guardar API Key, Client Secret ou token fixo no codigo.
- O `connectToken` deve ser solicitado ao backend apenas no momento de abrir o Pluggy Connect.
- O `connectToken` e temporario e nao deve ser persistido em localStorage/sessionStorage.
- O frontend deve enviar apenas o `itemId` retornado pela Pluggy para o backend salvar a conexao.

## Fluxo esperado

1. Usuario autenticado clica para conectar banco.
2. React chama `POST /api/open-finance/connect-token`.
3. Backend gera `connectToken` com `clientUserId` igual ao `req.user.id`.
4. React abre `PluggyConnect` com o `connectToken`.
5. Pluggy retorna `itemData` no `onSuccess`.
6. React extrai `itemData.item.id`.
7. React chama `POST /api/open-finance/connections` com o `itemId`.
8. Backend valida e salva a `BankConnection`.

## Dependencia futura no frontend

```bash
npm install react-pluggy-connect
```

## Exemplo seguro

```jsx
import { PluggyConnect } from "react-pluggy-connect";
import { api } from "../services/api";

export function OpenFinanceConnectButton({ connectToken, onClose }) {
  return (
    <PluggyConnect
      connectToken={connectToken}
      onSuccess={async (itemData) => {
        const itemId = itemData?.item?.id;

        if (!itemId) {
          return;
        }

        await api.post("/open-finance/connections", {
          itemId,
          institution: itemData?.item?.connector?.name || "Unknown",
          status: "CONNECTED"
        });
      }}
      onClose={onClose}
    />
  );
}
```

## Exemplo de chamada para gerar connectToken

```js
const response = await api.post("/open-finance/connect-token");
const connectToken = response.data.data.connectToken;
```

O `api` deve adicionar o JWT do usuario autenticado no header `Authorization: Bearer <token>`. Nao envie credenciais Pluggy no frontend.
