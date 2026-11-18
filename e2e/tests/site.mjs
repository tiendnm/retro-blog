// Chọn trang mẫu từ site đang phục vụ → test không bám slug của seed. Sitemap chỉ có trang chủ + bài (+ chuyên mục
// đủ bài); thẻ / tác giả / chuyên mục / tháng lưu trữ (noindex, vắng trong sitemap) được tìm qua link nội bộ.

/** @param {import('@playwright/test').APIRequestContext} request */
export async function loadSamples(request) {
  const xml = await (await request.get('/sitemap.xml')).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const posts = paths.filter((p) => p.startsWith('/posts/'));
  const linked = async (page, re) => {
    if (!page) return undefined;
    const html = await (await request.get(page)).text();
    return [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/(.)\/$/, '$1')).find((h) => re.test(h));
  };

  // Bài có ảnh trong thân bài (cần cho lightbox / axe ảnh).
  let richPost;
  for (const p of posts) {
    const html = await (await request.get(p)).text();
    if (/class="prose"[\s\S]*<img/.test(html)) {
      richPost = p;
      break;
    }
  }
  return {
    home: '/',
    post: posts[0],
    richPost,
    category: await linked('/categories', /^\/category\/[^/]+$/),
    tag: await linked(posts[0], /^\/tag\/[^/]+$/),
    author: await linked(posts[0], /^\/author\/[^/]+$/),
    archive: '/archive',
    archiveMonth: await linked('/archive', /^\/archive\/\d{4}\/\d{2}$/),
    categories: '/categories',
    search: '/search',
    notFound: '/khong-co-trang-nay',
  };
}

/** Các loại trang mẫu dùng cho axe / kiểm sức khoẻ trang (mỗi loại một mẫu). */
export const PAGE_KINDS = [
  'home',
  'post',
  'richPost',
  'category',
  'tag',
  'author',
  'archive',
  'archiveMonth',
  'categories',
  'search',
  'notFound',
];
