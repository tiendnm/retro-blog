#!/bin/sh
# ── Bộ lập lịch của service `ops` (Sprint 10 P2 — ADR-0017) ────────────────
# Vòng lặp sh tối giản (không crond → chạy được NON-ROOT). Mỗi TICK giây:
#   • Backup hằng ngày: chạy khi đã qua BACKUP_AT (HH:MM theo TZ) và hôm nay CHƯA có bản hoàn chỉnh.
#     ⇒ máy tắt lúc 03:30 thì bật lên sẽ chạy bù. Lỗi → thử lại sau BACKUP_RETRY_SECS (mặc định 1 giờ).
#     Khi khởi động: nếu KHÔNG có bản nào trong 24 giờ qua → chạy ngay (không đợi tới BACKUP_AT).
#   • Healthcheck mỗi HEALTHCHECK_INTERVAL giây; log chi tiết khi FAIL và khi đổi trạng thái.
# Env: BACKUP_DIR, BACKUP_AT, BACKUP_RETRY_SECS, HEALTHCHECK_INTERVAL, OPS_TICK + env của backup.sh/healthcheck.sh.
# Heartbeat: /tmp/ops-alive (epoch) — compose healthcheck đọc file này.
set -u

OPS_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_AT="${BACKUP_AT:-03:30}"
RETRY="${BACKUP_RETRY_SECS:-3600}"
INTERVAL="${HEALTHCHECK_INTERVAL:-300}"
TICK="${OPS_TICK:-30}"
ALIVE="${OPS_ALIVE_FILE:-/tmp/ops-alive}"

log() { echo "[ops] $(date '+%F %T') $*"; }

case "$BACKUP_AT" in
  [0-2][0-9]:[0-5][0-9]) ;;
  *)
    echo "[ops] BACKUP_AT phải dạng HH:MM (nhận: '$BACKUP_AT')" >&2
    exit 2
    ;;
esac
TARGET="${BACKUP_AT%:*}${BACKUP_AT#*:}"

# Bản backup hoàn chỉnh mới nhất (tên YYYYMMDD-HHMMSS; thư mục dở dang là *.tmp nên không khớp).
latest_day() {
  ls -1 "$BACKUP_DIR" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort | tail -1 | cut -c1-8
}
# Có bản nào trong 24 giờ qua không (dựa mtime của thư mục backup)
has_recent() {
  [ -n "$(find "$BACKUP_DIR" -maxdepth 1 -type d -name '[0-9]*-[0-9]*' -mmin -1440 2>/dev/null | head -1)" ]
}

run_backup() {
  log "backup bắt đầu"
  if sh "$OPS_DIR/backup.sh"; then
    log "backup xong"
    return 0
  fi
  log "backup LỖI — thử lại sau ${RETRY}s"
  return 1
}

# Thoát gọn khi `docker stop` (sleep chạy nền + wait để trap kịp phản ứng).
trap 'log "nhận tín hiệu dừng"; exit 0' TERM INT

log "khởi động — backup lúc $BACKUP_AT (TZ=${TZ:-UTC}), healthcheck mỗi ${INTERVAL}s, thư mục $BACKUP_DIR"
last_attempt=0
last_health=0
health_state=unknown

if ! has_recent; then
  log "chưa có backup nào trong 24 giờ qua → chạy bù ngay"
  last_attempt=$(date +%s)
  run_backup || true
fi

while :; do
  date +%s >"$ALIVE"
  now=$(date +%s)

  if [ "$(date +%H%M)" -ge "$TARGET" ] && [ "$(latest_day)" != "$(date +%Y%m%d)" ] &&
    [ $((now - last_attempt)) -ge "$RETRY" ]; then
    last_attempt=$now
    run_backup || true
  fi

  if [ $((now - last_health)) -ge "$INTERVAL" ]; then
    last_health=$now
    if out=$(sh "$OPS_DIR/healthcheck.sh" 2>&1); then
      if [ "$health_state" != ok ]; then
        log "health OK"
        health_state=ok
      fi
    else
      log "health FAIL"
      echo "$out"
      health_state=fail
    fi
  fi

  sleep "$TICK" &
  wait $!
done
