# 🏗️ Sprint 3 — Implementation Plan (Reader Experience)

> **Trạng thái:** 🟢 **Đã duyệt (approved, kèm chỉnh sửa) — bắt đầu Phase 0** · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-22 · **Người duyệt:** Tech Lead
>
> 🎯 **Mục tiêu Sprint 3:** biến *vertical slice* hiện tại ([Sprint 2 Completion](./sprint-2-completion-report.md)) thành **một blog có trải nghiệm đọc hoàn chỉnh** — **CHỈ tầng Presentation, KHÔNG mở rộng chức năng**.
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
- `docs/sprints/sprint-3-completion-report.md` (cuối sprint).

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
