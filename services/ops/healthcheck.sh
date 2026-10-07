#!/bin/sh
# ── Health check / uptime (Sprint 8) ───────────────────────────────────────
# Kiểm: site trả 200 · /robots.txt & /sitemap.xml · Directus /server/health = ok ·
# chứng chỉ TLS còn hạn. Exit 0 nếu tất cả đạt, 1 nếu có mục hỏng. Chạy TRÊN HOST
# (timer: services/ops/systemd/retro-healthcheck.timer) hoặc từ máy khác.
#
#   Env bắt buộc: SITE_URL (vd https://retro.example.com), CMS_URL (vd https://cms.example.com)
#   Env tuỳ chọn:
#     CERT_MIN_DAYS=14           cảnh báo khi chứng chỉ còn ít hơn N ngày (chỉ với https)
#     HEALTHCHECK_PING_URL       dịch vụ giám sát kiểu healthchecks.io: gọi URL khi OK, URL/fail khi lỗi
#                                → báo động khi KHÔNG thấy ping (kể cả khi cả host chết)
#     HEALTHCHECK_CURL_OPTS      tuỳ chọn thêm cho curl (vd -k khi test cert tự ký)
set -u

SITE_URL="${SITE_URL:?cần SITE_URL}"
CMS_URL="${CMS_URL:?cần CMS_URL}"
CERT_MIN_DAYS="${CERT_MIN_DAYS:-14}"
CURL_OPTS="${HEALTHCHECK_CURL_OPTS:-}"
FAILED=0

ok() { echo "OK    $1"; }
fail() {
  echo "FAIL  $1"
  FAILED=1
}

# shellcheck disable=SC2086
get() { curl -fsS -m 10 $CURL_OPTS "$@"; }

if get -o /dev/null "$SITE_URL/"; then ok "site $SITE_URL/ → 200"; else fail "site $SITE_URL/ không trả 200"; fi
for p in /robots.txt /sitemap.xml; do
  if get -o /dev/null "$SITE_URL$p"; then ok "site $p"; else fail "site $p không truy cập được"; fi
done

if get "$CMS_URL/server/health" | grep -q '"status":"ok"'; then
  ok "directus /server/health = ok"
else
  fail "directus /server/health không ok ($CMS_URL)"
fi

# Chứng chỉ TLS: -checkend N → thoát != 0 nếu hết hạn trong N giây (portable, không cần parse ngày).
if command -v openssl >/dev/null 2>&1; then
  for url in "$SITE_URL" "$CMS_URL"; do
    case "$url" in
      https://*)
        host="${url#https://}"
        host="${host%%/*}"
        port=443
        case "$host" in *:*) port="${host##*:}" host="${host%%:*}" ;; esac
        if echo | openssl s_client -connect "$host:$port" -servername "$host" 2>/dev/null |
          openssl x509 -noout -checkend "$((CERT_MIN_DAYS * 86400))" >/dev/null 2>&1; then
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

if [ -n "${HEALTHCHECK_PING_URL:-}" ]; then
  if [ "$FAILED" -eq 0 ]; then
    curl -fsS -m 10 -o /dev/null "$HEALTHCHECK_PING_URL" || echo "WARN  không ping được $HEALTHCHECK_PING_URL"
  else
    curl -fsS -m 10 -o /dev/null "$HEALTHCHECK_PING_URL/fail" || echo "WARN  không ping được $HEALTHCHECK_PING_URL/fail"
  fi
fi

exit "$FAILED"
