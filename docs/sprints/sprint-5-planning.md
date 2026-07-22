# 🧭 Sprint 5 — Planning & Backlog Review

> **Trạng thái:** 🟠 **Tài liệu planning — chờ Product review** (không code, không commit) · **Ngày:** 2026-07-22
> 🎯 **Mục đích:** rà soát trạng thái dự án sau Sprint 4, tổng hợp backlog, đề xuất roadmap các Sprint tới và đánh giá đường tới MVP.
> 🔗 [01a-mvp-scope](../01a-mvp-scope.md) · [02-roadmap](../02-roadmap.md) (M2✓ → M3 Launch) · [14-quality-gates](../14-quality-gates.md) · Completion reports [S2](./sprint-2-completion-report.md)/[S3](./sprint-3-completion-report.md)/[S4](./sprint-4-completion-report.md).

---

## 1. Current Project Status

### ✅ Đã hoàn thành (Sprint 0–4)
| Sprint | Kết quả | Mốc |
|---|---|---|
| 0 | Nền tảng tài liệu (LÕI/RÌA, Principles, ADR, MVP Scope) | M0 |
| 1 | Hạ tầng local (Docker: Postgres 16.8 + Directus 11.3.5 + Astro/Node22), plumbing | M1 |
| 2 | Vertical slice MVP nội dung: content model (schema snapshot) · permissions Admin/Editor/Public (gate `published`+`$NOW`) · thin client + DTO (03d) · list/detail/category · SSG | **M2** |
| 3 | Reader Experience: design tokens · layout shell · PostCard · `.prose` reading · responsive + **a11y baseline** · cross-page consistency | — |
| 4 | Fixture Framework (độc lập Directus, deterministic+seed, profiles, sets) + dogfooding ~100 bài + edge/stress; build 111 trang/5.77s | — |

### 🟢 Đã ổn định
- Stack local **tái lập** (schema snapshot + permissions script + seed + fixtures), idempotent.
- **Content model** (Post/Author/Category/Media) & **API Contract 03d** đóng băng, ổn định.
- **Decoupling** Reader↔Directus qua thin client + DTO (P3).
- **Bảo mật đọc**: Public chỉ thấy `published` + field allowlist; draft ẩn (đã verify quy mô).
- **Reader** (home/detail/category): render, responsive, a11y baseline, `.prose` chịu được ca cực đoan.

### ❌ Còn thiếu để đạt MVP (theo [01a §2-3](../01a-mvp-scope.md) + M3 Launch)
- **Public deployment + HTTPS/TLS** — hiện chỉ chạy local (gap lớn nhất).
- **Rebuild-on-publish** — SSG ở prod không tự cập nhật khi publish (nội dung mới trễ).
- **Pagination UI** — reader chỉ tới được **trang đầu (≤50 bài)**; ≥50 bài là **không đọc hết** (vi phạm mục tiêu "đọc mọi bài published").
- **SEO cơ bản** — mới có `<title>`/meta description; **thiếu** OpenGraph/Twitter card, canonical, `sitemap.xml`, `robots.txt`.
- **Hardening**: sanitize HTML markdown (XSS), pin `pnpm-lock.yaml` + `Dockerfile` (build tái lập), security headers.
- **Core Web Vitals** đo trên prod; **backup** content store; **DoD/Launch checklist** ([14](../14-quality-gates.md)).

## 2. Remaining Backlog (sau Sprint 4)

| Loại | Hạng mục | Nguồn | MVP? |
|---|---|---|---|
| **Functional** | Pagination UI (home + category) | B4; dogfooding phơi bày | ✅ Must (ở quy mô) |
| | Rebuild-on-publish (webhook → CI/CD) | B8; ADR-0006 | ✅ Must (prod) |
| | Editor Experience (guidelines/ergonomics) | đã gác S4 | 🟡 Nice (Directus admin đã đủ để publish) |
| | Tag · Search · RSS · Scheduled · Comments · i18n | [01a §4-5](../01a-mvp-scope.md) | 🔮 Future |
| **UX/UI** | **UI-1**: từ-siêu-dài tràn ngang (`overflow-wrap`) | [S4 finding](./sprint-4-completion-report.md) | 🟡 nhỏ |
| | Paper materiality (grain/crease procedural) | Design Backlog (S4) | 🟡 Nice |
| | Thumbnail layout homepage · category menu động | đã hoãn (PO/API) | 🟡 Nice |
| **Performance** | Tối ưu ảnh (srcset/transform/cover) | B6 | 🟡 perf |
| | Core Web Vitals đo prod | NFR M3 | ✅ Must |
| | Build reproducible (lockfile + Dockerfile web) | B9 (nợ S1) | ✅ (technical) |
| **SEO** | OpenGraph/Twitter · canonical · sitemap.xml · robots.txt · structured data | NFR M3 | ✅ Must (cơ bản) |
| **CMS/Operations** | Deployment topology + reverse proxy + **TLS/HTTPS** | M3 "Public" | ✅ Must |
| | Sanitize HTML (XSS) · security headers · secrets rotation | [12-security](../12-security.md) | ✅ (security) |
| | Backup/restore `pgdata` · monitoring/observability | [13-operations](../13-operations.md) | ✅ backup Must / monitor sau |
| | Media organization · editor onboarding docs | S4 backlog | 🟡 Nice |
| **Nice-to-have** | Dark mode · related posts · analytics · full-text search | [01a §5](../01a-mvp-scope.md) | 🔮 Future |

## 3. Sprint Recommendation (theo ưu tiên tới MVP)

> 📌 **Roadmap Principle (Product):**
> *Every remaining Sprint must move the project measurably closer to Public MVP. Features that do not improve launch readiness should remain outside the MVP roadmap.*
> *(VI: Mọi Sprint còn lại phải đưa dự án **tiến gần Public MVP một cách đo lường được**; tính năng không cải thiện độ sẵn sàng ra mắt → **ngoài** roadmap MVP.)*

> Đích: **Public MVP** (M3 Launch). Product ưu tiên **public sớm** để bắt đầu **dogfooding thật** → **Deployment trước Hardening sâu**. Rủi ro thấp vì: nội dung do **Editor tin cậy** (XSS thấp), **build-repro tối thiểu + TLS** gộp vào Sprint Deployment, hardening sâu **theo ngay sau** (Sprint 7).

### Sprint 5 — Reader Completeness (Pagination + SEO baseline)
- **Objective:** hoàn thiện reader để đạt MVP-reader: đọc được **mọi** bài + link chia sẻ đẹp + index được.
- **Scope:** Pagination UI (home + category; dùng `page/pageSize` sẵn có [03d §4], `getStaticPaths` cho trang N) · SEO cơ bản (OG/Twitter card, canonical, `sitemap.xml`, `robots.txt`). **Presentation-layer**; dùng DTO/hợp đồng sẵn có — **không** đổi Content Model/API.
- **Deliverables:** trang phân trang list/category; `sitemap.xml` + `robots.txt`; meta OG/Twitter mỗi trang.
- **Acceptance Criteria:** reader tới được **mọi bài published** qua phân trang; sitemap liệt kê đủ published; OG card đúng (title/excerpt/cover); a11y/responsive **không hồi quy**; không đổi 03c/03d.
- **Size:** 🟡 **Vừa**.

### Sprint 6 — Deployment & Public MVP  ⇒ **Public MVP** 🚀
- **Objective:** đưa site **public qua HTTPS** + tự cập nhật khi publish → **Public MVP** để bắt đầu **dogfooding thật** càng sớm càng tốt.
- **Scope:** deploy topology (self-host first, [ADR-0005]) · reverse proxy + **TLS** · **rebuild-on-publish** (webhook → CI/CD) · **build-repro tối thiểu để deploy** (pin `pnpm-lock.yaml` + `Dockerfile` web) · **backup** `pgdata` · Launch checklist cơ bản ([14](../14-quality-gates.md)).
- **Deliverables:** site public HTTPS; pipeline rebuild-on-publish; build web tái lập cho deploy; backup/restore.
- **Acceptance Criteria:** truy cập public qua HTTPS; **publish 1 bài → xuất hiện sau rebuild**; web build **từ lockfile** (reproducible); backup chạy & restore thử → **⇒ Public MVP đạt** (dogfooding thật bắt đầu; nội dung do Editor tin cậy).
- **Size:** 🔴 **Lớn**.

### Sprint 7 — Hardening / Production Readiness (sau Public MVP)
- **Objective:** củng cố **an toàn & vận hành** sau khi public — chuẩn bị mở rộng người dùng/tác giả.
- **Scope:** **sanitize HTML** markdown (chống XSS) · security headers · secrets rotation · **Core Web Vitals** đo & tối ưu (ảnh srcset) · **light CI/test** (dùng fixtures) · monitoring/observability cơ bản.
- **Deliverables:** sanitizer trong render pipeline; security headers; CWV report + tối ưu ảnh; CI test; giám sát cơ bản.
- **Acceptance Criteria:** markdown độc hại bị vô hiệu (test XSS); headers có mặt; **CWV đạt ngưỡng**; CI chạy trên fixtures; giám sát cơ bản hoạt động.
- **Size:** 🟡 **Vừa**.

> **Ngoài đường MVP (làm khi cần / cơ hội):** *Editor Experience* (onboard editor, guidelines — khi có nội dung thật) · *Visual Polish* (UI-1 + paper materiality) · *Future* (Tag/Search/RSS/i18n…).

## 4. MVP Assessment

- **~2 Sprint tới Public MVP:** Sprint 5 (reader completeness) → **Sprint 6 (Deployment & Public MVP)**. Sprint 7 (Hardening) là **production-readiness follow-up ngay sau** khi đã public.
- **Tiêu chí "Public MVP" (đủ để public + bắt đầu dogfooding thật):**
  1. **Public qua HTTPS/TLS**; cấu hình qua env; không secret trong repo; **build web tái lập**.
  2. Reader: list **phân trang** + detail + category; **mọi bài published tới được**; draft ẩn.
  3. **SEO cơ bản**: title/meta/OG/canonical/sitemap/robots.
  4. **a11y baseline** (✓) + **responsive** (✓).
  5. Editor **soạn+đính ảnh+xuất bản** (✓ Directus); **nội dung mới hiện sau rebuild-on-publish**.
  6. **Backup** content store + restore thử.
  7. Nội dung do **Editor tin cậy** (chưa mở tác giả không tin cậy).
- **Production-readiness bổ sung (Sprint 7, sau Public MVP):** sanitize HTML · security headers · **Core Web Vitals đạt ngưỡng** · CI/test · monitoring — cần **trước khi mở rộng công khai / nhận tác giả không tin cậy**.

## 5. Risk Review

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **SSG stale** — publish không hiện tới khi rebuild | Cao | Rebuild-on-publish (**Sprint 6**); dev vẫn live |
| **Pagination gap** — reader không đọc hết ở quy mô | Cao | Sprint 5 (pagination UI) |
| **Public trước hardening sâu** (deploy trước sanitize/headers) | Trung | Chấp nhận cho Public MVP: **Editor tin cậy** (XSS thấp), TLS + build-repro ở Sprint 6, hardening **theo ngay** Sprint 7 |
| **XSS** markdown chưa sanitize (nếu mở tác giả không tin cậy) | Trung | Sanitize **Sprint 7**; Public MVP chỉ Editor tin cậy → hoãn được |
| **Build không tái lập** (thiếu lockfile/Dockerfile web) | Trung | Pin ở **Sprint 6** (điều kiện để deploy) — nợ từ S1 |
| **Deployment phức tạp/chi phí** | Trung | Self-host-first ([ADR-0005]); giữ đơn giản |
| **Không có test/CI tự động** | Trung | Light CI dùng fixtures (Sprint 6); fixtures đã sẵn |
| **CWV/ảnh chưa tối ưu** | Thấp–Trung | Đo prod (Sprint 7); tối ưu ảnh (perf backlog) |
| **Scope creep** sang Future (Tag/Search…) làm trễ MVP | Trung | Kỷ luật MVP Scope ([01a](../01a-mvp-scope.md)) |
| **UI-1** từ-siêu-dài tràn | Thấp | Visual Polish (1 dòng CSS) |
| Ops: **backup/monitor** chưa có | Trung | Backup (Sprint 7); monitor sau MVP |

---

> 🛑 **Tài liệu planning — chưa code, chưa commit, chưa bắt đầu Sprint 5.**
> Roadmap đã cập nhật theo Product: **5 Reader Completeness → 6 Deployment & Public MVP → 7 Hardening**; thêm **Roadmap Principle** (§3). Chờ Product **phê duyệt roadmap** rồi tôi soạn **Sprint 5 Implementation Plan** (Reader Completeness — Pagination + SEO baseline), dừng chờ duyệt như thường lệ.
