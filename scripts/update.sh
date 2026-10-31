#!/usr/bin/env bash
# Cập nhật server đã dựng bằng scripts/deploy-home.sh: kéo code mới, build lại image, áp lại cấu hình CMS.
# Chạy bằng chính user triển khai, tại thư mục gốc repo:  ./scripts/update.sh [--web-only]
#   --web-only: chỉ đổi code web/ops → bỏ qua bước áp cấu hình CMS (schema/quyền/Flow/theme), không cần mật khẩu admin.
#               Chạy bản đầy đủ (không cờ) khi đổi schema, quyền, Flow hoặc REBUILD_TOKEN.
set -euo pipefail
WEB_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --web-only) WEB_ONLY=1 ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) echo "Tham số không hợp lệ: $arg (dùng --web-only hoặc không có)" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."
# shellcheck source=lib/common.sh
. scripts/lib/common.sh

[ -f "$ENV_FILE" ] || die "Chưa có $ENV_FILE — chạy ./scripts/deploy-home.sh trước."

say "Kéo code mới"
git pull --ff-only

say "Build lại image (web, ops)"
dc build web ops

say "Khởi động lại stack"
dc up -d --remove-orphans --wait --wait-timeout 1200

if [ "$WEB_ONLY" = 1 ]; then
  say "Bỏ qua áp cấu hình CMS (--web-only)"
else
  setup_cms
fi

say "Kiểm tra"
if smoke_tests; then
  say "Cập nhật xong."
else
  die "Có kiểm tra thất bại (xem cảnh báo ở trên)."
fi
