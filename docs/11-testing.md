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
| Integration | Build Astro với Directus thật + seed | CI (Phase 3) | ⏳ |
| E2E | Luồng người dùng thật | _(vd Playwright)_ | Backlog |
| Chuyên biệt | a11y (axe), Lighthouse, link-check | TBD | Backlog |

## 3. Phạm vi theo loại

- **Thin client `directus.ts`** (`apps/web/tests/directus-client.test.ts`): clamp page/pageSize, `hasMore`/`total`, mapping DTO + null-handling, không rò field thô, `DirectusError` (401/403/404 → `not_found` → `null`; 5xx/lỗi mạng → `system`), hợp đồng request (không `Authorization`, không `fields=*`, slug encode), site settings (fallback, `{year}`).
- **Helper thuần** (`tests/lib.test.ts`): `sanitizeBody` (XSS, allowlist, `rel` cho `_blank`, class `language-*`), `rewriteAssetUrls`, `formatDate`.
- **Chưa phủ:** logic nằm trong `.astro` (cửa sổ phân trang `Pagination.astro`, JSON-LD ở `posts/[slug].astro`) — muốn test cần tách thành module `.ts`, là refactor nên để Backlog.
- **Directus schema/permission:** kiểm bằng script/seed + smoke thủ công (chưa tự động).
- **Accessibility / Performance:** xem [15](./15-seo-accessibility.md); công cụ tự động ở Backlog.

## 4. Dữ liệu & Fixtures

- Test đơn vị dùng dữ liệu inline, ổn định, không phụ thuộc Directus. Dataset lớn dùng cho dogfooding: `services/directus/fixtures/` ([DESIGN](../services/directus/fixtures/DESIGN.md)).

## 5. Môi trường test & CI

- Cục bộ: `pnpm --dir apps/web test` (Node 22). CI (`.github/workflows/ci.yml`): job `quality` chạy `lint → format → typecheck → test`; job `build` dựng Directus + seed rồi `astro build` — xem [08 §3](./08-deployment.md).

## 6. Mục tiêu độ phủ (Coverage)

- Không đặt ngưỡng số. Coverage là chỉ báo; ưu tiên phủ các nhánh lỗi/biên của thin client và sanitize.

## 7. Kiểm thử thủ công & QA nội dung

- Thay đổi UI: build preview + smoke route + screenshot ([17 §2](./17-contributing.md)).
- Editor kiểm bài ở Directus trước publish (draft không lộ; bài hiện sau rebuild).

## 8. Định nghĩa "test đạt"

- `pnpm test` xanh cùng `lint`, `format:check`, `typecheck`, và `build` ([14 §4](./14-quality-gates.md)).
