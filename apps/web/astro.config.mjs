// @ts-check
import { defineConfig } from 'astro/config';

// URL công khai của SITE (canonical/OG/sitemap/robots) — nguồn sự thật DUY NHẤT
// cho địa chỉ tuyệt đối. Tạm dev; chốt domain thật ở Sprint 6 (deploy) bằng
// cách đổi PUBLIC_SITE_URL. `Astro.site` dẫn xuất từ đây.
const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

// Dev server cấu hình cho Docker: bind 0.0.0.0 để cổng container map ra host.
// Render: SSG static-first (ADR-0006) — output 'static' mặc định, route động
// dùng getStaticPaths, KHÔNG cần adapter. Dev (`astro dev`) render on-demand.
export default defineConfig({
  site: SITE_URL,
  server: {
    host: true,
    port: 4321,
  },
});
