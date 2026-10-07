# 08a — Runbook: dựng server tại nhà + Cloudflare Tunnel

> 🎯 **Mục đích:** Từng bước đưa Retro Blog lên máy tại nhà (Intel J1900, 4 GB RAM, HDD) và công khai qua **Cloudflare Tunnel**, không mở cổng nào. Làm **một lần**.
> 🔗 **Liên quan:** [08-deployment](./08-deployment.md) · [ADR-0014](./adr/0014-postgres-in-compose-for-production.md) · [ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md) · [13-operations](./13-operations.md) · [systemd units](../services/ops/systemd/README.md)

Giả định: domain `tiendnm.com` ở Cloudflare; site `retro.tiendnm.com`, CMS `retro-cms.tiendnm.com`; máy chạy Linux (Debian/Ubuntu), repo ở `/opt/retro-blog`, user `retro`.

> ⚠️ **Đã kiểm chứng cục bộ (Windows + Docker):** compose prod ở chế độ tunnel (Postgres trong compose, build site, Caddy HTTP, header bảo mật, cookie `Secure`, backup + restore). **Chưa kiểm chứng trên J1900 thật** và **chưa kiểm phần kết nối tunnel tới Cloudflare** (cần tài khoản thật). Mỗi bước dưới đây có "kiểm tra" để bạn tự xác nhận.

## 0. Rủi ro đã được chấp nhận (ghi lại để nhớ)

- **Không UPS:** mất điện = site tắt; HDD có thể hỏng dữ liệu nếu tắt đột ngột (Postgres chịu được crash, nhưng vẫn là rủi ro).
- **Chưa backup ra ngoài máy:** một ổ HDD hỏng = mất toàn bộ nội dung. Backup cục bộ (§8) chỉ cứu lỗi phần mềm, **không** cứu hỏng ổ. Khi sẵn sàng, thêm rclone → Cloudflare R2/Backblaze B2.

## 1. Chuẩn bị máy (một lần)

```bash
# Cập nhật + công cụ cơ bản
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl git ufw

# Docker Engine + Compose v2: làm theo https://docs.docker.com/engine/install/ (apt repo chính thức)
docker --version && docker compose version     # kiểm tra: Compose v2.24+ (cần cho !override/!reset)

# User chạy dịch vụ
sudo useradd -r -m -s /bin/bash -G docker retro
sudo install -d -o retro -g retro /opt/retro-blog /var/backups/retro-blog
```

**Swap (khuyến nghị với 4 GB RAM)** — đệm khi `astro build`:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h        # kiểm tra: Swap 2.0Gi
```

**Firewall:** không cần mở cổng vào nào (tunnel chỉ kết nối ra ngoài).
```bash
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow from 192.168.0.0/16 to any port 22 proto tcp   # SSH chỉ từ LAN; chỉnh dải mạng nhà bạn
# Cho container Directus gọi webhook rebuild trên host (xem §6):
sudo ufw allow from 172.16.0.0/12 to any port 9000 proto tcp
sudo ufw enable && sudo ufw status
```

## 2. Lấy mã nguồn

```bash
sudo -iu retro
cd /opt/retro-blog && git clone https://github.com/tiendnm/retro-blog.git .     # repo public: không cần token/deploy key
```

## 3. Tạo Cloudflare Tunnel (trên dashboard)

1. Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** → loại **Cloudflared**, đặt tên `retro-blog`.
2. Ở bước cài đặt, chọn **Docker** và **chỉ sao chép giá trị `TUNNEL_TOKEN`** (chuỗi dài sau `--token`/`TUNNEL_TOKEN=`). Không chạy lệnh nó đưa ra — compose sẽ chạy `cloudflared`.
3. Thẻ **Public Hostname** — thêm 2 mục, **cùng một service**:
   | Hostname | Service |
   |---|---|
   | `retro.tiendnm.com` | `HTTP` → `caddy:80` |
   | `retro-cms.tiendnm.com` | `HTTP` → `caddy:80` |
   Cloudflare tự tạo bản ghi DNS (CNAME, đã proxy). Không cần tạo tay.
4. (Khuyến nghị) **SSL/TLS** của domain: chế độ **Full** hoặc để mặc định — vì tunnel đã mã hoá, không cần chứng chỉ origin.

> Zero Trust có thể yêu cầu xác nhận gói miễn phí/phương thức thanh toán lúc đăng ký lần đầu — hãy chọn gói **Free** và kiểm tra các điều khoản hiện hành.

## 4. Cấu hình `.env.production`

```bash
cd /opt/retro-blog
cp .env.production.example .env.production && chmod 600 .env.production
# Sinh secret:  openssl rand -hex 32   (cho KEY, SECRET, REBUILD_TOKEN) ; mật khẩu mạnh cho DB_PASSWORD, ADMIN_PASSWORD
nano .env.production
```
Điền (xem file mẫu):
```
SITE_DOMAIN=retro.tiendnm.com
CMS_DOMAIN=retro-cms.tiendnm.com
PUBLIC_URL=https://retro-cms.tiendnm.com
PUBLIC_DIRECTUS_URL=https://retro-cms.tiendnm.com
PUBLIC_SITE_URL=https://retro.tiendnm.com
SITE_ADDRESS=http://retro.tiendnm.com
CMS_ADDRESS=http://retro-cms.tiendnm.com
DB_HOST=postgres   DB_PORT=5432
TUNNEL_TOKEN=<giá trị ở bước 3>
REBUILD_TOKEN=<>= 32 ký tự>   REBUILD_HOST=172.17.0.1
ADMIN_EMAIL=<email thật>      ADMIN_PASSWORD=<mật khẩu mạnh>
```
Thay mọi giá trị `__CHANGE_ME_*__`. **Kiểm tra:** `grep -c CHANGE_ME .env.production` phải bằng `0`.

## 5. Khởi động stack

```bash
cd /opt/retro-blog
export COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.tunnel.yml --env-file .env.production"
$COMPOSE up -d postgres directus            # lần đầu: kéo image (HDD chậm, chờ vài phút)
$COMPOSE ps                                  # kiểm tra: postgres + directus healthy
```
Nạp schema + quyền (một lần, cần Node 22 trên host cho seed/script `.mjs`; hoặc chạy các lệnh trong container Node):
```bash
$COMPOSE exec -T directus npx directus schema apply --yes /directus/snapshots/schema.yaml
DIRECTUS_URL=http://127.0.0.1:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... bash services/directus/apply-permissions.sh
```
(`DIRECTUS_PORT` trong `.env.production` là cổng bind `127.0.0.1` trên host.) Dữ liệu mẫu **không** nạp trên production; tạo nội dung thật qua admin.

Dựng site + bật Caddy + tunnel:
```bash
$COMPOSE up -d                               # chạy job build (astro build → atomic swap) rồi caddy + cloudflared
$COMPOSE logs web | tail                      # kiểm tra: "[build-swap] current -> builds/..."
$COMPOSE logs cloudflared | tail              # kiểm tra: "Registered tunnel connection"
```
**Kiểm tra từ máy khác (4G/wifi khác):** `https://retro.tiendnm.com` (site), `https://retro-cms.tiendnm.com/admin` (đăng nhập).
Sau khi đăng nhập admin: **đổi mật khẩu và bật 2FA** (Settings → Users/Profile).

## 6. Rebuild-on-publish (webhook)

Directus (trong container) gọi webhook chạy trên host qua `host.docker.internal` (= `172.17.0.1` trên Linux). Webhook **chỉ lắng nghe** địa chỉ `REBUILD_HOST`:
```bash
sudo cp services/ops/systemd/*.service services/ops/systemd/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now retro-rebuild-webhook.service
journalctl -u retro-rebuild-webhook -n 20      # kiểm tra: "receiver lắng nghe 172.17.0.1:9000"
```
Tạo Flow rebuild-on-publish:
```bash
REBUILD_WEBHOOK_URL=http://host.docker.internal:9000/rebuild REBUILD_TOKEN=... \
ADMIN_EMAIL=... ADMIN_PASSWORD=... DIRECTUS_URL=http://127.0.0.1:8055 node services/directus/apply-rebuild-flow.mjs
DIRECTUS_URL=http://127.0.0.1:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... node services/directus/apply-theme.mjs
```
**Kiểm tra:** tạo một bài `published` trong admin → ~1–2 phút sau xuất hiện trên site (HDD + J1900 build chậm hơn máy dev). Draft không được lộ.

> Nếu webhook không tới được từ container: `docker0` có thể không phải `172.17.0.1` — kiểm `ip -4 addr show docker0` và đặt `REBUILD_HOST` cho khớp; rule `ufw` ở §1 cần bao dải này.

## 7. Giám sát

```bash
sudo systemctl enable --now retro-healthcheck.timer
journalctl -u retro-healthcheck -n 20           # kiểm tra: toàn "OK"
```
Khuyến nghị thêm **ping ngoài máy** (HEALTHCHECK_PING_URL, kiểu healthchecks.io) để biết khi **cả máy/mạng nhà sập** (health check chạy trên chính máy đó nên không tự báo được).

## 8. Backup cục bộ (chưa ra ngoài máy)

```bash
sudo systemctl enable --now retro-backup.timer
sudo systemctl start retro-backup.service && ls -la /var/backups/retro-blog     # kiểm tra: có thư mục YYYYMMDD-HHMMSS
```
Khôi phục: [13-operations §4](./13-operations.md) (`PG_VIA_COMPOSE=1 sh services/ops/restore.sh <thư-mục>`).

## 9. Việc sau go-live

- Sau vài tuần ổn định: nâng HSTS lên 1 năm (`Caddyfile`).
- Đặt `services/ops` timers chạy tự khởi động sau mất điện (`enable` đã lo); kiểm bằng cách reboot thử một lần.
- Cân nhắc: UPS nhỏ; backup ra ngoài máy; thay HDD bằng SSD (giảm nguy cơ hỏng + build nhanh hơn).
