# 13 — Operations (Runbook, Observability, Backup, Incident)

> 🎯 **Mục đích:** Hướng dẫn *vận hành hệ thống khi đã chạy* — thao tác thường ngày, giám sát, sao lưu/khôi phục và xử lý sự cố. Đảm bảo hệ thống chạy ổn định và phục hồi được.
> 🔗 **Liên quan:** [08-deployment](./08-deployment.md) · [12-security](./12-security.md) · [04-database](./04-database.md)

---

## 1. Tổng quan môi trường & topo

**Production (self-host, Sprint 6 — [08-deployment §2](./08-deployment.md), [ADR-0005](./adr/0005-use-docker-packaging.md)/[0007](./adr/0007-reverse-proxy-and-tls.md)/[0008](./adr/0008-rebuild-on-publish.md)):** 1 Docker host, `docker-compose.prod.yml`.

```
                       Internet (80/443)
                              │
                     ┌────────▼─────────┐  Caddy (edge) — auto-TLS ACME
                     │  caddy:2.8       │  (ADR-0007)
                     └───┬──────────┬───┘
        retro.<domain>   │          │   cms.<domain>
        (site tĩnh)      │          │   (Directus admin+API+/assets)
              ┌──────────▼───┐   ┌──▼──────────┐
              │ site_dist    │   │ directus     │ :8055 (bind 127.0.0.1, không public)
              │  builds/<TS> │   │ 11.3.5       │
              │  current ───►│   └──┬───────────┘
              └──────▲───────┘      │ retro-net (nội bộ)
     web build-runner│         ┌────▼─────┐
     (astro build →  │         │ postgres │ 16 (ngoài compose)
      atomic swap)   │         └──────────┘
                     │ rebuild-on-publish (ADR-0008):
              Directus Flow → webhook (token) → rebuild.sh → build-swap.sh
```

| Service | Ảnh | Cổng | Ghi chú |
|---|---|---|---|
| caddy | `caddy:2.8-alpine` | 80/443 (public) | Edge: TLS + serve static `current` + proxy Directus |
| web (build-runner) | build từ `apps/web/Dockerfile` | — | Chạy-1-lần: `astro build` → `site_dist/builds/<TS>` → swap `current` |
| directus | `directus/directus:11.3.5` | 127.0.0.1:8055 | Chỉ localhost host; public qua Caddy `cms.` |
| postgres | instance host (PG 16, :5433) | — | Ngoài compose, DB `retro-blog` ([ADR-0010](./adr/0010-external-postgres-instance.md)); không còn volume `pgdata` |

> **Volumes:** `directus_uploads`, `site_dist` (builds + `current`), `caddy_data`/`caddy_config`.
> **Dev** ([docker-compose.yml](../docker-compose.yml)): `astro dev` on-demand (:4321), Directus :8055 — không có Caddy/build-runner.

## 2. Runbook — thao tác thường gặp

| Thao tác | Khi nào | Các bước | Rủi ro |
|---|---|---|---|
| Khởi động / dừng hệ thống | | TODO | |
| Triển khai phiên bản mới | | Xem [08-deployment](./08-deployment.md) | |
| Rollback (site) | Deploy/rebuild lỗi | **Atomic swap** về build trước: đổi symlink `current` trong volume `site_dist` sang `builds/<TS-cũ>` (giữ `KEEP_BUILDS` bản). Xem [08 §6](./08-deployment.md) | Thấp (không rebuild) |
| Rebuild site (sau publish) | Nội dung đổi | **Tự động** qua Directus Flow → webhook → `services/rebuild/rebuild.sh` (build + atomic swap; ADR-0008). **Thủ công/fallback:** chạy `sh services/rebuild/rebuild.sh` trên host | Thấp (atomic; fail → giữ bản cũ) |
| Xuất bản bài (publish) | Editor đặt `status=published` | Directus **Flow "Auto set published_at"** (`services/directus/apply-publish-flow.mjs`, Sprint 6.5) tự đặt `published_at = thời điểm hiện tại` **CHỈ khi field còn trống** — vá "bẫy 2 bước" (publish nhưng quên `published_at` → bài ẩn). **Editor vẫn chỉnh `published_at` thủ công** được (vd xuất bản lùi/định ngày); Flow **KHÔNG ghi đè** giá trị đã có. Chạy `emitEvents=false` ⇒ không loop/rebuild thừa. Áp dụng khi deploy: `node services/directus/apply-publish-flow.mjs` | Thấp |
| Khởi động lại Directus / DB | Treo/lỗi | TODO | |
| Xoá cache | Dữ liệu cũ | TODO | |

## 3. Observability (Log / Metric / Alert)

| Hạng mục | Công cụ (dự kiến) | Ngưỡng cảnh báo |
|---|---|---|
| Logging | TBD | — |
| Metrics (CPU/mem/latency) | TBD | TODO |
| Uptime / Health check | [`services/ops/healthcheck.sh`](../services/ops/healthcheck.sh) chạy mỗi 5 phút bằng systemd timer ([`services/ops/systemd/`](../services/ops/systemd/README.md)); kiểm site/robots/sitemap, Directus `/server/health`, hạn chứng chỉ TLS. Báo động ngoài host: đặt `HEALTHCHECK_PING_URL` (kiểu healthchecks.io — cảnh báo khi **mất ping**, bắt được cả trường hợp host chết) | Hỏng ≥ 1 lần chạy → `FAIL` trong journal + ping `/fail`; chứng chỉ < 14 ngày |
| Error tracking | TBD | TODO |

## 4. Sao lưu & Khôi phục (Backup & Recovery)

Công cụ (Sprint 6): [`services/ops/backup.sh`](../services/ops/backup.sh) (`pnpm backup`) · [`restore.sh`](../services/ops/restore.sh) (`pnpm restore <dir>`).

| Hạng mục | Chính sách |
|---|---|
| Sao lưu gì | **database** (`pg_dump -Fc`) · **uploads** (`directus_uploads`) · **config** (schema snapshot, compose, Caddyfile) · **env** (secret — lưu tách/mã hoá). **KHÔNG** `dist/` (tái sinh bằng `astro build`) |
| Tần suất | **Hằng ngày ~03:30** (`retro-backup.timer`, systemd — [mẫu](../services/ops/systemd/README.md)) + chạy tay trước mỗi lần deploy/nâng cấp |
| Lưu giữ (retention) | `BACKUP_KEEP` bản gần nhất (mặc định 14), tự dọn bởi [`prune-backups.sh`](../services/ops/prune-backups.sh); thư mục backup `umask 077` |
| Nơi lưu | **Tách khỏi host prod** (object storage/máy khác); thư mục backup NHẠY CẢM (có DB+secret) → mã hoá |
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
