# ADR-0004 — Dùng PostgreSQL cho vai trò Content Store

> **Status:** Accepted <!-- ratified 2026-07-21 (Sprint 0 close-out); nội dung quyết định không đổi -->
> **Ngày đề xuất:** 2026-07-21 · **Ngày Accepted:** 2026-07-21
> **Người quyết định:** Tech Lead (ratified)
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P4 (Self-host first), P6 (Low coupling), P7 (High cohesion).

---

## Bối cảnh (Context)

Vai trò **Content Store** ([03-architecture §3](../03-architecture.md)) cần lưu trữ bền vững, quan hệ, toàn vẹn tham chiếu, khả năng full-text, và **self-hostable**. Data Model logic đã định nghĩa tech-neutral ở [03e](../03e-data-model.md).

## Quyết định (Decision)

Chọn **PostgreSQL** làm *adapter* cho vai trò Content Store (hiện thực port **Persistence** — [03e](../03e-data-model.md)). Chi tiết vật lý (kiểu cột, index, migration) nằm ở [04-database](../04-database.md).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4 Self-host | ✅ | OSS, chạy tự quản |
| P6 Low coupling | ✅ | Truy cập qua Content Service, không lộ ra Presentation |
| P7 High cohesion | ✅ | Một Content Store cho nội dung |
| P5 Cloud-ready | ✅ | Có dịch vụ managed nếu cần |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| PostgreSQL (đã chọn) | Quan hệ mạnh, JSON, full-text, hệ sinh thái | Vận hành/backup cần kỹ năng | — |
| MySQL / MariaDB | Phổ biến | Full-text/JSON kém linh hoạt hơn | Ưu thế thấp hơn |
| SQLite | Đơn giản, không cần server | Kém khi đồng thời/scale | Không hợp prod đa tiến trình |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** nền tảng dữ liệu vững, hỗ trợ tốt nhu cầu truy cập ở [03e §5](../03e-data-model.md).
**Tiêu cực / Đánh đổi:** cần quy trình backup/restore & vận hành ([13-operations](../13-operations.md)).
**Cần theo dõi:** phụ thuộc DB mà Content Service hỗ trợ.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** [04-database](../04-database.md) (kiểu cột/index/migration), cấu hình kết nối của Content Service.
- **LÕI KHÔNG ảnh hưởng:** [03e](../03e-data-model.md) (mô hình logic), [03c](../03c-content-model.md), [03b](../03b-domain-model.md).
- **Dữ liệu di trú:** có — dump & load, ánh xạ kiểu dữ liệu.
- **Mức chi phí:** **Trung bình** — Data Model logic giữ nguyên; chủ yếu là di trú dữ liệu & tinh chỉnh vật lý.

## Liên kết (Links)

- Kiến trúc: [../03-architecture.md](../03-architecture.md) · Persistence: [../04-database.md](../04-database.md) · Data Model: [../03e-data-model.md](../03e-data-model.md)
