# Change report — Refactor tài liệu Đợt 3

> 🎯 Kết quả [Sprint 15](../sprints/sprint-15.md) theo [architecture review 2026-07-21](./architecture-review-2026-07-21.md). Chỉ đổi tài liệu (một chú thích trong `global.css`, xem dưới).

## 1. Trạng thái finding

| Finding | Trạng thái | Kết luận | Tài liệu đổi |
|---|---|---|---|
| F12 — thiếu Information Architecture | ✅ Đóng | Thêm `07a-information-architecture`, lập từ route và sitemap thật | `07a` (mới), `README` |
| F11 — Design System dính framework / nhập nhằng UI-UX | ✅ Đóng | Tách `07b-design-system` (token, hợp đồng thành phần, a11y, chuyển động; §7 là RÌA); `07-ui-ux` chỉ còn định hướng, bố cục, hành vi | `07b` (mới), `07`, `README`, `09 §7`, `15`, `01a §5` |
| F10 — thứ tự đọc | ✅ Đóng | Không renumber; `README §3` thành bảng theo phụ thuộc khái niệm, có quy tắc "chỉ dựa vào pha sớm hơn"; rà dòng "Liên quan" của LÕI: chỉ trỏ tài liệu nền tảng hoặc con trỏ hiện thực (`03e → 04`) | `README` |
| F9 — topology một nguồn | ✅ Đóng | `08 §2` là nguồn duy nhất cho topology triển khai; `13 §1` bỏ sơ đồ và bảng phiên bản (còn bảng vai trò vận hành, sửa chỗ lệch `cms.`/`postgres:16`); `03 §8` ghi rõ chủ sở hữu | `03 §8`, `13 §1` |
| F14 — Glossary ↔ Domain Model | ✅ Đóng | Glossary bỏ các luật (1 bài–1 chuyên mục, nhiều–nhiều, duy nhất) → chỉ định nghĩa một câu + liên kết tới `03b`; thêm Permalink, Taxonomy, Design token | `16` |
| F15 — SEO/a11y gộp | ✅ Đóng (giữ gộp) | `15` ≈ 8,9 KB: Phần A+A0 ≈ 6,5 KB, Phần B ≈ 2,3 KB, B không tham chiếu SEO; cùng đo trên trang xuất ra, dùng chung `site-checks`; tách sẽ phải nối lại 27 liên kết/11 neo. Ngưỡng xem lại: B > ≈ 5 KB hoặc có quy trình a11y thủ công riêng | `15` (ghi quyết định) |

## 2. Bài kiểm no-lock-in (cuối sprint)

- Quét tên công nghệ/sản phẩm (framework, CMS, CSDL, container, proxy, CI, thư viện) trong `03b/03c/03d/03e`: **0 vi phạm**.
- `07a §1–§6` và `07b §1–§6` (phần khái niệm): chỉ còn chuẩn web (RSS, sitemap, CSS media) và lựa chọn phông IBM Plex Mono — là giá trị thiết kế, không phải công nghệ khoá; tên framework/thư viện chỉ ở §7 (RÌA).

## 3. Phát hiện khi đối chiếu với hệ thống thật

- `07 §2` cũ thiếu `--color-card` và `--container-wide` (có trong CSS); tương phản `--color-text` ghi 12,6 nhưng tính ra 12,5 → `07b §3` đã sửa, thêm cột tương phản trên `surface` và `card`.
- **404 trên production:** `404.astro` sinh `404.html` có nhận diện site nhưng Caddy trả văn bản trơn; chú thích trong `404.astro` đã lệch → ghi ở `07a §8` (Backlog, ngoài phạm vi: cần đổi cấu hình proxy).
- Không có chuyển hướng khi đổi slug, không có trang liệt kê thẻ, không có feed theo chuyên mục → `07a §8` (Backlog).

## 4. Thay đổi ngoài tài liệu

- `apps/web/src/styles/global.css`: chỉ sửa **một dòng chú thích** (trỏ `docs/07-ui-ux.md §2` → `docs/07b-design-system.md §3`); không đổi hành vi.
