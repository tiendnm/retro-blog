# ADR-0005 — Dùng Docker để đóng gói & chạy

> **Status:** Accepted <!-- ratified 2026-07-21 (Sprint 0 close-out); nội dung quyết định không đổi -->
> **Ngày đề xuất:** 2026-07-21 · **Ngày Accepted:** 2026-07-21
> **Người quyết định:** Tech Lead (ratified)
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P4 (Self-host first), P5 (Cloud-ready), P7 (High cohesion).

---

## Bối cảnh (Context)

Cần cơ chế **đóng gói & chạy** nhất quán giữa các môi trường (dev/staging/prod), hỗ trợ cả **self-host** (P4) lẫn **cloud** (P5), cho các vai trò trong [03-architecture](../03-architecture.md) (Content Service, Content Store, Presentation build, Proxy).

## Quyết định (Decision)

Chọn **Docker (container)** làm cơ chế đóng gói & runtime. Cấu hình qua biến môi trường (12-factor) để cùng image chạy được ở nhiều môi trường. Chi tiết triển khai ở [08-deployment](../08-deployment.md), vận hành ở [13-operations](../13-operations.md).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4 Self-host | ✅ | Chạy trên bất kỳ host có container runtime |
| P5 Cloud-ready | ✅ | Image chạy được trên cloud, cấu hình qua env |
| P7 High cohesion | ✅ | Mỗi vai trò một container rõ trách nhiệm |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| Docker (đã chọn) | Chuẩn phổ biến, cô lập, tái lập | Thêm lớp vận hành | — |
| Chạy trực tiếp trên host | Đơn giản ban đầu | "Works on my machine", khó tái lập | Không nhất quán |
| Nix / Podman | Tái lập tốt / không daemon | Đường học dốc / ít phổ biến | Cân nhắc lại sau |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** môi trường nhất quán, dễ self-host & cloud.
**Tiêu cực / Đánh đổi:** cần orchestration khi scale; thêm kỹ năng vận hành.
**Cần theo dõi:** kích thước image, vá bảo mật base image ([12-security](../12-security.md)).

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** [08-deployment](../08-deployment.md), [13-operations](../13-operations.md) (cách đóng gói/chạy).
- **LÕI KHÔNG ảnh hưởng:** toàn bộ tầng LÕI (03b–03e) — đóng gói là concern hạ tầng thuần.
- **Dữ liệu di trú:** không (chỉ là runtime).
- **Mức chi phí:** **Thấp–Trung bình** — đổi cơ chế đóng gói, không đụng domain/dữ liệu.

## Liên kết (Links)

- Kiến trúc: [../03-architecture.md](../03-architecture.md) · Deployment: [../08-deployment.md](../08-deployment.md) · Operations: [../13-operations.md](../13-operations.md)
