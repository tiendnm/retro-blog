# 08a — Runbook: dựng server tại nhà + Cloudflare Tunnel

> 🎯 **Mục đích:** Đưa Retro Blog lên máy tại nhà (Intel J1900, 4 GB RAM, HDD) và công khai qua **Cloudflare Tunnel**, không mở cổng nào. Chỉ **4 việc tay**, còn lại do script.
> 🔗 **Liên quan:** [08-deployment](./08-deployment.md) · [ADR-0014](./adr/0014-postgres-in-compose-for-production.md) · [ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md) · [ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md) · [ADR-0017](./adr/0017-ops-services-in-compose.md) · [13-operations](./13-operations.md)

Giả định: domain (vd `tiendnm.com`) ở Cloudflare; site `retro.<domain>`, CMS `retro-cms.<domain>` (**cố định**, chỉ hỏi domain gốc); máy Linux (Ubuntu/Debian) đã cài **Docker + Compose ≥ 2.24**; mọi lệnh chạy bằng **một tài khoản** thuộc nhóm `docker` (vd `tiendnm`) — không cần user riêng, không cần Node/systemd trên host.

## 0. Rủi ro đã được chấp nhận

- **Không UPS:** mất điện = site tắt; HDD có thể hỏng dữ liệu nếu tắt đột ngột (Postgres chịu được crash, nhưng vẫn là rủi ro).
- **Không bật 2FA cho admin (2026-10-30):** `/admin` công khai qua tunnel, chỉ bảo vệ bằng mật khẩu → mật khẩu admin do script sinh ngẫu nhiên, dùng tài khoản Editor cho việc viết bài hằng ngày. Bật lại khi cần (Profile → Two-Factor Authentication).
- **Chưa backup ra ngoài máy:** một ổ HDD hỏng = mất toàn bộ nội dung. Backup tự động (§4) chỉ cứu lỗi phần mềm. Khi sẵn sàng, thêm rclone → Cloudflare R2/Backblaze B2 (thư mục `backups/` là bind mount, dễ lấy ra).

## 1. Việc tay #1 — Tạo Tunnel (Cloudflare dashboard)

1. **Zero Trust → Networks → Tunnels → Create a tunnel** → loại **Cloudflared**, tên `retro-blog`.
2. Chọn **Docker**, **chỉ sao chép `TUNNEL_TOKEN`** (chuỗi dài sau `--token`). Không chạy lệnh nó đưa ra — compose chạy `cloudflared`.
3. Tab **Public Hostname**, thêm 2 mục **cùng một service**:

   | Hostname | Service |
   |---|---|
   | `retro.<domain>` | `HTTP` → `caddy:80` |
   | `retro-cms.<domain>` | `HTTP` → `caddy:80` |

   Cloudflare tự tạo DNS (CNAME). SSL/TLS để mặc định hoặc **Full** (tunnel đã mã hoá).

> Zero Trust có thể yêu cầu xác nhận gói/phương thức thanh toán lúc đăng ký lần đầu — chọn gói **Free**.

## 2. Việc tay #2–#3 — Clone và chạy script (trên server, bằng `tiendnm`)

```bash
sudo install -d -o "$USER" -g "$USER" /opt/retro-blog     # một lần, nếu /opt/retro-blog chưa có
git clone https://github.com/tiendnm/retro-blog.git /opt/retro-blog
cd /opt/retro-blog
./scripts/deploy-home.sh
```

Script hỏi **3 thứ**: domain gốc, `TUNNEL_TOKEN`, email admin. Rồi tự làm:

1. Kiểm tra môi trường (Docker/Compose, RAM, đĩa; **hỏi** tạo swap 2 GB nếu RAM thấp — bước duy nhất cần `sudo`).
2. Sinh secret, ghi `.env.production` (quyền 600, mỗi biến một dòng, không chú thích cuối dòng), điền `DEPLOY_UID/GID` từ `id`.
3. Dựng Postgres + Directus → áp schema, quyền, Flow rebuild-on-publish, theme (trong container `ops`).
4. Dựng toàn stack: `web` (build site lần đầu **5–15 phút** trên J1900), Caddy, `cloudflared`, `ops`.
5. Smoke test (site/CMS qua Caddy, webhook từ chối token sai, API công khai, `/users` bị chặn, tunnel đã đăng ký) và in tóm tắt — kèm **mật khẩu admin, chỉ hiện một lần**.

Chạy lại script an toàn (idempotent): bỏ qua phần đã xong, **không sinh lại secret**. Làm lại từ đầu: xoá `.deploy-state` (và `.env.production` nếu muốn secret mới — Directus đã tạo admin bằng mật khẩu cũ, nên cần xoá luôn volume).

Tuỳ chọn: `DEPLOY_COMPOSE_FILE=docker-compose.yml,docker-compose.prod.yml` (VPS không dùng tunnel; Caddy tự lấy TLS và cần mở 80/443), `ASSUME_YES=1` (tự đồng ý tạo swap).

## 3. Việc tay #4 — Đăng nhập

Mở `https://retro-cms.<domain>/admin` bằng email + mật khẩu in ra → **đổi mật khẩu ngay**. Kiểm tra từ mạng khác (4G): `https://retro.<domain>`.

## 4. Vận hành hằng ngày

Mọi lệnh compose chạy ở `/opt/retro-blog` và **không cần `-f`** (danh sách file nằm trong `COMPOSE_FILE` của `.env.production`):

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f web        # rebuild-on-publish
docker compose --env-file .env.production logs -f ops        # backup + healthcheck
```

| Việc | Cách |
|---|---|
| Đăng bài | Admin → publish → Flow gọi `http://web:9000/rebuild` → site tự cập nhật (~1–3 phút trên J1900) |
| Cập nhật code | `./scripts/update.sh` (git pull → build lại image → `up -d` → áp lại schema/quyền/Flow → smoke test). Chỉ đổi code web (giao diện, script): `./scripts/update.sh --web-only` — bỏ qua bước áp CMS nên **không hỏi mật khẩu admin** |
| Backup | Tự động ~03:30 hằng ngày vào `backups/` (chạy bù khi bật lại máy sau khi tắt); xem [13 §4](./13-operations.md) |
| Healthcheck | Tự động mỗi 5 phút trong `ops`; thêm `HEALTHCHECK_PING_URL` (healthchecks.io) để biết khi cả máy/mạng sập |
| Rebuild tay | `sh services/rebuild/rebuild.sh` (POST vào receiver trong `web`) |
| Khôi phục | [13 §4](./13-operations.md) (`restore.sh`, chạy trên host) |

## 5. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp → cách xử lý |
|---|---|
| `cloudflared` restart, lỗi `Couldn't resolve SRV record … server misbehaving` | Router nhà không xử lý SRV. `docker-compose.tunnel.yml` đã đặt DNS `1.1.1.1`; nếu vẫn lỗi, host đang chặn DNS ra ngoài (`resolvectl status`). |
| Site/CMS 502 hoặc Cloudflare error 1033 | Tunnel chưa kết nối: `logs cloudflared` phải có `Registered tunnel connection`; kiểm tra 2 public hostname trỏ `HTTP caddy:80`. |
| Script báo Directus `unhealthy` ở lần đầu | Lần đầu chạy migration lâu (>2 phút, lâu hơn trên máy yếu); đã đặt `start_period` 300s. Cứ chạy lại script. |
| Bài đăng nhưng site không đổi | `logs web` xem build; Flow trong Directus (Settings → Flows) xem lỗi. Webhook trả **404** nghĩa là sai token/method/path (cố ý đồng nhất); **429** là khoá tạm do gọi sai nhiều lần. `REBUILD_TOKEN` trong `.env.production` phải ≥ 32 ký tự và **không có chú thích cuối dòng**. Đổi token xong chạy `./scripts/update.sh` để áp lại Flow. |
| Build chết giữa chừng/hết RAM | Tạo swap (script đã hỏi); `current` luôn giữ bản cũ nên site không sập. `KEEP_BUILDS` giữ N bản để rollback. |
| `pull access denied for retro-web` (hoặc `retro-ops`) | Vô hại: ảnh `retro-web:prod`, `retro-ops:prod` chỉ có local, Compose thử pull rồi tự build. |
| Ghi file backup lỗi quyền | `backups/` phải thuộc `DEPLOY_UID` (user chạy script). Đừng chạy script bằng `sudo`. |

## 6. Sau go-live

- Sau vài tuần ổn định: nâng HSTS lên 1 năm (`Caddyfile`).
- Reboot thử một lần: mọi service `restart: unless-stopped` phải tự lên; `ops` chạy bù backup nếu lỡ giờ.
- Cân nhắc: UPS nhỏ; backup ra ngoài máy; thay HDD bằng SSD.
