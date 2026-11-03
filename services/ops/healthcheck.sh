#!/bin/sh
# ── Health check / uptime (Sprint 8) ───────────────────────────────────────
# Kiểm: site trả 200 · /robots.txt & /sitemap.xml · Directus /server/health = ok ·
# chứng chỉ TLS còn hạn · (Sprint 12) đĩa, RAM/swap, tuổi backup local + R2 (hostcheck.sh).
# Exit 0 nếu tất cả đạt, 1 nếu có mục hỏng. Production: service `ops`
# (scheduler.sh, ADR-0017) chạy định kỳ; cũng chạy tay được trên host hoặc máy khác.
#
#   Env bắt buộc: SITE_URL (vd https://retro.example.com), CMS_URL (vd https://cms.example.com)
#   Env tuỳ chọn:
#     CERT_MIN_DAYS=14           cảnh báo khi chứng chỉ còn ít hơn N ngày (chỉ với https)
#     HEALTHCHECK_PING_URL       dịch vụ giám sát kiểu healthchecks.io: gọi URL khi OK, URL/fail khi lỗi
#                                → báo động khi KHÔNG thấy ping (kể cả khi cả host chết)
#     HEALTHCHECK_CURL_OPTS      tuỳ chọn thêm cho curl (vd -k khi test cert tự ký)
#     HEALTHCHECK_ORIGIN_URL     vd http://caddy — kiểm site/Directus thẳng vào origin (kèm header Host) thay vì
#                                đi vòng ra Cloudflare; đường công khai chỉ còn 1 probe "/" (bắt lỗi ingress).
#                                Tránh báo DOWN giả khi đường mạng nhà→Cloudflare mất gói (2026-11-03).
#     HEALTHCHECK_TRIES=5        số lần thử cho probe đi đường công khai/TLS (cách nhau HEALTHCHECK_RETRY_SECS=3)
set -u

SITE_URL="${SITE_URL:?cần SITE_URL}"
CMS_URL="${CMS_URL:?cần CMS_URL}"
CERT_MIN_DAYS="${CERT_MIN_DAYS:-14}"
CURL_OPTS="${HEALTHCHECK_CURL_OPTS:-}"
ORIGIN_URL="${HEALTHCHECK_ORIGIN_URL:-}"
TRIES="${HEALTHCHECK_TRIES:-5}"
RETRY_SECS="${HEALTHCHECK_RETRY_SECS:-3}"
FAILED=0

ok() { echo "OK    $1"; }
fail() {
  echo "FAIL  $1"
  FAILED=1
}

# shellcheck disable=SC2086
get() { curl -fsS -m 10 $CURL_OPTS "$@"; }

# retry CMD… — thử tối đa $TRIES lần; chỉ coi là hỏng khi lần nào cũng hỏng (chịu được mất gói thoáng qua).
retry() {
  n=1
  while ! "$@"; do
    [ "$n" -ge "$TRIES" ] && return 1
    n=$((n + 1))
    sleep "$RETRY_SECS"
  done
}

# host_of URL → tên miền (bỏ scheme, port, path)
host_of() {
  h="${1#*://}"
  h="${h%%/*}"
  echo "${h%%:*}"
}

# Có ORIGIN: gọi thẳng origin với header Host của domain thật. Không có: gọi URL công khai (có thử lại).
site_get() { # site_get BASE_URL PATH
  if [ -n "$ORIGIN_URL" ]; then get -H "Host: $(host_of "$1")" "$ORIGIN_URL$2"; else retry get "$1$2"; fi
}

if [ -n "$ORIGIN_URL" ]; then
  # Origin (Caddy) phải đáp ngay; probe công khai "/" thử lại nhiều lần để bắt lỗi ingress mà không báo giả.
  if retry get -o /dev/null "$SITE_URL/"; then ok "site $SITE_URL/ → 200 (đường công khai)"; else fail "site $SITE_URL/ không trả 200 qua đường công khai (sau $TRIES lần)"; fi
  site_label="origin"
else
  site_label="công khai"
fi

if site_get "$SITE_URL" / >/dev/null; then ok "site / ($site_label)"; else fail "site / không trả 200 ($site_label)"; fi
for p in /robots.txt /sitemap.xml; do
  if site_get "$SITE_URL" "$p" >/dev/null; then ok "site $p ($site_label)"; else fail "site $p không truy cập được ($site_label)"; fi
done

if site_get "$CMS_URL" /server/health | grep -q '"status":"ok"'; then
  ok "directus /server/health = ok ($site_label)"
else
  fail "directus /server/health không ok ($CMS_URL, $site_label)"
fi

tls_ok() {
  echo | openssl s_client -connect "$1:$2" -servername "$1" 2>/dev/null |
    openssl x509 -noout -checkend "$((CERT_MIN_DAYS * 86400))" >/dev/null 2>&1
}

# Chứng chỉ TLS: -checkend N → thoát != 0 nếu hết hạn trong N giây (portable, không cần parse ngày).
if command -v openssl >/dev/null 2>&1; then
  for url in "$SITE_URL" "$CMS_URL"; do
    case "$url" in
      https://*)
        host="${url#https://}"
        host="${host%%/*}"
        port=443
        case "$host" in *:*) port="${host##*:}" host="${host%%:*}" ;; esac
        if retry tls_ok "$host" "$port"; then
          ok "TLS $host còn > $CERT_MIN_DAYS ngày"
        else
          fail "TLS $host hết hạn trong < $CERT_MIN_DAYS ngày (hoặc không đọc được chứng chỉ)"
        fi
        ;;
    esac
  done
else
  echo "SKIP  kiểm TLS (không có openssl)"
fi

# Tài nguyên máy + độ tươi backup (đĩa, RAM/swap, tuổi backup local & R2) — xem hostcheck.sh.
HOSTCHECK_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
if [ -f "$HOSTCHECK_DIR/hostcheck.sh" ]; then
  hc_out=$(sh "$HOSTCHECK_DIR/hostcheck.sh" 2>&1) || FAILED=1
  echo "$hc_out"
fi

if [ -n "${HEALTHCHECK_PING_URL:-}" ]; then
  if [ "$FAILED" -eq 0 ]; then
    curl -fsS -m 10 -o /dev/null "$HEALTHCHECK_PING_URL" || echo "WARN  không ping được $HEALTHCHECK_PING_URL"
  else
    curl -fsS -m 10 -o /dev/null "$HEALTHCHECK_PING_URL/fail" || echo "WARN  không ping được $HEALTHCHECK_PING_URL/fail"
  fi
fi

exit "$FAILED"
