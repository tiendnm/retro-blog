# 06 — API Implementation (Directus Binding)

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Mô tả *cách hiện thực* API Contract bằng backend được chọn — endpoint/truy vấn thật, xác thực, phân trang, caching ở tầng vận chuyển. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03d-api-contract](./03d-api-contract.md) ← SSOT · [05-cms](./05-cms.md) · [08-deployment](./08-deployment.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn transport).** Hợp đồng API *logic* là **nguồn sự thật** ở [03d-api-contract](./03d-api-contract.md); DTO định nghĩa ở đó. Tài liệu này **không định nghĩa lại** hợp đồng — chỉ ánh xạ sang endpoint/truy vấn cụ thể. Tuân [Nguyên tắc 0 & P3](./03a-architecture-principles.md).
>
> ℹ️ Directus (REST/GraphQL) và framework tiêu thụ (vd Astro) là *lựa chọn implementation* — cần ADR ([10-decisions](./10-decisions.md)), liệt kê ở `Tech Stack`.

## 1. Giao thức & Chiến lược fetch

| Hạng mục | Lựa chọn (dự kiến) | Ghi chú |
|---|---|---|
| Giao thức | REST / GraphQL | TBD — cần ADR |
| Chiến lược fetch | SSG (build-time) / SSR / ISR | TBD — xem [03-architecture §4](./03-architecture.md) |
| Xác thực | Public role / Static token | Không nhúng secret vào client ([12](./12-security.md)) |

## 2. Ánh xạ Contract → Endpoint

> Với mỗi thao tác ở [03d §2](./03d-api-contract.md), ghi endpoint/truy vấn thật. KHÔNG định nghĩa lại DTO (xem [03d §3](./03d-api-contract.md)).

| Thao tác (03d) | Endpoint/Query thật (mẫu) | Ánh xạ tới DTO |
|---|---|---|
| Liệt kê bài published | `GET /items/posts?filter[status]=published` | `PostSummary[]` |
| Lấy bài theo slug | `GET /items/posts?filter[slug]=…` | `PostDetail` |

> ⚠️ Mẫu minh hoạ, xác nhận theo cấu hình backend thực tế.

## 3. Phân trang / lọc / sắp xếp (hiện thực)

- Ánh xạ ngữ nghĩa ở [03d §4](./03d-api-contract.md) sang tham số thật. TODO.

## 4. Caching & Revalidation

- Cache ở đâu, TTL, invalidate khi nội dung đổi. TODO.

## 5. Xử lý lỗi & Fallback (hiện thực)

- Ánh xạ mô hình lỗi [03d §5](./03d-api-contract.md) sang mã lỗi thật; hành vi khi backend lỗi/timeout. TODO.

## 6. Webhooks (kích hoạt rebuild)

- Publish → webhook → trigger build/deploy. Xem [05-cms §6](./05-cms.md), [08-deployment](./08-deployment.md). TODO.
