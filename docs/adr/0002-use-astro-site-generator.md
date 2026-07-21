# ADR-0002 — Dùng Astro cho vai trò Presentation / Site Generator

> **Status:** Accepted <!-- ratified 2026-07-21 (Sprint 0 close-out); nội dung quyết định không đổi -->
> **Ngày đề xuất:** 2026-07-21 · **Ngày Accepted:** 2026-07-21
> **Người quyết định:** Tech Lead (ratified)
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P1 (Headless), P3 (API-first), P5 (Cloud-ready), P6 (Low coupling).

---

## Bối cảnh (Context)

Vai trò **Presentation / Site** ([03-architecture §3](../03-architecture.md)) cần render trang blog cho độc giả với ưu tiên hiệu năng đọc (Core Web Vitals — [01-requirements](../01-requirements.md)), SEO tốt, và tiêu thụ nội dung từ một Headless Content Service qua **API Contract** ([03d](../03d-api-contract.md)).

## Quyết định (Decision)

Chọn **Astro** làm *adapter* cho vai trò Presentation/Site (ưu tiên mô hình static-first + islands). Astro chỉ được phép phụ thuộc vào **API Contract** ([03d](../03d-api-contract.md)), không phụ thuộc chi tiết CMS.

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P1 Headless | ✅ | Astro tiêu thụ nội dung qua API |
| P3 API-first | ✅ | Chỉ phụ thuộc DTO của [03d](../03d-api-contract.md) |
| P5 Cloud-ready | ✅ | Output tĩnh, deploy đâu cũng được |
| P6 Low coupling | ✅ | Qua port Content API |
| P2 CMS-agnostic | ⚠️ | Cần kỷ luật: không gọi thẳng API riêng của CMS trong component |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| Astro (đã chọn) | Static-first, nhẹ, islands, đa framework | Hệ sinh thái trẻ hơn | — |
| Next.js | Mạnh, phổ biến | Nặng cho blog tĩnh, hướng React | Thừa nhu cầu |
| Hugo / Eleventy | Rất nhanh | Ít tương tác động, template khác biệt | Kém linh hoạt UI |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** hiệu năng cao, ít JS mặc định, SEO thuận lợi.
**Tiêu cực / Đánh đổi:** interactivity phức tạp cần thêm framework qua islands.
**Trung tính:** cần chuẩn hoá cách fetch dữ liệu bám [03d](../03d-api-contract.md).

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** tầng Presentation ([06-api](../06-api.md) phần tiêu thụ, [07-ui-ux](../07-ui-ux.md) components/templates).
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md), [03c](../03c-content-model.md), [03d](../03d-api-contract.md), [03e](../03e-data-model.md).
- **Dữ liệu di trú:** không (Astro không giữ state nội dung).
- **Mức chi phí:** **Trung bình** — viết lại component/template, giữ nguyên hợp đồng dữ liệu.

## Liên kết (Links)

- Kiến trúc: [../03-architecture.md](../03-architecture.md) · Tech Stack: [../10a-tech-stack.md](../10a-tech-stack.md) · Nguyên tắc: [../03a-architecture-principles.md](../03a-architecture-principles.md)
