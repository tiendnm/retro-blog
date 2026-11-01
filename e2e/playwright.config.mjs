// Playwright — chạy trên dist/ đã build, phục vụ bằng serve.mjs (không cần Directus).
// Biến: DIST (mặc định ../apps/web/dist), ASSET_ORIGIN (PUBLIC_DIRECTUS_URL lúc build), PORT.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4321);
const DIST = process.env.DIST ?? '../apps/web/dist';
const ASSET_ORIGIN = process.env.ASSET_ORIGIN ?? 'https://cms.example.test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // không giấu flaky bằng retry: tiêu chí xong là 10 lần xanh liên tiếp
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `node serve.mjs ${DIST} ${PORT} --asset-origin=${ASSET_ORIGIN}`,
    url: `http://127.0.0.1:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // Chromium với viewport/UA điện thoại (không cần WebKit/Firefox).
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
