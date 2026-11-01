# 03e — Data Model

> 🎯 **Mục đích:** Mô hình dữ liệu *logic* để lưu trữ — thực thể, khoá, quan hệ, ràng buộc toàn vẹn — **độc lập với hệ quản trị CSDL cụ thể**. Là SSOT cho cấu trúc lưu trữ ở mức logic.
> 🔗 **Liên quan:** [03c-content-model](./03c-content-model.md) · [03b-domain-model](./03b-domain-model.md) · [04-database](./04-database.md)

---

> 🧭 **Tầng LÕI — TRUNG LẬP STORAGE.** Không dùng kiểu dữ liệu/cú pháp/tính năng của một CSDL cụ thể. Chi tiết vật lý (kiểu cột, index thật, migration): xem [04-database (Persistence)](./04-database.md).

## 1. Nguyên tắc mô hình dữ liệu (logic)

- Bắt nguồn từ [03c-content-model](./03c-content-model.md); tài liệu này bổ sung góc nhìn *lưu trữ* (khoá, toàn vẹn, vòng đời dữ liệu).
- Kiểu logic: `identifier`, `string`, `text`, `timestamp`, `enum`, `reference`, `blob-ref`, `boolean`.

## 2. Thực thể logic & Khoá

| Thực thể | Khoá chính (logic) | Khoá phụ / duy nhất | Ghi chú |
|---|---|---|---|
| Post | id (identifier) | slug (unique) | |
| Author | id | slug (unique) | |
| Category | id | slug (unique) | phân cấp? (parent ref) |
| Tag | id | slug (unique) | |
| Media | id | — | tham chiếu tệp |
| Post–Tag | (post_id, tag_id) | — | bảng nối nhiều-nhiều (`posts_tags`: `id` integer, `posts_id`, `tags_id`; CASCADE) |

## 3. Quan hệ & Toàn vẹn tham chiếu (Referential Integrity)

- Post → Author: bắt buộc; **xoá Author bị chặn** khi còn Bài viết tham chiếu (restrict) — phải chuyển hoặc xoá bài trước.
- Post → Category: tuỳ chọn; Post ↔ Tag: nhiều-nhiều qua bảng nối.
- Quy tắc xoá (mức *logic*): **restrict** cho Post → Author; **bỏ tham chiếu** (về rỗng) khi xoá Category, Media, hoặc Category cha (Post.category, Post.cover, Author.avatar, Category.parent); **cascade** chỉ ở bảng nối Post–Tag (xoá bài hoặc thẻ thì xoá dòng nối).

## 4. Ràng buộc & Bất biến dữ liệu

- slug duy nhất toàn hệ (BR-2 [03b](./03b-domain-model.md)).
- published_at bắt buộc khi status=Published (khớp [03c](./03c-content-model.md)).
- **Audit:** ngoài `published_at`, v1 không có trường audit riêng (người/thời điểm tạo–sửa) trong mô hình nghiệp vụ; nếu hệ quản trị cung cấp thì là chi tiết RÌA. **Không soft-delete:** xoá là xoá thật (khôi phục bằng sao lưu — [13 §4](./13-operations.md)).

## 5. Nhu cầu truy cập (logic, không phải index vật lý)

> Phát biểu *nhu cầu* hiệu năng, để tầng RÌA quyết định index cụ thể.

- Tra cứu bài theo slug phải nhanh (trang chi tiết).
- Lọc bài theo status + sắp theo published_at (trang danh sách).
- **Tìm kiếm:** không cần tìm toàn văn phía lưu trữ; tìm kiếm chạy phía client trên chỉ mục tĩnh dựng lúc build ([01a §5](./01a-mvp-scope.md)). Nhu cầu này có thể xem lại nếu số bài vượt khả năng của chỉ mục tĩnh.

## 6. Vòng đời & Lưu giữ dữ liệu (logic)

- **Không có yêu cầu nghiệp vụ** về revision hay kho lưu bài đã gỡ (Product chốt 2026-11-02): xoá là xoá thật; sao lưu là đường khôi phục. Bài gỡ về Nháp vẫn nằm trong kho. Hệ quản trị hiện tại tự ghi lịch sử thay đổi nhưng đó là hành vi hiện thực, không phải cam kết của mô hình ([04 §7](./04-database.md)). (Yêu cầu RPO/RTO: [13-operations](./13-operations.md).)

## 7. Ánh xạ vật lý

- Kiểu cột thật, index, migration, seeding, backup: xem [04-database](./04-database.md).
