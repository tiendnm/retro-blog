// Viết lại URL asset Directus trong HTML body theo PUBLIC_DIRECTUS_URL hiện hành (ADR-0011).
// Body (WYSIWYG) có thể lưu URL tuyệt đối theo domain CMS lúc soạn (hoặc dạng tương đối) →
// chuẩn hoá lúc build để đổi domain CMS không làm hỏng ảnh/tệp đã chèn. Không phụ thuộc Directus.

const ASSET_ATTR =
  /\b(src|href|poster)=(["'])(?:https?:\/\/[^"'\s]*?|)\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})([^"']*)\2/gi;

export function rewriteAssetUrls(html: string, publicUrl: string): string {
  const base = publicUrl.replace(/\/+$/, '');
  return html.replace(
    ASSET_ATTR,
    (_m, attr: string, q: string, id: string, rest: string) =>
      `${attr}=${q}${base}/assets/${id}${rest}${q}`,
  );
}
