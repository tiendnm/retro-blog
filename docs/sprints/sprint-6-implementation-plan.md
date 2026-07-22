# 🚀 Sprint 6 — Implementation Plan (Deployment & Public MVP)

> **Trạng thái:** 🟠 **Tài liệu planning — chờ Product review** (không code, không commit) · **Ngày:** 2026-07-22 · **Owner:** _(chưa gán)_
> 🎯 **Mục tiêu Sprint 6:** đưa site **public qua HTTPS** + **tự cập nhật khi publish** + **build tái lập** + **backup có kiểm chứng** → đạt **Public MVP** 🚀 (bắt đầu dogfooding thật).
> 🔗 **Nguồn:** [Sprint 5 Planning §3 (Sprint 6) + §4 MVP](./sprint-5-planning.md) · [02-roadmap M3 Launch](../02-roadmap.md) · [ADR-0005 Docker](../adr/0005-use-docker-packaging.md) · [ADR-0006 SSG](../adr/0006-render-strategy.md) · [08-deployment](../08-deployment.md) · [12-security](../12-security.md) · [13-operations](../13-operations.md) · [14-quality-gates](../14-quality-gates.md).

---

> 📌 **Roadmap Principle (Product):** mọi Sprint còn lại phải **tiến gần Public MVP đo lường được**. Sprint 6 là **mốc Launch** — mọi hạng mục ở đây là điều kiện *đủ* để public + dogfooding thật (đúng tiêu chí "Public MVP" [Planning §4](./sprint-5-planning.md)).

> 🔒 **Ranh giới (đảo chiều đóng băng có kiểm soát):**
> - Sprint 6 **được phép thay đổi HẠ TẦNG/vận hành** — đó là mục tiêu: thêm Dockerfile, reverse proxy, compose production, pipeline rebuild, backup. Các sprint Reader (S3–S5) đóng băng hạ tầng; Sprint này **mở** đúng phạm vi đó.
> - **VẪN đóng băng LÕI & hợp đồng:** Content Model ([03c](../03c-content-model.md)), API Contract ([03d](../03d-api-contract.md)), Data Model ([03e](../03e-data-model.md)), thin client (`directus.ts`) + DTO (`types.ts`), **rule** phân quyền ([apply-permissions.sh](../../services/directus/apply-permissions.sh)), schema snapshot, và **Reader** (`apps/web` pages/components/styles S3–S5). Không thêm content type/field; không đổi hành vi Reader.
> - `docker-compose.yml` (DEV) **giữ nguyên** — production dùng **file override riêng** (`docker-compose.prod.yml`) để không phá luồng dev.

## 1. Goal

Chuyển sản phẩm từ "chạy local" → **public production**:
1. **Public qua HTTPS/TLS** (reverse proxy tự động cấp chứng chỉ).
2. **Build web tái lập** (Dockerfile multi-stage + `--frozen-lockfile`) → static output cho production (không chạy dev server ở prod).
3. **Rebuild-on-publish** — Editor publish trong Directus → site static tự cập nhật (giải "SSG stale" [ADR-0006](../adr/0006-render-strategy.md)).
4. **Backup + restore drill** cho content store (`pgdata` + `directus_uploads`).
5. **Launch checklist** đạt ([14 §2.2](../14-quality-gates.md), [12 §11](../12-security.md), [08 §8](../08-deployment.md)).

## 2. Ảnh hưởng

| Khía cạnh | Ảnh hưởng |
|---|---|
| **LÕI** ([03c](../03c-content-model.md)/[03d](../03d-api-contract.md)/[03e](../03e-data-model.md)) | ❌ Không |
| **Thin client / DTO** (`directus.ts`/`types.ts`) | ❌ Không (chỉ *cấu hình* URL public qua env sẵn có: `PUBLIC_SITE_URL`, `PUBLIC_DIRECTUS_URL`, `DIRECTUS_INTERNAL_URL`) |
| **Rule phân quyền** ([apply-permissions.sh](../../services/directus/apply-permissions.sh)) | ❌ Không đổi rule (có thể cần cấu hình **CORS** Directus qua env — không phải permission rule) |
| **Reader** (`apps/web` S3–S5) | ❌ Không đổi hành vi (chỉ build production thay vì dev) |
| **Hạ tầng / Deploy / Ops** | ✅ **Có** — Dockerfile, compose prod, reverse proxy/TLS, rebuild pipeline, backup (phạm vi sprint) |
| **Docs vận hành** (08/12/13/14) | ✅ Điền phần liên quan (đang là TODO stub) |

## 3. Scope

### 3.1. Reproducible web build
- `apps/web/Dockerfile` **multi-stage**: *builder* (node 22.12 + pnpm 10.33.2, `pnpm install --frozen-lockfile` → `astro build`) → `dist/` tĩnh; *runtime* chỉ chứa static output (phục vụ bởi reverse proxy). Pin lockfile `apps/web/pnpm-lock.yaml` sẵn có.
- `.dockerignore`. Verify: build 2 lần → output ổn định; `--frozen-lockfile` chặn drift.

### 3.2. Production topology + reverse proxy + TLS
- `docker-compose.prod.yml` (override): `postgres` + `directus` + **reverse proxy** *(lựa chọn chốt ở Phase 0 — xem §5 Phase 0)* + static build artifact. Không expose Postgres; Directus/site chỉ ra ngoài **qua proxy**.
- **Reverse proxy config** (theo lựa chọn Phase 0): auto-HTTPS (Let's Encrypt/ACME). Route: **site domain → thư mục static**; **cms domain → `directus:8055`** (admin + API + assets).
- `.env.production.example`: `PUBLIC_SITE_URL`/`PUBLIC_URL`/`PUBLIC_DIRECTUS_URL` = domain thật; secrets mạnh (KEY/SECRET/DB) **không commit**; CORS Directus cho site domain.

### 3.3. Rebuild-on-publish *(tối giản — không thêm microservice nếu chưa cần)*
- **Directus Flow** (trigger `items.create/update/delete` trên `posts` + `categories`/`authors`) → **webhook** (bảo vệ bằng token) → **shell script / internal utility** chạy `astro build` (fetch từ `directus:8055` nội bộ) → **atomic swap** thư mục static reverse proxy serve. **Debounce** tránh build dồn; log kết quả.
- **KHÔNG tạo service riêng** trừ khi có **lý do rõ ràng** (vd cần queue/điều phối phức tạp) — mặc định là script/utility tối giản chạy theo webhook.
- Fallback: lệnh rebuild thủ công (runbook [13](../13-operations.md)).

### 3.4. Backup & Restore
- **Phạm vi backup:** **database** (`pg_dump` `pgdata`) · **uploads** (`directus_uploads`) · **config** (schema snapshot, `docker-compose.prod.yml`, reverse-proxy config) · **env** (secrets — lưu **an toàn, tách repo**). **KHÔNG** backup **static build artifacts** (`dist/`) — tái sinh được từ build.
- Định kỳ + retention + lưu **tách khỏi prod**; ghi **RPO/RTO** cơ bản.
- **Restore drill bắt buộc**: khôi phục vào instance sạch → verify dữ liệu ("backup chưa test = không có backup" [13 §4](../13-operations.md)).

### 3.5. Launch checklist + Rollback + Docs
- Điền [14 §2.2 DoD release](../14-quality-gates.md), [12 §11](../12-security.md), [08 §8](../08-deployment.md); cập nhật 08/12(§6 hạ tầng)/13(runbook, backup) từ TODO → thực tế; Decision Log `[S6-*]`; README.
- **Rollback (đưa vào Launch Checklist):** nếu deploy/rebuild thất bại → **khôi phục static build TRƯỚC bằng atomic swap** (giữ N bản build gần nhất; swap con trỏ về bản ổn định) → site trở lại trạng thái tốt gần nhất tức thì. Có cả rollback cấu hình/ảnh Directus qua backup (§3.4).

## 4. Out of scope (→ Sprint 7 Hardening)
- ❌ **Sanitize HTML** markdown (XSS) · **security headers** · secrets rotation → **Sprint 7** (Public MVP: nội dung do **Editor tin cậy**, rủi ro thấp — [Planning Risk](./sprint-5-planning.md)).
- ❌ **Core Web Vitals** đo & tối ưu ảnh (srcset) → Sprint 7.
- ❌ **CI/test tự động** (light CI dùng fixtures) → Sprint 7 (rebuild-on-publish ≠ CI test).
- ❌ **Monitoring/observability/alerting** → sau MVP.
- ❌ Blue-green/canary/autoscaling, multi-region, CDN nâng cao (giữ self-host đơn giản — [ADR-0005](../adr/0005-use-docker-packaging.md)).
- ❌ JSON-LD (S5 stretch), UI-1/Visual Polish, Editor Experience, Future (Tag/Search/RSS/i18n).

## 5. Phase breakdown

> Sprint-gated: mỗi phase 1 commit trên `main`, dừng chờ review. Sprint 🔴 **Lớn** — chia 5 phase.

### Phase 0 — Decisions & ADRs *(không code)*
Chốt và ghi Decision Log + ADR mới. **Một số quyết định giữ ở trạng thái _candidate_ tới khi Product xác nhận** (không chốt ngay đầu Phase 0):
- **Hosting target**: self-host Docker host (đúng ADR-0005). *(Cần Product cung cấp: máy chủ/VPS + **domain** + DNS.)* Đề xuất: 1 VPS nhỏ, all-in-one compose.
- **Reverse proxy + TLS — _Candidate_ (chưa chốt):** **Caddy** · **Traefik** · **Nginx** (+Certbot/ACME). Đánh giá đánh đổi (đơn giản cấu hình, auto-TLS, vận hành) ở Phase 0 → **ADR-0007 ghi SAU khi chốt**.
- **Domain topology — ✅ CHỐT (Product, Phase 0):** **subdomain tách** — **`retro.<domain>`** (site tĩnh) + **`cms.<domain>`** (Directus). Tách CORS/PUBLIC_URL rõ ràng. *(`<domain>` thật cung cấp ở Phase 2.)*
- **Web serving prod**: **static build → reverse proxy serve** (không Node runtime cho site).
- **Rebuild-on-publish — ưu tiên tối giản:** **webhook → shell script/internal utility → atomic swap** (on-server), **không** phụ thuộc GitHub Actions ở MVP và **không** tạo microservice trừ khi có lý do rõ ràng → **ADR-0008 ghi SAU khi chốt**.
- **Prod compose**: file override riêng; secrets prod ngoài repo; **2FA admin** khuyến nghị.
- Xác nhận: **không đổi LÕI/hợp đồng/Reader/permission-rule**. → Decision Log.

### Phase 1 — Reproducible web build
- `apps/web/Dockerfile` multi-stage + `.dockerignore`; `--frozen-lockfile`; static output.
- Verify build tái lập local (chưa deploy).

### Phase 2 — Production topology + reverse proxy + TLS
- `docker-compose.prod.yml` + **reverse-proxy config** (theo lựa chọn Phase 0) + `.env.production.example`; CORS Directus.
- Deploy (staging/domain thật) → verify **HTTPS**, site render, Directus admin/API/assets reachable, **draft vẫn ẩn**, canonical/OG/sitemap dùng **domain thật** (khớp Sprint 5).

### Phase 3 — Rebuild-on-publish
- Directus Flow + webhook (token) + rebuild service (atomic swap, debounce).
- Verify **AC chính**: publish 1 bài → sau rebuild bài xuất hiện public; unpublish → biến mất.

### Phase 4 — Backup/restore + Launch checklist + Completion
- Script backup (database + uploads + config + env) + **restore drill** (verify).
- **Rollback**: verify **atomic swap** đưa site về static build trước khi deploy lỗi.
- Điền Launch checklist + docs 08/12/13/14; **Sprint 6 Completion Report** → **Public MVP đạt**.

## 6. Acceptance Criteria *(từ [Planning §3 Sprint 6](./sprint-5-planning.md))*
- [ ] **Public HTTPS**: truy cập site qua **HTTPS** (chứng chỉ hợp lệ); Directus admin reachable qua proxy; Postgres **không** expose.
- [ ] **Build tái lập**: web build từ **lockfile** (`--frozen-lockfile`) trong Dockerfile → static output; build lại cho kết quả ổn định.
- [ ] **Rebuild-on-publish**: **publish 1 bài → xuất hiện public sau rebuild** (tự động); unpublish → biến mất; draft không lộ.
- [ ] **Backup + restore**: backup `pgdata`+uploads chạy được; **restore drill thành công** (dữ liệu khớp).
- [ ] **SEO prod đúng**: canonical/OG/`sitemap.xml`/`robots.txt` dùng **domain thật** (`PUBLIC_SITE_URL`); assets (`og:image`) qua domain cms public.
- [ ] **Không hồi quy & không đổi LÕI**: Reader render đúng ở prod; `03c`/`03d`/`03e`/`types.ts`/`directus.ts`/rule-permissions **không** đổi hành vi; draft ẩn (permission giữ).
- [ ] **Launch checklist** đạt: no secret in repo · TLS · least-privilege · backup (db+uploads+config+env) · **rollback = atomic swap về static build trước** · SEO/a11y ([14 §2.2](../14-quality-gates.md)).
- [ ] ⇒ **Public MVP đạt** (dogfooding thật bắt đầu; nội dung do Editor tin cậy).

## 7. Risks
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Máy chủ/domain/DNS chưa sẵn** (chặn deploy) | Cao | **Product cung cấp ở Phase 0**; plan neutral về provider; dùng biến `PUBLIC_SITE_URL` (đã có từ S5) |
| Auto-TLS cần 80/443 công khai + DNS trỏ đúng | Trung | Checklist DNS trước; reverse proxy tự cấp/gia hạn (ACME); kiểm chứng ở Phase 2 |
| **Rebuild build dồn/lỗi** khi publish nhiều | Trung | Debounce/queue; atomic swap (không phục vụ dở); log + fallback rebuild thủ công |
| **Static build cần data Directus** lúc build | Trung | Rebuild service ở **network nội bộ** (`directus:8055`); build fail → giữ bản cũ (atomic) |
| `PUBLIC_DIRECTUS_URL` = localhost lọt prod → OG/assets/sitemap sai | Trung | Env prod bắt buộc domain cms; verify Phase 2 (khớp SEO S5) |
| **Secrets prod yếu / lộ** | Cao | Secrets mạnh ngoài repo; `.env` gitignored; 2FA admin; least-privilege giữ |
| **Backup không phục hồi được** | Cao | **Restore drill bắt buộc** (Phase 4) — không coi là xong tới khi restore ok |
| Public **trước** hardening sâu (chưa sanitize/headers) | Trung | Chấp nhận cho Public MVP: Editor tin cậy; **Sprint 7 theo ngay** |
| Sửa hạ tầng làm vỡ dev workflow | Trung | Prod qua **override file riêng**; `docker-compose.yml` dev giữ nguyên |
| Scope creep sang Sprint 7 (CI/monitoring/CWV) | Trung | Kỷ luật: chỉ điều kiện *đủ* để public; phần còn lại Sprint 7 |

## 8. File dự kiến

**Tạo mới:**
- `apps/web/Dockerfile` (multi-stage) · `apps/web/.dockerignore`
- `docker-compose.prod.yml` (override) · **reverse-proxy config** (tên theo lựa chọn Phase 0: `Caddyfile`/`traefik.yml`/`nginx.conf`) · `.env.production.example`
- **Rebuild:** shell script/internal utility (webhook → `astro build` → atomic swap) + Directus Flow (tài liệu hoá / export). *(Service riêng chỉ khi có lý do rõ ràng.)*
- Backup script (vd `services/ops/backup.sh` + restore) — db + uploads + config + env
- `docs/adr/0007-*.md` (deploy topology + reverse proxy/TLS — ghi sau khi chốt) · `docs/adr/0008-*.md` (rebuild-on-publish — ghi sau khi chốt)
- `docs/sprints/sprint-6-completion-report.md` (cuối sprint)

**Sửa (điền thực tế):**
- `docs/08-deployment.md` · `docs/12-security.md` (§6 hạ tầng, §11 checklist) · `docs/13-operations.md` (runbook, backup, topo) · `docs/14-quality-gates.md` (§4 merge/release) · `docs/10-decisions.md` (`[S6-*]` + ADR index) · `docs/adr/README`+index · `README.md` (trạng thái Public MVP, cách deploy).
- (Nếu cần) `apps/web/package.json` (không đổi hợp đồng — chỉ nếu thêm script build/preview prod).

**KHÔNG đổi (đóng băng):**
- `docs/03c/03d/03e` (LÕI) · `apps/web/src/lib/directus.ts` + `types.ts` · `services/directus/apply-permissions.sh` (rule) · `services/directus/snapshots/schema.yaml` · **Reader** `apps/web/src/{pages,components,layouts,styles}` (S3–S5) · `docker-compose.yml` (DEV).

---

> 🛑 **Tài liệu planning.** Phase 0 giữ các lựa chọn ở trạng thái **candidate/recommended** tới khi Product xác nhận: reverse proxy (**Caddy/Traefik/Nginx**), domain topology (**recommended** subdomain tách), rebuild (**webhook → script → atomic swap**). Cần **Product cung cấp**: hosting target (máy chủ), **domain** + DNS. **ADR-0007/0008 chỉ ghi SAU khi chốt ở Phase 0.** Dừng chờ review theo từng phase.
