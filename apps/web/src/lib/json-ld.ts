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

/** Escape '<' để chuỗi JSON không thể phá vỡ ngữ cảnh <script> (nội dung tin cậy, vẫn hardening). */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
