#!/usr/bin/env bash
# Cập nhật server đã dựng bằng scripts/deploy-home.sh: kéo code mới, build lại image, áp lại cấu hình CMS.
# Chạy bằng chính user triển khai, tại thư mục gốc repo:  ./scripts/update.sh
set -euo pipefail
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

setup_cms

say "Kiểm tra"
if smoke_tests; then
  say "Cập nhật xong."
else
  die "Có kiểm tra thất bại (xem cảnh báo ở trên)."
fi
