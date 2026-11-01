# 09 — Coding Standards

> 🎯 **Mục đích:** Thống nhất *cách viết code* để mã nguồn nhất quán, dễ đọc, dễ review — giảm tranh luận về phong cách và tăng chất lượng. Bắt buộc phải chốt trước khi viết dòng code đầu tiên.
> 🔗 **Liên quan:** [11-testing](./11-testing.md) · [14-quality-gates](./14-quality-gates.md) · [17-contributing](./17-contributing.md)

---

## 1. Ngôn ngữ & phiên bản

- **Node:** 26 trong Docker (`node:26.13.0-alpine`, thử trọn pipeline 2026-11-01); CI cũng chạy Node 26. Astro 7 yêu cầu Node `>=22.23.4`. **Máy local cần Node ≥22.23.4** để chạy `astro`; nếu chưa có, chạy các lệnh kiểm tra trong container: `docker build -t retro-web apps/web && docker run --rm retro-web pnpm test`.
- **pnpm:** 10.33.2 (pin qua `packageManager`).
- **TypeScript:** 6.x (`^6.0.3`, nâng từ 5.9 qua Dependabot #19); Astro 7.x. Phiên bản thật luôn là `apps/web/package.json` + lockfile.
- **Công cụ chất lượng (Sprint 7):** **Biome** (lint+format) · **Vitest** (test) · **astro check** (typecheck) — quyết định ở [ADR-0009](./adr/0009-quality-tooling-biome-vitest.md).

## 2. Cấu trúc thư mục dự án

Tổ chức **theo layer** (không theo feature) — dự án nhỏ, ít tính năng độc lập.

```
apps/web/            site tĩnh (Astro); lockfile riêng, không dùng workspace
  src/pages/         route (list, bài, chuyên mục, thẻ, tác giả, lưu trữ, rss, sitemap, 404)
  src/layouts/       Base.astro (skip-link → Header → main → Footer)
  src/components/    component .astro dùng chung (PostCard, Pagination, CoverImage…)
  src/lib/           logic thuần + thin client: directus.ts (mọi truy cập CMS), types.ts (DTO), rss, json-ld, sanitize-body…
  src/scripts/       JS phía client (lightbox, search)
  src/styles/        global.css (toàn bộ CSS + token)
  tests/             unit/contract test (Vitest), fixture ở helpers.ts
e2e/                 Playwright + axe + Lighthouse CI (dùng trên dist/), lockfile riêng
services/directus/   snapshot schema, apply-permissions.sh, Flow (apply-*.mjs), seed/
services/ops/        backup, healthcheck, offsite, scheduler (container `ops`)
services/rebuild/    receiver rebuild-on-publish
scripts/             deploy/update/restore-drill, check-site, kiểm header Caddy
docs/                tài liệu (README.md điều hướng; adr/, sprints/, reviews/)
```

- **Quy tắc phụ thuộc:** `pages`/`components` không gọi CMS trực tiếp — chỉ qua `src/lib/directus.ts` (thin client, ranh giới port — [03d](./03d-api-contract.md)). Logic thuần tách ra `src/lib/` để test được; không logic nghiệp vụ trong `.astro`.

## 3. Quy ước đặt tên (Naming)

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component | PascalCase | `PostCard.astro` |
| Biến/hàm | camelCase | `getPosts()` |
| Hằng số | UPPER_SNAKE | `MAX_ITEMS` |
| File tiện ích / module trong `src/lib` | kebab-case | `sanitize-body.ts`, `rewrite-assets.ts` |
| File test | tên module + `.test.ts` (Vitest), đặt ở `apps/web/tests/` | `rss.test.ts` |
| Script CLI | kebab-case, đuôi `.mjs` (Node thuần) hoặc `.sh` | `check-site.mjs`, `restore-drill.sh` |

## 4. Style & Formatting

- **Công cụ = Biome** (formatter + linter một binary) — cấu hình `apps/web/biome.json` là **nguồn sự thật**, không tranh luận thủ công. ([ADR-0009](./adr/0009-quality-tooling-biome-vitest.md).)
- **Style:** thụt 2 space · nháy đơn · semicolons luôn có · trailing comma `all` · lineWidth 100.
- **Scripts** (`apps/web`): `pnpm lint` (Biome lint) · `pnpm format` (ghi) · `pnpm format:check` (kiểm, dùng ở CI) · `pnpm typecheck` (astro check).
- **Rule tắt có chủ đích:** `complexity/noImportantStyles` — cho phép `!important` hợp lệ trong reset `prefers-reduced-motion` (a11y).
- **Giới hạn hiện tại:** Biome **chưa** định dạng file `.astro` (13 file) → `.astro` chỉ được **type-check** qua `astro check`; lint `services/*.mjs` là follow-up (xem Deferred Backlog Sprint 7).

## 5. TypeScript / Kiểu dữ liệu

- **Strict mode:** `apps/web/tsconfig.json` kế thừa `astro/tsconfigs/strict`.
- **`@types/node`** cài để type môi trường server-side (`process.env` trong thin client / `astro.config.mjs`).
- **Typecheck bắt buộc:** `pnpm typecheck` (`astro check`) — cổng CI (Phase 3); DTO/hợp đồng dữ liệu ở [03d](./03d-api-contract.md)/[types.ts].
- Dùng type cho data contract; tránh `any` tuỳ tiện.

## 6. Quy ước Astro / Component

- **Chỉ dùng component `.astro`** (không React/Vue…): site tĩnh, hầu như không cần trạng thái phía client. Tương tác cần JS (tìm kiếm, lightbox) viết thành script TypeScript thuần ở `src/scripts/`, nạp bằng thẻ `<script>` ngoài — không script inline vì CSP của Caddy cấm ([12 §6](./12-security.md)).
- Props khai báo bằng `interface Props` trong frontmatter; component chỉ nhận dữ liệu đã là DTO ([`types.ts`](../apps/web/src/lib/types.ts)), không tự gọi CMS.
- Markup ngữ nghĩa trước (`article`, `nav`, `main`, heading đúng cấp); ảnh trang trí `alt=""`, ảnh nội dung `alt` thật ([15](./15-seo-accessibility.md)).

## 7. CSS / Styling

- **Một file CSS toàn cục** `apps/web/src/styles/global.css` + **token CSS** (`--color-*`, …) ở `:root`; **không** scoped `<style>` trong `.astro`, **không** utility framework. Token màu có ghi tỉ lệ tương phản (AA/AAA) — đổi màu phải giữ ngưỡng, xem [07b-design-system §3.1](./07b-design-system.md).
- Không style inline (CSP). Tôn trọng `prefers-reduced-motion` (khối `@media` cuối file).

## 8. Git — Commit & Branch

- **Commit:** theo [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Branch:** `type/mô-tả-ngắn`, vd `feat/post-list`, `chore/astro-7` (Dependabot tự đặt `dependabot/...`). Repo một người: được commit thẳng `main` cho việc nhỏ; việc lớn/rủi ro dùng nhánh + PR để CI chạy trước khi merge. `main` có branch protection ([14 §4](./14-quality-gates.md)).
- **Scope trong commit** (không bắt buộc): tên vùng, vd `feat(web):`, `fix(deploy):`, `docs:`, `chore(deps):`.
- **PR:** nhỏ, một mục đích; xem [14-quality-gates](./14-quality-gates.md).

## 9. Comment & Tài liệu trong code

- Comment giải thích **tại sao** (ràng buộc, bẫy, quyết định), không lặp lại **cái gì** mã đã nói. Đầu file `lib/` và script có một khối ngắn nêu mục đích và, nếu có, lý do tách (vd "tách để test được"). Viết bằng tiếng Việt, khớp tài liệu.
- Hàm công khai của `src/lib` có kiểu rõ ràng (TypeScript là tài liệu chính); thêm JSDoc chỉ khi hành vi không hiển nhiên.

## 10. Xử lý lỗi & Logging

- Lỗi truy cập CMS ném `DirectusError` có phân loại (`not_found` / `system`) từ thin client ([`directus.ts`](../apps/web/src/lib/directus.ts)); gọi có **timeout** (`AbortSignal.timeout`). **Không nuốt lỗi:** để build thất bại còn hơn dựng site thiếu bài — chỉ chuyển `not_found` thành 404 có chủ đích.
- Không `catch` rồi bỏ qua; nếu bắt thì ghi ngữ cảnh (đường dẫn, mã HTTP) vào thông báo.
- **Không log secret/token/PII**; log ở `ops` và script chỉ ghi trạng thái và đường dẫn ([12 §9](./12-security.md)).

## 11. Bảo mật khi code

- Không commit secret; dùng biến môi trường. Xem [12-security](./12-security.md).
- Không có input công khai (không form/comment) nên không có nơi nhận dữ liệu người dùng; mọi `body` từ CMS qua `sanitize-body.ts` (allowlist) trước `set:html` ([ADR-0013](./adr/0013-sanitize-body-html.md)). Thêm đường nhận dữ liệu mới = đổi mô hình đe doạ → cập nhật [12](./12-security.md) và dừng chờ Product.

## 12. Quản lý dependency

- **Thêm package:** chỉ khi cần thật và không tự viết vài chục dòng được; ưu tiên package nhỏ, còn bảo trì, ít phụ thuộc; ghi lý do trong PR.
- **Khoá phiên bản:** lockfile commit (`apps/web/pnpm-lock.yaml`, `e2e/pnpm-lock.yaml`), cài bằng `--frozen-lockfile`; image Docker pin cứng, không `latest`.
- **Kiểm lỗ hổng và cập nhật:** Dependabot hằng tuần + workflow `security.yml` (`pnpm audit`, đỏ khi có high/critical). Quy trình xử lý PR Dependabot: [13 §2](./13-operations.md). Nâng major Postgres/Directus không qua Dependabot ([12 §6](./12-security.md)).
