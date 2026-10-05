# 07 — UI / UX & Design System

> **Trạng thái:** 🟢 Reader Experience hoàn thành (Sprint 3) · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-22 · **Người duyệt:** Tech Lead
>
> ℹ️ Phong cách thị giác retro **chưa khóa** — tokens là *nền* (§2), hoàn thiện dần sau review thực tế.
>
> 🎯 **Mục đích:** Định nghĩa *ngôn ngữ thiết kế* của Retro Blog — phong cách retro, design tokens, thành phần UI, và nguyên tắc trải nghiệm. Đảm bảo giao diện nhất quán và tái sử dụng được.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [15-seo-accessibility](./15-seo-accessibility.md) · [09-coding-standards](./09-coding-standards.md)

---

## 1. Nguyên tắc thiết kế & Định vị thương hiệu (Brand)

> Phong cách "retro" cụ thể là gì? (vd: pixel/8-bit, vintage print, 90s web...). Cảm giác muốn tạo ra?

- **Hướng (provisional — CHƯA khóa):** vintage print / máy đánh chữ — nền giấy ngả vàng, phông monospace, đường kẻ nét đứt, bảng màu ấm trầm.
- ⚠️ **Phong cách thị giác cuối cùng chưa chốt ở Sprint 3**; hoàn thiện dần sau khi review giao diện thực tế với Product Owner ([sprint-3 plan §4](./sprints/sprint-3-implementation-plan.md)). Phase 0 chỉ dựng **nền tokens** (§2).

## 2. Design Tokens (Design Foundation — Phase 0)

> **SSOT giá trị:** [`apps/web/src/styles/global.css`](../apps/web/src/styles/global.css) (`:root`). Bảng dưới là bản chụp *provisional* — tinh chỉnh dần, **không** phải phong cách chốt. Là **nền** để các phase sau bám vào; nhất quán (không hardcode rải rác).

### 2.1. Màu (Color) — kiểm tương phản trên `--color-bg` (AA ≥ 4.5:1)
| Token | Giá trị | Tương phản / vai trò |
|---|---|---|
| `--color-bg` | `#f4f1e8` | nền giấy |
| `--color-surface` | `#efe8d6` | nền phụ (khối/card) |
| `--color-text` | `#2b2b2b` | chữ chính — ~12.6:1 (AAA) |
| `--color-muted` | `#595959` | chữ phụ — ~6.2:1 (AA) |
| `--color-accent` | `#7b2d26` | nhấn/link — ~8.3:1 (AAA) |
| `--color-accent-strong` | `#5c211c` | trạng thái đậm |
| `--color-border` | `#d9d2c0` | viền/đường kẻ |

### 2.2. Typography
| Token | Giá trị | Ghi chú |
|---|---|---|
| `--font-body` / `--font-heading` | `= --font-mono` | **system stack** (không web font ngoài) |
| `--font-mono` / `--font-serif` / `--font-sans` | Courier / Georgia / system-ui | sẵn để đổi |
| `--text-xs … --text-3xl` | `0.833 · 0.9 · 1 · 1.125 · 1.35 · 1.6 · 1.95` rem | thang ~1.2 |
| `--leading-tight / body / relaxed` | `1.25 / 1.65 / 1.8` | |
| `--weight-normal / bold` | `400 / 700` | |

### 2.3. Spacing (thang 4px) · Container · Border
| Token | Giá trị |
|---|---|
| `--space-1 … --space-16` | `0.25 · 0.5 · 0.75 · 1 · 1.5 · 2 · 3 · 4` rem |
| `--container-max` / `--container-pad-x` | `720px` / `1.25rem` |
| `--reading-width` | `68ch` *(áp dụng thân bài ở Phase 3)* |
| `--border-width` / `--radius-sm` | `1px` / `2px` |

> **Shadow / Effect retro:** chưa định nghĩa (chờ chốt phong cách — ngoài Phase 0).

## 3. Kho thành phần (Component Inventory)

| Component | Mô tả | Trạng thái |
|---|---|---|
| Header / Nav | Gọn, tĩnh: **Brand + Home** (không hero/menu động) — `Header.astro` | 🟢 Phase 1 |
| Footer | Nhẹ: thông tin cơ bản (© + tagline) — `Footer.astro` | 🟢 Phase 1 |
| Base layout | skip-link → Header → `main#main` → Footer (landmark ngữ nghĩa) | 🟢 Phase 1 |
| PostCard (list item) | **Option B**: thumbnail hỗ trợ (nhỏ, trái) + text chủ đạo; không cover → text-only, không placeholder — `PostCard.astro` | 🟢 Phase 2 |
| CoverImage (ảnh) | Render ảnh nếu có `src`; không thì rỗng (không placeholder/ảnh mặc định) — `CoverImage.astro` | 🟢 Phase 2 |
| Empty state (list) | Khối `.empty-state` khi list rỗng | 🟢 Phase 2 |
| Post layout (detail) | `.post` = reading column (giới hạn `--reading-width`) + header + cover (`CoverImage`) + `.prose` | 🟢 Phase 3 |
| Prose (HTML body) | `.prose` — style TẬP TRUNG cho toàn bộ HTML của body (heading/list/blockquote/code/table/hr/img); vertical rhythm nhất quán | 🟢 Phase 3 |
| Tag / Category badge · Pagination | ngoài Sprint 3 | — |

## 4. Bố cục & Responsive

- **Container:** `body` giới hạn `--container-max` (720px), căn giữa, padding ngang `--container-pad-x`. Detail thu về `--reading-width` (~65ch) cho dễ đọc.
- **Fluid, ít breakpoint:** bố cục dùng flex + đơn vị tương đối; PostCard giữ thumbnail nhỏ-trái ở mọi kích thước (không stack lớn — thumbnail chỉ hỗ trợ). Code/table trong `.prose` `overflow-x:auto`.
- **Kiểm chứng:** @390px **không** cuộn ngang ở cả 3 trang (đo CDP — Sprint 3 Phase 4).

## 5. Trạng thái tương tác

- **Focus:** `:focus-visible` outline accent (offset 2px) — a11y bàn phím.
- Link nội dung gạch chân (mặc định); brand/nav không gạch chân. Hover: dùng màu accent sẵn có (chưa thêm hiệu ứng — giữ tối giản).

## 6. Dark / Light mode

- **Ngoài phạm vi (Future)** — [01a §5](./01a-mvp-scope.md).

## 7. Accessibility trong thiết kế

> Tương phản màu, kích thước chạm, thứ tự tiêu điểm... Chi tiết: [15-seo-accessibility](./15-seo-accessibility.md).

- **Tương phản AA/AAA** (token màu Phase 0): text ~12.6:1, muted ~6.2:1, accent ~8.3:1 trên nền giấy.
- **Landmark** ngữ nghĩa + **skip-link** → `#main`; đúng 1 `h1`/trang, thứ tự heading hợp lý; `lang="vi"`.
- **Ảnh:** card thumbnail = trang trí (`alt=""`); cover detail & ảnh trong prose = alt thật.
- **`prefers-reduced-motion`** tôn trọng. (Kiểm chứng bằng audit — Sprint 3 Phase 4.)

## 8. Chuyển động & Hiệu ứng (Motion)

- TODO _(tôn trọng `prefers-reduced-motion`)_.

## 9. Bàn giao thiết kế (Design Handoff)

- Nguồn thiết kế (Figma/khác): _TBD (link)_.
- Quy ước đặt tên layer/component khớp code: TODO.
