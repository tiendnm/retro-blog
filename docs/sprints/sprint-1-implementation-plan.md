# 🏗️ Sprint 1 — Implementation Plan

> **Trạng thái:** 🟡 Draft · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chờ review)_
>
> 🎯 **Mục tiêu Sprint 1:** dựng **nền tảng chạy được local** (Astro + Directus + PostgreSQL qua Docker Compose), **chưa làm feature**.
> 🔗 **Nguồn sự thật (không định nghĩa lại ở đây):** phạm vi → [01a-mvp-scope](../01a-mvp-scope.md) · kiến trúc → [03-architecture](../03-architecture.md) + [03a-principles](../03a-architecture-principles.md) · công nghệ → [10a-tech-stack](../10a-tech-stack.md) + [ADR 0002–0005](../adr/) · mốc → [02-roadmap M1](../02-roadmap.md).

---

> 🔒 **Quy tắc (rule #5):** Kế hoạch này **tuân theo** MVP Scope / Architecture Principles / ADR — **không tự ý thay đổi** chúng. Nếu phát hiện cần đổi → **DỪNG**, tạo [Decision Log (10 §5)](../10-decisions.md) hoặc ADR, chờ review.

## 1. Mục tiêu (Goal)

Có một môi trường phát triển local vận hành được đầu-cuối cho các *vai trò* đã định ở [03-architecture §3](../03-architecture.md): Presentation, Headless Content Service, Content Store — đóng gói bằng Docker, kết nối được với nhau, và một developer mới clone repo là chạy được. **Không hiện thực feature MVP nào.**

## 2. Phạm vi (Scope)

**✅ Trong phạm vi:**
- Repository structure (khung thư mục, workspace, `.gitignore`).
- Astro application — *khung chạy được*, 1 trang mẫu tối thiểu (chưa layout/feature).
- Directus instance — lên được, admin UI truy cập được.
- PostgreSQL — Content Store cho Directus.
- Docker Compose — orchestrate 3 service + mạng nội bộ.
- Environment configuration — mô hình `.env` (12-factor), `.env.example`, không secret trong repo.
- Development workflow — script up/down, hướng dẫn getting-started, quy trình chạy local.

**⛔ Ngoài phạm vi (KHÔNG làm trong Sprint 1 — theo [01a](../01a-mvp-scope.md)):**
- Feature MVP hoàn chỉnh (đọc/soạn/xuất bản bài thực) — thuộc Sprint sau (M2).
- **Hiện thực content model** (tạo collections Post/Author/Category/Media) — M2; Sprint 1 chỉ verify *plumbing* bằng 1 mẫu throwaway/health.
- SEO optimization · Search · Analytics · Frontend authentication · Advanced image pipeline.

## 3. Công nghệ sử dụng (từ ADR/Tech Stack — không quyết mới)

| Vai trò ([03](../03-architecture.md)) | Công nghệ | ADR |
|---|---|---|
| Presentation / Site | Astro | [0002](../adr/0002-use-astro-site-generator.md) |
| Headless Content Service | Directus | [0003](../adr/0003-use-directus-headless-cms.md) |
| Content Store | PostgreSQL | [0004](../adr/0004-use-postgresql-content-store.md) |
| Đóng gói & Runtime | Docker (Compose) | [0005](../adr/0005-use-docker-packaging.md) |

> ⏳ **Cần chốt đầu Sprint 1 → ghi [Decision Log](../10-decisions.md), cập nhật [10a](../10a-tech-stack.md):** phiên bản mỗi công nghệ; package manager (npm/pnpm); Node version; có reverse proxy ở local hay không. *(Đây là quyết-trong-sprint, không phải kiến trúc mới.)*

## 4. File / Directory sẽ tạo (đề xuất — chốt ở bước code)

```
retro-blog/
├─ apps/
│  └─ web/                 # Astro app (adapter cho Presentation)
├─ services/
│  └─ directus/            # cấu hình/extensions/snapshots Directus (không phải code app)
├─ infra/
│  └─ compose/             # file compose phụ, env theo service (nếu tách)
├─ docker-compose.yml      # orchestrate web + directus + postgres
├─ .env.example            # mẫu biến môi trường (không secret)
├─ .gitignore              # (đã có — sẽ điền: node_modules, .env, build...)
├─ package.json            # workspace root (nếu dùng monorepo)
├─ docs/                   # (đã có)
└─ README.md               # (đã có — cập nhật Getting Started)
```

**File cấu hình sẽ tạo (KHÔNG tạo ở bước này):** `docker-compose.yml`, scaffold Astro trong `apps/web/`, `.env.example`, `package.json` workspace, script dev (up/down/logs).

> Cấu trúc thư mục sau khi chốt cần ghi vào [09-coding-standards §2](../09-coding-standards.md) (đang TODO). Các tài liệu RÌA sẽ được điền *khi hiện thực*: [04-database](../04-database.md), [05-cms](../05-cms.md), [06-api](../06-api.md), [08-deployment](../08-deployment.md).

## 5. Thứ tự thực hiện (Execution Order)

1. **Repo structure** — khung thư mục, workspace, `.gitignore`.
2. **PostgreSQL** (Docker) — lên service, volume dữ liệu.
3. **Directus** (Docker) — kết nối PostgreSQL → admin UI truy cập được.
4. **Astro** scaffold — dev server chạy, 1 trang mẫu.
5. **Environment config** — `.env.example`, biến cho từng service (12-factor, [P5](../03a-architecture-principles.md)).
6. **Docker Compose** — gộp 3 service + mạng nội bộ + healthcheck/`depends_on`.
7. **Plumbing test** — Astro đọc 1 mẫu tối thiểu từ Directus qua [API Contract 03d](../03d-api-contract.md) (chưa content model thật).
8. **Development workflow** — script up/down, cập nhật Getting Started (README/[17-contributing](../17-contributing.md)).
9. **Verify Acceptance (§6)** + ghi các quyết-trong-sprint vào Decision Log.

## 6. Acceptance Criteria

- [ ] `docker compose up` khởi động **PostgreSQL + Directus + Astro** không lỗi.
- [ ] Directus admin UI truy cập được ở local; kết nối PostgreSQL OK.
- [ ] Astro dev server chạy, render **1 trang khung**.
- [ ] Astro **đọc được 1 mẫu dữ liệu** từ Directus (plumbing smoke test) — chứng minh kết nối theo [03d](../03d-api-contract.md).
- [ ] Cấu hình hoàn toàn qua `.env`; **không secret trong repo** ([12-security](../12-security.md)).
- [ ] Developer mới: clone → làm theo Getting Started → chạy được (không cần hỏi thêm).
- [ ] **Không feature MVP nào được hiện thực** (đúng [01a §2 out-of-scope](../01a-mvp-scope.md)).
- [ ] Các quyết-trong-sprint (phiên bản, package manager...) đã ghi [Decision Log](../10-decisions.md) + [10a](../10a-tech-stack.md).

## 7. Rủi ro (Risks)

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Directus ↔ PostgreSQL (thứ tự khởi động, healthcheck, biến kết nối) | Tốn thời gian debug | `depends_on` + healthcheck; tài liệu hoá |
| Astro fetch Directus (CORS, public role, token) | Chặn plumbing test | Dùng public role đọc theo [06-api](../06-api.md); không nhúng secret |
| Phiên bản/breaking giữa các công nghệ | Rework | Pin version, ghi [10a](../10a-tech-stack.md) |
| Secret rò rỉ trong repo | Bảo mật | `.env.example` + `.gitignore`; [12-security](../12-security.md) |
| **Scope creep** (bắt đầu làm feature/content model) | Trễ, phá scope | Bám [01a MVP Scope](../01a-mvp-scope.md); dừng nếu vượt §2 |
| Quyết định phát sinh (repo layout, tooling) bị "quyết ngầm" | Mất truy vết | Ghi [Decision Log](../10-decisions.md) ngay khi quyết |

## 8. Ràng buộc & Nguồn sự thật (nhắc lại — rule #5)

- **Phạm vi:** [01a-mvp-scope](../01a-mvp-scope.md). **Kiến trúc:** [03a-principles](../03a-architecture-principles.md). **Công nghệ:** [ADR 0002–0005](../adr/) / [10a](../10a-tech-stack.md).
- Cần thay đổi các tài liệu này → **DỪNG → Decision Log/ADR → chờ review**. Không sửa ngầm.
