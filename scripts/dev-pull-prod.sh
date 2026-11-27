#!/bin/sh
# ── Kéo bản sao PRODUCTION về môi trường dev local ──────────────────────────────────────────────────
# Dùng khi muốn review giao diện/nội dung trên dữ liệu thật mà không đụng server. Xem docs/17a-dev-environment.md.
#   Chạy TỪ GỐC REPO, trên máy dev (đã có Docker + `ssh retro-home` dùng được):  sh scripts/dev-pull-prod.sh
#
# Làm gì (phía server CHỈ ĐỌC — pg_dump + tar qua ssh, không ghi gì lên server):
#   1) pg_dump -Fc của DB production + tar uploads của Directus → thư mục tạm.
#   2) Dừng directus/web local; ĐỔI TÊN DB local hiện có thành "<db>_old_<giờ>" (không xoá) rồi tạo DB mới và pg_restore.
#   3) Bật Directus (chờ healthy), nạp uploads, bật lại web.
#   4) Xoá thư mục tạm (dump chứa hash mật khẩu + token thật) trừ khi KEEP_DUMP=1.
#
# Env (đều có mặc định):
#   SSH_HOST=retro-home       REMOTE_DIR='~/retro-blog'      (repo trên server; dùng .env.production)
#   PG_CONTAINER=pg-clone-local   container Postgres local chạy ở cổng 5433 (ADR-0010) — DÙNG CHUNG nhiều dự án, nên không đụng DB khác
#   PGDB=retro-blog           PGUSER_LOCAL=postgres
#   SKIP_UPLOADS=1            bỏ qua ảnh (nhanh hơn, ảnh bài sẽ vỡ)
#   KEEP_DUMP=1               giữ lại thư mục tạm (in đường dẫn) — nhớ tự xoá, vì chứa secret
#
# Sau khi xong: đăng nhập Directus local (http://localhost:8055) bằng tài khoản admin CỦA SERVER (DB đã mang theo
# người dùng production; ADMIN_EMAIL/ADMIN_PASSWORD trong .env local chỉ dùng cho DB trống).
set -eu
umask 077 # dump chứa secret → chỉ chủ sở hữu đọc được

SSH_HOST="${SSH_HOST:-retro-home}"
REMOTE_DIR="${REMOTE_DIR:-~/retro-blog}"
PG_CONTAINER="${PG_CONTAINER:-pg-clone-local}"
PGDB="${PGDB:-retro-blog}"
PGUSER_LOCAL="${PGUSER_LOCAL:-postgres}"
STAMP=$(date +%Y%m%d%H%M%S)
OLD_DB="${PGDB}_old_${STAMP}"

[ -f docker-compose.yml ] || { echo "Chạy từ gốc repo (không thấy docker-compose.yml)." >&2; exit 1; }
docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null | grep -q true ||
  { echo "Container Postgres local '$PG_CONTAINER' chưa chạy (cổng 5433). Xem docs/17a-dev-environment.md §3." >&2; exit 1; }

WORK=$(mktemp -d)
cleanup() {
  if [ "${KEEP_DUMP:-0}" = "1" ]; then echo "[pull] giữ lại $WORK (chứa secret — tự xoá khi xong)"; else rm -rf "$WORK"; fi
}
trap cleanup EXIT

REMOTE="cd $REMOTE_DIR && docker compose --env-file .env.production"

echo "[pull] 1/4 pg_dump từ $SSH_HOST"
ssh "$SSH_HOST" "$REMOTE exec -T postgres sh -c 'pg_dump -U \$POSTGRES_USER -Fc \$POSTGRES_DB'" >"$WORK/db.dump"
[ "$(head -c 5 "$WORK/db.dump")" = "PGDMP" ] || { echo "Dump không hợp lệ (thiếu header PGDMP)." >&2; exit 1; }

if [ "${SKIP_UPLOADS:-0}" != "1" ]; then
  echo "[pull] 1/4 uploads từ $SSH_HOST"
  ssh "$SSH_HOST" "$REMOTE exec -T directus tar czf - -C /directus/uploads ." >"$WORK/uploads.tgz"
fi

echo "[pull] 2/4 dừng directus/web local, đổi tên DB cũ → $OLD_DB, restore"
docker compose stop web directus >/dev/null 2>&1 || true
PSQL="docker exec -i $PG_CONTAINER psql -U $PGUSER_LOCAL -v ON_ERROR_STOP=1 -tA"
if $PSQL -c "select 1 from pg_database where datname='$PGDB'" | grep -q 1; then
  $PSQL -c "ALTER DATABASE \"$PGDB\" RENAME TO \"$OLD_DB\""
fi
$PSQL -c "CREATE DATABASE \"$PGDB\""
docker exec -i "$PG_CONTAINER" pg_restore -U "$PGUSER_LOCAL" -d "$PGDB" --no-owner --no-privileges --exit-on-error <"$WORK/db.dump"

echo "[pull] 3/4 bật Directus, nạp uploads"
docker compose up -d --wait directus
if [ -f "$WORK/uploads.tgz" ]; then
  docker compose exec -T directus sh -c "tar xzf - -C /directus/uploads" <"$WORK/uploads.tgz"
fi

echo "[pull] 4/4 bật web"
docker compose up -d --wait web

echo "[pull] xong. Site: http://localhost:4321 · Directus: http://localhost:8055"
echo "[pull] DB local cũ được giữ ở '$OLD_DB' — xoá khi chắc không cần:  docker exec $PG_CONTAINER psql -U $PGUSER_LOCAL -c 'DROP DATABASE \"$OLD_DB\"'"
