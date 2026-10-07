# 10 — Decisions (ADR Index)

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
| [0006](./adr/0006-render-strategy.md) | **SSG static-first** | Render strategy | P3,P4,P5 | **Accepted** |
| [0007](./adr/0007-reverse-proxy-and-tls.md) | **Caddy** (reverse proxy + auto-TLS) | Edge / Ingress / TLS | P4,P5 | **Accepted** |
| [0008](./adr/0008-rebuild-on-publish.md) | **Rebuild-on-publish** (Flow→webhook→script→atomic swap) | Content release pipeline | P3,P4,P5 | **Accepted** |
| [0009](./adr/0009-quality-tooling-biome-vitest.md) | **Biome + Vitest + astro check** (cổng chất lượng) | Tooling (RÌA) | P6 | **Accepted** |
| [0010](./adr/0010-external-postgres-instance.md) | **PostgreSQL instance có sẵn trên host** (ngoài compose) | Content Store (hạ tầng) | P6 | **Accepted** (dev; prod → ADR-0014) |
| [0011](./adr/0011-body-stored-as-html-wysiwyg.md) | **`posts.body` lưu HTML (WYSIWYG)** — thay `[S2-P3]` | Content format (RÌA) | P6 | **Accepted** |
| [0013](./adr/0013-sanitize-body-html.md) | **Sanitize HTML `posts.body` lúc build (allowlist)** | Security (RÌA) | P6 | **Accepted** |
| [0012](./adr/0012-site-settings-singleton.md) | **Cấu hình site động** — singleton `site_settings` (không gồm URL/secret hạ tầng) | Content config (RÌA) | P4,P6 | **Accepted** |
| [0014](./adr/0014-postgres-in-compose-for-production.md) | **Production chạy Postgres trong compose** (thay ADR-0010 cho prod) | Content Store (hạ tầng) | P4,P5,P6 | **Accepted** |
| [0015](./adr/0015-cloudflare-tunnel-ingress.md) | **Cloudflare Tunnel** làm đường vào cho server tại nhà (bổ sung ADR-0007) | Edge / Ingress | P4,P5,P6 | **Accepted** |

> ℹ️ ADR 0002–0005 được ratify ở Sprint 0 close-out (2026-07-21). ADR-0001 (process) vẫn Proposed — có thể ratify ở đầu Sprint 1. ADR-0006 ratify Sprint 2 Phase 0. **ADR-0007/0008 ratify Sprint 6 Phase 0 (2026-07-23, Product chốt).**

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
| 2026-07-21 | **Docker Compose:** 1 file root; image pin cứng (không `latest`); postgres không expose host | Self-host an toàn, tái lập | Sprint 1 |
| 2026-07-21 | **Public gate = `status=published` AND `published_at ≤ $NOW`**; Public đọc qua **field allowlist** (không `fields:['*']`), không token ở client | Bảo mật ở tầng permission, least privilege | Tech Lead |
| 2026-07-21 | **Editor = `app_access` + CRUD 4 content collection**, không `admin_access`; phân quyền tái lập bằng `apply-permissions.sh` (curl dùng `-g`) | Schema snapshot không bắt roles/policies | Sprint 2 |
| 2026-07-21 | **Thin fetch client `apps/web/src/lib/directus.ts` là tầng DUY NHẤT** gọi Directus; page/component chỉ nhận DTO ([03d](./03d-api-contract.md)) | Decoupling (P3/P6) | Sprint 2 |
| 2026-07-22 | **Route pagination** `/page/[page]` + `/category/[slug]/page/[page]` (không catch-all `[...page]`); `pageSize=10` | Không chiếm namespace | Sprint 5 |
| 2026-07-22 | **SEO:** canonical self-referencing; `sitemap.xml`/`robots.txt` là endpoint Astro, chỉ canonical content URLs (không pagination); URL tuyệt đối từ `PUBLIC_SITE_URL` | Một nguồn sự thật cho URL | Sprint 5 |
| 2026-07-23 | **Backup = db + uploads + config + env** (không `dist/`, tái sinh được); **rollback = atomic swap** về static build trước | Phục hồi nhanh, nhỏ gọn | Sprint 6 |
| 2026-10-07 | **Quy trình tinh gọn:** 1 file/sprint, review ở ranh giới sprint, ADR chỉ cho quyết định khó đảo ngược ([17 §2](./17-contributing.md)); log này chỉ giữ quyết định còn ràng buộc, chi tiết triển khai xem `sprints/sprint-N.md` | Giảm nghi thức, giảm trùng lặp | Product |
