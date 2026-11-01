# 07 — UI / UX

> ℹ️ Phong cách thị giác retro **chưa khóa** — token là *nền*, hoàn thiện dần sau review thực tế.
>
> 🎯 **Mục đích:** Mô tả *trải nghiệm* của Retro Blog: định hướng thương hiệu, bố cục từng loại trang, hành vi thành phần và nguyên tắc responsive. **Giá trị thị giác** (token, hợp đồng thành phần cơ sở, a11y, chuyển động) ở [07b-design-system](./07b-design-system.md); **cấu trúc site** (trang nào, URL, điều hướng) ở [07a-information-architecture](./07a-information-architecture.md).
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [07a](./07a-information-architecture.md) · [07b](./07b-design-system.md) · [15-seo-accessibility](./15-seo-accessibility.md) · [09-coding-standards](./09-coding-standards.md)

---

## 1. Nguyên tắc thiết kế & Định vị thương hiệu (Brand)

- **Hướng (provisional — CHƯA khóa):** vintage print / máy đánh chữ — nền giấy ngả vàng, phông monospace, đường kẻ nét đứt, bảng màu ấm trầm. Chủ đề nội dung: máy tính một thời ([00 §1](./00-project.md)).
- ⚠️ **Phong cách thị giác cuối cùng chưa chốt**; hoàn thiện dần sau khi review giao diện thực tế với Product Owner ([sprint-3 plan §4](./sprints/sprint-3.md)). Hướng kế tiếp (giấy cũ, nếp gấp): [Sprint 16](./sprints/sprint-16.md).
- **Không có nguồn thiết kế ngoài (không Figma):** thiết kế sống trong code; token và hợp đồng thành phần ở [07b](./07b-design-system.md). Ý đồ thiết kế mô tả ở tài liệu này.

## 2. Bố cục & thành phần cấp trang

| Thành phần | Mô tả |
|---|---|
| Đầu trang | Gọn, tĩnh: thương hiệu + điều hướng chính (Trang chủ · Chuyên mục · Lưu trữ · Tìm kiếm) — không hero, không menu thả ([07a §4](./07a-information-architecture.md)) |
| Chân trang | Nhẹ: dòng chữ chân trang + liên kết RSS |
| Khung trang | skip-link → đầu trang → vùng nội dung chính → chân trang (landmark ngữ nghĩa) |
| Thẻ bài (list item) | **Option B**: ảnh hỗ trợ (nhỏ, trái) + chữ chủ đạo; không ảnh → chỉ chữ, không ảnh giữ chỗ |
| Trang bài (detail) | **Banner** ảnh bìa (rộng bằng cột đọc, tỉ lệ 2:1, cắt vừa khung) **nằm trên tiêu đề**; sau đó tiêu đề, thông tin bài, thân bài trong cột đọc |
| Bố cục trang danh sách (D) | **Hero** (cửa sổ hệ điều hành đời đầu; ảnh giãn theo chiều cao khối chữ, tóm tắt cắt ở 4 dòng) → **lưới thẻ giấy** 3 cột → **danh sách gọn** "Cũ hơn"; thanh chuyên mục dạng chip; vùng danh sách ~1080 px, trang bài giữ cột đọc; ảnh `srcset` qua bộ biến đổi ảnh của CMS — [proposal](./sprints/homepage-layout-proposal.md) |
| Hộp xem ảnh (lightbox) | Bấm ảnh trong thân bài → hộp thoại toàn màn hình: ảnh 2000 px, chú thích = `alt` + (n/N), đóng bằng `Esc`/✕/bấm nền, ←/→ chuyển ảnh (vòng lặp), Enter/Space mở bằng bàn phím, trả focus khi đóng, khoá cuộn nền. **Zoom:** nút −/100 %/+, phím `+` `-` `0`, lăn chuột (quanh con trỏ), nhấp/chạm đúp (2,5×), chụm 2 ngón; kéo để di chuyển khi đã phóng (tối đa 5×); `Esc` khi đang phóng thì về vừa khung trước |

## 3. Responsive

- **Container:** nội dung giới hạn theo `--container-max`, căn giữa; trang danh sách rộng hơn (`--container-wide`); trang bài dùng cột đọc thẳng hàng với đầu/chân trang. Giá trị: [07b §3.4](./07b-design-system.md).
- **Fluid, ít breakpoint:** flex + đơn vị tương đối; thẻ bài giữ ảnh nhỏ bên trái ở mọi kích thước (không xếp dọc thành ảnh lớn — ảnh chỉ hỗ trợ). Mã và bảng trong thân bài cuộn ngang khi tràn.
- **Ảnh trong thân bài:** ảnh lưu trên CMS được đổi sang `srcset` webp 640/960/1200/1600 và `sizes` khớp cột đọc (800 px) khi build, sau bước làm sạch HTML; `width`/`height` lấy từ tham số gốc của trình soạn để giữ chỗ, không giật bố cục. Ảnh nguồn khác thì giữ nguyên. Hiện thực: `optimizeBodyImages` (`lib/rewrite-assets.ts`).
- **Lưu ý CSS:** `img { max-width: 100% }` toàn cục ghi đè mọi `width` → banner cần `max-width: none`. Đơn vị `ch` của phông mono ở đây chỉ ≈ 8 px nên cột đọc dùng `rem`, không dùng `ch`.
- **Kiểm chứng:** ở 390 px không cuộn ngang trên các loại trang chính (đo bằng trình duyệt — Sprint 3 Phase 4).

## 4. Trạng thái tương tác

- **Focus:** viền `accent` khi dùng bàn phím — quy tắc ở [07b §5](./07b-design-system.md).
- Liên kết trong nội dung gạch chân; thương hiệu và điều hướng không gạch chân. Hover/focus chỉ đổi màu ([07b §4](./07b-design-system.md)); chưa có hiệu ứng khác — giữ tối giản.
- Chuyển động: [07b §6](./07b-design-system.md).

## 5. Dark / Light mode

- **Ngoài phạm vi (Future)** — [01a §5](./01a-mvp-scope.md).
