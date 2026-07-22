# 🏁 Sprint 6 — Completion Report (Deployment & Public MVP)

> **Ngày:** 2026-07-23 · **Sprint:** 6 — Deployment & Public MVP · **Trạng thái:** 🟢 **HOÀN THÀNH** (deployment-ready — chờ Product review đóng sprint)
> **Kế hoạch nguồn:** [sprint-6-implementation-plan.md](./sprint-6-implementation-plan.md) · **Nhánh:** `main` (mỗi phase 1 commit)
> 🔗 [ADR-0007 Caddy](../adr/0007-reverse-proxy-and-tls.md) · [ADR-0008 rebuild-on-publish](../adr/0008-rebuild-on-publish.md) · [08-deployment](../08-deployment.md) · [13-operations](../13-operations.md) · [12-security](../12-security.md) · [10-decisions `[S6-*]`](../10-decisions.md).

---

## 1. Mục tiêu đạt được

Xây **toàn bộ máy móc triển khai** để đưa site **public qua HTTPS** + **tự cập nhật khi publish** + **build tái lập** + **backup có kiểm chứng** → **Public MVP deployment-ready**.

**Mở HẠ TẦNG** (Dockerfile, compose prod, Caddy, rebuild pipeline, backup) — **đóng băng LÕI**: Content Model/API/DTO/thin client/rule-permissions/Reader/`docker-compose.yml` (dev) **không đổi**.

> ⚠️ **"Deployment-ready" nghĩa là:** mọi cơ chế đã hiện thực & kiểm chứng (offline + local). **Go-live thật** = chạy quy trình deploy đã tài liệu hoá với **domain + hosting do Product cung cấp** (chứng chỉ ACME thật cấp khi DNS trỏ đúng). Đây là hành động deploy, không phải hạng mục code còn thiếu.

## 2. Các phase (mỗi phase 1 commit)

| Phase | Commit | Nội dung |
|---|---|---|
| Plan | `9677b3f` | Implementation Plan (5 điều chỉnh Product: proxy candidate, rebuild tối giản, backup scope, domain recommended, rollback) |
| P0 — Decisions | `5198f24` | Candidate analysis (08-deployment); Product chốt → Caddy/ADR-0007, Flow→swap/ADR-0008, `retro.`/`cms.` |
| P1 — Reproducible build | `5fc1a8f` | `apps/web/Dockerfile` build-runner (`--frozen-lockfile`) + ADR-0007/0008; **2 build byte-identical** |
| P2 — Topology + proxy + TLS | `042f586` | `docker-compose.prod.yml` + `Caddyfile` + `.env.production.example`; verify config/caddy/routing/SEO |
| P3 — Rebuild-on-publish | `dc9c3ee` | Flow→webhook→script→atomic swap (`services/rebuild/*` + `apply-rebuild-flow.mjs`); verify end-to-end |
| P4 — Backup/Launch/Report | _(commit này)_ | `services/ops/{backup,restore}.sh` + restore drill; Launch checklist; docs; báo cáo này |

## 3. Acceptance Criteria (từ [Plan §6](./sprint-6-implementation-plan.md))

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | **Public HTTPS**; Directus qua proxy; Postgres không expose | ✅ cơ chế: Caddy auto-TLS + routing smoke (internal TLS) + config (directus `127.0.0.1`, postgres không expose) · **@deploy**: cert thật |
| 2 | **Build tái lập** từ lockfile → static | ✅ `--frozen-lockfile`; **2 build byte-identical** (aggregate SHA256 khớp) |
| 3 | **Rebuild-on-publish**: publish → hiện sau rebuild; unpublish → mất; draft ẩn | ✅ verify end-to-end (stale 404 → rebuild → 200 → unpublish → 404) |
| 4 | **Backup + restore drill** | ✅ backup db+uploads+config+env; **restore drill posts 117=117**, uploads 4=4 |
| 5 | **SEO prod** dùng domain thật | ✅ build `PUBLIC_SITE_URL` → canonical/OG/sitemap(111)/robots domain thật, 0 localhost |
| 6 | **Không đổi** LÕI/hợp đồng/Reader | ✅ diff mọi phase: chỉ hạ tầng + docs; `docker-compose.yml` dev nguyên |
| 7 | **Launch checklist** đạt | ✅ [08 §8](../08-deployment.md) — cơ chế đạt; mục `@deploy` khi có server |

## 4. Verification history

### 4.1. Reproducible build (P1)
- 2 lần chạy build-runner (attach network, reach Directus) → `dist` **byte-identical**.
- **Aggregate SHA256 = `619bc1ee800f16688c4202b9af2f52e38feb06e19dff7df29381c0b3e7bc4c6c`** (123 trang / 126 file; build localhost vs fixture 96 published). *(Hash phụ thuộc nội dung + URL localhost → artifact kiểm chứng, không phải hằng số across môi trường.)*

### 4.2. Deployment topology (P2)
- `docker compose -f base -f prod config` **hợp lệ**: directus `host_ip 127.0.0.1`, caddy `80/443`, web build-runner.
- `caddy validate`: **Valid configuration** (đã `caddy fmt`).
- **Routing smoke** (Caddy trên `retro-net`, internal TLS, test domain `retro.localhost`/`cms.localhost`): SITE `/`, `/page/2`, `/category/cpu`, `/sitemap.xml`, `/robots.txt` → **200**; clean URL `/posts/cpu-04` → **200 (không 301)**; **draft → 404**; HTTP→HTTPS → **308**; `cms → directus /server/health` → **200**.
- **SEO domain thật**: build-runner `PUBLIC_SITE_URL=https://retro.example.test` → canonical/OG/**sitemap 111 loc**/robots dùng domain thật; **0** file HTML sót localhost.

### 4.3. Rebuild-on-publish (P3)
- publish draft → **trước** rebuild vẫn **404 (stale)** → build-swap (atomic) → **200 (hiện)**; unpublish → build-swap → **404 (mất)**.
- prune `KEEP_BUILDS=2` → `builds/` còn 2 (rollback); **Directus Flow fire webhook** (items.update) kèm `x-rebuild-token`.

### 4.4. Backup & restore drill (P4)
- `backup.sh` → `db.dump` (164K) + `uploads.tgz` (1.9M) + config.
- **Restore drill**: restore `db.dump` vào Postgres sạch (throwaway) → **posts 117 = 117 nguồn**; uploads **4 = 4 file**. → backup **kiểm chứng khôi phục được**.

## 5. Sơ đồ deployment cuối cùng

Đã bổ sung vào **[13-operations §1](../13-operations.md)** (theo yêu cầu Product Phase 2) — topo Caddy(edge/TLS) → static `current` + Directus(`cms`) → Postgres(nội bộ), kèm bảng service/cổng/volume và luồng rebuild-on-publish.

## 6. Ranh giới (đóng băng — xác nhận qua diff)

**KHÔNG** trong diff Sprint 6: `03c/03d/03e` (LÕI), `directus.ts`/`types.ts`, `apply-permissions.sh` (rule), `schema.yaml`, **Reader** (`apps/web/src/{pages,components,layouts,styles}`), `docker-compose.yml` (dev).
**Đã chạm** (đúng phạm vi): `apps/web/Dockerfile`+`.dockerignore`, `docker-compose.prod.yml`, `Caddyfile`, `.env.production.example`, `services/rebuild/*`, `services/ops/*`, `services/directus/apply-rebuild-flow.mjs`, `.gitignore`, `package.json`, ADR-0007/0008, docs (08/10/12/13/14/README).

## 7. Remaining Backlog → Sprint 7 (Hardening / Production Readiness)

| Hạng mục | Nguồn |
|---|---|
| **Sanitize HTML markdown (XSS)** · **security headers** · secrets rotation | Plan out-of-scope; [12 §8/§11](../12-security.md) |
| **Core Web Vitals** đo prod + tối ưu ảnh (srcset) | Planning NFR |
| **CI/test tự động** (light, dùng fixtures) | Planning |
| **Rebuild log** (timestamp/status/duration) cho vận hành & chẩn đoán | **Product review Phase 3** |
| **Monitoring/observability/alerting** | [13 §3](../13-operations.md) |
| 2FA admin bật trên server thật | [12 §3](../12-security.md) |

## 8. Kết luận

Sprint 6 hoàn tất đúng phạm vi: **build tái lập · topology + Caddy/TLS · rebuild-on-publish · backup/restore có kiểm chứng · Launch checklist** — tất cả verify (offline/local). **Không hồi quy, không phá ranh giới LÕI/hợp đồng.** Sản phẩm **deployment-ready cho Public MVP**: go-live = chạy quy trình deploy đã tài liệu ([08 §8](../08-deployment.md)) với **domain + hosting Product cung cấp**.

> ⏸️ **Dừng chờ Product review Sprint 6** trước khi bắt đầu **Sprint 7 — Hardening**.
