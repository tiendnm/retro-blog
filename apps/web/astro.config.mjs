// @ts-check
import { defineConfig } from 'astro/config';

// Dev server cấu hình cho Docker: bind 0.0.0.0 để cổng container map ra host.
// Render: SSG static-first (ADR-0006) — output 'static' mặc định, route động
// dùng getStaticPaths, KHÔNG cần adapter. Dev (`astro dev`) render on-demand.
export default defineConfig({
  server: {
    host: true,
    port: 4321,
  },
});
