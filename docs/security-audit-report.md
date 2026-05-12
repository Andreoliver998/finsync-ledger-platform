# FinSync Security Audit Report

Data: 2026-05-08

## Escopo auditado

- Backend Node.js/Express, JWT, Prisma/MongoDB, Pluggy/Open Finance, webhooks, logs, variáveis de ambiente, middlewares e rotas `/api`.
- Frontend React, cliente HTTP, armazenamento de token, variáveis `VITE_`, fluxo Pluggy Connect e logs.
- Estrutura GitHub, `.gitignore`, dependências e preparação de produção.

## Riscos encontrados e correções aplicadas

| Área | Severidade | Risco | Impacto | Correção aplicada |
| --- | --- | --- | --- | --- |
| CORS | Alta | CORS dependia de um único `FRONTEND_URL` e não tinha política clara por ambiente. | Origem errada poderia ser liberada por configuração insegura. | Criado `backend/src/config/cors.js` com allowlist: produção somente `https://finsync.paytech.app.br`; desenvolvimento `localhost:5173` e `localhost:3000`; sem wildcard. |
| Security headers | Alta | Helmet estava ativo com defaults, sem CSP fintech e sem política explícita para Pluggy. | Superfície maior para clickjacking, sniffing, embedding e carregamento indevido. | Configurado Helmet com CSP, COOP, CORP, DNS prefetch off, frameguard deny, hidePoweredBy, HSTS em produção, noSniff, originAgentCluster, cross-domain none e referrer no-referrer. |
| Rate limit | Alta | Limite global permissivo e sem regras por rota sensível. | Brute force em login/cadastro e abuso de sync/connect-token. | Adicionados limites específicos: login 5/min, register 3/min, connect-token 10/min, sync 10/15min, webhook 60/min, APIs gerais 100/15min. |
| JWT | Alta | JWT não fixava algoritmo, issuer ou audience; expiração padrão longa. | Maior risco de token aceito fora do contexto previsto. | JWT agora usa `HS256`, `issuer`, `audience`, expiração padrão 2h e validação de `sub`. |
| Env | Alta | Fallbacks inseguros e ausência de validação obrigatória para produção. | Boot com segredo ausente/fraco ou Pluggy sem credencial. | `src/config/env.js` falha no boot se faltar `JWT_SECRET`/`DATABASE_URL`; em produção exige Pluggy client id/secret e secret de 32+ chars. |
| Logs | Alta | `console.log`/`morgan dev` poderiam expor detalhes em produção. | Vazamento de tokens, headers ou stack traces. | Criado `src/lib/logger.js` com redaction de secrets; removidos logs sensíveis e `morgan dev`; erro 500 em produção não expõe detalhes. |
| NoSQL/prototype pollution | Média | Body/query/params não tinham sanitização central contra `$`, `.`, `__proto__`, `constructor`, `prototype`. | Possível payload malicioso em filtros/objetos. | Adicionado `sanitizeRequestMiddleware` global antes das rotas. |
| Open Finance | Alta | Sandbox ficava habilitado no frontend por padrão; queries Pluggy eram passadas sem validação dedicada. | Risco de ambiente incorreto e filtros inesperados. | `includeSandbox` agora só em `import.meta.env.DEV`; backend usa `PLUGGY_INCLUDE_SANDBOX=false` em produção; params/query Open Finance validados. |
| Frontend API | Média | Fallback fixo para `localhost:3333` podia vazar em build sem env. | Produção poderia apontar para host errado. | Fallback agora usa API oficial fora de host local. |
| Frontend logs | Média | Logava `itemId` e instituição após conexão Open Finance. | Vazamento de identificador bancário no console. | Log removido. |
| Auth frontend | Média | Sem preparação para tratamento central de 401/403. | Sessões inválidas poderiam ficar aparentando autenticadas. | Interceptor dispara evento de auth denied; contexto limpa tokens/local auth. |
| Git | Baixa | `.env` precisava ser confirmado como ignorado. | Risco de commit acidental de segredo. | `.gitignore` já bloqueia `.env` e `**/.env.*`, mantendo apenas `.env.example`. |

## Pontos preservados

- Rotas existentes mantidas em `/api`.
- Pluggy Connect continua recebendo `connectToken` temporário do backend.
- Client Secret e API credentials Pluggy permanecem apenas no backend.
- `itemId` continua vinculado ao `userId` por `clientUserId` e checagem em `saveConnection`.
- Serviços de dados seguem filtrando por `userId` nas listagens e validações de ownership antes de update/delete.

## Dependências

- `npm audit --audit-level=moderate` no monorepo: 0 vulnerabilidades.
- `npm audit --audit-level=moderate` no backend: 0 vulnerabilidades.
- `npm audit --audit-level=moderate` no frontend: 0 vulnerabilidades.

## Recomendações futuras

- Implementar assinatura/validação criptográfica de webhook Pluggy se a conta Pluggy disponibilizar secret de webhook.
- Migrar token web para cookie `HttpOnly`, `Secure`, `SameSite=Strict` quando houver refresh token/CSRF planejado.
- Adicionar blacklist ou versão de sessão para logout server-side e revogação de tokens.
- Criar testes de integração para CORS, rate limits, auth middleware e isolamento multi-tenant.
- Adicionar auditoria de dependências no CI com bloqueio para vulnerabilidades alta/crítica.
- Revisar histórico Git com ferramenta de secret scanning antes da primeira produção real.
