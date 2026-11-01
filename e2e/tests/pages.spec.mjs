// Sức khoẻ mỗi loại trang: mã trạng thái, không lỗi console (kể cả vi phạm CSP), không request hỏng,
// không tràn ngang. Chạy cả desktop lẫn mobile (xem projects trong playwright.config.mjs).
import { expect, test } from '@playwright/test';
import { PAGE_KINDS, loadSamples } from './site.mjs';

let samples;
test.beforeAll(async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL });
  samples = await loadSamples(ctx);
  await ctx.dispose();
});

for (const kind of PAGE_KINDS) {
  test(`trang mẫu «${kind}» khoẻ mạnh`, async ({ page }) => {
    const path = samples[kind];
    expect(path, `không tìm được trang mẫu «${kind}» trong sitemap`).toBeTruthy();

    const problems = [];
    page.on('console', (m) => {
      // «Failed to load resource» chỉ lặp lại lỗi HTTP/mạng đã được bắt riêng ở dưới (và 404 là chủ ý ở trang 404).
      if (m.text().startsWith('Failed to load resource')) return;
      if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) =>
      problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`),
    );
    page.on('response', (r) => {
      const isDocument404 = kind === 'notFound' && r.url().endsWith(path);
      if (r.status() >= 400 && !isDocument404) problems.push(`HTTP ${r.status()}: ${r.url()}`);
    });

    const res = await page.goto(path);
    expect(res?.status()).toBe(kind === 'notFound' ? 404 : 200);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.locator('main#main').count()).toBe(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'trang tràn ngang').toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}
