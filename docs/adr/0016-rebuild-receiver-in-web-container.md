# ADR-0016 — Webhook rebuild chạy trong container `web` (thay cơ chế host + systemd của ADR-0008)

> **Status:** Accepted <!-- 2026-10-30, Product duyệt -->
> **Ngày đề xuất:** 2026-10-30 · **Ngày Accepted:** 2026-10-30
> **Người quyết định:** Product
> **Nguyên tắc tuân thủ (Principles):** P4/P5 (self-host, tái lập — một lệnh compose), P6 (Low coupling). Thay thế **một phần** [ADR-0008](./0008-rebuild-on-publish.md): chỉ phần *nơi chạy* receiver và cách kích hoạt build; Flow → webhook → build → atomic swap giữ nguyên.

---

## Bối cảnh (Context)

ADR-0008 chạy receiver `services/rebuild/webhook.mjs` **trên host** (systemd), receiver gọi `rebuild.sh` → `docker compose run --rm web` (job build một lần). Khi triển khai thật trên máy nhà (Sprint 9, 2026-10-30) cơ chế này sinh ra nhiều điểm hỏng:

- Cần **Node 22 trên host** chỉ để chạy receiver và vài script.
- Directus (trong container) phải gọi ra host qua `host.docker.internal` = IP `docker0` → phải đặt `REBUILD_HOST`, mở rule `ufw` cho dải Docker; sai một trong hai là `ECONNREFUSED`.
- `.env.production` bị **ba công cụ đọc theo ba cách** (Compose, bash, systemd `EnvironmentFile`): chú thích cuối dòng làm token sai → webhook trả 404.
- Phải có unit systemd và một user riêng (`User=retro`) → người vận hành phải đổi phiên/tài khoản.

Trong khi đó container `web` **đã có sẵn mọi thứ để rebuild**: toolchain (pnpm, Node), mã nguồn đã bake trong image, volume `site_dist` và mạng nội bộ tới Directus. `build-swap.sh` chạy được ngay bên trong nó.

## Quyết định (Decision)

Đưa receiver vào container `web` ở môi trường production:

- `web` trở thành **service chạy dài**: khi khởi động chạy **build lần đầu** (`build-swap.sh`), rồi **chạy receiver** (`webhook.mjs`) lắng nghe `0.0.0.0:9000` **trong mạng compose** (không publish cổng ra host, không route qua Caddy/tunnel).
- Receiver nhận `POST /rebuild` kèm header `x-rebuild-token` như cũ (so sánh hằng-thời-gian, uniform 404, khoá thử sai 429, debounce gộp sự kiện) rồi **chạy `build-swap.sh` trực tiếp** (cấu hình qua biến `REBUILD_COMMAND`; mặc định giữ hành vi cũ để dev/test không đổi).
- Directus Flow gọi `http://web:9000/rebuild` qua mạng compose. Bỏ `host.docker.internal`, `REBUILD_HOST`, rule `ufw` cho cổng 9000.
- Caddy `depends_on: web` đổi từ `service_completed_successfully` sang **`service_healthy`**; healthcheck của `web` = bản build đầu tiên đã xong (`/out/current` tồn tại) và receiver đang lắng nghe.
- **Bỏ** `services/ops/systemd/retro-rebuild-webhook.service` và `services/rebuild/rebuild.sh` khỏi đường production (giữ `rebuild.sh` làm fallback thủ công cho dev nếu còn dùng).
- Cập nhật mã nguồn = `git pull` → `docker compose build web` → `up -d` (recreate `web` → build lại với code mới). Rebuild-on-publish chỉ build lại *nội dung*, không build lại image — đúng như ADR-0008.

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P4/P5 | ✅ | Không cần Node/systemd/user riêng trên host; một lệnh compose |
| P6 | ✅ | Receiver vẫn là script nhỏ; không thêm microservice mới (vẫn đúng ràng buộc ADR-0008) |
| Bảo mật | ✅ | **Không mount `docker.sock`** → không có thành phần nào giữ quyền tương đương root trên host. Receiver chỉ tới được từ mạng compose, vẫn token + khoá thử sai |
| Tài nguyên | ⚠️ | Thêm một tiến trình Node nhàn rỗi thường trực (~vài chục MB) trên máy 4 GB; heap build vẫn giới hạn bởi `NODE_OPTIONS` |
| Khả năng quan sát | ⚠️ | Log rebuild nằm trong `docker compose logs web` thay vì `journalctl` |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| **Receiver trong `web`** (đã chọn) | Bỏ host-side hoàn toàn; không đặc quyền mới | `web` chạy dài; healthcheck/depends_on đổi | — |
| Giữ receiver trên host + systemd (hiện tại) | Đã chạy được | Node host, `docker0`, ufw, 3 cách đọc env, đổi tài khoản — đã gây 3 lỗi khi triển khai thật | Quá cồng kềnh cho người vận hành một mình |
| Container riêng + mount `docker.sock` | Giữ `docker compose run` | `docker.sock` = quyền root tương đương trên host; thêm một service chỉ để gọi lại `web` | Có thể dùng nhưng không cần: `web` tự build được. Có thể bổ sung `docker-socket-proxy` nếu sau này cần |
| Directus extension chạy build | Gọn, không webhook | Image Directus không có toolchain; kéo mã build vào CMS | Trộn trách nhiệm, tăng bề mặt tấn công của CMS |
| CI/CD ngoài (GitHub Actions) | Có lịch sử build | Phụ thuộc dịch vụ ngoài + secret; nặng cho blog nhỏ | Đã loại ở ADR-0008 |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** dựng server không cần Node/systemd/ufw cho webhook; loại cả ba lớp lỗi gặp ở Sprint 9 (địa chỉ `docker0`, token/EnvironmentFile, tài khoản); không có đặc quyền mới.
**Tiêu cực / Đánh đổi:** `web` chạy thường trực; thay đổi `depends_on`/healthcheck cần kiểm kỹ để first-boot không bị kẹt (build lần đầu lâu trên J1900, cần `start_period` đủ dài).
**Cần theo dõi:** RAM khi build chạy cùng Postgres + Directus; hành vi khi build lỗi (container phải sống, giữ `current` cũ); tần suất publish cao (debounce hiện có).

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** `docker-compose.prod.yml` (service `web`), `services/rebuild/webhook.mjs` (+ test), URL trong Directus Flow (`apply-rebuild-flow.mjs`).
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md)/[03c](../03c-content-model.md)/[03d](../03d-api-contract.md)/[03e](../03e-data-model.md); Reader; thin client/DTO.
- **Dữ liệu cần di trú:** không.
- **Mức chi phí ước tính:** **Thấp** — tầng RÌA/vận hành; quay lại cơ chế host chỉ là khôi phục unit systemd và URL Flow.
