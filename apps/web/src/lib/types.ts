// DTO — hình dạng dữ liệu mà UI (page/component) làm việc.
// Khớp API Contract [docs/03d-api-contract.md §3]. ĐÂY KHÔNG phải hình dạng
// Directus: mọi item Directus được map sang các kiểu này trong `directus.ts`,
// UI không bao giờ chạm JSON gốc của Directus (P3 — decoupling).

/** Ảnh (cover/avatar): URL công khai + alt cho a11y. `null` nếu không có. */
export interface MediaRef {
  url: string;
  alt: string;
}

/** Tác giả rút gọn (dùng ở danh sách). */
export interface AuthorSummary {
  name: string;
  slug: string;
}

/** Tác giả đầy đủ (dùng ở chi tiết) — kèm avatar. */
export interface AuthorDetail extends AuthorSummary {
  avatar: MediaRef | null;
}

/** Chuyên mục (độc quyền theo 03c). */
export interface CategoryRef {
  name: string;
  slug: string;
}

/** PostSummary — 03d §3.1 (trang danh sách). */
export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover: MediaRef | null;
  publishedAt: string | null;
  author: AuthorSummary;
  /** Chuyên mục (Sprint 6.5) — bổ sung additive để card hiện chủ đề; `null` nếu bài không có. */
  category: CategoryRef | null;
}

/** PostDetail — 03d §3.2 (trang chi tiết). */
export interface PostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  publishedAt: string | null;
  author: AuthorDetail;
  category: CategoryRef | null;
  cover: MediaRef | null;
}

/** SiteSettings — 03d §3.4 (cấu hình site, singleton). Luôn có giá trị (fallback khi CMS chưa cấu hình). */
export interface SiteSettings {
  siteName: string;
  /** Mô tả mặc định (meta description). */
  description: string;
  /** Chữ footer, đã thay `{year}`. */
  footerText: string;
  /** Ảnh chia sẻ mặc định; `null` → dùng ảnh tĩnh mặc định. */
  defaultOgImage: MediaRef | null;
}

/** Metadata phân trang — 03d §4. */
export interface PageInfo {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Kết quả liệt kê: danh sách + metadata phân trang. */
export interface PostListResult {
  items: PostSummary[];
  pageInfo: PageInfo;
}
