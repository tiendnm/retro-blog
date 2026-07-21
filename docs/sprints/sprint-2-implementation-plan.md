# 🏗️ Sprint 2 — Implementation Plan

> **Trạng thái:** 🟢 Đã duyệt (approved) — đang thực hiện Phase 0 · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead
>
> 🎯 **Mục tiêu Sprint 2:** hiện thực **vertical slice** đầu tiên — *Editor tạo bài trong Directus → Publish → Reader xem bài trên Astro*.
> 🔗 **Nguồn sự thật (không định nghĩa lại):** phạm vi → [01a-mvp-scope](../01a-mvp-scope.md) · nội dung → [03c-content-model](../03c-content-model.md) · hợp đồng → [03d-api-contract](../03d-api-contract.md) · domain/state → [03b-domain-model](../03b-domain-model.md) · dữ liệu → [03e-data-model](../03e-data-model.md) · mốc → [02-roadmap M2](../02-roadmap.md).

---

> 🔒 **Quy tắc:** Sprint 2 **tuân theo** MVP Scope / Architecture Principles / ADR. Tài liệu LÕI (03b/03c/03d/03e) là SSOT — chỉ *hoàn thiện phần còn TODO theo SSOT*, **không tạo contract/model mới**. Mọi thay đổi LÕI → Decision Log (được duyệt qua plan này). Phát sinh ngoài dự kiến → **DỪNG**, Decision Log/ADR, chờ review.

## 1. Goal

Một lát cắt dọc chạy được đầu-cuối cho các hạng mục **Must Have** ([01a §3](../01a-mvp-scope.md)):
- **Editor** đăng nhập Directus, tạo `Post` (gắn Author, Category, ảnh bìa), đặt `status=published`.
- Nội dung published hiển thị trên Astro: **trang danh sách**, **trang chi tiết**, **trang category**.
- `Post` chưa published (draft) **không** lộ ra ngoài.

## 2. Scope / Out of scope

### ✅ In scope (bắt buộc)
1. **Directus Content Model:** `Post`, `Author`, `Category`, **Media** (theo [03c §2](../03c-content-model.md), *bỏ Tag*).
2. **Permission:** roles **Admin**, **Editor** + **Public** (chỉ đọc published). **Không frontend authentication.**
3. **API binding:** tích hợp Directus theo [API Contract 03d](../03d-api-contract.md) — **không tạo contract mới** (chỉ hoàn thiện phần TODO của 03d theo 03c ở Phase 0).
4. **Astro:** trang danh sách bài · trang chi tiết bài · trang category cơ bản.
5. **Render strategy:** đề xuất + **ADR-0006**.

### ⛔ Out of scope
- **Tag**, Search, Comment, Analytics, Dark mode, Advanced image pipeline, CDN, Performance optimization (theo yêu cầu).
- Frontend authentication, user account (theo [01a §6](../01a-mvp-scope.md)).
- Scheduled publishing, In-review workflow, RSS, i18n (Nice/Future — [01a](../01a-mvp-scope.md)).
- Rebuild-on-publish automation cho production (webhook→CI) — *chỉ ghi ADR-0006, hiện thực sau*.
- Lockfile/Dockerfile hardening (ghi nhận, không bắt buộc Sprint 2).

## 3. Phase breakdown

### Phase 0 — Decisions & hoàn thiện hợp đồng
- **ADR-0006 (Render strategy) — ✅ CHỐT: SSG static-first** (giữ static-first theo [ADR-0002](../adr/0002-use-astro-site-generator.md); phù hợp Astro & blog; self-host / free cloud đơn giản). Local dev dùng `astro dev` (render on-demand → *publish → reader thấy ngay* trong dev). **Sprint 2 KHÔNG implement webhook rebuild**; **publish-triggered rebuild qua CI/CD là future work** (ngoài Sprint 2).
- **Hoàn thiện [03d](../03d-api-contract.md)** — *hoàn thiện SSOT sẵn có, **KHÔNG tạo contract mới**, không thêm feature ngoài MVP; **dẫn xuất từ [03b](../03b-domain-model.md)/[03c](../03c-content-model.md)/[03e](../03e-data-model.md)***: `PostDetail` (body, category, cover, author, publishedAt), phân trang (offset, size mặc định/tối đa), lọc (status=published; theo category), sắp xếp (publishedAt desc), mô hình lỗi (not-found/invalid/system). `tags` để lại tương lai (Tag ngoài Sprint 2). → Decision Log.
- **Quyết định nhỏ (Decision Log):** client fetch = **thin fetch wrapper** map sang DTO 03d (giữ decoupling P3, không dùng SDK); schema-as-code = **Directus schema snapshot** (version-control); Media = map `directus_files` + field tuỳ biến `alt`/`caption`.

### Phase 1 — Directus Content Model ([05-cms](../05-cms.md))
- Tạo collections: `posts`, `authors`, `categories`; **Media = dùng Directus Files (`directus_files`, built-in) + field `alt` (bắt buộc)/`caption`** — **KHÔNG tạo Media collection riêng** (theo ràng buộc; đảm bảo metadata/alt theo [03c §2.5](../03c-content-model.md)).
- Field & relation theo [03c](../03c-content-model.md) (không gồm Tag):
  - `posts`: title, slug (unique), excerpt, body, status (enum **draft|published** — subset [03b §4](../03b-domain-model.md)), published_at, author (M2O→authors), category (M2O→categories), cover (M2O→directus_files).
  - `authors`: name, slug (unique), bio, avatar (M2O→directus_files).
  - `categories`: name, slug (unique), description, parent (M2O self, optional).
- **Version content model:** export **schema snapshot** → `services/directus/snapshots/`; áp dụng khi setup (`directus schema apply`).
- Fill [05-cms §1](../05-cms.md).

### Phase 2 — Permissions & Publishing ([05 §2-3](../05-cms.md), [12-security](../12-security.md))
- Roles: **Admin** (quản trị CMS), **Editor** (tạo/sửa/**xuất bản** nội dung: posts/authors/categories/files; KHÔNG quản lý user/role), **Public** (**read-only API role**). **Không frontend authentication; không tạo public CMS users.**
- **Public chỉ đọc** `posts` có `status=published` (+ authors/categories liên quan + files) — *chống lộ draft*.
- Publishing tối thiểu: `draft → published` (set status + published_at). Không in_review/scheduled.
- Fill [05 §2-3](../05-cms.md).

### Phase 3 — API Binding ([06-api](../06-api.md) + Astro client)
- `apps/web/src/lib/directus.ts`: thin client gọi Directus REST (Public role) hiện thực thao tác [03d §2](../03d-api-contract.md): list published, by slug, by category → map sang `PostSummary`/`PostDetail`.
- `apps/web/src/lib/types.ts`: kiểu DTO khớp 03d.
- Media URL: `PUBLIC_DIRECTUS_URL/assets/<file-id>` + alt từ field.
- Fill [06-api §1-5](../06-api.md).

### Phase 4 — Astro Pages ([07-ui-ux](../07-ui-ux.md) tối thiểu)
- `src/layouts/Base.astro`: layout tối thiểu, **HTML ngữ nghĩa** + a11y baseline (alt, heading, `lang`), phong cách retro *cơ bản* (không polish).
- `src/pages/index.astro`: **danh sách bài** (thay trang plumbing).
- `src/pages/posts/[slug].astro`: **chi tiết bài** (`getStaticPaths` từ posts published).
- `src/pages/category/[slug].astro`: **category cơ bản** (bài trong category).
- Render theo ADR-0006.

### Phase 5 — Vertical Slice Verify + Completion
- **Seed dev** (chỉ dữ liệu dev, **không dữ liệu blog thật**): 1 author, 1 category, 1 post *published* + 1 post *draft* để kiểm thử.
- **E2E:** tạo/publish trong Directus → reader thấy ở list/detail/category; **draft KHÔNG hiển thị**.
- **Fresh-clone reproducibility:** schema snapshot áp dụng được trên clone sạch.
- **Sprint 2 Completion Report**.

## 4. File sẽ thay đổi

**Tạo mới:**
- `docs/adr/0006-render-strategy.md`
- `services/directus/snapshots/schema.(yaml|json)` (content model as-code)
- `services/directus/seed/` (dữ liệu mẫu dev — tuỳ chọn script)
- `apps/web/src/lib/directus.ts`, `apps/web/src/lib/types.ts`
- `apps/web/src/layouts/Base.astro`
- `apps/web/src/pages/posts/[slug].astro`, `apps/web/src/pages/category/[slug].astro`
- `docs/sprints/sprint-2-completion-report.md`

**Sửa:**
- `apps/web/src/pages/index.astro` (plumbing → danh sách bài)
- `apps/web/astro.config.mjs` (theo ADR-0006; nếu SSR: `output: 'server'` + adapter)
- `apps/web/package.json` (adapter nếu chọn SSR)
- `docker-compose.yml` / `package.json` scripts (thêm `schema:apply`, `seed` nếu cần)
- **Docs (impl/LÕI-hoàn-thiện):** `03d-api-contract.md` (PostDetail…), `05-cms.md`, `06-api.md`, `10a-tech-stack.md` (+render strategy, +adapter), `10-decisions.md` (Decision Log), `07-ui-ux.md` (layout tối thiểu)

## 5. Database / CMS changes

- **Collections mới** (Directus → tạo bảng trong PostgreSQL): `posts`, `authors`, `categories`; + field tuỳ biến `alt`/`caption` trên `directus_files`.
- **Quan hệ:** posts.author→authors, posts.category→categories, posts.cover→directus_files, categories.parent→categories.
- **Roles/permissions:** Admin, Editor, Public (filter published).
- **Schema-as-code:** snapshot commit vào git; áp dụng bằng `directus schema apply` khi setup (sau khi Directus healthy).
- Dữ liệu nằm ở named volume `pgdata` (Sprint 1). Đây là **thay đổi schema đầu tiên** của dự án.

## 6. Acceptance Criteria

- [ ] Directus có collections `posts`/`authors`/`categories` + Media(alt) đúng field & quan hệ theo [03c](../03c-content-model.md) (không Tag).
- [ ] Roles **Admin/Editor** cấu hình đúng; **Public chỉ đọc published** (test: draft **không** ra API/agent public).
- [ ] Editor tạo được Post (author+category+cover), đặt `published` → có `published_at`.
- [ ] Astro **list** hiển thị bài published (mới nhất trước), ẩn draft.
- [ ] Astro **detail** (`/posts/<slug>`) render body/author/category/cover(alt).
- [ ] Astro **category** (`/category/<slug>`) liệt kê bài trong chuyên mục.
- [ ] **E2E:** publish trong Directus → reader thấy trên Astro (local, qua `astro dev`).
- [ ] Không có Tag/Search/Comment/Analytics/Dark mode/auth-frontend.
- [ ] Schema **reproducible** trên fresh clone (snapshot apply).
- [ ] **ADR-0006** (render strategy) đã tạo & Accepted; 03d hoàn thiện (Decision Log).
- [ ] Astro chỉ phụ thuộc **DTO của contract** (03d), không phụ thuộc nội bộ Directus (P3).

## 7. Risk

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| **Lộ draft** qua Public permission sai | Bảo mật/nội dung | Filter `status=published` tường minh + test draft-không-hiển-thị ([12](../12-security.md)) |
| Schema-as-code áp dụng sai thứ tự (Directus chưa sẵn sàng) | Fresh setup fail | `schema apply` sau khi Directus healthy; tài liệu hoá bước |
| Coupling Astro ↔ Directus nội bộ | Khó thay CMS (P2) | Thin client map DTO 03d; frontend chỉ thấy DTO |
| Render strategy: static build không cập nhật khi publish | Reader không thấy bài mới (prod) | ADR-0006 ghi rõ dev=live/prod=rebuild-on-publish (tương lai) |
| Media/asset Public access | Ảnh không hiển thị hoặc lộ file | Cấp quyền read `directus_files` cho Public đúng mức |
| Thay đổi LÕI (03d) | Governance | Hoàn thiện theo 03c, Decision Log, review qua plan này |

## 8. Migration / Rollback consideration

- **Forward:** content model qua Directus schema snapshot (`directus schema apply`) → tạo bảng trong PG. Additive (collections mới), không migrate dữ liệu cũ (chưa có).
- **Rollback:**
  - Revert snapshot trong git + `directus schema apply` bản trước, **hoặc** xoá collections mới trong Directus.
  - Dev: `docker compose down -v` xoá sạch `pgdata` (mất dữ liệu — chỉ dùng local).
  - Trước khi áp schema trên môi trường có dữ liệu: **backup volume `pgdata`** ([13-operations](../13-operations.md)).
- **Reproducibility:** snapshot là nguồn tái lập; commit cùng code để mọi môi trường đồng bộ.
- Mỗi phase = 1 commit trên `main`; có thể revert theo phase nếu cần.

---

> 🛑 **Chưa code.** Chờ bạn review plan (đặc biệt **§3 Phase 0**: lựa chọn render strategy cho ADR-0006, và việc hoàn thiện 03d). Sau khi duyệt, tôi bắt đầu Phase 0.
