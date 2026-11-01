// Chọn trang mẫu từ chính sitemap.xml của site đang phục vụ → test không bám slug của seed.

/** @param {import('@playwright/test').APIRequestContext} request */
export async function loadSamples(request) {
  const xml = await (await request.get('/sitemap.xml')).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const first = (re) => paths.find((p) => re.test(p));
  const posts = paths.filter((p) => p.startsWith('/posts/'));

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
    category: first(/^\/category\/[^/]+$/),
    tag: first(/^\/tag\/[^/]+$/),
    author: first(/^\/author\/[^/]+$/),
    archive: '/archive',
    archiveMonth: first(/^\/archive\/\d{4}\/\d{2}$/),
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
