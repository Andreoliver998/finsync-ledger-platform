# Backup Strategy

## Scope

- MongoDB production database.
- Backend source/config templates.
- Frontend production build.
- NGINX and PM2 configuration references.

## Script

Use:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Required environment variables for MongoDB dump:

```bash
export DATABASE_URL="<mongodb-atlas-uri>"
```

Optional:

```bash
export BACKUP_DIR="/var/backups/finsync"
export APP_DIR="/var/www/finsync/app"
```

## Retention

- Daily backups: 7 days.
- Weekly backups: 4 weeks.
- Monthly backups: 6-12 months, subject to LGPD retention policy.

## Restore drill

Test restoration in staging at least once before production launch and after major schema changes.
