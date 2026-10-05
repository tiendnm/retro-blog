# Architecture Decision Records (ADR)

> 🎯 **Mục đích:** Kho lưu các quyết định kiến trúc dưới dạng bản ghi ngắn, bất biến, đánh số tăng dần. Xem chỉ mục & quy trình tổng quan ở [../10-decisions.md](../10-decisions.md).

---

## Quy ước

- **Đặt tên file:** `NNNN-tiêu-đề-ngắn-kebab.md` (vd `0002-use-astro-site-generator.md`).
- **Đánh số:** tăng dần, không tái sử dụng số đã dùng.
- **Bất biến (immutable):** khi đã `Accepted`, không sửa nội dung quyết định. Thay đổi → tạo ADR mới, đánh dấu ADR cũ là `Superseded by ADR-NNNN`.
- **Ngắn gọn:** 1 quyết định / 1 file.
- **Bắt buộc (Governance G1):** mỗi ADR phải khai báo **Nguyên tắc tuân thủ (Principles)**, **Trade-off**, và **Chi phí migration nếu thay thế** — theo mẫu [`0000-adr-template.md`](./0000-adr-template.md).

## Cách tạo một ADR mới

1. Sao chép [`0000-adr-template.md`](./0000-adr-template.md) thành `NNNN-....md` với số tiếp theo.
2. Điền các mục, đặt **Status: Proposed**, khai báo Principles.
3. Mở Pull Request để thảo luận & review (dùng nguyên tắc làm gate — G2).
4. Khi đồng thuận → **Status: Accepted**, cập nhật bảng index ở [../10-decisions.md](../10-decisions.md) và (nếu là công nghệ) [../10a-tech-stack.md](../10a-tech-stack.md).

## Trạng thái

`Proposed` · `Accepted` · `Deprecated` · `Superseded by ADR-NNNN`

## Danh sách

| # | Tiêu đề | Trạng thái |
|---|---|---|
| [0001](./0001-record-architecture-decisions.md) | Ghi nhận quyết định bằng ADR | Proposed |
| [0002](./0002-use-astro-site-generator.md) | Dùng Astro (Presentation/Site) | **Accepted** |
| [0003](./0003-use-directus-headless-cms.md) | Dùng Directus (Headless CMS) | **Accepted** |
| [0004](./0004-use-postgresql-content-store.md) | Dùng PostgreSQL (Content Store) | **Accepted** |
| [0005](./0005-use-docker-packaging.md) | Dùng Docker (đóng gói & runtime) | **Accepted** |
| [0006](./0006-render-strategy.md) | Chiến lược render: SSG static-first | **Accepted** |
| [0007](./0007-reverse-proxy-and-tls.md) | Reverse proxy & TLS: Caddy | **Accepted** |
| [0008](./0008-rebuild-on-publish.md) | Rebuild-on-publish (Flow→webhook→swap) | **Accepted** |
| [0009](./0009-quality-tooling-biome-vitest.md) | Cổng chất lượng: Biome + Vitest | **Accepted** |
| [0010](./0010-external-postgres-instance.md) | PostgreSQL instance có sẵn trên host | **Accepted** |
| [0011](./0011-body-stored-as-html-wysiwyg.md) | `posts.body` lưu HTML (WYSIWYG) | **Accepted** |
