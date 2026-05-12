# FinSync

FinSync Ledger is a financial operations platform focused on CSV ingestion, OneDrive synchronization and financial reconciliation. The stack combines a React admin interface with a Node.js API, Prisma, MongoDB, JWT authentication, manual entries, reports, settings, goals, cards, alerts, basic financial AI insights, and investments.

## Stack

- Frontend: React, Vite, HTML, CSS, JavaScript
- Backend: Node.js, Express, Prisma
- Database: MongoDB
- Auth: JWT for web access
- Automated file source: OneDrive + Microsoft Graph
- Manual file source: CSV upload
- UI: premium dark fintech dashboard

## Project Structure

```text
/
├── backend/
├── frontend/
├── docs/
├── backups/
├── ecosystem.config.cjs
├── README.md
├── .gitignore
└── package.json
```

## Features

- Secure user registration and login with JWT
- CSV import preview/confirm flow
- OneDrive OAuth2 synchronization flow
- Financial dashboard with account and transaction insights
- Manual transaction management
- Reports module
- Settings module
- Goals module
- Cards module
- Alerts module
- Basic Financial AI module
- Investments module

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

The backend runs on `http://localhost:3333` by default.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use:

```bash
cp .env.example .env
```

The frontend runs on `http://localhost:5173` by default.

## Environment Variables

Backend variables live in `backend/.env`:

- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: long random JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration window
- `FRONTEND_URL`: allowed frontend origin
- `PLUGGY_CLIENT_ID`: Pluggy client identifier
- `PLUGGY_CLIENT_SECRET`: Pluggy client secret
- `PLUGGY_WEBHOOK_URL`: backend webhook URL
- `PLUGGY_OAUTH_REDIRECT_URL`: frontend redirect URL

Frontend variables live in `frontend/.env`:

- `VITE_API_URL`: backend API base URL
- `VITE_APP_NAME`: public application name

Never commit `.env` files. Only commit `.env.example` files with placeholders.

## Prisma and MongoDB

The Prisma schema is located at `backend/prisma/schema.prisma` and uses MongoDB. After changing Prisma models, run:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

Use a dedicated MongoDB user with least privilege for production. Rotate credentials immediately if a connection string is ever exposed.

## OneDrive / CSV

This version uses MongoDB as the official persistence layer and OneDrive only as an input source for CSV files. Microsoft credentials must stay only in the backend environment. The frontend must never receive the Microsoft client secret or persistent Microsoft tokens.

## Development

Run the apps in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Or run inside each package:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Production Overview

- Build frontend static assets with `npm run build --prefix frontend`
- Run backend with PM2 using `ecosystem.config.cjs`
- Put NGINX in front of the frontend and API
- Enforce HTTPS
- Configure Microsoft Graph OAuth app and redirect URLs
- Store secrets in the server environment or a managed secret store

Production runbooks live in:

- `docs/deploy-hostinger.md`
- `docs/nginx-production.conf.example`
- `docs/ssl-setup.md`
- `docs/pluggy-production.md`
- `docs/mongodb-production.md`
- `docs/production-readiness-final.md`

## Security

- Do not commit `.env`, secrets, API keys, JWT secrets, MongoDB URIs, Microsoft client secrets, or bearer tokens.
- Keep the GitHub repository private until a full production security review is complete.
- Rotate secrets if they were ever printed, shared, or committed.
- Use least privilege database credentials.
- Keep dependencies updated and review security advisories before production deploys.
