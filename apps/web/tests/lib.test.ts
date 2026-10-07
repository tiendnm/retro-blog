import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/lib/format';
import { rewriteAssetUrls } from '../src/lib/rewrite-assets';
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
