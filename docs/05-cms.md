# 05 — CMS Mapping (Directus) — Implementation

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Mô tả *cách hiện thực* Content Model trên CMS được chọn — collections, interface field, phân quyền, flows/webhooks, preview. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03c-content-model](./03c-content-model.md) ← SSOT · [03b-domain-model](./03b-domain-model.md) · [12-security](./12-security.md) · [06-api](./06-api.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn CMS).** Content Model *trung lập CMS* là **nguồn sự thật** ở [03c-content-model](./03c-content-model.md); máy trạng thái & luật nghiệp vụ ở [03b-domain-model](./03b-domain-model.md). Tài liệu này **không định nghĩa lại** loại nội dung/field — chỉ mô tả ánh xạ sang CMS. Tuân [Nguyên tắc 0 & P2](./03a-architecture-principles.md).
>
> ℹ️ Directus là *lựa chọn implementation* — cần ADR ([10-decisions](./10-decisions.md)) và liệt kê ở `Tech Stack`. Thay CMS chỉ được chạm tài liệu này, không đụng [03b]/[03c].

## 1. Ánh xạ Content Type → Collection

> Với mỗi Content Type ở [03c §2](./03c-content-model.md), ghi tên collection + interface/kiểu field của CMS. KHÔNG chép lại danh sách field logic.

| Content Type (03c) | Collection (CMS) | Ghi chú interface/kiểu field |
|---|---|---|
| Post | posts | title→input, body→WYSIWYG/markdown... TODO |
| Author / Category / Tag / Media | ... | TODO |

## 2. Phân quyền (hiện thực Roles & Permissions)

> Hiện thực luật quyền nghiệp vụ ([03b §4](./03b-domain-model.md)) trên cơ chế role của CMS. Least privilege — chi tiết bảo mật [12-security](./12-security.md).

| Vai trò | Quyền (hiện thực trên CMS) |
|---|---|
| Public (API) | Chỉ đọc Post đã Published |
| Author / Editor / Admin | TODO |

## 3. Hiện thực workflow biên tập

- Ánh xạ máy trạng thái [03b §4](./03b-domain-model.md) sang trường/luồng của CMS; ai được chuyển trạng thái nào. TODO.

## 4. Preview bản nháp

- Cơ chế preview draft (token/route) của CMS. TODO.

## 5. Media & Assets

- Lưu trữ tệp, biến thể ảnh, bắt buộc alt text (a11y [15](./15-seo-accessibility.md)). TODO.

## 6. Flows / Webhooks / Automation

- Webhook khi Published → kích hoạt rebuild (xem [06-api §Webhooks](./06-api.md), [08-deployment](./08-deployment.md)). TODO.

## 7. Cấu hình & Môi trường (không chứa secret)

- Biến môi trường cần có, khác biệt theo môi trường. Secrets: [12-security](./12-security.md). TODO.
