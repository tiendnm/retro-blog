# 10a — Tech Stack (Implementation)

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** *Sổ đăng ký* các công nghệ cụ thể được chọn cho từng **vai trò/port** trong [Architecture](./03-architecture.md). Đây là nơi **duy nhất** tập trung tên công nghệ (cùng ADR & Principle), để các tài liệu LÕI không phải nhắc tới chúng.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [03a-architecture-principles](./03a-architecture-principles.md) · [10-decisions](./10-decisions.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION).** Mọi mục ở đây là *lựa chọn thay thế được* (adapter). Mỗi mục **phải** có ADR và nêu Principle tuân thủ (Governance G1 — [03a](./03a-architecture-principles.md)). Vai trò/port *ổn định* nằm ở [Architecture](./03-architecture.md); công nghệ ở đây là phần *biến thiên*.

## 1. Nguyên tắc của sổ đăng ký

- Chỉ liệt kê công nghệ đã (hoặc đang đề xuất) chọn cho một vai trò trong [03-architecture §3](./03-architecture.md).
- Thêm/đổi một mục ⇒ **bắt buộc** có ADR tương ứng (§4).
- Cột "Principle" cho biết vì sao lựa chọn phù hợp nền tảng kiến trúc.

## 2. Bảng công nghệ theo vai trò

| Vai trò / Port ([03](./03-architecture.md)) | Công nghệ | Phiên bản | Trạng thái | ADR | Principle chính |
|---|---|---|---|---|---|
| Presentation / Site (Site Generator) | Astro | 5.x | **Accepted** | [0002](./adr/0002-use-astro-site-generator.md) | P1, P3, P5 |
| Headless Content Service (CMS) | Directus | `11.3.5` (image, pin) | **Accepted** | [0003](./adr/0003-use-directus-headless-cms.md) | P1, P2, P4 |
| Content Store (Persistence) | PostgreSQL | 16 (instance host :5433, DB `retro-blog`) | **Accepted** | [0004](./adr/0004-use-postgresql-content-store.md), [0010](./adr/0010-external-postgres-instance.md) | P4, P6 |
| Đóng gói & Runtime | Docker Engine + Compose v2 | 29.x | **Accepted** | [0005](./adr/0005-use-docker-packaging.md) | P4, P5 |
| Edge / Reverse Proxy | _TBD_ | — | ⏳ | _TBD_ | — |
| Build / Deploy Orchestrator (CI/CD) | _TBD_ | — | ⏳ | _TBD_ | — |
| Chiến lược render | **SSG (static)** | — | **Accepted** | [0006](./adr/0006-render-strategy.md) | P3, P4, P5 |

> ✅ **Accepted** = đã ratify (Sprint 0 close-out). Phiên bản chốt ở **Sprint 1** (Decision Log [10 §5](./10-decisions.md)); patch cụ thể pin qua lockfile / image digest khi cài.

## 3. Ràng buộc phiên bản & toolchain (Sprint 1)

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | **22 LTS** (`engines >=22`, `.nvmrc` 22) | web (Astro) & Directus chạy trong container (Node 22 image) → `docker compose up` không cần Node 22 trên host; chạy Astro trực tiếp trên host thì cài Node 22 (host hiện 20.19.4) |
| Package manager | **pnpm 10.x** (workspace) | pin qua `packageManager` trong `package.json` |
| Astro | **5.x** | apps/web (container `node:22.12.0-alpine`) |
| Directus | **11.3.5** (pin) | image `directus/directus:11.3.5` |
| PostgreSQL | **16.8-alpine** (pin) | image `postgres:16.8-alpine` |
| Docker Engine / Compose | **29.x / Compose v2** | đóng gói & runtime |

> Nâng cấp lớn (major) của bất kỳ mục nào → ghi **Decision Log** (hoặc ADR nếu ảnh hưởng kiến trúc).

## 4. Cách thêm / thay đổi một mục stack

1. Viết (hoặc cập nhật) một **ADR** trong [`adr/`](./adr/) — nêu Principle tuân thủ, trade-off, **chi phí migration**.
2. Cập nhật bảng §2 (công nghệ, phiên bản, trạng thái, link ADR).
3. Nếu vai trò/port thay đổi bản chất → cập nhật [03-architecture](./03-architecture.md) trước.

## 5. Ánh xạ tới tài liệu implementation (RÌA)

| Công nghệ | Tài liệu hiện thực |
|---|---|
| Astro | [06-api](./06-api.md) (tiêu thụ), [07-ui-ux](./07-ui-ux.md) |
| Directus | [05-cms](./05-cms.md) |
| PostgreSQL | [04-database](./04-database.md) |
| Docker | [08-deployment](./08-deployment.md), [13-operations](./13-operations.md) |
