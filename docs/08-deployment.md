# 08 — Deployment

> **Trạng thái:** 🟡 **Đang triển khai — Sprint 6** (quyết định kiến trúc đã CHỐT; chờ **domain thật** + hiện thực compose prod/proxy/rebuild/backup) · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-23 · **Người duyệt:** Product
>
> 🎯 **Mục đích:** Mô tả *cách đưa code lên môi trường* — kiến trúc triển khai, phát hành nội dung, secrets, rollback. Đảm bảo phát hành lặp lại được và an toàn.
> 🔗 **Liên quan:** [Sprint 6 Plan](./sprints/sprint-6-implementation-plan.md) · [03-architecture](./03-architecture.md) · [13-operations](./13-operations.md) · [12-security](./12-security.md) · [ADR-0005](./adr/0005-use-docker-packaging.md) · [ADR-0006](./adr/0006-render-strategy.md) · [ADR-0007](./adr/0007-reverse-proxy-and-tls.md) · [ADR-0008](./adr/0008-rebuild-on-publish.md).

> ✅ **Quyết định đã CHỐT (Sprint 6 Phase 0, Product):** reverse proxy = **Caddy** + auto-TLS ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)); rebuild = **Flow→webhook→script→atomic swap** ([ADR-0008](./adr/0008-rebuild-on-publish.md)); topology = **`retro.<domain>` + `cms.<domain>`**. **`<domain>` thật** do Product cung cấp ở **Phase 2**.

---

## 1. Môi trường (Environments)

| Môi trường | Mục đích | URL | Trạng thái |
|---|---|---|---|
| dev (local) | Phát triển | `localhost` (Docker compose, `astro dev` on-demand) | 🟢 đang chạy |
| production | Người dùng thật (Public MVP) | `retro.<domain>` (recommended) | 🟡 Sprint 6 — chờ domain |

> **Staging:** MVP self-host tối giản **chưa tách staging riêng** — Phase 2 verify trên domain thật (hoặc domain tạm) trước khi công bố. Staging đầy đủ = sau MVP nếu cần.
> Ma trận cấu hình theo môi trường: [13-operations](./13-operations.md).

## 2. Kiến trúc triển khai *(Accepted — [ADR-0005](./adr/0005-use-docker-packaging.md)/[0007](./adr/0007-reverse-proxy-and-tls.md))*

**Self-host all-in-one** (đúng [ADR-0005](./adr/0005-use-docker-packaging.md)) trên 1 Docker host, qua `docker-compose.prod.yml` (override, **không** đụng `docker-compose.yml` dev):

```
                 Internet (443/80)
                        │
                ┌───────▼────────┐   auto-TLS (ACME)
                │  Caddy (edge)  │   (ADR-0007)
                └───┬────────┬───┘
       retro.<domain>│        │cms.<domain>
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
- **Domain topology (Accepted):** **subdomain tách** — `retro.<domain>` (site) + `cms.<domain>` (Directus). Lợi: `PUBLIC_SITE_URL`/`PUBLIC_DIRECTUS_URL` rõ ràng, CORS gọn, khớp canonical/OG/sitemap của [Sprint 5](./sprints/sprint-5-completion-report.md). *(`<domain>` thật do Product cung cấp ở Phase 2.)*

## 3. Pipeline / Phát hành

- **Build web tái lập (Phase 1 ✅):** [`apps/web/Dockerfile`](../apps/web/Dockerfile) = **build-runner** — `pnpm install --frozen-lockfile` (pin `apps/web/pnpm-lock.yaml` + pnpm 10.33.2) lúc build image; **`astro build` chạy lúc RUNTIME** (fetch Directus nội bộ) → `dist/`. **Không bake nội dung vào image** (nội dung động; khớp [ADR-0008](./adr/0008-rebuild-on-publish.md)) → serve do Caddy ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)), không cần runtime-server stage. Loại "cài fresh không lockfile" của dev (nợ [S1-P3](./10-decisions.md)).
  - **Verify reproducibility (tiêu chí S6):** 2 lần build → `dist` **byte-identical** (aggregate sha256 khớp; 123 trang / 126 file).
- **CI test tự động (lint/unit/e2e):** **KHÔNG** trong Sprint 6 — để **Sprint 7** (light CI dùng fixtures). Sprint 6 chỉ pipeline **phát hành nội dung** (§4).

## 4. Phát hành nội dung — Rebuild-on-publish *(Accepted — [ADR-0008](./adr/0008-rebuild-on-publish.md))*

Giải "SSG stale" ([ADR-0006](./adr/0006-render-strategy.md)): Editor publish trong Directus → site static tự cập nhật. **Đã hiện thực (Phase 3 ✅).**

**Chuỗi:** **Directus Flow** (event `items.create/update/delete` trên `posts`/`categories`/`authors`) → **Webhook** POST (header `x-rebuild-token`) → **receiver** → **shell script** build + **atomic swap**.

| Thành phần | File | Vai trò |
|---|---|---|
| Flow (reproducible) | [`services/directus/apply-rebuild-flow.mjs`](../services/directus/apply-rebuild-flow.mjs) | Tạo Flow + operation Webhook (idempotent, như apply-permissions) |
| Receiver tối giản | [`services/rebuild/webhook.mjs`](../services/rebuild/webhook.mjs) | Kiểm token → gọi `rebuild.sh`; debounce (gộp khi đang build). **KHÔNG microservice** — ~50 dòng glue |
| Orchestrator (host) | [`services/rebuild/rebuild.sh`](../services/rebuild/rebuild.sh) | `docker compose run web` (build-runner); serialize bằng `flock` |
| Build + swap (in-container) | [`services/rebuild/build-swap.sh`](../services/rebuild/build-swap.sh) | `astro build` → staging `builds/<TS>` → **atomic** `ln -sfn current` → prune giữ `KEEP_BUILDS` |

- **Layout phục vụ:** volume `site_dist` chứa `builds/<TS>/` + symlink `current`; **Caddy root = `/srv/site/current`**. Swap = đổi symlink (1 thao tác) → không phục vụ bản dở; build **fail → `current` giữ bản cũ** (an toàn).
- **KHÔNG microservice riêng** trừ khi có lý do rõ ràng (queue phức tạp). **Fallback:** chạy tay `services/rebuild/rebuild.sh` (runbook [13](./13-operations.md)).
- **Verify (Phase 3):** publish 1 bài → sau rebuild **xuất hiện** (trước rebuild vẫn stale); unpublish → **biến mất**; `builds/` giữ N (rollback); Directus Flow **fire webhook** kèm token (đã kiểm).

## 5. Secrets & cấu hình

- **Không commit secret** ([12-security](./12-security.md)). Prod dùng `.env` (gitignored) trên server từ `.env.production.example`; **secrets mạnh** (`KEY`/`SECRET`/DB password — `openssl rand -hex 32`).
- `PUBLIC_SITE_URL` = `https://retro.<domain>` · `PUBLIC_DIRECTUS_URL`/`PUBLIC_URL` = `https://cms.<domain>` (đảm bảo canonical/OG/sitemap/assets đúng — khớp Sprint 5).
- **2FA cho tài khoản admin Directus** — khuyến nghị bật trước công bố ([12 §3](./12-security.md)).

## 6. Rollback *(Recommended)*

- **Site (chính):** **atomic swap về static build TRƯỚC** — proxy trỏ tới bản `dist/` ổn định gần nhất (giữ N bản) → khôi phục tức thì khi deploy/rebuild lỗi. Đưa vào **Launch Checklist §8**.
- **Directus/DB/config:** khôi phục từ backup ([13 §4](./13-operations.md), §3.4 [Plan](./sprints/sprint-6-implementation-plan.md)).
- Zero-downtime nâng cao (blue-green/canary): **ngoài MVP**.

## 7. DNS, TLS, Domain + Reverse proxy *(Accepted = Caddy — [ADR-0007](./adr/0007-reverse-proxy-and-tls.md))*

- **DNS:** `retro.<domain>` + `cms.<domain>` → A/AAAA trỏ IP host; mở **80/443** cho ACME + phục vụ.
- **TLS:** chứng chỉ tự động (**Let's Encrypt/ACME**) do **Caddy** cấp + gia hạn.
- **Reverse proxy = Caddy (đã chốt).** Ma trận đánh đổi Phase 0 (lý do chọn):

| Tiêu chí | **Caddy** ✅ | Traefik | Nginx (+Certbot) |
|---|---|---|---|
| Auto-TLS | ✅ mặc định, không cấu hình | ✅ qua resolver | ⚠️ cần Certbot + cron gia hạn |
| Độ đơn giản cấu hình | ✅ `Caddyfile` rất gọn | 🟡 label/dynamic (mạnh cho nhiều service) | 🟡 verbose nhưng quen thuộc |
| Phù hợp quy mô MVP (static + 1 upstream) | ✅ rất hợp | 🟡 hơi thừa (thiên container-orchestration) | ✅ hợp, phổ biến |
| Serve static + reverse proxy | ✅ cả hai gọn | 🟡 static kém tự nhiên hơn | ✅ mạnh cho static |
| Hệ sinh thái/vận hành | 🟡 gọn, ít phụ thuộc | ✅ rich (dashboard, metrics) | ✅ rất phổ biến |

> **Đã chốt: Caddy** — auto-TLS + cấu hình tối giản, khớp "giữ đơn giản" self-host ([ADR-0005](./adr/0005-use-docker-packaging.md)). Chi tiết quyết định: [ADR-0007](./adr/0007-reverse-proxy-and-tls.md).

## 8. Checklist phát hành (Release Checklist) — *hoàn thiện ở Phase 4*

- [ ] Build web từ **lockfile** (`--frozen-lockfile`), reproducible
- [ ] **HTTPS/TLS** hợp lệ; Postgres không expose; Directus chỉ qua proxy
- [ ] **Rebuild-on-publish** hoạt động (publish → hiện sau rebuild); draft ẩn
- [ ] **Backup** (db + uploads + config + env) chạy + **restore drill** đạt
- [ ] **Rollback = atomic swap** về static build trước — đã thử
- [ ] Không secret trong repo/log; secrets prod mạnh; 2FA admin
- [ ] SEO/a11y đúng ở prod (canonical/OG/sitemap domain thật) ([15](./15-seo-accessibility.md))
- [ ] DoD release đạt ([14 §2.2](./14-quality-gates.md))
