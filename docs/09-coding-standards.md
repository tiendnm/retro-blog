# 09 — Coding Standards

> 🎯 **Mục đích:** Thống nhất *cách viết code* để mã nguồn nhất quán, dễ đọc, dễ review — giảm tranh luận về phong cách và tăng chất lượng. Bắt buộc phải chốt trước khi viết dòng code đầu tiên.
> 🔗 **Liên quan:** [11-testing](./11-testing.md) · [14-quality-gates](./14-quality-gates.md) · [17-contributing](./17-contributing.md)

---

## 1. Ngôn ngữ & phiên bản

- **Node:** 22 (runtime chuẩn — Docker `node:22.12.0`; engines `>=22`). Local dev có thể ≥20.3 (Astro 5 hỗ trợ).
- **pnpm:** 10.33.2 (pin qua `packageManager`).
- **TypeScript:** 5.x (pin `^5.9.3`); Astro 5.x.
- **Công cụ chất lượng (Sprint 7):** **Biome** (lint+format) · **Vitest** (test) · **astro check** (typecheck) — quyết định ở [ADR-0009](./adr/0009-quality-tooling-biome-vitest.md).

## 2. Cấu trúc thư mục dự án (dự kiến)

> Sẽ chốt khi khởi tạo. Ghi trước nguyên tắc tổ chức (theo feature hay theo layer).

- TODO.

## 3. Quy ước đặt tên (Naming)

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component | PascalCase | `PostCard.astro` |
| Biến/hàm | camelCase | `getPosts()` |
| Hằng số | UPPER_SNAKE | `MAX_ITEMS` |
| File tiện ích | kebab/camel | TBD |

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

- TODO _(khi nào component `.astro` vs framework component, props, slot...)_.

## 7. CSS / Styling

- TODO _(chiến lược: scoped CSS, utility, token từ [07-ui-ux](./07-ui-ux.md))_.

## 8. Git — Commit & Branch

- **Commit:** theo [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Branch:** `type/mô-tả-ngắn`, vd `feat/post-list`. TODO: chốt quy ước.
- **PR:** nhỏ, một mục đích; xem [14-quality-gates](./14-quality-gates.md).

## 9. Comment & Tài liệu trong code

- TODO _(khi nào cần comment; docstring cho hàm public; giải thích "tại sao" không phải "cái gì")_.

## 10. Xử lý lỗi & Logging

- TODO _(quy ước throw/catch, không nuốt lỗi, không log secret)_.

## 11. Bảo mật khi code

- Không commit secret; dùng biến môi trường. Xem [12-security](./12-security.md).
- TODO: validate input, tránh XSS khi render nội dung từ CMS.

## 12. Quản lý dependency

- TODO _(tiêu chí thêm package, khoá phiên bản, kiểm tra lỗ hổng)_.
