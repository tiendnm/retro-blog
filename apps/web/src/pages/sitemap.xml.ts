// Endpoint sitemap.xml (Sprint 5 Phase 2) — TỰ VIẾT, không thêm dependency.
// Chính sách (Decision Log [S5-P0], siết lại để dồn crawl budget): CHỈ trang chủ + mọi bài published
//   + chuyên mục có ≥ MIN_INDEXABLE_CATEGORY_POSTS bài (lib/indexing.ts).
// LOẠI thẻ, lưu trữ, tác giả, /categories, chuyên mục ít bài và phân trang: các trang này vẫn truy cập được nhưng gắn
//   `noindex,follow` (Base.astro) — KHÔNG chặn trong robots.txt để bot còn đọc được thẻ noindex.
// `<lastmod>`: bài = date_updated (rơi về published_at nếu chưa sửa lần nào); trang chủ = lastmod mới nhất. Chuyên mục không gắn lastmod.
// Nguồn URL: thin client sẵn có (KHÔNG đổi hợp đồng). Địa chỉ tuyệt đối lấy từ `site` (= PUBLIC_SITE_URL).
import type { APIRoute } from 'astro';
import { listPostSitemapEntries, listCategoryInfos } from '../lib/directus';
import { isCategoryIndexable } from '../lib/indexing';
import { buildSitemapXml, type SitemapEntry } from '../lib/sitemap';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'http://localhost:4321/').replace(/\/$/, '');
  const [posts, categories] = await Promise.all([listPostSitemapEntries(), listCategoryInfos()]);

  // Danh sách đã sắp mới nhất trước → bài đầu có ngày là bài mới nhất.
  const lastmodOf = (p: (typeof posts)[number]) => p.updatedAt ?? p.publishedAt;
  const newest = posts.map(lastmodOf).filter(Boolean).sort().at(-1) ?? null;

  const entries: SitemapEntry[] = [
    { path: '/', lastmod: newest },
    ...posts.map((p) => ({ path: `/posts/${p.slug}`, lastmod: lastmodOf(p) })),
    ...categories
      .filter((c) => isCategoryIndexable(c.count))
      .map((c) => ({ path: `/category/${c.slug}`, lastmod: undefined })),
  ].map(({ path, lastmod }: { path: string; lastmod?: string | null }) => ({
    loc: base + path,
    lastmod,
  }));

  return new Response(buildSitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
