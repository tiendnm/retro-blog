// Tìm kiếm trên trình duyệt — hàm thuần (không DOM, không Directus) để test được; script search.ts chỉ nối vào trang.
// Khớp KHÔNG DẤU và không phân biệt hoa/thường: gõ "dong ho" vẫn ra "Đồng hồ". Mọi từ trong truy vấn phải xuất hiện
// (AND); khớp theo chuỗi con nên gõ dở ("pent") vẫn ra "Pentium".

/** Một bài trong chỉ mục (search-index.json). Khoá ngắn vì file được tải ở mỗi lần tìm đầu tiên. */
export interface SearchEntry {
  /** Đường dẫn bài, vd /posts/abc */
  u: string;
  /** Tiêu đề */
  t: string;
  /** Tóm tắt */
  e: string;
  /** Chuyên mục (tên) — rỗng nếu không có */
  c: string;
  /** Thẻ (tên) */
  g: string[];
  /** Ngày đăng ISO — null nếu không có */
  d: string | null;
  /** Nội dung dạng chữ thuần (không HTML), đã cắt ngắn */
  x: string;
}

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

/**
 * Bỏ dấu + hạ chữ thường, từng ký tự một → ĐỘ DÀI KHÔNG ĐỔI, vị trí trong chuỗi đã chuẩn hoá trỏ đúng vị trí trong
 * chuỗi gốc (cần để cắt đoạn trích). Chuỗi gốc nên ở dạng NFC (index được dựng như vậy).
 */
export function normalize(s: string): string {
  let out = '';
  for (const ch of s) {
    if (ch === 'đ' || ch === 'Đ') {
      out += 'd';
      continue;
    }
    const base = ch.normalize('NFD')[0] ?? ch;
    out += base.toLowerCase()[0] ?? base;
  }
  return out;
}

/** Truy vấn → các từ khoá (đã chuẩn hoá, bỏ trùng). Ký tự không phải chữ/số là dấu ngăn cách. */
export function tokenize(query: string): string[] {
  const tokens = normalize(query.normalize('NFC'))
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return [...new Set(tokens)];
}

const W_TITLE = 5;
const W_TAG = 3;
const W_CATEGORY = 2;
const W_EXCERPT = 2;
const W_BODY = 1;
const W_PHRASE = 5;

interface Prepared {
  title: string;
  tags: string;
  category: string;
  excerpt: string;
  body: string;
}
const cache = new WeakMap<SearchEntry, Prepared>();
function prepare(e: SearchEntry): Prepared {
  let p = cache.get(e);
  if (!p) {
    p = {
      title: normalize(e.t),
      tags: normalize(e.g.join(' ')),
      category: normalize(e.c),
      excerpt: normalize(e.e),
      body: normalize(e.x),
    };
    cache.set(e, p);
  }
  return p;
}

/** Xếp hạng: loại bài thiếu từ nào đó; điểm theo nơi khớp (tiêu đề > thẻ > chuyên mục/tóm tắt > nội dung); hoà điểm → mới nhất trước. */
export function search(entries: SearchEntry[], query: string): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const phrase = tokens.join(' ');
  const hits: SearchHit[] = [];
  for (const entry of entries) {
    const p = prepare(entry);
    let score = 0;
    let all = true;
    for (const tk of tokens) {
      let s = 0;
      if (p.title.includes(tk)) s += W_TITLE;
      if (p.tags.includes(tk)) s += W_TAG;
      if (p.category.includes(tk)) s += W_CATEGORY;
      if (p.excerpt.includes(tk)) s += W_EXCERPT;
      if (p.body.includes(tk)) s += W_BODY;
      if (s === 0) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    if (tokens.length > 1 && p.title.includes(phrase)) score += W_PHRASE;
    hits.push({ entry, score });
  }
  return hits.sort((a, b) => b.score - a.score || (b.entry.d ?? '').localeCompare(a.entry.d ?? ''));
}

const SNIPPET_BEFORE = 60;
const SNIPPET_LENGTH = 180;

/** Đoạn trích hiển thị: tóm tắt nếu có; không thì đoạn nội dung quanh từ khoá đầu tiên khớp. */
export function snippet(entry: SearchEntry, query: string): string {
  if (entry.e) return entry.e;
  const text = entry.x;
  if (!text) return '';
  const norm = normalize(text);
  let at = -1;
  for (const tk of tokenize(query)) {
    const i = norm.indexOf(tk);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  const start = Math.max(0, (at === -1 ? 0 : at) - SNIPPET_BEFORE);
  const piece = text.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? '… ' : ''}${piece}${start + SNIPPET_LENGTH < text.length ? ' …' : ''}`;
}
