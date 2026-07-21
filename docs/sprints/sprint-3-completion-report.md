# 🏁 Sprint 3 — Completion Report (Reader Experience)

> **Ngày:** 2026-07-22 · **Sprint:** 3 — Reader Experience (Presentation Layer) · **Trạng thái:** 🟢 **HOÀN THÀNH**
> **Kế hoạch nguồn:** [sprint-3-implementation-plan.md](./sprint-3-implementation-plan.md) · **Nhánh:** `main` (mỗi phase 1 commit)

---

## 1. Mục tiêu đạt được

Biến vertical slice ([Sprint 2](./sprint-2-completion-report.md)) thành **một blog có trải nghiệm đọc hoàn chỉnh và thống nhất** — **chỉ tầng Presentation, KHÔNG mở rộng chức năng**. Cùng chức năng như Sprint 2; nâng chất lượng trình bày + a11y baseline + responsive.

- **Không đổi** API Contract (03d) · DTO (`types.ts`) · thin client (`directus.ts`) · Content Model · Directus (schema/permissions/seed). Xác nhận: các file này không nằm trong bất kỳ commit Sprint 3 nào.
- Đây là phần Reader Experience trên đường tới [M3 — Launch](../02-roadmap.md); **chưa** hoàn thành M3 (SEO/perf/launch-checklist vẫn ở sprint sau).

## 2. Các phase (mỗi phase 1 commit)

| Phase | Commit | Nội dung |
|---|---|---|
| Plan | `4ffc516` | Kế hoạch (duyệt kèm 3 chỉnh: Design Foundation; bỏ thumbnail layout; nav tĩnh) |
| P0 — Design Foundation | `e584c37` | CSS tokens (`global.css`): typography scale · spacing · container · color (AA); base + focus-visible + reduced-motion |
| P1 — Layout Shell | `9db462d` | `Header` (Brand+Home) · `Footer` · `Base` (skip-link → header → `main#main` → footer, landmark) |
| P2 — Post Card (Option B) | `7560104` | `PostCard` (thumbnail hỗ trợ; không cover → text-only, không placeholder) · `CoverImage` · empty state |
| P3 — Reading Experience | `bf678cc` | `.prose` (style tập trung markdown) · `.post` reading column · cover detail qua `CoverImage` |
| P4 — Consistency/Responsive/A11y | _(commit này)_ | Cross-page consistency · responsive/a11y audit · báo cáo này |

## 3. Cross-page Consistency Review (bước cuối)

Rà soát & **thống nhất** Homepage · Category · Post Detail:

| Khía cạnh | Kết quả |
|---|---|
| **Typography** | Cùng hệ token type-scale; h1 tiêu đề trang đồng cỡ (`--text-3xl`); card `h2` = `--text-xl`; prose phân cấp h2/h3 |
| **Container** | Trang danh sách rộng `--container-max` (720px); **detail** thu về `--reading-width` (~65ch) cho dễ đọc — chủ ý, nhất quán giữa các trang danh sách |
| **Vertical spacing** | h1 margin-bottom thống nhất (`--space-6`) mọi trang; nhịp dọc theo thang `--space-*` |
| **Heading hierarchy** | Đúng 1 `h1`/trang → `h2` (card/section) → `h3` (prose). Kiểm bằng audit |
| **Card spacing** | `PostCard` dùng chung ⇒ homepage & category **giống hệt** |
| **Colors / Border** | Toàn bộ qua token; **không** giá trị hardcode (đã grep). Divider lớn = nét đứt accent; separator nội dung = 1px solid border |
| **Visual rhythm** | Header/footer nét đứt accent; card/hr/empty-state nhất quán |

**Đã sửa để đồng bộ (P4):** empty-state của category (trước dùng `<p>` thường) → dùng `.empty-state` như homepage · back-link "← Trang chủ" thống nhất (`.back-link`) ở **cả** category & detail · margin `h1` nhất quán mọi trang.

→ **Người dùng cảm nhận toàn site là một hệ thống thống nhất.** Ảnh: [assets/sprint-3-phase-4/](./assets/sprint-3-phase-4/).

## 4. Acceptance Criteria (từ [Plan §6](./sprint-3-implementation-plan.md))

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | CSS tokens định nghĩa & dùng nhất quán; chưa khóa phong cách cuối | ✅ P0 (`global.css`; không hardcode) |
| 2 | Header/Footer/nav tĩnh (Brand+Home) nhất quán mọi trang; không menu động | ✅ P1 |
| 3 | Homepage + post card nhất quán; component ảnh render được, khuyết ảnh không vỡ | ✅ P2 (Option B; text-only fallback) |
| 4 | Detail: reading width (~65ch), phân cấp typography, ảnh bìa an toàn | ✅ P3 (`.post`/`.prose`) |
| 5 | Category dùng cùng card như homepage; empty state có style | ✅ P2/P4 |
| 6 | Responsive: không cuộn ngang/vỡ @360–390px → desktop | ✅ P4 (CDP: overflow **NO** cả 3 trang @390) |
| 7 | A11y baseline: landmark · heading order · alt · focus-visible · skip-link · AA · bàn phím · lang · reduced-motion | ✅ P4 (audit: h1=1/trang, skip-link/main#main/lang ✓, img no-alt=0; token AA) |
| 8 | Không hồi quy: `astro build` đúng bộ route (6 page); list/detail/category hiển thị seed; **draft ẩn** | ✅ (build 6 page; 3 published + draft ẩn) |
| 9 | Không mở rộng chức năng: `directus.ts`/`types.ts`/`03d`/`03c`/`03e` không đổi; không route/endpoint/operation mới | ✅ (không có trong diff Sprint 3) |

→ **9/9 đạt.**

## 5. Responsive & Accessibility (đo bằng CDP)

- **Responsive @390px:** overflow ngang = **NO** ở Homepage, Category, Detail. Code/table trong prose **cuộn ngang trong khung**, không vỡ trang.
- **A11y baseline:** skip-link → `#main`; landmark `header`/`nav`/`main`/`footer`; đúng 1 `h1`/trang; `lang="vi"`; `:focus-visible` outline; `prefers-reduced-motion` tôn trọng; ảnh card = trang trí (`alt=""`), ảnh cover detail = alt thật, ảnh prose = alt từ markdown; tương phản màu **AA/AAA** (text ~12.6:1, muted ~6.2:1, accent ~8.3:1 trên nền giấy).

## 6. Ngoài phạm vi (đã giữ đúng)

Search · Tag · SEO · Analytics · RSS · Comment · Deployment · Authentication · Dark mode · Performance optimization · Pagination UI · menu category động · web font ngoài · khóa phong cách thị giác cuối cùng.

## 7. Remaining Backlog (đề xuất — chưa cam kết)

| # | Hạng mục | Ghi chú |
|---|---|---|
| B1 | **Hoàn thiện phong cách retro** | Phase 0 chỉ dựng *nền* tokens; tinh chỉnh thị giác sau review thực tế với Product Owner |
| B2 | **Thumbnail layout homepage** | Đã hoãn (Product Review); quyết khi có giao diện thực tế |
| B3 | **Menu category động** | Cần thêm operation "list categories" vào 03d + thin client (ngoài presentation) |
| B4 | **Pagination UI** | API đã hỗ trợ `page/pageSize`; UI để sau |
| B5 | **SEO** (meta/OpenGraph/sitemap) | Thuộc **M3 — Launch** |
| B6 | **Performance** (Core Web Vitals, ảnh srcset/optimize) | Thuộc M3; ngoài Sprint 3 |
| B7 | **Sanitize HTML** khi render Markdown | Trước khi cho tác giả không tin cậy ([12-security §8](../12-security.md)) |
| B8 | **Rebuild-on-publish** (webhook → CI/CD) | Từ Sprint 2 backlog; cần cho deploy thật ([ADR-0006](../adr/0006-render-strategy.md)) |
| B9 | **Hardening build web** (pin lockfile + Dockerfile) | Nợ từ Sprint 1 |
| B10 | **Deployment / TLS / backup** | [08-deployment](../08-deployment.md), [13-operations](../13-operations.md) |

---

> ✅ **SPRINT 3 ĐÓNG.** Không bắt đầu Sprint 4 cho tới khi được phê duyệt.
