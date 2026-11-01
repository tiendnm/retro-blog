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
| M3 — Ra mắt (Launch) | Public HTTPS + SEO + a11y + checklist | ✅ **Đạt 2026-11-01 (v0.1)** — lịch sử: Site + CMS + rebuild-on-publish đã chạy trên domain thật (2026-10-30); backup/healthcheck nay chạy trong compose (Sprint 10); backup ngoài máy lên Cloudflare R2 đã chạy (2026-11-01); restore drill từ R2 đạt (2026-11-01); HSTS 1 năm đã bật. Diễn tập dựng server mới hoàn toàn từ backup R2: **bỏ qua có chủ đích** (Product, 2026-11-01; restore DB + uploads từ R2 đã kiểm, còn lại phải tạo lại secret/token tunnel vì `env.bak` không lên R2) ([08 §8](./08-deployment.md)) |

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
| [7](./sprints/sprint-7.md) | System Hardening & Quality (Biome, test, CI) | ✅ Phase 1–3 xong (Biome + astro check, 38 test Vitest, CI phương án lai: job `quality` bắt buộc, job `build` continue-on-error) |
| [8](./sprints/sprint-8.md) | Production Hardening (header, webhook, backup lịch, healthcheck) | ✅ (webhook rebuild đã kiểm chứng trên máy thật; backup/healthcheck timers chưa) |
| [9](./sprints/sprint-9.md) | Deploy tại nhà: Cloudflare Tunnel + Postgres trong compose | ✅ đã chạy trên máy thật (2026-10-30): site + CMS + rebuild-on-publish qua tunnel |
| [10](./sprints/sprint-10.md) | Đóng gói deploy (webhook + backup vào compose, script dựng server) | ✅ Product duyệt 2026-10-30: server dựng bằng 4 việc tay (`deploy-home.sh`), webhook + backup + healthcheck trong compose |
| [11](./sprints/sprint-11.md) | Kiểm thử mở rộng (link-check, axe, Lighthouse, E2E, quyền Public, độ bền thin client) | 📋 Kế hoạch — **sprint kế tiếp** |
| [12](./sprints/sprint-12.md) | Vận hành & quan sát (runbook, log, metric nhẹ, sự cố, restore drill định kỳ) | 📋 Kế hoạch |
| [13](./sprints/sprint-13.md) | Bảo mật bổ sung & cổng CI (rate limit đăng nhập admin, check bắt buộc, header test, xoay secret, đánh giá Postgres 18/Directus) | ✅ Xong (2026-11-02) |
| [14](./sprints/sprint-14.md) | Nợ tài liệu (dọn ~70 TODO/TBD, sửa chỗ lệch thực tế, script kiểm docs) | 📋 Kế hoạch |
| [15](./sprints/sprint-15.md) | Refactor docs Đợt 3 (IA của site, Design System, topology một nguồn, F9–F15) | 📋 Kế hoạch |
| [16](./sprints/sprint-16.md) | Visual Polish (grain/crease procedural kiểu manual cũ) | 📋 Kế hoạch |

> **Thứ tự sprint 11–16 (Claude đề xuất, Product duyệt):** 11 trước vì tạo lưới an toàn (axe/Lighthouse/E2E/test quyền) cho mọi thay đổi sau; 12–13 giảm rủi ro vận hành/bảo mật của hệ thống đang chạy thật; 14–15 trả nợ tài liệu (14 trước vì 15 dùng `check-docs` và phần điền sẵn); 16 cuối vì cần số đo từ 11 và Design System từ 15. Có thể đổi thứ tự 12–16 khi ưu tiên thay đổi; 11 giữ đầu.

## 4. Backlog cấp cao

- **Deploy (@deploy):** xác nhận ACME/DNS + CSP trên domain thật, (2FA admin: bỏ qua có chủ đích), (HSTS 1 năm và backup ra ngoài host: xong 2026-11-01); rate limiting Directus, container không chạy root, quét dependency: xong 2026-11-01, đợt Dependabot đầu xử lý + deploy cùng ngày ([12 §6](./12-security.md), [13 §2](./13-operations.md)); Directus 11.3.5 → 11.17.4 xong 2026-11-01; còn: Directus 12.x (đã đánh giá 2026-11-01: bị chặn bởi giới hạn Flow của tầng Core, [12 §6](./12-security.md)), rate limit riêng cho đăng nhập admin, vá nốt 3 lỗ hổng audit mức thấp/vừa.
- **Kiểm thử mở rộng:** test độ bền thin client, axe a11y, link-check, Lighthouse budget, E2E → [Sprint 11](./sprints/sprint-11.md).
- **Vận hành & quan sát** (runbook, log, metric, sự cố, restore drill) → [Sprint 12](./sprints/sprint-12.md). **Bảo mật bổ sung & cổng CI** (rate limit đăng nhập admin, check bắt buộc, Postgres 18/Directus) → [Sprint 13](./sprints/sprint-13.md). **Nợ tài liệu** → [Sprint 14](./sprints/sprint-14.md). **Visual Polish** → [Sprint 16](./sprints/sprint-16.md).
- **Reader feature:** (không còn mục nào chờ.) (Search: khi blog lớn tới mức chỉ mục tĩnh quá nặng thì cân nhắc Pagefind/server-side — [15](./15-seo-accessibility.md).)
- **Refactor docs-architecture:** F1–F8 và F13 xong (Đợt 1–2); F9–F12, F14, F15 → [Sprint 15](./sprints/sprint-15.md) ([architecture review](./reviews/architecture-review-2026-07-21.md)).

> Đã làm xong 2026-11-01 — RSS (`/rss.xml`), Tags (`/tag/<slug>`), Archive (`/archive`), Search (`/search`), Tác giả (`/author/<slug>`), Chuyên mục (`/categories`): [15 §A4](./15-seo-accessibility.md).

## 5. Phát hành

| Phiên bản | Điều kiện phát hành |
|---|---|
| v0.1 (Public MVP) | DoD release ([14 §2.2](./14-quality-gates.md)) + checklist [08 §8](./08-deployment.md) đạt trên domain thật — ✅ **phát hành 2026-11-01** (commit `415dea3` + docs chốt) |
