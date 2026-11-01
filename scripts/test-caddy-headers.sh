#!/usr/bin/env bash
# Hồi quy header bảo mật (Sprint 13 §C): chạy Caddy THẬT với Caddyfile thật, cùng ràng buộc như prod
# (không root, cap_drop ALL + NET_BIND_SERVICE, no-new-privileges) rồi khẳng định header trên trang 200,
# 404 (file_server) và 502 (Directus không tới được) — kể cả trang lỗi do `handle_errors` sinh.
# Bắt lỗi khi nâng Caddy / sửa Caddyfile làm mất header (từng kiểm tay ở 2.10).
#
# Dùng: scripts/test-caddy-headers.sh          (CI: bước trong job `quality`)
#       CADDYFILE=/path/to/Caddyfile scripts/test-caddy-headers.sh   (thử Caddyfile khác — vd cố ý bỏ header)
# Cần: docker, curl. Image lấy từ docker-compose.prod.yml để luôn khớp bản đang deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CADDYFILE="${CADDYFILE:-$ROOT/Caddyfile}"
IMAGE="$(grep -oE 'caddy:[0-9][^ "]*' "$ROOT/docker-compose.prod.yml" | head -1)"
[ -n "$IMAGE" ] || { echo "Không tìm thấy image caddy trong docker-compose.prod.yml" >&2; exit 2; }

NAME="caddy-hdr-test-$$"
PORT="${CADDY_TEST_PORT:-18080}"
SITE_HOST="site.test"
CMS_HOST="cms.test"
WORK="$(mktemp -d)"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

mkdir -p "$WORK/site/current"
echo '<!doctype html><title>ok</title>' >"$WORK/site/current/index.html"
chmod -R a+rX "$WORK"

# `docker cp` thay vì bind-mount: chạy giống nhau trên Linux/macOS/Git Bash (không lỗi chuyển đường dẫn).
# tmpfs cho /data,/config để uid 1000 ghi được (prod dùng volume đã chown).
docker create --name "$NAME" \
  --user 1000:1000 --cap-drop ALL --cap-add NET_BIND_SERVICE --security-opt no-new-privileges:true \
  --tmpfs /data:uid=1000,gid=1000 --tmpfs /config:uid=1000,gid=1000 \
  -e SITE_ADDRESS="http://$SITE_HOST" -e CMS_ADDRESS="http://$CMS_HOST" \
  -e SITE_DOMAIN="$SITE_HOST" -e CMS_DOMAIN="$CMS_HOST" -e ACME_EMAIL=test@example.test \
  -p "127.0.0.1:$PORT:80" \
  "$IMAGE" >/dev/null
docker cp "$CADDYFILE" "$NAME:/etc/caddy/Caddyfile"
docker cp "$WORK/site" "$NAME:/srv/"
docker start "$NAME" >/dev/null

# Chờ Caddy lên (404 từ site cũng là đã lên).
for _ in $(seq 1 30); do
  if curl -s -o /dev/null -H "Host: $SITE_HOST" "http://127.0.0.1:$PORT/"; then break; fi
  sleep 1
done

FAILS=0
fail() { echo "  ✗ $*"; FAILS=$((FAILS + 1)); }
ok() { echo "  ✓ $*"; }

# header_of <tên> : giá trị header (không phân biệt hoa/thường) trong $HEADERS, rỗng nếu không có.
header_of() { printf '%s\n' "$HEADERS" | tr -d '\r' | awk -v n="$(printf '%s' "$1" | tr 'A-Z' 'a-z')" -F': ' 'tolower($1)==n {sub(/^[^:]*: /,""); print; exit}'; }

# expect_eq <tên> <giá trị chính xác> | expect_re <tên> <regex> | expect_has <tên> <chuỗi con> | expect_absent <tên>
expect_eq() { local v; v="$(header_of "$1")"; if [ "$v" = "$2" ]; then ok "$1"; else fail "$1: mong '$2', thấy '${v:-<không có>}'"; fi; }
expect_re() { local v; v="$(header_of "$1")"; if printf '%s' "$v" | grep -Eq "$2"; then ok "$1"; else fail "$1: mong khớp /$2/, thấy '${v:-<không có>}'"; fi; }
expect_has() { local v; v="$(header_of "$1")"; if [[ "$v" == *"$2"* ]]; then ok "$1 chứa $2"; else fail "$1: thiếu '$2' (thấy '${v:-<không có>}')"; fi; }
expect_absent() { local v; v="$(header_of "$1")"; if [ -z "$v" ]; then ok "không có $1"; else fail "$1 không được xuất hiện, thấy '$v'"; fi; }

# check <mô tả> <host> <path> <status mong đợi> <loại: site|cms>
check() {
  local label="$1" host="$2" path="$3" want="$4" kind="$5" status
  echo "▶ $label  ($host$path → $want)"
  HEADERS="$(curl -s -D - -o /dev/null -H "Host: $host" "http://127.0.0.1:$PORT$path")"
  status="$(printf '%s\n' "$HEADERS" | head -1 | awk '{print $2}')"
  if [ "$status" = "$want" ]; then ok "status $status"; else fail "status: mong $want, thấy '${status:-<không có>}'"; fi

  expect_re Strict-Transport-Security '^max-age=[0-9]{8,}(; includeSubDomains)?$'
  expect_eq X-Content-Type-Options nosniff
  expect_eq Referrer-Policy strict-origin-when-cross-origin
  expect_has Permissions-Policy 'camera=()'
  expect_has Permissions-Policy 'microphone=()'
  expect_has Permissions-Policy 'geolocation=()'
  expect_absent Server
  if [ "$kind" = site ]; then
    expect_eq X-Frame-Options DENY
    # CSP: từng chỉ thị quan trọng (không so cả chuỗi để thêm nguồn hợp lệ không làm đỏ vô cớ).
    for d in "default-src 'self'" "script-src 'self'" "style-src 'self'" "object-src 'none'" \
      "base-uri 'self'" "form-action 'self'" "frame-ancestors 'none'"; do
      expect_has Content-Security-Policy "$d"
    done
  else
    expect_eq X-Frame-Options SAMEORIGIN
    # CMS: Caddy KHÔNG được đè CSP (Directus tự phát cho admin UI) — 502 do Caddy sinh nên phải không có.
    expect_absent Content-Security-Policy
  fi
}

check "Site 200" "$SITE_HOST" / 200 site
check "Site 404 (handle_errors)" "$SITE_HOST" /khong-co-trang-nay 404 site
check "CMS 502 (Directus down, handle_errors)" "$CMS_HOST" /server/ping 502 cms

echo
if [ "$FAILS" -gt 0 ]; then
  echo "THẤT BẠI: $FAILS khẳng định sai (image $IMAGE, Caddyfile $CADDYFILE)" >&2
  exit 1
fi
echo "ĐẠT: header bảo mật đầy đủ trên 200/404/502 (image $IMAGE)"
