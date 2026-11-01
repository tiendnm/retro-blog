// Dựng RSS 2.0 cho /rss.xml — hàm thuần (không gọi Directus, không đọc env) để test được.
// Nội dung đầy đủ trong <content:encoded> (CDATA): body đã qua sanitizeBody + rewriteAssetUrls ở thin client,
// ở đây chỉ đổi URL tương đối nội bộ ("/posts/x") sang tuyệt đối vì feed reader không có origin để ghép.
import type { PostDetail } from './types';

export interface FeedSite {
  /** Gốc site, không có "/" cuối (vd https://retro.tiendnm.com). */
  base: string;
  name: string;
  description: string;
}

export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

/** CDATA không được chứa "]]>" → tách ra thành hai đoạn CDATA liền kề. */
export const cdata = (s: string): string => `<![CDATA[${s.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

/** "/x" (một dấu gạch) → tuyệt đối theo base; "//host", "https://…", "#a", "mailto:" giữ nguyên. */
export function absolutizeUrls(html: string, base: string): string {
  return html.replace(
    /\b(href|src)=(["'])\/(?!\/)([^"']*)\2/gi,
    (_m, attr: string, q: string, rest: string) => `${attr}=${q}${base}/${rest}${q}`,
  );
}

const rfc822 = (iso: string): string => new Date(iso).toUTCString();

function itemXml(post: PostDetail, site: FeedSite): string {
  const link = `${site.base}/posts/${post.slug}`;
  const parts = [
    `<title>${xmlEscape(post.title)}</title>`,
    `<link>${xmlEscape(link)}</link>`,
    `<guid isPermaLink="true">${xmlEscape(link)}</guid>`,
  ];
  if (post.publishedAt) parts.push(`<pubDate>${rfc822(post.publishedAt)}</pubDate>`);
  if (post.author.name) parts.push(`<dc:creator>${xmlEscape(post.author.name)}</dc:creator>`);
  if (post.category) parts.push(`<category>${xmlEscape(post.category.name)}</category>`);
  if (post.excerpt) parts.push(`<description>${xmlEscape(post.excerpt)}</description>`);
  if (post.body)
    parts.push(`<content:encoded>${cdata(absolutizeUrls(post.body, site.base))}</content:encoded>`);
  return `    <item>\n      ${parts.join('\n      ')}\n    </item>`;
}

/** `posts` đã sắp mới nhất trước. Bài không có publishedAt vẫn vào feed nhưng không có pubDate. */
export function buildRss(site: FeedSite, posts: PostDetail[]): string {
  const newest = posts.find((p) => p.publishedAt)?.publishedAt;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(site.name)}</title>
    <link>${xmlEscape(site.base)}/</link>
    <description>${xmlEscape(site.description)}</description>
    <language>vi</language>
    <atom:link href="${xmlEscape(site.base)}/rss.xml" rel="self" type="application/rss+xml" />${newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ''}
${posts.map((p) => itemXml(p, site)).join('\n')}
  </channel>
</rss>
`;
}
