# 16 — Glossary (Ngôn ngữ chung)

> 🎯 **Mục đích:** Định nghĩa thống nhất các thuật ngữ nghiệp vụ & kỹ thuật (ubiquitous language) để mọi người — và tài liệu, code, giao diện — dùng cùng một từ với cùng một nghĩa. Tài liệu *sống*, bổ sung liên tục.
> 🔗 **Liên quan:** [00-project](./00-project.md) · [03b-domain-model](./03b-domain-model.md) · [03c-content-model](./03c-content-model.md) · [07a](./07a-information-architecture.md)

---

## Thuật ngữ nghiệp vụ (Domain)

| Thuật ngữ | Định nghĩa | Ghi chú |
|---|---|---|
| Post (Bài viết) | Đơn vị nội dung chính của blog | [03b §2](./03b-domain-model.md) |
| Draft (Bản nháp) | Bài chưa xuất bản, chỉ nội bộ thấy | Luật chuyển trạng thái: [03b §4](./03b-domain-model.md) |
| Published (Đã xuất bản) | Bài công khai cho độc giả | [03b §3–§4](./03b-domain-model.md) |
| Scheduled (Lên lịch) | Bài sẽ tự xuất bản vào thời điểm định trước | Phạm vi v1: [03b §4](./03b-domain-model.md) |
| Author (Tác giả) | Người viết bài | [03b §2](./03b-domain-model.md) |
| Category (Chuyên mục) | Phân loại chính của bài | Ràng buộc: [03b BR-3](./03b-domain-model.md) |
| Tag (Thẻ) | Nhãn tự do gắn vào bài | Ràng buộc: [03b BR-3](./03b-domain-model.md) |
| Slug | Chuỗi định danh của một đối tượng trên URL | Luật: [03b BR-2](./03b-domain-model.md); URL: [07a §3](./07a-information-architecture.md) |
| Permalink | URL cố định của một trang | [07a §3](./07a-information-architecture.md) |
| Taxonomy | Cách phân loại bài (chuyên mục, thẻ, tác giả, thời gian) | [07a §2](./07a-information-architecture.md) |

## Thuật ngữ kỹ thuật (Technical)

| Thuật ngữ | Định nghĩa | Ghi chú |
|---|---|---|
| Headless CMS | Hệ quản trị nội dung tách phần backend khỏi phần hiển thị | Directus |
| Collection | "Bảng"/tập nội dung trong Directus | [05](./05-cms.md) |
| SSG | Static Site Generation — build sẵn HTML lúc build | |
| SSR | Server-Side Rendering — render lúc request | |
| ISR | Incremental Static Regeneration — dựng lại tĩnh dần | |
| ADR | Architecture Decision Record | [adr/](./adr/) |
| Data contract | Hình dạng dữ liệu đã thống nhất giữa hai lớp | [03d](./03d-api-contract.md) |
| DoR / DoD | Definition of Ready / Done | [14](./14-quality-gates.md) |
| Core Web Vitals | Bộ chỉ số trải nghiệm (LCP/CLS/INP) | [01](./01-requirements.md) |
| Design token | Giá trị thị giác có tên (màu, cỡ chữ, khoảng cách) dùng chung | [07b §3](./07b-design-system.md) |

> ➕ Thêm thuật ngữ mới ngay khi xuất hiện trong thảo luận để tránh hiểu nhầm.
