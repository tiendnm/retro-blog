# 08 — Deployment

> 🎯 **Mục đích:** Mô tả *cách đưa code lên môi trường* — kiến trúc triển khai, phát hành nội dung, secrets, rollback. Đảm bảo phát hành lặp lại được và an toàn.
> 🔗 **Liên quan:** [Sprint 6 Plan](./sprints/sprint-6.md) · [03-architecture](./03-architecture.md) · [13-operations](./13-operations.md) · [12-security](./12-security.md) · [ADR-0005](./adr/0005-use-docker-packaging.md) · [ADR-0006](./adr/0006-render-strategy.md) · [ADR-0007](./adr/0007-reverse-proxy-and-tls.md) · [ADR-0008](./adr/0008-rebuild-on-publish.md).

> ✅ **Quyết định đã CHỐT (Sprint 6 Phase 0, Product):** reverse proxy = **Caddy** + auto-TLS ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)); rebuild = **Flow→webhook→script→atomic swap** ([ADR-0008](./adr/0008-rebuild-on-publish.md)); topology = **`retro.<domain>` + `retro-cms.<domain>`** (bản đầu ghi `cms.<domain>`; đổi tên khi dựng server nhà).

> 🏠 **Server tại nhà:** chạy sau **Cloudflare Tunnel** (không mở cổng) — [ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md) · Postgres trong compose — [ADR-0014](./adr/0014-postgres-in-compose-for-production.md) · runbook từng bước: [08a](./08a-deploy-home-tunnel.md).

---

## 1. Môi trường (Environments)

| Môi trường | Mục đích | URL | Trạng thái |
|---|---|---|---|
| dev (local) | Phát triển | `localhost` (Docker compose, `astro dev` on-demand) | 🟢 đang chạy |
| production | Người dùng thật (Public MVP) | `https://retro.tiendnm.com` (site) · `https://retro-cms.tiendnm.com` (CMS) | 🟢 đang chạy (server nhà, từ 2026-10-30) |

> **Staging:** chưa tách staging riêng (blog một người vận hành). Thay vào đó CI job `build` dựng Directus + Postgres + seed thật để kiểm trước khi merge ([§3](#3-pipeline--phát-hành)), và `update.sh` triển khai trực tiếp lên production.
> Ma trận cấu hình theo môi trường: [13-operations](./13-operations.md).

## 2. Kiến trúc triển khai *(Accepted — [ADR-0005](./adr/0005-use-docker-packaging.md)/[0007](./adr/0007-reverse-proxy-and-tls.md))*

**Self-host all-in-one** (đúng [ADR-0005](./adr/0005-use-docker-packaging.md)) trên 1 Docker host, qua `docker-compose.yml` + `docker-compose.prod.yml` (+ `docker-compose.tunnel.yml` cho server nhà); danh sách file nằm trong `COMPOSE_FILE` của `.env.production`:

```
   Internet ──► Cloudflare (TLS) ══ Tunnel ══► cloudflared ──┐   (server nhà: không mở cổng)
   (VPS: 443/80 thẳng vào Caddy, Caddy tự lấy TLS)           │
                                                     ┌───────▼────────┐
                                                     │  Caddy (edge)  │  ADR-0007
                                                     └───┬────────┬───┘
                             retro.<domain> (static)     │        │ retro-cms.<domain> (admin+API+assets)
                                                  ┌──────▼──┐  ┌──▼────────┐
                                                  │ site_dist│ │ directus  │  :8055 (không publish cổng)
                                                  │ /current │ └──┬────────┘
                                                  └─────▲───┘     │ mạng nội bộ retro-net
                            web (build + receiver) ─────┘   ┌─────▼──────┐   ops (backup, healthcheck,
                                                            │ postgres   │◄─ offsite R2) — ADR-0017
                                                            └────────────┘
```

- **Web serving:** site là **static build** (`dist/` từ `astro build`) — reverse proxy **serve file tĩnh trực tiếp**, **không** chạy Node runtime cho site (nhanh, ít bề mặt tấn công). Đúng SSG ([ADR-0006](./adr/0006-render-strategy.md)).
- **Directus:** ra ngoài **chỉ qua proxy** ở `retro-cms.<domain>` (admin UI + REST API + `/assets`). **Postgres chạy trong compose ở production** ([ADR-0014](./adr/0014-postgres-in-compose-for-production.md); bản đầu dùng instance ngoài, [ADR-0010](./adr/0010-external-postgres-instance.md), nay chỉ còn cho dev); không publish cổng, chỉ tới được qua `retro-net`.
- **Domain topology (Accepted):** **subdomain tách** — `retro.<domain>` (site) + `retro-cms.<domain>` (Directus). Lợi: `PUBLIC_SITE_URL`/`PUBLIC_DIRECTUS_URL` rõ ràng, CORS gọn, khớp canonical/OG/sitemap của [Sprint 5](./sprints/sprint-5.md).

## 3. Pipeline / Phát hành

- **Build web tái lập (Phase 1 ✅):** [`apps/web/Dockerfile`](../apps/web/Dockerfile) = **build-runner** — `pnpm install --frozen-lockfile` (pin `apps/web/pnpm-lock.yaml` + pnpm 10.33.2) lúc build image; **`astro build` chạy lúc RUNTIME** (fetch Directus nội bộ) → `dist/`. **Không bake nội dung vào image** (nội dung động; khớp [ADR-0008](./adr/0008-rebuild-on-publish.md)) → serve do Caddy ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)), không cần runtime-server stage. Loại "cài fresh không lockfile" của dev (nợ [S1-P3](./10-decisions.md)).
  - **Verify reproducibility (tiêu chí S6):** 2 lần build → `dist` **byte-identical** (aggregate sha256 khớp; 123 trang / 126 file).
- **CI tự động** (`.github/workflows/ci.yml`, chạy trên PR và push `main`): job **`quality`** (biome lint · format · typecheck · test · compose config · shellcheck · test webhook/check-site · hồi quy header Caddy · kiểm tài liệu — nhanh, **bắt buộc**) + job **`build`** (Postgres + Directus pin như compose, bootstrap bằng `schema apply` → `apply-permissions.sh` → seed minimal + showcase, rồi `astro build`, test quyền Public / luồng publish → build, đẩy `dist` làm artifact — **bắt buộc từ Sprint 13**) + job **`site-checks`** (Sprint 11; cần `dist`: `check-site`, Playwright + axe, Lighthouse; còn `continue-on-error` tới khi xanh 10 lần liên tiếp, rồi nâng lên required — [14 §4](./14-quality-gates.md)). Chi tiết test: [11-testing](./11-testing.md). Pipeline **phát hành nội dung** ở §4; **triển khai code** lên server bằng `./scripts/update.sh [--web-only]` ([08a §4](./08a-deploy-home-tunnel.md)) — chưa có CD tự động.

## 4. Phát hành nội dung — Rebuild-on-publish *(Accepted — [ADR-0008](./adr/0008-rebuild-on-publish.md))*

Giải "SSG stale" ([ADR-0006](./adr/0006-render-strategy.md)): Editor publish trong Directus → site static tự cập nhật. **Đã hiện thực (Phase 3 ✅).**

**Chuỗi:** **Directus Flow** (event `items.create/update/delete` trên `posts`/`categories`/`authors`) → **Webhook** POST (header `x-rebuild-token`) → **receiver** → **shell script** build + **atomic swap**.

| Thành phần | File | Vai trò |
|---|---|---|
| Flow (reproducible) | [`services/directus/apply-rebuild-flow.mjs`](../services/directus/apply-rebuild-flow.mjs) | Tạo Flow + operation Webhook (idempotent, như apply-permissions) |
| Receiver tối giản | [`services/rebuild/webhook.mjs`](../services/rebuild/webhook.mjs) | Kiểm token (header, hằng-thời-gian, khoá thử sai) → chạy `build-swap.sh` ngay trong container `web` ([ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md)); debounce (gộp khi đang build). Chỉ tới được trong mạng compose (`http://web:9000/rebuild`), không publish cổng. **KHÔNG microservice** — glue nhỏ, có test |
| Khởi động web | [`services/rebuild/web-entrypoint.sh`](../services/rebuild/web-entrypoint.sh) | Build lần đầu (có retry) rồi `exec` receiver; healthcheck = có `current` + receiver đang lắng nghe |
| Build + swap (in-container) | [`services/rebuild/build-swap.sh`](../services/rebuild/build-swap.sh) | `astro build` → staging `builds/<TS>` → **atomic** `ln -sfn current` → prune giữ `KEEP_BUILDS` |

- **Layout phục vụ:** volume `site_dist` chứa `builds/<TS>/` + symlink `current`; **Caddy root = `/srv/site/current`**. Swap = đổi symlink (1 thao tác) → không phục vụ bản dở; build **fail → `current` giữ bản cũ** (an toàn).
- **KHÔNG microservice riêng** trừ khi có lý do rõ ràng (queue phức tạp). **Fallback:** chạy tay `services/rebuild/rebuild.sh` (POST vào receiver) (runbook [13](./13-operations.md)).
- **Verify (Phase 3):** publish 1 bài → sau rebuild **xuất hiện** (trước rebuild vẫn stale); unpublish → **biến mất**; `builds/` giữ N (rollback); Directus Flow **fire webhook** kèm token (đã kiểm).

## 5. Secrets & cấu hình

- **Không commit secret** ([12-security](./12-security.md)). Prod dùng `.env` (gitignored) trên server từ `.env.production.example`; **secrets mạnh** (`KEY`/`SECRET`/DB password — `openssl rand -hex 32`).
- `PUBLIC_SITE_URL` = `https://retro.<domain>` · `PUBLIC_DIRECTUS_URL`/`PUBLIC_URL` = `https://retro-cms.<domain>` (đảm bảo canonical/OG/sitemap/assets đúng — khớp Sprint 5). `deploy-home.sh` sinh `.env.production` với các giá trị này.
- **2FA cho tài khoản admin Directus: không bật** (Product chốt, rủi ro chấp nhận — [12 §3](./12-security.md)). Xoay secret: runbook ở [12 §4](./12-security.md).

## 6. Rollback *(Recommended)*

- **Site (chính):** **atomic swap về static build TRƯỚC** — proxy trỏ tới bản `dist/` ổn định gần nhất (giữ N bản) → khôi phục tức thì khi deploy/rebuild lỗi. Đưa vào **Launch Checklist §8**.
- **Directus/DB/config:** khôi phục từ backup ([13 §4](./13-operations.md), §3.4 [Plan](./sprints/sprint-6.md)).
- Zero-downtime nâng cao (blue-green/canary): **ngoài MVP**.

## 7. DNS, TLS, Domain + Reverse proxy *(Accepted = Caddy — [ADR-0007](./adr/0007-reverse-proxy-and-tls.md))*

- **DNS:** `retro.<domain>` + `retro-cms.<domain>`. Server nhà: bản ghi CNAME tới tunnel do Cloudflare quản, **không mở/forward cổng** ([ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md), [08a](./08a-deploy-home-tunnel.md)). VPS: A/AAAA trỏ IP host và mở **80/443**.
- **TLS:** server nhà — Cloudflare kết thúc TLS với trình duyệt, đoạn tunnel → Caddy là HTTP trong mạng Docker nội bộ ([12 §6](./12-security.md)). VPS — **Caddy** tự cấp và gia hạn chứng chỉ (**Let's Encrypt/ACME**).
- **Reverse proxy = Caddy (đã chốt).** Ma trận đánh đổi Phase 0 (lý do chọn):

| Tiêu chí | **Caddy** ✅ | Traefik | Nginx (+Certbot) |
|---|---|---|---|
| Auto-TLS | ✅ mặc định, không cấu hình | ✅ qua resolver | ⚠️ cần Certbot + cron gia hạn |
| Độ đơn giản cấu hình | ✅ `Caddyfile` rất gọn | 🟡 label/dynamic (mạnh cho nhiều service) | 🟡 verbose nhưng quen thuộc |
| Phù hợp quy mô MVP (static + 1 upstream) | ✅ rất hợp | 🟡 hơi thừa (thiên container-orchestration) | ✅ hợp, phổ biến |
| Serve static + reverse proxy | ✅ cả hai gọn | 🟡 static kém tự nhiên hơn | ✅ mạnh cho static |
| Hệ sinh thái/vận hành | 🟡 gọn, ít phụ thuộc | ✅ rich (dashboard, metrics) | ✅ rất phổ biến |

> **Đã chốt: Caddy** — auto-TLS + cấu hình tối giản, khớp "giữ đơn giản" self-host ([ADR-0005](./adr/0005-use-docker-packaging.md)). Chi tiết quyết định: [ADR-0007](./adr/0007-reverse-proxy-and-tls.md).

## 8. Checklist phát hành (Release Checklist)

Trạng thái Sprint 6: **✅ = cơ chế đã kiểm chứng** · **@deploy = xác nhận trên server thật khi Product cấp domain/hosting**.

- [x] Build web từ **lockfile** (`--frozen-lockfile`), reproducible — ✅ 2 build byte-identical (S6-P1)
- [x] **HTTPS/TLS** + Postgres không expose + Directus chỉ qua proxy — ✅ config/`caddy validate`/routing smoke (internal TLS); **@deploy**: chứng chỉ thật (ACME) khi DNS trỏ domain
- [x] **Rebuild-on-publish** (publish → hiện sau rebuild); draft ẩn — ✅ verify end-to-end (S6-P3)
- [x] **Backup** (db+uploads+config+env) + **restore drill** đạt — ✅ posts 117=117 (S6-P4)
- [x] **Rollback = atomic swap** về static build trước — ✅ `builds/` giữ N, swap symlink (S6-P3)
- [x] Không secret trong repo/log — ✅ `.env*` gitignored; secrets prod do `deploy-home.sh` sinh ngẫu nhiên; 2FA admin: không bật (chấp nhận rủi ro, [12 §3](./12-security.md))
- [x] SEO đúng ở prod (canonical/OG/sitemap domain thật) — ✅ build `PUBLIC_SITE_URL` (S6-P2); a11y giữ (S3–S5)
- [x] **@deploy** — ✅ **đạt 2026-11-01** trên domain thật (`retro.` / `retro-cms.tiendnm.com`, Cloudflare Tunnel, server nhà):
  - Dựng bằng `deploy-home.sh` từ trạng thái sạch, nghiệm thu trên server thật (Sprint 10 P6); tunnel + DNS, `.env.production`, rebuild-on-publish + webhook, site/CMS công khai (2026-10-30).
  - **Backup ra ngoài host:** `ops` đẩy `db.dump` + `uploads.tgz` + config lên Cloudflare R2 sau mỗi backup, không kèm `env.bak` ([13 §4](./13-operations.md)).
  - **Restore drill từ R2** đạt (2026-11-01): tải bản mới nhất về, `pg_restore` vào Postgres tạm → posts/categories/files = 1/1/12 khớp DB thật; `uploads.tgz` giải nén được.
  - **CSP** kiểm bằng Chrome thật (trang chủ, bài viết, lightbox): 0 vi phạm. **HSTS 1 năm** `includeSubDomains` (không preload) đã bật cho site, CMS và trang lỗi.
  - 2FA admin **bỏ qua có chủ đích**, không UPS — rủi ro đã chấp nhận ([08a §0](./08a-deploy-home-tunnel.md)).
  - Danh mục gốc (tham chiếu): DNS trỏ host; `.env.production`; `docker compose … up -d`; Flow rebuild; theme Directus; `./scripts/deploy-home.sh`.
- [x] DoD release ([14 §2.2](./14-quality-gates.md)) — ✅ đạt, chốt 2026-11-01
