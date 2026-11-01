import { afterEach, describe, expect, it, vi } from 'vitest';
import { groupByMonth, monthLabel, monthOf, monthPath, monthRange } from '../src/lib/archive';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('monthOf (giờ VN, UTC+7)', () => {
  it('bài 01:00 ngày 1/11 giờ VN (18:00 UTC ngày 31/10) thuộc tháng 11', () => {
    expect(monthOf('2026-10-31T18:00:00Z')).toEqual({ year: 2026, month: 11 });
  });
  it('bài 23:30 ngày 31/10 giờ VN (16:30 UTC) vẫn thuộc tháng 10', () => {
    expect(monthOf('2026-10-31T16:30:00Z')).toEqual({ year: 2026, month: 10 });
  });
  it('qua năm: 31/12 17:00 UTC = 00:00 ngày 1/1 giờ VN', () => {
    expect(monthOf('2026-12-31T17:00:00Z')).toEqual({ year: 2027, month: 1 });
  });
  it('chuỗi sai → null', () => {
    expect(monthOf('không phải ngày')).toBeNull();
  });
});

describe('groupByMonth', () => {
  it('đếm theo tháng, mới nhất trước, bỏ null/không hợp lệ', () => {
    const r = groupByMonth([
      '2026-09-05T03:00:00Z',
      '2026-10-24T04:23:00Z',
      null,
      'rác',
      '2026-10-02T00:00:00Z',
      '2025-12-31T10:00:00Z',
    ]);
    expect(r).toEqual([
      { year: 2026, month: 10, count: 2 },
      { year: 2026, month: 9, count: 1 },
      { year: 2025, month: 12, count: 1 },
    ]);
  });
  it('rỗng → rỗng', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('monthRange', () => {
  it('tháng 10/2026 giờ VN = [30/9 17:00Z, 31/10 17:00Z)', () => {
    expect(monthRange(2026, 10)).toEqual({
      from: '2026-09-30T17:00:00.000Z',
      to: '2026-10-31T17:00:00.000Z',
    });
  });
  it('tháng 12 sang tháng 1 năm sau', () => {
    expect(monthRange(2026, 12).to).toBe('2026-12-31T17:00:00.000Z');
  });
  it('khớp với monthOf: biên from thuộc tháng, to thuộc tháng sau', () => {
    const { from, to } = monthRange(2026, 11);
    expect(monthOf(from)).toEqual({ year: 2026, month: 11 });
    expect(monthOf(to)).toEqual({ year: 2026, month: 12 });
  });
});

describe('URL & nhãn', () => {
  it('monthPath đệm số 0', () => {
    expect(monthPath(2026, 3)).toBe('/archive/2026/03');
    expect(monthPath(2026, 11)).toBe('/archive/2026/11');
  });
  it('monthLabel', () => {
    expect(monthLabel(2026, 10)).toBe('Tháng 10/2026');
  });
});

describe('thin client: archive', () => {
  it('getArchiveMonths gom từ published_at', async () => {
    const f = mockFetch({
      data: [
        { published_at: '2026-10-24T04:23:00Z' },
        { published_at: '2026-10-25T04:23:00Z' },
        { published_at: null },
      ],
    });
    const c = await loadClient();
    expect(await c.getArchiveMonths()).toEqual([{ year: 2026, month: 10, count: 2 }]);
    expect(String(f.mock.calls[0][0])).toContain('fields=published_at&limit=-1');
  });

  it('listPostsByMonth lọc theo khoảng giờ VN và sắp mới nhất trước', async () => {
    const f = mockFetch({ data: [] });
    const c = await loadClient();
    expect(await c.listPostsByMonth(2026, 10)).toEqual([]);
    const url = decodeURIComponent(String(f.mock.calls[0][0]));
    expect(url).toContain('filter[published_at][_gte]=2026-09-30T17:00:00.000Z');
    expect(url).toContain('filter[published_at][_lt]=2026-10-31T17:00:00.000Z');
    expect(url).toContain('sort=-published_at');
  });

  it('listPostsByMonth lấy tiếp trang khi đủ 50 bài', async () => {
    const mk = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `p${i}`,
        title: `T${i}`,
        slug: `t${i}`,
        published_at: '2026-10-10T00:00:00Z',
        author: { name: 'An', slug: 'an' },
      }));
    const pages = [{ data: mk(50) }, { data: mk(3) }];
    const f = vi.fn(
      async (..._args: unknown[]) => new Response(JSON.stringify(pages.shift()), { status: 200 }),
    );
    vi.stubGlobal('fetch', f);
    const c = await loadClient();
    const items = await c.listPostsByMonth(2026, 10);
    expect(items).toHaveLength(53);
    expect(f).toHaveBeenCalledTimes(2);
    expect(decodeURIComponent(String(f.mock.calls[1][0]))).toContain('offset=50');
  });
});
