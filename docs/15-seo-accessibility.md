# 15 — SEO & Accessibility

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Đặt mục tiêu và tiêu chuẩn cho *khả năng được tìm thấy* (SEO) và *khả năng tiếp cận* (a11y) — hai yếu tố sống còn với một blog. Ghi sớm để thiết kế & code không phải sửa lại về sau.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [07-ui-ux](./07-ui-ux.md) · [06-api](./06-api.md)

---

# Phần A — SEO

## A1. Mục tiêu SEO

- TODO _(được index, thứ hạng cho chủ đề mục tiêu, rich results)_.

## A2. On-page & Semantic HTML

- [ ] `<title>` & meta description theo từng trang
- [ ] HTML ngữ nghĩa (`<article>`, `<nav>`, `<main>`, heading đúng cấp)
- [ ] URL/slug sạch, ổn định (xem [04-database](./04-database.md))
- [ ] Canonical URL
- [ ] TODO.

## A3. Structured Data (JSON-LD)

- [ ] `Article`/`BlogPosting` cho trang bài viết
- [ ] `BreadcrumbList`, `Person` (author) nếu phù hợp

## A4. Sitemap, Robots, Feed

- [ ] `sitemap.xml` tự sinh
- [ ] `robots.txt`
- [ ] RSS/Atom feed (xem FR-R5 [01](./01-requirements.md))

## A5. Social & Sharing

- [ ] Open Graph & Twitter Card (ảnh, tiêu đề, mô tả)

## A6. Hiệu năng (là yếu tố SEO)

- [ ] Ngân sách Core Web Vitals (xem [01 §2](./01-requirements.md), [11-testing](./11-testing.md))

## A7. i18n / hreflang (nếu đa ngôn ngữ)

- TODO.

---

# Phần B — Accessibility (a11y)

## B1. Tiêu chuẩn

- Mục tiêu: **WCAG 2.2 mức AA**. Nguyên tắc **POUR** (Perceivable, Operable, Understandable, Robust).

## B2. Checklist cốt lõi

- [ ] Điều hướng bằng bàn phím đầy đủ; **focus visible** rõ ràng
- [ ] Tương phản màu đạt AA (xem [07-ui-ux](./07-ui-ux.md))
- [ ] `alt` cho ảnh; ảnh trang trí để alt rỗng
- [ ] Cấu trúc heading hợp lý; landmark roles
- [ ] Form có label; thông báo lỗi rõ ràng
- [ ] Tôn trọng `prefers-reduced-motion`
- [ ] ARIA chỉ khi cần, đúng cách
- [ ] Ngôn ngữ trang (`lang`) đúng

## B3. Kiểm thử a11y

- Tự động (axe/Lighthouse) + thủ công (bàn phím, screen reader). Xem [11-testing §3](./11-testing.md).

## B4. Trách nhiệm

- TODO _(a11y là trách nhiệm chung: thiết kế, code, nội dung — vd alt text do biên tập viên nhập trong Directus)_.
