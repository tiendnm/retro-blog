# Sprint 3 — Phase 4 (Consistency / Responsive / A11y) — Ảnh giao diện

Chụp `2026-07-22` từ `astro dev`, dữ liệu seed dev (3 bài published, không cover).
Desktop 1000px (Chrome headless). Mobile 390px DPR 2 (CDP device-emulation).

| Trang | Desktop | Mobile |
|---|---|---|
| Homepage | ![](./desktop-home.png) | ![](./mobile-home.png) |
| Category | ![](./desktop-category.png) | ![](./mobile-category.png) |
| Post Detail | ![](./desktop-detail.png) | ![](./mobile-detail.png) |

Cross-page **thống nhất**: cùng header/footer, typography, container, spacing scale,
heading hierarchy, card style, colors, border, visual rhythm. Sub-page (category,
detail) có back-link "← Trang chủ" nhất quán. Không trang nào overflow ngang @390px.
