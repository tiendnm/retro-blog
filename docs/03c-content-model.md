# 03c — Content Model

> 🎯 **Mục đích:** Định nghĩa *các loại nội dung và field* mà người biên tập làm việc — độc lập với bất kỳ CMS nào. Đây là **nguồn sự thật (SSOT)** cho cấu trúc nội dung.
> 🔗 **Liên quan:** [03b-domain-model](./03b-domain-model.md) · [03d-api-contract](./03d-api-contract.md) · [03e-data-model](./03e-data-model.md)
> ▼ **Hiện thực (non-normative):** [05-cms](./05-cms.md)

---

> 🧭 **Tầng LÕI — TRUNG LẬP CMS.** Không dùng khái niệm/interface riêng của một CMS. Cách hiện thực trên CMS cụ thể: xem con trỏ hiện thực ở header. Xem [Nguyên tắc 0, P2 & P8](./03a-architecture-principles.md).

## 1. Nguyên tắc mô hình nội dung

- Dùng **kiểu field trung lập**: `text`, `rich-text`, `slug`, `datetime`, `enum`, `reference`, `media`, `boolean`, `number`. Không dùng tên interface của CMS.
- Mỗi loại nội dung ánh xạ tới thực thể miền ở [03b](./03b-domain-model.md).

## 2. Các loại nội dung (Content Types) — SSOT

### 2.1. Post (Bài viết)

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| title | text | ✅ | Tiêu đề | |
| slug | slug | ✅ | Định danh URL | duy nhất, ổn định (BR-2) |
| excerpt | text | ❌ | Tóm tắt | dùng cho list & SEO |
| body | rich-text | ✅ | Nội dung chính | |
| status | enum | ✅ | Trạng thái biên tập | theo state machine [03b §4](./03b-domain-model.md) |
| published_at | datetime | ❌ | Thời điểm xuất bản | bắt buộc khi status=Published |
| author | reference → Author | ✅ | Tác giả | |
| category | reference → Category | ❌ | Chuyên mục (độc quyền) | |
| ~~tags~~ | reference[] → Tag | ❌ | Thẻ (nhiều-nhiều) | ⏭️ **Deferred** — xem §2.4 |
| cover | reference → Media | ❌ | Ảnh bìa | cần alt text (a11y [15](./15-seo-accessibility.md)) |

### 2.2. Author (Tác giả)

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| name | text | ✅ | Tên hiển thị | dùng trong DTO [03d](./03d-api-contract.md) |
| slug | slug | ✅ | Định danh URL tác giả | duy nhất, ổn định |
| bio | rich-text | ❌ | Giới thiệu ngắn | |
| avatar | reference → Media | ❌ | Ảnh đại diện | cần alt text |

### 2.3. Category (Chuyên mục)

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| name | text | ✅ | Tên chuyên mục | |
| slug | slug | ✅ | Định danh URL | duy nhất, ổn định |
| description | text | ❌ | Mô tả | |
| parent | reference → Category | ❌ | Chuyên mục cha | cho phân cấp (theo [03b §2](./03b-domain-model.md)); không tạo vòng |

### 2.4. Tag (Thẻ) — ⏭️ Deferred (Future)

> ⚠️ **Chưa hiện thực (đồng bộ SSOT ⇄ impl — Sprint 6.5, C4).** Collection `tags` và field `Post.tags` **không** tồn tại trong `schema.yaml` (đúng "Tag ngoài Sprint 2" ở [05-cms §1](./05-cms.md)). Mô hình dưới đây giữ lại làm **thiết kế cho tương lai**; hệ thống Tag (collection + M2M + trang) là **feature** → Sprint 7+/Future, không thuộc MVP hiện tại.

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| name | text | ✅ | Tên thẻ | |
| slug | slug | ✅ | Định danh URL | duy nhất, ổn định |

### 2.5. Media (Ảnh/Tệp)

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| file | media | ✅ | Tệp/ảnh gốc | |
| alt | text | ✅ | Văn bản thay thế | **bắt buộc** cho a11y ([15](./15-seo-accessibility.md)) |
| caption | text | ❌ | Chú thích | |

### 2.6. SiteSettings (Cấu hình site) — singleton

> Chỉ **một bản ghi** cho cả site. Là cấu hình *nội dung* của site (không phải hạ tầng/bí mật) — xem [ADR-0012](./adr/0012-site-settings-singleton.md).

| Field | Kiểu (trung lập) | Bắt buộc | Mô tả | Ràng buộc |
|---|---|---|---|---|
| site_name | text | ✅ | Tên site (header, tiêu đề trang, og:site_name) | mặc định "Retro Blog" |
| description | text | ❌ | Mô tả mặc định (meta description) khi trang không có mô tả riêng | |
| footer_text | text | ❌ | Chữ footer | `{year}` → năm hiện tại |
| default_og_image | media | ❌ | Ảnh chia sẻ mặc định | khuyến nghị 1200×630; trống → ảnh tĩnh mặc định |

## 3. Quan hệ giữa các loại nội dung

> Khớp với [03b §2](./03b-domain-model.md).

| Từ | Quan hệ | Tới | Ghi chú |
|---|---|---|---|
| Post | nhiều → 1 (bắt buộc) | Author | mỗi bài một tác giả |
| Post | nhiều → 0..1 | Category | độc quyền |
| Post | nhiều ↔ nhiều | Tag | ⏭️ Deferred (§2.4) — chưa hiện thực |
| Post | nhiều → 0..1 | Media (cover) | |
| Author / Category / Media | 1 → nhiều / được tham chiếu | Post | |
| Category | 0..1 → 1 | Category (parent) | phân cấp |

## 4. Trạng thái biên tập (Editorial States)

- Tham chiếu máy trạng thái ở [03b §4](./03b-domain-model.md): Nháp → Chờ duyệt → Đã xuất bản; nhánh Đã lên lịch. Ở đây chỉ liệt kê state khả kiến cho người biên tập; luật chuyển tiếp thuộc [03b](./03b-domain-model.md).

## 5. Luật xác thực & authoring

- Field `slug` (Post/Author/Category/Tag): **duy nhất & ổn định**; sinh từ tiêu đề/tên nhưng có thể chỉnh tay.
- Field đánh dấu ✅ ở §2 là bắt buộc.
- `Media.alt` **bắt buộc** (ảnh trang trí có thể để alt rỗng có chủ đích — quy ước ở [15](./15-seo-accessibility.md)).
- `published_at` bắt buộc khi `status=Published`.

## 6. Đa ngôn ngữ (i18n) — khái niệm

- Loại nội dung nào cần dịch, mô hình bản dịch (khái niệm, không phải cơ chế CMS). Ngoài MVP — TODO khi có nhu cầu.

## 7. Con trỏ hiện thực (non-normative)

- Ánh xạ Content Type → collections/fields của CMS: xem [05-cms](./05-cms.md).
- Phơi bày qua API: [03d-api-contract](./03d-api-contract.md) (logic) → [06-api](./06-api.md) (hiện thực).
