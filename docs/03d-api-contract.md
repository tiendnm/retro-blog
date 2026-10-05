# 03d — API Contract

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (hoàn thiện Sprint 2 Phase 0)
>
> 🎯 **Mục đích:** Định nghĩa *hợp đồng logic* mà mọi consumer (frontend, kênh khác) và producer (backend) phải tuân theo — độc lập với transport và sản phẩm cụ thể. Hiện thực **API-first**.
> 🔗 **Liên quan:** [03c-content-model](./03c-content-model.md) · [03b-domain-model](./03b-domain-model.md) · [03e-data-model](./03e-data-model.md) · [03a-architecture-principles (P3)](./03a-architecture-principles.md)
> ▼ **Hiện thực (non-normative):** [06-api](./06-api.md)

---

> 🧭 **Tầng LÕI — TRUNG LẬP TRANSPORT.** Không mô tả endpoint/cú pháp của một backend cụ thể. Binding cụ thể: xem con trỏ hiện thực ở header. Mọi DTO **dẫn xuất từ** [03c-content-model](./03c-content-model.md) — không định nghĩa lại field.

## 1. Nguyên tắc hợp đồng

- Hợp đồng định nghĩa **trước** khi hiện thực (P3). Thay đổi phá vỡ (breaking) phải qua versioning (§5).
- DTO tham chiếu field từ [03c](./03c-content-model.md); trạng thái/luật từ [03b](./03b-domain-model.md); khoá/quan hệ từ [03e](./03e-data-model.md).

## 2. Tài nguyên & Thao tác (logic)

| Thao tác | Ý nghĩa | Đầu vào | Đầu ra |
|---|---|---|---|
| Liệt kê bài đã xuất bản | Trang danh sách | phân trang, sắp xếp | `PostSummary[]` + metadata phân trang |
| Lấy bài theo slug | Trang chi tiết | slug | `PostDetail` |
| Liệt kê theo Category | Trang chuyên mục | category slug + phân trang | `PostSummary[]` + metadata |

> Chỉ *ý nghĩa logic*; ánh xạ endpoint là việc của [06](./06-api.md). (Liệt kê theo **Tag**: tương lai — Tag ngoài phạm vi hiện tại.)

## 3. Hình dạng dữ liệu (DTO — logic)

> Chỉ phơi bày nội dung *đã xuất bản*. Field dẫn xuất trực tiếp từ [03c](./03c-content-model.md).

### 3.1. PostSummary (list)
```jsonc
{
  "id": "…",
  "title": "…",                         // 03c Post.title
  "slug": "…",                          // 03c Post.slug
  "excerpt": "…",                       // 03c Post.excerpt
  "cover": { "url": "…", "alt": "…" },  // 03c Media (null nếu không có)
  "publishedAt": "…",                   // 03c Post.published_at
  "author": { "name": "…", "slug": "…" }// 03c Author
}
```

### 3.2. PostDetail (detail)
```jsonc
{
  "id": "…",
  "title": "…",                         // 03c Post.title
  "slug": "…",                          // 03c Post.slug
  "excerpt": "…",                       // 03c Post.excerpt (dùng cho SEO description)
  "body": "…",                          // 03c Post.body (rich-text)
  "publishedAt": "…",                   // 03c Post.published_at
  "author": {                           // 03c Author (bắt buộc)
    "name": "…", "slug": "…",
    "avatar": { "url": "…", "alt": "…" }// null nếu không có
  },
  "category": { "name": "…", "slug": "…" }, // 03c Category (độc quyền) — null nếu không gán
  "cover": { "url": "…", "alt": "…" }       // 03c Media — null nếu không có
  // "tags": — có ở 03c nhưng NGOÀI phạm vi hiện tại (Tag — Nice); bổ sung khi implement Tag
}
```

### 3.3. SiteSettings (cấu hình site — singleton)

Nguồn: [03c §2.6](./03c-content-model.md). **Luôn trả đủ giá trị** (consumer áp fallback mặc định khi CMS chưa cấu hình).

```jsonc
{
  "siteName": "…",                          // luôn có
  "description": "…",                        // luôn có (mô tả mặc định)
  "footerText": "…",                         // đã thay {year}
  "defaultOgImage": { "url": "…", "alt": "…" } // null → ảnh tĩnh mặc định
}
```

## 4. Ngữ nghĩa phân trang / lọc / sắp xếp (logic)

- **Phân trang (offset-based):** tham số `page` (bắt đầu 1) + `pageSize`; **mặc định 10**, **tối đa 50**. Metadata trả về: `total`, `page`, `pageSize`, `hasMore`.
- **Lọc:** consumer public **chỉ** thấy `status=published` (theo [03b §3 BR-1](./03b-domain-model.md)); lọc theo `category.slug`.
- **Sắp xếp:** mặc định `publishedAt` **giảm dần** (mới nhất trước); bài thiếu `publishedAt` xếp cuối.

## 5. Mô hình lỗi & Versioning

- **Cấu trúc lỗi (logic):**
```jsonc
{ "error": { "code": "not_found | invalid_input | unauthorized | system", "message": "…" } }
```
  - `not_found`: tài nguyên/slug không tồn tại (hoặc không published với consumer public).
  - `invalid_input`: tham số phân trang/lọc không hợp lệ.
  - `unauthorized`: truy cập nội dung không được phép — *với public, thường quy về `not_found`* để không lộ sự tồn tại của draft.
  - `system`: backend lỗi/không sẵn sàng.
- **Versioning:** thêm field **optional** = không phá vỡ; đổi/bỏ field hoặc đổi ngữ nghĩa = **breaking** → tăng version hợp đồng, có kế hoạch tương thích ngược.

## 6. Ràng buộc phi chức năng của hợp đồng

- **Read idempotent**, không side-effect.
- **Nhất quán:** với chiến lược render SSG ([ADR-0006](./adr/0006-render-strategy.md)), nội dung ở production tĩnh có thể **trễ tới lần rebuild kế** (dev thì live). Consumer không giả định realtime.
- **Kích thước response** bị giới hạn bởi phân trang (§4). Cách cache/ISR là ở tầng RÌA ([06](./06-api.md)).
