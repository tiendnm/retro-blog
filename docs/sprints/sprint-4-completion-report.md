# 🏁 Sprint 4 — Completion Report (Fixture Framework & Dogfooding)

> **Ngày:** 2026-07-22 · **Sprint:** 4 — Fixture Framework & Dogfooding · **Trạng thái:** 🟢 **HOÀN THÀNH**
> **Kế hoạch nguồn:** [sprint-4-implementation-plan.md](./sprint-4-implementation-plan.md) · **Thiết kế:** [../../services/directus/fixtures/DESIGN.md](../../services/directus/fixtures/DESIGN.md) · **Nhánh:** `main` (mỗi phase 1 commit)

---

## 1. Mục tiêu đạt được

Xây **Fixture Framework** (độc lập Directus, tái lập, có profile) + **dataset dogfooding** để kiểm thử website ở điều kiện gần thật. **KHÔNG** thêm feature; **KHÔNG** đổi Reader / API / Content Model / kiến trúc — chỉ **công cụ + dữ liệu (RÌA)**.

## 2. Các phase (mỗi phase 1 commit)

| Phase | Commit | Nội dung |
|---|---|---|
| Plan | `ed915b9` | Kế hoạch (framework-first, providers mở, profiles/sets, deterministic+seed) |
| P0 — Design | `59197bb` | DESIGN.md: ports & adapters (độc lập Directus), providers, sets, profiles, định danh+seed |
| P1 — Framework | `6938cdc` | rng/model/taxonomy/profiles/generator + providers + loader (adapter) + Batch 1 `normal` ~10 |
| P2 — normal large | `d45e03d` | mở rộng `normal` → ~100; phủ `.prose`; deterministic + slug ổn định |
| P3 — edge + stress | `66da1bc` | bộ `edge` (10 ca) + `stress` (3 ca); load/reset độc lập |
| P4 — Dogfooding verify | _(commit này)_ | build scale + usability verify + báo cáo này |

## 3. Acceptance Criteria (từ [Plan §8](./sprint-4-implementation-plan.md))

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Framework: generate/load/reset; **profiles** small/medium/large/stress; **sets** normal/edge/stress nạp độc lập; **providers** chọn được; Generator độc lập Directus; DEV-only guard | ✅ (profile `stress` gộp [normal,edge,stress]; guard chặn non-localhost; stub `ai/future` báo lỗi) |
| 2 | Tái lập: cùng seed ⇒ cùng dataset; **slug ổn định** qua regenerate | ✅ hash trùng; slug độc lập seed + **giữ nguyên khi phóng to** small→large |
| 3 | Pagination: tổng > pageSize → API đúng; ghi giới hạn UI | ✅ 96 published → API 9+ trang, page1≠page2; UI hiện trang đầu (**Pagination UI = B4**) |
| 4 | Category rỗng (empty-state); category & homepage nhiều trang | ✅ `networking` rỗng; `cpu`… nhiều trang |
| 5 | Bài rất dài phủ `.prose`, không overflow; bài không cover text-only | ✅ (no-cover mặc định → text-only Option B) |
| 6 | Edge/Stress không vỡ layout / không cuộn ngang trang | ✅ **trừ 1 finding** `edge-long-word` (§5) — code/table cuộn trong khung |
| 7 | Reset theo slug; `astro build` N trang; perf baseline | ✅ **111 trang (96 detail + 14 category + index) trong 5.77s** |
| 8 | Không đổi Content Model/API/DTO/Reader | ✅ diff không chạm `03c/03d/03e`, `apps/web`, `directus.ts`/`types.ts`, permissions, schema |

## 4. Dataset (large + edge + stress)

- **`normal`** (~100, seed 42): 80 published + 20 draft; 9/10 category dùng (`networking` rỗng); phủ `.prose` đạt (code 20 · table 20 · blockquote 61 · nested 67 · image 20).
- **`edge`** (10): title rất dài · không category · nested ≥6 cấp · 14 heading · slug rất dài · excerpt rỗng · unicode nặng · từ siêu dài · đoạn chỉ ảnh · nhiều link.
- **`stress`** (3): markdown ~5000 từ · bảng 15 cột · code 160 dòng.
- Tổng Public published (gồm seed-dev): **96** → build **111 trang**.

## 5. Usability Verification (góc bổ sung của Product)

Đo overflow (CDP @390 & desktop) + soi ảnh khả năng đọc:

| Ca | Kết quả |
|---|---|
| **Bảng rất rộng** | ✅ **dùng được** — cuộn ngang trong khung `.prose`, trang không tràn |
| **Code block rất lớn** | ✅ cuộn ngang trong khung; cuộn dọc dài nhưng đọc được |
| **Ảnh trong bài** | ✅ vừa khung (`max-width:100%`), không tràn |
| **Title rất dài** | ✅ h1 wrap nhiều dòng, không tràn |
| **Nested list sâu (6 cấp)** | ✅ thụt lề rõ, marker phân biệt, đọc tốt |
| **Heading dày (14)** | ✅ phân cấp rõ, không tràn |
| **Unicode nặng** (emoji/日本語/中文/∑∏∆/①②③) | ✅ render đúng, đọc tốt |
| **⚠️ Từ siêu dài** (`edge-long-word`) | ❌ **cuộn ngang TRANG** (+54px @390, +754px desktop) — xem Backlog UI-1 |

## 6. 🐞 UI Findings → Backlog (KHÔNG sửa Reader trong Sprint 4)

| ID | Vấn đề | Mức độ | Ghi chú |
|---|---|---|---|
| **UI-1** | Từ dài **không khoảng trắng** (≥100 ký tự) tràn ngang gây cuộn ngang trang (`.prose`/body thiếu `overflow-wrap`) | **Thấp / không nghiêm trọng** — nội dung vẫn đọc được; nội dung thật hiếm có từ như vậy | Fix tương lai: `overflow-wrap: anywhere` (1 dòng CSS) ở **Sprint Visual Polish / UI Refinement**. Không sửa Reader trong Sprint 4 (không phải lỗi hỏng chức năng — theo yêu cầu Product) |

> Theo quy tắc Product: chỉ sửa Reader trong Sprint 4 nếu **lỗi nghiêm trọng làm hỏng chức năng**. UI-1 không thuộc loại đó → **ghi Visual Backlog**.

## 7. Remaining Backlog (đề xuất — chưa cam kết)

| # | Hạng mục | Ghi chú |
|---|---|---|
| B-UI1 | Fix overflow từ-siêu-dài (`overflow-wrap`) | Visual Polish/UI sprint (§6) |
| B-VIS | Paper grain/crease procedural (định hướng mỹ thuật) | Design Backlog (đã ghi nhận Phase 2) — Sprint Visual Polish |
| B4 | **Pagination UI** | Fixture đã *phơi bày nhu cầu* (96 bài / 9 trang) — API sẵn sàng |
| B-AI | Content/Cover provider `ai` (hiện stub) | Cắm khi cần nội dung/ảnh chất lượng hơn |
| — | Editor Experience (đã gác), Deployment, SEO, Search… | Từ backlog Sprint 3/roadmap M3 |

## 8. Cách dùng fixture (đã tài liệu hoá)

```
pnpm fixtures:generate -- --set normal --profile large --seed 42   # sinh (deterministic)
pnpm fixtures:load     -- --profile large                          # nạp normal (DEV-only)
pnpm fixtures:load     -- --set edge                               # nạp riêng edge
pnpm fixtures:load     -- --profile stress                         # normal+edge+stress
pnpm fixtures:reset    -- --set edge                               # xoá riêng edge (theo slug)
```

> Trạng thái hiện tại: `normal`(100)+`edge`(10)+`stress`(3) đang load cùng `seed-dev`. Muốn về tối thiểu: `fixtures:reset` từng set/profile (seed-dev giữ nguyên).

---

> ✅ **SPRINT 4 ĐÓNG.** Không bắt đầu Sprint 5 cho tới khi được phê duyệt.
