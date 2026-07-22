# ADR-0007 — Reverse proxy & TLS: Caddy (auto-HTTPS)

> **Status:** Accepted <!-- ratified 2026-07-23 (Sprint 6 Phase 0, Product chốt) -->
> **Ngày đề xuất:** 2026-07-23 · **Ngày Accepted:** 2026-07-23
> **Người quyết định:** Product
> **Người liên quan / tham vấn:** Team dự án (đề xuất & ma trận đánh đổi ở [08-deployment §7](../08-deployment.md))
> **Nguyên tắc tuân thủ (Principles):** P4 (Self-host first), P5 (Cloud-ready); Bảo mật (TLS bắt buộc — [12 §11](../12-security.md)); nhất quán [ADR-0005](./0005-use-docker-packaging.md) (Docker) & [ADR-0006](./0006-render-strategy.md) (SSG static).

---

## Bối cảnh (Context)

Sprint 6 đưa site **public qua HTTPS** ([Plan](../sprints/sprint-6-implementation-plan.md)). Kiến trúc self-host ([ADR-0005](./0005-use-docker-packaging.md)); site là **static** ([ADR-0006](./0006-render-strategy.md)) cần phục vụ file tĩnh nhanh, đồng thời Directus cần ra ngoài (admin UI + REST API + `/assets`). Cần một **edge**: chấm dứt TLS (chứng chỉ tự động, gia hạn), định tuyến theo host, phục vụ static, và **không** expose Postgres. Ràng buộc: **giữ đơn giản** cho self-host MVP, ít bề mặt vận hành.

## Quyết định (Decision)

Chúng ta chọn **Caddy** làm **reverse proxy + edge TLS** (adapter cho "edge/ingress" trong topo triển khai — [08 §2](../08-deployment.md)):
- **TLS tự động** qua **Let's Encrypt (ACME)** — cấp & gia hạn không cần thao tác.
- **`retro.<domain>`** → Caddy **phục vụ static `dist/` trực tiếp** (file server; không Node runtime cho site).
- **`cms.<domain>`** → `reverse_proxy directus:8055` (admin + API + assets).
- **Postgres không expose**; chỉ Caddy lắng nghe 80/443 công khai.
- Cấu hình khai báo trong **`Caddyfile`**, chạy như service trong `docker-compose.prod.yml` (override; không đụng compose dev).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4 Self-host | ✅ | 1 container edge, chạy ở đâu có Docker |
| P5 Cloud-ready | ✅ | Không khoá provider; đổi host dễ |
| Bảo mật (TLS) | ✅ | HTTPS bắt buộc, auto-renew; Postgres ẩn |
| Đơn giản vận hành | ✅ | `Caddyfile` gọn, auto-TLS mặc định |
| Nhất quán ADR-0005/0006 | ✅ | Docker; phục vụ static |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| **Caddy** (đã chọn) | Auto-TLS mặc định, `Caddyfile` tối giản, static + proxy gọn | Hệ sinh thái nhỏ hơn Nginx | — |
| Traefik | Rich (dashboard/metrics), mạnh cho nhiều service động | Thừa cho MVP (1 upstream); static kém tự nhiên | Phức tạp quá nhu cầu |
| Nginx (+Certbot) | Rất phổ biến, mạnh phục vụ static | Auto-TLS cần Certbot + cron gia hạn; cấu hình verbose | Vận hành TLS thủ công hơn |

> Ma trận chi tiết: [08-deployment §7](../08-deployment.md).

## Hệ quả & Trade-off (Consequences)

**Tích cực:** HTTPS tự động (ít lỗi vận hành TLS); edge duy nhất định tuyến `retro.`/`cms.`; static nhanh; Postgres không lộ.
**Tiêu cực / Đánh đổi:** phụ thuộc Caddy cho cả TLS lẫn phục vụ static (một điểm cần theo dõi); hệ sinh thái/tài liệu nhỏ hơn Nginx.
**Cần theo dõi:** rate-limit ACME khi cấu hình DNS sai; cần mở 80/443 + DNS trỏ đúng trước khi cấp chứng chỉ.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** `Caddyfile` → cấu hình proxy tương đương (Nginx/Traefik) + `docker-compose.prod.yml` (service edge). Cơ chế TLS thay tương ứng.
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md)/[03c](../03c-content-model.md)/[03d](../03d-api-contract.md)/[03e](../03e-data-model.md); Reader; thin client (chỉ phụ thuộc `PUBLIC_*` URL — không đổi hợp đồng).
- **Dữ liệu cần di trú:** không.
- **Mức chi phí ước tính:** **Thấp** — edge là tầng RÌA; đổi proxy không chạm domain/contract.

## Liên kết (Links)

- [08-deployment](../08-deployment.md) · [ADR-0005](./0005-use-docker-packaging.md) · [ADR-0006](./0006-render-strategy.md) · [ADR-0008](./0008-rebuild-on-publish.md) (rebuild) · [12-security](../12-security.md) · [Sprint 6 Plan](../sprints/sprint-6-implementation-plan.md)
