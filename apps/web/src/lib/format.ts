// Tiện ích trình bày (presentation) — không phụ thuộc Directus.

/** Định dạng ngày ISO sang chuỗi tiếng Việt; rỗng nếu null. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Văn bản nhiều dòng (bio, mô tả) → các đoạn, tách ở dòng trống; bỏ đoạn rỗng. `null` → []. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}
