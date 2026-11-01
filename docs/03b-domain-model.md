# 03b — Domain Model

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

```
 Tác giả 1 ──── viết ────< * Bài viết * >──── gắn ────< * Thẻ
                               │ *
                               └── thuộc 0..1 ──> Chuyên mục (phân cấp: cha 0..1)
                               └── có ảnh bìa 0..1 ──> Ảnh/Media
 Tác giả 0..1 ── có ảnh đại diện ──> Ảnh/Media
```
> Sơ đồ khái niệm (conceptual), mức nghiệp vụ; khoá và ràng buộc xem [03e](./03e-data-model.md).

## 3. Luật nghiệp vụ & Bất biến (Business Rules & Invariants)

- BR-1: Một Bài viết chỉ công khai với độc giả khi ở trạng thái *Đã xuất bản*.
- BR-2: Mỗi Bài viết có định danh URL (slug) **duy nhất và ổn định** theo thời gian.
- BR-3: Chuyên mục là *độc quyền* (một bài tối đa một chuyên mục); Thẻ là *nhiều-nhiều*.
- BR-4: Mỗi Bài viết có **đúng một** Tác giả chịu trách nhiệm. Quyền sửa/xuất bản **không** gắn với quyền sở hữu: ở v1 mọi Biên tập viên và Quản trị đều sửa và xuất bản được mọi bài (chỉ hai vai, tin cậy lẫn nhau — [01a §6](./01a-mvp-scope.md)). Quyền theo từng tác giả là Future.
- BR-5: Bài *Đã xuất bản* chỉ hiện với độc giả khi **đã tới thời điểm xuất bản** (`published_at` không ở tương lai). Đặt thời điểm xuất bản trong tương lai là cách hẹn giờ cơ bản; trạng thái *Đã lên lịch* riêng là Nice ([01a §4](./01a-mvp-scope.md)).

## 4. Vòng đời & Máy trạng thái (State Machine)

> Luật chuyển trạng thái của Bài viết — *nghiệp vụ thuần*, không phụ thuộc CMS.

```
Nháp (Draft) ──gửi duyệt──> Chờ duyệt (In Review) ──duyệt──> Đã xuất bản (Published)
   │                                                              ▲
   └──đặt lịch──> Đã lên lịch (Scheduled) ──(đến giờ)────────────┘
Đã xuất bản ──gỡ──> Nháp
```
- **Phạm vi v1:** chỉ hai trạng thái **Nháp ⇄ Đã xuất bản** (Must). *Chờ duyệt*, *Đã lên lịch* là Nice; *Lưu trữ* (giữ bài nhưng không công khai, khác Nháp) là Future — các nhánh *Chờ duyệt* và *Đã lên lịch* ở sơ đồ trên chưa hiện thực ([01a](./01a-mvp-scope.md)).
- **Ai được chuyển tiếp:** Biên tập viên và Quản trị thực hiện mọi chuyển tiếp (BR-4); độc giả không có chuyển tiếp nào. Hiện thực phân quyền ở [05](./05-cms.md).

## 5. Sự kiện miền (Domain Events) — tuỳ chọn

- **Bài-được-xuất-bản** (Nháp → Đã xuất bản) và **Bài-được-cập-nhật/gỡ** là các sự kiện có nghĩa với hệ thống: mỗi sự kiện khiến site công khai phải được dựng lại. Cách phát và nhận sự kiện là chi tiết RÌA ([08](./08-deployment.md)); LÕI chỉ yêu cầu: sự kiện không được mất và không làm lộ bài chưa đủ điều kiện công khai (BR-1, BR-5).

## 6. Câu hỏi mở

- [ ] Có khái niệm *bản nháp của bài đã xuất bản* (revision) không?
- [ ] Vòng đời của Chuyên mục/Thẻ (tạo/gộp/xoá)?
