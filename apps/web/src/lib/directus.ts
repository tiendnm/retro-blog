// ============================================================================
// Thin fetch client — TẦNG API DUY NHẤT được phép gọi Directus.
// Page/component KHÔNG gọi Directus trực tiếp; chỉ import các hàm ở đây và
// nhận về DTO ([types.ts] / hợp đồng 03d). Không nhúng secret.
//
// - Fetch server-side qua DIRECTUS_INTERNAL_URL, KHÔNG gửi token ⇒ vai Public.
//   ⇒ Directus tự áp Public permission: chỉ posts đã publish & đã tới giờ,
//     và CHỈ field trong allowlist (05-cms §2). Bảo mật nằm ở tầng permission.
// - Field yêu cầu ở dưới PHẢI là tập con của Public allowlist, nếu không
//   Directus trả FORBIDDEN.
// Hiện thực cho hợp đồng [docs/03d-api-contract.md §2]. Chi tiết: [06-api.md].
// ============================================================================
import type {
  AuthorDetail,
  AuthorSummary,
  CategoryRef,
  MediaRef,
  PostDetail,
  PostListResult,
  PostSummary,
  SiteSettings,
} from './types';
import { rewriteAssetUrls } from './rewrite-assets';
import { sanitizeBody } from './sanitize-body';

// URL container→Directus (server-side). Không token ⇒ Public role.
const INTERNAL_URL = process.env.DIRECTUS_INTERNAL_URL ?? 'http://directus:8055';
// URL công khai để BROWSER tải asset (ảnh) — nhúng vào HTML lúc render.
const PUBLIC_URL = process.env.PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055';

const DEFAULT_PAGE_SIZE = 10; // 03d §4
const MAX_PAGE_SIZE = 50;

// Field allowlist gửi lên Directus — TẬP CON của Public permission (05-cms §2).
const SUMMARY_FIELDS =
  'id,title,slug,excerpt,published_at,author.name,author.slug,' +
  'category.name,category.slug,cover.id,cover.alt';
const DETAIL_FIELDS =
  'id,title,slug,excerpt,body,published_at,' +
  'author.name,author.slug,author.avatar.id,author.avatar.alt,' +
  'category.name,category.slug,cover.id,cover.alt';

// ---- Hình dạng thô từ Directus (nội bộ module — KHÔNG rò ra UI) ----
interface RawFile {
  id?: string | null;
  alt?: string | null;
}
interface RawAuthor {
  name?: string | null;
  slug?: string | null;
  avatar?: RawFile | null;
}
interface RawCategory {
  name?: string | null;
  slug?: string | null;
}
interface RawPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  published_at?: string | null;
  author?: RawAuthor | null;
  category?: RawCategory | null;
  cover?: RawFile | null;
}
interface DirectusList<T> {
  data: T;
  meta?: { filter_count?: number };
}

/** Lỗi theo mô hình 03d §5 (rút gọn cho consumer đọc-only). */
export class DirectusError extends Error {
  constructor(
    public code: 'not_found' | 'system',
    message: string,
  ) {
    super(message);
    this.name = 'DirectusError';
  }
}

async function directusGet<T>(path: string): Promise<DirectusList<T>> {
  let res: Response;
  try {
    res = await fetch(`${INTERNAL_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    throw new DirectusError('system', `Directus không truy cập được: ${(e as Error).message}`);
  }
  if (!res.ok) {
    // 401/403/404 với vai Public ⇒ quy về not_found (không lộ sự tồn tại — 03d §5).
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      throw new DirectusError('not_found', `HTTP ${res.status} @ ${path}`);
    }
    throw new DirectusError('system', `HTTP ${res.status} @ ${path}`);
  }
  return (await res.json()) as DirectusList<T>;
}

// ---- Mapping Directus item → DTO ----
function toMedia(f?: RawFile | null): MediaRef | null {
  if (!f?.id) return null;
  return { url: `${PUBLIC_URL}/assets/${f.id}`, alt: f.alt ?? '' };
}
function toAuthorSummary(a?: RawAuthor | null): AuthorSummary {
  return { name: a?.name ?? '', slug: a?.slug ?? '' };
}
function toAuthorDetail(a?: RawAuthor | null): AuthorDetail {
  return { ...toAuthorSummary(a), avatar: toMedia(a?.avatar) };
}
function toCategory(c?: RawCategory | null): CategoryRef | null {
  if (!c?.slug) return null;
  return { name: c.name ?? '', slug: c.slug };
}
function toSummary(p: RawPost): PostSummary {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    cover: toMedia(p.cover),
    publishedAt: p.published_at ?? null,
    author: toAuthorSummary(p.author),
    category: toCategory(p.category),
  };
}
// ---- Site settings (singleton) — ADR-0012 ----
interface RawSiteSettings {
  site_name?: string | null;
  description?: string | null;
  footer_text?: string | null;
  default_og_image?: RawFile | null;
}
const DEFAULT_SITE_NAME = 'Retro Blog';
const DEFAULT_DESCRIPTION =
  'Blog về máy tính cổ: phần cứng, phần mềm, lập trình và kiến thức nền tảng.';

/** Map + áp fallback: CMS chưa cấu hình / field trống → giá trị mặc định (không đổi hành vi cũ). */
function toSiteSettings(
  raw: RawSiteSettings | null | undefined,
  year = new Date().getFullYear(),
): SiteSettings {
  const siteName = raw?.site_name?.trim() || DEFAULT_SITE_NAME;
  const footer =
    raw?.footer_text?.trim() || `© {year} ${siteName} — nhật ký của những chiếc máy tính cổ.`;
  return {
    siteName,
    description: raw?.description?.trim() || DEFAULT_DESCRIPTION,
    footerText: footer.replaceAll('{year}', String(year)),
    defaultOgImage: toMedia(raw?.default_og_image),
  };
}

let siteSettingsCache: Promise<SiteSettings> | undefined;
/** Cấu hình site. Build (PROD) cache 1 lần/tiến trình; dev luôn đọc mới để sửa trong CMS thấy ngay. */
export function getSiteSettings(): Promise<SiteSettings> {
  if (import.meta.env.PROD && siteSettingsCache) return siteSettingsCache;
  const p = (async () => {
    try {
      const res = await directusGet<RawSiteSettings | RawSiteSettings[] | null>(
        '/items/site_settings?fields=site_name,description,footer_text,default_og_image.id,default_og_image.alt',
      );
      const raw = Array.isArray(res.data) ? res.data[0] : res.data;
      return toSiteSettings(raw);
    } catch (e) {
      // Chưa có quyền/bản ghi → mặc định; lỗi hệ thống vẫn nổi lên (giống các hàm khác).
      if (e instanceof DirectusError && e.code === 'not_found') return toSiteSettings(null);
      throw e;
    }
  })();
  if (import.meta.env.PROD) siteSettingsCache = p;
  return p;
}

function toDetail(p: RawPost): PostDetail {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    body: p.body ? rewriteAssetUrls(sanitizeBody(p.body), PUBLIC_URL) : null,
    publishedAt: p.published_at ?? null,
    author: toAuthorDetail(p.author),
    category: toCategory(p.category),
    cover: toMedia(p.cover),
  };
}

function clampPage(n?: number): number {
  return n && Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
function clampPageSize(n?: number): number {
  if (!n || !Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

export interface ListParams {
  page?: number;
  pageSize?: number;
}

// ---- Thao tác hợp đồng (03d §2) ----

/** Liệt kê bài đã xuất bản (mới nhất trước). Public role tự lọc published. */
export async function listPublishedPosts(params: ListParams = {}): Promise<PostListResult> {
  const page = clampPage(params.page);
  const pageSize = clampPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const { data, meta } = await directusGet<RawPost[]>(
    `/items/posts?fields=${SUMMARY_FIELDS}&sort=-published_at&limit=${pageSize}&offset=${offset}&meta=filter_count`,
  );
  const total = meta?.filter_count ?? data.length;
  return {
    items: data.map(toSummary),
    pageInfo: { total, page, pageSize, hasMore: offset + data.length < total },
  };
}

/** Lấy bài theo slug. `null` nếu không tồn tại/chưa publish (không lộ draft). */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  try {
    const { data } = await directusGet<RawPost[]>(
      `/items/posts?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=${DETAIL_FIELDS}&limit=1`,
    );
    return data.length ? toDetail(data[0]) : null;
  } catch (e) {
    if (e instanceof DirectusError && e.code === 'not_found') return null;
    throw e;
  }
}

/** Liệt kê bài đã xuất bản trong một chuyên mục. */
export async function listPostsByCategory(
  categorySlug: string,
  params: ListParams = {},
): Promise<PostListResult> {
  const page = clampPage(params.page);
  const pageSize = clampPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const { data, meta } = await directusGet<RawPost[]>(
    `/items/posts?filter[category][slug][_eq]=${encodeURIComponent(categorySlug)}` +
      `&fields=${SUMMARY_FIELDS}&sort=-published_at&limit=${pageSize}&offset=${offset}&meta=filter_count`,
  );
  const total = meta?.filter_count ?? data.length;
  return {
    items: data.map(toSummary),
    pageInfo: { total, page, pageSize, hasMore: offset + data.length < total },
  };
}

/** Lấy thông tin chuyên mục theo slug (cho tiêu đề trang). `null` nếu không có. */
export async function getCategoryBySlug(slug: string): Promise<CategoryRef | null> {
  try {
    const { data } = await directusGet<RawCategory[]>(
      `/items/categories?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=name,slug&limit=1`,
    );
    return data.length ? toCategory(data[0]) : null;
  } catch (e) {
    if (e instanceof DirectusError && e.code === 'not_found') return null;
    throw e;
  }
}

/** Danh sách chuyên mục (thanh chuyên mục). Build (PROD) cache 1 lần/tiến trình. */
let categoriesCache: Promise<CategoryRef[]> | undefined;
export function listCategories(): Promise<CategoryRef[]> {
  if (import.meta.env.PROD && categoriesCache) return categoriesCache;
  const p = directusGet<RawCategory[]>(
    '/items/categories?fields=name,slug&sort=name&limit=-1',
  ).then((r) => r.data.map(toCategory).filter((c): c is CategoryRef => c !== null));
  if (import.meta.env.PROD) categoriesCache = p;
  return p;
}

// ---- Hỗ trợ getStaticPaths (SSG — ADR-0006) ----

/** Tất cả slug bài đã xuất bản (dựng route tĩnh /posts/[slug]). */
export async function getAllPublishedPostSlugs(): Promise<string[]> {
  const { data } = await directusGet<{ slug: string }[]>(`/items/posts?fields=slug&limit=-1`);
  return data.map((p) => p.slug);
}

/** Tất cả slug chuyên mục (dựng route tĩnh /category/[slug]). */
export async function getAllCategorySlugs(): Promise<string[]> {
  const { data } = await directusGet<{ slug: string }[]>(`/items/categories?fields=slug&limit=-1`);
  return data.map((c) => c.slug);
}
