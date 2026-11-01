// Test cho scripts/check-site.mjs — chạy: node --test scripts/check-site.test.mjs
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { checkSite, xmlError } from './check-site.mjs';

const SITE = 'https://blog.example.test';
const roots = [];
afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

const page = ({ canonical, body = '', head = '' }) =>
  `<!doctype html><html lang="vi"><head><link rel="canonical" href="${canonical}">${head}</head><body>${body}</body></html>`;

const LD = '{"@context":"https://schema.org","@type":"BlogPosting","headline":"A"}';

/** Dựng dist hợp lệ; `patch` ghi đè/xoá file (null = xoá) để tạo đột biến. */
function makeDist(patch = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'check-site-'));
  roots.push(dir);
  const files = {
    'index.html': page({
      canonical: `${SITE}/`,
      body: '<a href="/posts/a">A</a><a href="/archive">x</a><img src="/og-default.png" srcset="/og-default.png 1x"><a href="https://ext.example.org/x">e</a>',
      head: `<meta property="og:image" content="${SITE}/og-default.png">`,
    }),
    'posts/a/index.html': page({
      canonical: `${SITE}/posts/a`,
      body: '<a href="/">home</a><a href="../../archive/">rel</a>',
      head: `<script type="application/ld+json">${LD}</script>`,
    }),
    'archive/index.html': page({ canonical: `${SITE}/archive`, body: '<a href="/">h</a>' }),
    '404.html': page({ canonical: `${SITE}/404`, body: '<a href="/">h</a>' }),
    'search/index.html': page({ canonical: `${SITE}/search` }),
    'og-default.png': 'png',
    'robots.txt': `User-agent: *\nSitemap: ${SITE}/sitemap.xml\n`,
    'sitemap.xml': `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url><url><loc>${SITE}/posts/a</loc></url><url><loc>${SITE}/archive</loc></url></urlset>`,
    'rss.xml': `<?xml version="1.0"?><rss version="2.0"><channel><title>T &amp; U</title><item><title>A</title><link>${SITE}/posts/a</link></item></channel></rss>`,
    ...patch,
  };
  for (const [name, content] of Object.entries(files)) {
    if (content === null) continue;
    const p = join(dir, name);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return dir;
}

const run = (patch) => checkSite(makeDist(patch), { siteUrl: SITE });
const has = (res, re) => res.errors.some((e) => re.test(e));

describe('check-site', () => {
  it('dist hợp lệ → 0 lỗi, liệt kê link ngoài', () => {
    const res = run();
    assert.deepEqual(res.errors, []);
    assert.deepEqual([...res.externals.keys()], ['https://ext.example.org/x']);
  });

  it('suy ra site URL từ robots.txt khi không truyền', () => {
    assert.deepEqual(checkSite(makeDist()).errors, []);
  });

  it('link nội bộ hỏng → lỗi', () => {
    const res = run({ 'index.html': page({ canonical: `${SITE}/`, body: '<a href="/posts/khong-co">x</a>' }) });
    assert.ok(has(res, /link nội bộ hỏng.*khong-co/));
  });

  it('ảnh/srcset nội bộ thiếu file → lỗi', () => {
    const res = run({ 'og-default.png': null });
    assert.ok(has(res, /og-default\.png/));
  });

  it('sitemap trỏ tới trang không có → lỗi', () => {
    const res = run({
      'sitemap.xml': `<urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}/posts/a</loc></url><url><loc>${SITE}/archive</loc></url><url><loc>${SITE}/ma</loc></url></urlset>`,
    });
    assert.ok(has(res, /\/ma không có trang/));
  });

  it('trang có trong dist nhưng thiếu trong sitemap → lỗi (trừ 404, search)', () => {
    const res = run({
      'sitemap.xml': `<urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}/archive</loc></url></urlset>`,
    });
    assert.ok(has(res, /\/posts\/a: có trong dist nhưng thiếu/));
    assert.ok(!has(res, /\/404|\/search/));
  });

  it('trang phân trang không bắt buộc có trong sitemap', () => {
    const res = run({ 'page/2/index.html': page({ canonical: `${SITE}/page/2` }) });
    assert.deepEqual(res.errors, []);
  });

  it('canonical sai hoặc thiếu → lỗi', () => {
    assert.ok(has(run({ 'archive/index.html': page({ canonical: `${SITE}/archive/` }) }), /canonical/));
    assert.ok(has(run({ 'archive/index.html': '<html><body>x</body></html>' }), /thiếu <link rel="canonical">/));
  });

  it('rss.xml hỏng XML → lỗi', () => {
    assert.ok(has(run({ 'rss.xml': '<rss><channel><item></channel></rss>' }), /rss\.xml không phải XML/));
    assert.ok(has(run({ 'rss.xml': '<rss><channel><title>A & B</title></channel></rss>' }), /rss\.xml không phải XML/));
  });

  it('mục rss trỏ tới trang không tồn tại → lỗi', () => {
    const res = run({ 'rss.xml': `<rss><channel><item><link>${SITE}/posts/ma</link></item></channel></rss>` });
    assert.ok(has(res, /rss\.xml: mục #1 trỏ tới trang không có/));
  });

  it('JSON-LD hỏng hoặc thiếu ở trang bài → lỗi', () => {
    const broken = page({ canonical: `${SITE}/posts/a`, head: '<script type="application/ld+json">{"a":</script>' });
    assert.ok(has(run({ 'posts/a/index.html': broken }), /JSON-LD không phải JSON/));
    assert.ok(has(run({ 'posts/a/index.html': page({ canonical: `${SITE}/posts/a` }) }), /thiếu JSON-LD/));
  });

  it('site HTTPS mà còn localhost / http:// → lỗi; namespace XML thì được', () => {
    const res = run({ 'archive/index.html': page({ canonical: `${SITE}/archive`, body: '<img src="http://localhost:8055/assets/1">' }) });
    assert.ok(has(res, /archive.*localhost/));
    assert.ok(has(res, /archive.*http:\/\/localhost/));
    assert.deepEqual(run().errors, []); // sitemap có xmlns http://www.sitemaps.org
  });

  it('site HTTP (dev/CI cũ) → bỏ qua kiểm localhost', () => {
    const dir = makeDist({ 'archive/index.html': page({ canonical: 'http://localhost:4321/archive', body: 'http://localhost:8055' }) });
    const res = checkSite(dir, { siteUrl: 'http://localhost:4321' });
    assert.ok(!has(res, /dù site là HTTPS/));
  });
});

describe('xmlError', () => {
  it('chấp nhận XML hợp lệ (CDATA, entity, self-closing, comment)', () => {
    assert.equal(xmlError('<?xml version="1.0"?><a x="1"><!-- c --><b/><c><![CDATA[<x>&]]></c>&amp;&#169;</a>'), null);
  });
  it('bắt lỗi thường gặp', () => {
    for (const bad of ['<a><b></a>', '<a>', '<a></a><b></b>', '<a>&bogus </a>', '<a>1 < 2</a>', '', 'text']) {
      assert.notEqual(xmlError(bad), null, bad);
    }
  });
});
