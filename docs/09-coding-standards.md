# 09 — Coding Standards

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Thống nhất *cách viết code* để mã nguồn nhất quán, dễ đọc, dễ review — giảm tranh luận về phong cách và tăng chất lượng. Bắt buộc phải chốt trước khi viết dòng code đầu tiên.
> 🔗 **Liên quan:** [11-testing](./11-testing.md) · [14-quality-gates](./14-quality-gates.md) · [17-contributing](./17-contributing.md)

---

## 1. Ngôn ngữ & phiên bản

- TODO _(Node phiên bản, TypeScript?, phiên bản Astro/Directus — cần ADR)_.

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

- **Formatter:** _(vd Prettier)_ — cấu hình là nguồn sự thật, không tranh luận thủ công.
- **Linter:** _(vd ESLint)_ — quy tắc bắt buộc pass ở CI.
- TODO: chốt công cụ (cần ADR) — *nhưng KHÔNG tạo file cấu hình trong Sprint 0*.

## 5. TypeScript / Kiểu dữ liệu

- TODO _(strict mode, cấm `any` tuỳ ý, dùng type cho data contract [06-api](./06-api.md))_.

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
