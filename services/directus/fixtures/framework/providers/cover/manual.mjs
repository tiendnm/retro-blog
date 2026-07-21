// CoverProvider 'manual' — dùng ảnh do người cung cấp, map theo post.key.
// map: { [postKey]: { path, alt } }. Không có map → không cover.
export const name = 'manual';

/** @param {{key:string,categoryKey:string|null}} skeleton @param {object} [map] */
export function resolveCover(skeleton, map = {}) {
  const m = map[skeleton.key];
  if (!m || !m.path) return null;
  return { source: 'manual', pathOrPrompt: m.path, alt: m.alt ?? '' };
}
