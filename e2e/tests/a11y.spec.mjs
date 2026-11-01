// Accessibility (WCAG 2.2 AA) — Sprint 11 §B. axe trên mỗi loại trang một mẫu, cả desktop lẫn mobile
// (xem projects). Ngưỡng: 0 vi phạm serious/critical; moderate/minor chỉ ghi lại (đính kèm báo cáo).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGE_KINDS, loadSamples } from './site.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BLOCKING = new Set(['serious', 'critical']);

let samples;
test.beforeAll(async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL });
  samples = await loadSamples(ctx);
  await ctx.dispose();
});

const summarize = (violations) =>
  violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target, summary: n.failureSummary })),
  }));

for (const kind of PAGE_KINDS) {
  test(`axe: «${kind}» không có vi phạm serious/critical`, async ({ page }, testInfo) => {
    expect(samples[kind], `không tìm được trang mẫu «${kind}»`).toBeTruthy();
    await page.goto(samples[kind]);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    const minor = violations.filter((v) => !BLOCKING.has(v.impact ?? ''));
    if (minor.length) {
      await testInfo.attach('axe-moderate-minor.json', {
        body: JSON.stringify(summarize(minor), null, 2),
        contentType: 'application/json',
      });
    }
    expect(summarize(violations.filter((v) => BLOCKING.has(v.impact ?? '')))).toEqual([]);
    // Moderate/minor không chặn, nhưng không để lọt lặng lẽ: xuất ra log để ghi vào "Kết quả" sprint.
    console.log(`[axe] ${kind}: ${violations.length - minor.length} serious/critical, ${minor.length} moderate/minor`);
    for (const v of minor) console.log(`[axe ${v.impact}] ${kind}: ${v.id} — ${v.help} (${v.nodes.length})`);
  });
}

test('axe: lightbox đang mở không có vi phạm serious/critical', async ({ page }) => {
  expect(samples.richPost).toBeTruthy();
  await page.goto(samples.richPost);
  const img = page.locator('.prose img').first();
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  await img.click();
  await expect(page.locator('dialog.lightbox')).toHaveAttribute('open', '');
  // axe không đánh giá được ::backdrop (nền tối của lightbox) nên màu nền nó thấy là nền TRANG →
  // báo tương phản sai (1.05:1) cho nút chữ sáng. Tắt rule ở đây và tự tính tương phản thật bên dưới.
  const { violations } = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(['color-contrast'])
    .analyze();
  expect(summarize(violations.filter((v) => BLOCKING.has(v.impact ?? '')))).toEqual([]);

  const ratio = await page.evaluate(() => {
    const rgba = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const lum = ([r, g, b]) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const dialog = document.querySelector('dialog.lightbox');
    const [br, bg, bb, ba = 1] = rgba(getComputedStyle(dialog, '::backdrop').backgroundColor);
    // Trường hợp xấu nhất: nền trang trắng dưới lớp phủ bán trong suốt.
    const back = [br, bg, bb].map((v) => v * ba + 255 * (1 - ba));
    const fg = rgba(getComputedStyle(document.querySelector('.lightbox__zoom-reset')).color);
    const [l1, l2] = [lum(fg), lum(back)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });
  expect(ratio, 'tương phản chữ nút trong lightbox').toBeGreaterThanOrEqual(4.5);
});

test.describe('bàn phím', () => {
  test('skip-link là phần tử focus đầu tiên, hiện ra khi focus và nhảy tới #main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('a.skip-link');
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box, 'skip-link phải hiện trong khung nhìn khi focus').toBeTruthy();
    expect(box.y + box.height).toBeGreaterThan(0);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    // Tab tiếp theo phải đi vào nội dung chính, không quay lại header.
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(() => !!document.activeElement?.closest('main'));
    expect(inMain).toBe(true);
  });

  test('mọi phần tử tương tác đầu trang đều có dấu hiệu focus nhìn thấy được', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const outline = cs.outlineStyle !== 'none' && Number.parseFloat(cs.outlineWidth) > 0;
        const shadow = cs.boxShadow !== 'none';
        const bg = cs.backgroundColor;
        return { tag: el.tagName, text: (el.textContent ?? '').trim().slice(0, 30), outline, shadow, bg };
      });
      if (!info) continue;
      expect(info.outline || info.shadow, `focus không thấy được trên <${info.tag}> «${info.text}»`).toBe(true);
    }
  });

  test('tìm kiếm dùng được hoàn toàn bằng bàn phím', async ({ page, request }) => {
    const idx = await (await request.get('/search-index.json')).json();
    const word = idx[0].t.split(/\s+/).find((w) => w.length >= 4) ?? idx[0].t;
    await page.goto('/search');
    await expect(page.getByLabel('Từ khoá')).toBeFocused(); // autofocus
    await page.keyboard.type(word);
    await page.keyboard.press('Enter');
    await expect(page.locator('#search-results .post-card').first()).toBeVisible();
    // Tab từ ô tìm → nút «Tìm» → kết quả đầu tiên.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Tìm' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#search-results a').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/posts\/[^/]+$/);
  });
});
