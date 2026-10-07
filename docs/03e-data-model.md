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
| Post–Tag | (post_id, tag_id) | — | bảng nối nhiều-nhiều |

## 3. Quan hệ & Toàn vẹn tham chiếu (Referential Integrity)

- Post → Author: bắt buộc; hành vi khi xoá Author: TODO (chặn/thu hồi?).
- Post → Category: tuỳ chọn; Post ↔ Tag: nhiều-nhiều qua bảng nối.
- Quy tắc xoá/hạn chế (restrict/cascade — ở mức *logic*): TODO.

## 4. Ràng buộc & Bất biến dữ liệu

- slug duy nhất toàn hệ (BR-2 [03b](./03b-domain-model.md)).
- published_at bắt buộc khi status=Published (khớp [03c](./03c-content-model.md)).
- TODO: audit fields (created/updated), soft-delete (khái niệm).

## 5. Nhu cầu truy cập (logic, không phải index vật lý)

> Phát biểu *nhu cầu* hiệu năng, để tầng RÌA quyết định index cụ thể.

- Tra cứu bài theo slug phải nhanh (trang chi tiết).
- Lọc bài theo status + sắp theo published_at (trang danh sách).
- TODO: tìm kiếm toàn văn?

## 6. Vòng đời & Lưu giữ dữ liệu (logic)

- Giữ revision? Lưu trữ bài gỡ? Thời gian lưu giữ? TODO. (Yêu cầu RPO/RTO: [13-operations](./13-operations.md).)

## 7. Ánh xạ vật lý

- Kiểu cột thật, index, migration, seeding, backup: xem [04-database](./04-database.md).
