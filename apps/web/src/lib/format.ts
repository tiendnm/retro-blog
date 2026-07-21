// Tiện ích trình bày (presentation) — không phụ thuộc Directus.

/** Định dạng ngày ISO sang chuỗi tiếng Việt; rỗng nếu null. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}
