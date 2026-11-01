// Luồng publish → build (Sprint 11 §E): nháp/hẹn giờ KHÔNG vào dist; đặt published thì CÓ trong dist,
// sitemap.xml, rss.xml, search-index.json; gỡ lại thì biến mất. Dựng thật bằng `astro build` vào thư mục tạm.
//   node --test scripts/integration/publish-flow.test.mjs     (cần Directus + seed + apps/web đã cài deps)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { BASE, cleanup, makePost, setStatus } from './lib.mjs';

const WEB = resolve(import.meta.dirname, '../../apps/web');
// Cùng ổ đĩa với apps/web (Astro dùng rename — Windows báo EXDEV nếu khác ổ); node_modules/.cache đã nằm ngoài git.
const cache = join(WEB, 'node_modules', '.cache');
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, 'publish-flow-'));
let n = 0;

function build() {
  const dir = join(out, `b${++n}`);
  execFileSync('pnpm', ['exec', 'astro', 'build', '--outDir', dir], {
    cwd: WEB,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      DIRECTUS_INTERNAL_URL: process.env.DIRECTUS_INTERNAL_URL ?? BASE,
      PUBLIC_DIRECTUS_URL: process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.example.test',
      PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? 'https://blog.example.test',
    },
  });
  return dir;
}

/** Bài có mặt ở bốn nơi: trang, sitemap, rss, chỉ mục tìm kiếm. */
function presence(dist, slug) {
  const read = (f) => (existsSync(join(dist, f)) ? readFileSync(join(dist, f), 'utf8') : '');
  const needle = `/posts/${slug}`;
  return {
    page: existsSync(join(dist, 'posts', slug, 'index.html')),
    sitemap: read('sitemap.xml').includes(`${needle}</loc>`),
    rss: read('rss.xml').includes(`${needle}</link>`),
    search: read('search-index.json').includes(`"${needle}"`),
  };
}
const ABSENT = { page: false, sitemap: false, rss: false, search: false };
const PRESENT = { page: true, sitemap: true, rss: true, search: true };

before(cleanup);
after(async () => {
  await cleanup();
  rmSync(out, { recursive: true, force: true });
});

describe('publish → build', () => {
  it('nháp → không có; đặt published → có đủ bốn nơi; gỡ lại → biến mất', { timeout: 180_000 }, async () => {
    const post = await makePost({ status: 'draft', label: 'flow' });

    assert.deepEqual(presence(build(), post.slug), ABSENT, 'bài nháp lọt vào bản build');

    assert.equal((await setStatus(post.id, 'published', { published_at: new Date(Date.now() - 60_000).toISOString() })).status, 200);
    assert.deepEqual(presence(build(), post.slug), PRESENT, 'bài đã xuất bản thiếu trong bản build');

    assert.equal((await setStatus(post.id, 'draft')).status, 200);
    assert.deepEqual(presence(build(), post.slug), ABSENT, 'bài đã gỡ vẫn còn trong bản build');
  });

  it('published nhưng published_at ở tương lai → không có; lùi giờ về quá khứ → có', { timeout: 180_000 }, async () => {
    const post = await makePost({ status: 'published', publishedAt: 86_400_000, label: 'sched' });
    assert.deepEqual(presence(build(), post.slug), ABSENT, 'bài hẹn giờ lọt vào bản build');

    await setStatus(post.id, 'published', { published_at: new Date(Date.now() - 60_000).toISOString() });
    assert.deepEqual(presence(build(), post.slug), PRESENT);
  });
});
