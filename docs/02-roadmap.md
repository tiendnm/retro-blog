# 02 — Roadmap

> 🎯 **Mục đích:** Sắp xếp *khi nào* làm *cái gì* — các mốc, sprint và hướng đi tiếp theo.
> 🔗 **Liên quan:** [00-project](./00-project.md) · [01-requirements](./01-requirements.md) · [01a-mvp-scope](./01a-mvp-scope.md) (SSOT phạm vi MVP) · [14-quality-gates](./14-quality-gates.md) · [17-contributing §2](./17-contributing.md) (quy trình sprint)

---

## 1. Nguyên tắc lập kế hoạch

- Ưu tiên **MVP** (tập nhỏ nhất tạo giá trị) trước, mở rộng sau. Phạm vi MVP là SSOT ở [01a-mvp-scope](./01a-mvp-scope.md).
- Mỗi sprint = một file `docs/sprints/sprint-N.md` (mục tiêu, checklist, tiêu chí xong, kết quả).
- Sprint còn lại phải **tiến gần Public MVP đo lường được**; feature không cải thiện launch-readiness thì để Backlog.

## 2. Mốc (Milestones)

| Mốc | Mục tiêu | Trạng thái |
|---|---|---|
| M0 — Tài liệu nền tảng | Bộ `docs/` + ADR stack | ✅ Sprint 0 |
| M1 — Khung hệ thống | Astro + Directus + PostgreSQL chạy local | ✅ Sprint 1 |
| M2 — MVP nội dung | Editor publish → Reader xem (list/detail/category) | ✅ Sprint 2 |
| M3 — Ra mắt (Launch) | Public HTTPS + SEO + a11y + checklist | 🟡 Cơ chế xong (Sprint 5–6); còn xác nhận trên domain thật ([08 §8](./08-deployment.md)) |

## 3. Sprint

| Sprint | Chủ đề | Trạng thái |
|---|---|---|
| 0 | Tài liệu & kiến trúc | ✅ |
| [1](./sprints/sprint-1.md) | Nền tảng local (infra + plumbing) | ✅ |
| [2](./sprints/sprint-2.md) | Vertical slice nội dung | ✅ |
| [3](./sprints/sprint-3.md) | Reader Experience | ✅ |
| [4](./sprints/sprint-4.md) | Fixture Framework & dogfooding | ✅ |
| [5](./sprints/sprint-5.md) | Pagination + SEO baseline | ✅ |
| [6](./sprints/sprint-6.md) | Deployment & Public MVP | ✅ (mục @deploy chờ domain thật) |
| [6.5](./sprints/sprint-6.5.md) | Product Polish (Content & UX) | ✅ |
| [7](./sprints/sprint-7.md) | System Hardening & Quality (Biome, test, CI) | 🟡 Phase 1 xong; Phase 2–3 còn lại |
| [8](./sprints/sprint-8.md) | Production Hardening (header, webhook, backup lịch, healthcheck) | ✅ (chưa kiểm chứng trên server thật) |

## 4. Backlog cấp cao

- **Deploy (@deploy):** xác nhận ACME/DNS + CSP trên domain thật, 2FA admin, nâng HSTS 1 năm, copy backup ra ngoài host; rate limiting Directus, container không chạy root, quét dependency.
- **Kiểm thử mở rộng:** test độ bền thin client, axe a11y, link-check, Lighthouse budget, E2E.
- **Reader feature:** Category discoverability, Search, RSS, Tags, Archive, Author pages.
- **Refactor docs-architecture:** F1–F15 ([architecture review](./reviews/architecture-review-2026-07-21.md)).

## 5. Phát hành

| Phiên bản | Điều kiện phát hành |
|---|---|
| v0.1 (Public MVP) | DoD release ([14 §2.2](./14-quality-gates.md)) + checklist [08 §8](./08-deployment.md) đạt trên domain thật |
