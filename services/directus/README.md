# services/directus/

Cấu hình / extensions / snapshots cho **Directus** (adapter cho vai trò *Headless Content Service* — [ADR-0003](../../docs/adr/0003-use-directus-headless-cms.md)).

Directus **chạy từ Docker image** (Docker Compose — Phase 2), không phải mã nguồn ứng dụng ở đây. Thư mục này giữ:
- extensions tùy biến (nếu có sau này),
- snapshot schema (export/import).

> ⚠️ Sprint 1 **không** tạo content model production (Post/Author/Category/Media) — xem [Sprint 1 Plan §2](../../docs/sprints/sprint-1.md). Ánh xạ Content Model → Directus: [docs/05-cms.md](../../docs/05-cms.md). Uploads/DB local được `.gitignore`.
