# 15 — SEO & Accessibility

> 🎯 **Mục đích:** Đặt mục tiêu và tiêu chuẩn cho *khả năng được tìm thấy* (SEO) và *khả năng tiếp cận* (a11y) — hai yếu tố sống còn với một blog. Ghi sớm để thiết kế & code không phải sửa lại về sau.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [07-ui-ux](./07-ui-ux.md) · [07b-design-system](./07b-design-system.md) · [06-api](./06-api.md) · [10-decisions `[S5-P0]`/`[S5-P2]`](./10-decisions.md)

---

> **Cấu trúc tài liệu (F15, quyết định 2026-11-02): giữ gộp SEO + a11y.** Cả hai đo trên cùng trang xuất ra và dùng chung job `site-checks`; Phần B chỉ ≈ 2,3 KB và không tham chiếu SEO, tách ra sẽ phải nối lại 27 liên kết/11 neo cho lợi ích nhỏ. Tách thành `15a`/`15b` (giữ số `15` cho SEO) khi Phần B vượt ≈ 5 KB hoặc có quy trình a11y thủ công riêng.

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
| **Thẻ `/tag/<slug>`** | Trang-1 mỗi thẻ có bài (route tĩnh, phân trang `/tag/<slug>/page/N` như chuyên mục); chip `#tên` trên card + trang bài; `article:tag` + JSON-LD `keywords`; thẻ vào sitemap; `<category>` trong RSS | `src/pages/tag/`, `src/components/TagList.astro` |
| **Lưu trữ `/archive`** | Trang tổng hợp theo tháng (số bài/tháng) + `/archive/YYYY/MM` (hết bài trong tháng, không phân trang); **tháng tính theo giờ VN (UTC+7)**; `/archive` và các tháng vào sitemap; link "Lưu trữ" ở header | `src/pages/archive/`, `src/lib/archive.ts` |
| **Chuyên mục `/categories`** | Trang tổng hợp: mọi chuyên mục kèm mô tả và số bài đã xuất bản; trang `/category/<slug>` hiện mô tả ở trang 1; link "Chuyên mục" ở header; vào sitemap | `src/pages/categories.astro` |
| **Tác giả `/author/<slug>`** | Trang-1 mỗi tác giả **có bài đã xuất bản** (tác giả chưa có bài không có trang); ảnh + bio (văn bản thuần, thoát ký tự) + danh sách bài phân trang `/author/<slug>/page/N`; tên tác giả trên card/trang bài là link; JSON-LD `author.url`; vào sitemap | `src/pages/author/`, `src/components/AuthorName.astro` |
| **Tìm kiếm `/search`** | Site tĩnh ⇒ tra cứu **ở trình duyệt** trên `/search-index.json` (dựng lúc build: tiêu đề, tóm tắt, chuyên mục, thẻ, thân bài cắt ở 6000 ký tự; chỉ bài đã xuất bản). Khớp **không dấu**, không phân biệt hoa/thường, chuỗi con, mọi từ phải có; điểm: tiêu đề > thẻ > chuyên mục/tóm tắt > nội dung, hoà điểm → mới nhất. Chỉ mục tải ở lần tìm đầu (gzip/zstd qua Caddy); kết quả vẽ bằng `textContent`. Tuân CSP (script ngoài, `connect-src 'self'`). Trang `noindex,follow`, không vào sitemap; link "Tìm kiếm" ở header. Giới hạn: hàng trăm bài vẫn nhẹ, hàng nghìn bài thì đổi sang Pagefind/server-side | `src/pages/search.astro`, `src/pages/search-index.json.ts`, `src/lib/search*.ts`, `src/scripts/search.ts` |
| **`rss.xml`** | RSS 2.0, 20 bài mới nhất, đủ nội dung (`content:encoded`, body đã sanitize, link nội bộ đổi sang tuyệt đối); autodiscovery `<link rel="alternate">` ở mọi trang + link "RSS" ở footer | `src/pages/rss.xml.ts`, `src/lib/rss.ts` |

> **Địa chỉ tuyệt đối** dẫn xuất từ `PUBLIC_SITE_URL` (→ `Astro.site`) — nguồn sự thật DUY NHẤT; Sprint 6 (deploy) đổi domain chỉ sửa 1 biến. Xem Decision `[S5-P0]` (route/sitemap policy) & `[S5-P2]` (canonical self-referencing).
>
> **Đã bổ sung sau S5:** JSON-LD `BlogPosting` (A3) và RSS (`rss.xml` ở trên) — cả hai làm 2026-11-01.

---

# Phần A — SEO

## A1. Mục tiêu SEO

- Được công cụ tìm kiếm **index đầy đủ và đúng canonical** (sitemap hợp lệ, không trang trùng — phân trang/tìm kiếm không vào sitemap); ngưỡng kỹ thuật **Lighthouse SEO ≥ 0,95** (baseline 1,00) ở job `site-checks`.
- Chủ đề mục tiêu: máy tính cổ ([00 §1](./00-project.md)). **Không đặt chỉ tiêu thứ hạng hay lưu lượng** — phụ thuộc nội dung và thời gian, không do hệ thống quyết định; rich result dừng ở `BlogPosting` (A3).

## A2. On-page & Semantic HTML

- [x] `<title>` & meta description theo từng trang _(S3 + S5-P2)_
- [x] HTML ngữ nghĩa (`<article>`, `<nav>`, `<main>`, heading đúng cấp) _(S3)_
- [x] URL/slug sạch, ổn định (xem [04-database](./04-database.md))
- [x] Canonical URL — **self-referencing** _(S5-P2)_

## A3. Structured Data (JSON-LD)

- [x] `BlogPosting` cho trang bài viết, kèm `author` (`Person`, có `url` tới trang tác giả), `publisher`, `keywords` từ thẻ — `src/lib/json-ld.ts`, có test; `check-site.mjs` kiểm JSON-LD parse được
- [ ] `BreadcrumbList` — **không làm có chủ đích**: cấu trúc phẳng (bài → chuyên mục), lợi ích rich result nhỏ; xem lại nếu chuyên mục phân cấp sâu hơn

## A4. Sitemap, Robots, Feed

- [x] `sitemap.xml` tự sinh — endpoint canonical-only _(S5-P2)_
- [x] `robots.txt` — endpoint trỏ sitemap tuyệt đối _(S5-P2)_
- [x] RSS feed `/rss.xml` — RSS 2.0, FR-R5 [01](./01-requirements.md) _(2026-11-01; chỉ feed toàn site, chưa có feed theo chuyên mục; Atom không làm)_

## A5. Social & Sharing

- [x] Open Graph & Twitter Card (ảnh, tiêu đề, mô tả) _(S5-P2)_

## A6. Hiệu năng (là yếu tố SEO)

- [x] Ngân sách hiệu năng: Lighthouse mobile Performance ≥ 0,9 (baseline thấp nhất 0,96) trong `e2e/lighthouserc.cjs`; mục tiêu CWV: [01 §2](./01-requirements.md); cách đo: [11-testing](./11-testing.md)

## A7. i18n / hreflang (nếu đa ngôn ngữ)

- **Không áp dụng ở v1:** site một ngôn ngữ (`lang="vi"`, `og:locale=vi_VN`); đa ngôn ngữ là Future ([01a §5](./01a-mvp-scope.md)). Khi làm i18n mới cần `hreflang` và URL theo ngôn ngữ.

---

# Phần B — Accessibility (a11y)

## B1. Tiêu chuẩn

- Mục tiêu: **WCAG 2.2 mức AA**. Nguyên tắc **POUR** (Perceivable, Operable, Understandable, Robust).

## B2. Checklist cốt lõi

- [ ] Điều hướng bằng bàn phím đầy đủ; **focus visible** rõ ràng
- [ ] Tương phản màu đạt AA (xem [07b §3.1](./07b-design-system.md))
- [ ] `alt` cho ảnh; ảnh trang trí để alt rỗng
- [ ] Cấu trúc heading hợp lý; landmark roles
- [ ] Form có label; thông báo lỗi rõ ràng
- [ ] Tôn trọng `prefers-reduced-motion`
- [ ] ARIA chỉ khi cần, đúng cách
- [ ] Ngôn ngữ trang (`lang`) đúng

## B3. Kiểm thử a11y

- **Tự động (Sprint 11, job `site-checks`)**: axe-core (thẻ WCAG 2.0/2.1/2.2 A+AA) trên **mỗi loại trang một mẫu** — trang chủ, bài (thường + có ảnh), chuyên mục, thẻ, tác giả, lưu trữ (+ tháng), `/categories`, tìm kiếm, 404 — ở **desktop và mobile**, cộng lightbox đang mở. Ngưỡng: **0 serious/critical**; moderate/minor được ghi log + đính kèm báo cáo, nếu chưa sửa thì ghi lý do vào Kết quả sprint. Bàn phím qua E2E: skip-link, focus nhìn thấy, tìm kiếm, mở/đóng lightbox bằng phím. Lighthouse (mobile) đo Accessibility ≥ 0,95.
- **Giới hạn đã biết của axe:** không đánh giá được `::backdrop` (nền tối của lightbox) nên báo sai tương phản chữ sáng → test tắt rule `color-contrast` riêng cho lightbox và tự tính tỉ lệ thật (≥ 4,5:1).
- **Thủ công (chưa tự động):** screen reader, zoom 200–400 %, `prefers-reduced-motion`, tương phản của trạng thái hover/focus. Xem [11-testing §3](./11-testing.md).

## B4. Trách nhiệm

a11y là trách nhiệm chung:
- **Thiết kế/UI:** token màu giữ tỉ lệ tương phản AA ([07b](./07b-design-system.md)), focus nhìn thấy, skip-link, `prefers-reduced-motion`.
- **Code:** HTML ngữ nghĩa; thay đổi ảnh hưởng trang xuất ra phải qua job `site-checks` (axe 0 serious/critical — [14 §2.1](./14-quality-gates.md)).
- **Nội dung (Editor):** nhập **alt text** cho mọi ảnh trong Directus (trường `alt` là bắt buộc ở form soạn — [05-cms](./05-cms.md)); đặt heading đúng cấp trong bài; ảnh trang trí để alt rỗng.
