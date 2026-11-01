// Tìm kiếm phía trình duyệt trên /search-index.json.
import { expect, test } from '@playwright/test';

/** Một từ có thật trong chỉ mục, để không bám nội dung seed. */
async function knownWord(request) {
  const idx = await (await request.get('/search-index.json')).json();
  const title = idx[0].t;
  return title.split(/\s+/).find((w) => w.length >= 4) ?? title;
}

const NO_MATCH = 'zzzqqqxxxkhongco';

test('gõ từ khoá có thật → có kết quả, bấm vào mở đúng bài', async ({ page, request }) => {
  const word = await knownWord(request);
  await page.goto('/search');
  await page.getByLabel('Từ khoá').fill(word);
  await expect(page.locator('#search-status')).toContainText('kết quả cho');
  const hits = page.locator('#search-results .post-card');
  await expect(hits.first()).toBeVisible();
  await hits.first().locator('h2 a').click();
  await expect(page).toHaveURL(/\/posts\/[^/]+$/);
});

test('từ khoá không khớp → thông báo không có bài, danh sách rỗng', async ({ page }) => {
  await page.goto('/search');
  await page.getByLabel('Từ khoá').fill(NO_MATCH);
  await expect(page.locator('#search-status')).toContainText('Không có bài nào khớp');
  await expect(page.locator('#search-results .post-card')).toHaveCount(0);
});

test('xoá từ khoá → dọn kết quả và thông báo', async ({ page, request }) => {
  const word = await knownWord(request);
  await page.goto('/search');
  const input = page.getByLabel('Từ khoá');
  await input.fill(word);
  await expect(page.locator('#search-results .post-card').first()).toBeVisible();
  await input.fill('');
  await expect(page.locator('#search-results .post-card')).toHaveCount(0);
  await expect(page.locator('#search-status')).toHaveText('');
});

test('?q= điền sẵn ô tìm và chạy tìm; Enter cập nhật URL', async ({ page, request }) => {
  const word = await knownWord(request);
  await page.goto(`/search?q=${encodeURIComponent(word)}`);
  await expect(page.getByLabel('Từ khoá')).toHaveValue(word);
  await expect(page.locator('#search-results .post-card').first()).toBeVisible();

  await page.getByLabel('Từ khoá').fill(NO_MATCH);
  await page.getByLabel('Từ khoá').press('Enter');
  await expect(page).toHaveURL(new RegExp(`q=${NO_MATCH}`));
  await expect(page.locator('#search-status')).toContainText('Không có bài nào khớp');
});
