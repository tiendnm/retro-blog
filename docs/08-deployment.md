# 08 — Deployment

> **Trạng thái:** 🟡 **Candidate — Sprint 6 Phase 0** (chờ Product xác nhận hosting/domain + chốt reverse proxy/rebuild) · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-23 · **Người duyệt:** _(chờ Product)_
>
> 🎯 **Mục đích:** Mô tả *cách đưa code lên môi trường* — kiến trúc triển khai, phát hành nội dung, secrets, rollback. Đảm bảo phát hành lặp lại được và an toàn.
> 🔗 **Liên quan:** [Sprint 6 Plan](./sprints/sprint-6-implementation-plan.md) · [03-architecture](./03-architecture.md) · [13-operations](./13-operations.md) · [12-security](./12-security.md) · [ADR-0005](./adr/0005-use-docker-packaging.md) · [ADR-0006](./adr/0006-render-strategy.md).

> ⚠️ **Trạng thái quyết định (Phase 0):** các mục dưới ở dạng **_Recommended_ / _Candidate_** — **chưa chốt**. Chốt (và ghi **ADR-0007** reverse proxy/TLS, **ADR-0008** rebuild-on-publish) **sau khi Product xác nhận** ở review Phase 0. Cần Product cung cấp: **hosting target** (máy chủ/VPS) + **domain** + DNS.

---

## 1. Môi trường (Environments)

| Môi trường | Mục đích | URL | Trạng thái |
|---|---|---|---|
| dev (local) | Phát triển | `localhost` (Docker compose, `astro dev` on-demand) | 🟢 đang chạy |
| production | Người dùng thật (Public MVP) | `blog.<domain>` (recommended) | 🟡 Sprint 6 — chờ domain |

> **Staging:** MVP self-host tối giản **chưa tách staging riêng** — Phase 2 verify trên domain thật (hoặc domain tạm) trước khi công bố. Staging đầy đủ = sau MVP nếu cần.
> Ma trận cấu hình theo môi trường: [13-operations](./13-operations.md).

## 2. Kiến trúc triển khai *(Recommended — chưa chốt)*

**Self-host all-in-one** (đúng [ADR-0005](./adr/0005-use-docker-packaging.md)) trên 1 Docker host, qua `docker-compose.prod.yml` (override, **không** đụng `docker-compose.yml` dev):

```
                 Internet (443/80)
                        │
                ┌───────▼────────┐   auto-TLS (ACME)
                │ reverse proxy  │   (Candidate: Caddy/Traefik/Nginx)
                └───┬────────┬───┘
       blog.<domain>│        │cms.<domain>
        (static)    │        │ (admin+API+assets)
             ┌──────▼──┐  ┌──▼────────┐
             │ static  │  │ directus  │  :8055 (không expose trực tiếp)
             │  dist/  │  └──┬────────┘
             └─────────┘     │ network nội bộ
                        ┌─────▼──────┐
                        │ postgres   │  (KHÔNG expose ra host)
                        └────────────┘
```

- **Web serving:** site là **static build** (`dist/` từ `astro build`) — reverse proxy **serve file tĩnh trực tiếp**, **không** chạy Node runtime cho site (nhanh, ít bề mặt tấn công). Đúng SSG ([ADR-0006](./adr/0006-render-strategy.md)).
- **Directus:** ra ngoài **chỉ qua proxy** ở `cms.<domain>` (admin UI + REST API + `/assets`). **Postgres không expose** (giữ như dev).
- **Domain topology (Recommended):** **subdomain tách** — `blog.<domain>` (site) + `cms.<domain>` (Directus). Lợi: `PUBLIC_SITE_URL`/`PUBLIC_DIRECTUS_URL` rõ ràng, CORS gọn, khớp canonical/OG/sitemap của [Sprint 5](./sprints/sprint-5-completion-report.md). *(Chốt sau khi Product xác nhận domain.)*

## 3. Pipeline / Phát hành

- **Build tái lập:** `apps/web/Dockerfile` **multi-stage** — `pnpm install --frozen-lockfile` (pin `apps/web/pnpm-lock.yaml` + pnpm 10.33.2) → `astro build` → `dist/`. Loại "cài fresh không lockfile" của dev (nợ [S1-P3](./10-decisions.md)).
- **CI test tự động (lint/unit/e2e):** **KHÔNG** trong Sprint 6 — để **Sprint 7** (light CI dùng fixtures). Sprint 6 chỉ pipeline **phát hành nội dung** (§4).

## 4. Phát hành nội dung — Rebuild-on-publish *(Recommended — chưa chốt, → ADR-0008)*

Giải "SSG stale" ([ADR-0006](./adr/0006-render-strategy.md)): Editor publish trong Directus → site static tự cập nhật.

- **Cơ chế (ưu tiên tối giản):** **Directus Flow** (trigger `items.create/update/delete` trên `posts` + `categories`/`authors`) → **webhook** (token bảo vệ) → **shell script / internal utility** on-server: `astro build` (fetch `directus:8055` nội bộ) → **atomic swap** thư mục static proxy serve.
- **KHÔNG tạo microservice riêng** trừ khi có **lý do rõ ràng** (queue/điều phối phức tạp) — mặc định script/utility.
- **Debounce** tránh build dồn khi publish liên tiếp; **giữ N build gần nhất** (cho rollback §6). Build **fail → giữ bản đang phục vụ** (atomic → không phục vụ dở).
- **Fallback:** rebuild thủ công (runbook [13](./13-operations.md)).

## 5. Secrets & cấu hình

- **Không commit secret** ([12-security](./12-security.md)). Prod dùng `.env` (gitignored) trên server từ `.env.production.example`; **secrets mạnh** (`KEY`/`SECRET`/DB password — `openssl rand -hex 32`).
- `PUBLIC_SITE_URL` = `https://blog.<domain>` · `PUBLIC_DIRECTUS_URL`/`PUBLIC_URL` = `https://cms.<domain>` (đảm bảo canonical/OG/sitemap/assets đúng — khớp Sprint 5).
- **2FA cho tài khoản admin Directus** — khuyến nghị bật trước công bố ([12 §3](./12-security.md)).

## 6. Rollback *(Recommended)*

- **Site (chính):** **atomic swap về static build TRƯỚC** — proxy trỏ tới bản `dist/` ổn định gần nhất (giữ N bản) → khôi phục tức thì khi deploy/rebuild lỗi. Đưa vào **Launch Checklist §8**.
- **Directus/DB/config:** khôi phục từ backup ([13 §4](./13-operations.md), §3.4 [Plan](./sprints/sprint-6-implementation-plan.md)).
- Zero-downtime nâng cao (blue-green/canary): **ngoài MVP**.

## 7. DNS, TLS, Domain + Reverse proxy *(Candidate — chưa chốt, → ADR-0007)*

- **DNS:** `blog.<domain>` + `cms.<domain>` → A/AAAA trỏ IP host; mở **80/443** cho ACME + phục vụ.
- **TLS:** chứng chỉ tự động (Let's Encrypt/ACME) do reverse proxy cấp + gia hạn.
- **Reverse proxy — CANDIDATE (đánh giá Phase 0, Product chốt):**

| Tiêu chí | **Caddy** | **Traefik** | **Nginx** (+Certbot) |
|---|---|---|---|
| Auto-TLS | ✅ mặc định, không cấu hình | ✅ qua resolver | ⚠️ cần Certbot + cron gia hạn |
| Độ đơn giản cấu hình | ✅ `Caddyfile` rất gọn | 🟡 label/dynamic (mạnh cho nhiều service) | 🟡 verbose nhưng quen thuộc |
| Phù hợp quy mô MVP (static + 1 upstream) | ✅ rất hợp | 🟡 hơi thừa (thiên container-orchestration) | ✅ hợp, phổ biến |
| Serve static + reverse proxy | ✅ cả hai gọn | 🟡 static kém tự nhiên hơn | ✅ mạnh cho static |
| Hệ sinh thái/vận hành | 🟡 gọn, ít phụ thuộc | ✅ rich (dashboard, metrics) | ✅ rất phổ biến |

> **Nghiêng (chưa chốt):** **Caddy** cho MVP self-host (auto-TLS + cấu hình tối giản, khớp "giữ đơn giản" [ADR-0005]). **Nginx** nếu team ưu tiên công cụ phổ biến/kiểm soát chi tiết; **Traefik** nếu dự kiến nhiều service/động. **Product chốt ở review Phase 0 → ghi ADR-0007.**

## 8. Checklist phát hành (Release Checklist) — *hoàn thiện ở Phase 4*

- [ ] Build web từ **lockfile** (`--frozen-lockfile`), reproducible
- [ ] **HTTPS/TLS** hợp lệ; Postgres không expose; Directus chỉ qua proxy
- [ ] **Rebuild-on-publish** hoạt động (publish → hiện sau rebuild); draft ẩn
- [ ] **Backup** (db + uploads + config + env) chạy + **restore drill** đạt
- [ ] **Rollback = atomic swap** về static build trước — đã thử
- [ ] Không secret trong repo/log; secrets prod mạnh; 2FA admin
- [ ] SEO/a11y đúng ở prod (canonical/OG/sitemap domain thật) ([15](./15-seo-accessibility.md))
- [ ] DoD release đạt ([14 §2.2](./14-quality-gates.md))
