# 10 — Decisions (ADR Index)

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** Ghi nhận *tại sao* các quyết định kiến trúc quan trọng được đưa ra, theo thời gian. Là "bộ nhớ dài hạn" giúp người mới hiểu bối cảnh và tránh lật lại quyết định cũ vô cớ.
> 🔗 **Liên quan:** [adr/](./adr/) · [adr/0000-adr-template](./adr/0000-adr-template.md) · [03a-architecture-principles](./03a-architecture-principles.md) · [10a-tech-stack](./10a-tech-stack.md)

---

## 1. Chúng ta ghi nhận quyết định thế nào?

Mỗi quyết định kiến trúc quan trọng được ghi thành một **ADR** — file riêng, đánh số tăng dần, **append-only**. Mẫu: [`adr/0000-adr-template.md`](./adr/0000-adr-template.md); hướng dẫn: [`adr/README.md`](./adr/README.md).

> **Governance G1:** mỗi ADR **bắt buộc** khai báo Nguyên tắc tuân thủ ([03a](./03a-architecture-principles.md)), Trade-off, và Chi phí migration. Công nghệ đã chốt được tổng hợp ở [Tech Stack](./10a-tech-stack.md).

## 2. Khi nào cần một ADR?

Tạo ADR khi quyết định: khó đảo ngược, ảnh hưởng nhiều phần, liên quan đánh đổi đáng kể, hoặc người mới sẽ hỏi "tại sao?". Ví dụ: chọn framework, CMS, database, chiến lược render, cơ chế xác thực.

## 3. Vòng đời trạng thái ADR

`Proposed` → `Accepted` → (khi bị thay thế) `Superseded by ADR-NNNN` · hoặc `Deprecated`.

## 4. Danh mục ADR (Index)

| # | Tiêu đề | Vai trò/Chủ đề | Principle chính | Trạng thái |
|---|---|---|---|---|
| [0001](./adr/0001-record-architecture-decisions.md) | Ghi nhận quyết định bằng ADR | Governance | G1/G2, P7 | Proposed |
| [0002](./adr/0002-use-astro-site-generator.md) | Dùng Astro | Presentation/Site | P1,P3,P5 | **Accepted** |
| [0003](./adr/0003-use-directus-headless-cms.md) | Dùng Directus | Headless Content Service | P1,P2,P4 | **Accepted** |
| [0004](./adr/0004-use-postgresql-content-store.md) | Dùng PostgreSQL | Content Store | P4,P6 | **Accepted** |
| [0005](./adr/0005-use-docker-packaging.md) | Dùng Docker | Đóng gói/Runtime | P4,P5 | **Accepted** |
| 0006 | _(dự kiến) Chiến lược render (SSG/SSR/ISR)_ | Data flow | P3 | ⏳ |

> ℹ️ ADR 0002–0005 được ratify ở Sprint 0 close-out (2026-07-21). ADR-0001 (process) vẫn Proposed — có thể ratify ở đầu Sprint 1.

## 5. Nhật ký quyết định nhẹ (Lightweight Decision Log)

> Cho quyết định nhỏ chưa xứng một ADR đầy đủ.

| Ngày | Quyết định | Lý do ngắn | Người quyết |
|---|---|---|---|
| 2026-07-21 | Docs theo cấu trúc phẳng `NN-` mở rộng | Tôn trọng skeleton sẵn có, phù hợp quy mô blog | Team |
| 2026-07-21 | Chèn tài liệu mới bằng hậu tố chữ (`03a`...), không renumber | Giữ đánh số ổn định | Team |
| 2026-07-21 | Tách tầng LÕI/RÌA; kiến trúc mô tả theo ports & adapters | Tránh lock-in, bảo trì dài hạn | Team |
| 2026-07-21 | Đóng Sprint 0; ratify stack ADR 0002–0005 | Kết thúc Sprint 0, sẵn sàng Sprint 1 | Tech Lead |
| 2026-07-21 | MVP Scope: **Category → Must Have**; **Tag** giữ Nice To Have | Category định hình information architecture, navigation & khả năng mở rộng nội dung; Tag bổ sung sau | Tech Lead |
| 2026-07-21 | Làm rõ phân quyền MVP = **chỉ Admin + Editor** (loại frontend auth, user account, permission phức tạp, custom RBAC) | Giữ MVP tối giản, chống scope creep | Tech Lead |
| 2026-07-21 | **[S1] Toolchain:** pnpm 10 (workspace); **Node 22 LTS** (`engines >=22`, `.nvmrc` 22) — Tech Lead xác nhận | pnpm hợp monorepo; web (Astro) chạy trong container Node 22 → host không cần Node 22 để `docker compose up` (host hiện 20.19.4) | Sprint 1 |
| 2026-07-21 | **[S1] Versions:** Astro 5.x · Directus 11.x · PostgreSQL 16 · Docker Engine 29/Compose v2 | Bản ổn định/LTS hiện hành, self-host tốt | Sprint 1 |
| 2026-07-21 | **[S1] Docker Compose:** 1 file root, 3 service (postgres/directus/web) + network + named volumes | Đơn giản, local-friendly (Plan §4) | Sprint 1 |
| 2026-07-21 | **[S1] Khởi tạo git** (`git init -b main`); thêm `!.env.example` để override `~/.gitignore_global` (`.env.*`) | Nền tảng repo; giữ track file template | Sprint 1 |
| 2026-07-21 | **[S1-P2] Image pin (đã verify):** `postgres:16.8-alpine` · `directus/directus:11.3.5` · web `node:22.12.0-alpine` | Pin cứng (không `latest`); đã pull & smoke test đạt (2 service healthy, Directus↔PG OK) | Sprint 1 |
| 2026-07-21 | **[S1-P2] Compose:** postgres không expose host (chỉ nội bộ); Directus `:8055`; web gated sau profile `app` (chưa scaffold Astro) | Self-host an toàn; web bật ở Phase 3 | Sprint 1 |
