# ADR-0001 — Ghi nhận quyết định kiến trúc bằng ADR

> **Status:** Proposed <!-- Đề xuất trong Sprint 0, chờ team xác nhận Accepted -->
> **Ngày:** 2026-07-21
> **Người quyết định:** _(chờ team xác nhận)_
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** Nền tảng cho Governance G1/G2 ([../03a-architecture-principles.md](../03a-architecture-principles.md)); hỗ trợ P7 (High cohesion — mỗi quyết định một bản ghi).

---

## Bối cảnh (Context)

Dự án Retro Blog phát triển lâu dài, sẽ có nhiều quyết định kiến trúc (chọn framework, CMS, database, chiến lược render, hạ tầng...). Nếu không ghi lại *lý do*, người mới (hoặc chính chúng ta sau vài tháng) sẽ không hiểu bối cảnh, dễ lật lại quyết định cũ vô ích hoặc lặp lại sai lầm đã cân nhắc.

## Quyết định (Decision)

Chúng ta sẽ ghi nhận mọi quyết định kiến trúc quan trọng dưới dạng **Architecture Decision Record (ADR)**: mỗi quyết định là một file Markdown riêng trong `docs/adr/`, đánh số tăng dần, dùng mẫu [`0000-adr-template.md`](./0000-adr-template.md), và append-only (không sửa quyết định đã Accepted; thay đổi thì tạo ADR mới thay thế). Mỗi ADR **phải** khai báo Nguyên tắc tuân thủ (Governance G1).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| Governance G1/G2 | ✅ | ADR là cơ chế để cưỡng chế trích dẫn & review nguyên tắc |
| P7 High cohesion | ✅ | Một quyết định = một bản ghi |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| ADR (đã chọn) | Nhẹ, versioned cùng code, review qua PR | Cần kỷ luật duy trì | — |
| Chôn quyết định trong tài liệu dài | Không cần cấu trúc mới | Khó tìm, mất bối cảnh "tại sao" | Không truy vết được |
| Wiki/ngoài repo | Dễ viết | Tách rời code, dễ lỗi thời | Mất đồng bộ với code |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** có "bộ nhớ dài hạn" về lý do; onboarding nhanh hơn.
**Tiêu cực / Đánh đổi:** cần kỷ luật viết ADR cho mỗi quyết định lớn.
**Trung tính / Cần theo dõi:** chỉ mục ADR ở [../10-decisions.md](../10-decisions.md) phải được cập nhật.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- Nếu đổi định dạng ghi nhận quyết định (vd sang công cụ khác): thấp — chuyển đổi văn bản Markdown; không ảnh hưởng tài liệu LÕI.

## Liên kết (Links)

- Mẫu: [0000-adr-template.md](./0000-adr-template.md) · Chỉ mục: [../10-decisions.md](../10-decisions.md) · Nguyên tắc: [../03a-architecture-principles.md](../03a-architecture-principles.md)
