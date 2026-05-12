# FinSync Security Readiness Report

Data: 2026-05-08

## Score

Score atual: 82/100

Critério: hardening aplicado no app, preservação de contratos, isolamento por usuário, validações, logs, CORS, headers, rate limits, env e checklist de produção. O score ainda não é maior porque faltam testes de integração de segurança, validação assinada de webhook e controles operacionais reais de produção.

## Proteções implementadas

- Helmet com CSP e headers explícitos.
- CORS com allowlist por ambiente, sem wildcard em produção.
- Rate limits por endpoints sensíveis e limite geral de API.
- JWT com algoritmo fixo, issuer, audience, expiração e payload mínimo.
- Boot fail-fast para env obrigatória e secret forte em produção.
- Logger com redaction de tokens, secrets, Authorization, cookies e URIs sensíveis.
- Sanitização central de body/query/params contra NoSQL injection e prototype pollution.
- Validação adicional de params/query em Open Finance e sync.
- Pluggy sandbox desativado em produção.
- Frontend sem fallback localhost em produção e sem log de `itemId`.
- Interceptor de 401/403 preparado para logout automático.
- `.env` ignorado pelo Git.

## Riscos residuais

- Webhook Pluggy ainda não valida assinatura criptográfica porque não há secret/contrato local configurado.
- JWT ainda fica em `localStorage`; isso mantém compatibilidade atual, mas é mais exposto a XSS do que cookie HttpOnly.
- Logout server-side ainda é endpoint preparatório; blacklist/revogação real depende de storage de sessão/token.
- Não há testes automatizados cobrindo CORS, CSP, rate limits e isolamento multi-tenant.
- Dependências do frontend usam `latest`, o que reduz reprodutibilidade de supply chain.

## Checklist antes da produção

- [ ] Configurar `NODE_ENV=production`.
- [ ] Gerar `JWT_SECRET` com 32+ chars aleatórios.
- [ ] Configurar `DATABASE_URL`, `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`.
- [ ] Confirmar `FRONTEND_URL=https://finsync.paytech.app.br`.
- [ ] Confirmar `CORS_ALLOWED_ORIGINS=https://finsync.paytech.app.br`.
- [ ] Confirmar `PLUGGY_INCLUDE_SANDBOX=false`.
- [ ] Rodar `npm test --prefix backend`.
- [ ] Rodar `npm run build --prefix frontend`.
- [ ] Rodar `npm audit` no root, backend e frontend.

## Checklist Open Finance real

- [ ] Produção Pluggy aprovada.
- [ ] Connect Token gerado somente server-side.
- [ ] Client Secret ausente do frontend.
- [ ] `itemId` vinculado ao `userId`.
- [ ] Usuário acessa apenas conexões próprias.
- [ ] Webhook com rate limit e payload validado.
- [ ] Sandbox desabilitado em produção.
- [ ] Logs sem `connectToken`, Authorization ou secrets.

## Checklist LGPD

- [ ] Política de privacidade.
- [ ] Termos de consentimento.
- [ ] Registro de consentimento Open Finance.
- [ ] Exportação de dados.
- [ ] Exclusão/anonymização de conta.
- [ ] DPO/canal de privacidade.
- [ ] Retenção de logs definida.

## Checklist GitHub

- [ ] `.env` não rastreado.
- [ ] Secret scanning.
- [ ] Dependabot.
- [ ] Branch protection.
- [ ] Reviews obrigatórios.
- [ ] CI com tests/build/audit.

## Checklist Hostinger/VPS

- [ ] NGINX com TLS moderno.
- [ ] Firewall e fail2ban.
- [ ] PM2/systemd.
- [ ] Backups e restore testados.
- [ ] Logs rotacionados.
- [ ] MongoDB Atlas com IP allowlist.
