// Nút chọn theme ở Header. Tuân CSP (script-src 'self'): không inline, không thư viện ngoài.
// Theme được lưu ở localStorage ('retro-theme'); public/theme-init.js áp lại trước khi vẽ để không chớp màu.
// DEFAULT_THEME là bộ màu ở :root của global.css → gỡ thuộc tính data-theme thay vì đặt giá trị.

/** Thứ tự ở đây = thứ tự trong ô chọn. */
export const THEMES = [
  { id: 'platinum', label: 'Platinum' },
  { id: 'mono', label: 'CRT trắng' },
  { id: 'green', label: 'CRT xanh lá' },
  { id: 'dos', label: 'DOS' },
  { id: 'amber', label: 'CRT hổ phách' },
  { id: 'blueprint', label: 'Bản vẽ' },
  { id: 'amiga', label: 'Amiga' },
  { id: 'paper', label: 'Giấy' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'platinum';
const KEY = 'retro-theme';

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

export function applyTheme(id: ThemeId, root: HTMLElement = document.documentElement): void {
  if (id === DEFAULT_THEME) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', id);
}

function readStored(): ThemeId {
  try {
    const v = localStorage.getItem(KEY);
    return isThemeId(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function store(id: ThemeId): void {
  try {
    if (id === DEFAULT_THEME) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, id);
  } catch {
    /* không lưu được (chế độ riêng tư…) — theme vẫn đổi cho phiên này */
  }
}

function init(): void {
  const picker = document.querySelector<HTMLElement>('.theme-picker');
  const select = picker?.querySelector<HTMLSelectElement>('select');
  if (!picker || !select) return;
  for (const t of THEMES) select.add(new Option(t.label, t.id));
  const current = readStored();
  select.value = current;
  applyTheme(current);
  select.addEventListener('change', () => {
    if (!isThemeId(select.value)) return;
    applyTheme(select.value);
    store(select.value);
  });
  picker.hidden = false; // chỉ hiện khi đã có JS
}

if (typeof document !== 'undefined') init();
