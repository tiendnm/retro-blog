# Sprint 5 — Phase 1 (Pagination) — Ảnh

Chụp `2026-07-22` từ `astro dev`, fixture large+edge+stress (96 published).

| Ảnh | Ghi chú |
|---|---|
| ![home-desktop](./home-desktop.png) | Homepage trang 1/10 — nav dưới: **← Trước** (disabled, trang 1) · **Trang 1 / 10** · **Sau →** (link) |
| ![home-mobile](./home-mobile.png) | Mobile 390px — pagination không overflow |

- **Reach-all:** 10 trang homepage gom đủ **96 slug** = mọi bài published.
- **Biên a11y:** link chỉ khi có trang đích; biên (đầu/cuối) là `span[aria-disabled]` (không điều hướng).
- Overflow @390 = 0 mọi trang pagination (`/`, `/page/2`, `/category/cpu`, `/category/cpu/page/2`).
