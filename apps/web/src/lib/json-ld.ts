// JSON-LD BlogPosting của trang bài viết (tách ra từ posts/[slug].astro để test được; hành vi giữ nguyên).
// Chỉ dùng field DTO sẵn có, không đổi kiến trúc (R3).
import type { PostDetail } from './types';

export interface JsonLdContext {
  /** Astro.site — có thể undefined khi chưa cấu hình PUBLIC_SITE_URL. */
  site: URL | undefined;
  siteName: string;
  /** Ảnh dự phòng khi bài không có cover (đã tuyệt đối hoá). */
  imageAbs: string;
  pageUrl: string;
}

export function buildPostJsonLd(
  post: PostDetail,
  { site, siteName, imageAbs, pageUrl }: JsonLdContext,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    author: {
      '@type': 'Person',
      name: post.author.name,
      ...(site && post.author.slug
        ? { url: new URL(`/author/${post.author.slug}`, site).href }
        : {}),
    },
    ...(post.category ? { articleSection: post.category.name } : {}),
    ...(post.tags.length ? { keywords: post.tags.map((t) => t.name).join(', ') } : {}),
    image: imageAbs,
    mainEntityOfPage: pageUrl,
    publisher: { '@type': 'Organization', name: siteName },
  };
}

/** JSON-LD WebSite — trang chủ, giúp Google hiểu tên site. */
export function buildWebSiteJsonLd(siteName: string, siteUrl: string, description?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    inLanguage: 'vi',
    ...(description ? { description } : {}),
  };
}

export interface Crumb {
  name: string;
  /** URL tuyệt đối. */
  url: string;
}

/** JSON-LD BreadcrumbList — vị trí đánh số từ 1 theo thứ tự truyền vào. */
export function buildBreadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/** Escape '<' để chuỗi JSON không thể phá vỡ ngữ cảnh <script> (nội dung tin cậy, vẫn hardening). */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
