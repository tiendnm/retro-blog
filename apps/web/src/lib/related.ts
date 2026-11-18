// Chọn "Bài liên quan" cho trang bài viết: ưu tiên cùng chuyên mục, rồi trùng thẻ, rồi bài mới nhất.
// Thuần hàm (không gọi Directus) để test được. Danh sách đầu vào đã sắp mới nhất trước → thứ tự ổn định.
import type { PostDetail, PostSummary } from './types';

export function pickRelatedPosts(
  current: Pick<PostDetail, 'slug' | 'category' | 'tags'>,
  candidates: PostSummary[],
  limit = 3,
): PostSummary[] {
  const tagSlugs = new Set(current.tags.map((t) => t.slug));
  const score = (p: PostSummary) =>
    (current.category && p.category?.slug === current.category.slug ? 10 : 0) +
    p.tags.filter((t) => tagSlugs.has(t.slug)).length;
  return candidates
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.slug !== current.slug)
    .sort((a, b) => score(b.p) - score(a.p) || a.i - b.i)
    .slice(0, limit)
    .map(({ p }) => p);
}
