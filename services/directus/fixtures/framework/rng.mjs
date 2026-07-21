// PRNG deterministic (mulberry32) — KHÔNG dùng Math.random/Date.now (tái lập).
// Cùng seed ⇒ cùng chuỗi số. Layer độc lập Directus.

/** @param {number} seed @returns {() => number} hàm trả [0,1) */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Số nguyên trong [min, max] (bao gồm). */
export function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Chọn 1 phần tử. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Chọn n phần tử khác nhau (deterministic), giữ thứ tự gốc. */
export function pickSome(rng, arr, n) {
  const idx = arr.map((_, i) => i);
  // Fisher–Yates với rng
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(n, arr.length)).sort((x, y) => x - y).map((i) => arr[i]);
}

/** Xác suất p → true. */
export function chance(rng, p) {
  return rng() < p;
}
