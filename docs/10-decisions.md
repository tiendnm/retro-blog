# 10 — Decisions (ADR Index)

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** Ghi nhận *tại sao* các quyết định kiến trúc quan trọng được đưa ra, theo thời gian. Là "bộ nhớ dài hạn" giúp người mới hiểu bối cảnh và tránh lật lại quyết định cũ vô cớ.
> 🔗 **Liên quan:** [adr/](./adr/) · [adr/0000-adr-template](./adr/0000-adr-template.md) · [03a-architecture-principles](./03a-architecture-principles.md) · [10a-tech-stack](./10a-tech-stack.md)

---

## 1. Chúng ta ghi nhận quyết định thế nào?

Mỗi quyết định kiến trúc quan trọng được ghi thành một **ADR** — file riêng, đánh số tăng dần, **append-only**. Mẫu: [`adr/0000-adr-template.md`](./adr/0000-adr-template.md); hướng dẫn: [`adr/README.md`](./adr/README.md).

> **Governance G1:** mỗi ADR **bắt buộc** khai báo Nguyên tắc tuân thủ ([03a](./03a-architecture-principles.md)), Trade-off, và Chi phí migration. Công nghệ đã chốt được tổng hợp ở [Tech Stack](./10a-tech-stack.md).

## 2. Khi nào cần một ADR?

Tạo ADR khi quyết định: khó đảo ngược, ảnh hưởng nhiều phần, liên quan đánh đổi đáng kể, hoặc người mới sẽ hỏi "tại sao?". Ví dụ: chọn framework, CMS, database, chiến lược render, cơ chế xác thực.

## 3. Vòng đời trạng thái ADR

`Proposed` → `Accepted` → (khi bị thay thế) `Superseded by ADR-NNNN` · hoặc `Deprecated`.

## 4. Danh mục ADR (Index)

| # | Tiêu đề | Vai trò/Chủ đề | Principle chính | Trạng thái |
|---|---|---|---|---|
| [0001](./adr/0001-record-architecture-decisions.md) | Ghi nhận quyết định bằng ADR | Governance | G1/G2, P7 | Proposed |
| [0002](./adr/0002-use-astro-site-generator.md) | Dùng Astro | Presentation/Site | P1,P3,P5 | **Accepted** |
| [0003](./adr/0003-use-directus-headless-cms.md) | Dùng Directus | Headless Content Service | P1,P2,P4 | **Accepted** |
| [0004](./adr/0004-use-postgresql-content-store.md) | Dùng PostgreSQL | Content Store | P4,P6 | **Accepted** |
| [0005](./adr/0005-use-docker-packaging.md) | Dùng Docker | Đóng gói/Runtime | P4,P5 | **Accepted** |
| [0006](./adr/0006-render-strategy.md) | **SSG static-first** | Render strategy | P3,P4,P5 | **Accepted** |
| [0007](./adr/0007-reverse-proxy-and-tls.md) | **Caddy** (reverse proxy + auto-TLS) | Edge / Ingress / TLS | P4,P5 | **Accepted** |
| [0008](./adr/0008-rebuild-on-publish.md) | **Rebuild-on-publish** (Flow→webhook→script→atomic swap) | Content release pipeline | P3,P4,P5 | **Accepted** |

> ℹ️ ADR 0002–0005 được ratify ở Sprint 0 close-out (2026-07-21). ADR-0001 (process) vẫn Proposed — có thể ratify ở đầu Sprint 1. ADR-0006 ratify Sprint 2 Phase 0. **ADR-0007/0008 ratify Sprint 6 Phase 0 (2026-07-23, Product chốt).**

## 5. Nhật ký quyết định nhẹ (Lightweight Decision Log)

> Cho quyết định nhỏ chưa xứng một ADR đầy đủ.

| Ngày | Quyết định | Lý do ngắn | Người quyết |
|---|---|---|---|
| 2026-07-21 | Docs theo cấu trúc phẳng `NN-` mở rộng | Tôn trọng skeleton sẵn có, phù hợp quy mô blog | Team |
| 2026-07-21 | Chèn tài liệu mới bằng hậu tố chữ (`03a`...), không renumber | Giữ đánh số ổn định | Team |
| 2026-07-21 | Tách tầng LÕI/RÌA; kiến trúc mô tả theo ports & adapters | Tránh lock-in, bảo trì dài hạn | Team |
| 2026-07-21 | Đóng Sprint 0; ratify stack ADR 0002–0005 | Kết thúc Sprint 0, sẵn sàng Sprint 1 | Tech Lead |
| 2026-07-21 | MVP Scope: **Category → Must Have**; **Tag** giữ Nice To Have | Category định hình information architecture, navigation & khả năng mở rộng nội dung; Tag bổ sung sau | Tech Lead |
| 2026-07-21 | Làm rõ phân quyền MVP = **chỉ Admin + Editor** (loại frontend auth, user account, permission phức tạp, custom RBAC) | Giữ MVP tối giản, chống scope creep | Tech Lead |
| 2026-07-21 | **[S1] Toolchain:** pnpm 10 (workspace); **Node 22 LTS** (`engines >=22`, `.nvmrc` 22) — Tech Lead xác nhận | pnpm hợp monorepo; web (Astro) chạy trong container Node 22 → host không cần Node 22 để `docker compose up` (host hiện 20.19.4) | Sprint 1 |
| 2026-07-21 | **[S1] Versions:** Astro 5.x · Directus 11.x · PostgreSQL 16 · Docker Engine 29/Compose v2 | Bản ổn định/LTS hiện hành, self-host tốt | Sprint 1 |
| 2026-07-21 | **[S1] Docker Compose:** 1 file root, 3 service (postgres/directus/web) + network + named volumes | Đơn giản, local-friendly (Plan §4) | Sprint 1 |
| 2026-07-21 | **[S1] Khởi tạo git** (`git init -b main`); thêm `!.env.example` để override `~/.gitignore_global` (`.env.*`) | Nền tảng repo; giữ track file template | Sprint 1 |
| 2026-07-21 | **[S1-P2] Image pin (đã verify):** `postgres:16.8-alpine` · `directus/directus:11.3.5` · web `node:22.12.0-alpine` | Pin cứng (không `latest`); đã pull & smoke test đạt (2 service healthy, Directus↔PG OK) | Sprint 1 |
| 2026-07-21 | **[S1-P2] Compose:** postgres không expose host (chỉ nội bộ); Directus `:8055`; web gated sau profile `app` (chưa scaffold Astro) | Self-host an toàn; web bật ở Phase 3 | Sprint 1 |
| 2026-07-21 | **[S1-P3] Scaffold Astro** `apps/web` (minimal, Astro 5.x, `server.host=true`); web bỏ profile → vào default stack; `node_modules` ở volume `web_node_modules` (linux, tách host win32) | Full stack chạy bằng `docker compose up`. Chưa pin lockfile — container cài fresh; Dockerfile+lockfile để hardening sau | Sprint 1 |
| 2026-07-21 | **[S1-P3] Plumbing test:** `index.astro` fetch server-side `DIRECTUS_INTERNAL_URL=http://directus:8055` → render `/server/health` | Verify Browser→Astro→Directus→PostgreSQL, KHÔNG tạo content model | Sprint 1 |
| 2026-07-21 | **[S2-P0] ADR-0006:** render = **SSG static-first** (giữ ADR-0002); Sprint 2 KHÔNG webhook rebuild, CI/CD rebuild = future | Hiệu năng, self-host/free-cloud, phù hợp blog | Tech Lead |
| 2026-07-21 | **[S2-P0] Hoàn thiện API Contract [03d]** (PostDetail, phân trang/lọc/sắp xếp, error model) — dẫn xuất 03b/03c/03e, **KHÔNG tạo contract mới** | Cần cho API binding; giữ SSOT | Tech Lead |
| 2026-07-21 | **[S2-P0] Quyết định nhỏ:** client = thin fetch map DTO 03d (P3); content model as-code = Directus schema snapshot; Media = `directus_files` + alt/caption (không collection riêng) | Decoupling, reproducibility, đơn giản | Sprint 2 |
| 2026-07-21 | **[S2-P2] Public gate = `status=published` AND `published_at ≤ $NOW`** (dùng biến động `$NOW` của Directus, không job nền) | Directus hỗ trợ thuận tiện → thực thi được cả "đã publish" lẫn "đã tới giờ" (lịch phát hành cơ bản) ngay trong rule | Tech Lead |
| 2026-07-21 | **[S2-P2] Phân quyền tái lập bằng script** `apply-permissions.sh` (`pnpm permissions:apply`), **không** thao tác thủ công | Schema snapshot KHÔNG bắt roles/policies/permissions → cần artifact tái lập riêng; script idempotent | Tech Lead |
| 2026-07-21 | **[S2-P2] Editor = `app_access` + CRUD 4 content collection**; **không** `admin_access`, không quản trị user/role/policy | Least privilege; tách biên tập khỏi quản trị hệ thống | Sprint 2 |
| 2026-07-21 | **[S2-P2] curl phải dùng `-g/--globoff`** trong script (fix bug: `[ ]` của `filter[...]` bị curl hiểu là URL-globbing → mọi idempotency check trả rỗng, tạo trùng role) | Đảm bảo script chạy đúng & idempotent trên Git Bash/Windows | Sprint 2 |
| 2026-07-21 | **[S2-P2] Public đọc toàn bộ `authors`/`categories`/`directus_files`** (không lọc) | Dữ liệu tham chiếu để render bài, không nhạy cảm; đơn giản cho MVP | Sprint 2 |
| 2026-07-21 | **[S2-P3] Thin fetch client** `apps/web/src/lib/directus.ts` là tầng DUY NHẤT gọi Directus; page/component chỉ nhận DTO ([03d](./03d-api-contract.md)), không chạm JSON Directus | Decoupling (P3): đổi CMS chỉ sửa client; UI ổn định | Tech Lead |
| 2026-07-21 | **[S2-P3] Client fetch vai Public (KHÔNG token)** → permission enforce published + field allowlist; không nhúng secret | Bảo mật ở tầng permission, không ở client; least privilege | Sprint 2 |
| 2026-07-21 | **[S2-P3] Siết Public field allowlist** (bỏ `fields:['*']`) — field nội bộ tương lai không tự lộ ra Public API | Yêu cầu bảo mật Phase 3; defense-in-depth | Tech Lead |
| 2026-07-21 | **[S2-P3] Render Markdown body bằng `marked` + `set:html`**; sanitize HTML để hardening sau | Editor là nguồn tin cậy (MVP, không nhận input công khai); `marked` gọn, đủ cho blog | Sprint 2 |
| 2026-07-21 | **[S2-P3] Render = SSG static** (`output` mặc định) + `getStaticPaths`, KHÔNG adapter | Đúng ADR-0006; blog tĩnh, không cần server runtime | Sprint 2 |
| 2026-07-22 | **[S3] Sprint 3 = Reader Experience — CHỈ Presentation**, không mở rộng chức năng; đóng băng 03d/03c/03e + thin client `directus.ts`/`types.ts` | Nâng trải nghiệm đọc trước Launch; chống scope creep | Tech Lead |
| 2026-07-22 | **[S3-P0] Design Foundation:** CSS tokens (typography scale · spacing · container · color AA) ở `apps/web/src/styles/global.css`; **KHÔNG khóa phong cách thị giác cuối** | Dựng nền nhất quán; retro style hoàn thiện dần sau review giao diện thực tế | Tech Lead |
| 2026-07-22 | **[S3-P0] Nav tĩnh Brand+Home** (không menu category động); **layout thumbnail homepage hoãn** (chỉ chuẩn bị component ảnh) — quyết sau với Product Owner | Giữ presentation-only; không thêm operation vào 03d/thin client | Tech Lead |
| 2026-07-22 | **[S3-P1] Layout Shell:** tách `Header.astro` (Brand+Home, gọn) + `Footer.astro` (nhẹ); `Base.astro` = skip-link → Header → `main#main` → Footer (landmark ngữ nghĩa) | Khung nhất quán, content-first; nền a11y (skip-link/landmark) | Sprint 3 |
| 2026-07-22 | **[S3-P2] Post Card = Option B** (Product Review): thumbnail HỖ TRỢ nhỏ-trái; bài **không cover → text-only, KHÔNG placeholder/ảnh mặc định** (flex: body là con duy nhất → full-width); `CoverImage.astro` render ảnh nếu có | Content-first; card cân đối kể cả khi bỏ hết thumbnail; không đổi API/DTO | Product Review |
| 2026-07-22 | **[S3-P3] Reading experience:** toàn bộ HTML markdown style TẬP TRUNG qua **`.prose`** (heading/rhythm/list/blockquote/code/table/hr/img), không rải rác theo page; detail bọc `.post` = **reading column** (`--reading-width`); cover detail qua `CoverImage` (alt thật) | Trải nghiệm đọc nhất quán, dễ bảo trì; content-first; code/table cuộn ngang không vỡ layout | Sprint 3 |
| 2026-07-22 | **[S3-P4] Cross-page consistency:** đồng bộ empty-state (category), back-link `.back-link` (category+detail), margin `h1` mọi trang; audit responsive/a11y (overflow NO @390, heading order, skip-link, AA). **Sprint 3 đóng** | Site cảm nhận là một hệ thống thống nhất; đạt a11y baseline + responsive; không mở rộng scope | Sprint 3 |
| 2026-07-22 | **[S4] Đổi hướng:** gác Editor Experience sang backlog; Sprint 4 = **Content Fixture & Dogfooding** (fixture framework + dữ liệu để dùng thật sớm) | Quyết định editor chính xác hơn khi có nội dung thật; ưu tiên dogfooding | Product |
| 2026-07-22 | **[S4-P0] Fixture Framework độc lập Directus** (ports & adapters): Generator + Content Model fixture trung lập; **chỉ Loader** phụ thuộc Directus | Tái dùng nếu đổi backend; tách rõ trách nhiệm | Product |
| 2026-07-22 | **[S4-P0] Providers mở** — content `static/ai/future`, cover `none/manual/ai` (mặc định static+none); **không** hardcode AI/SVG | Không lệ thuộc một cách sinh nội dung/ảnh; dễ thay | Product |
| 2026-07-22 | **[S4-P0] Tái lập:** slug **deterministic + ổn định** (manifest là nguồn sự thật, regenerate giữ slug theo key); generator nhận `--seed`; cấm `Date.now/Math.random` | Regression/screenshot test không vỡ khi regenerate | Product |
| 2026-07-22 | **[S4-P0] Tách set** `normal/edge/stress` + **profiles** `small/medium/large/stress`; **generate = command độc lập**; Batch 1 `normal` ~10 (kiểm chứng framework) | Kết quả test rõ ràng; hợp CI/local; framework trước, content sau | Product |
| 2026-07-22 | **[S4-P0] Taxonomy theo đối tượng** (cpu/mainboard/gpu/memory/storage/os/software/sound/peripheral/networking); Review/Tutorial/Build Log/History = *article type* (không mô hình hoá — content model đóng băng) | Category phản ánh chủ thể phần cứng/phần mềm, sát blog thật | Product |
| 2026-07-22 | **[S4-P4] Dogfooding verify:** build **111 trang / 5.77s** (perf baseline); overflow @390&desktop OK mọi trang **trừ** `edge-long-word`; usability edge/stress đạt. **Sprint 4 đóng** | Xác minh sản phẩm ở quy mô ~100 bài + ca cực đoan | Product |
| 2026-07-22 | **[S4-P4] Finding UI-1** (từ-siêu-dài tràn ngang) → **Visual Backlog**, KHÔNG sửa Reader trong Sprint 4 (không phải lỗi hỏng chức năng); fix tương lai `overflow-wrap` | Theo quy tắc Product: chỉ sửa Reader nếu lỗi nghiêm trọng | Product |
| 2026-07-22 | **[S5] Roadmap Principle:** mọi Sprint còn lại phải **tiến gần Public MVP đo lường được**; feature không cải thiện launch-readiness → ngoài roadmap MVP. Thứ tự: 5 Reader → 6 **Deployment & Public MVP** → 7 Hardening | Public sớm để dogfooding thật (chấp nhận vì Editor tin cậy) | Product |
| 2026-07-22 | **[S5-P0] Route pagination = `/page/[page]`** (home) + `/category/[slug]/page/[page]`; giữ trang-1 `/` & `/category/[slug]`. **KHÔNG** dùng root/nested catch-all `[...page]` | Tránh chiếm namespace gốc, an toàn với route tương lai (`/about`, `/search`…) | Sprint 5 |
| 2026-07-22 | **[S5-P0] Sitemap policy = CHỈ canonical content URLs** (home + post detail + category trang-1); **loại pagination URLs**; hiện thực bằng **endpoint tự viết** (`sitemap.xml`) qua `getAllPublishedPostSlugs`/`getAllCategorySlugs` sẵn có — **không** thêm dependency | Pagination là điều hướng, không canonical; tránh loãng crawl; kiểm soát chính xác, không cần `@astrojs/sitemap` | Sprint 5 |
| 2026-07-22 | **[S5-P0] Xác nhận:** `pageSize=10`; site URL qua biến `PUBLIC_SITE_URL` (tạm dev, chốt domain thật ở Sprint 6); **JSON-LD = stretch** (không vào AC); **UI-1 giữ Visual Backlog** (không xử lý S5) | Theo điều chỉnh Product; giữ scope | Product |
| 2026-07-22 | **[S5-P2] Canonical = SELF-REFERENCING**: mỗi trang (kể cả pagination `/page/N`) canonical trỏ CHÍNH URL của nó, **KHÔNG** trỏ về trang 1 | Trang pagination là danh sách riêng, cần index được để độc giả tới mọi bài (khớp reach-all P1); rel=prev/next chỉ quan hệ. Chuẩn Google hiện hành | Sprint 5 |
| 2026-07-22 | **[S5-P2] `sitemap.xml` + `robots.txt` = endpoint Astro** (không file tĩnh `public/`), địa chỉ tuyệt đối lấy từ `Astro.site` (= `PUBLIC_SITE_URL`) | Nguồn sự thật DUY NHẤT cho URL tuyệt đối (canonical/OG/sitemap/robots); Sprint 6 đổi domain chỉ sửa 1 biến | Sprint 5 |
| 2026-07-22 | **[S5-P2] SEO tái dùng thin client** (`getAllPublishedPostSlugs`/`getAllCategorySlugs`); OG/Twitter/canonical thêm ở `Base.astro`; `og:image` từ `cover` khi có | Không đổi Content Model/API/DTO/hợp đồng (`03c/03d/03e/types.ts/directus.ts` không trong diff); đúng ranh giới S5 | Sprint 5 |
| 2026-07-23 | **[S6-P0] Sprint 6 mở HẠ TẦNG, đóng băng LÕI:** được thêm Dockerfile/compose prod/reverse proxy/rebuild/backup; **không** đổi `03c/03d/03e`, thin client/DTO, **rule** permissions, Reader (S3–S5); `docker-compose.yml` dev giữ nguyên, prod = override riêng | Sprint deployment cần chạm hạ tầng; giữ hợp đồng/LÕI ổn định | Product |
| 2026-07-23 | **[S6-P0] Kiến trúc (Recommended, chưa chốt):** self-host all-in-one Docker; **web = static build served by reverse proxy** (không Node runtime cho site); **domain topology subdomain tách** `blog.`/`cms.` — chi tiết [08-deployment §2](./08-deployment.md) | Đơn giản self-host (ADR-0005), SSG (ADR-0006), CORS/PUBLIC_URL rõ; **chờ Product xác nhận domain** | Sprint 6 |
| 2026-07-23 | **[S6-P0] Reverse proxy = CANDIDATE:** Caddy · Traefik · Nginx — ma trận đánh đổi [08 §7](./08-deployment.md) (nghiêng Caddy); **ADR-0007 ghi SAU khi Product chốt** ở review Phase 0 | Giữ candidate theo yêu cầu Product; không chốt sớm | Product |
| 2026-07-23 | **[S6-P0] Rebuild-on-publish = Recommended:** Directus Flow → **webhook → shell script/internal utility → atomic swap** (on-server, tối giản); **không** microservice trừ khi có lý do rõ ràng; **không** phụ thuộc GitHub Actions ở MVP; **ADR-0008 ghi SAU khi chốt** | Tối giản theo yêu cầu Product; đủ cho MVP | Product |
| 2026-07-23 | **[S6-P0] Backup scope:** database + uploads + config + env — **KHÔNG** backup `dist/` (tái sinh từ build). **Rollback = atomic swap** về static build trước (vào Launch Checklist). **CI test/hardening/monitoring → Sprint 7** | Backup đúng dữ liệu không tái tạo được; rollback nhanh; giữ scope MVP | Product |
| 2026-07-23 | **[S6-P0 CHỐT] Product chốt** → **ADR-0007 Caddy** (auto-TLS Let's Encrypt/ACME; static phục vụ trực tiếp bởi Caddy; Directus qua `cms.<domain>`) + **ADR-0008** (Directus Flow→Webhook→Shell script→Atomic swap; không microservice). **Domain topology: `retro.<domain>` + `cms.<domain>`** (domain thật cung cấp ở Phase 2) | Kết thúc candidate; ratify 2 ADR | Product |
| 2026-07-23 | **[S6-P1] Web build tái lập:** `apps/web/Dockerfile` (build-runner: `pnpm install --frozen-lockfile`; **`astro build` chạy lúc runtime** — không bake nội dung) + `.dockerignore`. **Verify: 2 lần build cho `dist` byte-identical** (aggregate sha256 khớp, 123 trang/126 file) | Chống drift deps; nội dung động tách khỏi image (khớp ADR-0008); reproducible theo tiêu chí S6 | Sprint 6 |
