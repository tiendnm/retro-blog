# 13 — Operations (Runbook, Observability, Backup, Incident)

> 🎯 **Mục đích:** Hướng dẫn *vận hành hệ thống khi đã chạy* — thao tác thường ngày, giám sát, sao lưu/khôi phục và xử lý sự cố. Đảm bảo hệ thống chạy ổn định và phục hồi được.
> 🔗 **Liên quan:** [08-deployment](./08-deployment.md) · [12-security](./12-security.md) · [04-database](./04-database.md)

---

## 1. Tổng quan môi trường & topo

**Production (self-host, Sprint 6 — [08-deployment §2](./08-deployment.md), [ADR-0005](./adr/0005-use-docker-packaging.md)/[0007](./adr/0007-reverse-proxy-and-tls.md)/[0008](./adr/0008-rebuild-on-publish.md)):** 1 Docker host, `docker-compose.prod.yml`.

```
                       Internet (qua Cloudflare Tunnel hoặc 80/443)
                              │
                     ┌────────▼─────────┐  Caddy (edge) — auto-TLS ACME
                     │  caddy:2.10      │  (ADR-0007)
                     └───┬──────────┬───┘
        retro.<domain>   │          │   cms.<domain>
        (site tĩnh)      │          │   (Directus admin+API+/assets)
              ┌──────────▼───┐   ┌──▼──────────┐
              │ site_dist    │   │ directus     │ :8055 (không publish)
              │  builds/<TS> │   │ 11.17.4      │
              │  current ───►│   └──┬───────────┘
              └──────▲───────┘      │ retro-net (nội bộ)
     web build-runner│         ┌────▼─────┐
     (astro build →  │         │ postgres │ 16 (trong compose)
      atomic swap)   │         └──────────┘
                     │ rebuild-on-publish (ADR-0008):
              Directus Flow → webhook (token) → web:9000 → build-swap.sh (trong web)
```

| Service | Ảnh | Cổng | Ghi chú |
|---|---|---|---|
| caddy | `caddy:2.10-alpine` | 80/443 (public) | Edge: TLS + serve static `current` + proxy Directus |
| web (build-runner + receiver) | build từ `apps/web/Dockerfile` | — (nội bộ :9000) | Build lần đầu → `site_dist/builds/<TS>` → swap `current`; rồi nghe `POST /rebuild` ([ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md)) |
| directus | `directus/directus:11.17.4` | (không publish) | Chỉ trong mạng compose; public qua Caddy `cms.` |
| postgres | `postgres:16` | — | Trong compose, volume `pgdata` ([ADR-0014](./adr/0014-postgres-in-compose-for-production.md)) |
| ops | build từ `services/ops/Dockerfile` | — | Backup hằng ngày + healthcheck 5 phút; mount `:ro`, không `docker.sock` ([ADR-0017](./adr/0017-ops-services-in-compose.md)) |

> **Volumes:** `directus_uploads`, `site_dist` (builds + `current`), `caddy_data`/`caddy_config`.
> **Dev** ([docker-compose.yml](../docker-compose.yml)): `astro dev` on-demand (:4321), Directus :8055 — không có Caddy/build-runner.

## 2. Runbook — thao tác thường gặp

| Thao tác | Khi nào | Các bước | Rủi ro |
|---|---|---|---|
| Khởi động / dừng hệ thống | Bảo trì máy, tắt điện có kế hoạch | Trong `~/retro-blog`: **backup tay trước** (`docker compose --env-file .env.production exec -T ops sh services/ops/backup.sh`). Dừng: `docker compose --env-file .env.production stop` (giữ dữ liệu; **không** dùng `down -v`). Lên: `docker compose --env-file .env.production up -d --wait --wait-timeout 1200` — Compose tự theo thứ tự phụ thuộc postgres → directus → web (build lần đầu, healthy sau ≤ 15 phút trên J1900) → caddy/ops/cloudflared. Kiểm: `docker compose --env-file .env.production exec -T ops sh services/ops/healthcheck.sh` toàn `OK`. _Chưa chạy thử dừng/lên **cả** stack riêng lẻ (cần downtime vài phút); thứ tự lên đã được `update.sh` thực thi đúng ở lần deploy 2026-11-01._ | Trung bình: site và CMS ngừng suốt thời gian dừng |
| Triển khai phiên bản mới | | Xem [08-deployment](./08-deployment.md). Server tại nhà: `./scripts/update.sh` (đầy đủ, áp lại schema/quyền/Flow/theme, hỏi mật khẩu admin nếu đã đổi) hoặc `./scripts/update.sh --web-only` khi chỉ đổi code web (bỏ qua bước CMS, không cần mật khẩu) — [08a](./08a-deploy-home-tunnel.md) | Thấp |
| Rollback (site) | Deploy/rebuild lỗi | **Atomic swap** về build trước: đổi symlink `current` trong volume `site_dist` sang `builds/<TS-cũ>` (giữ `KEEP_BUILDS` bản). Xem [08 §6](./08-deployment.md) | Thấp (không rebuild) |
| Rebuild site (sau publish) | Nội dung đổi | **Tự động** qua Directus Flow → webhook → `services/rebuild/rebuild.sh` (build + atomic swap; ADR-0008). **Thủ công/fallback:** chạy `sh services/rebuild/rebuild.sh` trên host | Thấp (atomic; fail → giữ bản cũ) |
| Xuất bản bài (publish) | Editor đặt `status=published` | Directus **Flow "Auto set published_at"** (`services/directus/apply-publish-flow.mjs`, Sprint 6.5) tự đặt `published_at = thời điểm hiện tại` **CHỈ khi field còn trống** — vá "bẫy 2 bước" (publish nhưng quên `published_at` → bài ẩn). **Editor vẫn chỉnh `published_at` thủ công** được (vd xuất bản lùi/định ngày); Flow **KHÔNG ghi đè** giá trị đã có. Chạy `emitEvents=false` ⇒ không loop/rebuild thừa. Áp dụng khi deploy: `node services/directus/apply-publish-flow.mjs` | Thấp |
| Khởi động lại Directus / DB | Treo/lỗi, sau đổi env | `docker compose --env-file .env.production restart directus` hoặc `... restart postgres`. Xác nhận: `docker compose --env-file .env.production ps` (cột health = healthy) rồi `healthcheck.sh`. **Đã chạy thử 2026-11-02:** Directus healthy sau **55 giây**; Postgres healthy sau **6 giây** và Directus tự kết nối lại (healthy, healthcheck công khai OK sau đó). Trong lúc khởi động lại: CMS/admin và webhook rebuild gián đoạn (publish trong thời gian này không kích hoạt rebuild → chạy `sh services/rebuild/rebuild.sh`); **site tĩnh vẫn phục vụ** từ volume `site_dist` | Thấp |
| Xoá cache | Trang/ảnh hiển thị bản cũ | Các tầng thực có: (1) **site tĩnh** — không có cache ứng dụng; nội dung cũ = chưa rebuild → `sh services/rebuild/rebuild.sh` (atomic swap); (2) **Directus** — `CACHE_ENABLED` không đặt (mặc định tắt) nên không có gì để xoá; (3) **trình duyệt / Cloudflare** — _chưa kiểm_ Cloudflare có cache HTML của site hay không; nếu có, xoá ở dashboard (Caching → Purge). Caddy không cache | Thấp |

**Container không chạy root (2026-11-01):** `web` và `caddy` chạy uid 1000. Server dựng mới từ đầu không cần làm gì thêm. Server **đã có volume cũ thuộc root** (nâng cấp từ trước mốc này) phải chown một lần, khi hai service đã dừng, rồi mới `update.sh`:
`for v in site_dist caddy_data caddy_config; do docker run --rm -v retro-blog_$v:/v alpine chown -R 1000:1000 /v; done`
(đã làm trên server nhà). **Rate limit Directus:** nhật ký có dòng `WARN: Custom IP header didn't return valid IP address: undefined` cho yêu cầu nội bộ (web build, ops) — bình thường, vì chúng không đi qua Cloudflare; yêu cầu công khai khi quá 100/10 giây sẽ nhận 429 và tự hết sau vài giây.

**Nâng phiên bản Directus (quy trình đã dùng 2026-11-01, 11.3.5 → 11.17.4):** (1) đọc mục *Potential Breaking Changes* của các release ở giữa; (2) lấy backup mới nhất về máy (`db.dump` + `uploads.tgz`, không lấy `env.bak`), khôi phục vào Postgres tạm cùng Directus bản mới; (3) chạy đúng các bước `setup_cms` (schema apply, permissions, Flow, theme), build site từ bản mới và so với bản đang chạy — phải giống hệt; thử thêm `/assets`, `/users` (403), rate limit và cài mới trên DB trống; (4) backup ngay trước khi deploy rồi `update.sh` đầy đủ. **Migration của Directus một chiều:** quay lại bản cũ = đặt lại image cũ **và** khôi phục `db.dump` ([§4](#4-sao-lưu--khôi-phục-backup--recovery)).

**Xử lý PR Dependabot (hằng tuần, `.github/dependabot.yml`):** (1) PR đổi image Docker (`node`, `caddy`, `cloudflared`, `postgres`): CI KHÔNG build image nên xanh chưa chứng minh gì → thử thật: web = `docker build` + seed + `astro build` trên stack tạm; Caddy = chạy với `Caddyfile` thật non-root, so header/404 với bản cũ; ops = kiểm gói Alpine (`postgresql16-client`, `rclone`) cài được. Nâng major Postgres không đi qua Dependabot (cần dump/restore). (2) PR npm: từng có lỗi Dependabot **chỉ sửa `apps/web/package.json`, không sửa `apps/web/pnpm-lock.yaml`** → `--frozen-lockfile` fail (`ERR_PNPM_OUTDATED_LOCKFILE`). Nguyên nhân (giả thuyết, CHƯA xác nhận): `pnpm-workspace.yaml` ở gốc khiến Dependabot tìm lockfile ở gốc — đã bỏ file đó (2026-11-01). Lần chạy npm đầu sau khi bỏ đã tới bước giải quyết phụ thuộc nhưng fail vì Dependabot dùng **pnpm 12.10.1** (không đọc `packageManager: pnpm@10.33.2`) và pnpm 12 chặn bản vừa phát hành (`ERR_PNPM_NO_MATURE_MATCHING_VERSION`, `minimumReleaseAge`) — tự hết khi bản đó đủ tuổi; xem log ở tab Actions → *Dependabot Updates*. Nếu lỗi tái diễn: tạo lại lockfile bằng `pnpm install --lockfile-only --ignore-workspace` (pnpm 10.33.2) rồi push lên nhánh PR. Các PR npm cùng sửa lockfile nên merge xong một PR là các PR còn lại conflict → merge `main` vào nhánh và tạo lại lockfile (nhánh đã bị sửa tay thì `@dependabot rebase` không dùng được). (3) PR sửa `.github/workflows/*` cần token `gh` có scope `workflow` (`gh auth refresh -h github.com -s workflow`). (4) PR đổi image web/ops/caddy/cloudflared cần deploy: backup tay → `./scripts/update.sh --web-only` (đợt 2026-11-01 đã làm).

**Marketplace Directus (Settings → Marketplace):** cần `directus` ra được internet để gọi `registry.directus.io`. Host dùng resolver loopback nên DNS nhúng của Docker không có upstream → phải đặt `dns: [1.1.1.1, 1.0.0.1]` cho service (đã có; thiếu thì Marketplace báo 503 sau ~16 giây, `wget registry.directus.io` trong container báo `bad address`). Extension cài từ Marketplace nằm trong volume `directus_extensions` (không nằm trong backup — cài lại được). `MARKETPLACE_TRUST` giữ mặc định `sandbox`: chỉ cài extension chạy trong sandbox; muốn cho phép loại khác phải đặt `all` có chủ đích, vì extension chạy mã trong tiến trình Directus.

## 3. Observability (Log / Metric / Alert)

| Hạng mục | Công cụ (dự kiến) | Ngưỡng cảnh báo |
|---|---|---|
| Logging | `docker compose --env-file .env.production logs --tail 100 <service>` (hoặc `-f`). Driver `json-file` xoay vòng **10 MB × 3 bản/service** (≤ 30 MB mỗi service; Sprint 12, đã deploy 2026-11-01). Nhật ký cũ hơn bị mất khi tạo lại container. Bình thường: `WARN: Custom IP header didn't return valid IP address` của Directus (xem §2) | — |
| Metrics (tài nguyên máy) | Không dựng Prometheus/Grafana (máy 4 GB). [`hostcheck.sh`](../services/ops/hostcheck.sh) chạy cùng healthcheck mỗi 5 phút: đĩa, RAM/swap, kích thước db/uploads/backups, tuổi backup local và R2 (R2 hỏi tối đa mỗi giờ). Xem tay: `docker compose --env-file .env.production exec -T ops sh services/ops/hostcheck.sh` | **FAIL**: đĩa ≥ 85% (xoá `docker builder prune`/ảnh cũ, xem playbook), backup local > 26 giờ, bản mới nhất trên R2 > 26 giờ (kiểm log `ops`, chạy backup tay). **WARN** (chỉ log): RAM khả dụng < 200 MB, swap ≥ 75%. Chỉnh bằng env `DISK_WARN_PCT`, `BACKUP_MAX_AGE_H`, `R2_MAX_AGE_H`, `MEM_MIN_MB`, `SWAP_WARN_PCT` |
| Uptime / Health check | [`services/ops/healthcheck.sh`](../services/ops/healthcheck.sh) chạy mỗi 5 phút trong service `ops` (xem `docker compose --env-file .env.production logs ops`); kiểm site/robots/sitemap, Directus `/server/health`, hạn chứng chỉ TLS. Báo động ngoài host: đặt `HEALTHCHECK_PING_URL` (kiểu healthchecks.io — cảnh báo khi **mất ping**, bắt được cả trường hợp host chết) | Hỏng ≥ 1 lần chạy → `FAIL` trong log `ops` + ping `/fail`; chứng chỉ < 14 ngày |
| Error tracking | **TODO — chờ Product chốt.** Đề xuất mặc định: không dùng dịch vụ ngoài; nguồn lỗi = log container + healthcheck | — |

## 4. Sao lưu & Khôi phục (Backup & Recovery)

Công cụ: [`services/ops/backup.sh`](../services/ops/backup.sh) và [`prune-backups.sh`](../services/ops/prune-backups.sh) chạy **tự động trong service `ops`** ([ADR-0017](./adr/0017-ops-services-in-compose.md)); [`restore.sh`](../services/ops/restore.sh) chạy **tay trên host** (uploads mount `:ro` trong `ops`). Backup tay: `docker compose --env-file .env.production exec ops sh services/ops/backup.sh`. Khôi phục: `ENV_FILE=.env.production PG_VIA_COMPOSE=1 sh services/ops/restore.sh backups/<YYYYMMDD-HHMMSS>` rồi `sh services/rebuild/rebuild.sh`. Restore drill với Postgres-trong-compose: đạt (Sprint 9, dump → DB trống → posts 4=4).

> ✅ **Backup ra ngoài máy (2026-11-01):** sau mỗi lần backup, [`offsite.sh`](../services/ops/offsite.sh) (rclone) đẩy `db.dump` + `uploads.tgz` + config lên **Cloudflare R2** (bucket private, token giới hạn theo bucket), giữ `R2_KEEP` bản mới nhất (mặc định 30). **`env.bak` (secret) KHÔNG lên R2** → khi dựng lại server phải tạo lại secret/token (tunnel lấy ở Cloudflare). Dùng `copy` (không `sync`) nên thư mục local trống sau khi thay ổ không xoá backup trên R2. Kiểm tra kết nối: `docker compose --env-file .env.production exec ops sh services/ops/offsite.sh --check`. Lỗi đẩy chỉ cảnh báo trong log `ops`, lần backup sau tự đẩy bù. Restore drill từ R2: có, xem bảng dưới.

| Hạng mục | Chính sách |
|---|---|
| Sao lưu gì | **database** (`pg_dump -Fc`) · **uploads** (`directus_uploads`) · **config** (schema snapshot, compose, Caddyfile) · **env** (secret — lưu tách/mã hoá). **KHÔNG** `dist/` (tái sinh bằng `astro build`) |
| Tần suất | **Hằng ngày ~03:30** (`BACKUP_AT`, scheduler trong `ops`; máy tắt lúc đó thì chạy bù khi bật lại; lỗi thì thử lại sau 1 giờ) + chạy tay trước mỗi lần deploy/nâng cấp |
| Lưu giữ (retention) | `BACKUP_KEEP` bản gần nhất (mặc định 14), tự dọn bởi [`prune-backups.sh`](../services/ops/prune-backups.sh); thư mục backup `umask 077` |
| Nơi lưu | Host (`backups/`) **và** Cloudflare R2 (bucket `R2_BUCKET`, không kèm `env.bak`); thư mục backup trên host NHẠY CẢM (có DB+secret) |
| **RPO** | ≤ khoảng cách giữa 2 lần backup (hằng ngày → ≤ 24h) |
| **RTO** | ≈ thời gian `restore.sh` (DB+uploads) + `rebuild.sh` (dựng lại static) |
| Diễn tập khôi phục (restore drill) | ✅ [`scripts/restore-drill.sh`](../scripts/restore-drill.sh) (Sprint 12): `./scripts/restore-drill.sh --r2` trên host tải bản mới nhất từ R2, dựng Postgres + Directus **tạm** (cùng image prod, mạng riêng, không cổng, Directus giới hạn 700 MB), so migrations, file uploads, `/server/health`, `/assets`, số bài công khai rồi dọn sạch; không đụng stack đang chạy. **Chạy thật 2026-11-01: ĐẠT, 70 giây** (bản R2 `20261101-234515`: pg_restore OK, migrations 101=101, 12/12 file gốc có trong `uploads.tgz` — tổng 66 file vì Directus lưu cả thumbnail, Directus tạm `health=ok`, bài công khai 1=1, `/assets/<id>` 200; không còn container/mạng/thư mục tạm). Lịch: **mỗi quý** (và sau mỗi lần nâng Directus/Postgres) |

> ⚠️ Backup chưa được kiểm chứng khôi phục = **không có backup**. Restore drill đã đạt (trên); duy trì diễn tập định kỳ.

## 5. Xử lý sự cố (Incident Response)

- **Mức độ (Severity):**
  - **SEV1:** site **hoặc** CMS không truy cập được > 1 giờ; mất/hỏng dữ liệu; nghi lộ secret/token. Xử lý ngay.
  - **SEV2:** một chức năng hỏng nhưng site còn phục vụ (rebuild kẹt, không đăng nhập CMS được, backup hỏng 1 ngày, đĩa ≥ 85%). Trong ngày.
  - **SEV3:** nhỏ, có cách tránh (cảnh báo log, 5xx thoáng qua tự hết). Ghi nhận, xử lý khi tiện.
- **Vai trò:** chỉ một người vận hành — kiêm điều phối, xử lý và liên lạc. Việc cần làm: ghi dòng thời gian ngay khi xử lý (để viết postmortem), không sửa vội khi chưa backup.
- **Kênh liên lạc/cảnh báo:** **email** (healthchecks.io). Cảnh báo ngoài host cần `HEALTHCHECK_PING_URL` (hướng dẫn tạo: xem Kết quả Sprint 12); đã bật 2026-11-02 (healthchecks.io, Period 5 phút / Grace 10 phút; chuyển `up↔down` đã kiểm bằng ping `/fail` có chủ đích). **Kênh liên lạc sự cố = email** (`tien.dnm@outlook.com` qua healthchecks.io; email "UP" đã nhận thật 2026-11-02). Chưa thử kịch bản mất ping do host chết.

### Playbook (mỗi kịch bản: dấu hiệu → kiểm → xử lý)
Mọi lệnh chạy trong `~/retro-blog` trên server (`ssh retro-home`); `D="docker compose --env-file .env.production"`. Cột *Đã thử* ghi rõ lệnh đã chạy thật hay chưa.

| Kịch bản | Kiểm | Xử lý | Đã thử |
|---|---|---|---|
| Site 5xx/530 (tunnel) | `$D ps`; `$D logs --tail 50 cloudflared caddy` | 530/1033 = cloudflared mất kết nối: `$D restart cloudflared`; 502 = Caddy/web: `$D restart caddy`; sau đó `healthcheck.sh` | `ps`/`logs`/healthcheck: ✅. Restart cloudflared/caddy: ❌ chưa |
| CMS không vào được | `$D ps directus`; `$D logs --tail 100 directus` | `$D restart directus` (≈ 55 giây); vẫn lỗi → kiểm Postgres | restart directus ✅ (55 giây) |
| Postgres không lên | `$D logs --tail 100 postgres`; `df -h /` | Hết đĩa → playbook đĩa đầy; hỏng dữ liệu → khôi phục từ backup (§4, `restore.sh`) | restart postgres ✅ (6 giây); khôi phục hỏng: ❌ |
| Đĩa đầy (`hostcheck` FAIL) | `df -h /`; `docker system df`; `du -sh backups` | `docker builder prune -f` (build cache từng 25 GB, 21 GB thu hồi được); `docker image prune -f`; giảm `BACKUP_KEEP`. **Không** `docker volume prune` | `df`/`system df`/`du` ✅; các lệnh prune ❌ |
| Chứng chỉ gần hết hạn | `healthcheck.sh` báo TLS < 14 ngày | Chứng chỉ do Cloudflare quản lý (tunnel) — xem dashboard SSL/TLS; Caddy ACME chỉ khi chạy chế độ không tunnel | ❌ |
| Token/secret bị lộ | — | Xoay vòng ngay: `REBUILD_TOKEN`, mật khẩu admin/DB, token R2, `TUNNEL_TOKEN` (Cloudflare → tạo token mới); sửa `.env.production`, `update.sh` đầy đủ. Hỏi Product trước khi sửa `.env.production` | ❌ (quy trình, không chạy thử) |
| Rebuild kẹt | `$D logs --tail 50 web`; `ls -l` volume `site_dist` | Site cũ vẫn phục vụ (swap nguyên tử). `$D restart web` rồi `sh services/rebuild/rebuild.sh` | ❌ |
| Backup quá cũ / hỏng | `hostcheck.sh` FAIL; `$D logs --tail 50 ops` | Chạy tay `$D exec -T ops sh services/ops/backup.sh`; lỗi R2 → `... offsite.sh --check` | backup tay + offsite ✅; ép FAIL tuổi backup ✅ |
| **Máy hỏng hoàn toàn** | — | Dựng lại máy theo [08a](./08a-deploy-home-tunnel.md); lấy bản mới nhất từ R2 (`offsite.sh --pull`, hoặc rclone từ máy khác); `env.bak` **không** có trên R2 → tạo lại secret/token; `restore.sh`; `rebuild.sh`. Tính khả thi của khôi phục DB+uploads từ R2 đã chứng minh bằng restore drill | Phần khôi phục ✅ (drill 2026-11-01, 70 giây); dựng máy mới từ đầu: ❌ |

### Ví dụ postmortem — 530 thoáng qua (2026-11-01)
```
- Tóm tắt: site/CMS trả 530 trong thời gian ngắn khi container cloudflared khởi động lại (trong đợt deploy).
- Dòng thời gian: chưa ghi lại giờ cụ thể lúc đó — bài học: ghi giờ ngay khi xảy ra.
- Nguyên nhân gốc: cloudflared (tunnel) chưa đăng ký lại kết nối với Cloudflare edge trong lúc khởi động.
- Ảnh hưởng: SEV3, vài giây-phút, tự hết.
- Cách khắc phục: không cần; smoke test của update.sh kiểm "cloudflared đã đăng ký tunnel".
- Hành động phòng ngừa: giữ bước smoke test đó; cảnh báo ngoài host (ping) sẽ báo nếu kéo dài.
```
(Ví dụ viết lại từ ghi chú sprint; giờ chính xác không còn.)

### Mẫu ghi nhận sự cố (Postmortem)
```
- Tóm tắt:
- Dòng thời gian (timeline):
- Nguyên nhân gốc (root cause):
- Ảnh hưởng:
- Cách khắc phục:
- Hành động phòng ngừa (không đổ lỗi cá nhân):
```

## 6. Bảo trì, On-call, Chi phí

- **Người vận hành:** một người (Product/chủ dự án); không có trực ca. Rủi ro đã chấp nhận: không UPS, ổ HDD (mất điện đột ngột/HDD hỏng — bù bằng backup R2).
- **Cửa sổ bảo trì:** đề xuất **sáng sớm 04:00–06:00** (sau backup 03:30), lưu ý site tĩnh vẫn phục vụ khi chỉ khởi động lại Directus.
- **Hằng tuần:** xử lý PR Dependabot (§2) → thử → backup tay → `update.sh --web-only` → xem `hostcheck`/log `ops`. **Hằng quý:** `./scripts/restore-drill.sh --r2` (lần gần nhất: 2026-11-01, đạt); kiểm hạn token R2/Cloudflare.
- **Chi phí hiện có:** tên miền (hằng năm); hạ tầng $0 (điện nhà, Cloudflare Tunnel/DNS gói Free, R2 trong hạn mức miễn phí — kích thước backup hiện ≈ 36 MB × ≤ 30 bản). Theo dõi dung lượng R2 nếu uploads tăng.
