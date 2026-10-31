#!/usr/bin/env bash
# Hàm dùng chung cho scripts/deploy-home.sh và scripts/update.sh (Sprint 10 P4).
# Được `source`, không chạy trực tiếp. Yêu cầu: đã `cd` vào thư mục gốc repo.

ENV_FILE="${ENV_FILE:-.env.production}"
STATE_FILE="${STATE_FILE:-.deploy-state}"

say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
warn() { printf '\033[33m!!  %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[31mLỖI: %s\033[0m\n' "$*" >&2; exit 1; }

# Lệnh compose chuẩn: danh sách file lấy từ COMPOSE_FILE trong env file (P3).
dc() { docker compose --env-file "$ENV_FILE" "$@"; }

# Nạp .env.production vào môi trường shell (để truyền ADMIN_* / REBUILD_TOKEN vào container mà
# không đưa giá trị lên dòng lệnh).
load_env() {
  [ -f "$ENV_FILE" ] || die "Không thấy $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "./$ENV_FILE"
  set +a
  # Mật khẩu admin trong env file chỉ đúng tới lúc bạn đổi nó trong Directus → cho phép ghi đè trong phiên này.
  if [ -n "${ADMIN_PASSWORD_OVERRIDE:-}" ]; then export ADMIN_PASSWORD="$ADMIN_PASSWORD_OVERRIDE"; fi
}

# Kiểm tra đăng nhập admin; nếu sai (đã đổi mật khẩu) thì hỏi mật khẩu hiện tại — không lưu ra đĩa.
ensure_admin_login() {
  load_env
  local code attempt=0
  while :; do
    code=$(ops_run sh -c 'curl -s -o /dev/null -w "%{http_code}" -X POST "$DIRECTUS_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"' 2>/dev/null || true)
    [ "$code" = "200" ] && return 0
    attempt=$((attempt+1))
    [ "$attempt" -le 3 ] && [ -t 0 ] || die "Không đăng nhập được admin ($ADMIN_EMAIL). Đặt ADMIN_PASSWORD_OVERRIDE=<mật khẩu hiện tại> rồi chạy lại."
    warn "Đăng nhập admin thất bại (mật khẩu trong $ENV_FILE là mật khẩu ban đầu, có thể bạn đã đổi)."
    read -r -s -p "Mật khẩu admin hiện tại: " ADMIN_PASSWORD_OVERRIDE; echo
    export ADMIN_PASSWORD_OVERRIDE
    load_env
  done
}

step_done() { [ -f "$STATE_FILE" ] && grep -qx "$1" "$STATE_FILE"; }
mark_done() { step_done "$1" || echo "$1" >> "$STATE_FILE"; }

# Chạy một lệnh một-lần trong container `ops` (node + bash + curl; repo mount :ro tại /repo).
# Chỉ truyền TÊN biến (-e NAME) để giá trị không lộ ở danh sách tiến trình.
ops_run() {
  dc run --rm --no-deps -e ADMIN_EMAIL -e ADMIN_PASSWORD -e REBUILD_TOKEN -e REBUILD_WEBHOOK_URL ops "$@"
}

# Cấu hình CMS (idempotent): schema → permissions → Flow rebuild → theme.
setup_cms() {
  ensure_admin_login
  say "Áp schema Directus"
  dc exec -T directus npx directus schema apply --yes /directus/snapshots/schema.yaml
  say "Áp quyền (Roles/Policies/Permissions)"
  ops_run bash services/directus/apply-permissions.sh
  say "Áp Flow rebuild-on-publish"
  ops_run node services/directus/apply-rebuild-flow.mjs
  say "Áp theme/branding admin"
  ops_run node services/directus/apply-theme.mjs
}

# Smoke test sau khi dựng. Trả về số lỗi.
smoke_tests() {
  load_env
  local fail=0 code
  # Đi vào Caddy từ trong mạng compose, đặt header Host đúng như Cloudflare gửi tới.
  code=$(ops_run curl -s -o /dev/null -w '%{http_code}' -H "Host: ${SITE_DOMAIN}" http://caddy/ 2>/dev/null || true)
  if [ "$code" = "200" ]; then info "OK   site qua Caddy (200)"; else warn "site qua Caddy trả '$code'"; fail=$((fail+1)); fi

  code=$(ops_run curl -s -o /dev/null -w '%{http_code}' -H "Host: ${CMS_DOMAIN}" http://caddy/server/health 2>/dev/null || true)
  if [ "$code" = "200" ]; then info "OK   CMS qua Caddy (200)"; else warn "CMS qua Caddy trả '$code'"; fail=$((fail+1)); fi

  # Webhook: token sai phải bị từ chối (404 đồng nhất) — chứng minh receiver tới được mà không kích hoạt build.
  code=$(ops_run curl -s -o /dev/null -w '%{http_code}' -X POST -H 'x-rebuild-token: sai' http://web:9000/rebuild 2>/dev/null || true)
  if [ "$code" = "404" ]; then info "OK   webhook lắng nghe, từ chối token sai (404)"; else warn "webhook trả '$code' (mong 404)"; fail=$((fail+1)); fi

  # API công khai: đọc được bài đã xuất bản, KHÔNG đọc được user.
  code=$(ops_run curl -s -o /dev/null -w '%{http_code}' 'http://directus:8055/items/posts?limit=1' 2>/dev/null || true)
  if [ "$code" = "200" ]; then info "OK   API công khai /items/posts (200)"; else warn "API công khai trả '$code'"; fail=$((fail+1)); fi
  code=$(ops_run curl -s -o /dev/null -w '%{http_code}' 'http://directus:8055/users' 2>/dev/null || true)
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then info "OK   /users bị chặn ($code)"; else warn "/users trả '$code' (mong 401/403)"; fail=$((fail+1)); fi

  # Tunnel (bỏ qua nếu không dùng tunnel hoặc SKIP_TUNNEL_CHECK=1).
  if [ "${SKIP_TUNNEL_CHECK:-0}" != "1" ] && dc config --services | grep -qx cloudflared; then
    # Container báo "running" trước khi tunnel đăng ký xong (vài giây) → chờ tối đa 60 giây.
    # Đọc log vào biến rồi mới grep: `grep -q` thoát sớm làm `docker logs` chết vì SIGPIPE, và `pipefail`
    # biến điều đó thành "chưa đăng ký" dù log đã có dòng cần tìm (xảy ra khi log dài).
    local registered=0 tunnel_log
    for _ in $(seq 1 12); do
      tunnel_log=$(dc logs --no-color cloudflared 2>&1 || true)
      if grep -q "Registered tunnel connection" <<<"$tunnel_log"; then registered=1; break; fi
      sleep 5
    done
    if [ "$registered" = 1 ]; then
      info "OK   cloudflared đã đăng ký tunnel"
    else
      warn "cloudflared chưa đăng ký tunnel sau 60 giây — xem: docker compose --env-file $ENV_FILE logs cloudflared"; fail=$((fail+1))
    fi
  fi
  return "$fail"
}
