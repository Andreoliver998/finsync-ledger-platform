# FinSync Production Security Checklist

Data: 2026-05-08

## HTTPS e proxy

- [ ] HTTPS obrigatório em `https://finsync.paytech.app.br`.
- [ ] HTTPS obrigatório em `https://api-finsync.paytech.app.br`.
- [ ] TLS 1.2+ e preferencialmente TLS 1.3.
- [ ] Redirecionar HTTP para HTTPS no NGINX.
- [ ] Enviar `X-Forwarded-Proto`, `X-Forwarded-For` e configurar trust proxy se necessário.
- [ ] HSTS habilitado no proxy e no app em produção.
- [ ] Bloquear acesso direto à porta Node.js pela internet.

## NGINX

- [ ] `client_max_body_size` compatível com API atual.
- [ ] Rate limit por IP para `/api/auth/login`, `/api/auth/register`, `/api/open-finance/connect-token`, `/api/sync` e webhook.
- [ ] Timeouts conservadores para evitar slowloris.
- [ ] Headers de proxy preservados sem expor versão do servidor.
- [ ] Logs sem Authorization, cookies ou query sensível.

## Infra/VPS/Hostinger

- [ ] Firewall liberando somente 80/443 e SSH restrito.
- [ ] SSH com chave, sem senha, e sem root login.
- [ ] Fail2ban ativo para SSH e NGINX.
- [ ] PM2/systemd com restart automático e health check.
- [ ] Backups testados e criptografados.
- [ ] Variáveis `.env` fora do Git e com permissão restrita.
- [ ] Rotação de logs configurada.

## MongoDB Atlas/Prisma

- [ ] MongoDB Atlas com IP allowlist restrita.
- [ ] Usuário de banco com privilégio mínimo.
- [ ] Backups automáticos habilitados.
- [ ] Monitoramento de conexões e queries lentas.
- [ ] `DATABASE_URL` somente em ambiente seguro.

## Pluggy/Open Finance

- [ ] Conta Pluggy em modo produção aprovada.
- [ ] `PLUGGY_INCLUDE_SANDBOX=false` em produção.
- [ ] Webhook cadastrado como `https://api-finsync.paytech.app.br/api/open-finance/webhook/pluggy`.
- [ ] OAuth redirect cadastrado como `https://finsync.paytech.app.br/open-finance/connect`.
- [ ] Client ID/Secret rotacionados antes do go-live se já foram usados em teste.
- [ ] Verificar suporte a assinatura de webhook e ativar validação quando disponível.

## LGPD

- [ ] Política de privacidade publicada.
- [ ] Termos de uso publicados.
- [ ] Base legal para tratamento de dados financeiros documentada.
- [ ] Fluxo de exclusão/exportação de dados pessoais definido.
- [ ] Registro de consentimento Open Finance definido.
- [ ] Plano de resposta a incidente definido.

## CI/CD e GitHub

- [ ] Secret scanning habilitado.
- [ ] Dependabot habilitado.
- [ ] Branch protection na branch principal.
- [ ] `npm audit` ou ferramenta equivalente no pipeline.
- [ ] Build/test obrigatórios antes do deploy.
- [ ] Nenhum `.env` rastreado.
