import { describe, expect, it } from 'vitest';
import { buildSitemapXml } from '../src/lib/sitemap';

describe('buildSitemapXml', () => {
  it('gắn lastmod ISO khi có ngày hợp lệ', () => {
    const xml = buildSitemapXml([
      { loc: 'https://b.test/posts/a', lastmod: '2026-10-01T07:00:00+07:00' },
    ]);
    expect(xml).toContain(
      '<loc>https://b.test/posts/a</loc><lastmod>2026-10-01T00:00:00.000Z</lastmod>',
    );
  });

  it('bỏ lastmod khi thiếu hoặc không parse được', () => {
    const xml = buildSitemapXml([
      { loc: 'https://b.test/a' },
      { loc: 'https://b.test/b', lastmod: null },
      { loc: 'https://b.test/c', lastmod: 'không-phải-ngày' },
    ]);
    expect(xml).not.toContain('lastmod');
  });

  it('escape ký tự đặc biệt trong loc và là urlset hợp lệ', () => {
    const xml = buildSitemapXml([{ loc: 'https://b.test/?a=1&b=2' }]);
    expect(xml).toContain('<loc>https://b.test/?a=1&amp;b=2</loc>');
    expect(xml).toMatch(/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  });
});
