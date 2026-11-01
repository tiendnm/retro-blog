# 12 — Security

> 🎯 **Mục đích:** Xác lập *tư thế bảo mật* của hệ thống — tài sản cần bảo vệ, mối đe doạ, và biện pháp kiểm soát. Bảo mật là mối quan tâm xuyên suốt, rẻ hơn nhiều khi thiết kế từ đầu.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [05-cms](./05-cms.md) · [08-deployment](./08-deployment.md) · [13-operations](./13-operations.md)

---

## 1. Nguyên tắc

- Least privilege · Defense in depth · Secure by default · Không tin dữ liệu đầu vào.

## 2. Mô hình đe doạ (Threat Model — sơ lược)

| Tài sản (Asset) | Tác nhân đe doạ | Mối đe doạ | Biện pháp kiểm soát |
|---|---|---|---|
| Nội dung/DB | Kẻ tấn công ngoài | Rò rỉ/sửa dữ liệu | Phân quyền, backup, TLS |
| Tài khoản admin Directus | Brute force/phishing | Chiếm quyền | Mật khẩu mạnh, 2FA, giới hạn |
| Secrets/API token | Lộ qua repo/log | Lạm dụng API | Quản lý secret, không log |
| Người dùng cuối | XSS qua nội dung | Chèn script | Sanitize/escape khi render |

> Có thể dùng STRIDE để rà soát: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation.

## 3. Xác thực & Phân quyền

- **Vai trò Directus** (chi tiết & ma trận: [05-cms §2](./05-cms.md)): **Admin** (`admin_access`, full) · **Editor** (`app_access`, chỉ CRUD nội dung — *không* quản trị user/role/policy) · **Public** (read-only).
- **Public API tối thiểu (least privilege):** Public chỉ `read`; `posts` bị chặn bằng rule **`status=published` AND `published_at ≤ $NOW`** → bản nháp và bài hẹn giờ tương lai **không** lộ qua API. Đã kiểm thử Phase 2: draft/future → `403`, published → `200`.
- **Reproducible, không thủ công:** phân quyền nằm ở [`services/directus/apply-permissions.sh`](../services/directus/apply-permissions.sh) (`pnpm permissions:apply`) — không dựa vào thao tác UI. Đây là ranh giới bảo mật cần review khi thay đổi.
- **Không frontend auth, không public CMS users** (MVP). 2FA cho tài khoản admin: khuyến nghị khi lên production (TODO trước phát hành).

## 4. Quản lý Secrets

- Không commit secret; dùng biến môi trường/secret manager. TODO: nơi lưu & xoay vòng (rotation).

## 5. Bảo mật dữ liệu & Quyền riêng tư

- TODO _(PII? bình luận? cookie/analytics; tuân thủ GDPR nếu có người dùng EU; cookie consent)_.

## 6. Bảo mật hạ tầng

**Đã có (Sprint 6):**
- **TLS bắt buộc:** Caddy auto-HTTPS (Let's Encrypt/ACME), HTTP→HTTPS redirect ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)).
- **Network segmentation:** Postgres **không expose** (chỉ nội bộ `retro-net`); Directus **bind `127.0.0.1`** trên host (public **chỉ** qua Caddy). Edge duy nhất = Caddy (80/443).
- **Image pin cứng** (không `latest`): `postgres:16.8-alpine` · `directus:11.17.4` · `caddy:2.10-alpine` · web + ops build từ `node:26.13.0-alpine`.
- **Build tái lập:** `--frozen-lockfile` (chống drift → giảm rủi ro chuỗi cung ứng, [S6-P1](./10-decisions.md)).
- **Secrets ngoài repo:** `.env.production` gitignored; chỉ commit `.env.production.example` (placeholder).

**Sprint 8 (Hardening hạ tầng):**
- **Security headers ở Caddy** (`Caddyfile`): HSTS 1 năm `includeSubDomains` (không preload; nâng 2026-11-01), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, ẩn `Server`; **CSP chặt cho site tĩnh** (không script/style inline; ảnh chỉ từ domain CMS). Admin Directus **không** bị đè CSP (Directus tự phát). Header cũng có trên trang lỗi (404/502) nhờ `handle_errors`.
- **Webhook rebuild siết** (`services/rebuild/webhook.mjs`): token chỉ qua header, so sánh hằng-thời-gian, mọi yêu cầu sai trả cùng 404, khoá tạm theo IP sau nhiều lần sai (429), receiver chạy trong container `web`, chỉ tới được trong mạng compose (không publish cổng), token ≥ 32 ký tự. Có test (`node --test services/rebuild/webhook.test.mjs`, chạy trong CI).
- **Backup:** `umask 077`, tự dọn bản cũ (`BACKUP_KEEP`), chạy hằng ngày trong service `ops`.

**Sprint 9 (server tại nhà):** không mở/forward cổng nào — truy cập duy nhất qua Cloudflare Tunnel ([ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md)); Postgres không publish cổng (chỉ `retro-net`); cookie Directus `Secure`; `ufw deny incoming` (SSH chỉ từ LAN). Đoạn tunnel→Caddy là HTTP trong mạng Docker nội bộ.

**Sprint 10 (đóng gói deploy):** **không `docker.sock`** ở bất kỳ container nào ([ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md): webhook ngay trong `web`; [ADR-0017](./adr/0017-ops-services-in-compose.md): `ops` mount repo/uploads `:ro`, chạy non-root theo uid của user triển khai); Directus không publish cổng ra host (chỉ Caddy/`ops` tới được qua `retro-net`); không user hệ thống riêng, không unit systemd, không rule `ufw` cho cổng 9000; `.env.production` quyền 600 do script sinh, cấm chú thích cuối dòng.

**Hardening 2026-11-01:**
- **Container tối thiểu quyền:** mọi service có `security_opt: no-new-privileges`; `cap_drop: ALL` cho directus, web, ops, caddy (+`NET_BIND_SERVICE`), cloudflared. Không chạy root: directus (`node`), web (`USER node`), ops (uid triển khai), caddy (`1000:1000`), cloudflared (`nonroot`); postgres chạy tiến trình DB bằng user `postgres` (entrypoint hạ quyền, image chuẩn).
- **Rate limiting Directus:** `RATE_LIMITER_*` theo IP, mặc định 100 yêu cầu/10 giây (`RATE_LIMITER_POINTS/DURATION`), quá mức → 429. IP thật = header `CF-Connecting-IP` (`IP_CUSTOM_HEADER`): Cloudflare luôn ghi đè header này và Caddy không publish cổng nên chỉ tunnel tới được. Yêu cầu nội bộ (web build, ops) không có header → khoá theo IP container. Giới hạn: kho bộ nhớ trong 1 instance; chưa có hạn mức riêng cho `/auth/login`.
- **Astro 5 → 7 (2026-11-01):** audit giảm từ 31 (1 critical, 11 high) xuống 3 (2 low, 1 moderate). Kéo theo base image `node:22.23.4-alpine` (Astro 7 cần Node ≥22.23.4); sau đó nâng tiếp lên `node:26.13.0-alpine` (2026-11-01, Dependabot #4/#6/#8). Đã so build trước/sau trên nội dung thật: cùng 19 trang/39 file, không script/style inline (CSP giữ nguyên), khác biệt chỉ là tên gói CSS, khoảng trắng và `&amp;` trong URL ảnh; tìm kiếm và lightbox chạy đúng.
- **Quét dependency:** `.github/dependabot.yml` (npm, docker, compose, actions — hằng tuần) và workflow `security.yml` (`pnpm audit --prod --audit-level high`, hằng tuần, hiện chỉ báo cáo).
- **Đợt Dependabot đầu (2026-11-01, 13 PR):** merge 12, đóng 1. Image: `node:26.13.0-alpine` (web, ops, compose dev; thử trọn pipeline gồm seed + `astro build`), `caddy:2.10-alpine` (header/CSP/404 giống hệt 2.8), `cloudflared:2026.10.5`. Actions: `checkout@v7`, `setup-node@v7`, `pnpm/action-setup@v6`. npm: `marked` 12→18 (HTML seed giống hệt), `vitest` 3→5, `@types/node` 22→26, nhóm minor-patch. **Postgres 16 → 18 (#1) đóng có chủ đích:** nâng major cần dump/restore, làm riêng, không qua Dependabot. CI ghim Node 26 (ghim `22` từng lấy 22.23.3 < 22.23.4 mà Astro 7 yêu cầu). Quy trình xử lý PR Dependabot: [13 §2](./13-operations.md).

**Còn lại (Backlog):** bỏ `continue-on-error` của `security.yml` khi 3 lỗ hổng còn lại được vá · cân nhắc Directus 12.x (đã nâng 11.3.5 → 11.17.4, 2026-11-01) · chưa có rate limit riêng cho đăng nhập admin.

## 7. Bảo mật chuỗi cung ứng (Supply chain)

- Khoá phiên bản: image pin cứng, `--frozen-lockfile`. Quét + cập nhật định kỳ: Dependabot và `security.yml` (xem §6 Hardening 2026-11-01).

## 8. Bảo mật tầng ứng dụng

- **Render nội dung từ CMS (`body`):** `body` lưu **HTML** (WYSIWYG, [ADR-0011](./adr/0011-body-stored-as-html-wysiwyg.md); trước đó markdown + `marked`) và hiển thị qua `set:html`. Nội dung do **Editor tin cậy** nhập (không có input công khai — không comment/không user-generated content ở MVP), nên rủi ro XSS thấp. **Đã hardening ([ADR-0013](./adr/0013-sanitize-body-html.md)):** HTML được sanitize bằng allowlist thẻ/thuộc tính/scheme lúc build (`apps/web/src/lib/sanitize-body.ts`) trước khi render — defense-in-depth kể cả khi tài khoản Editor bị chiếm.
- **Không tự lộ field nội bộ:** Public API dùng **field allowlist** (không `*`) — field thêm về sau không tự ra Public ([05-cms §2](./05-cms.md), [06-api §1](./06-api.md)).
- **Security headers:** xem §6 (cấu hình ở Caddyfile, không ở code app). Site không có form/endpoint ghi công khai nên CSRF không áp dụng; admin Directus dùng cơ chế auth của Directus.
- Rate limiting Directus: xem §6 (Hardening 2026-11-01).

## 9. Logging & Audit

- TODO _(ghi log truy cập/thay đổi; **không** log secret/PII)_. Xem [13-operations](./13-operations.md).

## 10. Quy trình khi phát hiện lỗ hổng

- TODO _(cách báo cáo, mức độ, thời gian vá, disclosure)_.

## 11. Checklist bảo mật trước phát hành

- [x] Không secret trong repo/log — `.env*` gitignored; chỉ `.example` placeholder _(S6)_
- [x] HTTPS/TLS bắt buộc — Caddy auto-TLS + HTTP→HTTPS _(S6, ADR-0007)_
- [x] Quyền Directus theo least privilege — Public read + gate `published`/`$NOW` + field allowlist _(S2)_
- [x] Postgres không expose; Directus chỉ qua proxy _(S6)_
- [x] **Security headers cấu hình** — Caddyfile, đã kiểm trên 200/404/502 _(S8)_; đã xác nhận bằng trình duyệt trên domain thật (2026-11-01: trang chủ + bài viết + lightbox, 0 vi phạm CSP) và nâng HSTS lên 1 năm
- [x] **Webhook rebuild siết** — header-only token, hằng-thời-gian, khoá thử sai, bind loopback _(S8)_
- [x] **Sanitize HTML body (XSS)** — allowlist lúc build, [ADR-0013](./adr/0013-sanitize-body-html.md) _(S7)_
- [x] **Dependencies quét lỗ hổng** — Dependabot + `security.yml` (2026-11-01, §6); còn 3 lỗ hổng mức thấp/vừa chưa vá
- [ ] 2FA admin — bật khi cấu hình server thật (khuyến nghị §3)
