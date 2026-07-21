# 03d — API Contract

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** Định nghĩa *hợp đồng logic* mà mọi consumer (frontend, kênh khác) và producer (backend) phải tuân theo — độc lập với transport và sản phẩm cụ thể. Hiện thực **API-first**.
> 🔗 **Liên quan:** [03c-content-model](./03c-content-model.md) · [03a-architecture-principles (P3)](./03a-architecture-principles.md) · [06-api](./06-api.md)

---

> 🧭 **Tầng LÕI — TRUNG LẬP TRANSPORT.** Không mô tả endpoint/cú pháp của một backend cụ thể (REST/GraphQL của sản phẩm nào). Binding cụ thể: xem [06-api (API Implementation)](./06-api.md).

## 1. Nguyên tắc hợp đồng

- Hợp đồng định nghĩa **trước** khi hiện thực (P3). Thay đổi phá vỡ (breaking) phải qua versioning (§5).
- DTO tham chiếu field từ [03c-content-model](./03c-content-model.md) — không định nghĩa lại field.

## 2. Tài nguyên & Thao tác (logic)

| Thao tác | Ý nghĩa | Đầu vào | Đầu ra |
|---|---|---|---|
| Liệt kê bài đã xuất bản | Trang danh sách | phân trang, lọc, sắp xếp | `PostSummary[]` + metadata phân trang |
| Lấy bài theo slug | Trang chi tiết | slug | `PostDetail` |
| Liệt kê theo taxonomy | Theo category/tag | slug taxonomy + phân trang | `PostSummary[]` |

> Chỉ mô tả *ý nghĩa logic*; ánh xạ sang endpoint là việc của [06](./06-api.md).

## 3. Hình dạng dữ liệu (DTO — logic)

### 3.1. PostSummary (list)
```jsonc
{
  "id": "…",
  "title": "…",           // ← 03c: Post.title
  "slug": "…",            // ← 03c: Post.slug
  "excerpt": "…",         // ← 03c: Post.excerpt
  "cover": { "url": "…", "alt": "…" },
  "publishedAt": "…",
  "author": { "name": "…", "slug": "…" }
}
```
### 3.2. PostDetail
> TODO: mở rộng gồm body, tags, category, các field SEO (khớp [03c](./03c-content-model.md)).

## 4. Ngữ nghĩa phân trang / lọc / sắp xếp (logic)

- Phân trang: kiểu (offset/cursor?), kích thước mặc định & tối đa. TODO.
- Lọc: theo status (chỉ Published cho public), theo taxonomy. TODO.
- Sắp xếp: mặc định theo `publishedAt` giảm dần. TODO.

## 5. Mô hình lỗi & Versioning

- **Loại lỗi (logic):** không-tìm-thấy, đầu-vào-không-hợp-lệ, không-được-phép, lỗi-hệ-thống. TODO: cấu trúc lỗi chuẩn.
- **Versioning:** chính sách khi Content Model/DTO đổi; quy tắc tương thích ngược. TODO.

## 6. Ràng buộc phi chức năng của hợp đồng

- Idempotency của read, độ nhất quán (nội dung tĩnh có thể trễ), giới hạn kích thước response. TODO. (Cách cache/ISR là ở tầng RÌA [06](./06-api.md).)
