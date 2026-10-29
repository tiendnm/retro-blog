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

## Kết quả trên máy thật (2026-10-30) — J1900, 4 GB, HDD, Ubuntu 22.04
| Hạng mục | Kết quả |
|---|---|
| Stack production | Postgres → Directus → job build → Caddy → `cloudflared` chạy; site `retro.tiendnm.com` và CMS `retro-cms.tiendnm.com` truy cập được qua tunnel |
| Thời gian | build image `retro-web` lần đầu ~136 s; job `astro build` + swap ~21 s (khi chưa có nội dung) |
| Rebuild-on-publish | ✅ publish bài → rebuild thành công, bài hiện trên site |
| Tunnel | dùng **tunnel mới** riêng cho project (không dùng chung connector với tunnel có sẵn trên máy) |

**Lỗi gặp khi triển khai thật (đã sửa, ghi vào runbook 08a):**
1. `cloudflared` restart liên tục — `Couldn't resolve SRV record … server misbehaving`: DNS router nhà không xử lý SRV → đặt `dns: 1.1.1.1, 1.0.0.1` cho `cloudflared` (`f30d1e2`).
2. Flow báo `ECONNREFUSED 172.17.0.1:9000`: `REBUILD_HOST` còn mặc định `127.0.0.1` từ file mẫu → phải là IP `docker0` trên Linux.
3. Flow báo `404`: `REBUILD_TOKEN` trong file mẫu có chú thích cuối dòng; systemd `EnvironmentFile` giữ nguyên chú thích làm giá trị (token 123 ký tự thay vì 64) → bỏ chú thích cuối dòng ở file mẫu.
4. `apply-permissions.sh` cần Node 22 trên host (`node: command not found`) → thêm bước cài Node vào §1.

**Quyết định (2026-10-30):** không bật 2FA admin (rủi ro chấp nhận, ghi ở 08a §0).
**Chưa xác nhận:** backup/healthcheck timers trên máy thật, restore drill, backup ra ngoài máy, HSTS 1 năm.
