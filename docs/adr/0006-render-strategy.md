# ADR-0006 — Chiến lược render: SSG static-first

> **Status:** Accepted <!-- ratified 2026-07-21 (Sprint 2 Phase 0) -->
> **Ngày đề xuất:** 2026-07-21 · **Ngày Accepted:** 2026-07-21
> **Người quyết định:** Tech Lead
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P3 (API-first), P4 (Self-host first), P5 (Cloud-ready); nhất quán [ADR-0002](./0002-use-astro-site-generator.md) (static-first) & NFR hiệu năng ([01 §2](../01-requirements.md)).

---

## Bối cảnh (Context)

Vai trò **Presentation / Site** ([03-architecture](../03-architecture.md)) cần một chiến lược render. Yêu cầu: hiệu năng đọc cao (Core Web Vitals — [01 §2 NFR](../01-requirements.md)), SEO tốt, **self-host / free cloud** đơn giản. [ADR-0002](./0002-use-astro-site-generator.md) đã chọn Astro với định hướng *static-first*. Sprint 2 cần lát cắt dọc: Editor publish → Reader xem.

## Quyết định (Decision)

Chúng ta chọn **SSG (static output)** làm chiến lược render mặc định: build sinh HTML tĩnh từ nội dung *published*.
- **Local dev:** `astro dev` render on-demand → trong phát triển, publish trong CMS → reader thấy **ngay** (dev server fetch live).
- **Production (static):** nội dung mới xuất hiện **sau khi rebuild**. **Sprint 2 KHÔNG** hiện thực rebuild tự động; **publish-triggered rebuild qua CI/CD (webhook → build → deploy) là future work** (ngoài Sprint 2, xem [08-deployment](../08-deployment.md)).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P3 API-first | ✅ | Pages tiêu thụ [API Contract 03d](../03d-api-contract.md) |
| P4 Self-host | ✅ | Output tĩnh host ở đâu cũng được |
| P5 Cloud-ready | ✅ | Deploy được lên static/free cloud |
| Hiệu năng (NFR) | ✅ | Tĩnh = nhanh, tốt Core Web Vitals |
| Nhất quán ADR-0002 | ✅ | Giữ static-first |
| Tức thời ở prod | ⚠️ | Nội dung mới cần rebuild (giải bằng CI/CD sau) |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| SSG static-first (đã chọn) | Nhanh, SEO tốt, host đơn giản/free, đúng static-first | Nội dung mới cần rebuild | — |
| SSR (`@astrojs/node`) | Instant cả ở prod | Cần server chạy liên tục, lệch static-first, self-host phức tạp hơn | Thừa nhu cầu MVP, lệch ADR-0002 |
| ISR / hybrid | Cân bằng | Phức tạp hơn nhu cầu hiện tại | Để lại khi cần |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** hiệu năng cao, SEO thuận lợi, hosting đơn giản/free.
**Tiêu cực / Đánh đổi:** ở production static, nội dung mới chỉ xuất hiện sau rebuild (chưa tự động trong Sprint 2).
**Cần theo dõi:** khi tần suất publish tăng → thêm **rebuild-on-publish (CI/CD)** hoặc chuyển hybrid; có thể `prerender=false` từng trang khi cần động.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** `apps/web/astro.config.mjs` (output) + thêm adapter (nếu SSR), một số page (`prerender`).
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md), [03c](../03c-content-model.md), [03d](../03d-api-contract.md), [03e](../03e-data-model.md).
- **Mức chi phí:** **Thấp–Trung bình** — render mode là quyết định tầng Presentation (RÌA); domain/contract giữ nguyên.

## Liên kết (Links)

- [ADR-0002](./0002-use-astro-site-generator.md) · [03-architecture](../03-architecture.md) · [01-requirements §2](../01-requirements.md) · Future: [08-deployment](../08-deployment.md) (rebuild pipeline)
