#!/usr/bin/env bash
# Dựng Retro Blog trên server tại nhà (Cloudflare Tunnel) — Sprint 10, ADR-0016/0017.
# Chạy bằng user triển khai (thuộc nhóm docker), tại thư mục gốc repo:  ./scripts/deploy-home.sh
#
# Hỏi 3 thứ (hoặc truyền sẵn qua biến môi trường để chạy không tương tác):
#   DOMAIN (vd tiendnm.com) · TUNNEL_TOKEN · ADMIN_EMAIL        [ASSUME_YES=1 để tự đồng ý tạo swap]
# Tuỳ chọn: DEPLOY_COMPOSE_FILE (danh sách file, phân tách bằng dấu phẩy) · SKIP_TUNNEL_CHECK=1.
# Idempotent: chạy lại sẽ bỏ qua phần đã xong (trạng thái ở .deploy-state), KHÔNG sinh lại secret.
# Muốn làm lại từ đầu: xoá .deploy-state (và .env.production nếu muốn sinh secret mới).
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=lib/common.sh
. scripts/lib/common.sh

ask() { # ask "câu hỏi" BIẾN [secret]
  local prompt="$1" var="$2" secret="${3:-}" val="${!2:-}"
  while [ -z "$val" ]; do
    if [ "$secret" = secret ]; then read -r -s -p "$prompt: " val; echo; else read -r -p "$prompt: " val; fi
  done
  printf -v "$var" '%s' "$val"
}

# ── 1. Kiểm tra môi trường ────────────────────────────────────────────────────
check_env() {
  say "Kiểm tra môi trường"
  [ "$(id -u)" -ne 0 ] || die "Đừng chạy bằng root — dùng tài khoản triển khai (vd tiendnm) để file backup đúng chủ sở hữu."
  command -v docker >/dev/null || die "Chưa cài Docker."
  docker info >/dev/null 2>&1 || die "Không dùng được docker bằng user hiện tại (thiếu nhóm 'docker'? thử: sudo usermod -aG docker \$USER rồi đăng nhập lại)."
  local cv; cv=$(docker compose version --short 2>/dev/null) || die "Chưa có Docker Compose v2."
  cv=${cv#v}
  if [ "$(printf '%s\n2.24.0\n' "$cv" | sort -V | head -1)" != "2.24.0" ]; then die "Cần Compose >= 2.24 (hiện $cv)."; fi
  info "Docker OK · Compose $cv"
  command -v openssl >/dev/null || die "Thiếu openssl (để sinh secret)."
  command -v git >/dev/null || die "Thiếu git."

  local mem_mb disk_gb
  mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
  disk_gb=$(df -Pk . | awk 'NR==2 {print int($4/1024/1024)}')
  info "RAM ${mem_mb} MB · đĩa trống ${disk_gb} GB"
  [ "$disk_gb" -ge 5 ] || die "Cần tối thiểu ~5 GB trống (image + build)."
  ensure_swap "$mem_mb"
}

ensure_swap() {
  local mem_mb="$1" swap_mb
  swap_mb=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
  if [ "$mem_mb" -ge 6000 ] || [ "$swap_mb" -ge 1500 ]; then info "Swap ${swap_mb} MB — đủ."; return 0; fi
  warn "RAM ${mem_mb} MB, swap ${swap_mb} MB: build Astro có thể hết bộ nhớ. Khuyến nghị swap 2 GB."
  local ans="${ASSUME_YES:+y}"
  [ -n "$ans" ] || read -r -p "Tạo /swapfile 2 GB bây giờ (cần sudo)? [y/N] " ans
  case "$ans" in
    y|Y)
      if [ -e /swapfile ]; then die "/swapfile đã tồn tại — kiểm tra thủ công (swapon --show)."; fi
      sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
      grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
      info "Đã bật swap 2 GB." ;;
    *) warn "Bỏ qua swap — build có thể chậm/thất bại." ;;
  esac
}

# ── 2. Sinh .env.production ───────────────────────────────────────────────────
rand_hex()  { openssl rand -hex "$1"; }
rand_pass() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 24; }

set_kv() { # set_kv KEY VALUE — thay đúng dòng KEY=... (giá trị không chứa newline)
  local k="$1" v="$2"
  grep -q "^${k}=" "$ENV_FILE" || die "File mẫu thiếu biến $k"
  local esc; esc=$(printf '%s' "$v" | sed -e 's/[\&#]/\&/g')
  sed -i "s#^${k}=.*#${k}=${esc}#" "$ENV_FILE"
}

validate_env() {
  if grep -nE '^[^#]*(CHANGE_ME|<domain>)' "$ENV_FILE"; then die "$ENV_FILE còn giá trị mẫu (CHANGE_ME/<domain>)."; fi
  # systemd/bash/Compose đọc chú thích cuối dòng khác nhau → cấm (bài học Sprint 9).
  if grep -nE '^[A-Za-z_][A-Za-z0-9_]*=.*[[:space:]]#' "$ENV_FILE"; then die "$ENV_FILE có chú thích cuối dòng — để chú thích ở dòng riêng."; fi
  [ "$(stat -c %a "$ENV_FILE")" = "600" ] || chmod 600 "$ENV_FILE"
}

make_env() {
  if [ -f "$ENV_FILE" ]; then
    info "$ENV_FILE đã có — giữ nguyên (không sinh lại secret)."
    validate_env; return 0
  fi
  say "Tạo $ENV_FILE"
  ask "Domain gốc trên Cloudflare (vd tiendnm.com)" DOMAIN
  ask "Email quản trị (đăng nhập admin)" ADMIN_EMAIL
  ask "TUNNEL_TOKEN (Cloudflare Zero Trust → Tunnels → token)" TUNNEL_TOKEN secret
  case "$DOMAIN" in http*|*/*|*" "*) die "DOMAIN chỉ gồm tên miền, vd tiendnm.com";; esac

  ADMIN_PASSWORD=$(rand_pass)
  cp .env.production.example "$ENV_FILE"; chmod 600 "$ENV_FILE"
  set_kv SITE_DOMAIN "retro.${DOMAIN}"
  set_kv CMS_DOMAIN "retro-cms.${DOMAIN}"
  set_kv SITE_ADDRESS "http://retro.${DOMAIN}"
  set_kv CMS_ADDRESS "http://retro-cms.${DOMAIN}"
  set_kv PUBLIC_URL "https://retro-cms.${DOMAIN}"
  set_kv PUBLIC_DIRECTUS_URL "https://retro-cms.${DOMAIN}"
  set_kv PUBLIC_SITE_URL "https://retro.${DOMAIN}"
  set_kv ACME_EMAIL "$ADMIN_EMAIL"
  set_kv ADMIN_EMAIL "$ADMIN_EMAIL"
  set_kv ADMIN_PASSWORD "$ADMIN_PASSWORD"
  set_kv DB_PASSWORD "$(rand_hex 24)"
  set_kv KEY "$(rand_hex 32)"
  set_kv SECRET "$(rand_hex 32)"
  set_kv REBUILD_TOKEN "$(rand_hex 32)"
  set_kv TUNNEL_TOKEN "$TUNNEL_TOKEN"
  # Tuỳ chọn: ghi đè danh sách file compose (vd bỏ tunnel khi dùng VPS, hoặc thêm file thử nghiệm).
  [ -z "${DEPLOY_COMPOSE_FILE:-}" ] || set_kv COMPOSE_FILE "$DEPLOY_COMPOSE_FILE"
  set_kv DEPLOY_UID "$(id -u)"
  set_kv DEPLOY_GID "$(id -g)"
  validate_env
  # Mật khẩu chỉ in MỘT lần ở cuối; cũng nằm trong .env.production (quyền 600) để script chạy lại không hỏi nữa.
  FIRST_RUN_PASSWORD="$ADMIN_PASSWORD"
  mark_done env
}

# ── Chạy ──────────────────────────────────────────────────────────────────────
FIRST_RUN_PASSWORD=""
check_env
make_env
load_env
mkdir -p "${BACKUP_DIR:-./backups}"

if ! step_done db; then
  say "Khởi động Postgres + Directus (lần đầu build image có thể mất vài phút)"
  dc up -d --build --wait --wait-timeout 600 postgres directus
  mark_done db
else info "Postgres + Directus: đã xong (bỏ qua)."; fi

if ! step_done cms; then
  setup_cms
  mark_done cms
else info "Cấu hình CMS: đã xong (bỏ qua; muốn áp lại dùng scripts/update.sh)."; fi

say "Khởi động toàn bộ stack (build site lần đầu trên máy yếu có thể 5–15 phút)"
dc up -d --build --remove-orphans --wait --wait-timeout 1500

say "Kiểm tra"
fail=0; smoke_tests || fail=$?

say "Tóm tắt"
info "Site : https://${SITE_DOMAIN}"
info "Admin: https://${CMS_DOMAIN}/admin"
info "Email: ${ADMIN_EMAIL}"
if [ -n "$FIRST_RUN_PASSWORD" ]; then
  info "Mật khẩu (CHỈ HIỆN LẦN NÀY — đăng nhập rồi đổi ngay): ${FIRST_RUN_PASSWORD}"
else
  info "Mật khẩu: đã in ở lần chạy đầu (nằm trong $ENV_FILE nếu cần tra lại)."
fi
info "Nhớ: Cloudflare Tunnel cần 2 public hostname trỏ về HTTP caddy:80 (docs/08a)."
if [ "$fail" -ne 0 ]; then die "$fail kiểm tra thất bại — xem cảnh báo ở trên; chạy lại script sau khi sửa (idempotent)."; fi
say "Hoàn tất."
