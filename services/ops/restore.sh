#!/bin/sh
# ── Restore (Sprint 6 Phase 4) ─────────────────────────────────────────────
# Khôi phục database + uploads từ 1 thư mục backup vào stack ĐANG CHẠY.
# ⚠ GHI ĐÈ dữ liệu hiện tại — chỉ dùng khi khôi phục sự cố. Chạy TRÊN HOST.
#   Cách dùng: sh services/ops/restore.sh <thư-mục-backup>
#   Env: COMPOSE_FILES, PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDB. Dùng pg_restore của HOST (ADR-0010).
set -eu

SRC="${1:?cần đường dẫn thư mục backup, vd: ./backups/20260723-...}"
COMPOSE="docker compose ${COMPOSE_FILES:-}"
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5433}" PGUSER="${PGUSER:-postgres}"
PGDB="${PGDB:-retro-blog}"

echo "[restore] database ← $SRC/db.dump (--clean --if-exists)"
pg_restore -d "$PGDB" --clean --if-exists <"$SRC/db.dump"

echo "[restore] uploads ← $SRC/uploads.tgz"
$COMPOSE exec -T directus sh -c "rm -rf /directus/uploads/* && tar xzf - -C /directus/uploads" <"$SRC/uploads.tgz"

echo "[restore] xong — khởi động lại Directus nếu cần, rồi rebuild site:"
echo "          sh services/rebuild/rebuild.sh"
