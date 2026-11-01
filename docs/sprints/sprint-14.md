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
- [x] Liệt kê toàn bộ TODO/TBD (vị trí + nhóm a/b/c + đề xuất) thành bảng ngắn ở đầu Kết quả; Product xem một lần trước khi điền hàng loạt (chỉ các ô nhóm (c) và ô cần quyết định).

### B. Điền theo mức ưu tiên
- [x] **Ưu tiên 1 — vận hành & bảo mật:** `12-security` (checklist phát hành §11, 2FA, mục còn lại), `13-operations` (phần Sprint 12 chưa phủ), `08-deployment`/`08a` (đường dẫn repo thật, các bước đã đổi sau Sprint 10).
- [x] **Ưu tiên 2 — kỹ thuật:** `09-coding-standards` (quy ước thực tế: Biome, TypeScript, đặt tên, cấu trúc `apps/web/src`, commit), `04-database`, `11-testing`, `10a-tech-stack`.
- [x] **Ưu tiên 3 — nền tảng/khái niệm:** `00-project`, `01-requirements`, `03-architecture`, `03b/03c/03e`, `07-ui-ux`, `15`, `16-glossary`: điền khi có thông tin thật; nếu mô tả khái niệm cần quyết định (vd mục tiêu sản phẩm) thì hỏi Product.

### C. Sửa chỗ lệch thực tế
- [x] Rà soát một lượt các khẳng định dễ cũ: phiên bản (Node, Directus, Caddy, Postgres, cloudflared, Astro), đường dẫn, tên biến môi trường, lệnh trong README/runbook so với `docker-compose*.yml`, `.env.production.example`, `scripts/`.
- [x] Bảng Sprint 8 ở roadmap và các "Chưa xác nhận" đã lỗi thời trong `sprint-6/8/9.md`: thêm ghi chú "đã xử lý ở Sprint N" thay vì sửa lịch sử.
- [x] `14-quality-gates`: tách rõ **mẫu checklist** (dùng cho mỗi PR/sprint) khỏi **trạng thái dự án**; không để ô trống gây hiểu nhầm là việc tồn đọng.

### D. Tự động kiểm tài liệu
- [x] `scripts/check-docs.mjs` (Node thuần): mọi link tương đối trong `docs/` và `README.md` trỏ tới file/neo có thật; cảnh báo `TODO`/`TBD` mới xuất hiện ngoài danh sách cho phép (file `docs/.todo-allowlist` ghi lý do từng mục giữ).
- [x] Gắn vào job `quality` của CI (nhanh, không cần Docker).

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
### A. Bảng phân loại (2026-11-02)

Đếm lại: **55 chỗ** `TODO`/`TBD` trong 17 file tài liệu "sống" (`13-operations` đã sạch từ Sprint 12). Ngoài ra 27 lần xuất hiện trong `sprints/*`, `adr/0009`, `17-contributing` — là **lịch sử/mô tả quy tắc**, không phải ô trống → script bỏ qua `sprints/`, `adr/`, `reviews/` và dòng mô tả quy tắc ở `17`.

| File (số chỗ) | Nhóm | Điền từ nguồn nào / đề xuất |
|---|---|---|
| `00-project` (9) | **a + hỏi Product** | Tôi soạn nháp §1–§5, §8 từ `01a`, hướng nội dung retro-computing, NFR; Product xác nhận câu chữ tầm nhìn/mục tiêu (Q1). §6–§7 điền persona/stakeholder thật (Product + Admin/Editor là một người) |
| `01-requirements` (2) | a | Ràng buộc: server nhà + Cloudflare Tunnel, ngân sách 0 hạ tầng trả phí; trình duyệt hỗ trợ (Q3) |
| `02-roadmap` (1) | a | Đổi trạng thái Sprint 14 khi xong |
| `03-architecture` (4) | a | Thứ tự thuộc tính chất lượng lấy từ `03a`; actor ngoài: Cloudflare, GitHub Actions; chiến lược render = SSG theo ADR-0006 (đã Accepted) |
| `03b-domain-model` (6) | a + c | Sơ đồ khái niệm (a); BR-4/BR-5 và "ai được chuyển trạng thái" lấy từ quyền Admin/Editor thực tế (a); *Lưu trữ/Chờ duyệt/Lên lịch* (c): giữ, là Nice/Future ở `01a` |
| `03c-content-model` (1), `05-cms` (1) | c | Đa ngôn ngữ — Future theo `01a §5`; giữ, ghi "xem lại khi có Product yêu cầu i18n" |
| `03e-data-model` (5) | a + c | Xoá Author bị chặn (đúng với schema thật), audit field, tìm kiếm = chỉ mục tĩnh phía client (a); thời gian lưu giữ bản gỡ/revision (c, Q3) |
| `04-database` (7) | a | Tên bảng, index, migration (snapshot schema + `schema:apply`), seed, dump/restore (`restore-drill.sh`) đều đã có thật |
| `07-ui-ux` (3) | a + b | `prefers-reduced-motion` đã làm; nguồn Figma → xoá (không có, thiết kế sống trong code) |
| `09-coding-standards` (9) | a | Biome/TS/Astro/CSS/lỗi/dependency (Dependabot) đều có quy ước thực tế trong repo |
| `10a-tech-stack` (2) | a | Edge = Caddy; CI/CD = GitHub Actions + `deploy-home.sh` |
| `12-security` (4) | a + hỏi Product | Quyền riêng tư (không cookie/analytics/PII) và log (a); **2FA admin** và **kênh báo lỗ hổng** cần Product (Q2) |
| `14-quality-gates` (1) | a | Tách mẫu checklist khỏi trạng thái dự án (mục C) |
| `15-seo-accessibility` (3) | a | Mục tiêu SEO, trách nhiệm a11y — đã có số đo từ Sprint 11 |

**Câu hỏi cho Product (chỉ những gì tôi không tự bịa được):**
- **Q1** `00-project`: tôi soạn nháp elevator pitch/tầm nhìn/mục tiêu; Product duyệt hoặc sửa câu chữ.
- **Q2** `12-security`: bật 2FA cho tài khoản admin Directus trước phát hành? Kênh nhận báo lỗ hổng (email/GitHub private advisory/không nhận)?
- **Q3** Trình duyệt hỗ trợ (đề xuất: bản evergreen mới nhất, không IE/Legacy) và thời gian lưu giữ bài đã gỡ/revision (đề xuất: không lưu thêm, xoá là xoá).

### Đã chốt với Product (2026-11-02)
- **2FA admin:** không bật, chấp nhận rủi ro → `12 §3`, §11.
- **Kênh báo lỗ hổng:** không lập kênh riêng → `12 §10` (ghi rõ site chưa có trang liên hệ; điểm công khai duy nhất là repo GitHub).
- **Trình duyệt hỗ trợ / lưu giữ:** evergreen mới nhất; không giữ revision hay kho bài gỡ → `01 §3`, `03e §6`.

### Kết quả
| | Trước | Sau |
|---|---|---|
| `TODO`/`TBD` trong tài liệu sống (17 file) | 55 | **0** |
| Mục trong `docs/.todo-allowlist` | — | 0 (file có sẵn để giữ có chủ đích sau này) |
| Link/neo tương đối được kiểm tự động | 0 | 1097 link, 73 file |

- **Nhóm (c) — giữ có chủ đích:** không còn ô nào ở dạng `TODO`; các mục chưa làm được chuyển thành câu **"chưa hiện thực / Future"** kèm lý do: i18n (`03c §6`, `15 A7`), `BreadcrumbList` (`15 A3`), trạng thái *Chờ duyệt/Lên lịch/Lưu trữ* (`03b §4`), preview bản nháp (`05 §4`).
- **Lệch thực tế đã sửa:** `09 §1` ghi TypeScript 5.x (thực tế 6.0.3) · `12 §6` ghi cloudflared 2026.10.5 (compose dùng 2026.10.6) · `08a` + `README` hướng dẫn `/opt/retro-blog` (server thật `~/retro-blog`) · `15` còn ghi JSON-LD "chưa làm" dù đã có từ 2026-11-01 · roadmap Sprint 8 và `sprint-9.md` có ghi chú "đã xử lý ở Sprint 10/12" · `14` tách mẫu checklist khỏi trạng thái. Quét tên biến môi trường trong docs so với `.env*`/compose/scripts: không lệch (7 tên "không thấy" đều là biến cố ý để mặc định, mã lỗi hoặc ví dụ).
- **Script `scripts/check-docs.mjs`** (`pnpm docs:check`), bước mới trong job `quality` (bắt buộc). Đã thử phản chứng cục bộ: link hỏng, neo sai, `TODO` mới, mục allowlist thừa → mỗi loại exit 1; dọn xong → exit 0. **Chưa thấy chạy trên GitHub Actions** (chưa push). Quét `docs/` trừ `sprints/`, `adr/`, `reviews/` (lịch sử).
- **Phát hiện khi điền (cần Product):**
  1. **Preview bản nháp chưa có** dù `01` ghi FR-E2 "xem trước" là Must → **Product đồng ý hạ (2026-11-02)**: FR-E2 chỉ còn "Lưu nháp" (Must), "xem trước" thành FR-E2b (Nice); ghi `10 §5`, sửa `01`, `01a`, `05 §4`.
  2. **Directus ghi activity + revision** cho mọi collection (`accountability: all`), không tự xoá (`04 §7`) → **Product đồng ý giữ nguyên hành vi** (chi phí không đáng kể); `03e §6` đã ghi đúng là không có yêu cầu nghiệp vụ.
  3. **Site chưa có trang liên hệ/About** (`12 §10`) → **để Backlog** (việc nhỏ `feat(web)` ngoài sprint, khi Product cần).
  4. `00-project` do tôi soạn nháp từ `01a`, hướng nội dung và số đo có thật (Q1): **còn chờ Product đọc lại câu chữ §1–§5.**
- **Rà bổ sung (sau review):** `08-deployment` sửa lại theo hiện trạng (domain `retro.`/`retro-cms.tiendnm.com`, Postgres trong compose, tunnel/TLS, CI `quality`/`build`/`site-checks`, bỏ khuyến nghị 2FA). Đối chiếu README/runbook với repo: mọi đường dẫn `scripts/`·`services/`, lệnh `pnpm` và cờ (`--web-only`, `--r2`, `--profile`/`--set`…) đều tồn tại.
- **Không đổi (không có ô trống):** `11-testing`, `16-glossary`, `13-operations`. Chưa thử đẩy commit hỏng link lên GitHub (đã chứng minh cục bộ, CI chạy đúng).
