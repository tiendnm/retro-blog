# Retro Blog

> Một blog headless mang phong cách retro — **Astro** (site) + **Directus** (headless CMS) + **PostgreSQL**, đóng gói bằng **Docker**.

> **Trạng thái:** 🟢 Đang chạy production trên server tại nhà qua Cloudflare Tunnel; CI (`quality` + `build`) bắt buộc trên `main`. Sprint 0–13 xong, Sprint 14 (nợ tài liệu) chờ review. Chi tiết: [docs/sprints](./docs/sprints/) · [roadmap](./docs/02-roadmap.md).

---

## Giới thiệu

Retro Blog là nền tảng blog **headless, content-driven**: nội dung quản trị trong Directus, hiển thị bởi Astro, dữ liệu lưu ở PostgreSQL. Toàn bộ tri thức kiến trúc/nội dung nằm ở tầng LÕI (tech-neutral) trong [`docs/`](./docs/); công nghệ cụ thể là chi tiết thay thế được (xem [ADR](./docs/adr/)).

> Tầm nhìn & phạm vi chi tiết: [docs/00-project.md](./docs/00-project.md) · [docs/01a-mvp-scope.md](./docs/01a-mvp-scope.md).

## Tech stack

| Vai trò | Công nghệ | Phiên bản | ADR |
|---|---|---|---|
| Presentation / Site | Astro | 7.x | [ADR-0002](./docs/adr/0002-use-astro-site-generator.md) |
| Headless CMS | Directus | `11.17.4` | [ADR-0003](./docs/adr/0003-use-directus-headless-cms.md) |
| Content Store | PostgreSQL | `16.15` (production: trong compose; dev: instance host :5433) | [ADR-0004](./docs/adr/0004-use-postgresql-content-store.md), [ADR-0010](./docs/adr/0010-external-postgres-instance.md), [ADR-0014](./docs/adr/0014-postgres-in-compose-for-production.md) |
| Đóng gói & runtime | Docker + Compose v2 | 29.x | [ADR-0005](./docs/adr/0005-use-docker-packaging.md) |
| Edge / ingress | Caddy `2.10` + Cloudflare Tunnel | — | [ADR-0007](./docs/adr/0007-reverse-proxy-and-tls.md), [ADR-0015](./docs/adr/0015-cloudflare-tunnel-ingress.md) |
| Chất lượng | Biome · Vitest · Playwright + axe · Lighthouse CI | — | [ADR-0009](./docs/adr/0009-quality-tooling-biome-vitest.md) |

> Sổ đăng ký công nghệ: [docs/10a-tech-stack.md](./docs/10a-tech-stack.md).

---

## 🚀 Getting Started

### Yêu cầu môi trường

- **Bắt buộc (để chạy stack):** Docker Engine + Docker Compose v2 (đã kiểm với Docker 29 / Compose v2). Stack chạy **hoàn toàn trong Docker** — *không* cần Node trên host để chạy.
- **Tuỳ chọn (dev tooling trên host):** Node ≥ 22.23.4 (`.nvmrc` = 26, khớp container và CI) + pnpm 10 (để dùng các script `pnpm ...`, chạy test và IDE).

### Các bước

1. **Clone**
   ```bash
   git clone <repo-url> retro-blog
   cd retro-blog
   ```

2. **Tạo `.env` từ mẫu**
   ```bash
   cp .env.example .env
   ```
   Mở `.env`: đổi các giá trị `change_me_*` và sinh `KEY` / `SECRET` ngẫu nhiên, ví dụ:
   ```bash
   openssl rand -hex 32     # dùng cho KEY và SECRET
   ```
   > ⚠️ `.env` chứa secret và **đã được gitignore** — không bao giờ commit. Với dev local có thể tạm dùng placeholder (KHÔNG dùng cho production).

3. **Khởi động**
   ```bash
   docker compose up -d      # hoặc: pnpm start
   ```
   > Lần đầu mất vài phút (pull image + container web cài Astro). Chờ tới khi trạng thái là `healthy`.

4. **Tạo content model + phân quyền + seed dev (lần đầu / fresh clone)**
   ```bash
   pnpm schema:apply         # áp dụng schema snapshot (collections/fields/relations)
   pnpm permissions:apply    # cấu hình Roles/Policies/Permissions (Public/Editor)
   pnpm seed:dev             # (tuỳ chọn) dữ liệu mẫu dev: 1 author, 2 category, 3 bài + 1 draft
   pnpm seed:showcase        # (tuỳ chọn, sau seed:dev) +17 bài có ảnh, 4 chuyên mục, 2 tác giả, avatar — xem blog "đủ ảnh"
   ```
   > Chỉ cần khi Directus còn trống (volume mới). Cả ba **idempotent** — chạy lại an toàn.
   > Artifacts: `services/directus/snapshots/schema.yaml` · `services/directus/apply-permissions.sh` · `services/directus/seed/seed-dev.mjs`.
   > `permissions:apply` / `seed:dev` cần `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` (dùng Admin API; `seed:dev` cần Node 18+ trên host).

   **Fixture dogfooding (tuỳ chọn, DEV-only)** — dataset lớn để kiểm thử ở quy mô:
   ```bash
   pnpm fixtures:load  -- --profile large   # ~100 bài (normal); có small/medium/large/stress
   pnpm fixtures:load  -- --set edge        # bộ ca biên (10) · --set stress (3)
   pnpm fixtures:reset -- --set edge        # xoá riêng theo slug (không đụng content khác)
   ```
   > Framework: `services/directus/fixtures/` ([DESIGN.md](./services/directus/fixtures/DESIGN.md)). Deterministic (`--seed`), reset theo slug, **guard chỉ chạy với Directus localhost**.

5. **Truy cập**

   | Dịch vụ | URL | Ghi chú |
   |---|---|---|
   | Astro (site) | http://localhost:4321 | trang blog: danh sách / chi tiết / category (Sprint 2) |
   | Directus admin | http://localhost:8055/admin | đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env` |

### Vận hành thường ngày

| Việc | pnpm | docker compose |
|---|---|---|
| Khởi động | `pnpm start` | `docker compose up -d` |
| Dừng (giữ container & dữ liệu) | `pnpm stop` | `docker compose stop` |
| Khởi động lại | `pnpm restart` | `docker compose restart` |
| Xem logs | `pnpm logs` | `docker compose logs -f` |
| Trạng thái | `pnpm status` | `docker compose ps` |
| Gỡ container (giữ dữ liệu) | `pnpm down` | `docker compose down` |

> **Dữ liệu bền:** named volumes `pgdata`, `directus_uploads` tồn tại qua `stop`/`down` (chỉ mất khi `docker compose down -v`).

### Kiểm tra chất lượng (giống CI job `quality`)

```bash
cd apps/web && pnpm install --frozen-lockfile --ignore-workspace
pnpm exec biome lint . && pnpm format:check && pnpm typecheck && pnpm test   # lint → format → typecheck → Vitest
cd ../.. && pnpm docs:check      # link/neo tài liệu còn đúng, không còn ô placeholder (scripts/check-docs.mjs)
```

> E2E (Playwright + axe), Lighthouse và kiểm site chạy ở job `site-checks` trên `dist/` đã build — xem [11-testing](./docs/11-testing.md). Quy ước merge: [14 §4](./docs/14-quality-gates.md).

### Triển khai production (Sprint 6/9 — [08-deployment](./docs/08-deployment.md))

Hai cách: **(a) Server tại nhà + Cloudflare Tunnel** (không mở cổng, $0 — runbook [08a](./docs/08a-deploy-home-tunnel.md)) hoặc **(b) VPS có IP công khai + Caddy auto-TLS**. Cả hai: **rebuild-on-publish** (receiver trong container `web`, [ADR-0016](./docs/adr/0016-rebuild-receiver-in-web-container.md)) + **backup/healthcheck tự động** (service `ops`, [ADR-0017](./docs/adr/0017-ops-services-in-compose.md)). Postgres chạy trong compose ([ADR-0014](./docs/adr/0014-postgres-in-compose-for-production.md)). Tóm tắt:

```bash
# (a) Server tại nhà + Cloudflare Tunnel: tạo Tunnel trên dashboard, rồi trên server (user triển khai; Docker + Compose ≥ 2.24 có sẵn):
git clone https://github.com/tiendnm/retro-blog.git ~/retro-blog && cd ~/retro-blog
./scripts/deploy-home.sh        # hỏi domain, TUNNEL_TOKEN, email admin; sinh secret; dựng cả stack; in mật khẩu admin một lần
./scripts/update.sh             # cập nhật code sau này (thêm --web-only nếu chỉ đổi web: bỏ qua bước CMS)

# Lệnh compose hằng ngày không cần -f (COMPOSE_FILE nằm trong .env.production):
docker compose --env-file .env.production ps
```

> Cách (b) (VPS): tự `cp .env.production.example .env.production`, điền secret, bỏ `docker-compose.tunnel.yml` khỏi `COMPOSE_FILE`. Cách (b) cần DNS `retro.<domain>` + `retro-cms.<domain>` trỏ host, mở 80/443; cách (a) chỉ cần domain ở Cloudflare + tunnel. Chi tiết topology/checklist: [08-deployment](./docs/08-deployment.md) · vận hành/backup: [13-operations](./docs/13-operations.md).

---

## Tài liệu

Bắt đầu từ [docs/README.md](./docs/README.md).

- 🧭 [Tầm nhìn & phạm vi](./docs/00-project.md) · [MVP Scope](./docs/01a-mvp-scope.md)
- 🏗️ [Kiến trúc](./docs/03-architecture.md) · [Nguyên tắc](./docs/03a-architecture-principles.md)
- 🧩 [Quyết định (ADR)](./docs/adr/) · [Tech Stack](./docs/10a-tech-stack.md)
- 🗺️ [Sprint plans](./docs/sprints/) · 🔎 [Reviews](./docs/reviews/)
- 🤝 [Hướng dẫn đóng góp](./docs/17-contributing.md)

## Trạng thái phát triển

| Sprint | Mục tiêu | Trạng thái |
|---|---|---|
| Sprint 0 | Nền tảng tài liệu & kiến trúc | 🟢 Đóng |
| Sprint 1 | Nền tảng local chạy được (infra + plumbing) | 🟢 Hoàn thành |
| Sprint 2 | Vertical slice MVP nội dung (Roadmap M2) | 🟢 Hoàn thành |
| Sprint 3 | Reader Experience (Presentation Layer) | 🟢 Hoàn thành |
| Sprint 4 | Fixture Framework & Dogfooding | 🟢 Hoàn thành |
| Sprint 5 | Reader Completeness (Pagination + SEO baseline) | 🟢 Hoàn thành |
| Sprint 6 | Deployment & Public MVP (TLS + rebuild-on-publish + backup) | 🟢 Hoàn thành ([sprint-6](./docs/sprints/sprint-6.md)); mục @deploy chờ domain thật |
| Sprint 6.5 | Product Polish (Content & UX) | 🟢 Hoàn thành ([sprint-6.5](./docs/sprints/sprint-6.5.md)) |
| Sprint 7 | System Hardening & Quality (Biome, test, CI) | 🟢 Hoàn thành ([sprint-7](./docs/sprints/sprint-7.md)) |
| Sprint 8 | Production Hardening (header bảo mật, webhook, backup lịch, healthcheck) | 🟢 Hoàn thành ([sprint-8](./docs/sprints/sprint-8.md)) |
| Sprint 9 | Deploy tại nhà (Cloudflare Tunnel, Postgres trong compose) | 🟢 Đã chạy trên máy thật ([sprint-9](./docs/sprints/sprint-9.md)) |
| Sprint 10 | Đóng gói deploy (webhook + backup + healthcheck vào compose, `deploy-home.sh`) | 🟢 Hoàn thành ([sprint-10](./docs/sprints/sprint-10.md)) |
| Sprint 11 | Kiểm thử mở rộng (E2E, axe, Lighthouse, quyền Public) | 🟢 Hoàn thành ([sprint-11](./docs/sprints/sprint-11.md)) |
| Sprint 12 | Vận hành & quan sát (runbook, restore drill) | 🟢 Hoàn thành ([sprint-12](./docs/sprints/sprint-12.md)) |
| Sprint 13 | Bảo mật bổ sung & cổng CI | 🟢 Hoàn thành ([sprint-13](./docs/sprints/sprint-13.md)) |
| Sprint 14 | Nợ tài liệu (dọn placeholder, script `check-docs`) | 🟡 Làm xong, chờ Product review ([sprint-14](./docs/sprints/sprint-14.md)) |
| Sprint 15–16 | Refactor docs Đợt 3 · Visual Polish | 📋 Kế hoạch ([roadmap](./docs/02-roadmap.md)) |

## License

[MIT](./LICENSE) © 2026 Đỗ Ngọc Minh Tiến.
