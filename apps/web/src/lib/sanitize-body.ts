// Sanitize HTML body do CMS (WYSIWYG) trước khi render bằng set:html — chống XSS (ADR-0013).
// Allowlist bám toolbar TinyMCE ở schema (h2–h4, định dạng, list, blockquote, link, image, table,
// hr, code). Chạy lúc build (SSG), thuần JS, không phụ thuộc Directus.
import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2',
    'h3',
    'h4',
    'p',
    'br',
    'hr',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'sub',
    'sup',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    pre: ['class'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    col: ['span'],
    colgroup: ['span'],
    '*': ['id'],
  },
  // Chỉ cho class dạng language-xxx (highlight code); chặn mọi class khác.
  allowedClasses: { code: [/^language-[\w-]+$/], pre: [/^language-[\w-]+$/] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // Thẻ nguy hiểm: bỏ cả nội dung (mặc định của lib chỉ bỏ script/style/textarea/option).
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed'],
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') attribs.rel = 'noopener noreferrer';
      else delete attribs.rel;
      return { tagName, attribs };
    },
  },
};

export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
