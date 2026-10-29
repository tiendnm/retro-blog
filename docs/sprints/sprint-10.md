# 📦 Sprint 10 — Đóng gói deploy (dựng server bằng 2 lệnh)

> **Trạng thái:** 📝 **Đề xuất — chờ Product duyệt** (2026-10-30) · **Vai trò:** DevOps · **Mục tiêu:** rút quy trình dựng server tại nhà từ ~15 bước tay xuống còn clone + chạy một script. Không đổi Content Model/API/DTO/Reader.
> 🔗 [ADR-0016](../adr/0016-rebuild-receiver-in-web-container.md) · [ADR-0017](../adr/0017-ops-services-in-compose.md) · [08a runbook](../08a-deploy-home-tunnel.md) · [13-operations](../13-operations.md) · [Sprint 9 — kết quả máy thật](./sprint-9.md)

## Bối cảnh
Sprint 9 triển khai thật trên máy nhà (J1900, 4 GB, HDD) thành công nhưng lộ ra phần cồng kềnh: nhiều bước tay, `.env.production` bị ba công cụ đọc ba cách, webhook chạy ngoài container (Node host, `docker0`, ufw, systemd), và phải đổi tài khoản (`retro`) trong khi máy còn chạy stack khác của `tiendnm`. Ba lỗi thực tế (DNS SRV, `REBUILD_HOST`, token có chú thích cuối dòng) đều nằm ở các khâu này.

## Quyết định của Product (2026-10-30)
| # | Quyết định |
|---|---|
| Đóng gói | Mục tiêu là dựng server **nhàn nhất có thể**; chấp nhận thiết kế lại phần vận hành (webhook, backup). |
| Docker | Giả định **Docker + Compose ≥ 2.24 đã cài sẵn** — ngoài phạm vi script. |
| Mật khẩu admin | **Sinh tự động**, in ra một lần. |
| Hostname | **Cố định** `retro.<domain>` và `retro-cms.<domain>`; chỉ hỏi domain gốc. |
| Tài khoản | **Dùng thẳng `tiendnm`**, bỏ user `retro`; mọi lệnh chạy bằng một tài khoản. |
| Backup | **Tích hợp vào stack** (service `ops`), không còn systemd. |
| `docker.sock` | Product chấp nhận được, nhưng **không cần dùng** (ADR-0016: webhook ngay trong `web`). |
| Server hiện tại | Chỉ có nội dung test → **xoá sạch và dựng lại** bằng script mới; đồng thời là bài nghiệm thu. |

## Kịch bản đích
| # | Việc | Ở đâu | Tay? |
|---|---|---|---|
| 1 | Tạo Tunnel `retro-blog`, 2 public hostname → `HTTP caddy:80`, copy `TUNNEL_TOKEN` | Cloudflare dashboard | Có |
| 2 | `git clone https://github.com/tiendnm/retro-blog.git /opt/retro-blog && cd /opt/retro-blog` | Server (`tiendnm`) | Có |
| 3 | `./scripts/deploy-home.sh` → trả lời 3 câu: domain gốc, `TUNNEL_TOKEN`, email admin | Server (`tiendnm`) | Có |
| 4 | Mở `https://retro-cms.<domain>/admin`, đăng nhập bằng mật khẩu in ra, đổi mật khẩu | Trình duyệt | Có |

Vận hành: đăng bài → tự rebuild; cập nhật code → `./scripts/update.sh`.

`deploy-home.sh` tự làm: kiểm tra môi trường (Docker/Compose/RAM/đĩa/cổng-tên container trùng) → swap 2 GB nếu thiếu (hỏi, cần `sudo`) → sinh secret + ghi `.env.production` (quyền 600, mỗi biến một dòng, **không chú thích cuối dòng**) → Postgres + Directus → schema/permissions/Flow/theme (trong container `ops`, profile `setup`) → build site, Caddy, `cloudflared` → smoke test (site 200, tunnel đã đăng ký, webhook 202, API công khai không lộ bài nháp) → in tóm tắt (URL, email, mật khẩu một lần). **Idempotent**: chạy lại bỏ qua phần đã xong, không sinh lại secret.

## Phạm vi (Phases)
- [x] **P1 — Webhook trong `web` ([ADR-0016](../adr/0016-rebuild-receiver-in-web-container.md)):** `webhook.mjs` hỗ trợ `REBUILD_COMMAND`; `web` prod = build lần đầu rồi chạy receiver; healthcheck; Caddy `depends_on: service_healthy`; URL Flow → `http://web:9000/rebuild`; cập nhật `webhook.test.mjs`; bỏ unit systemd + `REBUILD_HOST`.
- [x] **P2 — Service `ops` ([ADR-0017](../adr/0017-ops-services-in-compose.md)):** Dockerfile + `scheduler.sh` (backup 03:30, healthcheck 5 phút, chạy bù nếu bản mới nhất > 24 giờ); mount `:ro` + bind `backups/`; chạy non-root theo uid của user triển khai; `restore` qua `compose run`; profile `setup` cho tác vụ một lần; bỏ `services/ops/systemd/`.
- [x] **P3 — Gọn compose:** bỏ publish cổng Directus ra host; chọn file compose không cần `-f` dài (ưu tiên `COMPOSE_FILE` trong env; nếu Compose không nhận qua `--env-file` thì dùng wrapper `scripts/compose.sh` — **chốt bằng spike ở P3**); giữ DNS `1.1.1.1` cho `cloudflared`.
  - **Kết quả P3 (2026-10-30):** spike — Compose v5 đọc `COMPOSE_FILE` từ `--env-file` (dùng `COMPOSE_PATH_SEPARATOR=,` để chạy được cả trên Windows) ⇒ không cần wrapper; lệnh chuẩn là `docker compose --env-file .env.production <lệnh>`. Directus không còn publish cổng (`ports: !reset []`); `${DIRECTUS_PORT:-8055}` ở base để hết cảnh báo; CI `config -q` không còn `-f`. DNS `1.1.1.1` của cloudflared giữ nguyên.
- [ ] **P4 — Script:** `scripts/deploy-home.sh`, `scripts/update.sh`; kiểm tra bằng `shellcheck` trong CI (job `quality`).
- [ ] **P5 — Tài liệu:** viết lại gọn `08a` (4 việc ở trên + xử lý sự cố), cập nhật `13-operations`, `12-security` (không `docker.sock`, mạng nội bộ), `08-deployment`, `10-decisions`, `adr/README`, roadmap, README.
- [ ] **P6 — Nghiệm thu:** (a) dry-run cục bộ project riêng (cổng/tên riêng, dọn sau) từ trạng thái sạch; (b) **dựng lại trên server thật** từ trạng thái sạch theo đúng 4 việc; đo thời gian dựng, RAM/thời gian build, publish→hiện bài.

**Ngoài phạm vi (Backlog):** tự tạo Tunnel qua Cloudflare API · backup ra ngoài máy (rclone → R2/B2) · nâng HSTS 1 năm · 2FA admin (đã bỏ có chủ đích) · rate limiting Directus · container không chạy root cho các service còn lại · quét dependency · Reader feature / Visual Polish.

## Điểm dừng chờ review (theo [Working Agreement](../17-contributing.md))
1. **Bây giờ:** duyệt bản đề xuất này + ADR-0016/0017 trước khi viết code (thay đổi hạ tầng/bảo mật/kiến trúc).
2. **Trước P6(b):** xin xác nhận rõ ràng trước khi **xoá dữ liệu trên server thật** (dừng stack, xoá volume, gỡ user/unit `retro`).
3. **Cuối sprint:** review kết quả.

## Rủi ro
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| First-boot kẹt vì `web` build lâu hơn `start_period` / `depends_on` đổi | Trung bình | `start_period` đủ dài cho J1900; kiểm chứng ở dry-run và trên máy thật |
| Build lỗi làm chết receiver → mất rebuild-on-publish | Trung bình | Receiver bắt lỗi và vẫn sống, giữ `current` cũ (test bằng build giả lỗi) |
| `ops` ghi file backup sai chủ sở hữu (uid) | Trung bình | Chạy `user: uid:gid` của user triển khai; test đọc/copy không `sudo` |
| `pg_dump` khác phiên bản server | Thấp | Pin client 16; xác minh gói có trên base image ở P2, dự phòng đổi base |
| Chạy lại script sau khi đã đổi mật khẩu admin → `LOGIN FAILED` | Trung bình | Đánh dấu bước đã xong (state file); chỉ hỏi lại mật khẩu khi dùng `--reconfigure` |
| RAM 4 GB: thêm `web` thường trực + `ops` | Thấp | Cả hai nhàn rỗi nhỏ; giữ `NODE_OPTIONS` giới hạn heap build; đo ở P6 |
| Xoá nhầm dữ liệu khi dựng lại | Cao (nếu xảy ra) | Điểm dừng #2; nội dung hiện chỉ là bài test; chạy `backup` trước khi xoá |

## Definition of Done
- Dựng được stack **từ máy sạch** chỉ bằng 4 việc ở "Kịch bản đích", không cần Node/systemd/`sudo` ngoài bước swap.
- Smoke test của script đạt; publish bài → site cập nhật; draft không lộ.
- Backup chạy theo lịch từ service `ops`, **restore thử thành công**, file backup đọc/chép được bằng user triển khai.
- `docker.sock` không được mount ở bất kỳ service nào; không cổng nào mở ra host ngoài cổng đã công bố.
- CI xanh (gồm `shellcheck` và test webhook cập nhật); tài liệu khớp thực tế; không còn tham chiếu `retro` user / systemd trong đường production.
- Có số liệu đo thật từ máy nhà (thời gian dựng, RAM, build, publish→hiện).

## Kết quả
### P1 — Webhook trong container `web` ✅ (dry-run cục bộ, project riêng `retro-p1`, đã dọn)
| Hạng mục | Kiểm chứng |
|---|---|
| Test receiver | 10 test `node --test` (thêm: `resolveCommand`, `runShell` exit code, không spawn được → `done(-1)` đúng 1 lần, build lỗi không làm trigger kẹt); kiểm đột biến (bỏ chốt "gọi done 1 lần") → 1 test đỏ |
| Compose | `config` hợp lệ cho prod và prod+tunnel với `.env.production.example` (đúng bước CI); `web`: không publish cổng, `restart: unless-stopped`, healthcheck mới (`current` tồn tại + receiver lắng nghe, `start_period` 15 phút) |
| First boot | `web` healthy → Caddy mới khởi động (`depends_on: service_healthy`); site qua Caddy 200 |
| Receiver | từ container Directus: sai token → 404, thiếu token → 404, đúng token → 202 và build chạy (`code 0`) |
| Flow end-to-end | PATCH `site_settings` → Flow gọi `http://web:9000/rebuild` → build + swap thành công |
| Build lỗi | dừng Directus rồi POST → build `code 1`, **`web` vẫn sống & healthy, `current` giữ nguyên, site vẫn 200**; bật lại Directus → lần sau build `code 0` |
| Retry lần đầu | build đầu lỗi → thử lại `BUILD_RETRIES` lần rồi vẫn chạy receiver |
| Khởi động lại | `restart web` → healthy sau ~vài giây, site 200 |
| Fallback | `rebuild.sh` đổi thành "gọi receiver trong container" (trước đó `compose run web` sẽ chạy entrypoint mới và không thoát) → trả 202 |

### P2 — Service `ops` ✅ (dry-run cục bộ, project riêng `retro-p2`, đã dọn)
| Hạng mục | Kiểm chứng |
|---|---|
| Image | `services/ops/Dockerfile` build được; `pg_dump` 16.15, Node 22.12, bash 5.2, curl có sẵn; chạy non-root (uid 1000 trong dry-run) |
| Backup trong container | không docker: `pg_dump` qua mạng, uploads từ volume `:ro`, config/env từ repo `:ro` → bản đủ `db.dump`, `uploads.tgz`, schema, compose, Caddyfile, `env.bak`, README; không còn `.tmp` |
| Lập lịch | khởi động chưa có bản nào trong 24 giờ → chạy bù ngay; restart không sinh bản trùng; "hôm nay chưa có bản" (bản cũ đổi sang hôm qua) → chạy ở vòng lặp đầu |
| Lỗi | Postgres không với tới → `pg_dump` lỗi, **không để lại bản dở**, số bản giữ nguyên |
| Dọn bản cũ | `BACKUP_KEEP=3` → xoá bản cũ nhất; thêm dọn `*.tmp` bị bỏ dở > 24 giờ |
| Healthcheck | OK → log chuyển trạng thái; dừng Caddy → `health FAIL` kèm chi tiết; bật lại → `health OK`; heartbeat → `ops` báo healthy |
| Restore drill | đặt giá trị A → backup bằng `ops` → đổi thành B → `restore.sh` (host, `PG_VIA_COMPOSE=1`) → quay về A |
| Tác vụ một lần | `apply-permissions.sh` (bash+curl+node, chạy 2 lần: idempotent), `apply-rebuild-flow.mjs`, `apply-theme.mjs` chạy trong `ops` → **dựng server không cần Node trên host** |

**Thay đổi kèm theo:** gỡ toàn bộ `services/ops/systemd/`; `backup.sh` ghi `<stamp>.tmp` rồi đổi tên + hỗ trợ `UPLOADS_DIR`; `apply-permissions.sh` ưu tiên biến môi trường trước `.env` (sửa quirk phát hiện ở P1); **`.env.production` được thêm vào `.gitignore` của repo** (trước đây chỉ nhờ `.gitignore_global` trên máy dev — trên server clone mới có thể bị `git add -A` commit nhầm); ADR-0017 cập nhật cho khớp (restore giữ chạy trên host vì uploads mount `:ro`).
**Chưa kiểm chứng:** ghi file backup đúng chủ sở hữu trên Linux thật (`DEPLOY_UID`/`GID` — dry-run trên Windows không phân biệt uid) và đọc/chép không `sudo`; `HEALTHCHECK` qua Cloudflare thật; RAM/thời gian `pg_dump` trên J1900+HDD → P6.

**Đã gỡ (P1):** `services/ops/systemd/retro-rebuild-webhook.service`, `REBUILD_HOST` (file mẫu env), `host.docker.internal` (mặc định URL Flow).
**Phát hiện:** `apply-permissions.sh` tự `source` file `.env` ở thư mục gốc và **ghi đè** `ADMIN_*` truyền vào (chỉ ảnh hưởng máy dev; trong container `ops` không có `.env` đó) — xử lý ở P4. Git Bash trên Windows đổi đường dẫn `/directus/...` khi `docker exec` (cần `MSYS_NO_PATHCONV=1`), không ảnh hưởng Linux.
**Chưa kiểm chứng:** thời gian build lần đầu và RAM trên J1900 (đo ở P6).
**Còn lại ở P5 (tài liệu vẫn nhắc cơ chế cũ):** `08a §1/§6` (ufw 9000, systemd webhook), `12-security`, `13-operations`, `08-deployment`.
