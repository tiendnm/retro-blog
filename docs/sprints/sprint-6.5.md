# 🔍 Sprint 6.5 — Review Report (Product Polish: Content & UX)

> **Trạng thái:** 🟢 **Approved — Phase 1 scope đã chốt** · **Ngày:** 2026-07-23 · **Product duyệt:** 2026-07-26
>
> ✅ **Phase 1 (implement):** `C4` SSOT Tag=Deferred · `R4` UI-1 overflow · `R5` 404 · `R1` meta description category/pagination · `R2` OG image mặc định · `R3` JSON-LD · `N4` article meta · `N1` bỏ back-link trùng · `N2` category trên card (Product duyệt **DTO additive**: thêm `category` vào `PostSummary`, permission KHÔNG đổi) · `C1` Flow auto `published_at` · `R8` pagination số trang.
> ⏭️ **Chưa làm (đợt sau / Deferred):** `C2` slugify · `R7` help notes · `R6` alt required · `C3` category nav · `N3` breadcrumb · `R10` caption · `R9` sitemap lastmod · đổi font thân bài.
> 🎯 **Mục tiêu:** giả định site được dùng **mỗi ngày** để viết về retro computing → phát hiện mọi điểm "khó chịu / thiếu / chưa mượt" ở trải nghiệm **editor** và **reader**, đề xuất **polish** (không feature mới, không redesign, không đổi kiến trúc).
> 🔗 [03c content-model](../03c-content-model.md) · [05-cms](../05-cms.md) · [03d api-contract](../03d-api-contract.md) · [07-ui-ux](../07-ui-ux.md) · [15-seo-accessibility](../15-seo-accessibility.md) · ảnh: [assets/sprint-6.5-review/](./assets/sprint-6.5-review/).

---

## 0. Phương pháp (có căn cứ)

Rà soát **code + schema thật + render thật**: đọc `03c`/`05-cms`/`schema.yaml` (collections/fields), truy vấn **field meta Directus live** (interface/required/note), liệt kê toàn bộ `apps/web/src/pages`, đọc `global.css` + components, chụp trang chi tiết (desktop+mobile) + homepage. **Không** giả định.

> 🏷️ **Cờ tác động** (dùng ở §3–§5): **🟢 không chạm hợp đồng** (CSS / component / asset / meta-tag / doc / Directus Flow) · **🟡 CHẠM hợp đồng đóng băng** (`03c`/`03d`/`types.ts`/`directus.ts`/permissions/`schema.yaml`) → cần phê duyệt riêng, không còn là "polish thuần".

## 1. Điểm mạnh hiện tại

- **Kiến trúc sạch:** Ports & Adapters, thin client + DTO, LÕI/RÌA tách bạch, SSOT rõ. Đổi nội dung/UI không rò xuống hợp đồng.
- **Reader vững:** responsive (overflow @390 = 0 trừ UI-1), **a11y baseline** (skip-link, landmark, 1 `<h1>`/trang, focus-visible, `prefers-reduced-motion`), `.prose` chịu edge/stress, pagination reach-all + a11y đúng.
- **SEO baseline:** canonical self-ref, OG/Twitter, sitemap canonical-only, robots — nhất quán, đúng domain qua `PUBLIC_SITE_URL`.
- **Bảo mật đọc:** least-privilege, draft ẩn, field allowlist (field nội bộ không tự lộ).
- **Design tokens nhất quán:** thang spacing/type, vertical rhythm (`.prose > * + *`), nhận diện retro (mono + giấy + dashed) **thống nhất** giữa các trang.
- **Vận hành:** fixtures deterministic, build tái lập, rebuild-on-publish, backup/restore đã kiểm chứng (Sprint 6).

## 2. Rà soát theo khu vực

### 2.1. Content Model
- **Divergence SSOT ⇄ hiện thực — `Tag`:** `03c §2.4` định nghĩa collection **Tag** + `Post.tags` (M2M), nhưng `schema.yaml` **không có** collection `tags` và `posts` **không có** field `tags` (đúng "Tag ngoài Sprint 2" ở `05-cms §1`). ⇒ SSOT mô tả thứ chưa tồn tại.
- **Field modeled nhưng "ngủ"** (có trong schema, **không** phơi ra Public/DTO/Reader): `category.parent` (phân cấp), `category.description`, `author.bio`, `directus_files.caption`. Không phải "dư" — là model có chủ đích nhưng chưa dùng.
- **`Media.alt` không enforced required:** `03c §5` nói alt **bắt buộc** (a11y), nhưng field Directus **không** `required` → editor có thể upload thiếu alt.
- **Không có field thừa**; đặt tên nhất quán (snake_case, rõ nghĩa). Không đề xuất đổi tên.

### 2.2. CMS UX (giả lập editor)
- **Publish là "bẫy 2 bước":** publish cần **đồng thời** `status=published` **và** set `published_at` tay (rule Public yêu cầu `published_at ≤ $NOW`). Không auto-set, không guard ⇒ editor đặt `status=published` nhưng **quên** `published_at` → bài **không hiện** mà không có cảnh báo. Dùng hằng ngày sẽ vấp.
- **`slug` là `input` thường:** không auto-slugify từ title, không chặn dấu cách/unicode/trùng ⇒ dễ tạo slug xấu; ổn định slug (BR-2) phụ thuộc kỷ luật tay.
- **Không có help note** cho field nào (trừ `files.alt`): `slug`/`published_at`/`excerpt`/`status` thiếu hướng dẫn (excerpt dùng cho list+SEO? published_at hành vi ra sao?).
- **`alt` không required** (trùng 2.1) → a11y phụ thuộc thói quen.
- **Nhỏ:** chưa đặt display template / group / sort cho collection (list view Directus mặc định).
> ⚠️ Sửa note/required/interface field = cập nhật **field meta trong `schema.yaml`** (không đổi data model, nhưng vẫn là schema snapshot) → 🟡.

### 2.3. Reader UX
- **Category khó khám phá:** Header nav chỉ **Brand + "Trang chủ"**; category **không** có trong điều hướng — chỉ tới được khi bấm link category trong 1 bài. Homepage không liệt kê chủ đề. (Sprint 3 cố ý giữ nav tối giản — nay nên xem lại cho content-readiness.)
- **Không có trang 404** (`src/pages/404.astro` không tồn tại) → 404 mặc định (không style, lạc nhận diện).
- **Back-link trùng:** trang chi tiết có "← Trang chủ" **trùng** "Trang chủ" ở header.
- **Post card không hiện category** → đọc list không biết chủ đề bài.
- **Tác giả không click được** (không có trang author) — nhất quán hiện tại, nhưng `author.name` chỉ là text.
- **Không breadcrumb** (Home › Category › Post).
- **Ngoài phạm vi polish (là FEATURE):** Search, Tag pages, Archive, RSS, Related posts → §2.6 / Sprint 7+.

### 2.4. Theme Polish
- **Thân bài toàn monospace:** `--font-body: mono` áp cho **cả `.prose`** → nhận diện retro mạnh nhưng **đọc bài dài mỏi mắt** (mục tiêu sprint: viết retro computing hằng ngày = bài dài). `--font-serif` đã khai báo nhưng **không dùng**. → cân nhắc mono cho heading/brand/code/meta (giữ chất), **thân bài** serif/sans. **Đây chạm nhận diện thị giác → QUYẾT ĐỊNH của Product** (không tự đổi).
- **UI-1 (từ-siêu-dài tràn ngang)** vẫn chưa xử lý (Visual Backlog) — sprint polish là đúng lúc: `overflow-wrap: break-word` (+`hyphens`) trên `.prose`.
- **`caption` ảnh không render:** model có `caption` nhưng ảnh trong bài không có `<figcaption>` → mất ngữ cảnh + a11y.
- **Code block không syntax highlight** (mono trơn) — Nice.
- **Tốt sẵn:** spacing/rhythm, blockquote, list, table (cuộn ngang), heading hierarchy, hr.

### 2.5. SEO Polish
- **Trang category & pagination KHÔNG có meta description:** `category/[slug]` và `page/[page]` chỉ truyền `title` cho `Base` → thiếu `<meta name=description>`/`og:description` (homepage có, detail dùng excerpt).
- **Không có OG image mặc định:** `og:image` chỉ khi bài có cover → bài không cover (hiện **tất cả**) → thẻ chia sẻ trống ảnh, nhạt.
- **JSON-LD `BlogPosting` chưa có** (stretch S5) — thêm ở detail dùng field DTO sẵn có (title/excerpt/author/publishedAt), không đổi kiến trúc.
- **Sitemap thiếu `<lastmod>`** (chỉ `<loc>`) — thêm từ `published_at` cải thiện tín hiệu crawl.
- **Thiếu `article:published_time`/`article:author`** meta ở detail (og:type=article nhưng không có meta bài).
- **Kiến trúc SEO đúng** (canonical policy, sitemap canonical-only) — **không** đổi.

### 2.6. Content Readiness (10 / 50 / 100 / 500 bài)
| Quy mô | Đánh giá |
|---|---|
| 10–50 | Ổn. |
| 100 (≈10 trang) | Pagination prev/next bắt đầu mệt; thiếu duyệt theo chủ đề → khám phá kém. |
| 500 (≈50 trang) | **Pagination prev/next sụp** (không số trang/nhảy trang); **không search, không category tree, không archive** → điều hướng không đủ. |

- **Polish dùng dữ liệu sẵn có (trong tầm):** điều hướng category, số trang/nhảy trang, mô tả category, (dùng `category.parent` đã model cho cây chủ đề — lớn hơn).
- **Là FEATURE (ngoài polish → Sprint 7/Future):** Search, Archive, RSS, Related posts, hệ thống Tag.

## 3. Điểm cần cải thiện — phân loại

> Effort: **QW** Quick Win (≤ ½ ngày) · **M** Medium (~1–2 ngày) · **L** Large. Cờ 🟢/🟡 như §0.

### 🔴 Critical (ảnh hưởng trực tiếp dùng hằng ngày / tính toàn vẹn)
| # | Vấn đề | Đề xuất | Effort | Cờ |
|---|---|---|---|---|
| C1 | Publish "bẫy 2 bước" (quên `published_at` → bài ẩn) | Directus **Flow** auto-set `published_at` khi `status→published` (tận dụng Flows S6) | M | 🟢 (Flow, reproducible script) |
| C2 | `slug` nhập tay dễ sai | Thêm help note + (tùy) hỗ trợ slugify | QW–M | 🟡 (field meta) |
| C3 | Category không khám phá được (nav/homepage) | Liệt kê category ở header/footer/homepage | M | 🟡 (cần `listCategories()` ở thin client — additive) |
| C4 | SSOT ⇄ impl lệch (`Tag`) | Cập nhật `03c`: đánh dấu **Tag = deferred/Future** (đồng bộ SSOT với thực tế) | QW | 🟢 (chỉ doc) |

### 🟡 Recommended (nên làm trong polish)
| # | Vấn đề | Đề xuất | Effort | Cờ |
|---|---|---|---|---|
| R1 | Category/pagination thiếu meta description | Truyền description theo template (không cần field mới) | QW | 🟢 |
| R2 | Không OG image mặc định | Thêm ảnh OG mặc định + fallback ở `Base.astro` | QW | 🟢 |
| R3 | Chưa có JSON-LD `BlogPosting` | Thêm ở detail từ DTO sẵn có | QW–M | 🟢 |
| R4 | UI-1 tràn từ-siêu-dài | `overflow-wrap`/`hyphens` trên `.prose` | QW | 🟢 |
| R5 | Không có trang 404 | `src/pages/404.astro` retro + link home | QW | 🟢 |
| R6 | `alt` không bắt buộc | Enforce `required` cho `directus_files.alt` | QW | 🟡 (schema meta) |
| R7 | Field không help note | Thêm note ngắn (slug/published_at/excerpt) | QW | 🟡 (schema meta) |
| R8 | Pagination không số trang (quy mô) | Số trang / first-last / nhảy trang | M | 🟢 (dùng PageInfo sẵn) |
| R9 | Sitemap thiếu `lastmod` | Thêm `<lastmod>` từ `published_at` | QW–M | 🟡 (cần published_at ở slug query) |
| R10 | `caption` ảnh không render | `<figure>/<figcaption>` trong `.prose` | M | 🟡 (phơi `caption` qua permission + DTO) |

### 🟢 Nice to Have
| # | Vấn đề | Đề xuất | Effort | Cờ |
|---|---|---|---|---|
| N1 | Back-link trùng ở detail | Bỏ "← Trang chủ" (đã có header) hoặc đổi thành breadcrumb | QW | 🟢 |
| N2 | Post card không hiện category | Hiện tên category trên card | QW | 🟢 |
| N3 | Không breadcrumb | Home › Category › Post (+ structured data) | M | 🟢 |
| N4 | `article:*` meta | Thêm `article:published_time`/`author` | QW | 🟢 |
| N5 | Code không highlight | Highlighter nhẹ lúc build | M | 🟢 (thêm dep — cân nhắc) |

### ⏭️ Deferred → Sprint 7 / Future (FEATURE — ngoài phạm vi polish)
Search · Archive/theo tháng · RSS/Atom · Related posts · **hệ thống Tag** (collection+M2M+trang) · **Author pages** (bio/avatar) · **Category tree** (`parent`) · **đổi font thân bài** (quyết định nhận diện + QA rộng) · syntax highlighting nếu thêm dependency.

## 4. Ước lượng theo nhóm

- **Quick Wins (gộp ~1–2 ngày):** C4, R1, R2, R4, R5, R7, N1, N2, N4 — phần lớn 🟢 (CSS/asset/meta/doc); R7 🟡 nhẹ (note).
- **Medium (mỗi mục ~1–2 ngày):** C1 (Flow), C2/C3 (slug/nav), R3 (JSON-LD), R8 (pagination số trang), R9/R10 (lastmod/caption — 🟡 chạm hợp đồng), N3 (breadcrumb).
- **Large (→ Sprint 7/Future):** toàn bộ mục Deferred §3.

## 5. Đề xuất backlog Sprint 6.5 (polish-only)

**Nguyên tắc:** ưu tiên item **🟢 không chạm hợp đồng** + giá trị dùng-hằng-ngày cao; item **🟡** gom riêng để Product cân nhắc (vì phá "đóng băng" đã giữ suốt S3–S6).

**Đợt A — Quick Wins 🟢 (đề xuất làm trước, rủi ro thấp):**
`C4` đồng bộ SSOT Tag · `R4` UI-1 overflow · `R5` 404 · `R1` meta description category/pagination · `R2` OG image mặc định · `R3` JSON-LD · `N1` bỏ back-link trùng · `N2` category trên card · `N4` article meta.

**Đợt B — Editor UX (giá trị cao cho "viết hằng ngày"):**
`C1` Flow auto `published_at` (🟢) · `C2` slug note/slugify (🟡) · `R7` field notes (🟡) · `R6` alt required (🟡).

**Đợt C — Content readiness (dùng dữ liệu sẵn có):**
`C3` điều hướng category (🟡 additive) · `R8` pagination số trang (🟢) · `N3` breadcrumb (🟢).

**Đợt D — 🟡 chạm hợp đồng, cân nhắc kỹ:**
`R9` sitemap lastmod · `R10` caption figcaption — cần mở rộng Public field allowlist + DTO (permissions/`types.ts`/`directus.ts`). **Chỉ làm nếu Product chấp nhận nới "đóng băng"** (bổ sung additive, không phá tương thích).

**Không đưa vào Sprint 6.5:** mọi mục Deferred §3 (feature) + đổi font thân bài (chờ quyết định nhận diện).

## 6. Ranh giới & lưu ý

- **Không** đổi kiến trúc / render / permission-rule (chỉ có thể **nới field allowlist additive** ở Đợt D nếu Product đồng ý).
- **Font thân bài** = quyết định nhận diện thị giác → **Product chốt**, không tự đổi (task cấm redesign).
- **Tag / Search / Archive** là feature → **không** làm ở polish sprint; C4 chỉ **đồng bộ tài liệu** SSOT cho trung thực.
- Mọi thay đổi field meta/permission cần **re-export `schema.yaml`** / cập nhật `apply-permissions.sh` (giữ reproducible) — không sửa tay trên UI.

---

> 🛑 **Chờ Product review.** Sau khi Product chọn item + đợt (đặc biệt duyệt/loại các mục 🟡 Đợt B–D), tôi **commit report + backlog đã chốt** rồi mới bắt đầu implement theo sprint-gated (mỗi thay đổi 1 lý do, mỗi phase 1 commit, dừng chờ review).
