# 🔒 Sprint 8 — Production Hardening (hạ tầng)

> **Vai trò:** DevOps / Security Engineer · **Mục tiêu:** đóng các lỗ hổng hạ tầng còn lại trước khi go-live (header bảo mật, webhook rebuild, backup theo lịch, giám sát). Không đổi Content Model/API/DTO/Reader.
> 🔗 [12-security](../12-security.md) · [13-operations](../13-operations.md) · [08-deployment](../08-deployment.md) · [ADR-0007](../adr/0007-reverse-proxy-and-tls.md) · [ADR-0008](../adr/0008-rebuild-on-publish.md)

## Phạm vi

- [x] **Security headers ở Caddy** (site + CMS), CSP chặt cho site tĩnh, header cả trên trang lỗi.
- [x] **Siết webhook rebuild:** token header-only, hằng-thời-gian, uniform 404, khoá thử sai, bind loopback; có test.
- [x] **Backup theo lịch:** `umask 077`, `prune-backups.sh` (giữ `BACKUP_KEEP`), systemd timer.
- [x] **Health check / uptime:** `healthcheck.sh` (site, robots, sitemap, Directus, hạn TLS) + timer + ping ngoài host tuỳ chọn.
- [x] **systemd units** mẫu (webhook service, backup timer, healthcheck timer).

**Ngoài phạm vi (Backlog):** 2FA admin & ACME/DNS thật (@deploy) · rate limiting Directus · container không chạy root · quét lỗ hổng dependency · copy backup ra ngoài host (tuỳ hạ tầng) · tăng HSTS lên 1 năm.

## Kết quả (2026-10-07)

| Hạng mục | Kiểm chứng |
|---|---|
| Caddyfile | `caddy validate` OK; chạy Caddy thật (internal TLS) với dist thật + backend giả: 200/404/500/502 đều có 5 header bảo mật, không có `Server`; CSP chỉ ở site; HTTP→HTTPS 308. **Bài học:** `header` chỉ áp trên luồng thường — phải `import` snippet cả trong `handle_errors`, và tiền tố `>` làm hỏng `-Server` |
| Webhook | 6 test `node --test` (token đúng/sai/query/method/path, khoá 429 + mở lại, debounce); kiểm đột biến (`tokenMatches` luôn true → 4 test đỏ); smoke chạy server thật; từ chối token < 32 ký tự |
| Backup prune | thử với thư mục giả: chỉ xoá thư mục `YYYYMMDD-HHMMSS` cũ, giữ file/thư mục lạ, từ chối `BACKUP_KEEP` không hợp lệ |
| Healthcheck | stub: OK → exit 0 + ping; Directus down/sai nội dung → exit 1 + ping `/fail`; TLS: cert 5 ngày FAIL ở ngưỡng 14, OK ở ngưỡng 3 |
| systemd units | `systemd-analyze verify` (Debian 12) không báo lỗi cú pháp |
| CI | `actionlint` sạch; thêm bước `node --test services/rebuild/` vào job `quality` |

**Chưa kiểm chứng (cần server thật):** CSP với trình duyệt trên domain thật (không chặn tài nguyên hợp lệ); systemd chạy thật (`systemctl`, `journalctl`); Linux `REBUILD_HOST`/docker0; `backup.sh` đầy đủ qua timer; backup copy ra ngoài host.
