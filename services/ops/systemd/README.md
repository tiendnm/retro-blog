# systemd units (Linux host)

> ℹ️ **Webhook rebuild không còn dùng systemd** (Sprint 10 P1, [ADR-0016](../../../docs/adr/0016-rebuild-receiver-in-web-container.md)): receiver chạy trong container `web`. Backup/healthcheck sẽ chuyển tiếp vào service `ops` ở P2 ([ADR-0017](../../../docs/adr/0017-ops-services-in-compose.md)).

Mẫu để chạy **backup hằng ngày** và **health check** như dịch vụ/timer trên server production.
Giả định repo ở `/opt/retro-blog`, chạy bằng user `retro` (thuộc nhóm `docker`), file env `/opt/retro-blog/.env.production`.
**Đổi đường dẫn/user cho khớp server** trước khi cài.

```bash
sudo cp services/ops/systemd/*.service services/ops/systemd/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now retro-backup.timer retro-healthcheck.timer
systemctl list-timers 'retro-*'
```

| Unit | Việc | Lịch |
|---|---|---|
| `retro-backup.service` + `.timer` | `services/ops/backup.sh` (+ giữ `BACKUP_KEEP` bản) | hằng ngày ~03:30 |
| `retro-healthcheck.service` + `.timer` | `services/ops/healthcheck.sh` | mỗi 5 phút |

Biến cần có trong `.env.production` (xem `.env.production.example`): `SITE_DOMAIN`, `CMS_DOMAIN`, `DB_*`; tuỳ chọn `HEALTHCHECK_PING_URL`, `BACKUP_DIR`, `BACKUP_KEEP`.

> ⚠️ **Chưa kiểm chứng trên server thật.** Cú pháp unit đã qua `systemd-analyze verify` (Debian 12); các script đã được test
> riêng; chỉ phần ghép vào systemd cần xác nhận khi deploy (`systemctl status`, `journalctl`, kích hoạt thử bằng
> `sudo systemctl start retro-backup.service`).
>
> ⚠️ **Backup phải được copy ra NGOÀI host** (object storage/máy khác, mã hoá) — backup chỉ nằm trên cùng ổ đĩa không cứu được
> sự cố mất host. `env.bak` chứa secret: mã hoá trước khi đẩy đi.

Chuẩn bị một lần: `sudo useradd -r -m -G docker retro`; `sudo install -d -o retro -m 700 /var/backups/retro-blog`;
repo + `.env.production` thuộc user `retro` (`chmod 600 .env.production`).
