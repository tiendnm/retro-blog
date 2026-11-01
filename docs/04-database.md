# 04 — Persistence / Database (Implementation)

> 🎯 **Mục đích:** Mô tả *cách hiện thực vật lý* việc lưu trữ trên CSDL được chọn — kiểu cột, index, migration, seeding, backup hooks. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03e-data-model](./03e-data-model.md) ← SSOT · [03c-content-model](./03c-content-model.md) · [05-cms](./05-cms.md) · [13-operations](./13-operations.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn công nghệ).** Mô hình dữ liệu *logic* là **nguồn sự thật** ở [03e-data-model](./03e-data-model.md) — tài liệu này **không định nghĩa lại** thực thể/field, chỉ mô tả cách hiện thực vật lý. Tuân [Nguyên tắc 0](./03a-architecture-principles.md).
>
> ℹ️ Công nghệ CSDL cụ thể (vd PostgreSQL) là *lựa chọn implementation* — phải có ADR (xem [10-decisions](./10-decisions.md)) và được liệt kê ở `Tech Stack`.

## 1. Công nghệ lưu trữ được chọn

- CSDL: **PostgreSQL 16** ([ADR-0004](./adr/0004-use-postgresql-content-store.md)); phiên bản thật pin ở `docker-compose.yml` / `docker-compose.prod.yml` (hiện `postgres:16.15-alpine`) và liệt kê ở [Tech Stack](./10a-tech-stack.md). Dev: instance ngoài compose ([ADR-0010](./adr/0010-external-postgres-instance.md)); production: trong compose ([ADR-0014](./adr/0014-postgres-in-compose-for-production.md)). Hỗ trợ bản 16 tới 2028-11-09; kế hoạch nâng: [12 §6](./12-security.md).
- CMS tự quản schema: cấu trúc bảng do Directus sinh từ snapshot — xem [05-cms](./05-cms.md).

## 2. Ánh xạ Data Model logic → vật lý

> Với mỗi thực thể ở [03e §2](./03e-data-model.md), ghi kiểu cột thật & đặc thù CSDL. KHÔNG chép lại danh sách field logic.

| Thực thể (logic 03e) | Bảng vật lý | Ghi chú kiểu cột / đặc thù |
|---|---|---|
| Post | `posts` | PK `uuid`; `title`/`slug`/`status` = `character varying(255)` (`status` mặc định `draft`); `body` = `text` (HTML); `published_at` = `timestamp with time zone` |
| Author | `authors` | PK `uuid`; `slug` unique |
| Category | `categories` | PK `uuid`; `slug` unique; `parent` tham chiếu chính bảng |
| Tag | `tags` | PK `uuid`; `slug` unique |
| Post–Tag | `posts_tags` | PK `integer`; `posts_id`, `tags_id`; CASCADE cả hai phía |
| Media | `directus_files` | Bảng built-in của Directus (không bảng riêng), thêm cột `alt`, `caption` |
| SiteSettings | `site_settings` | Singleton, PK `integer` ([ADR-0012](./adr/0012-site-settings-singleton.md)) |

Quy tắc xoá thực tế khớp [03e §3](./03e-data-model.md): `posts.author` NO ACTION (chặn); `posts.category`, `posts.cover`, `authors.avatar`, `categories.parent`, `site_settings.default_og_image` SET NULL; `posts_tags` CASCADE. Nguồn sự thật cấu trúc: [`services/directus/snapshots/schema.yaml`](../services/directus/snapshots/schema.yaml).

## 3. Index & Tối ưu (vật lý)

> Hiện thực các *nhu cầu truy cập* ở [03e §5](./03e-data-model.md).

- **Có:** khoá chính; **unique** trên `slug` của `posts`, `authors`, `categories`, `tags` (đồng thời phục vụ tra cứu theo slug).
- **Chưa có** index riêng cho `status` + `published_at` và không full-text: site tĩnh chỉ đọc CMS lúc build (một lượt, vài trăm hàng) nên quét tuần tự đủ nhanh. Thêm index khi số bài tăng đáng kể hoặc khi có truy vấn runtime — làm bằng snapshot schema, không SQL tay.

## 4. Migration

- **Schema nội dung:** snapshot Directus được commit (`schema.yaml`), áp bằng `pnpm schema:apply` (idempotent, an toàn chạy lại). Đổi schema = sửa trong CMS → export snapshot → commit; review diff như review mã. Không có công cụ migration SQL riêng.
- **Migration nội bộ Directus** (bảng `directus_*`) tự chạy khi image Directus nâng bản; đã thử trên bản sao khi đánh giá nâng phiên bản ([12 §6](./12-security.md)).
- **Rollback:** khôi phục từ sao lưu (`pg_restore`) — xem §6 và [13 §4](./13-operations.md); không có migration "down".
- Nâng major PostgreSQL: dump/restore làm tay, có ADR ([12 §6](./12-security.md)).

## 5. Seeding

- **Dev:** `pnpm seed:dev` (`services/directus/seed/seed-dev.mjs`) — bộ dữ liệu tối thiểu; `pnpm seed:showcase` (`seed-showcase.mjs`) — bộ nhiều bài/ảnh để xem thiết kế. Nội dung theo chủ đề máy tính cổ, ảnh có credit. Cả hai chạy sau `schema:apply` + `permissions:apply`; CI job `build` chạy cả hai.
- **Production:** không seed; nội dung do Editor nhập.

## 6. Backup & khôi phục (móc nối)

- Chi tiết vận hành & RPO/RTO: [13-operations](./13-operations.md). Cơ chế đặc thù CSDL: `pg_dump -Fc` (định dạng custom) chạy trong service `ops` qua mạng, kèm uploads và cấu hình ([`services/ops/backup.sh`](../services/ops/backup.sh)); khôi phục bằng `pg_restore --no-owner --no-privileges`. Diễn tập: [`scripts/restore-drill.sh`](../scripts/restore-drill.sh).

## 7. Lịch sử thay đổi (activity / revision)

- Mọi collection nội dung đặt `accountability: all` trong snapshot ⇒ Directus ghi **activity** và **revision** (bản trước/sau của từng sửa) vào `directus_activity` / `directus_revisions`, **không tự xoá**. Đây là hành vi hiện thực, không phải yêu cầu ([03e §6](./03e-data-model.md)): không có giao diện/quy trình khôi phục theo revision được ghi trong runbook; đường khôi phục chính thức vẫn là sao lưu. Hai bảng này nằm trong `pg_dump` và tăng dần theo số lần sửa; với một Editor và vài trăm bài thì không đáng kể.

## 8. Quy ước đặt tên vật lý

- Bảng và cột: **snake_case**, tên bảng **số nhiều** (`posts`, `authors`); khoá ngoại dạng `<tên-số-nhiều>_id` ở bảng nối (`posts_id`, `tags_id`), dạng tên quan hệ ở bảng chính (`author`, `category`, `cover`).
- Khác với tên logic ở [03e](./03e-data-model.md): thực thể logic số ít/PascalCase (Post) ↔ bảng số nhiều (`posts`); riêng Media ↔ `directus_files`.
