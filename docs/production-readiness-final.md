# Production Readiness Final

Data: 2026-05-08

## Frontend

- [x] React/Vite isolated in `frontend/`.
- [x] Production API env uses `VITE_API_BASE_URL`.
- [x] Official API URL: `https://api-finsync.paytech.app.br/api`.
- [x] No hardcoded token or API secret.
- [x] Pluggy Connect keeps `connectToken` in runtime state only.
- [x] Production build validated.
- [ ] Deploy `frontend/dist` to `/var/www/finsync/frontend/dist`.

## Backend

- [x] Express API isolated in `backend/`.
- [x] `GET /api/health` returns status and environment.
- [x] Helmet, CORS, rate limit and secure errors active.
- [x] `trust proxy` enabled in production.
- [x] Env validation fails fast for required secrets.
- [x] PM2 config created without secrets.
- [ ] Real production `.env` created only on VPS.

## Pluggy/Open Finance

- [x] Webhook route preserved.
- [x] Webhook URL documented.
- [x] OAuth redirect URL set to `/open-finance/callback`.
- [x] Sandbox disabled in production config.
- [ ] Production Pluggy credentials configured on VPS.
- [ ] Real connect/sync/dashboard flow validated.

## MongoDB

- [x] Prisma/MongoDB production checklist created.
- [ ] Atlas cluster configured.
- [ ] IP whitelist restricted to VPS.
- [ ] Backups enabled and restore tested.

## DNS

- [x] DNS checklist created.
- [ ] `finsync.paytech.app.br` A record points to VPS.
- [ ] `api-finsync.paytech.app.br` A record points to VPS.
- [ ] Propagation validated.

## SSL

- [x] Certbot instructions created.
- [x] NGINX HTTP to HTTPS redirect template created.
- [ ] Certificates issued on VPS.
- [ ] Renewal dry run passed.

## Security

- [x] `.env` ignored.
- [x] No secrets in PM2/GitHub workflow.
- [x] Logs redact sensitive fields.
- [x] NGINX security headers documented.
- [ ] GitHub secret scanning enabled.
- [ ] Branch protection enabled.

## LGPD

- [ ] Privacy policy published.
- [ ] Consent language reviewed.
- [ ] Data deletion/export procedure defined.
- [ ] Incident response contact defined.

## Deploy

- [x] Hostinger deploy runbook created.
- [x] NGINX example created.
- [x] SSL guide created.
- [x] GitHub Actions workflow created.
- [ ] Execute first deployment on VPS.
- [ ] Run post-deploy smoke tests.
