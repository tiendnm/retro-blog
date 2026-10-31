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

// Tối ưu ảnh asset Directus trong body: thay URL gốc (TinyMCE hay lưu `?width=4000&height=3000`)
// bằng srcset webp nhiều cỡ, để không tải ảnh gốc cho khung ~680px. Chạy SAU sanitizeBody + rewriteAssetUrls.
const BODY_IMG_WIDTHS = [640, 960, 1200, 1600];
const BODY_IMG_SIZES = '(min-width: 880px) 800px, calc(100vw - 2.5rem)';
const IMG_ASSET =
  /<img\b([^>]*?)\bsrc=(["'])([^"']*?\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.\w+)?(?:\?([^"']*))?\2([^>]*)>/gi;

function intrinsicSize(query: string | undefined): { w: number; h: number } | null {
  if (!query) return null;
  const params = new URLSearchParams(query.replace(/&amp;/g, '&'));
  const w = Number(params.get('width'));
  const h = Number(params.get('height'));
  return Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 ? { w, h } : null;
}

export function optimizeBodyImages(html: string): string {
  return html.replace(
    IMG_ASSET,
    (_m, before: string, q: string, base: string, query: string | undefined, after: string) => {
      const variant = (w: number) => `${base}?width=${w}&amp;quality=80&amp;format=webp`;
      const srcset = BODY_IMG_WIDTHS.map((w) => `${variant(w)} ${w}w`).join(', ');
      const src = variant(BODY_IMG_WIDTHS[1]);
      // Kích thước gốc nằm trong query TinyMCE (?width=&height=) → đặt width/height để trình duyệt giữ chỗ, hết giật layout.
      const dims = intrinsicSize(query);
      const strip = dims
        ? /\s(srcset|sizes|decoding|width|height)=(["'])[^"']*\2/gi
        : /\s(srcset|sizes|decoding)=(["'])[^"']*\2/gi;
      const rest = `${before}${after}`.replace(/\s*\/\s*$/, '').replace(strip, '');
      const size = dims ? ` width=${q}${dims.w}${q} height=${q}${dims.h}${q}` : '';
      return `<img${rest} src=${q}${src}${q} srcset=${q}${srcset}${q} sizes=${q}${BODY_IMG_SIZES}${q} decoding=${q}async${q}${size}>`;
    },
  );
}
