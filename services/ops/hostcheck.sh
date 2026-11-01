#!/bin/sh
# ── Kiểm tài nguyên máy & độ tươi của backup (Sprint 12) ───────────────────
# Được healthcheck.sh gọi (và chạy tay được). In từng dòng OK/WARN/FAIL; exit 1 nếu có FAIL.
#   FAIL: đĩa vượt ngưỡng · backup local quá cũ · bản mới nhất trên R2 quá cũ   (→ healthcheck.sh ping /fail)
#   WARN: RAM khả dụng thấp · swap dùng nhiều                                   (chỉ ghi log, không ping lỗi)
#   Dòng INFO: kích thước pgdata / uploads / backups để theo dõi xu hướng.
#   Env (đều tuỳ chọn): BACKUP_DIR (/backups) · UPLOADS_DIR (/data/uploads) · DISK_PATH (/backups)
#     DISK_WARN_PCT=85 · MEM_MIN_MB=200 · SWAP_WARN_PCT=75 · BACKUP_MAX_AGE_H=26 · R2_MAX_AGE_H=26
#     R2_CHECK_EVERY=3600 (giây; tránh gọi R2 mỗi 5 phút) · R2_CACHE=/tmp/ops-r2-latest
#     PROC_MEMINFO=/proc/meminfo (cho test) · NOW (epoch, cho test)
set -u

BACKUP_DIR="${BACKUP_DIR:-/backups}"
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"
DISK_PATH="${DISK_PATH:-$BACKUP_DIR}"
DISK_WARN_PCT="${DISK_WARN_PCT:-85}"
MEM_MIN_MB="${MEM_MIN_MB:-200}"
SWAP_WARN_PCT="${SWAP_WARN_PCT:-75}"
BACKUP_MAX_AGE_H="${BACKUP_MAX_AGE_H:-26}"
R2_MAX_AGE_H="${R2_MAX_AGE_H:-26}"
R2_CHECK_EVERY="${R2_CHECK_EVERY:-3600}"
R2_CACHE="${R2_CACHE:-/tmp/ops-r2-latest}"
MEMINFO="${PROC_MEMINFO:-/proc/meminfo}"
NOW="${NOW:-$(date +%s)}"
OPS_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
FAILED=0

ok() { echo "OK    $1"; }
warn() { echo "WARN  $1"; }
fail() {
  echo "FAIL  $1"
  FAILED=1
}

# Tên thư mục backup hoàn chỉnh (YYYYMMDD-HHMMSS) → epoch (giờ địa phương, cùng TZ với lúc backup ghi tên).
stamp_to_epoch() {
  s="$1"
  date -d "$(echo "$s" | sed -E 's/^(....)(..)(..)-(..)(..)(..)$/\1-\2-\3 \4:\5:\6/')" +%s 2>/dev/null
}

# ── Đĩa ──
if [ -d "$DISK_PATH" ]; then
  pct=$(df -P "$DISK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}')
  if [ -n "$pct" ] && [ "$pct" -ge "$DISK_WARN_PCT" ]; then
    fail "đĩa $DISK_PATH đầy ${pct}% (ngưỡng ${DISK_WARN_PCT}%)"
  else
    ok "đĩa ${pct:-?}% (ngưỡng ${DISK_WARN_PCT}%)"
  fi
else
  echo "SKIP  kiểm đĩa (không có $DISK_PATH)"
fi

# ── RAM / swap (số của HOST: container không bị lxcfs che /proc/meminfo) ──
if [ -r "$MEMINFO" ]; then
  avail_kb=$(awk '/^MemAvailable:/ {print $2}' "$MEMINFO")
  swap_total=$(awk '/^SwapTotal:/ {print $2}' "$MEMINFO")
  swap_free=$(awk '/^SwapFree:/ {print $2}' "$MEMINFO")
  if [ -n "$avail_kb" ]; then
    if [ $((avail_kb / 1024)) -lt "$MEM_MIN_MB" ]; then
      warn "RAM khả dụng $((avail_kb / 1024)) MB < ${MEM_MIN_MB} MB"
    else
      ok "RAM khả dụng $((avail_kb / 1024)) MB"
    fi
  fi
  if [ "${swap_total:-0}" -gt 0 ]; then
    used_pct=$(((swap_total - swap_free) * 100 / swap_total))
    if [ "$used_pct" -ge "$SWAP_WARN_PCT" ]; then
      warn "swap dùng ${used_pct}% (ngưỡng ${SWAP_WARN_PCT}%)"
    else
      ok "swap dùng ${used_pct}%"
    fi
  fi
fi

# ── Kích thước dữ liệu (chỉ để theo dõi xu hướng) ──
info=""
if command -v psql >/dev/null 2>&1 && [ -n "${PGHOST:-}" ]; then
  db_b=$(psql -d "${PGDB:-postgres}" -Atc 'select pg_database_size(current_database())' 2>/dev/null || true)
  [ -n "$db_b" ] && info="$info db=$((db_b / 1048576))MB"
fi
[ -d "$UPLOADS_DIR" ] && info="$info uploads=$(du -sk "$UPLOADS_DIR" 2>/dev/null | awk '{print int($1/1024)}')MB"
[ -d "$BACKUP_DIR" ] && info="$info backups=$(du -sk "$BACKUP_DIR" 2>/dev/null | awk '{print int($1/1024)}')MB"
[ -n "$info" ] && echo "INFO ${info}"

# ── Tuổi backup local ──
latest=""
if [ -d "$BACKUP_DIR" ]; then
  # shellcheck disable=SC2010  # tên thư mục do backup.sh đặt
  latest=$(ls -1 "$BACKUP_DIR" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort | tail -1)
  if [ -z "$latest" ]; then
    fail "không có backup hoàn chỉnh nào trong $BACKUP_DIR"
  else
    ts=$(stamp_to_epoch "$latest")
    if [ -z "$ts" ]; then
      echo "SKIP  tuổi backup (không đọc được tên $latest)"
    else
      age_h=$(((NOW - ts) / 3600))
      if [ "$age_h" -gt "$BACKUP_MAX_AGE_H" ]; then
        fail "backup mới nhất $latest đã ${age_h} giờ (ngưỡng ${BACKUP_MAX_AGE_H} giờ)"
      else
        ok "backup mới nhất $latest (${age_h} giờ trước)"
      fi
    fi
  fi
fi

# ── Tuổi bản mới nhất trên R2 (cache để không gọi R2 mỗi 5 phút) ──
if [ -n "${R2_BUCKET:-}" ]; then
  cached_at=0
  r2_latest=""
  if [ -r "$R2_CACHE" ]; then
    cached_at=$(sed -n 1p "$R2_CACHE")
    r2_latest=$(sed -n 2p "$R2_CACHE")
  fi
  if [ -z "$r2_latest" ] || [ $((NOW - ${cached_at:-0})) -ge "$R2_CHECK_EVERY" ]; then
    if listing=$(sh "$OPS_DIR/offsite.sh" --check 2>&1); then
      r2_latest=$(echo "$listing" | tr -d / | grep -E '^[0-9]{8}-[0-9]{6}$' | sort | tail -1)
      printf '%s\n%s\n' "$NOW" "$r2_latest" >"$R2_CACHE" 2>/dev/null || true
    else
      r2_latest="?"
      fail "không liệt kê được backup trên R2: $(echo "$listing" | tail -1)"
    fi
  fi
  if [ "$r2_latest" != "?" ]; then
    if [ -z "$r2_latest" ]; then
      fail "R2 chưa có bản backup nào"
    else
      ts=$(stamp_to_epoch "$r2_latest")
      if [ -n "$ts" ]; then
        age_h=$(((NOW - ts) / 3600))
        if [ "$age_h" -gt "$R2_MAX_AGE_H" ]; then
          fail "bản mới nhất trên R2 $r2_latest đã ${age_h} giờ (ngưỡng ${R2_MAX_AGE_H} giờ)"
        else
          ok "R2 có bản $r2_latest (${age_h} giờ trước)"
        fi
      fi
    fi
  fi
fi

exit "$FAILED"
