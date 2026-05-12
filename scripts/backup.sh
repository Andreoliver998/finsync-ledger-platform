#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/finsync/app}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/finsync}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  if command -v mongodump >/dev/null 2>&1; then
    mongodump --uri="${DATABASE_URL}" --out="${TARGET_DIR}/mongodb"
  else
    echo "mongodump not found; skipping MongoDB dump." >&2
  fi
else
  echo "DATABASE_URL not set; skipping MongoDB dump." >&2
fi

if [[ -d "${APP_DIR}/backend" ]]; then
  tar --exclude="node_modules" --exclude=".env" -czf "${TARGET_DIR}/backend.tar.gz" -C "${APP_DIR}" backend
fi

if [[ -d "${APP_DIR}/frontend/dist" ]]; then
  tar -czf "${TARGET_DIR}/frontend-dist.tar.gz" -C "${APP_DIR}/frontend" dist
fi

if [[ -f "${APP_DIR}/ecosystem.config.cjs" ]]; then
  cp "${APP_DIR}/ecosystem.config.cjs" "${TARGET_DIR}/ecosystem.config.cjs"
fi

if [[ -f "/etc/nginx/sites-available/finsync.conf" ]]; then
  cp "/etc/nginx/sites-available/finsync.conf" "${TARGET_DIR}/nginx-finsync.conf"
fi

tar -czf "${BACKUP_DIR}/finsync-${TIMESTAMP}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"
echo "Backup created: ${BACKUP_DIR}/finsync-${TIMESTAMP}.tar.gz"
