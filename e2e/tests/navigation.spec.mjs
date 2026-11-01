// Luồng điều hướng chính + phân trang + 404 + điểm cuối kỹ thuật + điều hướng mobile.
import { expect, test } from '@playwright/test';

// Thẻ bài: trang chủ/chuyên mục dùng cả .paper-card (nổi bật) lẫn .post-card (danh sách).
const CARD = '.post-card, .paper-card';
const CARD_LINK = '.post-card h2 a, .paper-card h2 a';
const pager = (page) => page.getByRole('navigation', { name: 'Phân trang' });

test('trang chủ → bài → chuyên mục → thẻ → tác giả', async ({ page }) => {
  await page.goto('/');
  await page.locator(CARD_LINK).first().click();
  await expect(page).toHaveURL(/\/posts\/[^/]+$/);
  await expect(page.locator('h1')).toBeVisible();

  const cat = page.locator('main a[href^="/category/"]').first();
  await expect(cat).toBeVisible();
  await cat.click();
  await expect(page).toHaveURL(/\/category\/[^/]+$/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator(CARD).first()).toBeVisible();

  // Thẻ và tác giả: đi từ một bài trong chuyên mục.
  await page.locator(CARD_LINK).first().click();
  const tag = page.locator('main a[href^="/tag/"]').first();
  if (await tag.count()) {
    await tag.click();
    await expect(page).toHaveURL(/\/tag\/[^/]+$/);
    await expect(page.locator(CARD).first()).toBeVisible();
    await page.locator(CARD_LINK).first().click();
  }
  await page.locator('main a[href^="/author/"]').first().click();
  await expect(page).toHaveURL(/\/author\/[^/]+$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('phân trang: Sau → trang 2 → Trước → trang 1', async ({ page }) => {
  await page.goto('/');
  await expect(pager(page), 'cần > 1 trang bài (seed showcase)').toBeVisible();
  await expect(pager(page).locator('[aria-current="page"]')).toHaveText('1');
  await expect(pager(page).locator('.pagination__link--disabled')).toHaveText('← Trước');

  await pager(page).getByRole('link', { name: 'Sau →' }).click();
  await expect(page).toHaveURL(/\/page\/2$/);
  await expect(pager(page).locator('[aria-current="page"]')).toHaveText('2');
  await expect(page.locator(CARD).first()).toBeVisible();

  await pager(page).getByRole('link', { name: '← Trước' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(pager(page).locator('[aria-current="page"]')).toHaveText('1');
});

test('phân trang: bấm số trang cuối → nút Sau bị vô hiệu', async ({ page }) => {
  await page.goto('/');
  const last = pager(page).locator('a.pagination__page').last();
  const n = (await last.textContent())?.trim();
  await last.click();
  await expect(page).toHaveURL(new RegExp(`/page/${n}$`));
  await expect(pager(page).locator('.pagination__link--disabled')).toHaveText('Sau →');
});

test('trang 404: mã 404, nội dung đúng, về được trang chủ', async ({ page }) => {
  const res = await page.goto('/khong-co-trang-nay');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  await page.getByRole('link', { name: '← Về trang chủ' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('slug bài không tồn tại → 404', async ({ request }) => {
  const res = await request.get('/posts/bai-nhap-khong-ton-tai');
  expect(res.status()).toBe(404);
});

test.describe('điểm cuối kỹ thuật', () => {
  // Content-Type thật do web server (Caddy) quyết định theo đuôi file; server thử không mô phỏng
  // header RSS riêng → kiểm đúng loại NỘI DUNG, riêng robots.txt kiểm cả text/plain.
  test('rss.xml là RSS 2.0 có mục', async ({ request }) => {
    const res = await request.get('/rss.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.trimStart()).toMatch(/^<\?xml[^>]*\?>\s*<rss\b[^>]*version="2\.0"/);
    expect(body).toMatch(/<item>/);
  });

  test('sitemap.xml là urlset có URL tuyệt đối', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<urlset\b[^>]*sitemaps\.org/);
    expect(body).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/);
  });

  test('robots.txt là văn bản thuần, trỏ tới sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^text\/plain/);
    expect(await res.text()).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  });

  test('search-index.json là JSON mảng không rỗng', async ({ request }) => {
    const res = await request.get('/search-index.json');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data) && data.length > 0).toBe(true);
  });
});

test('điều hướng chính dùng được ở mọi viewport (kể cả mobile)', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  for (const name of ['Trang chủ', 'Chuyên mục', 'Lưu trữ', 'Tìm kiếm']) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await nav.getByRole('link', { name: 'Chuyên mục' }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await page
    .getByRole('navigation', { name: 'Điều hướng chính' })
    .getByRole('link', { name: 'Lưu trữ' })
    .click();
  await expect(page).toHaveURL(/\/archive$/);
});
