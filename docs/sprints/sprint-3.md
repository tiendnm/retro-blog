# 🏁 Sprint 3 — Completion Report (Reader Experience)

> **Ngày:** 2026-07-22 · **Sprint:** 3 — Reader Experience (Presentation Layer) · **Trạng thái:** 🟢 **HOÀN THÀNH**

---

## 1. Mục tiêu đạt được

Biến vertical slice ([Sprint 2](./sprint-2.md)) thành **một blog có trải nghiệm đọc hoàn chỉnh và thống nhất** — **chỉ tầng Presentation, KHÔNG mở rộng chức năng**. Cùng chức năng như Sprint 2; nâng chất lượng trình bày + a11y baseline + responsive.

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

## 4. Acceptance Criteria (từ Kế hoạch §6 (phụ lục bên dưới))

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


---

## Phụ lục — Kế hoạch ban đầu


>
> 🎯 **Mục tiêu Sprint 3:** biến *vertical slice* hiện tại (Sprint 2 ([sprint-2](./sprint-2.md))) thành **một blog có trải nghiệm đọc hoàn chỉnh** — **CHỈ tầng Presentation, KHÔNG mở rộng chức năng**.
> 🔗 **Nguồn đã đọc (không định nghĩa lại):** [01a-mvp-scope](../01a-mvp-scope.md) · [02-roadmap](../02-roadmap.md) (M2→M3) · [03-architecture](../03-architecture.md) · [03d-api-contract](../03d-api-contract.md) (hợp đồng ĐÓNG BĂNG) · [ADR-0002](../adr/0002-use-astro-site-generator.md)/[ADR-0006](../adr/0006-render-strategy.md) · [07-ui-ux](../07-ui-ux.md) · [15-seo-accessibility](../15-seo-accessibility.md).

---

> 🔒 **Ranh giới cứng (đọc trước):** Sprint 3 chỉ chạm **Presentation/Site** ([03 §3](../03-architecture.md)). **KHÔNG** đổi API Contract [03d](../03d-api-contract.md), Content Model [03c](../03c-content-model.md), Data Model [03e](../03e-data-model.md), thin client `directus.ts`/DTO `types.ts`, schema/permissions/seed. Dữ liệu hiện có **đủ** cho toàn bộ hạng mục dưới đây. Nếu một ý tưởng thiết kế cần dữ liệu/field/operation mới → **DỪNG**, ghi Decision Log/ADR, chờ review (không tự mở rộng).

## 1. Goal

Sau Sprint 3, Retro Blog **trông và đọc như một blog thật**: bố cục nhất quán, typography dễ đọc, header/footer/điều hướng rõ ràng, responsive, và đạt **a11y baseline**. **Cùng chức năng như Sprint 2** — chỉ nâng chất lượng trình bày.

- Đây là phần **Reader Experience** trên đường tới [M3 — Launch](../02-roadmap.md). **KHÔNG** hoàn thành M3 (SEO/perf/launch-checklist vẫn ở sprint sau).
- Phong cách thị giác retro **chưa bị khóa** ở sprint này — được **hoàn thiện dần** sau khi review giao diện thực tế.

## 2. Phân tích từng hạng mục Presentation

> Với mỗi hạng mục: **Goal · Lý do · Content Model? · API? · Architecture?** Tất cả đều **CHỈ Presentation** (chạm `.astro`/CSS).

| # | Hạng mục | Goal | Lý do | Content Model | API (03d) | Architecture |
|---|---|---|---|---|---|---|
| 1 | **Homepage layout** | Bố cục trang chủ rõ ràng: tiêu đề site + danh sách bài mới nhất | Cửa vào của blog; ấn tượng đầu + dẫn dắt đọc | ❌ Không | ❌ Không (dùng `listPublishedPosts` sẵn có) | ❌ Không |
| 2 | **Post card layout** | Thẻ bài nhất quán: title · excerpt · meta (tác giả/ngày) | Đơn vị lặp ở list & category; nhất quán giúp quét nhanh | ❌ Không | ❌ Không (DTO `PostSummary`) | ❌ Không |
| 3 | **Component hiển thị ảnh** *(chuẩn bị — KHÔNG chốt layout)* | **Chỉ chuẩn bị** component có thể render ảnh (alt; khuyết ảnh không vỡ) nếu cần | **Layout thumbnail homepage KHÔNG quyết ở Sprint 3** — để sau, review với Product Owner khi có giao diện thực tế | ❌ Không (`cover` đã có) | ❌ Không (dùng `cover.url/alt`; **KHÔNG** transform) | ❌ Không |
| 4 | **Typography** | Thang chữ (scale), line-height, hệ phông (**system stack**), phân cấp heading | Đọc là hành vi chính; typography quyết định độ dễ đọc | ❌ Không | ❌ Không | ❌ Không |
| 5 | **Reading width** | Giới hạn độ rộng dòng thân bài (~**60–75 ký tự**) | Dòng quá dài giảm tốc độ đọc (chuẩn readability) | ❌ Không | ❌ Không | ❌ Không |
| 6 | **Header** | Header nhất quán: brand/tên site, về trang chủ | Nhận diện + điều hướng cơ bản trên mọi trang | ❌ Không | ❌ Không | ❌ Không |
| 7 | **Footer** | Footer nhất quán: thông tin site, năm, ghi chú | Đóng khung trang; cảm giác "blog thật" | ❌ Không | ❌ Không | ❌ Không |
| 8 | **Navigation (tĩnh)** | Nav tĩnh: **Brand + Home** (+ link về trang chủ ở detail/category) | Reader di chuyển list ↔ detail ↔ category | ❌ Không | ❌ Không (**KHÔNG** menu category động; không thao tác mới) | ❌ Không |
| 9 | **Empty state** | Trạng thái rỗng thân thiện (list rỗng · category rỗng) | Blog mới / category chưa có bài vẫn phải tử tế | ❌ Không | ❌ Không (chuỗi "Chưa có bài" đã có, chỉ style hoá) | ❌ Không |
| 10 | **Responsive** | Bố cục co giãn mobile → desktop (breakpoints, grid/flex, ảnh co giãn) | **NFR Must** ([01a §3](../01a-mvp-scope.md)); phần lớn đọc trên mobile | ❌ Không | ❌ Không | ❌ Không |
| 11 | **Image presentation** *(detail)* | Ảnh bìa trong detail hiển thị an toàn: `max-width`, `object-fit`, alt, `loading=lazy` | Ảnh không vỡ layout; giữ a11y | ❌ Không | ❌ Không (**KHÔNG** srcset/transform — perf ngoài phạm vi) | ❌ Không |
| 12 | **Accessibility** | a11y baseline: HTML ngữ nghĩa, thứ tự heading, alt, focus-visible, skip-link, landmark, tương phản **AA**, `lang`, bàn phím | **NFR Must**; đọc được với mọi người ([15](../15-seo-accessibility.md)) | ❌ Không | ❌ Không | ❌ Không |
| 13 | **Design consistency** | CSS tokens (màu/spacing/typography/container) dùng chung; component nhất quán | Nhất quán = chuyên nghiệp + dễ bảo trì; nền cho [07-ui-ux](../07-ui-ux.md) | ❌ Không | ❌ Không | ❌ Không |

### Chốt Navigation (đã duyệt): nav TĨNH

- Nav gồm **Brand + Home** (và link "về trang chủ" ở trang detail/category). **KHÔNG** menu category động.
- **KHÔNG** sửa API Contract [03d](../03d-api-contract.md); **KHÔNG** thêm operation mới vào thin client `directus.ts`.

> ✅ **Kết luận phân tích:** **toàn bộ** hạng mục Sprint 3 là **thuần Presentation** — không chạm Content Model / API / Architecture.

## 3. Scope (trong phạm vi)

1. **Design Foundation:** CSS tokens nền — **typography scale · spacing · container · color variables** (kiểm tương phản AA) + global stylesheet; điền [07-ui-ux §2](../07-ui-ux.md). *(KHÔNG khóa phong cách thị giác cuối cùng.)*
2. **Layout shell:** `Header`, `Footer`, **nav tĩnh (Brand + Home)**, refactor `Base.astro` (landmarks ngữ nghĩa, skip-link, `lang`).
3. **Homepage + Post Card (text-first) + Empty state**; **chuẩn bị** component hiển thị ảnh (KHÔNG chốt layout thumbnail homepage).
4. **Post detail reading experience:** typography thân bài, reading width, hiển thị ảnh bìa an toàn; **Category** nhất quán.
5. **Responsive + Accessibility baseline + Design consistency pass.**
6. **Không hồi quy:** vertical slice Sprint 2 vẫn chạy (list/detail/category hiển thị seed; draft ẩn).

## 4. Out of scope (KHÔNG làm)

- ❌ **Search · Tag · SEO · Analytics · RSS · Comment · Deployment · Authentication · Dark mode · Performance optimization.**
- ❌ **Quyết định layout thumbnail cho homepage** — chỉ chuẩn bị component hiển thị ảnh; layout để **sau**, review với Product Owner khi có giao diện thực tế.
- ❌ **Menu category động / nav động** — nav chỉ **Brand + Home** (tĩnh).
- ❌ **Khóa phong cách thị giác retro cuối cùng** — Phase 0 chỉ dựng *nền* (tokens); phong cách hoàn thiện dần sau khi review giao diện thực tế.
- ❌ Thêm/đổi **content type, field, DTO, API operation** (hợp đồng 03d ĐÓNG BĂNG); **không** thêm operation vào thin client.
- ❌ **Pagination UI** (API đã hỗ trợ `page/pageSize` nhưng UI để sprint sau).
- ❌ Web font ngoài (dùng **system font stack** — tránh perf/deployment/CSP); ảnh srcset/transform/tối ưu (perf).
- ❌ Đổi thin client `directus.ts` / `types.ts`, schema/permissions/seed, `docker-compose.yml`, tài liệu LÕI (03c/03d/03e).

## 5. Phase breakdown

> Theo quy trình sprint-gated: **mỗi phase 1 commit trên `main`, dừng chờ review**. Mỗi phase **chỉ Presentation**.

### Phase 0 — Design Foundation (tokens)
- Định nghĩa **CSS tokens** nền: **typography scale · spacing · container · color variables** (kiểm **tương phản AA**).
- Tạo global stylesheet (`src/styles/global.css`); điền [07-ui-ux §2](../07-ui-ux.md).
- ⚠️ **KHÔNG khóa phong cách thị giác cuối cùng** — retro style sẽ hoàn thiện dần sau khi review giao diện thực tế. Phase 0 chỉ dựng *nền* để các phase sau bám vào.

### Phase 1 — Layout shell (Header / Footer / Nav tĩnh / a11y landmarks)
- `Header.astro`, `Footer.astro`, **nav tĩnh (Brand + Home)**; refactor `Base.astro` dùng tokens.
- **Landmark ngữ nghĩa** (`header`/`nav`/`main`/`footer`), **skip-link**, `lang="vi"`, container responsive.

### Phase 2 — Homepage · Post Card · Empty state
- `index.astro` bố cục trang chủ; `PostCard` (title, excerpt, meta — **text-first**, chưa chốt thumbnail homepage).
- **Chuẩn bị** component hiển thị ảnh (`CoverImage.astro`): render ảnh khi có (alt), khuyết ảnh không vỡ — *dùng cho detail; homepage thumbnail để sau*.
- Empty state cho list.

### Phase 3 — Post detail & Category reading experience
- Detail: typography thân bài + **reading width** + hiển thị ảnh bìa (qua `CoverImage`, an toàn/không vỡ) + meta (tác giả/ngày/category).
- Category nhất quán với post card của homepage + empty state; link về trang chủ.

### Phase 4 — Responsive · Accessibility · Consistency + Completion
- Rà **responsive** mọi trang (mobile ~360px → desktop; không cuộn ngang, không vỡ).
- Rà **a11y**: tương phản AA, focus-visible, thứ tự heading, alt, bàn phím, `prefers-reduced-motion`.
- Rà **design consistency**; điền phần còn lại [07-ui-ux](../07-ui-ux.md) (+ phần a11y [15](../15-seo-accessibility.md), **không** đụng SEO).
- **Sprint 3 Completion Report**.

## 6. Acceptance Criteria

- [ ] CSS tokens (typography/spacing/container/color) định nghĩa & **dùng nhất quán** (không giá trị hardcode rải rác); **chưa** khóa phong cách thị giác cuối cùng.
- [ ] **Header/Footer/nav tĩnh (Brand + Home)** hiển thị & nhất quán trên **mọi** trang (home/detail/category); **không** menu động.
- [ ] Homepage + post card render nhất quán (title/excerpt/meta); **component hiển thị ảnh** tồn tại & render được ảnh (có alt), khuyết ảnh **không vỡ** — *layout thumbnail homepage KHÔNG chốt ở Sprint 3*.
- [ ] Detail: **reading width** giới hạn (~60–75ch), phân cấp typography rõ, ảnh bìa hiển thị an toàn (không vỡ).
- [ ] Category dùng **cùng** card như homepage; empty state có style (list & category).
- [ ] **Responsive:** không cuộn ngang / vỡ layout ở mobile (~360px) → desktop.
- [ ] **A11y baseline:** landmark ngữ nghĩa · thứ tự heading đúng · mọi ảnh có alt · **focus-visible** · skip-link · **tương phản AA** · bàn phím dùng được · `lang` đặt · tôn trọng `prefers-reduced-motion`.
- [ ] **Không hồi quy:** `astro build` vẫn ra **đúng bộ route** như Sprint 2 (index + N detail + M category theo seed); list/detail/category hiển thị seed; **draft ẩn**.
- [ ] **Không mở rộng chức năng:** `directus.ts`/`types.ts` **không đổi**; **03d/03c/03e không đổi**; không route/endpoint/operation mới; không thêm mục Out-of-scope §4.

## 7. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| **Scope creep** sang chức năng (menu category động, tag, search, thumbnail layout) | Vỡ ranh giới "presentation-only" | §2/§4 chốt rõ; hợp đồng 03d đóng băng; phát sinh → DỪNG + Decision Log |
| Thiết kế "muốn thêm field/dữ liệu/operation" | Chạm Content Model/API | Freeze DTO & thin client; cần dữ liệu mới → STOP, không tự mở rộng |
| **Khóa phong cách retro quá sớm** | Làm lại nhiều lần | Phase 0 chỉ dựng *nền*; phong cách hoàn thiện dần sau review giao diện thực tế |
| **Tương phản AA vs thẩm mỹ retro** (palette nhạt) | Fail a11y | Chọn color variables đạt AA từ Phase 0; kiểm bằng công cụ contrast |
| **Web font** → perf/deployment/CSP | Ngoài phạm vi bị kéo vào | Dùng **system font stack**, không font ngoài |
| Ảnh không transform → CLS/nhảy layout | Trải nghiệm kém | CSS kích thước ổn định + `object-fit`; (srcset/optimize = perf, OUT) |
| Refactor CSS inline trong `Base.astro` hiện tại | Hồi quy giao diện | Tách global stylesheet **từng phase**, verify không hồi quy mỗi phase |
| Dev cache `getStaticPaths` (đã gặp Sprint 2) | Review thấy 404 sau khi đổi data | Restart web sau khi đổi seed; kiểm chứng chính trên **`astro build`/dist** |

## 8. File dự kiến thay đổi

**Tạo mới (Presentation):**
- `apps/web/src/styles/global.css` (CSS tokens + base) — *có thể tách `tokens.css` + `base.css`*.
- `apps/web/src/components/Header.astro`, `Footer.astro` (+ có thể `Nav.astro`); `CoverImage.astro` *(component hiển thị ảnh — chuẩn bị, KHÔNG chốt layout thumbnail)*.
- `docs/sprints/sprint-3.md` (cuối sprint).

**Sửa (Presentation):**
- `apps/web/src/layouts/Base.astro` (dùng tokens/global, landmarks, skip-link).
- `apps/web/src/components/PostCard.astro`.
- `apps/web/src/pages/index.astro`, `posts/[slug].astro`, `category/[slug].astro`.
- **Docs:** `docs/07-ui-ux.md` (design foundation — tài liệu chính) · `docs/15-seo-accessibility.md` (**chỉ phần a11y**, không SEO) · `docs/10-decisions.md` (Decision Log `[S3-*]`) · `docs/09-coding-standards.md` (quy ước CSS/component — tuỳ chọn) · `README.md` (trạng thái).

**KHÔNG đổi (đóng băng — chống mở rộng):**
- `apps/web/src/lib/directus.ts`, `apps/web/src/lib/types.ts` (thin client + DTO — **không thêm operation**).
- `services/directus/**` (schema snapshot, permissions, seed), `docker-compose.yml`, `apps/web/astro.config.mjs`.
- `docs/03c-content-model.md`, `docs/03d-api-contract.md`, `docs/03e-data-model.md` (LÕI/hợp đồng).

---

> ✅ **Đã duyệt (kèm 3 chỉnh sửa: Phase 0 = Design Foundation, không khóa phong cách; bỏ thumbnail layout khỏi scope — chỉ chuẩn bị component ảnh; nav tĩnh Brand + Home).** Commit plan → bắt đầu **Phase 0**, dừng chờ review theo từng phase.
