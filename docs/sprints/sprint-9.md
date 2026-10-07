# 🏠 Sprint 9 — Deploy tại nhà (Cloudflare Tunnel) & Postgres trong compose

> **Vai trò:** DevOps · **Mục tiêu:** đưa production lên máy tại nhà (J1900, 4 GB, HDD) công khai qua Cloudflare Tunnel, không mở cổng, $0. Không đổi Content Model/API/DTO/Reader.
> 🔗 [ADR-0014](../adr/0014-postgres-in-compose-for-production.md) · [ADR-0015](../adr/0015-cloudflare-tunnel-ingress.md) · [08a runbook](../08a-deploy-home-tunnel.md) · [08-deployment](../08-deployment.md)

## Bối cảnh & quyết định của Product
- Chưa có server thuê; có máy nhà J1900 (4 GB RAM, HDD), domain `tiendnm.com` ở Cloudflare, chỉ dùng tunnel.
- Site `retro.tiendnm.com`; CMS **tách** `retro-cms.tiendnm.com` (cho an toàn — không dùng subpath `/cms`).
- Chấp nhận (2026-10-07): không UPS, chưa backup ra ngoài máy.

## Phạm vi
- [x] Postgres vào `docker-compose.prod.yml` (volume, healthcheck, tinh chỉnh máy nhỏ) — ADR-0014.
- [x] `docker-compose.tunnel.yml` (cloudflared pin `2026.10.0`; Caddy không publish cổng) + Caddy `SITE_ADDRESS`/`CMS_ADDRESS`, `trusted_proxies` — ADR-0015.
- [x] Cookie Directus `Secure`; trần heap Node cho `astro build` (máy 4 GB).
- [x] Backup/restore chạy qua container Postgres (`PG_VIA_COMPOSE=1`); unit systemd cập nhật.
- [x] Runbook từng bước cho J1900 (`08a`); CI kiểm `docker compose config` (prod + tunnel).

**Ngoài phạm vi / Backlog:** backup ra ngoài máy (rclone → R2/B2) · UPS · SSD · ping giám sát ngoài máy · rate limiting · HSTS 1 năm · container không chạy root.

## Kết quả (2026-10-07) — dry-run cục bộ (project `retro-sim`, cổng riêng, đã dọn)
| Hạng mục | Kiểm chứng |
|---|---|
| Compose | `config` hợp lệ cho prod và prod+tunnel; chế độ tunnel không publish 80/443, prod thường vẫn publish |
| Stack | Postgres (healthy) → Directus → `schema apply` → permissions → seed → job build (7 trang, atomic swap) → Caddy |
| Caddy HTTP (như sau tunnel) | site: 200/404 đều đủ 5 header + CSP, không `Server`; CMS: `/server/health` + `/admin` OK; định tuyến theo Host đúng |
| Cookie | login Directus qua Caddy với `X-Forwarded-Proto: https` → `Set-Cookie: …; HttpOnly; Secure; SameSite=Lax` |
| Backup | `PG_VIA_COMPOSE=1`: dump hợp lệ; restore vào DB trống: posts 4=4 |

**Chưa kiểm chứng (cần máy thật + tài khoản Cloudflare):** kết nối `cloudflared` ↔ Cloudflare và hostname → `caddy:80`; chạy trên J1900 (HDD, 4 GB — thời gian build, RAM); `REBUILD_HOST=172.17.0.1` + ufw; systemd thật; CSP bằng trình duyệt trên domain thật.
**Lưu ý:** host lạ (không khớp site nào) trả `200` rỗng ở chế độ HTTP — vô hại vì chỉ hostname đã cấu hình mới vào được qua tunnel.
