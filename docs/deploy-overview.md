# Deploy Overview

Recommended production domains:

- Frontend: `finsync.paytech.app.br`
- API: `api-finsync.paytech.app.br`

## Backend

- Run the Node.js API with PM2.
- Keep backend environment variables outside Git.
- Use a production MongoDB cluster with TLS enabled.
- Configure `FRONTEND_URL=https://finsync.paytech.app.br`.
- Configure `PLUGGY_WEBHOOK_URL=https://api-finsync.paytech.app.br/api/open-finance/webhook`.
- Configure `PLUGGY_OAUTH_REDIRECT_URL=https://finsync.paytech.app.br/open-finance/connect`.

Example PM2 flow:

```bash
cd backend
npm ci
npm run prisma:generate
pm2 start src/server.js --name finsync-api
pm2 save
```

## Frontend

- Build static assets with Vite.
- Serve `frontend/dist` through NGINX.

```bash
cd frontend
npm ci
npm run build
```

## NGINX

- Serve the frontend on `finsync.paytech.app.br`.
- Reverse proxy API traffic to the PM2 backend process on `api-finsync.paytech.app.br`.
- Enable gzip or brotli compression.
- Add security headers.
- Redirect HTTP to HTTPS.

## HTTPS

- Use Let's Encrypt or a managed certificate.
- Renew certificates automatically.
- Enforce TLS for both frontend and API domains.

## Pluggy Production Access

- Request/confirm Pluggy production credentials.
- Register production webhook and OAuth redirect URLs.
- Validate webhook signatures if available in the configured Pluggy plan.
- Never expose Pluggy client secret in frontend code.

## Operational Notes

- Use a managed secret store or protected server environment variables.
- Rotate credentials before production if any development secret was shared.
- Enable application logs without logging credentials or tokens.
- Add uptime monitoring for API health: `/api/health`.
