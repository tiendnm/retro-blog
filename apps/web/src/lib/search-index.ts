// Dựng chỉ mục tìm kiếm LÚC BUILD (server) — tách khỏi search.ts để sanitize-html không bị đóng gói vào script trình duyệt.
import sanitizeHtml from 'sanitize-html';
import type { SearchEntry } from './search';

/** Thân bài dài chỉ lấy phần đầu: đủ để tìm, giữ file chỉ mục nhỏ (tải ở lần tìm đầu tiên). */
export const MAX_TEXT = 6000;

export interface SearchDoc {
  title: string;
  slug: string;
  excerpt: string | null;
  /** HTML thô từ CMS */
  body: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  tagNames: string[];
}

/** HTML → chữ thuần: bỏ thẻ (kể cả script/style), giải mã thực thể cơ bản, gộp khoảng trắng. Không dùng làm HTML. */
export function htmlToText(html: string): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&'); // &amp; PHẢI giải mã sau cùng, nếu không "&amp;lt;" bị giải mã hai lần
  return text.replace(/\s+/g, ' ').trim();
}

export function buildSearchIndex(docs: SearchDoc[]): SearchEntry[] {
  return docs.map((d) => ({
    u: `/posts/${d.slug}`,
    t: d.title.normalize('NFC'),
    e: (d.excerpt ?? '').normalize('NFC'),
    c: (d.categoryName ?? '').normalize('NFC'),
    g: d.tagNames.map((n) => n.normalize('NFC')),
    d: d.publishedAt,
    x: htmlToText(d.body ?? '')
      .normalize('NFC')
      .slice(0, MAX_TEXT),
  }));
}
