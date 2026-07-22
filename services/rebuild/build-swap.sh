#!/bin/sh
# ── build-swap (Sprint 6 Phase 3 — ADR-0008) ───────────────────────────────
# Chạy TRONG web build-runner (image apps/web/Dockerfile); /out = volume site_dist.
# Dùng cho: (a) first-boot (command của service `web` trong docker-compose.prod.yml),
#           (b) rebuild-on-publish (services/rebuild/rebuild.sh gọi lại job này).
#
# Cơ chế: astro build → staging builds/<TS> → ATOMIC SWAP symlink `current` →
# prune giữ N build gần nhất (rollback). Caddy phục vụ /srv/site/current.
set -eu

KEEP="${KEEP_BUILDS:-5}"
TS="$(date +%Y%m%d-%H%M%S)"

echo "[build-swap] astro build → builds/$TS"
pnpm build

mkdir -p "/out/builds/$TS"
cp -a dist/. "/out/builds/$TS/"

# Atomic swap: đổi con trỏ `current` bằng MỘT thao tác (ln -sfn) → Caddy không
# bao giờ phục vụ thư mục dở. Build lỗi ⇒ script thoát trước bước này (set -e) ⇒
# `current` vẫn trỏ bản cũ (an toàn).
ln -sfn "builds/$TS" /out/current
echo "[build-swap] current -> builds/$TS"

# Prune: giữ KEEP build mới nhất (theo mtime), xoá phần dư (giải phóng đĩa, vẫn
# đủ bản cũ cho rollback).
cd /out/builds
ls -1t | tail -n "+$((KEEP + 1))" | xargs -r rm -rf
echo "[build-swap] pruned — giữ $KEEP build gần nhất"
