# 11 — Testing Strategy

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Xác định *cách chúng ta biết phần mềm đúng* — các tầng test, phạm vi, công cụ và cổng chất lượng. Bảo vệ chất lượng khi dự án lớn dần và nhiều người cùng sửa.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [09-coding-standards](./09-coding-standards.md) · [14-quality-gates](./14-quality-gates.md)

---

## 1. Triết lý kiểm thử

- TODO _(test để tự tin refactor & phát hành; ưu tiên test hành vi hơn chi tiết cài đặt)_.

## 2. Kim tự tháp test (Test Pyramid)

| Tầng | Kiểm thử gì | Công cụ (dự kiến) | Tỷ trọng |
|---|---|---|---|
| Unit | Hàm/logic thuần, component nhỏ | _(vd Vitest)_ | Nhiều |
| Integration | Kết nối Astro ↔ Directus, render dữ liệu | TBD | Vừa |
| E2E | Luồng người dùng thật (đọc bài, điều hướng) | _(vd Playwright)_ | Ít |
| Chuyên biệt | a11y, performance/Lighthouse, link-check, visual | TBD | Theo nhu cầu |

> Công cụ cụ thể cần chốt (có thể qua ADR), **nhưng không cài đặt trong Sprint 0**.

## 3. Phạm vi theo loại

- **Astro components/pages:** TODO.
- **Data contract (API):** kiểm dữ liệu từ Directus khớp hợp đồng [06-api](./06-api.md).
- **Directus schema/permission:** TODO.
- **Accessibility:** tự động (axe) + thủ công — xem [15](./15-seo-accessibility.md).
- **Performance:** ngân sách Core Web Vitals (Lighthouse CI) — xem [01 §2](./01-requirements.md).

## 4. Dữ liệu & Fixtures

- TODO _(dữ liệu test ổn định, cô lập, không phụ thuộc prod)_.

## 5. Môi trường test & CI

- TODO _(chạy ở đâu, khi nào; cổng CI bắt buộc pass — xem [08 §3](./08-deployment.md))_.

## 6. Mục tiêu độ phủ (Coverage)

- TODO _(ngưỡng coverage nếu áp dụng; coverage là chỉ báo, không phải mục tiêu tự thân)_.

## 7. Kiểm thử thủ công & QA nội dung

- TODO _(checklist exploratory; QA nội dung/biên tập trước publish)_.

## 8. Định nghĩa "test đạt"

- TODO _(khi nào coi là pass để merge/deploy — liên kết DoD [14](./14-quality-gates.md))_.
