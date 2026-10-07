# 🏁 Sprint 5 — Completion Report (Reader Completeness: Pagination + SEO baseline)

> **Ngày:** 2026-07-22 · **Sprint:** 5 — Reader Completeness · **Trạng thái:** 🟢 **HOÀN THÀNH** (chờ Product review đóng sprint)
> 🔗 [10-decisions `[S5-*]`](../10-decisions.md) · [15-seo-accessibility](../15-seo-accessibility.md) · [06-api](../06-api.md) · [07-ui-ux](../07-ui-ux.md)

---

## 1. Mục tiêu đạt được

Hoàn thiện **trải nghiệm reader** để đạt mốc *MVP-reader*: độc giả **đọc được mọi bài published** (phân trang homepage + category) và trang **chia sẻ/được index** (SEO baseline: OpenGraph/Twitter/canonical + sitemap + robots).

**Chỉ chạm Reader** (`apps/web` + config + docs). **KHÔNG** đổi Content Model / API Contract / DTO / thin client — pagination dùng ngữ nghĩa `PageInfo` sẵn có, SEO dùng field DTO sẵn có. Không thêm feature ngoài Pagination + SEO baseline.

## 2. Các phase (mỗi phase 1 commit)

| Phase | Commit | Nội dung |
|---|---|---|
| Plan | `3010892` | Planning review + Implementation Plan (đã duyệt: pageSize=10, JSON-LD stretch, UI-1 giữ backlog) |
| P0 — Decisions | `b3bbdbf` | Route `/page/[page]` (tránh chiếm namespace gốc) · sitemap policy = canonical-only, endpoint tự viết |
| P1 — Pagination | `0a1ed21` | `Pagination.astro` + `PostListView.astro` + route home/category page 2+ + CSS; a11y (rel prev/next, biên disabled) |
| P2 — SEO baseline | `c868f87` | `Base.astro` OG/Twitter/canonical (self-ref) · `sitemap.xml`/`robots.txt` endpoint · `PUBLIC_SITE_URL` → `Astro.site` |
| P3 — Verify + Report | _(commit này)_ | build verification + regression + CDP overflow/a11y + screenshots + báo cáo này |

## 3. Acceptance Criteria (từ Kế hoạch §6 (phụ lục bên dưới))

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | **Pagination**: từ `/` và `/category/<slug>` tới được **mọi bài published** qua Trước/Sau; `Trang X/Y` đúng; biên xử lý đúng; category rỗng vẫn empty-state | ✅ **reach-all 96/96** qua 10 trang home; biên trang 1/10 disabled non-nav; `networking` rỗng → empty-state |
| 2 | **A11y pagination**: `<nav aria-label>`, `rel=prev/next`, disabled ở biên, bàn phím dùng được; **không overflow @390** | ✅ nav landmark; link chỉ khi có target, biên = `span[aria-disabled]`; **overflow @390 = 0** mọi trang pagination |
| 3 | **SEO**: mỗi trang `og:title/description/type/url` (+`og:image` khi có cover) · Twitter card · **canonical đúng** | ✅ canonical **self-referencing** mọi loại trang; og:type `article`/`website`; og:image verify (§6) |
| 4 | **sitemap.xml** liệt kê **đủ** URL published (posts + categories + home); **robots.txt** trỏ sitemap | ✅ **111 loc** (1 home + 96 posts + 14 categories); robots trỏ `Sitemap:` tuyệt đối |
| 5 | **Không hồi quy**: detail/list/category render đúng; a11y (S3) + responsive giữ; **draft ẩn**; `astro build` không lỗi | ✅ build **123 trang** + 2 endpoint; draft `ghi-chu-noi-bo` → 404 & không trong sitemap; overflow/a11y giữ nguyên |
| 6 | **Không đổi** Content Model/API/DTO/thin-client: `03c`/`03d`/`03e`/`types.ts`/`directus.ts` không trong diff | ✅ xác nhận qua `git status` cả 2 phase — chỉ Reader + config + docs |

## 4. Verification (Phase 3)

**Build:** `pnpm build` (rebuild sạch) → **123 trang** + `/sitemap.xml` + `/robots.txt` (endpoints prerender), không lỗi.
Chi tiết: index (1) + home page 2–10 (9) + `/posts/*` (96) + `/category/*` (14) + category page 2+ (3).

**Regression (route, dev server):**

| Đường dẫn | Kết quả | Ý nghĩa |
|---|---|---|
| `/`, `/page/2`, `/page/10` | 200 | phân trang home |
| `/page/999` | 404 | ngoài biên → không tạo route |
| `/category/cpu`, `/category/cpu/page/2` | 200 | phân trang category |
| `/category/networking` | 200 | category rỗng → empty-state |
| `/posts/cpu-04` | 200 | detail |
| `/posts/ghi-chu-noi-bo` (draft) | 404 | **draft ẩn** (+ không trong sitemap) |
| `/sitemap.xml`, `/robots.txt` | 200 | endpoints |

> ⚠️ **Lưu ý dev:** `astro dev` không hot-reload route/endpoint **mới tạo** trên volume mount Windows→Docker → cần `docker compose restart web` để nhận `sitemap.xml`/`robots.txt` (bản build tĩnh `dist/` đã đúng ngay). Đã ghi nhận ở Sprint trước (getStaticPaths cache theo session).

**Reach-all:** gom `href="/posts/…"` từ `dist` (home + page/2..10) → **96 unique = 96 bài đã build**, không bài nào bị kẹt (không hồi quy Phase 1).

**CDP (overflow + a11y):**
- **Overflow @390 = 0** trên home/pagination/category/detail + edge/stress (`stress-wide-table`, `stress-huge-code`, `stress-long-markdown`, `edge-deep-nested-list`, `edge-unicode`, `edge-long-title`, `edge-image-only`). Ngoại lệ **duy nhất**: `edge-long-word` = 54px → **UI-1 đã biết** (Visual Backlog, không phải hồi quy).
- **A11y:** skip-link ✓ · đúng **1 `<h1>`/trang** · `main#main` landmark ✓ · `nav[aria-label]` (2 trên trang list = điều hướng chính + phân trang; 1 trên detail) · `lang=vi`.

**Screenshots:** [assets/sprint-5-phase-3/](./assets/sprint-5-phase-3/) — home desktop+mobile, category, detail.

## 5. Chính sách robots.txt (chốt cuối)

Nội dung `robots.txt` (endpoint sinh, địa chỉ tuyệt đối theo `PUBLIC_SITE_URL`):

```
User-agent: *
Allow: /

Sitemap: http://localhost:4321/sitemap.xml
```

- **Chính sách:** **Allow toàn bộ** (`Allow: /`), **KHÔNG** `Disallow` bất kỳ đường dẫn nào — blog public, mọi trang (kể cả pagination) đều nên crawl được để độc giả/máy tìm tới mọi bài.
- **Sitemap** trỏ tuyệt đối tới `sitemap.xml`. Domain hiện là dev (`localhost:4321`); **chốt domain thật ở Sprint 6** bằng cách đổi 1 biến `PUBLIC_SITE_URL`.
- **Không mâu thuẫn với sitemap canonical-only:** sitemap chỉ *đề xuất* URL canonical để tập trung crawl; robots *không cấm* pagination → pagination vẫn crawl được, và index nhờ **canonical self-referencing** (mỗi trang pagination trỏ chính nó, không bị gộp về trang 1).

## 6. Ghi chú xác minh og:image (dọn dẹp)

Dataset fixture hiện dùng cover provider `none` → **không bài nào có cover** → `og:image` (conditional) không phát sinh — đúng hành vi thiết kế.

Để **chứng minh thực nghiệm** code path khi *có* cover, Phase 2 dùng **một trang test tạm** (`ogtest.astro`) truyền `image` giả:
- Kết quả: render `og:image` + `twitter:image` (URL asset tuyệt đối) + `twitter:card = summary_large_image`. ✅
- **Trang test đã được XOÁ và rebuild sạch trước khi hoàn tất Phase 2** — `dist/` không còn `ogtest/`, không lọt vào commit `c868f87`. (Xác nhận lại ở Phase 3: không có `ogtest` trong repo/dist.)

## 7. Ranh giới (đóng băng — xác nhận qua diff)

**KHÔNG** trong diff Sprint 5: `docs/03c/03d/03e` (LÕI), `apps/web/src/lib/directus.ts` (thin client), `apps/web/src/lib/types.ts` (DTO), `services/directus/**` (schema/permissions/seed/fixtures), `docker-compose.yml`.

**Đã chạm** (đúng phạm vi): `apps/web/src/{layouts,components,pages,styles}` (pagination + SEO head + endpoints), `apps/web/astro.config.mjs` (`site`), `.env.example` (`PUBLIC_SITE_URL`), docs (`06`/`07`/`10`/`15`/`README` + sprint docs).

## 8. Remaining Backlog (chuyển tiếp)

| Hạng mục | Trạng thái | Sprint dự kiến |
|---|---|---|
| **Deployment & Public MVP** (domain thật cho `PUBLIC_SITE_URL`, TLS/hosting, rebuild-on-publish) | Chưa làm | **Sprint 6** |
| **JSON-LD** `BlogPosting` (structured data) | Stretch, chưa làm (ngoài AC S5) | Sprint 6/7 (SEO nâng cao) |
| **UI-1** — từ-siêu-dài tràn ngang (`overflow-wrap`) | Visual Backlog | Visual Polish |
| Paper materiality (grain/crease procedural) | Design Backlog | Visual Polish |
| Hardening (sanitize HTML, security headers, CWV, CI) | Chưa làm | Sprint 7 |
| RSS/Atom feed · Search · Tag · Comments · Analytics · Dark mode · i18n | Future | — |

## 9. Kết luận

Sprint 5 hoàn tất đúng phạm vi: **pagination reach-all** + **SEO baseline** thực thi được, verify đầy đủ (build/regression/overflow/a11y), **không hồi quy** và **không phá ranh giới** LÕI/hợp đồng. Sản phẩm sẵn sàng cho **Sprint 6 — Deployment & Public MVP** (chỉ cần chốt `PUBLIC_SITE_URL` domain thật + hạ tầng).

> ⏸️ **Dừng chờ Product review Sprint 5** trước khi bắt đầu Sprint 6.


---

## Phụ lục — Kế hoạch ban đầu


>
> 🎯 **Mục tiêu Sprint 5:** hoàn thiện **trải nghiệm reader** để đạt MVP-reader — độc giả **đọc được mọi bài published** (phân trang) và trang **chia sẻ/tìm thấy được** (SEO cơ bản).
> 🔗 **Nguồn:** Sprint 5 Planning (tài liệu planning đã gộp vào lịch sử git) (roadmap đã duyệt) · [01a-mvp-scope](../01a-mvp-scope.md) (NFR SEO/responsive) · [03d-api-contract §4](../03d-api-contract.md) (phân trang — ĐÓNG BĂNG) · [06-api](../06-api.md) · [15-seo-accessibility](../15-seo-accessibility.md) · [ADR-0006](../adr/0006-render-strategy.md) (SSG).

---

> 📌 **Roadmap Principle:** Sprint này **tiến gần Public MVP đo lường được** — *pagination* (đọc hết bài) + *SEO cơ bản* (chia sẻ/index) là các mảnh **Must** của Launch.

> 🔒 **Ranh giới:** Sprint 5 **thay đổi Reader** (`apps/web`) — đó là mục tiêu. Nhưng **KHÔNG** đổi **Content Model** ([03c](../03c-content-model.md)), **API Contract** ([03d](../03d-api-contract.md)), **DTO** (`types.ts`), **thin client hợp đồng** (`directus.ts`) — pagination dùng `listPublishedPosts`/`listPostsByCategory` (đã trả `PageInfo{total,page,pageSize,hasMore}`) sẵn có; SEO dùng field DTO sẵn có (title/excerpt/cover/publishedAt/author). **Không** thêm content type/field; **không** feature ngoài Pagination + SEO baseline.

## 1. Goal

- **Pagination UI**: homepage & category phân trang → độc giả tới được **mọi bài published** (hiện chỉ trang đầu ≤ pageSize). Dùng ngữ nghĩa phân trang **đã có** ở [03d §4](../03d-api-contract.md).
- **SEO baseline**: mỗi trang có `<title>`/meta (đã có) + **OpenGraph/Twitter card**, **canonical**; site có **`sitemap.xml`** + **`robots.txt`**. Link chia sẻ đẹp, site index được.

## 2. Ảnh hưởng (đóng băng đúng ranh giới)

| Khía cạnh | Ảnh hưởng |
|---|---|
| **Content Model** ([03c](../03c-content-model.md)) | ❌ Không |
| **API Contract / DTO** ([03d](../03d-api-contract.md), `types.ts`) | ❌ Không — dùng `PageInfo` & field DTO sẵn có |
| **Thin client** (`directus.ts`) | ❌ Không đổi hợp đồng (dùng `listPublishedPosts`/`listPostsByCategory`) |
| **Architecture** | ❌ Không (SSG như ADR-0006; +integration sitemap là adapter build) |
| **Reader** (`apps/web` pages/components/layout/CSS/config) | ✅ **Có** — đây là phạm vi sprint |

## 3. Scope

### 3.1. Pagination (Reader)
- **pageSize = 10** ([03d §4](../03d-api-contract.md) mặc định) — nhiều trang để phân trang có ý nghĩa. *(Product chỉnh được.)*
- **Homepage**: page 1 = `/`; page 2+ phân trang (**cấu trúc route chốt ở Phase 0** — `[...page]` vs `/page/[page]`) qua `getStaticPaths` gọi `listPublishedPosts({page,pageSize})` (build-time). Thứ tự mới-nhất-trước giữ nguyên.
- **Category**: page 1 = `/category/[slug]`; page 2+ phân trang (cấu trúc chốt Phase 0) qua `listPostsByCategory`.
- **Pagination component** (`Pagination.astro`): Trước/Sau + chỉ báo trang (`Trang X/Y`); a11y (`<nav aria-label>`, `rel=prev/next`, disabled ở biên); responsive; dùng design tokens.

### 3.2. SEO baseline (Reader/head + build)
- **Base.astro head**: OpenGraph (`og:title/description/type/url` + `og:image` từ cover khi có) · Twitter card · **canonical**. Cần **site URL** (biến `PUBLIC_SITE_URL`/`astro.config site`; tạm dev, chốt thật ở Sprint 6 deploy).
- **`sitemap.xml`**: dùng `@astrojs/sitemap` (tự sinh từ route đã build: home + pagination + posts + categories). *(Hoặc endpoint tự viết — Phase 0 chốt.)*
- **`robots.txt`** (`public/robots.txt`) trỏ tới sitemap.
- **(stretch — KHÔNG vào Acceptance Criteria, không mở rộng scope)** JSON-LD `BlogPosting` ở detail (title/excerpt/author/publishedAt).

## 4. Out of scope
- ❌ Đổi **Content Model / API / DTO / thin client hợp đồng**; thêm content type/field.
- ❌ **Search · RSS · Analytics · Tag · Comments · Dark mode · i18n** (Future).
- ❌ **Deployment/TLS/hosting** (Sprint 6) — chỉ chuẩn bị SEO/site-URL biến; **rebuild-on-publish** (Sprint 6).
- ❌ **Hardening** (sanitize/headers/CWV/CI) — Sprint 7.
- ❌ Tối ưu ảnh (srcset), infinite scroll, load-more JS (SSG tĩnh — phân trang bằng route).
- ❌ **UI-1** (từ-siêu-dài `overflow-wrap`) — giữ **Visual Backlog**, **không** xử lý Sprint 5.

## 5. Phase breakdown

> Sprint-gated: mỗi phase 1 commit trên `main`, dừng chờ review.

### Phase 0 — Decisions
- **Xác minh route pagination:** đánh giá `[...page]` (catch-all) vs `/page/[page]` — **đảm bảo không conflict route tương lai**; chọn cấu trúc an toàn. → Decision Log.
- **Chốt sitemap policy:** include **pagination URLs** hay **chỉ canonical content URLs** (home + post + category trang-1). → Decision Log.
- Xác nhận: **`pageSize=10`** (giữ); nguồn **site URL** (biến `PUBLIC_SITE_URL`); sitemap (`@astrojs/sitemap` vs endpoint); **JSON-LD = stretch — KHÔNG vào Acceptance Criteria, không mở rộng scope**; **UI-1 giữ Visual Backlog (không xử lý Sprint 5)**. → Decision Log. *(Chưa code.)*

### Phase 1 — Pagination (homepage + category)
- Route + `getStaticPaths` (dùng thin client sẵn có) + `Pagination.astro` + CSS + a11y (`rel prev/next`, `aria`).
- Verify: **mọi bài published tới được**; thứ tự đúng; category rỗng/nhiều trang OK; không hồi quy.

### Phase 2 — SEO baseline
- Base.astro OG/Twitter/canonical (+ `site` config); `@astrojs/sitemap`; `public/robots.txt`; (stretch) JSON-LD.
- Verify: OG/canonical đúng mỗi trang; sitemap liệt kê **đủ** published + category + pagination; robots hợp lệ.

### Phase 3 — Verify + Sprint 5 Completion
- `astro build` (đếm trang gồm pagination) qua fixture ~100 bài; verify pagination reach-all + SEO + a11y/responsive không hồi quy (CDP); screenshot desktop+mobile (pagination). **Sprint 5 Completion Report**.

## 6. Acceptance Criteria
- [ ] **Pagination**: từ `/` và `/category/<slug>`, độc giả **tới được mọi bài published** qua Trước/Sau; `Trang X/Y` đúng; biên (trang đầu/cuối) xử lý đúng; **category rỗng** vẫn empty-state.
- [ ] **A11y pagination**: `<nav aria-label>`, `rel=prev/next`, trạng thái disabled, bàn phím dùng được; **không overflow** @390.
- [ ] **SEO**: mỗi trang có `og:title/description/type/url` (+`og:image` khi có cover) · Twitter card · **canonical** đúng.
- [ ] **sitemap.xml** liệt kê **đủ** URL published (posts + categories + pagination + home); **robots.txt** trỏ sitemap.
- [ ] **Không hồi quy**: detail/list/category render đúng; a11y (Sprint 3) + responsive giữ nguyên; **draft ẩn**; `astro build` không lỗi (đếm trang tăng theo pagination).
- [ ] **Không đổi** Content Model/API/DTO/thin-client: `03c`/`03d`/`03e`/`types.ts`/`directus.ts` (hợp đồng) **không** trong diff.

## 7. Risks
| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| `getStaticPaths` phân trang N fetch build-time (chậm khi rất nhiều bài) | Build lâu hơn | Fetch theo trang; đã có perf baseline (S4); pageSize hợp lý |
| **Site URL chưa có** (chưa deploy) cho canonical/OG/sitemap | SEO chưa chuẩn tuyệt đối | Dùng biến `PUBLIC_SITE_URL` (tạm dev) — **chốt domain thật ở Sprint 6**; tài liệu hoá phụ thuộc |
| `@astrojs/sitemap` là dependency/integration mới | Rủi ro build | Dùng bản ổn định; hoặc endpoint tự viết (Phase 0 chốt) |
| Đổi cấu trúc route (index → `[...page]`) | Hồi quy homepage/category | Verify kỹ + screenshot; giữ URL page-1 = `/` và `/category/<slug>` |
| Vô tình chạm DTO/hợp đồng | Vỡ ranh giới | Dùng hàm client sẵn có; freeze `types.ts`/`03d` |

## 8. File dự kiến thay đổi

**Tạo mới:**
- Route phân trang home + category (tên file theo **quyết định route ở Phase 0**: `[...page]` hoặc `/page/[page]`).
- `apps/web/src/components/Pagination.astro`.
- `apps/web/public/robots.txt`.
- `docs/sprints/sprint-5.md` (cuối sprint).

**Sửa:**
- `apps/web/src/layouts/Base.astro` (SEO head: OG/Twitter/canonical; nhận thêm `image`/`path`).
- `apps/web/astro.config.mjs` (`site` + integration `@astrojs/sitemap`).
- `apps/web/package.json` (`@astrojs/sitemap`).
- `apps/web/src/styles/global.css` (style pagination).
- `.env.example` (`PUBLIC_SITE_URL`).
- **Docs:** `docs/06-api.md` (ghi pagination binding — dùng hợp đồng sẵn có) · `docs/15-seo-accessibility.md` (SEO baseline) · `docs/07-ui-ux.md` (Pagination component) · `docs/10-decisions.md` (`[S5-*]`) · `README.md`.

**KHÔNG đổi (đóng băng):**
- `docs/03c-content-model.md`, `docs/03d-api-contract.md`, `docs/03e-data-model.md` (LÕI).
- `apps/web/src/lib/directus.ts` (hợp đồng), `apps/web/src/lib/types.ts` (DTO).
- `services/directus/**` (schema/permissions/seed/fixtures), `docker-compose.yml`.

---

> ✅ **Đã duyệt kèm điều chỉnh** (pageSize=10; Phase 0 xác minh route + chốt sitemap policy; JSON-LD chỉ stretch/không AC; UI-1 giữ backlog). **Commit plan → bắt đầu Phase 0** (decisions), dừng chờ review theo từng phase.
