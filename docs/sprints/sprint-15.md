# 🏛️ Sprint 15 — Refactor tài liệu Đợt 3: trật tự, Information Architecture, Design System

> **Vai trò:** Software Architect (tài liệu) · **Mục tiêu:** hoàn tất Đợt 3 của refactor docs theo [architecture review 2026-07-21](../reviews/architecture-review-2026-07-21.md): đóng các finding còn mở (F9, F10, F11, F12, F14, F15), kèm **change report**. Chỉ tài liệu; không đổi code, schema, hạ tầng.
> 🔗 [03a-architecture-principles](../03a-architecture-principles.md) · [03-architecture](../03-architecture.md) · [07-ui-ux](../07-ui-ux.md) · [15-seo-accessibility](../15-seo-accessibility.md) · [16-glossary](../16-glossary.md)

## Bối cảnh
- Đợt 1 (tách LÕI `03b/03c/03d/03e`) và Đợt 2 (ports & adapters cho `03`, `10a-tech-stack`, ADR stack, `03a` nguyên tắc) đã xong; F1–F8 và F13 đã được giải quyết ở đó.
- Còn lại (theo review): **F9** topology mô tả ở 3 nơi · **F10** thứ tự/đánh số đảo so với phụ thuộc khái niệm · **F11** Design System dính tên framework / nhập nhằng với UI-UX · **F12** thiếu *site Information Architecture* · **F14** ranh giới Glossary ↔ Domain Model · **F15** SEO + a11y gộp một file.
- Quyết định đã chốt của Product (giữ nguyên): **giữ hệ thống số 00–17**, chèn tài liệu mới bằng **hậu tố chữ**, không renumber; mỗi tầng một file; "Navigation" = Information Architecture của website; LÕI trung lập công nghệ, tên công nghệ chỉ ở RÌA/Tech Stack.
- Khác với lúc review: nay có **hệ thống thật** để đối chiếu (route, sitemap, token CSS), nên IA và Design System mô tả cái đã xây, không phải phỏng đoán.

## Quy trình
- Làm theo **từng nhóm finding**, mỗi nhóm một commit, rồi một **change report** cuối sprint (tài liệu nào đổi, finding nào đóng, link nào đổi).
- Trước khi sửa mỗi finding: kiểm lại hiện trạng (có thể đã được xử lý một phần); finding đã xong thì đánh dấu đóng, không làm lại.
- Chạy `scripts/check-docs.mjs` ([Sprint 14](./sprint-14.md)) sau mỗi nhóm để không gãy link.

## Phạm vi
- [x] **F12 — Information Architecture của site** (`07a-information-architecture.md`): sơ đồ route, taxonomy (chuyên mục, thẻ, tác giả, lưu trữ theo năm), quy tắc permalink/canonical, phân cấp điều hướng, trang đặc biệt (404, search, RSS, sitemap), phân trang. Lập từ `apps/web/src/pages/` và `sitemap.xml` thật; trung lập công nghệ ở phần khái niệm, phần ánh xạ sang file route nằm ở mục RÌA riêng.
- [x] **F11 — Design System:** tách `Design System` (token, nguyên tắc, hợp đồng thành phần, a11y; trung lập framework) khỏi `UI/UX` (luồng, bố cục, nội dung) và khỏi phần binding Astro/CSS. Token ghi theo giá trị thật trong `apps/web/src/styles`.
- [x] **F9 — Topology một nguồn:** chọn **một** nơi làm SSOT cho topology triển khai (đề xuất `08-deployment §2`); `03 §3` chỉ giữ vai trò logic/ports, `13 §1` trỏ về SSOT, không lặp sơ đồ.
- [x] **F10 — Thứ tự đọc:** không renumber; thêm bảng "thứ tự đọc theo phụ thuộc khái niệm" ở `README` của docs và sửa các liên kết "Liên quan" cho khớp.
- [x] **F14 — Glossary ↔ Domain Model:** Glossary chỉ định nghĩa thuật ngữ (một câu + liên kết), Domain Model giữ luật/ràng buộc; loại phần lặp.
- [x] **F15 — SEO/A11y:** đo kích thước và mức đan xen sau [Sprint 11](./sprint-11.md); **quyết định** giữ gộp hoặc tách (`15a`/`15b`), ghi lý do. Nếu tách thì giữ số `15` cho phần SEO.
- [x] **Change report** `docs/reviews/refactor-wave-3-change-report.md`: bảng finding → trạng thái → tài liệu đổi; cập nhật bảng ở `02-roadmap` và đánh dấu F1–F15 hoàn tất.
- [x] Bài kiểm **no-lock-in** lần cuối: tìm tên công nghệ trong các file LÕI (`03b/03c/03d/03e`, `07a` phần khái niệm); ngoài RÌA/Tech Stack thì xoá hoặc chuyển.

## Ngoài phạm vi / Backlog
- Thay đổi code hoặc cấu trúc thư mục `apps/web` theo IA mới (nếu IA lộ ra điểm bất hợp lý → ghi Backlog, không sửa).
- Đổi sang hệ thống số khác; tài liệu mới ngoài danh sách trên.

## Tiêu chí xong
- F9–F12, F14, F15 đều có kết luận (đóng/hoãn kèm lý do) trong change report.
- `07a` khớp với route thật (đối chiếu từng route trong sitemap); Design System token khớp CSS thật.
- `check-docs` xanh; bài kiểm no-lock-in không còn vi phạm ở tầng LÕI.
- Product duyệt change report.

## Cổng review
Đây là thay đổi **kiến trúc tài liệu** → dừng chờ Product **một lần giữa sprint** sau nhóm F12 + F11 (hai tài liệu mới), và một lần cuối sprint cho change report.

## Kết quả
Cả 6 finding đóng, không hoãn: F12 → `07a`; F11 → `07b` + `07` thu gọn; F10 → bảng thứ tự đọc ở `README §3`; F9 → `08 §2` là nguồn duy nhất; F14 → Glossary chỉ còn định nghĩa + liên kết; F15 → giữ gộp (lý do và ngưỡng xem lại trong `15`). Chi tiết, bài kiểm no-lock-in và phát hiện (404 production trả văn bản trơn, thiếu chuyển hướng slug…): [change report](../reviews/refactor-wave-3-change-report.md). Ngoài tài liệu chỉ sửa một dòng chú thích ở `global.css`.
