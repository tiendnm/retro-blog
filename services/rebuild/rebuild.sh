#!/bin/sh
# ── Rebuild thủ công (fallback runbook 13-ops) — Sprint 10 P1 (ADR-0016) ────
# Chạy TRÊN HOST (cần docker). Không tự build: bảo receiver trong container `web` build (debounce/serialize
# giữ nguyên, an toàn khi trùng với build do Directus Flow gọi). Receiver trả 202 rồi build chạy nền;
# theo dõi:  docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production logs -f web
set -eu

# Về repo root (script nằm ở services/rebuild/).
cd "$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)"

echo "[rebuild] $(date '+%F %T') gửi yêu cầu rebuild tới receiver trong container web"
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file "${ENV_FILE:-.env.production}" \
  exec -T web node -e "
fetch('http://127.0.0.1:' + (process.env.REBUILD_PORT || 9000) + '/rebuild', {
  method: 'POST',
  headers: { 'x-rebuild-token': process.env.REBUILD_TOKEN },
}).then((r) => {
  console.log('[rebuild] receiver trả ' + r.status + (r.status === 202 ? ' (đã nhận, build chạy nền)' : ' (KHÔNG hợp lệ)'));
  process.exit(r.status === 202 ? 0 : 1);
}).catch((e) => {
  console.error('[rebuild] không gọi được receiver: ' + e.message);
  process.exit(1);
});
"
