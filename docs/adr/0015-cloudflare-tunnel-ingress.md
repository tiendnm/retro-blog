# ADR-0015 — Cloudflare Tunnel làm đường vào cho server tại nhà (bổ sung ADR-0007)

> **Status:** Accepted <!-- 2026-10-07 -->
> **Ngày đề xuất:** 2026-10-07 · **Ngày Accepted:** 2026-10-07
> **Người quyết định:** Product (chọn host tại nhà, chỉ dùng Cloudflare Tunnel)
> **Nguyên tắc tuân thủ (Principles):** P4/P5 (self-host, tái lập), P6 (Low coupling — ingress là adapter thay được). **Bổ sung** [ADR-0007](./0007-reverse-proxy-and-tls.md) (Caddy vẫn là edge nội bộ), không thay thế.

---

## Bối cảnh (Context)

Product chưa có server thuê; có máy tại nhà (Intel J1900, 4 GB RAM, HDD) và domain `tiendnm.com` mua trực tiếp ở Cloudflare. Mạng nhà thường sau CGNAT/IP động và không nên mở cổng ra internet. Site là SSG nên tải thấp.

## Quyết định (Decision)

- Dùng **Cloudflare Tunnel** (`cloudflared`, image pin `cloudflare/cloudflared:2026.10.0`) làm đường vào duy nhất; **không mở/forward cổng nào** trên router.
- Cloudflare terminate TLS; tunnel đẩy **HTTP** vào `http://caddy:80`. Cả hai hostname (`retro.tiendnm.com`, `retro-cms.tiendnm.com`) trỏ về Caddy, Caddy định tuyến theo Host → giữ nguyên header bảo mật/CSP (Sprint 8).
- Hiện thực bằng **override cộng thêm** `docker-compose.tunnel.yml` (không sửa đường Caddy-TLS-trực-tiếp): Caddy không publish 80/443; biến `SITE_ADDRESS`/`CMS_ADDRESS` = `http://<domain>`; `TUNNEL_TOKEN` trong `.env.production`.
- Caddy `trusted_proxies static private_ranges` để Directus thấy `X-Forwarded-Proto: https`; Directus đặt `REFRESH_TOKEN_COOKIE_SECURE`/`SESSION_COOKIE_SECURE` = true.
- Tunnel dạng **remotely-managed** (cấu hình hostname trong Cloudflare dashboard), nên không có file credentials trong repo.

## Đánh đổi

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4/P5 | ✅ | Một lệnh compose; $0 |
| P6 | ✅ | Chuyển sang VPS có IP công khai chỉ là bỏ file tunnel, dùng Caddy auto-TLS (đường cũ còn nguyên) |
| — | ⚠️ | Phụ thuộc Cloudflare (nhà cung cấp + điều khoản) và độ sẵn sàng của mạng/điện tại nhà (không UPS) |
| — | ⚠️ | TLS đầu-cuối chỉ tới Cloudflare edge; đoạn tunnel→Caddy là HTTP trong mạng nội bộ Docker |

## Hệ quả

- ➕ Không lộ IP nhà, không mở cổng, có lớp chống DDoS/bot cơ bản của Cloudflare, không phụ thuộc IP tĩnh.
- ➖ Mất điện/mạng nhà = site không truy cập được (chấp nhận cho blog lưu lượng thấp).
- ➖ Phần kết nối tunnel thật chỉ kiểm chứng được khi có tài khoản/domain Cloudflare (dry-run cục bộ chỉ kiểm Caddy HTTP + compose).

## Khả nghịch

Cao: thuê VPS, bỏ `docker-compose.tunnel.yml`, đặt `SITE_ADDRESS`/`CMS_ADDRESS` về domain trần, mở 80/443 → Caddy tự xin Let's Encrypt.
