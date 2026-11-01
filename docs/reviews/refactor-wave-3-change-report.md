# Change report — Refactor tài liệu Đợt 3

> 🎯 Kết quả [Sprint 15](../sprints/sprint-15.md) theo [architecture review 2026-07-21](./architecture-review-2026-07-21.md). Chỉ đổi tài liệu (một chú thích trong `global.css`, xem dưới).

## 1. Trạng thái finding

| Finding | Trạng thái | Kết luận | Tài liệu đổi |
|---|---|---|---|
| F12 — thiếu Information Architecture | ✅ Đóng | Thêm `07a-information-architecture`, lập từ route và sitemap thật | `07a` (mới), `README` |
| F11 — Design System dính framework / nhập nhằng UI-UX | ✅ Đóng | Tách `07b-design-system` (token, hợp đồng thành phần, a11y, chuyển động; §7 là RÌA); `07-ui-ux` chỉ còn định hướng, bố cục, hành vi | `07b` (mới), `07`, `README`, `09 §7`, `15`, `01a §5` |
| F10 — thứ tự đọc | ✅ Đóng | Không renumber; `README §3` thành bảng theo phụ thuộc khái niệm, có quy tắc "chỉ dựa vào pha sớm hơn"; rà dòng "Liên quan" của LÕI: chỉ trỏ tài liệu nền tảng hoặc con trỏ hiện thực (`03e → 04`) | `README` |
| F9 — topology một nguồn | ⏳ | | |
| F14 — Glossary ↔ Domain Model | ⏳ | | |
| F15 — SEO/a11y gộp | ⏳ | | |

## 2. Phát hiện khi đối chiếu với hệ thống thật

- `07 §2` cũ thiếu `--color-card` và `--container-wide` (có trong CSS); tương phản `--color-text` ghi 12,6 nhưng tính ra 12,5 → `07b §3` đã sửa, thêm cột tương phản trên `surface` và `card`.
- **404 trên production:** `404.astro` sinh `404.html` có nhận diện site nhưng Caddy trả văn bản trơn; chú thích trong `404.astro` đã lệch → ghi ở `07a §8` (Backlog, ngoài phạm vi: cần đổi cấu hình proxy).
- Không có chuyển hướng khi đổi slug, không có trang liệt kê thẻ, không có feed theo chuyên mục → `07a §8` (Backlog).

## 3. Thay đổi ngoài tài liệu

- `apps/web/src/styles/global.css`: chỉ sửa **một dòng chú thích** (trỏ `docs/07-ui-ux.md §2` → `docs/07b-design-system.md §3`); không đổi hành vi.
