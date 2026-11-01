# 07a — Information Architecture (cấu trúc thông tin của site)

> 🎯 **Mục đích:** Mô tả *độc giả đi đâu và tìm thấy gì*: các loại trang, cách phân loại nội dung, quy tắc URL, điều hướng, phân trang. Là SSOT cho **cấu trúc site**; giao diện từng trang ở [07-ui-ux](./07-ui-ux.md), SEO/a11y ở [15](./15-seo-accessibility.md).
> 🔗 **Liên quan:** [03b-domain-model](./03b-domain-model.md) · [03c-content-model](./03c-content-model.md) · [07-ui-ux](./07-ui-ux.md) · [07b-design-system](./07b-design-system.md) · [15-seo-accessibility](./15-seo-accessibility.md)

---

> 🧭 **§1–§6 thuộc tầng LÕI — trung lập công nghệ:** không nhắc tên framework/CMS. **§7 là RÌA:** ánh xạ sang file route hiện thực. Xem [Nguyên tắc 0](./03a-architecture-principles.md).

## 1. Các loại trang

| Loại trang | Vai trò | Nội dung chính | Phân trang |
|---|---|---|---|
| **Trang chủ** | Cửa vào; bài mới nhất | 1 bài nổi bật, 3 bài dạng thẻ, phần còn lại dạng danh sách; thanh chuyên mục | Có |
| **Bài viết** | Đích đọc | Ảnh bìa, tiêu đề, tác giả, ngày, chuyên mục, thẻ, thân bài | — |
| **Chuyên mục** (chi tiết) | Bài của một chuyên mục | Mô tả (chỉ trang 1) + danh sách bài | Có |
| **Tổng hợp chuyên mục** | Khám phá theo chủ đề | Mọi chuyên mục kèm mô tả và số bài | — |
| **Thẻ** | Bài gắn một thẻ | Danh sách bài | Có |
| **Tác giả** | Bài của một tác giả | Ảnh + tiểu sử + danh sách bài; chỉ tồn tại khi tác giả có bài đã xuất bản | Có |
| **Lưu trữ** (tổng) | Duyệt theo thời gian | Các tháng có bài kèm số bài, mới nhất trước | — |
| **Lưu trữ theo tháng** | Bài trong một tháng | Toàn bộ bài của tháng | Không (một tháng hiếm khi quá vài chục bài) |
| **Tìm kiếm** | Tra cứu từ khoá | Ô nhập + kết quả; không tạo nội dung riêng | — |
| **Không tìm thấy (404)** | Điểm rơi khi URL sai | Thông báo + lối về trang chủ | — |
| **Nguồn máy đọc** | Dành cho robot/trình đọc | Sitemap, robots, RSS, chỉ mục tìm kiếm | — |

## 2. Taxonomy (cách phân loại)

| Trục | Quan hệ với bài | Trang tổng hợp | Ghi chú |
|---|---|---|---|
| Chuyên mục | 1 bài ↔ tối đa 1 chuyên mục ([BR-3](./03b-domain-model.md)) | Có (tổng hợp chuyên mục) | Trục chính, hiện trên thanh chuyên mục |
| Thẻ | nhiều–nhiều | Không có trang liệt kê mọi thẻ; vào qua chip trên thẻ bài/trang bài | Trang thẻ chỉ có khi thẻ gắn ≥ 1 bài đã xuất bản |
| Tác giả | 1 bài ↔ đúng 1 tác giả ([BR-4](./03b-domain-model.md)) | Không | Vào qua tên tác giả trên bài |
| Thời gian | theo tháng đăng | Có (lưu trữ) | Tháng tính theo **giờ Việt Nam (UTC+7)** |

- Sắp xếp mọi danh sách bài: **mới xuất bản trước** (theo thời điểm xuất bản).
- Chỉ **bài đã xuất bản và đã tới giờ xuất bản** xuất hiện ở bất kỳ trang nào ([BR-1, BR-5](./03b-domain-model.md)).
- Phân cấp chuyên mục (cha/con) có trong mô hình nhưng site hiện **phẳng**: một cấp, không breadcrumb ([15 §A3](./15-seo-accessibility.md)).

## 3. Quy tắc URL (permalink)

1. **Sạch, không dấu gạch cuối:** `/posts/<slug>`, không `/posts/<slug>/`. Gốc là `/`.
2. **Định danh bằng slug** duy nhất và ổn định ([BR-2](./03b-domain-model.md)); slug chỉ gồm `a–z`, `0–9`, `-`.
3. **Tiền tố theo loại:** bài `/posts/`, chuyên mục `/category/`, thẻ `/tag/`, tác giả `/author/`, lưu trữ `/archive/`.
4. **Lưu trữ theo tháng:** `/archive/<năm>/<tháng 2 chữ số>`, vd `/archive/2026/11`.
5. **Phân trang:** trang 1 dùng URL gốc của danh sách (`/`, `/category/<slug>`…); trang N ≥ 2 thêm `/page/N` (`/page/2`, `/category/<slug>/page/2`). **Không có** `/page/1`.
6. **Canonical:** mỗi trang tự trỏ về chính URL (tuyệt đối) của nó, kể cả trang phân trang. Địa chỉ tuyệt đối suy ra từ một biến cấu hình duy nhất ([15 §A0](./15-seo-accessibility.md)).
7. **Slug đổi = URL đổi:** không có cơ chế chuyển hướng; vì vậy slug phải ổn định. (Xem Backlog §8.)

## 4. Điều hướng

| Khu vực | Mục | Hiện ở |
|---|---|---|
| **Đầu trang** (điều hướng chính) | Thương hiệu (về trang chủ) · Trang chủ · Chuyên mục · Lưu trữ · Tìm kiếm | Mọi trang |
| **Thanh chuyên mục** (chip) | Tất cả · từng chuyên mục | Trang chủ và các trang danh sách (đánh dấu mục hiện tại) |
| **Phân trang** | Trước · dãy số (rút gọn bằng "…") · Sau | Trang danh sách có > 1 trang |
| **Cuối trang** | Dòng chữ chân trang · RSS | Mọi trang |
| **Liên kết trong nội dung** | Chuyên mục, thẻ, tác giả trên thẻ bài và trang bài; "← Lưu trữ" ở trang tháng | Trang bài/danh sách |

- Điều hướng **tĩnh, phẳng**: không menu thả, không điều hướng theo ngữ cảnh. Độ sâu tối đa từ trang chủ: *trang chủ → chuyên mục → bài* (2 bước); lưu trữ: *lưu trữ → tháng → bài* (3 bước đến bài).
- Đường tắt tới nội dung: tìm kiếm có ở mọi trang qua đầu trang.
- Skip-link "tới nội dung chính" là phần tử đầu tiên của mọi trang ([07b §5](./07b-design-system.md)).

## 5. Trang đặc biệt & nguồn máy đọc

| Mục | Quy tắc |
|---|---|
| **Tìm kiếm** | Tra cứu ngay trên trình duyệt từ một chỉ mục dựng lúc build; trang `noindex,follow`, không vào sitemap. Chi tiết thuật toán: [15 §A0](./15-seo-accessibility.md) |
| **404** | Giữ nhận diện của site; không gọi nguồn dữ liệu. Hiện trạng phục vụ: xem Backlog §8 |
| **Sitemap** | Chỉ **canonical content URL**: trang chủ, mọi bài, trang 1 mỗi chuyên mục/thẻ/tác giả, tổng hợp chuyên mục, lưu trữ và mỗi tháng có bài. **Không** có trang phân trang, tìm kiếm, 404 |
| **robots** | Cho phép mọi robot, trỏ tới sitemap bằng URL tuyệt đối |
| **RSS** | Một feed toàn site: 20 bài mới nhất, đủ nội dung; khai báo tự động ở mọi trang. Không có feed theo chuyên mục |

## 6. Kích thước & giới hạn

| Hạng mục | Giá trị |
|---|---|
| Số bài mỗi trang danh sách | 10 (mặc định hợp đồng API, tối đa 50 — [03d §4](./03d-api-contract.md)) |
| Cửa sổ số trang | Luôn hiện trang 1, trang cuối và lân cận trang hiện tại; chỗ đứt hiện "…" |
| Bài trong RSS | 20 |
| Trang chủ (trang 1) | bài 1 nổi bật · bài 2–4 thẻ · còn lại danh sách gọn |

---

## 7. Ánh xạ sang hiện thực (RÌA)

> Thư mục route: `apps/web/src/pages/` (Astro, file-based routing). Đối chiếu với thư mục thật khi sửa route.

| URL | File | Ghi chú |
|---|---|---|
| `/` | `index.astro` | `variant="home"` |
| `/page/N` | `page/[page].astro` | N ≥ 2 |
| `/posts/<slug>` | `posts/[slug].astro` | chỉ slug đã xuất bản |
| `/category/<slug>` · `/category/<slug>/page/N` | `category/[slug].astro` · `category/[slug]/page/[page].astro` | |
| `/categories` | `categories.astro` | |
| `/tag/<slug>` · `/tag/<slug>/page/N` | `tag/[slug].astro` · `tag/[slug]/page/[page].astro` | |
| `/author/<slug>` · `/author/<slug>/page/N` | `author/[slug].astro` · `author/[slug]/page/[page].astro` | |
| `/archive` | `archive/index.astro` | |
| `/archive/<năm>/<tháng>` | `archive/[year]/[month].astro` | tháng đệm 2 chữ số |
| `/search` | `search.astro` | `noindex` |
| `/404` (xuất ra `404.html`) | `404.astro` | |
| `/sitemap.xml` · `/robots.txt` · `/rss.xml` · `/search-index.json` | `sitemap.xml.ts` · `robots.txt.ts` · `rss.xml.ts` · `search-index.json.ts` | endpoint, không phải trang |

- **Mọi route đều tĩnh (SSG)** — tập URL được sinh lúc build từ dữ liệu đã xuất bản ([ADR-0006](./adr/0006-render-strategy.md)); nội dung mới chỉ xuất hiện sau lần dựng lại ([08 §4](./08-deployment.md)).
- **Thành phần dùng chung:** điều hướng chính `Header.astro`, chân trang `Footer.astro`, thanh chuyên mục `CategoryNav.astro`, phân trang `Pagination.astro` (cửa sổ số trang ở `lib/pagination.ts`), khung trang `layouts/Base.astro` (canonical, meta, RSS autodiscovery).
- **Phục vụ:** reverse proxy ánh xạ `/x` → `x.html` hoặc `x/index.html` để giữ URL không dấu gạch cuối ([08 §7](./08-deployment.md)).

## 8. Backlog (điểm bất hợp lý phát hiện khi lập tài liệu — chưa sửa)

- **404 chưa được dùng ở production:** `404.astro` sinh `404.html` có nhận diện site, nhưng cấu hình Caddy (`handle_errors`) trả văn bản trơn `404 Not Found`; chỉ môi trường e2e/check-site phục vụ `404.html`. Chú thích đầu `404.astro` ("Caddy trỏ về trang này") đã lệch thực tế. Sửa cần đổi cấu hình proxy → ngoài phạm vi Sprint 15.
- **Không có chuyển hướng khi đổi slug** (mục 3.7): đổi slug bài đã xuất bản làm gãy liên kết cũ.
- **Không có trang liệt kê mọi thẻ** (mục 2): chỉ vào thẻ qua chip.
- **Không có feed theo chuyên mục** ([15 §A4](./15-seo-accessibility.md)).
