# 🏁 Sprint 2 — Completion Report

> **Ngày:** 2026-07-22 · **Sprint:** 2 — Vertical Slice (MVP nội dung / Roadmap **M2**) · **Trạng thái:** 🟢 **HOÀN THÀNH**

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

## 3. Acceptance Criteria (từ Kế hoạch §6)

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


---

## Phụ lục — Kế hoạch ban đầu


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
- `docs/sprints/sprint-2.md`

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
