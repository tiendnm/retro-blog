# Retro Blog

> Một blog headless mang phong cách retro — **Astro** (site) + **Directus** (headless CMS) + **PostgreSQL**, đóng gói bằng **Docker**.

> **Trạng thái:** 🟢 Sprint 1 — nền tảng local chạy được (infra + plumbing). Chưa có feature MVP.
> **Cập nhật lần cuối:** 2026-07-21

---

## Giới thiệu

Retro Blog là nền tảng blog **headless, content-driven**: nội dung quản trị trong Directus, hiển thị bởi Astro, dữ liệu lưu ở PostgreSQL. Toàn bộ tri thức kiến trúc/nội dung nằm ở tầng LÕI (tech-neutral) trong [`docs/`](./docs/); công nghệ cụ thể là chi tiết thay thế được (xem [ADR](./docs/adr/)).

> Tầm nhìn & phạm vi chi tiết: [docs/00-project.md](./docs/00-project.md) · [docs/01a-mvp-scope.md](./docs/01a-mvp-scope.md).

## Tech stack

| Vai trò | Công nghệ | Phiên bản | ADR |
|---|---|---|---|
| Presentation / Site | Astro | 5.x | [ADR-0002](./docs/adr/0002-use-astro-site-generator.md) |
| Headless CMS | Directus | `11.3.5` | [ADR-0003](./docs/adr/0003-use-directus-headless-cms.md) |
| Content Store | PostgreSQL | `16.8-alpine` | [ADR-0004](./docs/adr/0004-use-postgresql-content-store.md) |
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

4. **Tạo content model + phân quyền (lần đầu / fresh clone)**
   ```bash
   pnpm schema:apply         # áp dụng schema snapshot (collections/fields/relations)
   pnpm permissions:apply    # cấu hình Roles/Policies/Permissions (Public/Editor)
   ```
   > Chỉ cần khi Directus còn trống (volume mới). Cả hai **idempotent** — chạy lại an toàn.
   > Artifacts: `services/directus/snapshots/schema.yaml` · `services/directus/apply-permissions.sh`.
   > `permissions:apply` cần `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` (dùng Admin API).

5. **Truy cập**

   | Dịch vụ | URL | Ghi chú |
   |---|---|---|
   | Astro (site) | http://localhost:4321 | trang plumbing-check (Sprint 1) |
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
| Sprint 2 | _(đề xuất — chưa bắt đầu)_ | ⏳ |

## License

> TODO: xác định giấy phép (ví dụ MIT) — chưa quyết định.
