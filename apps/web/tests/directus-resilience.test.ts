import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadClient, mockFetch } from './helpers';

// Sprint 11 §F — độ bền thin client: Directus lỗi/hỏng/chậm không được làm build treo hay rò chi tiết.

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const LEAKY_BODY = { errors: [{ message: 'password=hunter2 @ /etc/directus/secret.env' }] };

describe('Directus trả lỗi 5xx', () => {
  it.each([500, 502, 503, 504])('HTTP %s → DirectusError(system)', async (status) => {
    mockFetch(LEAKY_BODY, status);
    const { listPublishedPosts, DirectusError } = await loadClient();
    const err = await listPublishedPosts().catch((e) => e);
    expect(err).toBeInstanceOf(DirectusError);
    expect(err.code).toBe('system');
  });

  it('thông điệp lỗi không chứa nội dung phản hồi của Directus', async () => {
    mockFetch(LEAKY_BODY, 500);
    const { getPostBySlug } = await loadClient();
    const err = await getPostBySlug('x').catch((e) => e);
    expect(err.message).not.toMatch(/hunter2|secret\.env|password/);
  });

  it('5xx khi lấy danh sách vẫn nổi lên (không nuốt thành danh sách rỗng)', async () => {
    mockFetch({}, 503);
    const { getAllPublishedPostSlugs } = await loadClient();
    await expect(getAllPublishedPostSlugs()).rejects.toMatchObject({ code: 'system' });
  });
});

describe('lỗi mạng', () => {
  it('ECONNREFUSED → DirectusError(system)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    const { getPostBySlug, DirectusError } = await loadClient();
    const err = await getPostBySlug('x').catch((e) => e);
    expect(err).toBeInstanceOf(DirectusError);
    expect(err.code).toBe('system');
  });

  it('getPostBySlug không nuốt lỗi mạng thành null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    const { getPostBySlug } = await loadClient();
    await expect(getPostBySlug('x')).rejects.toMatchObject({ code: 'system' });
  });
});

describe('JSON hỏng', () => {
  function mockRawBody(text: string, status = 200) {
    const fn = vi.fn(async (..._args: unknown[]) => new Response(text, { status }));
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it.each(['<html>502 Bad Gateway</html>', '{"data": [', ''])(
    'thân %j → DirectusError(system), không phải SyntaxError',
    async (text) => {
      mockRawBody(text);
      const { listPublishedPosts, DirectusError } = await loadClient();
      const err = await listPublishedPosts().catch((e) => e);
      expect(err).toBeInstanceOf(DirectusError);
      expect(err.code).toBe('system');
    },
  );

  it('thông điệp lỗi không chứa nội dung thân hỏng', async () => {
    mockRawBody('<html>internal-host-7.corp stack trace</html>');
    const { listPublishedPosts } = await loadClient();
    const err = await listPublishedPosts().catch((e) => e);
    expect(err.message).not.toMatch(/internal-host|stack trace/);
  });
});

describe('phản hồi chậm', () => {
  /** fetch treo vô hạn, chỉ dừng khi `signal` bị abort (như fetch thật). */
  function stubHangingFetch() {
    const fn = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('fetch được gắn AbortSignal.timeout (giới hạn dương, hữu hạn)', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    const f = mockFetch({ data: [] });
    const { listPublishedPosts } = await loadClient();
    await listPublishedPosts();
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(spy).toHaveBeenCalledTimes(1);
    const ms = spy.mock.calls[0][0];
    expect(ms).toBeGreaterThan(0);
    expect(Number.isFinite(ms)).toBe(true);
  });

  it('hết hạn timeout → DirectusError(system), build không treo', async () => {
    const ctrl = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(ctrl.signal);
    stubHangingFetch();
    const { listPublishedPosts, DirectusError } = await loadClient();
    const pending = listPublishedPosts().catch((e) => e);
    ctrl.abort(new DOMException('The operation timed out.', 'TimeoutError'));
    const err = await pending;
    expect(err).toBeInstanceOf(DirectusError);
    expect(err.code).toBe('system');
  });
});

describe('kết quả rỗng / không tồn tại', () => {
  it('danh sách rỗng → items [] và hasMore=false', async () => {
    mockFetch({ data: [], meta: { filter_count: 0 } });
    const { listPublishedPosts } = await loadClient();
    const res = await listPublishedPosts();
    expect(res.items).toEqual([]);
    expect(res.pageInfo).toEqual({ total: 0, page: 1, pageSize: 10, hasMore: false });
  });

  it('các getter theo slug trả null khi không có bản ghi', async () => {
    mockFetch({ data: [] });
    const c = await loadClient();
    expect(await c.getPostBySlug('none')).toBeNull();
    expect(await c.getCategoryBySlug('none')).toBeNull();
    expect(await c.getTagBySlug('none')).toBeNull();
    expect(await c.getAuthorBySlug('none')).toBeNull();
  });

  it('các getter theo slug trả null khi Public bị 403/404', async () => {
    mockFetch({}, 403);
    const c = await loadClient();
    expect(await c.getPostBySlug('x')).toBeNull();
    expect(await c.getCategoryBySlug('x')).toBeNull();
    expect(await c.getTagBySlug('x')).toBeNull();
    expect(await c.getAuthorBySlug('x')).toBeNull();
  });

  it('listPostsByMonth: tháng không có bài → mảng rỗng', async () => {
    mockFetch({ data: [] });
    const { listPostsByMonth } = await loadClient();
    expect(await listPostsByMonth(2026, 5)).toEqual([]);
  });
});
