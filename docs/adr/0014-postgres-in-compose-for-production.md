# ADR-0014 — Production chạy PostgreSQL trong compose (thay ADR-0010 cho production)

> **Status:** Accepted <!-- 2026-10-07 -->
> **Ngày đề xuất:** 2026-10-07 · **Ngày Accepted:** 2026-10-07
> **Người quyết định:** Product (đồng ý bỏ Postgres-ngoài-compose cho production)
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) — vẫn là adapter PostgreSQL, chỉ đổi *nơi chạy*; P4/P5 (tái lập, self-host). Thay thế **một phần** [ADR-0010](./0010-external-postgres-instance.md): ADR-0010 vẫn đúng cho **dev**.

---

## Bối cảnh (Context)

ADR-0010 dùng instance Postgres có sẵn trên máy dev (`host.docker.internal:5433`). Trên server production mới (máy nhà 4 GB RAM, Linux) không có sẵn instance đó; tự cài Postgres trên host rồi cho container truy cập qua docker0 (`listen_addresses`, `pg_hba.conf`, firewall) rườm rà, dễ sai, và làm production phụ thuộc vào trạng thái của host.

## Quyết định (Decision)

- `docker-compose.prod.yml` có service **`postgres`** (`postgres:16.8-alpine`, pin cứng), volume `pgdata`, **không publish cổng**, healthcheck `pg_isready`, tinh chỉnh nhẹ cho máy nhỏ (`shared_buffers=128MB`, `max_connections=30`).
- Directus phụ thuộc `postgres` healthy; `.env.production`: `DB_HOST=postgres`, `DB_PORT=5432`.
- Backup/restore dùng `PG_VIA_COMPOSE=1` → `pg_dump`/`pg_restore` chạy **trong container** `postgres` (không cần client Postgres trên host).
- **Dev giữ nguyên** ADR-0010 (`docker-compose.yml` không đổi).

## Đánh đổi

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4/P5 | ✅ | Toàn bộ production nằm trong compose, dựng lại bằng một lệnh |
| P6 | ✅ | Chỉ đổi nơi chạy adapter |
| — | ⚠️ | Dữ liệu nằm trong named volume `pgdata`: `docker compose down -v` **xoá dữ liệu** → cần backup (xem 13-operations) |

## Hệ quả

- ➕ Production tự đủ, không cần cài Postgres trên host; đồng nhất với CI.
- ➖ Tự chịu nâng cấp phiên bản Postgres (major upgrade cần dump/restore).
- ➖ HDD đơn + không backup ngoài máy = rủi ro mất dữ liệu (đã được Product biết và chấp nhận ở thời điểm này).

## Khả nghịch

Cao: đổi `DB_HOST/DB_PORT` về instance ngoài và bỏ service `postgres` khỏi file prod.
