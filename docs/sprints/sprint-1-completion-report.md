# 🏁 Sprint 1 — Completion Report

> **Ngày:** 2026-07-21 · **Sprint:** 1 — Implementation (nền tảng local) · **Trạng thái:** 🟢 **HOÀN THÀNH**
> **Kế hoạch nguồn:** [sprint-1-implementation-plan.md](./sprint-1-implementation-plan.md) · **Nhánh:** `main` (commit theo phase)

---

## 1. Mục tiêu đạt được

Nền tảng local **chạy được đầu-cuối**: **Browser → Astro (container) → Directus API → PostgreSQL**, đóng gói bằng Docker Compose, một developer mới clone repo là chạy được. **Không** hiện thực feature MVP.

- ✅ 3 service (PostgreSQL, Directus, Astro) chạy & `healthy` qua `docker compose up`.
- ✅ Plumbing chuỗi kết nối verify (trang render `ok` + `PASS`).
- ✅ Fresh-clone reproducible (mô phỏng dev mới → chạy thành công).
- ✅ Tuân thủ ranh giới: không content model / feature / SEO / auth / architecture change.

## 2. File thay đổi (theo phase)

| Phase | Commit | File chính |
|---|---|---|
| P1 — Repository Foundation | `4984c3d` | `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore` (+`!.env.example`), `.env.example`, `apps/README.md`, `services/directus/README.md`, `git init -b main` |
| P2 — Infrastructure | `ef2bfb0` | `docker-compose.yml` (postgres 16.8-alpine, directus 11.3.5, healthcheck, named volumes, network) |
| P3 — Connectivity (+Plumbing) | `1d9ce5a` | `apps/web/*` (Astro 5.x minimal), web service (node:22.12.0-alpine), `index.astro` plumbing-check, `.env.example` (+`DIRECTUS_INTERNAL_URL`) |
| P5 — Developer Workflow | _(commit này)_ | `README.md` (Getting Started), `package.json` (scripts start/stop/restart/logs/status/down), báo cáo này |

> Cập nhật tài liệu kèm theo: `docs/10a-tech-stack.md` (pin versions), `docs/10-decisions.md` (Decision Log).

## 3. Acceptance Criteria (từ Plan §6)

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | `docker compose up` khởi động PostgreSQL + Directus + Astro không lỗi | ✅ cả 3 `healthy` |
| 2 | Directus admin UI truy cập; kết nối PostgreSQL OK | ✅ `/admin/login` 200; migrations chạy trên PG |
| 3 | Astro dev server chạy, render 1 trang khung | ✅ `:4321` HTTP 200 (Astro 5.18.2 / Node 22 / pnpm) |
| 4 | Astro đọc 1 mẫu từ Directus (plumbing) | ✅ trang render `/server/health` = `ok` → `PASS` |
| 5 | Cấu hình qua `.env`; không secret trong repo | ✅ `.env` gitignored; `.env.example` đủ 18 biến, chỉ placeholder |
| 6 | Dev mới clone → theo Getting Started → chạy được | ✅ fresh-clone verify PASS |
| 7 | Không feature MVP nào được hiện thực | ✅ chỉ plumbing throwaway |
| 8 | Quyết-trong-sprint ghi Decision Log + Tech Stack | ✅ (mục 4) |

## 4. Quyết định đã ghi nhận (Decision Log `10 §5`)

- **Toolchain:** pnpm 10; **Node 22 LTS** (`engines >=22`); Astro chạy container Node 22.
- **Versions (pin):** `postgres:16.8-alpine` · `directus/directus:11.3.5` · `node:22.12.0-alpine` (verify pull được).
- **Compose:** 1 file root; postgres **không expose host**; named volumes; healthcheck; network nội bộ.
- **Astro:** scaffold minimal; web vào default stack; `node_modules` ở volume container (tách host win32).
- **Plumbing:** fetch server-side qua `DIRECTUS_INTERNAL_URL` (network nội bộ).
- **Git:** `git init -b main`; `!.env.example` override global gitignore.

## 5. Ngoài phạm vi Sprint 1 (đã giữ đúng)

- Feature MVP, **content model production** (Post/Author/Category/Media collections), blog page, UI design.
- SEO, Search, Analytics, Frontend authentication, Advanced image pipeline.
- **Hardening chưa làm (ghi nhận):** pin `pnpm-lock.yaml` + `Dockerfile` cho web (build reproducible) — hiện container cài fresh.
- Reverse proxy, CI/CD, ADR-0006 (chiến lược render) — chưa quyết.

## 6. Đề xuất Sprint 2 (chưa bắt đầu)

> Bám [MVP Scope 01a](../01a-mvp-scope.md) (Must Have) + [Roadmap M2 — MVP nội dung](../02-roadmap.md). **Chờ phê duyệt để mở Sprint 2.**

1. **Hiện thực Content Model MVP** trong Directus ([05-cms](../05-cms.md)): collections **Post, Author, Category, Media** theo [03c](../03c-content-model.md); roles **Admin + Editor**; workflow xuất bản (draft→published).
2. **API binding** ([06-api](../06-api.md)) theo [API Contract 03d](../03d-api-contract.md): danh sách bài published + bài theo slug + duyệt theo Category.
3. **Astro pages thật:** trang danh sách + trang chi tiết bài (thay trang plumbing); layout retro tối thiểu ([07-ui-ux](../07-ui-ux.md)).
4. **Quyết ADR-0006** (render strategy: SSG + rebuild-on-publish vs SSR) — cần cho luồng nội dung.
5. **Hardening nền tảng:** pin lockfile + `Dockerfile` cho web (build reproducible).

> Ngoài Sprint 2 (giữ MVP tối giản): Tag browsing, RSS, scheduled publishing, search, i18n (theo phân loại [01a](../01a-mvp-scope.md)).

---

> ✅ **SPRINT 1 ĐÓNG.** Không bắt đầu Sprint 2 cho tới khi được phê duyệt.
