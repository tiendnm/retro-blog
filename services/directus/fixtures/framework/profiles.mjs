// Profiles — preset chọn set + số lượng. Cho CI & local. Layer độc lập Directus.
// 'all' = toàn bộ ca của set đó (edge/stress do provider/định nghĩa quyết định).

export const PROFILES = {
  small: { normal: 10 }, // Batch 1 — kiểm chứng framework, CI smoke
  medium: { normal: 50 },
  large: { normal: 100 },
  stress: { normal: 100, edge: 'all', stress: 'all' },
};

/** Số bài 'normal' cho một profile (0 nếu profile không có normal). */
export function normalCount(profile) {
  const p = PROFILES[profile];
  return p && typeof p.normal === 'number' ? p.normal : 0;
}
