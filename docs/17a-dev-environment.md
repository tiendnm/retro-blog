# 17a — Môi trường dev local

> 🎯 **Mục đích:** Dựng nhanh môi trường dev trên một máy mới, và kéo **bản sao dữ liệu production** về để review giao diện/nội dung mà không đụng server.
> 🔗 **Liên quan:** [README gốc (Getting Started)](../README.md) · [17-contributing](./17-contributing.md) · [ADR-0010](./adr/0010-external-postgres-instance.md) · [08a-deploy-home-tunnel](./08a-deploy-home-tunnel.md)

---

## 1. Hình dung nhanh

| Thành phần | Chạy ở đâu | Địa chỉ |
|---|---|---|
| Site (Astro dev) | container `web` của `docker-compose.yml` | `http://localhost:4321` |
| Directus (CMS) | container `directus` | `http://localhost:8055` |
| PostgreSQL 16 | **ngoài compose**, container riêng ở cổng host `5433` ([ADR-0010](./adr/0010-external-postgres-instance.md)) | `host.docker.internal:5433`, DB `retro-blog` |

- Production khác dev: Postgres nằm **trong** compose ([ADR-0014](./adr/0014-postgres-in-compose-for-production.md)).
- Container Postgres local trên máy chủ dự án tên `pg-clone-local` (image `postgres:16`, volume `pg_clone_data`) là instance **dùng chung nhiều dự án** — trong đó có DB `retro-blog`, cạnh các DB khác. Đừng xoá/recreate container này; chỉ thao tác trên DB `retro-blog`.

## 2. Dựng từ đầu trên máy mới

1. Làm theo [Getting Started](../README.md) để có `.env` (từ `.env.example`) và Docker chạy được.
2. Cần một Postgres lắng nghe `5433` với user/mật khẩu khớp `DB_USER`/`DB_PASSWORD` trong `.env`. Nếu chưa có:
   ```bash
   docker run -d --name pg-clone-local -p 5433:5432 \
     -e POSTGRES_PASSWORD=<DB_PASSWORD trong .env> \
     -v pg_clone_data:/var/lib/postgresql/data postgres:16
   ```
3. Hoặc **kéo dữ liệu thật về** (mục 3) — DB, bài viết và ảnh đều có sẵn, không cần seed. Hoặc tạo DB trống rồi `docker compose up -d` + `pnpm schema:apply` + seed như README.

## 3. Kéo dữ liệu production về local

```bash
sh scripts/dev-pull-prod.sh          # chạy từ gốc repo, ~1 phút
```

Điều kiện: `ssh retro-home` dùng được (key riêng, xem [08a](./08a-deploy-home-tunnel.md)); container Postgres local đang chạy; Docker Desktop mở.

Script ([`scripts/dev-pull-prod.sh`](../scripts/dev-pull-prod.sh)):
1. `pg_dump -Fc` DB production và `tar` thư mục uploads của Directus qua ssh — **phía server chỉ đọc**.
2. Dừng `directus`/`web` local, **đổi tên** DB local hiện có thành `retro-blog_old_<giờ>` (không xoá), tạo DB mới và `pg_restore`.
3. Bật Directus, nạp uploads, bật `web`, rồi xoá thư mục tạm.

Cần biết:
- **Đăng nhập Directus local bằng tài khoản admin của server**, không phải `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` (chỉ dùng cho DB trống).
- Dump chứa hash mật khẩu và token thật → script ghi vào thư mục tạm quyền `077` và xoá khi xong; `KEEP_DUMP=1` để giữ (khi đó tự xoá sau). Không commit, không gửi đi đâu.
- Các biến: `SSH_HOST`, `REMOTE_DIR`, `PG_CONTAINER`, `PGDB`, `SKIP_UPLOADS=1` (bỏ ảnh cho nhanh) — xem đầu file script.
- Mỗi lần chạy sinh thêm một DB `…_old_<giờ>`; dọn bằng `DROP DATABASE` (script in sẵn lệnh).

## 4. Bẫy thường gặp khi dev

- **Sửa file trên Windows mà trang không đổi:** Vite trong container `web` không nhận sự kiện thay đổi file qua bind mount từ Windows → sau khi sửa CSS/TS chạy `docker compose restart web` (mất ~1 phút vì container chạy `pnpm install` mỗi lần khởi động), rồi tải lại trang (Ctrl+F5).
- **Chỉ web đổi code, Directus không:** Directus đọc DB; đổi schema thì dùng `pnpm schema:apply`, không cần restart web.
- **Lỗi `FORBIDDEN … status` khi gọi `/items/posts` không đăng nhập:** bình thường — role Public không có quyền trường `status`.
- **Cổng bận:** `4321` (web), `8055` (Directus), `5433` (Postgres) phải trống.

## 5. Kiểm tra trước khi commit

Chạy trong `apps/web`: `pnpm exec biome lint .` · `pnpm exec biome format .` · `pnpm exec astro check` · `pnpm exec vitest run`. Ở gốc repo: `node scripts/check-docs.mjs`. CI chạy lại các bước này (+ `shellcheck` cho script `.sh`) — xem [14-quality-gates](./14-quality-gates.md).

## 6. Review giao diện nhiều theme

Ô **Giao diện** ở header đổi theme ngay (lưu ở `localStorage` khoá `retro-theme`, riêng từng trình duyệt). Xoá lựa chọn: `localStorage.removeItem('retro-theme')` rồi tải lại → về theme mặc định. Chi tiết token/theme: [07b §3.6](./07b-design-system.md).
