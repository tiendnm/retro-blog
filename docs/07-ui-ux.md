# 07 — UI / UX & Design System

> **Trạng thái:** 🟡 Đang làm (Sprint 3 Phase 0 — Design Foundation) · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-22 · **Người duyệt:** _(chờ review)_
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
| Header / Nav | | ⏳ |
| PostCard (list item) | | ⏳ |
| Post layout (detail) | | ⏳ |
| Tag / Category badge | | ⏳ |
| Pagination | | ⏳ |
| Footer | | ⏳ |

## 4. Bố cục & Responsive

- TODO _(breakpoints, grid, mobile-first, khu vực nội dung)_.

## 5. Trạng thái tương tác

- TODO _(hover/focus/active/disabled; đặc biệt **focus visible** cho a11y)_.

## 6. Dark / Light mode

- TODO _(có hỗ trợ không? cách chuyển & lưu lựa chọn)_.

## 7. Accessibility trong thiết kế

> Tương phản màu, kích thước chạm, thứ tự tiêu điểm... Chi tiết: [15-seo-accessibility](./15-seo-accessibility.md).

- TODO.

## 8. Chuyển động & Hiệu ứng (Motion)

- TODO _(tôn trọng `prefers-reduced-motion`)_.

## 9. Bàn giao thiết kế (Design Handoff)

- Nguồn thiết kế (Figma/khác): _TBD (link)_.
- Quy ước đặt tên layer/component khớp code: TODO.
