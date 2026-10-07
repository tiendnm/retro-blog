#!/bin/sh
# ── Giữ N bản backup gần nhất (Sprint 8) ───────────────────────────────────
# Chỉ xoá thư mục tên dạng YYYYMMDD-HHMMSS trong BACKUP_DIR (không đụng thứ khác).
# Sắp theo TÊN (timestamp), không theo mtime → không bị lệch khi copy/restore file.
#   Env: BACKUP_DIR (mặc định ./backups), BACKUP_KEEP (mặc định 14, số nguyên >= 1).
set -eu

DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP:-14}"
case "$KEEP" in
  '' | *[!0-9]* | 0)
    echo "[prune] BACKUP_KEEP phải là số nguyên >= 1 (nhận: '$KEEP')" >&2
    exit 2
    ;;
esac
[ -d "$DIR" ] || exit 0

ls -1 "$DIR" | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r | tail -n "+$((KEEP + 1))" | while read -r old; do
  echo "[prune] xoá backup cũ: $old"
  rm -rf "${DIR:?}/$old"
done
