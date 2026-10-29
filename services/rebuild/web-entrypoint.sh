#!/bin/sh
# ── Entrypoint của service `web` ở production (Sprint 10 P1 — ADR-0016) ─────
# Chạy TRONG container web (image apps/web/Dockerfile; thư mục này mount tại /rebuild):
#   1. Build lần đầu + atomic swap (build-swap.sh) → Caddy có site để phục vụ.
#   2. Chạy receiver webhook (webhook.mjs): Directus Flow gọi → build-swap.sh chạy lại.
# Build đầu LỖI không giết container: receiver vẫn chạy để lần publish sau tự khắc phục
# (healthcheck vẫn "unhealthy" cho tới khi có bản build đầu tiên → Caddy không khởi động).
set -u

# Thử lại vài lần: sau khi máy khởi động lại, Directus có thể chưa sẵn sàng lúc web chạy.
TRIES="${BUILD_RETRIES:-3}"
DELAY="${BUILD_RETRY_DELAY:-30}"
n=1
until sh /rebuild/build-swap.sh; do
  if [ "$n" -ge "$TRIES" ]; then
    echo "[web] ⚠ build đầu tiên LỖI sau $n lần — receiver vẫn chạy; sửa nguyên nhân rồi publish (hoặc POST /rebuild) để build lại" >&2
    break
  fi
  echo "[web] build lỗi (lần $n/$TRIES) — thử lại sau ${DELAY}s" >&2
  n=$((n + 1))
  sleep "$DELAY"
done

export REBUILD_COMMAND="${REBUILD_COMMAND:-sh /rebuild/build-swap.sh}"
export REBUILD_HOST="${REBUILD_HOST:-0.0.0.0}"
exec node /rebuild/webhook.mjs
