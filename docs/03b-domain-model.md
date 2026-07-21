# 03b — Domain Model

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** Mô tả *khái niệm và luật nghiệp vụ* của miền blog — tầng bền vững nhất, độc lập hoàn toàn với storage/CMS/API/framework. Là **nguồn sự thật** cho ngữ nghĩa nghiệp vụ.
> 🔗 **Liên quan:** [16-glossary](./16-glossary.md) · [03c-content-model](./03c-content-model.md) · [03a-architecture-principles](./03a-architecture-principles.md)

---

> 🧭 **Tầng LÕI — TRUNG LẬP CÔNG NGHỆ.** Tài liệu này KHÔNG được nhắc tên công nghệ/sản phẩm cụ thể. Chi tiết hiện thực ở tầng RÌA (`04`, `05`, `06`), `Tech Stack`, hoặc ADR. Xem [Nguyên tắc 0](./03a-architecture-principles.md).

## 1. Phạm vi & mối quan hệ với Glossary

- Tài liệu này định nghĩa **cấu trúc & luật**; định nghĩa *thuật ngữ* nằm ở [16-glossary](./16-glossary.md). Không lặp định nghĩa từ vựng ở đây.

## 2. Thực thể miền (Domain Entities) & quan hệ

> Mô tả *khái niệm*, không phải field kỹ thuật (field thuộc [03c-content-model](./03c-content-model.md)).

| Thực thể | Ý nghĩa nghiệp vụ | Quan hệ chính |
|---|---|---|
| Bài viết (Post) | Đơn vị nội dung được xuất bản | thuộc 1 Tác giả; 0..1 Chuyên mục; 0..* Thẻ |
| Tác giả (Author) | Người chịu trách nhiệm nội dung | sở hữu nhiều Bài viết |
| Chuyên mục (Category) | Phân loại phân cấp, độc quyền | phân loại nhiều Bài viết |
| Thẻ (Tag) | Nhãn tự do, nhiều-nhiều | gắn nhiều Bài viết |
| Ảnh/Media | Tài nguyên đính kèm nội dung | tham chiếu bởi Bài viết |

> Sơ đồ khái niệm (conceptual): TODO — vẽ quan hệ ở mức nghiệp vụ.

## 3. Luật nghiệp vụ & Bất biến (Business Rules & Invariants)

- BR-1: Một Bài viết chỉ công khai với độc giả khi ở trạng thái *Đã xuất bản*.
- BR-2: Mỗi Bài viết có định danh URL (slug) **duy nhất và ổn định** theo thời gian.
- BR-3: Chuyên mục là *độc quyền* (một bài tối đa một chuyên mục); Thẻ là *nhiều-nhiều*.
- BR-4: TODO — luật về quyền tác giả (ai được sửa/xuất bản bài của ai).
- BR-5: TODO.

## 4. Vòng đời & Máy trạng thái (State Machine)

> Luật chuyển trạng thái của Bài viết — *nghiệp vụ thuần*, không phụ thuộc CMS.

```
Nháp (Draft) ──gửi duyệt──> Chờ duyệt (In Review) ──duyệt──> Đã xuất bản (Published)
   │                                                              ▲
   └──đặt lịch──> Đã lên lịch (Scheduled) ──(đến giờ)────────────┘
Đã xuất bản ──gỡ──> Nháp/Lưu trữ (Archived?)   (TODO: xác định)
```
- Ai được phép thực hiện mỗi chuyển tiếp: TODO (quy tắc nghiệp vụ; hiện thực phân quyền ở [05](./05-cms.md)).

## 5. Sự kiện miền (Domain Events) — tuỳ chọn

- Bài-được-xuất-bản, Bài-được-cập-nhật... (dùng để kích hoạt quy trình downstream ở tầng RÌA). TODO.

## 6. Câu hỏi mở

- [ ] Có khái niệm *bản nháp của bài đã xuất bản* (revision) không?
- [ ] Vòng đời của Chuyên mục/Thẻ (tạo/gộp/xoá)?
