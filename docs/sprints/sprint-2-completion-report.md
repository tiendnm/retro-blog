# 🏁 Sprint 2 — Completion Report

> **Ngày:** 2026-07-22 · **Sprint:** 2 — Vertical Slice (MVP nội dung / Roadmap **M2**) · **Trạng thái:** 🟢 **HOÀN THÀNH**
> **Kế hoạch nguồn:** [sprint-2-implementation-plan.md](./sprint-2-implementation-plan.md) · **Nhánh:** `main` (mỗi phase 1 commit)

---

## 1. Mục tiêu đạt được — Mapping Sprint Goal → Kết quả

> 🎯 **Sprint Goal:** *lát cắt dọc* — **Editor tạo bài trong Directus → Publish → Reader xem trên Astro** (list / detail / category); **draft không lộ**.

| Mắt xích Sprint Goal | Kết quả | Bằng chứng |
|---|---|---|
| **Editor** tạo/publish bài (không quản trị user/role) | ✅ | E2E: Editor-user tạo+publish → Public thấy; Editor tạo user → **403** |
| **Publish** (`draft → published`, gate thời gian) | ✅ | Rule Public `status=published AND published_at ≤ $NOW`; draft & bài hẹn giờ tương lai bị chặn |
| **Astro build** (SSG) | ✅ | `astro build` → **6 page tĩnh** (index + 3 detail + 2 category), **0 page draft** |
| **Reader — list** | ✅ | `dist/index.html`: 3 bài published, **mới nhất trước**, kèm tác giả |
| **Reader — detail** | ✅ | render title/author/category/body(markdown→HTML)/**cover(alt)**; UTF-8 chuẩn |
| **Reader — category** | ✅ | `cong-nghe` → 2 bài · `doi-song` → 1 bài (đúng phân bổ) |
| **Draft KHÔNG xuất hiện** | ✅ | không có page build, vắng ở index, `/items/posts` (Public) không trả, detail slug draft → 404 |

**Kết luận:** vertical slice chạy đầu-cuối. Sprint 2 hoàn thành **Roadmap M2 — "Xuất bản 1 bài end-to-end"**.

## 2. File thay đổi theo phase

| Phase | Commit | Nội dung chính |
|---|---|---|
| P0 — Decisions & hợp đồng | `bbe8c1b` | ADR-0006 (SSG static-first, Accepted) · hoàn thiện [03d](../03d-api-contract.md) (PostDetail, phân trang/lọc/sắp xếp, error model) |
| P1 — Content Model | `d635075` | Collections `posts`/`authors`/`categories` + `directus_files.alt/caption`; **schema snapshot** `services/directus/snapshots/schema.yaml`; [05-cms §1](../05-cms.md) |
| P2 — Permissions & Publishing | `5b9a283` | `apply-permissions.sh` (Public/Editor idempotent, tái lập); rule `$NOW`; [05-cms §2-3](../05-cms.md), [12-security §3](../12-security.md) |
| P3 — API Binding | `f579469` | Thin client `apps/web/src/lib/directus.ts` + DTO `types.ts`; pages list/detail/category + `Base`/`PostCard`; **field allowlist** Public; [06-api](../06-api.md) |
| P4 — Seed & E2E (báo cáo này) | _(commit này)_ | `services/directus/seed/seed-dev.mjs` (`pnpm seed:dev`); E2E verify; báo cáo này |

## 3. Acceptance Criteria (từ [Plan §6](./sprint-2-implementation-plan.md))

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Collections `posts`/`authors`/`categories` + Media(alt) đúng field & quan hệ [03c](../03c-content-model.md) (không Tag) | ✅ P1 (schema snapshot) |
| 2 | Roles **Admin/Editor** đúng; **Public chỉ đọc published** (draft không ra API) | ✅ P2 (draft/future → 403) |
| 3 | Editor tạo được Post (author+category+cover), `published` → có `published_at` | ✅ P4 E2E (Editor-user 7/7) |
| 4 | Astro **list** hiển thị published (mới nhất trước), ẩn draft | ✅ P4 (`dist/index.html`) |
| 5 | Astro **detail** render body/author/category/**cover(alt)** | ✅ P4 (build + kiểm `<img src=/assets alt>`) |
| 6 | Astro **category** liệt kê bài trong chuyên mục | ✅ P4 |
| 7 | **E2E:** publish trong Directus → reader thấy trên Astro | ✅ P4 |
| 8 | Không Tag/Search/Comment/Analytics/Dark mode/auth-frontend | ✅ giữ đúng |
| 9 | Schema **reproducible** trên fresh clone (snapshot apply) | ✅ P1 (verify empty→apply) |
| 10 | **ADR-0006** tạo & Accepted; 03d hoàn thiện | ✅ P0 |
| 11 | Astro chỉ phụ thuộc **DTO** (03d), không phụ thuộc nội bộ Directus (P3) | ✅ P3 (thin client + DTO) |

→ **11/11 đạt.**

## 4. Seed dữ liệu dev (tái lập)

- Artifact: [`services/directus/seed/seed-dev.mjs`](../../services/directus/seed/seed-dev.mjs) — `pnpm seed:dev`. **Idempotent** (xoá theo slug rồi tạo lại), Node/UTF-8, **KHÔNG dữ liệu thật**.
- Nội dung: **1 author · 2 categories · 3 published posts · 1 draft**. Published có `published_at` lệch ngày để kiểm thứ tự.

## 5. Kiểm chứng E2E (tóm tắt)

- **Editor → Publish:** 7/7 — Editor-user tạo+publish; Public thấy; Editor **không** tạo được user (403). Data test **đã xoá**.
- **Build SSG:** 6 page (index + 3 detail + 2 category), 0 page draft.
- **List/Detail/Category:** đúng nội dung, thứ tự, phân bổ; UTF-8 & markdown→HTML & cover(alt) OK.
- **Draft:** ẩn tuyệt đối (build/list/API/detail-404).

## 6. Quyết định đã ghi nhận

Decision Log [10 §5](../10-decisions.md): `[S2-P0]` render/contract · `[S2-P2]` permission/`$NOW`/reproducible/`curl -g` · `[S2-P3]` thin client/field allowlist/markdown. ADR-0006 (render) **Accepted**.

## 7. Ngoài phạm vi Sprint 2 (đã giữ đúng)

- **Tag**, Search, Comment, Analytics, Dark mode, **pagination UI**, SEO nâng cao, i18n, RSS.
- Frontend authentication, public CMS users.
- Scheduled-publish nâng cao (tự rebuild đúng giờ), In-review workflow.
- Rebuild-on-publish automation (webhook→CI/CD) cho production.

## 8. Remaining backlog (đề xuất — chưa cam kết)

| # | Hạng mục | Ghi chú |
|---|---|---|
| B1 | **Rebuild-on-publish** (webhook → CI/CD) | Bản chất SSG: prod cần rebuild để thấy bài mới ([ADR-0006](../adr/0006-render-strategy.md)). Ưu tiên cao cho deploy thật |
| B2 | **Hardening build web:** pin `pnpm-lock.yaml` + `Dockerfile` cho `apps/web` | Hiện container cài fresh (nợ từ Sprint 1) |
| B3 | **Sanitize HTML** khi render Markdown | Hiện dựa "Editor tin cậy"; bắt buộc trước khi mở cho tác giả không tin cậy ([12-security §8](../12-security.md)) |
| B4 | **Pagination UI** | API đã hỗ trợ `page/pageSize` (03d §4); UI ngoài Sprint 2 |
| B5 | **SEO** (meta/OpenGraph/sitemap) + a11y nâng cao | Ngoài Sprint 2 |
| B6 | **Tag** (browsing) | Nice-to-have ([01a](../01a-mvp-scope.md)); DTO đã chừa chỗ (03d §3.2) |
| B7 | **Category tree UI** | `categories.parent` đã có sẵn để mở rộng |
| B8 | **Seed cover ảnh** trong seed dev | Đường ảnh đã verify; seed hiện không kèm cover |
| B9 | **Deployment / reverse proxy / TLS / backup** | [08-deployment](../08-deployment.md), [13-operations](../13-operations.md) |

---

> ✅ **SPRINT 2 ĐÓNG.** Không bắt đầu Sprint 3 cho tới khi được phê duyệt.
