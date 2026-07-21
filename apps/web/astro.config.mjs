// @ts-check
import { defineConfig } from 'astro/config';

// Dev server cấu hình cho Docker: bind 0.0.0.0 để cổng container map ra host.
// (Sprint 1 — chỉ hạ tầng/plumbing; chưa integration/adapter feature.)
export default defineConfig({
  server: {
    host: true,
    port: 4321,
  },
});
