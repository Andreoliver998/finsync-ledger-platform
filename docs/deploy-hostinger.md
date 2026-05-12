# Deploy Hostinger VPS

Assumptions:

- Ubuntu/Debian VPS.
- Repository path: `/var/www/finsync/app`.
- Frontend build path: `/var/www/finsync/frontend/dist`.
- API port: `3104`.

## 1. Install packages

```bash
sudo apt update
sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Clone repository

```bash
sudo mkdir -p /var/www/finsync
sudo chown -R "$USER":"$USER" /var/www/finsync
git clone <REPO_URL> /var/www/finsync/app
cd /var/www/finsync/app
```

## 3. Create backend environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Required production values:

```bash
NODE_ENV=production
PORT=3104
APP_NAME="FinSync API"
DATABASE_URL="<mongodb-atlas-uri>"
JWT_SECRET="<32+ chars random secret>"
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://finsync.paytech.app.br
CORS_ORIGIN=https://finsync.paytech.app.br
CORS_ALLOWED_ORIGINS=https://finsync.paytech.app.br
OPEN_FINANCE_PROVIDER=pluggy
PLUGGY_CLIENT_ID="<production-client-id>"
PLUGGY_CLIENT_SECRET="<production-client-secret>"
PLUGGY_WEBHOOK_URL=https://api-finsync.paytech.app.br/api/open-finance/webhook/pluggy
PLUGGY_OAUTH_REDIRECT_URL=https://finsync.paytech.app.br/open-finance/callback
PLUGGY_INCLUDE_SANDBOX=false
```

Do not commit this file.

## 4. Install dependencies and prepare Prisma

```bash
npm ci --prefix backend
npm run prisma:generate --prefix backend
npm run prisma:push --prefix backend
```

## 5. Start backend with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
pm2 status
pm2 logs finsync-api
```

## 6. Build frontend

```bash
cp frontend/.env.example frontend/.env.production
nano frontend/.env.production
npm ci --prefix frontend
npm run build --prefix frontend
```

## 7. Publish frontend build

```bash
sudo mkdir -p /var/www/finsync/frontend
sudo rsync -a --delete frontend/dist/ /var/www/finsync/frontend/dist/
```

## 8. Configure NGINX

```bash
sudo cp docs/nginx-production.conf.example /etc/nginx/sites-available/finsync.conf
sudo ln -s /etc/nginx/sites-available/finsync.conf /etc/nginx/sites-enabled/finsync.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Configure SSL

```bash
sudo certbot --nginx -d finsync.paytech.app.br -d api-finsync.paytech.app.br
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Validate production

```bash
curl -i https://api-finsync.paytech.app.br/api/health
curl -I https://finsync.paytech.app.br
pm2 status
pm2 logs finsync-api --lines 100
```

Expected health:

```json
{
  "status": "ok",
  "environment": "production"
}
```
