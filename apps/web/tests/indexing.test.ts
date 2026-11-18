import { describe, expect, it } from 'vitest';
import { isCategoryIndexable, MIN_INDEXABLE_CATEGORY_POSTS } from '../src/lib/indexing';
import { pickRelatedPosts } from '../src/lib/related';
import { buildPostJsonLd } from '../src/lib/json-ld';
import type { PostSummary } from '../src/lib/types';

const post = (slug: string, cat: string | null, tags: string[] = []): PostSummary => ({
  id: slug,
  title: slug,
  slug,
  excerpt: null,
  cover: null,
  publishedAt: '2026-01-01T00:00:00Z',
  author: { name: 'A', slug: 'a' },
  category: cat ? { name: cat, slug: cat } : null,
  tags: tags.map((t) => ({ name: t, slug: t })),
});

describe('isCategoryIndexable', () => {
  it('chỉ index khi đủ số bài tối thiểu (3)', () => {
    expect(MIN_INDEXABLE_CATEGORY_POSTS).toBe(3);
    expect([0, 1, 2].map(isCategoryIndexable)).toEqual([false, false, false]);
    expect([3, 4, 10].map(isCategoryIndexable)).toEqual([true, true, true]);
  });
});

describe('pickRelatedPosts', () => {
  const cur = { slug: 'cur', category: { name: 'x', slug: 'x' }, tags: [{ name: 't', slug: 't' }] };

  it('loại chính bài hiện tại, ưu tiên cùng chuyên mục rồi thẻ rồi thứ tự mới nhất', () => {
    const out = pickRelatedPosts(cur, [
      post('cur', 'x'),
      post('new', 'y'),
      post('tag', 'y', ['t']),
      post('cat', 'x'),
    ]);
    expect(out.map((p) => p.slug)).toEqual(['cat', 'tag', 'new']);
  });

  it('giới hạn số bài và trả rỗng khi chỉ có một bài', () => {
    expect(pickRelatedPosts(cur, [post('cur', null)])).toEqual([]);
    expect(pickRelatedPosts(cur, [post('a', null), post('b', null)], 1)).toHaveLength(1);
  });
});

describe('buildPostJsonLd', () => {
  it('có datePublished, dateModified, author, image', () => {
    const ld = buildPostJsonLd(
      {
        ...post('p', null),
        body: null,
        author: { name: 'A', slug: 'a', bio: null, avatar: null },
      } as never,
      {
        site: new URL('https://b.test'),
        siteName: 'B',
        imageAbs: 'https://b.test/i.png',
        pageUrl: 'https://b.test/posts/p',
      },
    );
    expect(ld).toMatchObject({
      '@type': 'BlogPosting',
      datePublished: '2026-01-01T00:00:00Z',
      dateModified: '2026-01-01T00:00:00Z',
      image: 'https://b.test/i.png',
      author: { name: 'A' },
    });
  });

  it('dateModified ưu tiên updatedAt (date_updated), rơi về publishedAt khi chưa sửa', () => {
    const ctx = { site: undefined, siteName: 'B', imageAbs: 'i', pageUrl: 'u' };
    const base = {
      ...post('p', null),
      body: null,
      author: { name: 'A', slug: 'a', bio: null, avatar: null },
    } as never;
    expect(
      buildPostJsonLd({ ...(base as object), updatedAt: '2026-02-02T00:00:00Z' } as never, ctx),
    ).toMatchObject({
      dateModified: '2026-02-02T00:00:00Z',
    });
  });
});
