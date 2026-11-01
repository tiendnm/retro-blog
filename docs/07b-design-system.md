# 07b — Design System

> 🎯 **Mục đích:** Bộ quy tắc thị giác dùng chung: token, nguyên tắc, hợp đồng của thành phần cơ sở, a11y và chuyển động. Trả lời "**dùng giá trị nào, thành phần phải thoả điều gì**". Bố cục từng trang và hành vi tương tác nằm ở [07-ui-ux](./07-ui-ux.md); cấu trúc site ở [07a-information-architecture](./07a-information-architecture.md).
> 🔗 **Liên quan:** [07-ui-ux](./07-ui-ux.md) · [07a-information-architecture](./07a-information-architecture.md) · [15-seo-accessibility](./15-seo-accessibility.md) · [09-coding-standards](./09-coding-standards.md)

---

> ℹ️ **Phong cách retro chưa khóa** — giá trị dưới đây là *nền*, tinh chỉnh dần sau review thực tế ([07 §1](./07-ui-ux.md)). Hướng cải thiện thị giác (giấy cũ, nếp gấp) ở [Sprint 16](./sprints/sprint-16.md).
>
> 🧭 **§1–§6 trung lập framework** (chỉ nói về giá trị và hợp đồng). **§7 là RÌA:** nơi các giá trị này hiện thực trong mã.

## 1. Ranh giới tài liệu

| Câu hỏi | Trả lời ở |
|---|---|
| Màu, cỡ chữ, khoảng cách, độ rộng nào? Thành phần cơ sở phải đạt gì? A11y/chuyển động ra sao? | **07b (tài liệu này)** |
| Trang trông thế nào, bố cục ra sao, bấm vào thì chuyện gì xảy ra? | [07-ui-ux](./07-ui-ux.md) |
| Có những trang nào, URL và điều hướng ra sao? | [07a](./07a-information-architecture.md) |
| Giá trị nằm ở file nào, thành phần là file nào? | §7 dưới đây |

## 2. Nguyên tắc

1. **Token trước, giá trị sau:** mọi màu, cỡ chữ, khoảng cách, độ rộng lấy từ token; không viết giá trị rời trong từng thành phần. Hiện tại mọi màu chỉ được định nghĩa một lần (khối gốc `:root`).
2. **Tương phản AA là điều kiện cần:** chữ trên mọi nền token phải ≥ 4,5:1 (§3.1).
3. **Retro bằng chất liệu, không bằng hiệu ứng:** nền giấy ngả vàng, phông monospace, đường kẻ mảnh, bảng màu ấm trầm; không bóng đổ, không chuyển động trang trí.
4. **Tối giản thành phần:** thành phần mới chỉ thêm khi ≥ 2 nơi dùng; style tập trung, không rải theo trang.
5. **Một ngôn ngữ cho mọi thiết bị:** fluid, ít breakpoint (§3.4); không thiết kế riêng cho từng cỡ máy.

## 3. Token

### 3.1. Màu
Tương phản của chữ trên từng nền (tính theo công thức WCAG, 2026-11-02):

| Token | Giá trị | Vai trò | Trên `bg` | Trên `surface` | Trên `card` |
|---|---|---|---|---|---|
| `--color-bg` | `#f4f1e8` | nền trang (giấy) | — | — | — |
| `--color-surface` | `#efe8d6` | nền phụ (khối, ô) | — | — | — |
| `--color-card` | `#faf7ee` | nền thẻ giấy (sáng hơn `surface`) | — | — | — |
| `--color-text` | `#2b2b2b` | chữ chính | 12,5 | 11,6 | 13,2 |
| `--color-muted` | `#595959` | chữ phụ, metadata | 6,2 | 5,7 | 6,5 |
| `--color-accent` | `#7b2d26` | liên kết, nhấn, focus | 8,3 | 7,7 | 8,7 |
| `--color-accent-strong` | `#5c211c` | trạng thái đậm (hover/active) | 11,0 | 10,2 | 11,6 |
| `--color-border` | `#d9d2c0` | viền, đường kẻ | 1,3 | — | — |

- `--color-border` **chỉ trang trí** (ngăn khối); không dùng làm dấu hiệu duy nhất để nhận biết một điều khiển.
- Tổ hợp mới phải được tính lại và ghi vào bảng này trước khi dùng.

### 3.2. Chữ (typography)
| Token | Giá trị | Ghi chú |
|---|---|---|
| `--font-mono` | IBM Plex Mono → Courier New → monospace | tự lưu trữ (không gọi CDN ngoài), đậm 400/700 |
| `--font-serif` · `--font-sans` | Georgia… · system-ui… | sẵn để đổi, hiện chưa dùng cho nội dung |
| `--font-body` · `--font-heading` | `= --font-mono` | một họ chữ cho cả thân và tiêu đề |
| `--text-xs … --text-3xl` | 0,833 · 0,9 · 1 · 1,125 · 1,35 · 1,6 · 1,95 rem | thang ≈ 1,2 |
| `--leading-tight / body / relaxed` | 1,25 / 1,65 / 1,8 | |
| `--weight-normal / bold` | 400 / 700 | |

Cấp tiêu đề: `h1` = `--text-3xl`, `h2` = `--text-2xl`, `h3` = `--text-xl`; mỗi trang đúng một `h1`.

### 3.3. Khoảng cách · viền
| Token | Giá trị |
|---|---|
| `--space-1 … --space-16` | 0,25 · 0,5 · 0,75 · 1 · 1,5 · 2 · 3 · 4 rem (có tên `1,2,3,4,6,8,12,16`; thang 4 px) |
| `--border-width` · `--radius-sm` | 1 px · 2 px |

Chưa định nghĩa: bóng đổ/hiệu ứng (chờ chốt phong cách).

### 3.4. Độ rộng · breakpoint
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--container-max` | 880 px | bề rộng trang, cột đọc |
| `--container-wide` | 1080 px | trang danh sách (lưới thẻ) |
| `--container-pad-x` | 1,25 rem | đệm ngang |
| `--reading-width` | 100 % | cột đọc = bề rộng vùng nội dung (840 px), thẳng hàng với đầu/chân trang |

Breakpoint dùng trong mã: **860 px** (lưới thẻ rút cột), **560 px** (xếp dọc thành phần danh sách), **600 px** (lightbox). Ba mốc này là *giá trị* chứ không phải token (CSS không cho dùng biến trong điều kiện media); đổi thì sửa ở cả nơi dùng.

### 3.5. Chất giấy (Sprint 16)
Texture sinh bằng thuật toán, nằm **dưới** nội dung (`z-index: -1`), tĩnh, không tải ảnh ngoài.

| Token | Mặc định | Vai trò |
|---|---|---|
| `--paper-fx` | 1 | công tắc tổng; `0` = tắt toàn bộ texture |
| `--paper-grain` | 0,50 | độ đậm sợi giấy (SVG `feTurbulence` trong `data:` URI) |

- Tắt khi `prefers-contrast: more`, `forced-colors: active` và khi in.
- Tương phản trên pixel tối nhất của grain (đo 2026-11-02): `text` 10,15 · `muted` 5,02 · `accent` 6,70. Mức "rõ" (0,85) làm `muted` < 4,5 nên không dùng.

## 4. Hợp đồng thành phần cơ sở

Mỗi thành phần phải thoả hợp đồng, bất kể cách hiện thực.

| Thành phần | Hợp đồng |
|---|---|
| **Liên kết** | Màu `accent`; liên kết trong nội dung có gạch chân; liên kết thương hiệu/điều hướng không gạch chân. Hover/focus chỉ đổi màu, không thêm hiệu ứng khác |
| **Chip (nhãn chuyên mục)** | Là liên kết, viền `accent`; hover/focus và mục đang xem đảo thành nền `accent`, chữ `bg`; mục đang xem có `aria-current="page"`; nằm trong vùng điều hướng có nhãn |
| **Thẻ bài (PostCard)** | Ảnh nhỏ bên trái (nếu có) + chữ chủ đạo; không có ảnh → chỉ chữ, **không** ảnh giữ chỗ; ảnh trong thẻ là trang trí (`alt` rỗng) |
| **Thẻ giấy (PaperCard)** | Ảnh + chữ trên nền `card`, dùng trong lưới của trang chủ; cùng quy tắc ảnh như PostCard |
| **Ảnh bìa (Cover)** | Hiện ảnh nếu có nguồn; không có thì không hiện gì (không ảnh mặc định); ảnh bìa bài có `alt` thật |
| **Phân trang** | Vùng điều hướng có nhãn; "Trước/Sau" là liên kết chỉ khi có trang đích, ở biên là phần tử vô hiệu hoá (không điều hướng); trang hiện tại không phải liên kết và có `aria-current="page"`; chỉ hiện khi > 1 trang |
| **Trạng thái rỗng** | Một khối chữ ngắn thay cho danh sách rỗng |
| **Nội dung bài (Prose)** | Một nơi định kiểu cho toàn bộ HTML thân bài: tiêu đề, danh sách, trích dẫn, mã, bảng, đường kẻ, ảnh; nhịp dọc nhất quán; mã và bảng cuộn ngang khi tràn |
| **Khung trang** | Thứ tự cố định: skip-link → đầu trang → vùng nội dung chính → chân trang |

## 5. Khả năng tiếp cận (a11y) trong thiết kế

Chuẩn mục tiêu **WCAG 2.2 AA**; checklist và kiểm thử ở [15 §B](./15-seo-accessibility.md).

- **Tương phản** theo §3.1.
- **Focus:** mọi phần tử tương tác khi nhận tiêu điểm bàn phím hiện viền `accent` 2 px, cách 2 px. Không tắt outline mà không thay thế.
- **Landmark & skip-link:** đầu trang, vùng điều hướng, vùng nội dung chính, chân trang; skip-link ẩn tới khi nhận tiêu điểm, nhảy tới vùng nội dung. `lang="vi"`.
- **Heading:** đúng một `h1` mỗi trang, cấp không nhảy bậc.
- **Ảnh:** ảnh trang trí `alt=""`; ảnh mang nội dung có `alt` thật (người soạn nhập — [15 §B4](./15-seo-accessibility.md)).
- **Cỡ chạm & zoom:** bố cục không cuộn ngang ở 390 px; chữ dùng đơn vị tương đối nên phóng to theo cài đặt trình duyệt.

## 6. Chuyển động

- Chuyển động tối thiểu, chỉ để báo trạng thái (hover/focus, mở–đóng hộp xem ảnh); không hoạt ảnh tự chạy.
- Khi người dùng đặt `prefers-reduced-motion: reduce`: mọi hoạt ảnh/chuyển tiếp rút về ≈ 0 ms.
- Kiểm bằng tay, chưa tự động ([15 §B3](./15-seo-accessibility.md)).

---

## 7. Hiện thực (RÌA)

> Hiện tại token và style sống **trong mã**, không có nguồn thiết kế ngoài (không Figma): đây là bản chính. Khi lệch nhau, **CSS thật là nguồn đúng**; sửa tài liệu này theo.

| Nội dung | Nơi hiện thực |
|---|---|
| Mọi token (§3) | `apps/web/src/styles/global.css`, khối `:root` — **SSOT giá trị** |
| Style thành phần, nội dung bài, lightbox | cùng file; **một file CSS toàn cục**, không style cục bộ trong từng thành phần, không utility framework ([09 §7](./09-coding-standards.md)) |
| Rule `prefers-reduced-motion` | khối `@media` trong `global.css` (cũng là lý do rule `noImportantStyles` của Biome bị tắt — [09 §4](./09-coding-standards.md)) |
| Phông | gói `@fontsource/ibm-plex-mono` (latin + latin-ext, 400/700), nạp trong `layouts/Base.astro` — không gọi CDN |
| Thành phần (Astro) | `Header` · `Footer` · `CategoryNav` (chip) · `PostCard` · `PaperCard` · `PostHero` · `PostListView` · `CoverImage` · `Pagination` · `TagList` · `AuthorName` ở `apps/web/src/components/`; khung trang `layouts/Base.astro` |
| Biến cục bộ | `--lb-stage-h` (chiều cao khung xem ảnh) — chỉ dùng trong lightbox, không phải token dùng chung |
| Tên | thành phần PascalCase trùng tên file (`PostCard.astro`); lớp CSS dạng khối `__phần` (`post-card__thumb`) — [09 §3](./09-coding-standards.md) |

- Quy tắc ép: CI kiểm lint/format/typecheck/build; tương phản và a11y của trang xuất ra do job `site-checks` (axe + Lighthouse — [14 §2.1](./14-quality-gates.md)). **Chưa có** kiểm tự động rằng mã chỉ dùng token (không hardcode màu).
- Thêm token mới: thêm vào `:root`, ghi vào bảng §3 (kèm tương phản nếu là màu), rồi mới dùng.
