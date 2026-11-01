// Lưu trữ theo tháng — hàm thuần (không gọi Directus). Tháng tính theo GIỜ VIỆT NAM (UTC+7, múi giờ của blog):
// bài đăng 23:30 ngày 31/10 giờ VN (= 16:30 UTC cùng ngày) vẫn thuộc tháng 10; bài 01:00 ngày 1/11 giờ VN
// (= 18:00 UTC ngày 31/10) phải thuộc tháng 11 dù UTC còn là tháng 10.
export interface ArchiveMonth {
  year: number;
  month: number; // 1–12
  count: number;
}

const OFFSET_MS = 7 * 60 * 60 * 1000;

/** Năm/tháng theo giờ VN; `null` nếu chuỗi ngày không hợp lệ. */
export function monthOf(iso: string): { year: number; month: number } | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const d = new Date(t + OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Gom danh sách ngày đăng thành các tháng có bài, mới nhất trước. */
export function groupByMonth(isos: (string | null)[]): ArchiveMonth[] {
  const counts = new Map<string, ArchiveMonth>();
  for (const iso of isos) {
    const m = iso ? monthOf(iso) : null;
    if (!m) continue;
    const key = `${m.year}-${m.month}`;
    const cur = counts.get(key);
    if (cur) cur.count += 1;
    else counts.set(key, { ...m, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}

/** Khoảng [from, to) của tháng theo giờ VN, dạng ISO UTC — dùng cho filter published_at. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  const from = Date.UTC(year, month - 1, 1) - OFFSET_MS;
  const to = Date.UTC(year, month, 1) - OFFSET_MS;
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

export const monthLabel = (year: number, month: number): string => `Tháng ${month}/${year}`;

export const monthPath = (year: number, month: number): string =>
  `/archive/${year}/${String(month).padStart(2, '0')}`;
