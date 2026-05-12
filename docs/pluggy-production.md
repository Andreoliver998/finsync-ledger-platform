# Pluggy Production Checklist

## Configuration

- [ ] Replace sandbox credentials with production `PLUGGY_CLIENT_ID`.
- [ ] Replace sandbox credentials with production `PLUGGY_CLIENT_SECRET`.
- [ ] Set `PLUGGY_INCLUDE_SANDBOX=false`.
- [ ] Set webhook URL:

```text
https://api-finsync.paytech.app.br/api/open-finance/webhook/pluggy
```

- [ ] Set OAuth redirect URL:

```text
https://finsync.paytech.app.br/open-finance/callback
```

## Validation

- [ ] Authenticated frontend can request `POST /api/open-finance/connect-token`.
- [ ] Pluggy Connect opens with the server-side `connectToken`.
- [ ] Successful connection returns `itemId`.
- [ ] Backend validates `item.clientUserId === req.user.id`.
- [ ] Backend saves connection for the authenticated user.
- [ ] Accounts endpoint returns only user's connected item data.
- [ ] Transactions endpoint validates ownership through account/item.
- [ ] Sync endpoint imports accounts and transactions.
- [ ] Dashboard reflects synced Open Finance data.

## Security guarantees

- [ ] No bank password is stored by FinSync.
- [ ] Pluggy Client Secret is never exposed to frontend.
- [ ] `connectToken` is temporary and not persisted.
- [ ] Logs do not include Authorization, Client Secret, `connectToken` or full payload secrets.
- [ ] Consent copy and privacy policy are ready for production.
- [ ] Future revocation flow is planned.
