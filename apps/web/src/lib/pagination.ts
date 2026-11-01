// Cửa sổ số trang của Pagination.astro (tách ra để test được; hành vi giữ nguyên).
// Luôn hiện trang 1 & trang cuối + lân cận trang hiện tại; chèn 'gap' khi có khoảng đứt để render "…".
export type PageCell = number | 'gap';

export function pageCells(currentPage: number, totalPages: number): PageCell[] {
  const window = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const cells: PageCell[] = [];
  let prev = 0;
  for (const n of window) {
    if (prev && n - prev > 1) cells.push('gap');
    cells.push(n);
    prev = n;
  }
  return cells;
}
