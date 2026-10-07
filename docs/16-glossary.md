# 16 — Glossary (Ngôn ngữ chung)

> 🎯 **Mục đích:** Định nghĩa thống nhất các thuật ngữ nghiệp vụ & kỹ thuật (ubiquitous language) để mọi người — và tài liệu, code, giao diện — dùng cùng một từ với cùng một nghĩa. Tài liệu *sống*, bổ sung liên tục.
> 🔗 **Liên quan:** [00-project](./00-project.md) · [03b-domain-model](./03b-domain-model.md) · [03c-content-model](./03c-content-model.md)

---

## Thuật ngữ nghiệp vụ (Domain)

| Thuật ngữ | Định nghĩa | Ghi chú |
|---|---|---|
| Post (Bài viết) | Đơn vị nội dung chính của blog | Xem [03b](./03b-domain-model.md) |
| Draft (Bản nháp) | Bài chưa xuất bản, chỉ nội bộ thấy | Trạng thái workflow [03b §4](./03b-domain-model.md) |
| Published (Đã xuất bản) | Bài công khai cho độc giả | |
| Scheduled (Lên lịch) | Bài sẽ tự xuất bản vào thời điểm định trước | |
| Author (Tác giả) | Người viết bài | |
| Category (Chuyên mục) | Phân loại chính (1 bài — 1 category) | |
| Tag (Thẻ) | Nhãn tự do (nhiều-nhiều) | |
| Slug | Chuỗi định danh trên URL, duy nhất | |

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

> ➕ Thêm thuật ngữ mới ngay khi xuất hiện trong thảo luận để tránh hiểu nhầm.
