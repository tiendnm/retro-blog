# 📝 Sprint 14 — Nợ tài liệu: dọn TODO/TBD và sửa chỗ lệch thực tế

> **Vai trò:** Technical Writer · **Mục tiêu:** mỗi `TODO`/`TBD` còn lại trong `docs/` được **điền từ sự thật hiện có, xoá, hoặc giữ có chủ đích kèm lý do**; docs khớp với hệ thống đang chạy. Chỉ sửa tài liệu và thêm một script kiểm link tài liệu; không đổi cấu trúc LÕI/RÌA (đó là [Sprint 15](./sprint-15.md)).
> 🔗 [17-contributing](../17-contributing.md) · [14-quality-gates](../14-quality-gates.md) · [02-roadmap](../02-roadmap.md)

## Bối cảnh
- Đếm ngày 2026-11-01: ~70 chỗ `TODO`/`TBD` trong 17 file. Nhiều nhất: `00-project` (9), `09-coding-standards` (9), `13-operations` (8 → phần lớn sẽ được [Sprint 12](./sprint-12.md) xử lý), `04-database` (7), `03b-domain-model` (6), `03e-data-model` (5), `12-security` (5), `03-architecture` (4), `07-ui-ux` (3), `15-seo-accessibility` (3).
- Một phần là TODO của thời Sprint 0 (chưa có hệ thống để mô tả); nay hệ thống đã chạy nên nhiều ô điền được ngay.
- Lệch thực tế đã biết: `08a` hướng dẫn clone vào `/opt/retro-blog`, server thật dùng `~/retro-blog`; bảng Sprint 8 ở roadmap còn ghi "backup/healthcheck timers chưa" dù Sprint 10 đã đưa vào compose; các checklist trong `14-quality-gates` là mẫu nhưng đọc như đang dang dở.

## Quy tắc
- Mỗi chỗ TODO thuộc đúng một nhóm: **(a) điền** từ code/cấu hình/quy trình thật · **(b) xoá** vì không còn cần · **(c) giữ** kèm lý do và sprint đích. Không để TODO trơ trọi.
- Không bịa nội dung: ô nào cần quyết định của Product thì ghi "Product chưa chốt" kèm câu hỏi cụ thể, đưa vào Kết quả.
- Docs không dùng header Trạng thái/Owner/Cập nhật lần cuối/Người duyệt; không giữ file chỉ toàn TODO ([17 §2](../17-contributing.md)).
- Tuân Nguyên tắc 0: không đưa tên công nghệ vào tầng LÕI khi điền.

## Phạm vi
### A. Phân loại
- [ ] Liệt kê toàn bộ TODO/TBD (vị trí + nhóm a/b/c + đề xuất) thành bảng ngắn ở đầu Kết quả; Product xem một lần trước khi điền hàng loạt (chỉ các ô nhóm (c) và ô cần quyết định).

### B. Điền theo mức ưu tiên
- [ ] **Ưu tiên 1 — vận hành & bảo mật:** `12-security` (checklist phát hành §11, 2FA, mục còn lại), `13-operations` (phần Sprint 12 chưa phủ), `08-deployment`/`08a` (đường dẫn repo thật, các bước đã đổi sau Sprint 10).
- [ ] **Ưu tiên 2 — kỹ thuật:** `09-coding-standards` (quy ước thực tế: Biome, TypeScript, đặt tên, cấu trúc `apps/web/src`, commit), `04-database`, `11-testing`, `10a-tech-stack`.
- [ ] **Ưu tiên 3 — nền tảng/khái niệm:** `00-project`, `01-requirements`, `03-architecture`, `03b/03c/03e`, `07-ui-ux`, `15`, `16-glossary`: điền khi có thông tin thật; nếu mô tả khái niệm cần quyết định (vd mục tiêu sản phẩm) thì hỏi Product.

### C. Sửa chỗ lệch thực tế
- [ ] Rà soát một lượt các khẳng định dễ cũ: phiên bản (Node, Directus, Caddy, Postgres, cloudflared, Astro), đường dẫn, tên biến môi trường, lệnh trong README/runbook so với `docker-compose*.yml`, `.env.production.example`, `scripts/`.
- [ ] Bảng Sprint 8 ở roadmap và các "Chưa xác nhận" đã lỗi thời trong `sprint-6/8/9.md`: thêm ghi chú "đã xử lý ở Sprint N" thay vì sửa lịch sử.
- [ ] `14-quality-gates`: tách rõ **mẫu checklist** (dùng cho mỗi PR/sprint) khỏi **trạng thái dự án**; không để ô trống gây hiểu nhầm là việc tồn đọng.

### D. Tự động kiểm tài liệu
- [ ] `scripts/check-docs.mjs` (Node thuần): mọi link tương đối trong `docs/` và `README.md` trỏ tới file/neo có thật; cảnh báo `TODO`/`TBD` mới xuất hiện ngoài danh sách cho phép (file `docs/.todo-allowlist` ghi lý do từng mục giữ).
- [ ] Gắn vào job `quality` của CI (nhanh, không cần Docker).

## Ngoài phạm vi / Backlog
- Tách/đổi cấu trúc tài liệu, thêm tầng mới, đổi tên/đánh số → Sprint 15.
- Viết lại nội dung đã đúng chỉ vì văn phong; dịch tài liệu; trang tài liệu công khai.

## Tiêu chí xong
- Số `TODO`/`TBD` ngoài allowlist bằng 0; mỗi mục trong allowlist có lý do và sprint đích.
- `scripts/check-docs.mjs` xanh trong CI; cố ý làm hỏng một link thì job đỏ.
- Danh sách lệch thực tế ở mục C đã sửa; Product xác nhận các ô cần quyết định.

## Cổng review
Chỉ **cuối sprint** (docs/CI nhẹ, không phải hạ tầng/bảo mật/schema/kiến trúc). Hỏi Product giữa sprint chỉ khi gặp ô cần quyết định.

## Kết quả
_(điền khi xong sprint: bảng phân loại, số TODO trước/sau, các câu hỏi đã chốt)_
