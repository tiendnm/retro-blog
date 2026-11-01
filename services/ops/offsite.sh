#!/bin/sh
# ── Backup ra ngoài máy → Cloudflare R2 (rclone) ───────────────────────────
# Đẩy các thư mục backup hoàn chỉnh (YYYYMMDD-HHMMSS) trong BACKUP_DIR lên R2; thư mục nào đã có thì rclone bỏ qua
# ⇒ tự bù những lần trước lỡ đẩy. KHÔNG đẩy env.bak (chứa secret) và *.tmp (bản dở). Sau khi đẩy xong mới dọn bản cũ
# trên R2 (giữ R2_KEEP bản mới nhất, mặc định 30). Không dùng `sync` có chủ đích: ổ cứng hỏng rồi dựng lại thư mục
# trống sẽ KHÔNG xoá backup trên R2.
#   Env: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (thiếu R2_BUCKET → bỏ qua, thoát 0),
#        BACKUP_DIR (mặc định /backups), R2_KEEP (mặc định 30), R2_PREFIX (mặc định backups).
#   Cách dùng: offsite.sh           đẩy + dọn (backup.sh tự gọi)
#              offsite.sh --check   chỉ kiểm tra kết nối + liệt kê bản trên R2
set -eu

if [ -z "${R2_BUCKET:-}" ]; then
  echo "[offsite] R2_BUCKET chưa đặt → bỏ qua (chỉ có backup trên máy)"
  exit 0
fi
: "${R2_ACCOUNT_ID:?thiếu R2_ACCOUNT_ID}" "${R2_ACCESS_KEY_ID:?thiếu R2_ACCESS_KEY_ID}" "${R2_SECRET_ACCESS_KEY:?thiếu R2_SECRET_ACCESS_KEY}"

DIR="${BACKUP_DIR:-/backups}"
KEEP="${R2_KEEP:-30}"
PREFIX="${R2_PREFIX:-backups}"
case "$KEEP" in
  '' | *[!0-9]* | 0)
    echo "[offsite] R2_KEEP phải là số nguyên >= 1 (nhận: '$KEEP')" >&2
    exit 2
    ;;
esac

# Cấu hình remote hoàn toàn qua env (không cần file config; chạy được với user non-root, /repo chỉ đọc).
# NO_CHECK_BUCKET: token giới hạn theo bucket không có quyền tạo bucket.
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_ACL=private RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
rc() { rclone --config /dev/null "$@"; }
REMOTE="R2:${R2_BUCKET}/${PREFIX}"

if [ "${1:-}" = "--check" ]; then
  echo "[offsite] kết nối $REMOTE"
  rc lsf --dirs-only "$REMOTE" | sort
  echo "[offsite] kết nối OK"
  exit 0
fi

echo "[offsite] đẩy $DIR → $REMOTE (bỏ env.bak, *.tmp)"
# Luật --filter xét theo thứ tự, khớp đầu tiên thắng: (1) loại env.bak (secret), (2) nhận thư mục backup hoàn chỉnh, (3) loại hết còn lại
# (*.tmp, file lạ). Đã kiểm chứng bằng `rclone lsf` — dùng cặp --exclude/--include riêng lẻ từng để lọt env.bak lên R2.
# Không pipe qua lệnh khác: `set -e` phải thấy mã thoát của rclone, nếu không bước dọn bên dưới có thể chạy khi đẩy lỗi.
rc copy "$DIR" "$REMOTE" \
  --filter '- env.bak' \
  --filter '+ /[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]/**' \
  --filter '- **' \
  --retries 3 --stats-one-line --stats 30s -v

# Dọn bản cũ trên R2 — tới đây tức là đẩy đã thành công.
old=$(rc lsf --dirs-only "$REMOTE" | tr -d / | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r | tail -n "+$((KEEP + 1))" || true)
for d in $old; do
  echo "[offsite] xoá bản cũ trên R2: $d"
  rc purge "$REMOTE/$d"
done
echo "[offsite] xong"
