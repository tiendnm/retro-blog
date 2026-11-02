import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/lib/format';
import { optimizeBodyImages, rewriteAssetUrls } from '../src/lib/rewrite-assets';
import { sanitizeBody } from '../src/lib/sanitize-body';

const ID = '123e4567-e89b-12d3-a456-426614174000';

describe('rewriteAssetUrls', () => {
  it('đổi domain CMS cũ và dạng tương đối sang PUBLIC_DIRECTUS_URL', () => {
    const html = `<img src="http://old.local:8055/assets/${ID}?width=300"><a href="/assets/${ID}">f</a>`;
    expect(rewriteAssetUrls(html, 'https://cms.example.com/')).toBe(
      `<img src="https://cms.example.com/assets/${ID}?width=300"><a href="https://cms.example.com/assets/${ID}">f</a>`,
    );
  });

  it('không đụng URL không phải asset', () => {
    const html = '<a href="https://x.com/assets/readme">x</a>';
    expect(rewriteAssetUrls(html, 'https://cms.example.com')).toBe(html);
  });
});

describe('sanitizeBody (ADR-0013)', () => {
  it.each([
    ['<script>alert(1)</script><p>ok</p>', '<p>ok</p>'],
    ['<p onclick="x()">a</p>', '<p>a</p>'],
    ['<a href="javascript:alert(1)">x</a>', '<a>x</a>'],
    ['<img src="data:image/png;base64,AAA">', '<img />'],
    ['<iframe src="https://evil"></iframe><p>t</p>', '<p>t</p>'],
    ['<style>p{}</style><p>t</p>', '<p>t</p>'],
  ])('chặn %s', (input, expected) => {
    expect(sanitizeBody(input)).toBe(expected);
  });

  it('giữ nội dung hợp lệ (heading, code language, bảng, ảnh https)', () => {
    const html =
      '<h2 id="a">T</h2><pre class="language-js"><code class="language-js">x</code></pre>' +
      '<table><tbody><tr><td colspan="2">c</td></tr></tbody></table><img src="https://a/b.png" alt="z" />';
    expect(sanitizeBody(html)).toBe(html);
  });

  it('class ngoài language-* bị loại', () => {
    expect(sanitizeBody('<code class="evil language-js">x</code>')).toBe(
      '<code class="language-js">x</code>',
    );
  });

  it('target=_blank luôn có rel noopener noreferrer; không _blank thì bỏ rel', () => {
    expect(sanitizeBody('<a href="https://a" target="_blank">x</a>')).toBe(
      '<a href="https://a" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(sanitizeBody('<a href="https://a" rel="opener">x</a>')).toBe(
      '<a href="https://a">x</a>',
    );
  });
});

describe('formatDate', () => {
  it('null / sai định dạng → rỗng', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('không-phải-ngày')).toBe('');
  });
  it('ISO hợp lệ → chuỗi có năm', () => {
    expect(formatDate('2026-03-05T12:00:00Z')).toContain('2026');
  });
});

describe('optimizeBodyImages', () => {
  const base = `https://cms.example.com/assets/${ID}`;

  it('đổi ảnh gốc 4000px sang srcset webp, giữ alt/loading, bỏ dấu / tự đóng', () => {
    const html = `<img src="${base}.jpg?width=4000&amp;height=3000" alt="Ảnh" loading="lazy" />`;
    const out = optimizeBodyImages(html);
    expect(out).toContain('alt="Ảnh"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain(`src="${base}?width=960&amp;quality=80&amp;format=webp"`);
    expect(out).toContain(`${base}?width=640&amp;quality=80&amp;format=webp 640w`);
    expect(out).toContain('sizes="');
    expect(out).not.toContain('width=4000');
    expect(out).not.toContain('/ ');
    expect(out.endsWith('>')).toBe(true);
  });

  it('đặt width/height từ query gốc để giữ chỗ (hết giật layout)', () => {
    const html = `<img src="${base}.jpg?width=4000&amp;height=3000" alt="a" />`;
    const out = optimizeBodyImages(html);
    expect(out).toContain('width="4000" height="3000"');
  });

  it('không có kích thước trong URL thì không bịa width/height', () => {
    const out = optimizeBodyImages(`<img src="${base}" alt="a">`);
    expect(out).not.toMatch(/\swidth="/);
  });

  it('giữ width/height tác giả đã kéo đổi cỡ, không đè bằng cỡ gốc', () => {
    const html = `<img src="${base}.jpg?width=4000&amp;height=3000" alt="a" width="400" height="300">`;
    const out = optimizeBodyImages(html);
    expect(out).toContain('width="400"');
    expect(out).toContain('height="300"');
    expect(out).not.toContain('width="4000"');
  });

  it('ảnh chèn với preset editor (?key=editor): srcset sinh từ file gốc, không mang key, không bịa kích thước', () => {
    const out = optimizeBodyImages(`<img src="${base}.jpg?key=editor" alt="a">`);
    expect(out).not.toContain('key=editor');
    expect(out).toContain(`${base}?width=1600&amp;quality=80&amp;format=webp 1600w`);
    expect(out).not.toMatch(/\swidth="/);
  });

  it('không đụng ảnh ngoài asset Directus', () => {
    const html = '<img src="https://x.com/a.png" alt="x">';
    expect(optimizeBodyImages(html)).toBe(html);
  });
});

describe('sanitizeBody — căn lề bằng class', () => {
  it('giữ class align-left|center|right trên đoạn, tiêu đề, trích dẫn, danh sách, ô bảng và ảnh', () => {
    const html =
      '<p class="align-center">a</p><h2 class="align-right">b</h2><blockquote class="align-left">c</blockquote>' +
      '<ul><li class="align-center">d</li></ul><table><tr><td class="align-right">e</td></tr></table>' +
      '<p><img src="https://x.com/a.png" alt="" class="align-center"></p>';
    const out = sanitizeBody(html);
    expect(out).toContain('<p class="align-center">a</p>');
    expect(out).toContain('<h2 class="align-right">b</h2>');
    expect(out).toContain('<blockquote class="align-left">c</blockquote>');
    expect(out).toContain('<li class="align-center">d</li>');
    expect(out).toContain('<td class="align-right">e</td>');
    expect(out).toContain('class="align-center"');
  });

  it('vẫn chặn class lạ và style inline', () => {
    const out = sanitizeBody(
      '<p class="align-center evil" style="text-align:center">a</p><p class="x">b</p>',
    );
    expect(out).toContain('<p class="align-center">a</p>');
    expect(out).toContain('<p>b</p>');
    expect(out).not.toContain('style');
    expect(out).not.toContain('evil');
  });
});
