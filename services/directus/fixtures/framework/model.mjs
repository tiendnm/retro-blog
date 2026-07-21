// Fixture Content Model — kiểu dữ liệu TRUNG LẬP (phản chiếu docs/03c, KHÔNG field mới).
// Layer ĐỘC LẬP Directus: không import/không biết khái niệm Directus.

/**
 * @typedef {Object} FixtureAuthor
 * @property {string} key @property {string} name @property {string} slug @property {string} bio
 *
 * @typedef {Object} FixtureCategory
 * @property {string} key @property {string} name @property {string} slug
 * @property {string} [description] @property {string|null} [parentKey]
 *
 * @typedef {Object} FixtureCover
 * @property {string} key @property {'manual'|'ai'} source @property {string} pathOrPrompt @property {string} alt
 *
 * @typedef {Object} FixturePost
 * @property {string} key @property {string} slug @property {string} title @property {string} [excerpt]
 * @property {string} bodyPath  // đường dẫn tương đối tới file .md (tách prose khỏi manifest)
 * @property {string} authorKey @property {string|null} categoryKey @property {string|null} coverKey
 * @property {'draft'|'published'} status @property {string|null} publishedAt
 * @property {'normal'|'edge'|'stress'} set @property {string} [edgeType]
 *
 * @typedef {Object} Manifest
 * @property {number} version @property {string} set @property {number} seed @property {string} contentProvider @property {string} coverProvider
 * @property {FixtureAuthor[]} authors @property {FixtureCategory[]} categories
 * @property {FixtureCover[]} covers @property {FixturePost[]} posts
 */

/** slugify tiếng Việt → ascii, thường, gạch nối. Deterministic. */
export function slugify(input) {
  return String(input)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tổ hợp
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Số 2 chữ số cho slug ổn định: 1 → "01". */
export function pad2(n) {
  return String(n).padStart(2, '0');
}
