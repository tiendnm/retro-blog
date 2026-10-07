# Retro Blog

> Một blog headless mang phong cách retro — **Astro** (site) + **Directus** (headless CMS) + **PostgreSQL**, đóng gói bằng **Docker**.

> **Trạng thái:** 🟡 Public MVP: cơ chế deploy + CI đã có; còn checklist @deploy trên domain thật và hardening hạ tầng (security header, webhook). Chi tiết: [docs/sprints](./docs/sprints/).

---

## Giới thiệu

Retro Blog là nền tảng blog **headless, content-driven**: nội dung quản trị trong Directus, hiển thị bởi Astro, dữ liệu lưu ở PostgreSQL. Toàn bộ tri thức kiến trúc/nội dung nằm ở tầng LÕI (tech-neutral) trong [`docs/`](./docs/); công nghệ cụ thể là chi tiết thay thế được (xem [ADR](./docs/adr/)).

> Tầm nhìn & phạm vi chi tiết: [docs/00-project.md](./docs/00-project.md) · [docs/01a-mvp-scope.md](./docs/01a-mvp-scope.md).

## Tech stack

| Vai trò | Công nghệ | Phiên bản | ADR |
|---|---|---|---|
| Presentation / Site | Astro | 5.x | [ADR-0002](./docs/adr/0002-use-astro-site-generator.md) |
| Headless CMS | Directus | `11.3.5` | [ADR-0003](./docs/adr/0003-use-directus-headless-cms.md) |
| Content Store | PostgreSQL | 16 (instance host :5433) | [ADR-0004](./docs/adr/0004-use-postgresql-content-store.md), [ADR-0010](./docs/adr/0010-external-postgres-instance.md) |
| Đóng gói & runtime | Docker + Compose v2 | 29.x | [ADR-0005](./docs/adr/0005-use-docker-packaging.md) |

> Sổ đăng ký công nghệ: [docs/10a-tech-stack.md](./docs/10a-tech-stack.md).

---

## 🚀 Getting Started

### Yêu cầu môi trường

- **Bắt buộc (để chạy stack):** Docker Engine + Docker Compose v2 (đã kiểm với Docker 29 / Compose v2). Stack chạy **hoàn toàn trong Docker** — *không* cần Node trên host để chạy.
- **Tuỳ chọn (dev tooling trên host):** Node 22 LTS + pnpm 10 (để dùng các script `pnpm ...` và IDE). Xem `.nvmrc`.

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

### Triển khai production (Sprint 6 — [08-deployment](./docs/08-deployment.md))

Self-host HTTPS qua **Caddy** (auto-TLS) + **rebuild-on-publish** + **backup**. Tóm tắt:

```bash
cp .env.production.example .env.production   # điền <domain> thật + secrets mạnh (KHÔNG commit)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
pnpm rebuild:flow    # tạo Directus Flow rebuild-on-publish (cần REBUILD_* + admin creds)
pnpm theme:apply     # đồng bộ màu + font Directus Admin với web (Settings → Appearance)
pnpm backup          # sao lưu db+uploads+config (restore: pnpm restore <dir>)
```

> Cần DNS `retro.<domain>` + `cms.<domain>` trỏ host, mở 80/443. Chi tiết topology/checklist: [08-deployment](./docs/08-deployment.md) · vận hành/backup: [13-operations](./docs/13-operations.md).

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
| Sprint 7 | System Hardening & Quality (Biome, test, CI) | 🟢 Phase 1–3 xong; chờ remote GitHub để xác nhận CI xanh ([sprint-7](./docs/sprints/sprint-7.md)) |
| Sprint 8 | Production Hardening (header bảo mật, webhook, backup lịch, healthcheck) | 🟢 Hoàn thành ([sprint-8](./docs/sprints/sprint-8.md)); chờ xác nhận trên server thật |

## License

> TODO: xác định giấy phép (ví dụ MIT) — chưa quyết định.
