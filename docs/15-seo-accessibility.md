# 15 — SEO & Accessibility

> 🎯 **Mục đích:** Đặt mục tiêu và tiêu chuẩn cho *khả năng được tìm thấy* (SEO) và *khả năng tiếp cận* (a11y) — hai yếu tố sống còn với một blog. Ghi sớm để thiết kế & code không phải sửa lại về sau.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [07-ui-ux](./07-ui-ux.md) · [06-api](./06-api.md) · [10-decisions `[S5-P0]`/`[S5-P2]`](./10-decisions.md)

---

## A0. SEO baseline đã hiện thực (Sprint 5 Phase 2)

| Hạng mục | Hiện thực | Vị trí |
|---|---|---|
| `<title>` + meta description | Theo từng trang (đã có từ S3) | `Base.astro` (props `title`/`description`) |
| **Canonical** | **Self-referencing** — mỗi trang (kể cả pagination) trỏ về CHÍNH URL của nó (tuyệt đối) | `Base.astro` |
| **OpenGraph** | `og:type` (`article` cho detail, `website` còn lại) · `title`/`description`/`url`/`site_name`/`locale=vi_VN` · `og:image` khi bài có cover | `Base.astro` |
| **Twitter Card** | `summary` (không ảnh) / `summary_large_image` (có cover) + title/description/image | `Base.astro` |
| **`sitemap.xml`** | Endpoint tự viết — **chỉ canonical content URL** (home + posts + category trang-1), **loại pagination** | `src/pages/sitemap.xml.ts` |
| **`robots.txt`** | Endpoint — `Allow: /` + trỏ `Sitemap:` tuyệt đối | `src/pages/robots.txt.ts` |

> **Địa chỉ tuyệt đối** dẫn xuất từ `PUBLIC_SITE_URL` (→ `Astro.site`) — nguồn sự thật DUY NHẤT; Sprint 6 (deploy) đổi domain chỉ sửa 1 biến. Xem Decision `[S5-P0]` (route/sitemap policy) & `[S5-P2]` (canonical self-referencing).
>
> **Chưa làm (đúng scope):** JSON-LD (`BlogPosting`) = *stretch*, không vào Acceptance Criteria S5 — A3 bên dưới. RSS/feed = Future.

---

# Phần A — SEO

## A1. Mục tiêu SEO

- TODO _(được index, thứ hạng cho chủ đề mục tiêu, rich results)_.

## A2. On-page & Semantic HTML

- [x] `<title>` & meta description theo từng trang _(S3 + S5-P2)_
- [x] HTML ngữ nghĩa (`<article>`, `<nav>`, `<main>`, heading đúng cấp) _(S3)_
- [x] URL/slug sạch, ổn định (xem [04-database](./04-database.md))
- [x] Canonical URL — **self-referencing** _(S5-P2)_

## A3. Structured Data (JSON-LD)

- [ ] `Article`/`BlogPosting` cho trang bài viết _(stretch — chưa vào AC S5)_
- [ ] `BreadcrumbList`, `Person` (author) nếu phù hợp

## A4. Sitemap, Robots, Feed

- [x] `sitemap.xml` tự sinh — endpoint canonical-only _(S5-P2)_
- [x] `robots.txt` — endpoint trỏ sitemap tuyệt đối _(S5-P2)_
- [ ] RSS/Atom feed (xem FR-R5 [01](./01-requirements.md)) _(Future)_

## A5. Social & Sharing

- [x] Open Graph & Twitter Card (ảnh, tiêu đề, mô tả) _(S5-P2)_

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
