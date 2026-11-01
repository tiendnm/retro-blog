// Endpoint /rss.xml — RSS 2.0, 20 bài mới nhất, đủ nội dung. Cùng cách dựng với sitemap/robots:
// địa chỉ tuyệt đối lấy từ `site` (= PUBLIC_SITE_URL), dữ liệu qua thin client (không đổi hợp đồng).
import type { APIRoute } from 'astro';
import { getPostBySlug, getSiteSettings, listPublishedPosts } from '../lib/directus';
import { buildRss } from '../lib/rss';
import type { PostDetail } from '../lib/types';

const FEED_SIZE = 20;

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'http://localhost:4321/').replace(/\/$/, '');
  const [settings, { items }] = await Promise.all([
    getSiteSettings(),
    listPublishedPosts({ pageSize: FEED_SIZE }),
  ]);
  // Danh sách chỉ có tóm tắt → lấy chi tiết từng bài để có body (tuần tự: build trên máy yếu, 20 request nhỏ).
  const posts: PostDetail[] = [];
  for (const item of items) {
    const post = await getPostBySlug(item.slug);
    if (post) posts.push(post);
  }

  return new Response(
    buildRss({ base, name: settings.siteName, description: settings.description }, posts),
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
  );
};
