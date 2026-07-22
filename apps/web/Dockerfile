# ── Web build-runner (Sprint 6 — ADR-0007/0008) ────────────────────────────
# Ảnh chứa deps (cài TÁI LẬP bằng --frozen-lockfile) + source. SSG build chạy
# lúc RUNTIME (cần Directus qua network nội bộ để fetch nội dung published) →
# sinh `dist/` tĩnh; rebuild script (ADR-0008) copy dist → ATOMIC SWAP vào thư
# mục Caddy phục vụ (ADR-0007).
#
# Vì sao build ở runtime (không bake nội dung vào ảnh):
#   nội dung đổi thường xuyên → rebuild-on-publish chỉ chạy `astro build` + swap,
#   KHÔNG rebuild Docker image mỗi lần publish. Ảnh chỉ cần dựng lại khi đổi
#   source/deps. Tách sạch "image tái lập" khỏi "nội dung động".
# Serve: do Caddy (service riêng, ADR-0007) — nên KHÔNG cần runtime-server stage.

FROM node:22.12.0-alpine

WORKDIR /app
ENV CI=1

# pnpm pin cứng (khớp packageManager trong package.json). Cài deps TRƯỚC source
# để tận dụng cache layer; --frozen-lockfile ⇒ cài đúng theo pnpm-lock.yaml,
# fail nếu lockfile lệch (chống drift → build tái lập).
RUN npm i -g pnpm@10.33.2
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Source (sau deps để cache layer deps không vỡ khi chỉ đổi source).
COPY . .

# URL nội bộ để fetch content lúc build (server-side, không token → vai Public).
# PUBLIC_SITE_URL / PUBLIC_DIRECTUS_URL set qua ENV lúc chạy (compose prod /
# rebuild script) để canonical/OG/sitemap + asset dùng domain thật.
ENV DIRECTUS_INTERNAL_URL=http://directus:8055

# Build SSG rồi phát dist ra /out (mount volume; rebuild script staging → swap).
# Nếu không mount /out, dist vẫn nằm ở /app/dist.
CMD ["sh", "-c", "pnpm build && mkdir -p /out && rm -rf /out/* && cp -a dist/. /out/ && echo 'dist -> /out OK'"]
