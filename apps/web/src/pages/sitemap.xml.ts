// Endpoint sitemap.xml (Sprint 5 Phase 2) — TỰ VIẾT, không thêm dependency.
// Chính sách (Decision Log [S5-P0]): CHỈ canonical *content* URL —
//   home + mọi bài published + trang-1 mỗi chuyên mục + trang-1 mỗi thẻ + /categories + trang-1 mỗi tác giả có bài + /archive và mỗi tháng có bài.
// LOẠI pagination (/page/N, /category/<slug>/page/N): là điều hướng, không
//   canonical → tránh loãng crawl budget. Pagination vẫn index được nhờ
//   self-canonical + rel=prev/next (Base.astro / Pagination.astro).
// `<lastmod>`: bài = published_at; trang chủ = ngày bài mới nhất (field date_updated không nằm trong
//   quyền đọc Public nên không dùng). Trang danh sách khác không gắn lastmod.
// Nguồn URL: thin client sẵn có (KHÔNG đổi hợp đồng). Địa chỉ tuyệt đối lấy từ `site` (= PUBLIC_SITE_URL).
import type { APIRoute } from 'astro';
import {
  listPostSitemapEntries,
  getAllCategorySlugs,
  getAllAuthorSlugs,
  getAllTagSlugs,
  getArchiveMonths,
} from '../lib/directus';
import { monthPath } from '../lib/archive';
import { buildSitemapXml, type SitemapEntry } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'http://localhost:4321/').replace(/\/$/, '');
  const [posts, categorySlugs, tagSlugs, authorSlugs, months] = await Promise.all([
    listPostSitemapEntries(),
    getAllCategorySlugs(),
    getAllTagSlugs(),
    getAllAuthorSlugs(),
    getArchiveMonths(),
  ]);

  // Danh sách đã sắp mới nhất trước → bài đầu có ngày là bài mới nhất.
  const newest = posts.find((p) => p.publishedAt)?.publishedAt ?? null;

  const entries: SitemapEntry[] = [
    { path: '/', lastmod: newest },
    ...posts.map((p) => ({ path: `/posts/${p.slug}`, lastmod: p.publishedAt })),
    ...categorySlugs.map((s) => ({ path: `/category/${s}` })),
    ...tagSlugs.map((s) => ({ path: `/tag/${s}` })),
    { path: '/categories' },
    ...authorSlugs.map((s) => ({ path: `/author/${s}` })),
    { path: '/archive' },
    ...months.map((m) => ({ path: monthPath(m.year, m.month) })),
  ].map(({ path, lastmod }: { path: string; lastmod?: string | null }) => ({
    loc: base + path,
    lastmod,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
