# Sprint 5 — Phase 3 (Verify + Completion) — Ảnh

Chụp `2026-07-22` từ `astro dev`, fixture large+edge+stress (96 published) + seed dev.

| Ảnh | Ghi chú |
|---|---|
| ![home-desktop](./home-desktop.png) | Homepage desktop — pagination `← Trước` (disabled trang 1) · `Trang 1 / 10` · `Sau →` (link); long-title ngắt dòng |
| ![home-mobile](./home-mobile.png) | Homepage 390px — không tràn ngang; pagination gọn 1 hàng |
| ![category-desktop](./category-desktop.png) | Chuyên mục CPU — back-link + heading + list + pagination |
| ![detail-desktop](./detail-desktop.png) | Trang chi tiết — `.post` reading column, `.prose` |

- **Overflow @390 = 0** mọi trang kiểm (home/pagination/category/detail + edge/stress) **trừ** `edge-long-word` (=54px, UI-1 đã biết → Visual Backlog).
- **A11y:** skip-link ✓ · đúng 1 `<h1>`/trang · `main#main` landmark · `nav[aria-label]` (2 trên list = điều hướng chính + phân trang; 1 trên detail) · `lang=vi`.
- **SEO:** canonical self-referencing đúng mọi loại trang; `og:type` = `article` (detail) / `website` (còn lại).
