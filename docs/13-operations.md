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
                     │  caddy:2.8       │  (ADR-0007)
                     └───┬──────────┬───┘
        retro.<domain>   │          │   cms.<domain>
        (site tĩnh)      │          │   (Directus admin+API+/assets)
              ┌──────────▼───┐   ┌──▼──────────┐
              │ site_dist    │   │ directus     │ :8055 (không publish)
              │  builds/<TS> │   │ 11.3.5       │
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
| caddy | `caddy:2.8-alpine` | 80/443 (public) | Edge: TLS + serve static `current` + proxy Directus |
| web (build-runner + receiver) | build từ `apps/web/Dockerfile` | — (nội bộ :9000) | Build lần đầu → `site_dist/builds/<TS>` → swap `current`; rồi nghe `POST /rebuild` ([ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md)) |
| directus | `directus/directus:11.3.5` | (không publish) | Chỉ trong mạng compose; public qua Caddy `cms.` |
| postgres | `postgres:16` | — | Trong compose, volume `pgdata` ([ADR-0014](./adr/0014-postgres-in-compose-for-production.md)) |
| ops | build từ `services/ops/Dockerfile` | — | Backup hằng ngày + healthcheck 5 phút; mount `:ro`, không `docker.sock` ([ADR-0017](./adr/0017-ops-services-in-compose.md)) |

> **Volumes:** `directus_uploads`, `site_dist` (builds + `current`), `caddy_data`/`caddy_config`.
> **Dev** ([docker-compose.yml](../docker-compose.yml)): `astro dev` on-demand (:4321), Directus :8055 — không có Caddy/build-runner.

## 2. Runbook — thao tác thường gặp

| Thao tác | Khi nào | Các bước | Rủi ro |
|---|---|---|---|
| Khởi động / dừng hệ thống | | TODO | |
| Triển khai phiên bản mới | | Xem [08-deployment](./08-deployment.md). Server tại nhà: `./scripts/update.sh` (đầy đủ, áp lại schema/quyền/Flow/theme, hỏi mật khẩu admin nếu đã đổi) hoặc `./scripts/update.sh --web-only` khi chỉ đổi code web (bỏ qua bước CMS, không cần mật khẩu) — [08a](./08a-deploy-home-tunnel.md) | Thấp |
| Rollback (site) | Deploy/rebuild lỗi | **Atomic swap** về build trước: đổi symlink `current` trong volume `site_dist` sang `builds/<TS-cũ>` (giữ `KEEP_BUILDS` bản). Xem [08 §6](./08-deployment.md) | Thấp (không rebuild) |
| Rebuild site (sau publish) | Nội dung đổi | **Tự động** qua Directus Flow → webhook → `services/rebuild/rebuild.sh` (build + atomic swap; ADR-0008). **Thủ công/fallback:** chạy `sh services/rebuild/rebuild.sh` trên host | Thấp (atomic; fail → giữ bản cũ) |
| Xuất bản bài (publish) | Editor đặt `status=published` | Directus **Flow "Auto set published_at"** (`services/directus/apply-publish-flow.mjs`, Sprint 6.5) tự đặt `published_at = thời điểm hiện tại` **CHỈ khi field còn trống** — vá "bẫy 2 bước" (publish nhưng quên `published_at` → bài ẩn). **Editor vẫn chỉnh `published_at` thủ công** được (vd xuất bản lùi/định ngày); Flow **KHÔNG ghi đè** giá trị đã có. Chạy `emitEvents=false` ⇒ không loop/rebuild thừa. Áp dụng khi deploy: `node services/directus/apply-publish-flow.mjs` | Thấp |
| Khởi động lại Directus / DB | Treo/lỗi | TODO | |
| Xoá cache | Dữ liệu cũ | TODO | |

**Container không chạy root (2026-11-01):** `web` và `caddy` chạy uid 1000. Server dựng mới từ đầu không cần làm gì thêm. Server **đã có volume cũ thuộc root** (nâng cấp từ trước mốc này) phải chown một lần, khi hai service đã dừng, rồi mới `update.sh`:
`for v in site_dist caddy_data caddy_config; do docker run --rm -v retro-blog_$v:/v alpine chown -R 1000:1000 /v; done`
(đã làm trên server nhà). **Rate limit Directus:** nhật ký có dòng `WARN: Custom IP header didn't return valid IP address: undefined` cho yêu cầu nội bộ (web build, ops) — bình thường, vì chúng không đi qua Cloudflare; yêu cầu công khai khi quá 100/10 giây sẽ nhận 429 và tự hết sau vài giây.

## 3. Observability (Log / Metric / Alert)

| Hạng mục | Công cụ (dự kiến) | Ngưỡng cảnh báo |
|---|---|---|
| Logging | TBD | — |
| Metrics (CPU/mem/latency) | TBD | TODO |
| Uptime / Health check | [`services/ops/healthcheck.sh`](../services/ops/healthcheck.sh) chạy mỗi 5 phút trong service `ops` (xem `docker compose --env-file .env.production logs ops`); kiểm site/robots/sitemap, Directus `/server/health`, hạn chứng chỉ TLS. Báo động ngoài host: đặt `HEALTHCHECK_PING_URL` (kiểu healthchecks.io — cảnh báo khi **mất ping**, bắt được cả trường hợp host chết) | Hỏng ≥ 1 lần chạy → `FAIL` trong log `ops` + ping `/fail`; chứng chỉ < 14 ngày |
| Error tracking | TBD | TODO |

## 4. Sao lưu & Khôi phục (Backup & Recovery)

Công cụ: [`services/ops/backup.sh`](../services/ops/backup.sh) và [`prune-backups.sh`](../services/ops/prune-backups.sh) chạy **tự động trong service `ops`** ([ADR-0017](./adr/0017-ops-services-in-compose.md)); [`restore.sh`](../services/ops/restore.sh) chạy **tay trên host** (uploads mount `:ro` trong `ops`). Backup tay: `docker compose --env-file .env.production exec ops sh services/ops/backup.sh`. Khôi phục: `ENV_FILE=.env.production PG_VIA_COMPOSE=1 sh services/ops/restore.sh backups/<YYYYMMDD-HHMMSS>` rồi `sh services/rebuild/rebuild.sh`. Restore drill với Postgres-trong-compose: đạt (Sprint 9, dump → DB trống → posts 4=4).

> ✅ **Backup ra ngoài máy (2026-11-01):** sau mỗi lần backup, [`offsite.sh`](../services/ops/offsite.sh) (rclone) đẩy `db.dump` + `uploads.tgz` + config lên **Cloudflare R2** (bucket private, token giới hạn theo bucket), giữ `R2_KEEP` bản mới nhất (mặc định 30). **`env.bak` (secret) KHÔNG lên R2** → khi dựng lại server phải tạo lại secret/token (tunnel lấy ở Cloudflare). Dùng `copy` (không `sync`) nên thư mục local trống sau khi thay ổ không xoá backup trên R2. Kiểm tra kết nối: `docker compose --env-file .env.production exec ops sh services/ops/offsite.sh --check`. Lỗi đẩy chỉ cảnh báo trong log `ops`, lần backup sau tự đẩy bù. Còn thiếu: **restore drill từ R2** (tải về → `restore.sh`).

| Hạng mục | Chính sách |
|---|---|
| Sao lưu gì | **database** (`pg_dump -Fc`) · **uploads** (`directus_uploads`) · **config** (schema snapshot, compose, Caddyfile) · **env** (secret — lưu tách/mã hoá). **KHÔNG** `dist/` (tái sinh bằng `astro build`) |
| Tần suất | **Hằng ngày ~03:30** (`BACKUP_AT`, scheduler trong `ops`; máy tắt lúc đó thì chạy bù khi bật lại; lỗi thì thử lại sau 1 giờ) + chạy tay trước mỗi lần deploy/nâng cấp |
| Lưu giữ (retention) | `BACKUP_KEEP` bản gần nhất (mặc định 14), tự dọn bởi [`prune-backups.sh`](../services/ops/prune-backups.sh); thư mục backup `umask 077` |
| Nơi lưu | Host (`backups/`) **và** Cloudflare R2 (bucket `R2_BUCKET`, không kèm `env.bak`); thư mục backup trên host NHẠY CẢM (có DB+secret) |
| **RPO** | ≤ khoảng cách giữa 2 lần backup (hằng ngày → ≤ 24h) |
| **RTO** | ≈ thời gian `restore.sh` (DB+uploads) + `rebuild.sh` (dựng lại static) |
| Diễn tập khôi phục (restore drill) | ✅ **Đã diễn tập (Sprint 6 Phase 4):** restore `db.dump` vào Postgres sạch → **posts count khớp nguồn (117=117)**, uploads khớp (4=4 file). Lặp lại định kỳ |

> ⚠️ Backup chưa được kiểm chứng khôi phục = **không có backup**. Restore drill đã đạt (trên); duy trì diễn tập định kỳ.

## 5. Xử lý sự cố (Incident Response)

- **Mức độ (Severity):** SEV1 (sập/dữ liệu) · SEV2 (suy giảm) · SEV3 (nhỏ).
- **Vai trò:** người điều phối (IC), người xử lý, người liên lạc.
- **Kênh liên lạc:** TODO.

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

- TODO _(cửa sổ bảo trì, ai trực, theo dõi chi phí hạ tầng)_.
