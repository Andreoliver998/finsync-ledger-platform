# GitHub Safety Checklist

Use this checklist before every push to GitHub.

## Repository Safety

- [ ] Confirm the GitHub repository is private.
- [ ] Confirm `.gitignore` exists at the repository root.
- [ ] Confirm `.env` and `.env.*` are ignored.
- [ ] Confirm only `.env.example` files are committed.

## Secrets

- [ ] Search for real `DATABASE_URL` values.
- [ ] Search for real `JWT_SECRET` values.
- [ ] Search for real `PLUGGY_CLIENT_ID` values.
- [ ] Search for real `PLUGGY_CLIENT_SECRET` values.
- [ ] Search for API keys.
- [ ] Search for `Authorization: Bearer` tokens.
- [ ] Search for persisted `connectToken` values.
- [ ] Search for MongoDB URI values.

## Generated Files

- [ ] Confirm `node_modules` is not staged.
- [ ] Confirm `dist` is not staged.
- [ ] Confirm `build` is not staged.
- [ ] Confirm `coverage` is not staged.
- [ ] Confirm `logs` and `*.log` are not staged.
- [ ] Confirm `backups/*.zip` is not staged.
- [ ] Confirm `.prisma` generated internals are not staged.

## Final Gate

- [ ] Run frontend build.
- [ ] Run backend Prisma generate.
- [ ] Run backend tests.
- [ ] Review `git status`.
- [ ] Review staged files before commit.
- [ ] Push only after all checks pass.
