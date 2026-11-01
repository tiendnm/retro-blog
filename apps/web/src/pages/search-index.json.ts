// Chỉ mục tìm kiếm tĩnh /search-index.json — dựng lúc build, trình duyệt tải ở lần tìm đầu tiên (xem scripts/search.ts).
// Chỉ chứa bài đã xuất bản (Public role). Không đưa vào sitemap.
import type { APIRoute } from 'astro';
import { listSearchDocs } from '../lib/directus';
import { buildSearchIndex } from '../lib/search-index';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(buildSearchIndex(await listSearchDocs())), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
