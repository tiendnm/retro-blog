# ADR-0003 — Dùng Directus cho vai trò Headless Content Service

> **Status:** Accepted <!-- ratified 2026-07-21 (Sprint 0 close-out); nội dung quyết định không đổi -->
> **Ngày đề xuất:** 2026-07-21 · **Ngày Accepted:** 2026-07-21
> **Người quyết định:** Tech Lead (ratified)
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P1 (Headless), P2 (CMS-agnostic), P4 (Self-host first), P6 (Low coupling).

---

## Bối cảnh (Context)

Vai trò **Headless Content Service** ([03-architecture §3](../03-architecture.md)) cần: quản trị nội dung có UI cho biên tập viên, phơi bày nội dung qua API, phân quyền theo vai trò, và **self-hostable** (P4). Content Model đã được định nghĩa tech-neutral ở [03c](../03c-content-model.md).

## Quyết định (Decision)

Chọn **Directus** làm *adapter* cho vai trò Headless Content Service. Directus là hiện thực của port **Content Authoring** ([03c](../03c-content-model.md)) và **Content API** ([03d](../03d-api-contract.md)); mọi ánh xạ cụ thể nằm ở [05-cms](../05-cms.md).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P1 Headless | ✅ | API-driven, tách trình bày |
| P2 CMS-agnostic | ✅ (có điều kiện) | Content Model ở LÕI; Directus chỉ là adapter ở [05](../05-cms.md) |
| P4 Self-host | ✅ | Chạy trên hạ tầng tự quản |
| P6 Low coupling | ✅ | Consumer phụ thuộc [03d](../03d-api-contract.md), không phụ thuộc nội bộ Directus |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| Directus (đã chọn) | Self-host, DB-backed, UI mạnh, REST/GraphQL | Gắn mô hình collection riêng | — |
| Strapi / Payload | Self-host, linh hoạt | Khác biệt mô hình/DX | Cân nhắc lại nếu Directus không đạt |
| Contentful (SaaS) | Vận hành nhẹ | Không self-host → vi phạm P4 | Loại vì P4 |
| WordPress headless | Phổ biến | Nặng, mô hình cũ | Không phù hợp |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** biên tập viên có UI ngay, API sẵn, self-host.
**Tiêu cực / Đánh đổi:** phụ thuộc vòng đời dự án OSS; ánh xạ Content Model → collection cần kỷ luật (không rò rỉ khái niệm Directus vào LÕI).
**Cần theo dõi:** chi phí nâng cấp phiên bản.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** [05-cms](../05-cms.md) (ánh xạ), [06-api](../06-api.md) (binding), cấu hình roles/flows.
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md), [03c](../03c-content-model.md), [03d](../03d-api-contract.md).
- **Dữ liệu di trú:** có — export nội dung + ánh xạ lại phân quyền/quan hệ.
- **Mức chi phí:** **Trung bình–Cao** — chủ yếu do di trú nội dung & phân quyền; hợp đồng & mô hình domain giữ nguyên.

## Liên kết (Links)

- Kiến trúc: [../03-architecture.md](../03-architecture.md) · CMS Mapping: [../05-cms.md](../05-cms.md) · Tech Stack: [../10a-tech-stack.md](../10a-tech-stack.md)
