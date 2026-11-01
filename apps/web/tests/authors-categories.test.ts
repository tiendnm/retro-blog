import { afterEach, describe, expect, it, vi } from 'vitest';
import { paragraphs } from '../src/lib/format';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('paragraphs', () => {
  it('tách ở dòng trống, gộp xuống dòng đơn thành khoảng trắng, bỏ đoạn rỗng', () => {
    expect(paragraphs('Dòng 1\ndòng 2\n\n\nĐoạn hai\r\n\r\n  \n\nĐoạn ba')).toEqual([
      'Dòng 1 dòng 2',
      'Đoạn hai',
      'Đoạn ba',
    ]);
  });
  it('null / undefined / rỗng → []', () => {
    expect(paragraphs(null)).toEqual([]);
    expect(paragraphs(undefined)).toEqual([]);
    expect(paragraphs('  \n\n ')).toEqual([]);
  });
  it('không diễn giải HTML (để Astro tự thoát ký tự)', () => {
    expect(paragraphs('<b>x</b>')).toEqual(['<b>x</b>']);
  });
});

describe('tác giả', () => {
  it('getAuthorBySlug: map bio + avatar, bỏ khoảng trắng thừa; bio rỗng → null', async () => {
    const f = mockFetch({
      data: [
        { name: 'An', slug: 'an', bio: '  Mê máy cũ.  ', avatar: { id: 'av1', alt: 'Ảnh An' } },
      ],
    });
    const c = await loadClient();
    expect(await c.getAuthorBySlug('an')).toEqual({
      name: 'An',
      slug: 'an',
      bio: 'Mê máy cũ.',
      avatar: { url: 'https://cms.example.com/assets/av1', alt: 'Ảnh An' },
    });
    expect(String(f.mock.calls[0][0])).toContain('fields=name,slug,bio,avatar.id,avatar.alt');

    mockFetch({ data: [{ name: 'Bình', slug: 'binh', bio: '   ', avatar: null }] });
    const c2 = await loadClient();
    expect(await c2.getAuthorBySlug('binh')).toMatchObject({ bio: null, avatar: null });
  });

  it('getAuthorBySlug: không có / không slug / 403 → null; lỗi hệ thống nổi lên', async () => {
    mockFetch({ data: [] });
    expect(await (await loadClient()).getAuthorBySlug('x')).toBeNull();
    mockFetch({ data: [{ name: 'Vô danh', slug: null }] });
    expect(await (await loadClient()).getAuthorBySlug('x')).toBeNull();
    mockFetch({}, 403);
    expect(await (await loadClient()).getAuthorBySlug('x')).toBeNull();
    mockFetch({}, 500);
    await expect((await loadClient()).getAuthorBySlug('x')).rejects.toThrow();
  });

  it('getAllAuthorSlugs: chỉ tác giả có bài, bỏ trùng/trống, sắp xếp', async () => {
    const f = mockFetch({
      data: [
        { author: { slug: 'binh' } },
        { author: { slug: 'an' } },
        { author: { slug: 'an' } },
        { author: null },
        { author: { slug: '' } },
      ],
    });
    const c = await loadClient();
    expect(await c.getAllAuthorSlugs()).toEqual(['an', 'binh']);
    expect(String(f.mock.calls[0][0])).toContain('/items/posts?fields=author.slug&limit=-1');
  });

  it('listPostsByAuthor: lọc theo slug (đã encode), mới nhất trước, có phân trang', async () => {
    const f = mockFetch({ data: [], meta: { filter_count: 25 } });
    const c = await loadClient();
    const r = await c.listPostsByAuthor('a b&c', { page: 3, pageSize: 10 });
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain('filter[author][slug][_eq]=a%20b%26c');
    expect(url).toContain('sort=-published_at');
    expect(url).toContain('offset=20');
    expect(r.pageInfo).toEqual({ total: 25, page: 3, pageSize: 10, hasMore: true });
  });
});

describe('listCategoryInfos', () => {
  it('ghép mô tả với số bài đã xuất bản; chuyên mục chưa có bài → 0; bài không chuyên mục bị bỏ qua', async () => {
    const responses = [
      {
        data: [
          { name: 'CPU', slug: 'cpu', description: ' Bộ vi xử lý ' },
          { name: 'RAM', slug: 'ram', description: null },
          { name: 'Hỏng', slug: null },
        ],
      },
      {
        data: [
          { category: { slug: 'cpu' } },
          { category: { slug: 'cpu' } },
          { category: null },
          {},
        ],
      },
    ];
    const f = vi.fn(
      async (..._a: unknown[]) => new Response(JSON.stringify(responses.shift()), { status: 200 }),
    );
    vi.stubGlobal('fetch', f);
    const c = await loadClient();
    // 2 request song song: thứ tự trả lời khớp thứ tự gọi (categories rồi posts)
    expect(await c.listCategoryInfos()).toEqual([
      { name: 'CPU', slug: 'cpu', description: 'Bộ vi xử lý', count: 2 },
      { name: 'RAM', slug: 'ram', description: null, count: 0 },
    ]);
    expect(String(f.mock.calls[0][0])).toContain('/items/categories?fields=name,slug,description');
    expect(String(f.mock.calls[1][0])).toContain('/items/posts?fields=category.slug&limit=-1');
  });
});
