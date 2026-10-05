# ADR-0010 — Dùng PostgreSQL instance có sẵn trên host (ngoài compose)

> **Status:** Accepted <!-- 2026-10-06 -->
> **Ngày đề xuất:** 2026-10-06 · **Ngày Accepted:** 2026-10-06
> **Người quyết định:** Product
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) — vẫn là adapter PostgreSQL; chỉ đổi *nơi chạy* (tầng RÌA). Bổ sung (không thay thế) [ADR-0004](./0004-use-postgresql-content-store.md).

---

## Bối cảnh (Context)

Compose ban đầu dựng Postgres riêng (`postgres:16.8-alpine`, volume `pgdata`, không expose). Product chỉ định dùng **instance PostgreSQL 16 có sẵn trên máy ở cổng 5433** (user `postgres`), để không chạy thêm một DB server cho mỗi dự án.

## Quyết định (Decision)

- Xoá service `postgres` và volume `pgdata` khỏi `docker-compose.yml`.
- Dùng **database riêng `retro-blog`** trên instance có sẵn (cùng instance, DB tách biệt với các dự án khác).
- Directus kết nối qua `DB_HOST=host.docker.internal`, `DB_PORT=5433` (`extra_hosts: host-gateway` cho Linux).
- Backup/restore (`services/ops/*.sh`) dùng `pg_dump`/`pg_restore` của **host** (client ≥ 16) thay vì `docker compose exec postgres`.
- Tên DB có dấu `-` ⇒ trong SQL phải đặt trong nháy kép (`"retro-blog"`).

## Hệ quả (Consequences)

- ➕ Không phải chạy/duy trì thêm container DB; tái dùng instance đã có.
- ➖ Hạ tầng DB **ngoài** vòng đời compose: `docker compose down -v` không xoá dữ liệu; tạo DB là bước thủ công (`CREATE DATABASE "retro-blog"`).
- ➖ Dev dùng `postgres/postgres` (superuser, chỉ local). **Production** cần user/mật khẩu riêng, quyền hạn chế, và DB host cấu hình qua `.env.production`.
- ➖ CI (Sprint 7 Phase 3) **không** thấy Postgres của máy này → CI dựng Postgres riêng (`services:` của Actions); quyết định này không áp dụng cho CI.
- ➖ Restore drill (Sprint 6) đã diễn tập với Postgres trong compose → cần lặp lại với cơ chế mới.

## Khả nghịch

Cao: thêm lại service `postgres` vào compose và đổi 5 biến `DB_*`.
