import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalize, search, snippet, tokenize, type SearchEntry } from '../src/lib/search';
import { MAX_TEXT, buildSearchIndex, htmlToText } from '../src/lib/search-index';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const entry = (over: Partial<SearchEntry> = {}): SearchEntry => ({
  u: '/posts/a',
  t: 'Bài A',
  e: '',
  c: '',
  g: [],
  d: '2026-10-01T00:00:00Z',
  x: '',
  ...over,
});

describe('normalize / tokenize', () => {
  it('bỏ dấu tiếng Việt, đ → d, hạ chữ thường', () => {
    expect(normalize('Đồng hồ ĐIỆN tử Thế Hệ')).toBe('dong ho dien tu the he');
  });
  it('giữ nguyên độ dài (để cắt đoạn trích đúng vị trí)', () => {
    const s = 'Hồi sinh một dàn P4 — Đẹp ế';
    expect(normalize(s)).toHaveLength(s.length);
  });
  it('tokenize: ngăn cách bởi ký tự không phải chữ/số, bỏ trùng và rỗng', () => {
    expect(tokenize('  Pentium-4,  pentium 2.8C ')).toEqual(['pentium', '4', '2', '8c']);
    expect(tokenize('  !!! ')).toEqual([]);
  });
});

describe('search', () => {
  const posts = [
    entry({
      u: '/posts/p4',
      t: 'Hồi sinh dàn Pentium 4',
      x: 'Bo mạch chủ Asus P4P800',
      g: ['Retro'],
      c: 'Build log',
    }),
    entry({
      u: '/posts/z80',
      t: 'Z80 và CP/M',
      e: 'Một máy tính 8 bit',
      x: 'Pentium chưa ra đời',
      d: '2026-09-01T00:00:00Z',
    }),
    entry({
      u: '/posts/dongho',
      t: 'Đồng hồ thời gian thực',
      x: 'DS1307 qua I2C',
      d: '2026-08-01T00:00:00Z',
    }),
  ];

  it('gõ không dấu vẫn ra tiêu đề có dấu', () => {
    expect(search(posts, 'dong ho').map((h) => h.entry.u)).toEqual(['/posts/dongho']);
  });
  it('khớp chuỗi con (gõ dở)', () => {
    expect(search(posts, 'pent').map((h) => h.entry.u)).toEqual(['/posts/p4', '/posts/z80']);
  });
  it('khớp trong tiêu đề xếp trên khớp chỉ trong nội dung', () => {
    const r = search(posts, 'pentium');
    expect(r[0].entry.u).toBe('/posts/p4');
    expect(r[0].score).toBeGreaterThan(r[1].score);
  });
  it('mọi từ phải xuất hiện (AND)', () => {
    expect(search(posts, 'pentium asus').map((h) => h.entry.u)).toEqual(['/posts/p4']);
    expect(search(posts, 'pentium ds1307')).toEqual([]);
  });
  it('tìm theo thẻ và chuyên mục', () => {
    expect(search(posts, 'retro').map((h) => h.entry.u)).toEqual(['/posts/p4']);
    expect(search(posts, 'build log').map((h) => h.entry.u)).toEqual(['/posts/p4']);
  });
  it('hoà điểm → bài mới hơn trước', () => {
    const r = search(
      [
        entry({ u: '/cu', t: 'Máy cũ', d: '2020-01-01T00:00:00Z' }),
        entry({ u: '/moi', t: 'Máy mới', d: '2026-01-01T00:00:00Z' }),
      ],
      'may',
    );
    expect(r.map((h) => h.entry.u)).toEqual(['/moi', '/cu']);
  });
  it('truy vấn trống / chỉ ký hiệu → không có kết quả', () => {
    expect(search(posts, '')).toEqual([]);
    expect(search(posts, ' ?! ')).toEqual([]);
  });
});

describe('snippet', () => {
  it('có tóm tắt → dùng tóm tắt', () => {
    expect(snippet(entry({ e: 'Tóm tắt', x: 'nội dung' }), 'noi')).toBe('Tóm tắt');
  });
  it('không có tóm tắt → cắt quanh từ khoá, giữ nguyên dấu của văn bản gốc', () => {
    const text = `${'a '.repeat(100)}Đồng hồ thời gian thực DS1307 ${'b '.repeat(100)}`;
    const s = snippet(entry({ x: text }), 'dong ho');
    expect(s).toContain('Đồng hồ');
    expect(s.startsWith('… ')).toBe(true);
    expect(s.endsWith(' …')).toBe(true);
  });
  it('không có gì để trích → rỗng', () => {
    expect(snippet(entry(), 'x')).toBe('');
  });
});

describe('dựng chỉ mục (build)', () => {
  it('htmlToText: bỏ thẻ/script/style, giải mã thực thể, gộp khoảng trắng', () => {
    expect(
      htmlToText(
        '<h2>Tiêu&nbsp;đề</h2><script>alert(1)</script><style>p{}</style><p>A &amp; B &lt;c&gt;</p>\n\n<p>d</p>',
      ),
    ).toContain('A & B <c> d');
    expect(htmlToText('<script>alert(1)</script><p>x</p>')).toBe('x');
  });
  it('không giải mã hai lần: &amp;lt; → &lt; (không phải <)', () => {
    expect(htmlToText('<p>&amp;lt;</p>')).toBe('&lt;');
  });
  it('buildSearchIndex: đường dẫn, NFC, cắt thân bài, thẻ/chuyên mục', () => {
    const [e] = buildSearchIndex([
      {
        title: 'Đồng hồ'.normalize('NFD'),
        slug: 'dong-ho',
        excerpt: null,
        body: `<p>${'x'.repeat(MAX_TEXT + 500)}</p>`,
        publishedAt: '2026-10-01T00:00:00Z',
        categoryName: 'Build log',
        tagNames: ['Retro'],
      },
    ]);
    expect(e.u).toBe('/posts/dong-ho');
    expect(e.t).toBe('Đồng hồ'.normalize('NFC'));
    expect(e.e).toBe('');
    expect(e.x).toHaveLength(MAX_TEXT);
    expect(e.c).toBe('Build log');
    expect(e.g).toEqual(['Retro']);
  });
});

describe('thin client: listSearchDocs', () => {
  it('map bài + chuyên mục + thẻ; hỏi đúng field, không lấy trường nhạy cảm', async () => {
    const f = mockFetch({
      data: [
        {
          id: '1',
          title: 'P4',
          slug: 'p4',
          excerpt: 'tt',
          body: '<p>x</p>',
          published_at: '2026-10-24T04:23:00Z',
          category: { name: 'Build log', slug: 'build-log' },
          tags: [{ tags_id: { name: 'Retro', slug: 'retro' } }, { tags_id: null }],
        },
      ],
    });
    const c = await loadClient();
    expect(await c.listSearchDocs()).toEqual([
      {
        title: 'P4',
        slug: 'p4',
        excerpt: 'tt',
        body: '<p>x</p>',
        publishedAt: '2026-10-24T04:23:00Z',
        categoryName: 'Build log',
        tagNames: ['Retro'],
      },
    ]);
    const url = String(f.mock.calls[0][0]);
    expect(url).toContain(
      'fields=title,slug,excerpt,body,published_at,category.name,tags.tags_id.name',
    );
    expect(url).not.toContain('fields=*');
  });
});
