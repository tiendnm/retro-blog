#!/bin/sh
# ── Backup (Sprint 6 Phase 4) ──────────────────────────────────────────────
# Phạm vi: database + uploads + config (+ env riêng). KHÔNG backup dist/ (tái
# sinh bằng astro build). Chạy TRÊN HOST. Dùng stdin/stdout redirect (không cần
# mount volume → chạy được cả Linux/Windows).
#   Env: COMPOSE_FILES (mặc định dev), POSTGRES_USER/DB, BACKUP_DIR, ENV_FILE.
set -eu

STAMP=$(date +%Y%m%d-%H%M%S)
DEST="${BACKUP_DIR:-./backups}/$STAMP"
mkdir -p "$DEST"
COMPOSE="docker compose ${COMPOSE_FILES:-}"
PGUSER="${POSTGRES_USER:-directus}"
PGDB="${POSTGRES_DB:-directus}"

echo "[backup] database → db.dump (pg_dump -Fc)"
$COMPOSE exec -T postgres pg_dump -U "$PGUSER" -Fc "$PGDB" >"$DEST/db.dump"

echo "[backup] uploads → uploads.tgz (directus_uploads)"
$COMPOSE exec -T directus tar czf - -C /directus/uploads . >"$DEST/uploads.tgz"

echo "[backup] config (schema, compose, Caddyfile)"
cp services/directus/snapshots/schema.yaml "$DEST/schema.yaml" 2>/dev/null || true
cp docker-compose.yml "$DEST/" 2>/dev/null || true
cp docker-compose.prod.yml "$DEST/" 2>/dev/null || true
cp Caddyfile "$DEST/" 2>/dev/null || true

# Env (secret): sao lưu RIÊNG + mã hoá. Cả thư mục backup là NHẠY CẢM.
if [ -n "${ENV_FILE:-}" ] && [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$DEST/env.bak"
  echo "[backup] env → env.bak (⚠ NHẠY CẢM — mã hoá + lưu tách)"
fi

cat >"$DEST/README.txt" <<TXT
Backup $STAMP — retro-blog
  db.dump      : pg_dump -Fc  → khôi phục bằng pg_restore (services/ops/restore.sh)
  uploads.tgz  : directus_uploads
  schema.yaml, docker-compose*.yml, Caddyfile : config
  env.bak      : secrets (nếu có) — MÃ HOÁ + lưu tách. TOÀN BỘ thư mục này NHẠY CẢM.
KHÔNG gồm dist/ (tái sinh bằng astro build).
RPO = từ lần backup gần nhất; RTO = thời gian restore + rebuild-on-publish.
TXT

echo "[backup] xong → $DEST"
