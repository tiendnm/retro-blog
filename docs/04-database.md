# 04 — Persistence / Database (Implementation)

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Mô tả *cách hiện thực vật lý* việc lưu trữ trên CSDL được chọn — kiểu cột, index, migration, seeding, backup hooks. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03e-data-model](./03e-data-model.md) ← SSOT · [03c-content-model](./03c-content-model.md) · [05-cms](./05-cms.md) · [13-operations](./13-operations.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn công nghệ).** Mô hình dữ liệu *logic* là **nguồn sự thật** ở [03e-data-model](./03e-data-model.md) — tài liệu này **không định nghĩa lại** thực thể/field, chỉ mô tả cách hiện thực vật lý. Tuân [Nguyên tắc 0](./03a-architecture-principles.md).
>
> ℹ️ Công nghệ CSDL cụ thể (vd PostgreSQL) là *lựa chọn implementation* — phải có ADR (xem [10-decisions](./10-decisions.md)) và được liệt kê ở `Tech Stack`.

## 1. Công nghệ lưu trữ được chọn

- CSDL: _TBD_ (cần ADR). Phiên bản, lý do chọn: xem ADR + `Tech Stack`.
- Lưu ý: nếu CMS tự quản schema, phần lớn cấu trúc do CMS sinh — xem [05-cms](./05-cms.md).

## 2. Ánh xạ Data Model logic → vật lý

> Với mỗi thực thể ở [03e §2](./03e-data-model.md), ghi kiểu cột thật & đặc thù CSDL. KHÔNG chép lại danh sách field logic.

| Thực thể (logic 03e) | Bảng vật lý | Ghi chú kiểu cột / đặc thù |
|---|---|---|
| Post | posts | TODO |
| ... | ... | ... |

## 3. Index & Tối ưu (vật lý)

> Hiện thực các *nhu cầu truy cập* ở [03e §5](./03e-data-model.md).

- unique index trên slug; index lọc status + published_at; full-text (nếu cần). TODO.

## 4. Migration

- Công cụ, quy trình review migration, rollback. TODO (cần ADR nếu chọn công cụ).

## 5. Seeding

- Dữ liệu khởi tạo dev/demo. TODO.

## 6. Backup & khôi phục (móc nối)

- Chi tiết vận hành & RPO/RTO: [13-operations](./13-operations.md). Ở đây: cơ chế dump/restore đặc thù CSDL. TODO.

## 7. Quy ước đặt tên vật lý

- snake_case, số nhiều... TODO (khác với quy ước logic ở [03e](./03e-data-model.md) thì ghi rõ ánh xạ).
