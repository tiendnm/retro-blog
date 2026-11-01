# ── Image `ops` (Sprint 10 P2 — ADR-0017) ──────────────────────────────────
# Một image cho: (a) vận hành định kỳ — backup + healthcheck (scheduler.sh),
#                (b) tác vụ chạy một lần khi dựng server — schema/permissions/Flow/theme
#                    (`docker compose run --rm ops …`: cần node, bash, curl).
# Công cụ: pg_dump/pg_restore 16 (khớp postgres:16.x), node 22 (cùng base với `web`), bash, curl, openssl (kiểm TLS), tzdata (TZ).
# Script và repo được MOUNT (chỉ đọc) lúc chạy — image không chứa mã dự án.
FROM node:26.13.0-alpine
RUN apk add --no-cache postgresql16-client bash curl openssl tzdata rclone
WORKDIR /repo
CMD ["sh", "/repo/services/ops/scheduler.sh"]
