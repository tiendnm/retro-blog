# 11 — Testing Strategy

> 🎯 **Mục đích:** Xác định *cách chúng ta biết phần mềm đúng* — các tầng test, phạm vi, công cụ và cổng chất lượng.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [09-coding-standards](./09-coding-standards.md) · [14-quality-gates](./14-quality-gates.md) · [ADR-0009](./adr/0009-quality-tooling-biome-vitest.md)

---

## 1. Triết lý kiểm thử

- Test để tự tin refactor và phát hành; **test hành vi / hình dạng DTO ([03d](./03d-api-contract.md)), không bám chi tiết cài đặt** (vd không assert cú pháp query Directus ngoài những gì là hợp đồng: field allowlist, slug encode, không gửi token).
- Test chạy nhanh, không cần Docker/Directus: mock `fetch`, không gọi mạng.
- Test phải **thật sự bắt được lỗi**: khi viết test mới, thử phá code (đột biến) để chắc test chuyển đỏ.

## 2. Kim tự tháp test (Test Pyramid)

| Tầng | Kiểm thử gì | Công cụ | Trạng thái |
|---|---|---|---|
| Unit | Logic thuần ở `apps/web/src/lib` | **Vitest** | ✅ Sprint 7 Phase 2 |
| Contract | Thin client ⇄ DTO ([03d](./03d-api-contract.md)) với `fetch` mock | **Vitest** | ✅ Sprint 7 Phase 2 |
| Integration | Build Astro với Directus thật + seed; **quyền Public** và **luồng publish → build** | CI job `build` + `scripts/integration/` (`node:test`) | ✅ Sprint 7 Phase 3 · quyền/publish: Sprint 11 |
| E2E | Luồng người dùng thật trên `dist/` (điều hướng, phân trang, tìm kiếm, lightbox, 404, bàn phím) | **Playwright** (Chromium; desktop + mobile) — `e2e/` | ✅ Sprint 11 |
| Chuyên biệt | a11y (axe, WCAG 2.2 AA) · Lighthouse (mobile) · link/sitemap/canonical/RSS | `@axe-core/playwright` · **Lighthouse CI** · `scripts/check-site.mjs` | ✅ Sprint 11 (job `site-checks`, chưa bắt buộc — Sprint 13) |

## 3. Phạm vi theo loại

- **Thin client `directus.ts`** (`apps/web/tests/directus-client.test.ts`): clamp page/pageSize, `hasMore`/`total`, mapping DTO + null-handling, không rò field thô, `DirectusError` (401/403/404 → `not_found` → `null`; 5xx/lỗi mạng → `system`), hợp đồng request (không `Authorization`, không `fields=*`, slug encode), site settings (fallback, `{year}`).
- **Helper thuần** (`tests/lib.test.ts`): `sanitizeBody` (XSS, allowlist, `rel` cho `_blank`, class `language-*`), `rewriteAssetUrls`, `formatDate`.
- **Độ bền thin client** (`tests/directus-resilience.test.ts`, Sprint 11): 5xx / lỗi mạng / **JSON hỏng** / phản hồi chậm (**timeout 15 s**, `AbortSignal.timeout`) → `DirectusError` `system` không rò chi tiết; danh sách rỗng; getter theo slug → `null`.
- **Logic nằm trong `.astro`** (cửa sổ phân trang `Pagination.astro`, JSON-LD ở `posts/[slug].astro`): chưa có unit test (muốn có phải tách thành module `.ts` — refactor, Backlog). Được phủ gián tiếp bằng E2E (phân trang) và `check-site` (JSON-LD parse được).
- **Site đã build — `scripts/check-site.mjs`** (Node thuần, có test `scripts/check-site.test.mjs`): link/ảnh nội bộ trỏ tới file có thật; sitemap ⇄ `dist/`; canonical khớp URL; `rss.xml` XML hợp lệ + mục trỏ tới trang có thật; JSON-LD parse được; khi site HTTPS thì không còn `localhost`/`http://`. Link ngoài chỉ liệt kê (không kiểm — dễ flaky).
- **E2E + a11y (`e2e/`)**: `serve.mjs` phục vụ `dist/` (404 đúng mã, **CSP giống Caddyfile**, ảnh Directus được ghi đè về cùng nguồn) nên **không cần Directus**. `pages.spec` (mỗi loại trang: không lỗi console/CSP/request hỏng/tràn ngang), `navigation.spec`, `search.spec`, `lightbox.spec` (hồi quy `f754767`), `a11y.spec` (axe: **0 serious/critical**; moderate/minor ghi log; bàn phím: skip-link, focus nhìn thấy, tìm kiếm). Trang mẫu lấy từ `sitemap.xml`, không bám slug seed.
- **Lighthouse CI** (`e2e/lighthouserc.cjs`, preset mobile): ngân sách ở mức `warn` — Performance ≥ 0,90 · Accessibility ≥ 0,95 · SEO ≥ 0,95 (trừ `/search`, `noindex` chủ đích) · Best Practices ≥ 0,90 · script ≤ 20 KB. Số baseline: [sprint-11](./sprints/sprint-11.md#kết-quả).
- **Directus permission** (`scripts/integration/permissions.test.mjs`): với vai Public — nháp / `published_at` tương lai không đọc được (theo slug, id, dò `filter[status]`), `fields=*` chỉ trả trường trong allowlist (kể cả quan hệ lồng), `/users` và các bề mặt hệ thống bị từ chối, không ghi được. **Đây là test của cấu hình, không đổi quyền; đỏ vì lộ dữ liệu → dừng và báo Product.**
- **Luồng publish → build** (`scripts/integration/publish-flow.test.mjs`): nháp / hẹn giờ không vào `dist/`·sitemap·rss·search-index; đặt `published` thì có; gỡ thì biến mất (dựng thật bằng `astro build --outDir`).
- **Accessibility / Performance:** xem [15 §B3](./15-seo-accessibility.md).

## 4. Dữ liệu & Fixtures

- Test đơn vị dùng dữ liệu inline, ổn định, không phụ thuộc Directus. Dataset lớn dùng cho dogfooding: `services/directus/fixtures/` ([DESIGN](../services/directus/fixtures/DESIGN.md)).

## 5. Môi trường test & CI

- Cục bộ: `pnpm --dir apps/web test` (Node ≥22.23.4; `.nvmrc` 26). CI (`.github/workflows/ci.yml`): job `quality` chạy `lint → format → typecheck → test` (+ test hạ tầng và `check-site`); job `build` dựng Directus + seed (minimal + showcase) rồi `astro build`, chạy test quyền Public / luồng publish và đẩy `dist/` làm artifact; job `site-checks` (cần `dist`) chạy `check-site` → Playwright + axe → Lighthouse — xem [08 §3](./08-deployment.md).
- Chạy cục bộ **site-checks** (sau khi có `apps/web/dist` build với `PUBLIC_SITE_URL=https://blog.example.test` và `PUBLIC_DIRECTUS_URL=https://cms.example.test`):
  `node scripts/check-site.mjs apps/web/dist` · `cd e2e && pnpm install --frozen-lockfile --ignore-workspace && pnpm exec playwright install chromium && pnpm test` · Lighthouse: đặt `CHROME_PATH` (vd Chromium của Playwright) rồi `pnpm lighthouse`; `node lh-summary.mjs` in bảng.
- Chạy cục bộ **test tích hợp** (cần Directus + schema + permissions + seed đang chạy; đặt `DIRECTUS_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DIRECTUS_INTERNAL_URL`): `node --test --test-concurrency=1 scripts/integration/` (**tuần tự**: các file dùng chung tiền tố bài thử).
- Trên Windows: Astro dùng `rename` nên `--outDir` phải cùng ổ đĩa với `apps/web` (test publish-flow tự đặt trong `node_modules/.cache`).

## 6. Mục tiêu độ phủ (Coverage)

- Không đặt ngưỡng số. Coverage là chỉ báo; ưu tiên phủ các nhánh lỗi/biên của thin client và sanitize.

## 7. Kiểm thử thủ công & QA nội dung

- Thay đổi UI: build preview + smoke route + screenshot ([17 §2](./17-contributing.md)).
- Editor kiểm bài ở Directus trước publish (draft không lộ; bài hiện sau rebuild).

## 8. Định nghĩa "test đạt"

- `pnpm test` xanh cùng `lint`, `format:check`, `typecheck`, và `build` ([14 §4](./14-quality-gates.md)); job `site-checks` xanh khi thay đổi ảnh hưởng trang xuất ra (chưa bắt buộc tới Sprint 13).
