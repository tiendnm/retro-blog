# 🖼️ Design Proposal — Bố cục trang chủ có ảnh lớn

> **Trạng thái:** 🟢 **Đã chọn Phương án D** (Product 2026-10-06) — đã hiện thực, chờ Product review · **Soạn:** Implementation
> 🔗 (Mockup 4 phương án đã được thay bằng bản hiện thực thật — xem `PostListView` / `PostHero` / `PaperCard`.) · Tiền lệ: [sprint-3-postcard-proposal](./sprint-3-postcard-proposal.md) · [07-ui-ux](../07-ui-ux.md)

## 1. Vấn đề

Trang chủ hiện là **một cột dọc**, thumbnail 104×78 px — ảnh gần như vô hình, mọi bài trông giống nhau, không có điểm nhấn. Hai nguyên nhân gốc trong code:

1. **Toàn site bị khoá trong `--container-max: 720px`** (`global.css`, áp lên `body`) → trang list không có chỗ cho lưới/ảnh lớn.
2. `PostCard` chỉ có một kiểu (thumbnail-left, Sprint 3 Phương án B) — không có phân cấp *nổi bật / thường / gọn*.

> Quyết định Sprint 3 ("thumbnail chỉ hỗ trợ") ra đời khi seed **chưa có ảnh**. Nay nội dung có ảnh → cần Product xác nhận lại hướng. Giữ nguyên các ràng buộc còn lại: **bài không cover vẫn phải đẹp (text-only, không placeholder)**, content-first, không đổi DTO/API.

## 2. Bốn phương án đã đề xuất

| | A · Tạp chí | B · Bưu thiếp | C · Nhật báo | D · Tổng hợp ⭐ |
|---|---|---|---|---|
| Ý tưởng | Hero + lưới 3 cột | Ảnh dán tường: khung trắng, băng dính, nghiêng nhẹ | Masthead báo, bài chính + cột tin | Chuyên mục + hero + thẻ giấy + danh sách gọn |
| Ảnh | Lớn (3:2) | Vuông, khung polaroid | Halftone nâu-đen | Lớn ở hero/thẻ, nhỏ ở danh sách cũ |
| Cá tính retro | Vừa | **Cao nhất** | Cao | Cao (thẻ giấy, tem, đổ bóng cứng) |
| Phân cấp | Có (1 hero) | Phẳng (mọi bài ngang nhau) | Rất rõ | **Rõ nhất: lớn → vừa → nhỏ** |
| Bài không cover | Cần thẻ text-only | Khó (khung ảnh trống) | Dễ (cột chữ) | **Dễ** (thẻ text-only / hàng danh sách) |
| Rủi ro | Thấp | Cao: nghiêng + đổ bóng nặng, a11y/hiệu năng | **Font serif** (xem §4) | Thấp–vừa |
| Công sức | S | M | L | M |

**Khuyến nghị: D.** Giải đúng vấn đề đơn điệu (3 cỡ thẻ tạo nhịp), vẫn xử lý gọn bài thiếu ảnh, tận dụng được chất giấy cũ có sẵn (nền kem, viền đứt nét, đổ bóng cứng kiểu in offset) và có thể **mượn chi tiết của B** (tem chuyên mục, băng dính ở hero) ở mức nhẹ nếu Product muốn.

## 3. Phạm vi kỹ thuật dự kiến (nếu chọn D hoặc A)

- **Chỉ tầng presentation** — không đổi API/DTO/Content Model. "Hero" = bài mới nhất của trang 1 (không cần field `featured`; thêm cờ nổi bật là backlog nếu muốn).
- `PostListView` + `PostCard` thêm biến thể (`hero` / `card` / `row`); `global.css` mở container **chỉ cho trang list** (~1080px), **giữ cột đọc hẹp** ở trang chi tiết.
- Thanh chuyên mục ở đầu trang: dùng `getAllCategorySlugs` + tên chuyên mục sẵn có (thêm hàm thin client nhỏ, additive).
- Pagination: trang 2+ dùng lưới 3 cột (không hero).
- Responsive: 3 → 2 → 1 cột; hero xếp dọc trên mobile.
- **Hiệu năng ảnh (bắt buộc đi kèm):** hiện card tải ảnh gốc 1200px. Cần `?width=`/`srcset` qua tham số transform của Directus (kiểm tra preset/giới hạn trước) + `width/height` để chống CLS.
- Build Preview Policy áp dụng: build thật, screenshot, UI Change Summary, Regression Checklist.

## 4. Lưu ý phát hiện khi dựng mockup

- ⚠️ **Georgia vỡ dấu tiếng Việt** ở một số ký tự (vd "vắng", "chiếc" hiện dấu rời) trên Windows. `--font-serif` đang khai báo Georgia ⇒ **Phương án C** (và mọi chỗ dùng serif) cần web font hỗ trợ subset Vietnamese (vd Lora / Playfair Display) → thêm phụ thuộc font (tự host, không CDN). Monospace hiện tại (Courier New) không gặp lỗi này.
- Ảnh polaroid (B) lệch nhẹ → chữ viết tay cần font có Vietnamese; hiện dùng fallback cursive hệ thống (không đồng nhất giữa máy).

## 5. Quyết định của Product (2026-10-06)

1. ✅ **Phương án D**.
2. ✅ **Nới container** trang list lên ~1080px (trang chi tiết giữ cột đọc).
3. ✅ Bài **không cover** vẫn là thẻ text-only.
4. ✅ Có **thanh chuyên mục**.
5. ➕ **Định hướng nội dung:** blog về **máy tính cổ** (phần cứng/phần mềm/lập trình/kiến thức/lịch sử) → seed + ảnh + motif giao diện (cửa sổ OS cổ, thẻ lệnh `[ ]`, tiêu đề `>` kiểu DIR) bám chủ đề này. Chi tiết hiện thực: hero = bài mới nhất; lưới 3 thẻ giấy; phần còn lại là danh sách gọn "Cũ hơn"; trang 2+ là danh sách gọn; ảnh dùng `srcset` qua transform của Directus.
