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
NET="caddy-hdr-net-$$"
STUB="caddy-hdr-stub-$$"

cleanup() {
  docker rm -f "$NAME" "$STUB" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

mkdir -p "$WORK/site/current"
echo '<!doctype html><title>ok</title>' >"$WORK/site/current/index.html"
echo '<!doctype html><title>trang-404-cua-site</title>' >"$WORK/site/current/404.html"
chmod -R a+rX "$WORK"

# `docker cp` thay vì bind-mount: chạy giống nhau trên Linux/macOS/Git Bash (không lỗi chuyển đường dẫn).
# tmpfs cho /data,/config để uid 1000 ghi được (prod dùng volume đã chown).
docker network create "$NET" >/dev/null
docker create --name "$NAME" --network "$NET" \
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
# 404 phải là trang 404.html của site (không phải văn bản trơn), vẫn mang mã 404.
echo "▶ Site 404 phục vụ trang 404.html"
BODY="$(curl -s -H "Host: $SITE_HOST" "http://127.0.0.1:$PORT/khong-co-trang-nay")"
if [[ "$BODY" == *trang-404-cua-site* ]]; then ok "nội dung là 404.html"; else fail "404 không phục vụ 404.html (thấy '$BODY')"; fi
check "CMS 502 (Directus down, handle_errors)" "$CMS_HOST" /server/ping 502 cms

# Máy chủ xem trước dưới /preview/* của domain CMS, chặn bằng PHIÊN Directus (forward_auth → /users/me). Dựng upstream giả
# (cùng image Caddy) có alias `directus` và `preview`: /users/me trả 200 khi cookie có directus_session_token=hop-le, ngược lại 401.
cat >"$WORK/stub.Caddyfile" <<'STUBEOF'
{
	auto_https off
}
:8055 {
	@ok header Cookie *directus_session_token=hop-le*
	handle @ok {
		respond `{"data":{"id":"u1"}}` 200
	}
	handle {
		respond `{"errors":[{"message":"Invalid credentials."}]}` 401
	}
}
:4322 {
	respond "PREVIEW-OK" 200
}
STUBEOF
docker create --name "$STUB" --network "$NET" --network-alias directus --network-alias preview   --user 1000:1000 --tmpfs /data:uid=1000,gid=1000 --tmpfs /config:uid=1000,gid=1000 "$IMAGE" >/dev/null
docker cp "$WORK/stub.Caddyfile" "$STUB:/etc/caddy/Caddyfile"
docker start "$STUB" >/dev/null
sleep 2

# preview_get <cookie|""> → "<status> <body>" của /preview/posts/ban-nhap trên domain CMS; header ghi ở $WORK/h.txt
# (hàm chạy trong $(...) nên KHÔNG gán được HEADERS — gọi load_headers sau đó).
preview_get() {
  local cookie="$1" out
  out="$(curl -s -D "$WORK/h.txt" -o "$WORK/b.txt" ${cookie:+-H "Cookie: $cookie"} -H "Host: $CMS_HOST" "http://127.0.0.1:$PORT/preview/posts/ban-nhap" -w '%{http_code}')"
  printf '%s %s' "$out" "$(cat "$WORK/b.txt")"
}
load_headers() { HEADERS="$(cat "$WORK/h.txt")"; }
echo "▶ Preview: chưa đăng nhập Directus → 401 (không lộ bản nháp)"
r="$(preview_get "")"
if [ "${r%% *}" = 401 ] && [[ "$r" != *PREVIEW-OK* ]]; then ok "không cookie → 401, không tới upstream"; else fail "không cookie: mong 401 và không có nội dung, thấy '$r'"; fi
r="$(preview_get "directus_session_token=het-han")"
if [ "${r%% *}" = 401 ] && [[ "$r" != *PREVIEW-OK* ]]; then ok "cookie không hợp lệ → 401"; else fail "cookie sai: mong 401, thấy '$r'"; fi
load_headers
expect_has X-Robots-Tag noindex
echo "▶ Preview: có phiên Directus hợp lệ → qua tới máy chủ xem trước + header"
r="$(preview_get "directus_session_token=hop-le")"
if [ "${r%% *}" = 200 ] && [[ "$r" == *PREVIEW-OK* ]]; then ok "cookie hợp lệ → 200 từ máy chủ xem trước"; else fail "cookie hợp lệ: mong 200 PREVIEW-OK, thấy '$r'"; fi
load_headers
expect_has X-Robots-Tag noindex
expect_has Content-Security-Policy "frame-ancestors 'self'"
expect_eq Cache-Control no-store
expect_absent Server
expect_absent X-Frame-Options
echo "▶ Preview KHÔNG có trên domain site công khai"
r="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SITE_HOST" "http://127.0.0.1:$PORT/preview/posts/ban-nhap")"
if [ "$r" = 404 ]; then ok "site công khai /preview/* → 404"; else fail "site công khai /preview/* mong 404, thấy $r"; fi

echo
if [ "$FAILS" -gt 0 ]; then
  echo "THẤT BẠI: $FAILS khẳng định sai (image $IMAGE, Caddyfile $CADDYFILE)" >&2
  exit 1
fi
echo "ĐẠT: header bảo mật đầy đủ trên 200/404/502 (image $IMAGE)"
