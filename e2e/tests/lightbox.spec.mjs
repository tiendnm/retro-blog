// Lightbox xem ảnh trong thân bài, gồm hồi quy f754767 (ảnh rộng bị cắt đáy do max-height:% vô hiệu).
import { expect, test } from '@playwright/test';
import { loadSamples } from './site.mjs';

async function openFirstImage(page, request) {
  const { richPost } = await loadSamples(request);
  expect(richPost, 'cần bài có ảnh trong thân (seed showcase)').toBeTruthy();
  await page.goto(richPost);
  const img = page.locator('.prose img').first();
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  await img.click();
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toHaveAttribute('open', '');
  return dialog;
}

test('bấm ảnh mở lightbox, Esc đóng', async ({ page, request }) => {
  const dialog = await openFirstImage(page, request);
  await expect(dialog.locator('.lightbox__img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
});

test('ảnh rộng nằm trọn trong khung nhìn (không bị cắt đáy)', async ({ page, request }) => {
  const dialog = await openFirstImage(page, request);
  const big = dialog.locator('.lightbox__img');
  await expect.poll(() => big.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  const box = await big.boundingBox();
  const vp = page.viewportSize();
  expect(box).toBeTruthy();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 0.5);
  // Và không bị cắt bởi khung xem (stage).
  const stage = await dialog.locator('.lightbox__stage').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(stage.y + stage.height + 1);
});

test('đóng bằng Esc xong, focus không kẹt trong dialog', async ({ page, request }) => {
  const dialog = await openFirstImage(page, request);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
  const inDialog = await page.evaluate(() => !!document.activeElement?.closest('dialog.lightbox'));
  expect(inDialog).toBe(false);
});

test('mở bằng bàn phím: focus ảnh, Enter mở, Esc đóng', async ({ page, request }) => {
  const { richPost } = await loadSamples(request);
  await page.goto(richPost);
  const img = page.locator('.prose img.zoomable').first();
  await img.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toHaveAttribute('open', '');
});
