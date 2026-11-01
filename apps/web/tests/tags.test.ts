import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const RAW = {
  id: 'p1',
  title: 'P4',
  slug: 'p4',
  excerpt: null,
  body: '<p>x</p>',
  published_at: '2026-10-24T04:23:00Z',
  author: { name: 'An', slug: 'an' },
  category: null,
  cover: null,
  tags: [
    { tags_id: { name: 'Pentium 4', slug: 'pentium-4' } },
    { tags_id: null },
    { tags_id: { name: '', slug: '' } },
    { tags_id: { name: 'Retro', slug: 'retro' } },
  ],
};

describe('thẻ trong DTO', () => {
  it('summary: map dòng nối → TagRef, bỏ dòng không đọc được / thiếu slug', async () => {
    const f = mockFetch({ data: [RAW], meta: { filter_count: 1 } });
    const c = await loadClient();
    const { items } = await c.listPublishedPosts();
    expect(items[0].tags).toEqual([
      { name: 'Pentium 4', slug: 'pentium-4' },
      { name: 'Retro', slug: 'retro' },
    ]);
    expect(String(f.mock.calls[0][0])).toContain('tags.tags_id.name,tags.tags_id.slug');
  });

  it('detail: có tags; bài không có field tags → mảng rỗng', async () => {
    mockFetch({ data: [RAW] });
    const c = await loadClient();
    expect((await c.getPostBySlug('p4'))?.tags).toHaveLength(2);

    mockFetch({ data: [{ ...RAW, tags: undefined }] });
    const c2 = await loadClient();
    expect((await c2.getPostBySlug('p4'))?.tags).toEqual([]);
  });
});

describe('thin client: thẻ', () => {
  it('listPostsByTag lọc theo slug thẻ (đã encode) và trả phân trang', async () => {
    const f = mockFetch({ data: [RAW], meta: { filter_count: 11 } });
    const c = await loadClient();
    const r = await c.listPostsByTag('c++ & asm', { page: 2, pageSize: 10 });
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain('filter[tags][tags_id][slug][_eq]=c%2B%2B%20%26%20asm');
    expect(url).toContain('sort=-published_at');
    expect(url).toContain('offset=10');
    expect(r.pageInfo).toEqual({ total: 11, page: 2, pageSize: 10, hasMore: false });
  });

  it('getTagBySlug: có → TagRef; rỗng/403/404 → null; lỗi hệ thống nổi lên', async () => {
    mockFetch({ data: [{ name: 'Retro', slug: 'retro' }] });
    expect(await (await loadClient()).getTagBySlug('retro')).toEqual({
      name: 'Retro',
      slug: 'retro',
    });

    mockFetch({ data: [] });
    expect(await (await loadClient()).getTagBySlug('x')).toBeNull();

    mockFetch({}, 403);
    expect(await (await loadClient()).getTagBySlug('x')).toBeNull();

    mockFetch({}, 500);
    await expect((await loadClient()).getTagBySlug('x')).rejects.toThrow();
  });

  it('getAllTagSlugs trả danh sách slug', async () => {
    const f = mockFetch({ data: [{ slug: 'a' }, { slug: 'b' }] });
    const c = await loadClient();
    expect(await c.getAllTagSlugs()).toEqual(['a', 'b']);
    expect(String(f.mock.calls[0][0])).toContain('/items/tags?fields=slug');
  });
});
