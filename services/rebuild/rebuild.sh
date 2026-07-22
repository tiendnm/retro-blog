#!/bin/sh
# ── rebuild-on-publish orchestrator (Sprint 6 Phase 3 — ADR-0008) ──────────
# Chạy TRÊN HOST (cần docker). Được webhook receiver (webhook.mjs) gọi khi
# Directus phát sự kiện publish; cũng có thể chạy tay (fallback runbook 13-ops).
#
# Chạy lại job `web` (build-runner → build-swap.sh) → build mới + atomic swap.
# Debounce/serialize bằng flock: chỉ 1 rebuild tại một thời điểm.
set -eu

# Về repo root (script nằm ở services/rebuild/).
cd "$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"

LOCK="${REBUILD_LOCK:-/tmp/retro-rebuild.lock}"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[rebuild] một rebuild đang chạy — bỏ qua (debounce)"
  exit 0
fi

echo "[rebuild] $(date '+%F %T') bắt đầu"
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file "${ENV_FILE:-.env.production}" \
  run --rm --no-deps web
echo "[rebuild] $(date '+%F %T') xong"
