// Endpoint sitemap.xml (Sprint 5 Phase 2) — TỰ VIẾT, không thêm dependency.
// Chính sách (Decision Log [S5-P0]): CHỈ canonical *content* URL —
//   home + mọi bài published + trang-1 mỗi chuyên mục.
// LOẠI pagination (/page/N, /category/<slug>/page/N): là điều hướng, không
//   canonical → tránh loãng crawl budget. Pagination vẫn index được nhờ
//   self-canonical + rel=prev/next (Base.astro / Pagination.astro).
// Nguồn URL: getAllPublishedPostSlugs / getAllCategorySlugs (thin client sẵn có,
//   KHÔNG đổi hợp đồng). Địa chỉ tuyệt đối lấy từ `site` (= PUBLIC_SITE_URL).
import type { APIRoute } from 'astro';
import { getAllPublishedPostSlugs, getAllCategorySlugs } from '../lib/directus';

// Escape ký tự đặc biệt XML trong <loc>. Slug hiện là [a-z0-9-] nên hiếm khi
// cần, nhưng giữ an toàn nếu quy ước slug đổi.
const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'http://localhost:4321/').replace(/\/$/, '');
  const [postSlugs, categorySlugs] = await Promise.all([
    getAllPublishedPostSlugs(),
    getAllCategorySlugs(),
  ]);

  const paths = [
    '/',
    ...postSlugs.map((s) => `/posts/${s}`),
    ...categorySlugs.map((s) => `/category/${s}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${xmlEscape(base + p)}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
