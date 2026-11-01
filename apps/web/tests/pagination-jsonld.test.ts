import { describe, expect, it } from 'vitest';
import { buildPostJsonLd, serializeJsonLd } from '../src/lib/json-ld';
import { pageCells } from '../src/lib/pagination';
import type { PostDetail } from '../src/lib/types';

describe('pageCells (cửa sổ phân trang)', () => {
  it('ít trang: hiện đủ, không có gap', () => {
    expect(pageCells(1, 3)).toEqual([1, 2, 3]);
    expect(pageCells(2, 3)).toEqual([1, 2, 3]);
  });

  it('một trang: chỉ [1]', () => {
    expect(pageCells(1, 1)).toEqual([1]);
  });

  it('đầu dãy nhiều trang: có gap trước trang cuối', () => {
    expect(pageCells(1, 10)).toEqual([1, 2, 'gap', 10]);
  });

  it('giữa dãy: gap hai phía', () => {
    expect(pageCells(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('cuối dãy: gap sau trang 1', () => {
    expect(pageCells(10, 10)).toEqual([1, 'gap', 9, 10]);
  });

  it('gap chèn khi đứt từ 1 trang trở lên; hai cửa sổ chạm nhau thì liền mạch', () => {
    expect(pageCells(4, 6)).toEqual([1, 'gap', 3, 4, 5, 6]);
    expect(pageCells(3, 10)).toEqual([1, 2, 3, 4, 'gap', 10]);
  });

  it('50+ trang vẫn luôn có trang đầu, trang cuối và trang hiện tại', () => {
    const cells = pageCells(25, 60);
    expect(cells[0]).toBe(1);
    expect(cells.at(-1)).toBe(60);
    expect(cells).toContain(25);
    expect(cells.length).toBeLessThanOrEqual(7);
  });

  it('dãy luôn tăng dần, không trùng, không gap liền nhau', () => {
    for (let total = 1; total <= 30; total++) {
      for (let cur = 1; cur <= total; cur++) {
        const cells = pageCells(cur, total);
        const nums = cells.filter((c): c is number => c !== 'gap');
        expect(nums).toEqual([...new Set(nums)].sort((a, b) => a - b));
        expect(cells.some((c, i) => c === 'gap' && cells[i + 1] === 'gap')).toBe(false);
      }
    }
  });
});

const post: PostDetail = {
  id: 'p1',
  title: 'Máy Apple II',
  slug: 'may-apple-ii',
  excerpt: 'Tóm tắt',
  body: '<p>x</p>',
  publishedAt: '2026-10-01T00:00:00.000Z',
  author: { name: 'Tác giả', slug: 'tac-gia', avatar: null },
  category: { name: 'Phần cứng', slug: 'phan-cung' },
  cover: null,
  tags: [
    { name: '8-bit', slug: '8-bit' },
    { name: 'Lưu trữ', slug: 'luu-tru' },
  ],
};
const ctx = {
  site: new URL('https://blog.example.test'),
  siteName: 'Retro Blog',
  imageAbs: 'https://blog.example.test/og-default.png',
  pageUrl: 'https://blog.example.test/posts/may-apple-ii',
};

describe('buildPostJsonLd', () => {
  it('đủ trường BlogPosting khi bài đầy đủ', () => {
    expect(buildPostJsonLd(post, ctx)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Máy Apple II',
      description: 'Tóm tắt',
      datePublished: '2026-10-01T00:00:00.000Z',
      author: {
        '@type': 'Person',
        name: 'Tác giả',
        url: 'https://blog.example.test/author/tac-gia',
      },
      articleSection: 'Phần cứng',
      keywords: '8-bit, Lưu trữ',
      image: ctx.imageAbs,
      mainEntityOfPage: ctx.pageUrl,
      publisher: { '@type': 'Organization', name: 'Retro Blog' },
    });
  });

  it('bỏ các trường tuỳ chọn khi thiếu dữ liệu', () => {
    const ld = buildPostJsonLd(
      { ...post, excerpt: null, publishedAt: null, category: null, tags: [] },
      ctx,
    );
    for (const k of ['description', 'datePublished', 'articleSection', 'keywords']) {
      expect(ld).not.toHaveProperty(k);
    }
  });

  it('không có site → tác giả không có url', () => {
    const ld = buildPostJsonLd(post, { ...ctx, site: undefined });
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Tác giả' });
  });
});

describe('serializeJsonLd', () => {
  it('escape "<" để không đóng được thẻ <script>', () => {
    const out = serializeJsonLd({ headline: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).headline).toBe('</script><script>alert(1)</script>');
  });
});
