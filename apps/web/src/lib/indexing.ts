// Chính sách lập chỉ mục (SEO). Site còn ít bài → các trang danh sách (thẻ, lưu trữ, tác giả, phân trang…) rất mỏng,
// để công cụ tìm kiếm tập trung vào trang chủ + bài viết thì chúng gắn `noindex,follow` và KHÔNG nằm trong sitemap.
// Không chặn bằng robots.txt: bot phải tải được trang mới đọc được thẻ noindex.

/** Chuyên mục chỉ được lập chỉ mục (và vào sitemap) khi có ít nhất ngần này bài; đủ bài sẽ tự bật lại. */
export const MIN_INDEXABLE_CATEGORY_POSTS = 3;

export const isCategoryIndexable = (postCount: number): boolean =>
  postCount >= MIN_INDEXABLE_CATEGORY_POSTS;
