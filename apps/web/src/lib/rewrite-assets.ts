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
const BODY_IMG_SIZES = '(min-width: 1080px) 1040px, calc(100vw - 2.5rem)';
const IMG_ASSET =
  /<img\b([^>]*?)\bsrc=(["'])([^"']*?\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\.\w+)?(?:\?([^"']*))?\2([^>]*)>/gi;

function intrinsicSize(query: string | undefined): { w: number; h: number } | null {
  if (!query) return null;
  const params = new URLSearchParams(query.replace(/&amp;/g, '&'));
  const w = Number(params.get('width'));
  const h = Number(params.get('height'));
  return Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 ? { w, h } : null;
}

export interface AssetSize {
  w: number;
  h: number;
}

const ASSET_ID = /\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const hasAuthorSize = (attrs: string) =>
  /\swidth=(["'])\d+/i.test(attrs) && /\sheight=(["'])\d+/i.test(attrs);

/**
 * Id các ảnh asset trong body mà thẻ `<img>` chưa có kích thước nào (không width/height do tác giả kéo, không `?width=&height=` trong URL
 * — gặp khi chèn bằng preset `?key=editor`). Caller tra kích thước thật của file trên Directus rồi truyền vào `optimizeBodyImages`.
 */
export function assetIdsNeedingSize(html: string): string[] {
  const ids = new Set<string>();
  for (const m of html.matchAll(IMG_ASSET)) {
    const [, before, , base, query, after] = m;
    if (hasAuthorSize(`${before}${after}`) || intrinsicSize(query)) continue;
    const id = ASSET_ID.exec(base)?.[1];
    if (id) ids.add(id.toLowerCase());
  }
  return [...ids];
}

export function optimizeBodyImages(html: string, sizes?: ReadonlyMap<string, AssetSize>): string {
  return html.replace(
    IMG_ASSET,
    (_m, before: string, q: string, base: string, query: string | undefined, after: string) => {
      const variant = (w: number) => `${base}?width=${w}&amp;quality=80&amp;format=webp`;
      const srcset = BODY_IMG_WIDTHS.map((w) => `${variant(w)} ${w}w`).join(', ');
      const src = variant(BODY_IMG_WIDTHS[1]);
      // Kích thước gốc nằm trong query TinyMCE (?width=&height=) → đặt width/height để trình duyệt giữ chỗ, hết giật layout.
      // Tác giả đã kéo đổi cỡ ảnh trong trình soạn thảo (TinyMCE ghi width+height) → giữ nguyên, không đè bằng cỡ gốc.
      const dims = hasAuthorSize(`${before}${after}`)
        ? null
        : (intrinsicSize(query) ??
          sizes?.get(ASSET_ID.exec(base)?.[1]?.toLowerCase() ?? '') ??
          null);
      const strip = dims
        ? /\s(srcset|sizes|decoding|width|height)=(["'])[^"']*\2/gi
        : /\s(srcset|sizes|decoding)=(["'])[^"']*\2/gi;
      const rest = `${before}${after}`.replace(/\s*\/\s*$/, '').replace(strip, '');
      const size = dims ? ` width=${q}${dims.w}${q} height=${q}${dims.h}${q}` : '';
      return `<img${rest} src=${q}${src}${q} srcset=${q}${srcset}${q} sizes=${q}${BODY_IMG_SIZES}${q} decoding=${q}async${q}${size}>`;
    },
  );
}
