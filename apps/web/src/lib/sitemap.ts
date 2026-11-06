// Dựng XML sitemap (tách khỏi pages/sitemap.xml.ts để test được).
// `lastmod` chỉ gắn khi có ngày hợp lệ — ngày sai còn tệ hơn không có (Google bỏ qua lastmod không đáng tin).

export interface SitemapEntry {
  loc: string;
  /** ISO 8601; bỏ qua nếu không parse được. */
  lastmod?: string | null;
}

// Escape ký tự đặc biệt XML trong <loc>. Slug hiện là [a-z0-9-] nên hiếm khi
// cần, nhưng giữ an toàn nếu quy ước slug đổi.
export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

const lastmodTag = (v: string | null | undefined): string => {
  if (!v) return '';
  const t = Date.parse(v);
  return Number.isNaN(t) ? '' : `<lastmod>${new Date(t).toISOString()}</lastmod>`;
};

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const rows = entries.map(
    (e) => `  <url><loc>${xmlEscape(e.loc)}</loc>${lastmodTag(e.lastmod)}</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.join('\n')}
</urlset>
`;
}
