// @ts-check
// Cấu hình MÁY CHỦ XEM TRƯỚC bản nháp (SSR, Node) — tách khỏi astro.config.mjs (site công khai vẫn SSG thuần).
//   build : astro build --config astro.preview.config.mjs   → dist-preview/
//   chạy  : node dist-preview/server/entry.mjs               (HOST/PORT từ env)
// Chỉ có route trong preview/pages (một trang bài); tài nguyên tĩnh (font, og-default…) dùng chung public/.
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './preview',
  publicDir: './public',
  outDir: './dist-preview',
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  // Phục vụ dưới /preview của site chính (Caddy chuyển tiếp /preview/* KHÔNG cắt tiền tố) → link tài nguyên có base.
  base: '/preview',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { build: { assetsInlineLimit: 0 } },
  server: { host: true, port: Number(process.env.PORT ?? 4322) },
});
