# ADR-0017 — Backup & healthcheck chạy trong compose (service `ops`), vận hành bằng user triển khai

> **Status:** Accepted <!-- 2026-10-30, Product duyệt -->
> **Ngày đề xuất:** 2026-10-30 · **Ngày Accepted:** 2026-10-30
> **Người quyết định:** Product
> **Nguyên tắc tuân thủ (Principles):** P4/P5 (self-host, tái lập), P6 (Low coupling). Thay thế phần *systemd timer + user `retro`* của Sprint 8; **giữ nguyên** nội dung backup/restore/healthcheck ([13-operations](../13-operations.md)).

---

## Bối cảnh (Context)

Sprint 8 đưa backup (`backup.sh`, `prune-backups.sh`) và healthcheck (`healthcheck.sh`) vào **systemd timer trên host**, chạy với `User=retro`, đọc `/opt/retro-blog/.env.production`. Thực tế triển khai (Sprint 9) cho thấy:

- Cần **tài khoản `retro` riêng**; máy còn chạy các stack khác do tài khoản `tiendnm` quản lý → người vận hành phải đổi phiên, dễ chạy nhầm lệnh ở nhầm tài khoản.
- Cần `sudo` để cài unit, đọc `.env.production` (quyền 600 của `retro`), và rải file ngoài repo (`/etc/systemd/system`).
- `backup.sh` phải gọi `docker compose exec` từ host để lấy dữ liệu Postgres/uploads — phụ thuộc vào đường dẫn, user và nhóm `docker` của host.

Sau [ADR-0014](./0014-postgres-in-compose-for-production.md) (Postgres trong compose) và [ADR-0016](./0016-rebuild-receiver-in-web-container.md) (webhook trong container), systemd chỉ còn phục vụ backup và healthcheck — đáng để gộp nốt vào compose.

## Quyết định (Decision)

1. Thêm service **`ops`** vào stack production, dựng từ `services/ops/Dockerfile` (base `node:22.12.0-alpine` + PostgreSQL client 16, bash, curl, openssl, tzdata). Một image dùng cho cả vận hành định kỳ và tác vụ chạy một lần (`docker compose run --rm ops <lệnh>`: schema/permissions/Flow/theme — dùng cho script triển khai). Mã dự án **không** nằm trong image: repo được mount chỉ-đọc tại `/repo`.
2. **Lập lịch trong container bằng một vòng lặp `sh` tối giản** (`services/ops/scheduler.sh`, không `crond`, để chạy được **non-root**): backup hằng ngày khi đã qua `BACKUP_AT` (mặc định 03:30, giờ theo `TZ`) và **hôm nay chưa có bản hoàn chỉnh** — nên máy tắt lúc 03:30 thì bật lại sẽ chạy bù (thay cho `Persistent=true`); lỗi thì thử lại sau 1 giờ. Khi khởi động, nếu **không có bản nào trong 24 giờ qua** thì chạy ngay. Healthcheck mỗi 5 phút, chỉ log chi tiết khi FAIL và khi đổi trạng thái. Backup ghi vào `<stamp>.tmp` rồi đổi tên → không bao giờ để lại bản dở.
3. Nguồn dữ liệu qua **mạng và mount chỉ đọc**, **không `docker.sock`**:
   - Database: `pg_dump` tới service `postgres`.
   - Uploads: volume `directus_uploads` mount `:ro` (`/data/uploads`).
   - Config/env: cả repo mount `:ro` tại `/repo` (`.env.production`, compose, Caddyfile, schema).
4. Đích: thư mục host `${BACKUP_DIR:-./backups}` (bind mount, `umask 077`), nên lấy ra ngoài máy bằng `rclone`/`scp` rất dễ. Giữ `BACKUP_KEEP` như cũ.
5. Restore: giữ `services/ops/restore.sh` chạy **trên host** (`PG_VIA_COMPOSE=1`, qua `docker compose exec`) vì việc ghi lại uploads cần quyền ghi vào volume của Directus, mà `ops` mount volume đó **chỉ đọc**. Restore hiếm khi dùng nên chấp nhận.
6. **Không tạo user hệ thống riêng.** Stack chạy dưới **user triển khai** (ở đây `tiendnm`, đã thuộc nhóm `docker`). Container `ops` chạy với `user: "<uid>:<gid>"` của user đó để file backup thuộc đúng chủ sở hữu và đọc/sao chép được không cần `sudo`.
7. **Bỏ hoàn toàn** `services/ops/systemd/*` khỏi đường production. Việc duy nhất còn cần `sudo` là tạo swap (một lần, tuỳ chọn).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4/P5 | ✅ | Toàn bộ vận hành nằm trong repo + compose; không file ngoài repo, không `sudo` thường xuyên |
| P6 | ✅ | Script `backup.sh`/`healthcheck.sh` giữ nguyên logic; chỉ đổi nơi chạy và cách lập lịch |
| Bảo mật | ✅ | Không `docker.sock`; mount `:ro`; backup `umask 077`; `ops` chạy non-root |
| Độ tin cậy | ⚠️ | Không có timer của hệ điều hành: stack dừng ⇒ backup dừng (bản systemd cũng cần Postgres chạy nên không khác nhiều); chạy bù khi khởi động bù lại phần tắt máy lúc 03:30 |
| Tài nguyên | ⚠️ | Thêm một container nhàn rỗi nhỏ; `pg_dump` + `tar` chạy lúc 03:30 trên HDD chậm (đã chấp nhận ở Sprint 9) |
| Tính nhất quán | ⚠️ | Backup DB và uploads không cùng một thời điểm nguyên tử (như bản hiện tại) — chấp nhận cho blog nhỏ |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| **Service `ops` trong compose** (đã chọn) | Một nơi, một lệnh; không systemd/user riêng; chạy bằng user triển khai | Tự viết vòng lặp lịch (nhỏ); mất timer của OS | — |
| Giữ systemd timer + user `retro` (hiện tại) | Timer bền, `Persistent` sẵn | `retro` riêng, `sudo`, file ngoài repo; đổi phiên dễ nhầm | Gây ma sát cho người vận hành một mình |
| systemd timer nhưng chạy bằng `tiendnm` | Bỏ user riêng | Vẫn cài unit ngoài repo bằng `sudo`; vẫn phụ thuộc host | Giải một nửa vấn đề |
| Image backup bên thứ ba (vd. postgres-backup-local) | Có sẵn | Chỉ phủ DB, không uploads/config/healthcheck; thêm phụ thuộc | Thiếu phạm vi, thêm phụ thuộc |
| Scheduler dùng `docker.sock` (kiểu Ofelia) | Lịch chuẩn cron | Cấp quyền root tương đương cho một việc nhỏ | Không cần |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** dựng server không cần `sudo`/user riêng/unit systemd cho vận hành; tất cả lệnh chạy bằng một tài khoản; backup nằm trong thư mục dễ chép ra ngoài.
**Tiêu cực / Đánh đổi:** tự bảo trì vòng lặp lịch; cần test kỹ phần chạy-bù và việc ghi file bằng đúng uid.
**Cần theo dõi:** lệch múi giờ (`TZ`); dung lượng đĩa (HDD); healthcheck gọi URL công khai nên cần mạng ra ngoài hoạt động; image `ops` phải khớp phiên bản `pg_dump` với Postgres 16.x.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** `docker-compose.prod.yml` (thêm `ops`), thư mục `services/ops/` (thêm Dockerfile + `scheduler.sh`, bỏ `systemd/`), tài liệu vận hành [13](../13-operations.md).
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md)/[03c](../03c-content-model.md)/[03d](../03d-api-contract.md)/[03e](../03e-data-model.md); Reader; thin client/DTO.
- **Dữ liệu cần di trú:** không. Định dạng thư mục backup (`db.dump`, `uploads.tgz`, …) giữ nguyên nên bản cũ vẫn restore được.
- **Mức chi phí ước tính:** **Thấp** — quay lại systemd chỉ là khôi phục các unit đã có trong lịch sử git.
