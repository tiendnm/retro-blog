// Chuyển markdown → HTML cho script dữ liệu (seed/fixtures/migration). ADR-0011.
// Dùng `marked` đã cài ở apps/web (cùng bản đang dùng trước đây → HTML tương đương).
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
const { marked } = require('marked');

export function mdToHtml(md) {
  return marked.parse(md ?? '', { async: false });
}

/** Heuristic: body đã là HTML (bắt đầu bằng thẻ khối) → không chuyển lại (idempotent). */
export function looksLikeHtml(s) {
  return /^\s*<(p|h[1-6]|ul|ol|div|blockquote|table|pre|figure|img|hr)[\s>/]/i.test(s ?? '');
}
