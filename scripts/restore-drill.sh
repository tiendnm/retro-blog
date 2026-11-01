#!/bin/bash
# ── Restore drill (Sprint 12) ───────────────────────────────────────────────
# Chứng minh backup KHÔI PHỤC ĐƯỢC mà không đụng stack đang chạy: dựng Postgres + Directus TẠM (mạng riêng, không
# publish cổng, giới hạn RAM) từ một bản backup, so số liệu rồi dọn sạch dữ liệu tạm. Chạy TRÊN HOST (cần docker).
#   Dùng:  ./scripts/restore-drill.sh                 bản local mới nhất trong ./backups
#          ./scripts/restore-drill.sh backups/<STAMP> một bản local cụ thể
#          ./scripts/restore-drill.sh --r2            tải bản mới nhất từ R2 (qua service ops) rồi diễn tập — nên dùng định kỳ
#   Env:   ENV_FILE (mặc định .env.production) · DRILL_MEM (RAM tối đa cho Directus tạm, mặc định 700m)
#          DRILL_WAIT (giây chờ Directus lên, mặc định 400)
#   Đạt khi: pg_restore OK · Directus tạm (cùng image prod) lên health=ok trên DB đã khôi phục · số file trong
#   uploads.tgz = số dòng directus_files · số migration = prod · /assets trả 200. API công khai /items/posts trả
#   cùng số bài với prod (lệch số bài chỉ là CẢNH BÁO: có thể bài đổi sau thời điểm backup).  Exit 0 = đạt.
set -eu
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.production}"
WAIT="${DRILL_WAIT:-400}"
MEM="${DRILL_MEM:-700m}"
COMPOSE=(docker compose --env-file "$ENV_FILE")
# Nếu .env.production không đặt COMPOSE_FILE thì truyền tường minh các file như update.sh.
if ! grep -q '^COMPOSE_FILE=' "$ENV_FILE" 2>/dev/null; then
  COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.tunnel.yml --env-file "$ENV_FILE")
fi

ID="retro-drill-$$"
NET="$ID-net"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/$ID.XXXXXX")"
RESULT=0
fail() {
  echo "FAIL  $*"
  RESULT=1
}
ok() { echo "OK    $*"; }
warn() { echo "WARN  $*"; }

cleanup() {
  echo "[drill] dọn dữ liệu tạm"
  docker rm -f "$ID-directus" "$ID-pg" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  # uploads giải nén có thể thuộc uid khác → xoá bằng container để không cần sudo
  docker run --rm -v "$WORK:/w" alpine sh -c 'rm -rf /w/* /w/.[!.]* 2>/dev/null' >/dev/null 2>&1 || true
  rm -rf "$WORK" 2>/dev/null || true
}
trap cleanup EXIT

# ── Nguồn backup ──
SRC="${1:-}"
if [ "$SRC" = "--r2" ]; then
  echo "[drill] tải bản mới nhất từ R2 (service ops)"
  OPS=$("${COMPOSE[@]}" ps -q ops)
  [ -n "$OPS" ] || {
    echo "service ops không chạy" >&2
    exit 2
  }
  STAMP=$("${COMPOSE[@]}" exec -T ops sh -c 'rm -rf /tmp/r2pull && sh services/ops/offsite.sh --pull /tmp/r2pull' | tail -1 | tr -d '\r')
  case "$STAMP" in
    [0-9]*-[0-9]*) ;;
    *)
      echo "không lấy được tên bản từ R2: $STAMP" >&2
      exit 2
      ;;
  esac
  docker cp "$OPS:/tmp/r2pull/$STAMP" "$WORK/src"
  "${COMPOSE[@]}" exec -T ops rm -rf /tmp/r2pull
  SRC="$WORK/src"
  echo "[drill] nguồn: R2 / $STAMP"
else
  [ -n "$SRC" ] || SRC="backups/$(ls -1 backups | grep -E '^[0-9]{8}-[0-9]{6}$' | sort | tail -1)"
  echo "[drill] nguồn: $SRC (local)"
fi
for f in db.dump uploads.tgz; do
  [ -s "$SRC/$f" ] || {
    echo "thiếu $SRC/$f" >&2
    exit 2
  }
done

# ── Số liệu prod để so (chỉ đọc) ──
DB_USER_=$(grep -E '^DB_USER=' "$ENV_FILE" | cut -d= -f2-)
DB_NAME_=$(grep -E '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)
prod_sql() { "${COMPOSE[@]}" exec -T postgres psql -U "$DB_USER_" -d "$DB_NAME_" -Atc "$1"; }
count_of() { sed -E 's/.*"filter_count":([0-9]+).*/\1/'; }
PROD_MIG=$(prod_sql 'select count(*) from directus_migrations')
PROD_API=$("${COMPOSE[@]}" exec -T directus wget -qO- 'http://127.0.0.1:8055/items/posts?limit=0&meta=filter_count' | count_of)
IMAGE=$(docker inspect -f '{{.Config.Image}}' "$("${COMPOSE[@]}" ps -q directus)")
PGIMAGE=$(docker inspect -f '{{.Config.Image}}' "$("${COMPOSE[@]}" ps -q postgres)")
echo "[drill] prod: migrations=$PROD_MIG, bài công khai (API)=$PROD_API · image: $IMAGE / $PGIMAGE"

# ── Dựng Postgres tạm + khôi phục ──
PW=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')
docker network create "$NET" >/dev/null
docker run -d --name "$ID-pg" --network "$NET" --network-alias drill-pg --memory 256m \
  -e POSTGRES_USER=drill -e POSTGRES_PASSWORD="$PW" -e POSTGRES_DB=drill \
  "$PGIMAGE" >/dev/null
for _ in $(seq 1 60); do
  docker exec "$ID-pg" pg_isready -U drill -d drill >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$ID-pg" pg_isready -U drill -d drill >/dev/null || {
  fail "Postgres tạm không lên"
  exit 1
}

echo "[drill] pg_restore db.dump → Postgres tạm"
if docker exec -i "$ID-pg" pg_restore -U drill -d drill --no-owner --no-privileges <"$SRC/db.dump" 2>"$WORK/pgrestore.err"; then
  ok "pg_restore"
elif grep -qi '^pg_restore: error' "$WORK/pgrestore.err"; then
  fail "pg_restore lỗi: $(grep -i '^pg_restore: error' "$WORK/pgrestore.err" | head -3)"
else
  warn "pg_restore thoát != 0 nhưng không có dòng 'error' (cảnh báo vô hại)"
fi
dsql() { docker exec "$ID-pg" psql -U drill -d drill -Atc "$1"; }
D_MIG=$(dsql 'select count(*) from directus_migrations')
D_POSTS=$(dsql 'select count(*) from posts')
D_FILES=$(dsql 'select count(*) from directus_files')
echo "[drill] DB khôi phục: migrations=$D_MIG, posts(mọi trạng thái)=$D_POSTS, directus_files=$D_FILES"

# ── Uploads ──
mkdir -p "$WORK/uploads"
tar xzf "$SRC/uploads.tgz" -C "$WORK/uploads"
T_FILES=$(find "$WORK/uploads" -type f | wc -l)
if [ "$T_FILES" -eq "$D_FILES" ]; then ok "uploads.tgz có $T_FILES file = directus_files"; else fail "uploads.tgz có $T_FILES file ≠ directus_files $D_FILES"; fi
if [ "$D_MIG" = "$PROD_MIG" ]; then ok "migrations = $D_MIG (khớp prod)"; else fail "migrations $D_MIG ≠ prod $PROD_MIG (backup từ phiên bản Directus khác?)"; fi

# ── Directus tạm (cùng image prod) ──
docker run -d --name "$ID-directus" --network "$NET" --memory "$MEM" --dns 1.1.1.1 \
  -e KEY="$(head -c 16 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')drillkey" -e SECRET="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')drillsecret" \
  -e DB_CLIENT=pg -e DB_HOST=drill-pg -e DB_PORT=5432 -e DB_DATABASE=drill -e DB_USER=drill -e DB_PASSWORD="$PW" \
  -e PUBLIC_URL=http://localhost:8055 -e TELEMETRY=false -e AI_ENABLED=false \
  -v "$WORK/uploads:/directus/uploads" \
  "$IMAGE" >/dev/null
echo "[drill] chờ Directus tạm (tối đa ${WAIT}s)"
up=0
for _ in $(seq 1 $((WAIT / 5))); do
  if docker exec "$ID-directus" wget -qO- http://127.0.0.1:8055/server/health 2>/dev/null | grep -q '"status":"ok"'; then
    up=1
    break
  fi
  sleep 5
done
if [ "$up" -eq 1 ]; then
  ok "Directus tạm: /server/health = ok"
  D_API=$(docker exec "$ID-directus" wget -qO- 'http://127.0.0.1:8055/items/posts?limit=0&meta=filter_count' | count_of)
  if [ "$D_API" = "$PROD_API" ]; then ok "bài công khai (API) = $D_API (khớp prod)"; else warn "bài công khai $D_API ≠ prod $PROD_API — kiểm xem có bài đổi sau thời điểm backup"; fi
  ASSET=$(dsql "select id from directus_files where type like 'image/%' limit 1")
  if [ -n "$ASSET" ]; then
    code=$(docker exec "$ID-directus" wget -S -qO /dev/null "http://127.0.0.1:8055/assets/$ASSET" 2>&1 | awk '/HTTP\//{c=$2} END{print c}')
    if [ "$code" = "200" ]; then ok "/assets/$ASSET trả 200 (file thật đọc được)"; else fail "/assets/$ASSET trả '$code'"; fi
  fi
else
  fail "Directus tạm không lên health=ok sau ${WAIT}s — 20 dòng log cuối:"
  docker logs --tail 20 "$ID-directus" 2>&1 | sed 's/^/        /'
fi

if [ "$RESULT" -eq 0 ]; then echo "[drill] ĐẠT"; else echo "[drill] KHÔNG ĐẠT"; fi
exit "$RESULT"
