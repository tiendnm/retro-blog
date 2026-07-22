# 🏁 Sprint 5 — Completion Report (Reader Completeness: Pagination + SEO baseline)

> **Ngày:** 2026-07-22 · **Sprint:** 5 — Reader Completeness · **Trạng thái:** 🟢 **HOÀN THÀNH** (chờ Product review đóng sprint)
> **Kế hoạch nguồn:** [sprint-5-implementation-plan.md](./sprint-5-implementation-plan.md) · **Planning/Roadmap:** [sprint-5-planning.md](./sprint-5-planning.md) · **Nhánh:** `main` (mỗi phase 1 commit)
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

## 3. Acceptance Criteria (từ [Plan §6](./sprint-5-implementation-plan.md))

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
