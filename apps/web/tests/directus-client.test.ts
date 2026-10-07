import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const RAW_POST = {
  id: 'p1',
  title: 'Z80',
  slug: 'z80',
  excerpt: null,
  body: '<p>Hi</p><script>alert(1)</script>',
  published_at: '2026-01-02T00:00:00Z',
  author: { name: 'An', slug: 'an', avatar: { id: 'av1', alt: 'Ảnh' } },
  category: { name: 'CPU', slug: 'cpu' },
  cover: { id: 'c1', alt: null },
};

describe('phân trang (clamp)', () => {
  it.each([
    [undefined, undefined, 1, 10],
    [0, 0, 1, 10],
    [-3, -1, 1, 10],
    [Number.NaN, Number.NaN, 1, 10],
    [2.9, 5.7, 2, 5],
    [3, 999, 3, 50],
  ])('page=%s pageSize=%s → page=%s size=%s', async (page, pageSize, wantPage, wantSize) => {
    const f = mockFetch({ data: [], meta: { filter_count: 0 } });
    const { listPublishedPosts } = await loadClient();
    const res = await listPublishedPosts({ page, pageSize });
    expect(res.pageInfo.page).toBe(wantPage);
    expect(res.pageInfo.pageSize).toBe(wantSize);
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain(`limit=${wantSize}`);
    expect(url).toContain(`offset=${(wantPage - 1) * wantSize}`);
  });

  it('hasMore đúng theo filter_count', async () => {
    mockFetch({ data: [RAW_POST], meta: { filter_count: 25 } });
    const { listPublishedPosts } = await loadClient();
    const mid = await listPublishedPosts({ page: 1, pageSize: 10 });
    expect(mid.pageInfo).toEqual({ total: 25, page: 1, pageSize: 10, hasMore: true });

    mockFetch({ data: [RAW_POST], meta: { filter_count: 11 } });
    const last = await listPublishedPosts({ page: 2, pageSize: 10 });
    expect(last.pageInfo.hasMore).toBe(false);
  });

  it('thiếu meta → total = số item', async () => {
    mockFetch({ data: [RAW_POST] });
    const { listPublishedPosts } = await loadClient();
    const res = await listPublishedPosts();
    expect(res.pageInfo.total).toBe(1);
    expect(res.pageInfo.hasMore).toBe(false);
  });
});

describe('mapping DTO', () => {
  it('summary: đủ field DTO, không rò field thô, cover → URL public', async () => {
    mockFetch({ data: [RAW_POST], meta: { filter_count: 1 } });
    const { listPublishedPosts } = await loadClient();
    const [item] = (await listPublishedPosts()).items;
    expect(item).toEqual({
      id: 'p1',
      title: 'Z80',
      slug: 'z80',
      excerpt: null,
      cover: { url: 'https://cms.example.com/assets/c1', alt: '' },
      publishedAt: '2026-01-02T00:00:00Z',
      author: { name: 'An', slug: 'an' },
      category: { name: 'CPU', slug: 'cpu' },
    });
    expect(item).not.toHaveProperty('body');
    expect(item).not.toHaveProperty('published_at');
  });

  it('null-handling: author/category/cover thiếu → giá trị an toàn', async () => {
    mockFetch({ data: [{ id: 'p2', title: 'T', slug: 't' }], meta: { filter_count: 1 } });
    const { listPublishedPosts } = await loadClient();
    const [item] = (await listPublishedPosts()).items;
    expect(item.author).toEqual({ name: '', slug: '' });
    expect(item.category).toBeNull();
    expect(item.cover).toBeNull();
    expect(item.excerpt).toBeNull();
    expect(item.publishedAt).toBeNull();
  });

  it('detail: body được sanitize, avatar map đúng', async () => {
    mockFetch({ data: [RAW_POST] });
    const { getPostBySlug } = await loadClient();
    const post = await getPostBySlug('z80');
    expect(post?.body).toBe('<p>Hi</p>');
    expect(post?.author.avatar).toEqual({ url: 'https://cms.example.com/assets/av1', alt: 'Ảnh' });
  });

  it('detail: body rỗng → null', async () => {
    mockFetch({ data: [{ ...RAW_POST, body: null }] });
    const { getPostBySlug } = await loadClient();
    expect((await getPostBySlug('z80'))?.body).toBeNull();
  });

  it('category không slug → null', async () => {
    mockFetch({ data: [{ name: 'X', slug: '' }] });
    const { getCategoryBySlug } = await loadClient();
    expect(await getCategoryBySlug('x')).toBeNull();
  });
});

describe('DirectusError mapping', () => {
  it('getPostBySlug: không có bản ghi → null', async () => {
    mockFetch({ data: [] });
    const { getPostBySlug } = await loadClient();
    expect(await getPostBySlug('none')).toBeNull();
  });

  it.each([401, 403, 404])('HTTP %s → not_found → null (không lộ draft)', async (status) => {
    mockFetch({}, status);
    const { getPostBySlug } = await loadClient();
    expect(await getPostBySlug('draft')).toBeNull();
  });

  it('HTTP 500 → ném DirectusError(system)', async () => {
    mockFetch({}, 500);
    const { getPostBySlug, DirectusError } = await loadClient();
    await expect(getPostBySlug('x')).rejects.toMatchObject({ code: 'system' });
    await expect(getPostBySlug('x')).rejects.toBeInstanceOf(DirectusError);
  });

  it('fetch thất bại (mạng) → DirectusError(system)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    const { listPublishedPosts } = await loadClient();
    await expect(listPublishedPosts()).rejects.toMatchObject({ code: 'system' });
  });

  it('listPublishedPosts: 403 → ném not_found (list không nuốt lỗi)', async () => {
    mockFetch({}, 403);
    const { listPublishedPosts } = await loadClient();
    await expect(listPublishedPosts()).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('hợp đồng request', () => {
  it('gọi qua DIRECTUS_INTERNAL_URL, không gửi Authorization (vai Public)', async () => {
    const f = mockFetch({ data: [] });
    const { listPublishedPosts } = await loadClient();
    await listPublishedPosts();
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith('http://directus.test/items/posts?')).toBe(true);
    expect(JSON.stringify(init.headers)).not.toMatch(/authorization/i);
  });

  it('field gửi lên không có "*" và slug được encode', async () => {
    const f = mockFetch({ data: [] });
    const { getPostBySlug } = await loadClient();
    await getPostBySlug('a b&c');
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain('a%20b%26c');
    expect(url).not.toMatch(/fields=\*|,\*/);
  });
});

describe('site settings', () => {
  it('trống → mặc định; {year} được thay', async () => {
    mockFetch({ data: { site_name: '  ', footer_text: '© {year} X' } });
    const { getSiteSettings } = await loadClient();
    const s = await getSiteSettings();
    expect(s.siteName).toBe('Retro Blog');
    expect(s.footerText).toBe(`© ${new Date().getFullYear()} X`);
    expect(s.defaultOgImage).toBeNull();
  });

  it('403 (chưa cấp quyền) → mặc định, không ném', async () => {
    mockFetch({}, 403);
    const { getSiteSettings } = await loadClient();
    expect((await getSiteSettings()).siteName).toBe('Retro Blog');
  });

  it('lỗi hệ thống vẫn nổi lên', async () => {
    mockFetch({}, 500);
    const { getSiteSettings } = await loadClient();
    await expect(getSiteSettings()).rejects.toMatchObject({ code: 'system' });
  });
});
