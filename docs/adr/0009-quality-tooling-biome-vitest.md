# ADR-0009 — Dùng Biome + Vitest cho cổng chất lượng (lint / format / test)

> **Status:** Accepted <!-- 2026-07-28, Sprint 7 Planning -->
> **Ngày đề xuất:** 2026-07-28 · **Ngày Accepted:** 2026-07-28
> **Người quyết định:** Product (duyệt Sprint 7 Planning) + Implementation
> **Người liên quan / tham vấn:** —
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) gián tiếp; chủ yếu phục vụ **maintainability/testability** — quyết định thuộc tầng RÌA (tooling), **không** ràng buộc tài liệu LÕI.

---

## Bối cảnh (Context)

Sprint 7 (System Hardening & Quality) cần dựng **lưới an toàn tự động**. Trạng thái trước sprint: **không** có lint/format/test/CI (`11-testing` toàn TODO; `09-coding-standards §4/§5/§10` TODO; không config `eslint/prettier/biome`). Cần chốt bộ công cụ cưỡng chế chất lượng tĩnh (định dạng + lint) và khung test (unit + contract) để bắt lỗi sớm, giữ code nhất quán, ngăn hồi quy.

Theo nguyên tắc ADR của Product (2026-07-28): *ADR chỉ dùng cho quyết định khó đảo ngược hoặc ảnh hưởng lâu dài*. Việc chọn **formatter/linter** (phong cách thấm vào mọi file) và **test runner** (API test khoá vào hàng loạt test) là ảnh hưởng lâu dài ⇒ ghi ADR. Ngược lại **`astro check`** là typechecker **gắn chặt framework Astro** (không có lựa chọn thay thế thực chất) ⇒ **không** cần ADR riêng.

## Quyết định (Decision)

Chúng ta sẽ dùng:
- **Biome** — một công cụ cho **cả lint và format** (thay vì ESLint + Prettier tách rời). Phạm vi Sprint 7: `apps/web` (`.ts/.js/.mjs/.json/.css`).
- **Vitest** — khung **unit + contract test** (Phase 2).
- **`astro check`** — typecheck cho `.astro` + `.ts` (không cần ADR — framework-native).

**Ranh giới đã biết (Sprint 7):** Biome **chưa** định dạng file `.astro` → `.astro` do `astro check` lo *type*, phần *format* để editor/thủ công (ghi Known Limitations). Lint `services/*.mjs` (script vận hành, đơn vị reproducible riêng) = **follow-up**, không thuộc Sprint 7.

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P6 Low coupling | ✅ (gián tiếp) | Test/gate bảo vệ ranh giới DTO ([03d](../03d-api-contract.md)) khỏi drift |
| (Tooling RÌA) | ⚠️ | Quyết định implementation; **không** ràng buộc LÕI (`03b/03c/03d/03e`) |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| **Biome** (đã chọn) | 1 binary lint+format, rất nhanh, ~0 cấu hình, ít dependency | Chưa format `.astro`; hệ sinh thái trẻ hơn | — |
| ESLint + Prettier | Phổ biến, plugin nhiều (gồm `.astro`) | 2 công cụ, nhiều dependency, cấu hình nặng, chậm hơn | Thừa phức tạp cho quy mô này |
| **Vitest** (đã chọn) | Hợp Vite/Astro, nhanh, API kiểu Jest | Trẻ hơn Jest | — |
| Jest | Phổ biến, chín | Nặng, cấu hình ESM/TS phiền, không dùng pipeline Vite | Kém hợp Astro |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** một công cụ lint+format nhanh, ít dependency (chỉ `@biomejs/biome`); test runner hợp toolchain Vite của Astro; cổng chạy được cục bộ và trong CI (Phase 3).
**Tiêu cực / Đánh đổi:** Biome **không** format `.astro` (13 file) trong Sprint 7 — cần công cụ khác nếu muốn về sau; `noImportantStyles` bị tắt (dùng `!important` hợp lệ ở `prefers-reduced-motion`).
**Trung tính / Cần theo dõi:** phủ lint cho `services/*.mjs` và format `.astro` là follow-up; theo dõi Biome trưởng thành hỗ trợ `.astro`.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa (RÌA):** `apps/web/biome.json` + scripts; nếu đổi test runner → viết lại harness/`import` API test.
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md), [03c](../03c-content-model.md), [03d](../03d-api-contract.md), [03e](../03e-data-model.md) — test kiểm *hành vi/DTO*, không bám công cụ.
- **Dữ liệu di trú:** không.
- **Mức chi phí:** **Thấp–Trung bình** — đổi formatter là reformat cơ học; đổi test runner cần chuyển cú pháp test (số lượng nhỏ ở Sprint 7).

## Liên kết (Links)

- Chuẩn code: [../09-coding-standards.md](../09-coding-standards.md) · Testing: [../11-testing.md](../11-testing.md) · Quality Gates: [../14-quality-gates.md](../14-quality-gates.md)
- Sprint 7 Planning: [../sprints/sprint-7-planning.md](../sprints/sprint-7-planning.md)
