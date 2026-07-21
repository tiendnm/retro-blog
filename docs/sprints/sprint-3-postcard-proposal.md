# 🎴 Design Proposal — Homepage Post Card (Sprint 3, trước Phase 2)

> **Trạng thái:** 🟢 **ĐÃ CHỌN — Phương án B (kèm điều chỉnh)** · **Ngày:** 2026-07-22 · **Chốt bởi:** Product Review · **Hiện thực:** Phase 2 (xong)
> 🎯 **Mục đích:** đề xuất **3 phương án** bố cục Post Card cho trang chủ để Product Owner chọn.
> 🔗 [sprint-3 plan](./sprint-3-implementation-plan.md) · [07-ui-ux](../07-ui-ux.md) · [ảnh Phase 2](./assets/sprint-3-phase-2/)

---

## ✅ Quyết định (Product Review)

**Chọn Phương án B — Thumbnail-left**, với 4 điều chỉnh:
1. Thumbnail **chỉ hỗ trợ**, không thành điểm nhấn chính (giữ nhỏ, bên trái).
2. Bài **không cover** → **KHÔNG placeholder / KHÔNG ảnh mặc định**; card tự chuyển **text-only**.
3. Card **vẫn đẹp & cân đối** ngay cả khi **toàn bộ** thumbnail bị loại bỏ.
4. Giữ **content first, chrome second**; **không** đổi API / DTO / Content Model.

> Hiện thực: `PostCard.astro` (flex — không cover ⇒ body là con duy nhất ⇒ full-width text-only) + `CoverImage.astro` (render ảnh nếu có, không thì rỗng). Xem [ảnh Phase 2](./assets/sprint-3-phase-2/).

---

## 0. Ràng buộc & dữ liệu (không đổi)

- **Không** đổi API / DTO / thin client. Tất cả phương án chỉ dùng **`PostSummary`** hiện có ([03d §3.1](../03d-api-contract.md)): `title · slug · excerpt · cover{url,alt}` **(nullable)** · `publishedAt · author{name,slug}`.
- **⚠️ `cover` là tuỳ chọn** — nhiều bài có thể **không có ảnh bìa** (seed hiện tại: 0 cover). ⇒ phương án dùng thumbnail **bắt buộc** có chiến lược khi thiếu ảnh (fallback/ẩn).
- Triết lý Phase 1: **content first, chrome second** — ưu tiên trải nghiệm đọc, retro tối giản.
- Cả 3 đều **responsive** và không thêm component ngoài phạm vi proposal.

---

## Phương án A — Text-only (không thumbnail)

```
┌─────────────────────────────────────────────┐
│  TIÊU ĐỀ BÀI VIẾT  (link)                     │
│  Đoạn tóm tắt ngắn của bài, 1–2 dòng…          │
│  Bởi Tác giả · 20 tháng 7, 2026               │
├─────────────────────────────────────────────┤   ← kẻ nét đứt giữa các card
│  TIÊU ĐỀ BÀI KẾ TIẾP …                         │
│  …                                            │
└─────────────────────────────────────────────┘
```

- **Thumbnail:** ❌ Không.
- **Ưu:** content-first tối đa; đọc/quét nhanh; **không phụ thuộc có/không ảnh** (đồng nhất tuyệt đối); nhẹ, không CLS, không cần quyết crop; a11y đơn giản; hợp chất retro chữ.
- **Nhược:** ít điểm neo thị giác; ảnh bìa editor tải lên **không dùng** ở trang chủ; kém "hấp dẫn" bằng mắt.
- **Responsive:** ⭐ dễ nhất — luôn 1 cột, xuống dòng tự nhiên; mobile hoàn hảo, không cần breakpoint.

---

## Phương án B — Thumbnail-left (media card ngang)

```
Desktop:
┌─────────────────────────────────────────────┐
│ ┌────────┐  TIÊU ĐỀ BÀI VIẾT (link)           │
│ │  ẢNH   │  Đoạn tóm tắt ngắn…                │
│ │  4:3   │  Bởi Tác giả · 20 tháng 7, 2026    │
│ └────────┘                                    │
├─────────────────────────────────────────────┤
│  (bài KHÔNG có ảnh → text tràn full width)     │
└─────────────────────────────────────────────┘

Mobile (hẹp):  ảnh lên trên, text xuống dưới (stack)
┌───────────────┐
│ ┌───────────┐ │
│ │   ẢNH     │ │
│ └───────────┘ │
│ Tiêu đề…      │
└───────────────┘
```

- **Thumbnail:** ✅ Có — nhỏ, bên trái (vd ~120px, tỉ lệ 4:3).
- **Ưu:** có điểm neo thị giác nhưng **text vẫn chủ đạo**; quét nhanh; tận dụng ảnh bìa; mẫu blog quen thuộc; vẫn khá gọn.
- **Nhược:** cần **fallback khi thiếu ảnh** (text full-width ⇒ card cao/thẳng hàng không đều); phải quyết tỉ lệ crop; hơi nhiều "chrome" hơn A.
- **Responsive:** ⭐⭐ tốt, cần **1 breakpoint** — ngang ở desktop, stack (ảnh trên) ở mobile; xử lý card khuyết ảnh.

---

## Phương án C — Thumbnail-top (grid ảnh nổi bật)

```
Desktop (2 cột):
┌───────────────────┐   ┌───────────────────┐
│ ┌───────────────┐ │   │ ┌───────────────┐ │
│ │    ẢNH 16:9   │ │   │ │    ẢNH 16:9   │ │
│ └───────────────┘ │   │ └───────────────┘ │
│ TIÊU ĐỀ           │   │ TIÊU ĐỀ           │
│ Tóm tắt…          │   │ Tóm tắt…          │
│ Tác giả · ngày    │   │ Tác giả · ngày    │
└───────────────────┘   └───────────────────┘

Mobile: 1 cột (các card xếp dọc).
```

- **Thumbnail:** ✅ Có — nổi bật, phía trên (tỉ lệ 16:9, rộng bằng card).
- **Ưu:** ấn tượng thị giác mạnh nhất; cảm giác tạp chí/gallery; tận dụng ảnh tốt nhất; dùng được chiều ngang desktop (grid).
- **Nhược:** **phụ thuộc ảnh nhiều nhất** — thiếu cover ⇒ ô trống/placeholder lớn, rời rạc; mỗi card chiếm **nhiều chiều dọc** (ít bài trên màn đầu); nặng "chrome" nhất (nghịch content-first); CLS ảnh rõ nhất; grid + aspect-ratio ⇒ responsive phức tạp nhất; cần quyết crop + placeholder.
- **Responsive:** ⭐⭐⭐ cần nhiều công nhất — 1 cột (mobile) → 2 cột (desktop) grid; hộp tỉ lệ cố định; chiến lược placeholder.

---

## So sánh nhanh

| Tiêu chí | A · Text-only | B · Thumb-left | C · Thumb-top grid |
|---|---|---|---|
| Thumbnail | ❌ | ✅ nhỏ (trái) | ✅ lớn (trên) |
| Content-first | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Sức hút thị giác | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Chịu được bài **thiếu cover** | ⭐⭐⭐ | ⭐⭐ (cần fallback) | ⭐ (dễ rời rạc) |
| Bài trên "màn đầu" | nhiều | vừa | ít |
| Độ phức tạp responsive | thấp | vừa | cao |
| Rủi ro CLS/ảnh | không | thấp | cao |
| Hợp triết lý Phase 1 | ⭐⭐⭐ | ⭐⭐ | ⭐ |

## Khuyến nghị (không phải quyết định)

- Bám triết lý **content-first** + thực tế **cover là tuỳ chọn**, tôi nghiêng về **Phương án A** (đồng nhất, nhẹ, không phụ thuộc ảnh).
- Nếu Product Owner muốn có điểm neo thị giác mà vẫn giữ text chủ đạo → **Phương án B** là trung dung tốt (kèm quy tắc fallback khi thiếu ảnh).
- **Phương án C** chỉ nên chọn nếu **đa số bài chắc chắn có ảnh bìa chất lượng** và chấp nhận nghịch phần nào content-first.

> 🛑 **Chờ Product Review chọn A / B / C** (và quy tắc fallback ảnh nếu chọn B/C). **Chỉ sau khi chọn** mới implement Phase 2.
