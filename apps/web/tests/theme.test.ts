import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES, applyTheme, isThemeId } from '../src/scripts/theme';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const init = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
// Theme mặc định là bộ màu ở :root (không có data-theme) → mọi theme còn lại cần khối riêng.
const others = THEMES.filter((t) => t.id !== DEFAULT_THEME);

describe('theme', () => {
  it('Platinum là theme mặc định và đứng đầu danh sách; thứ tự ưu tiên theo yêu cầu', () => {
    expect(DEFAULT_THEME).toBe('platinum');
    expect(THEMES.slice(0, 4).map((t) => t.id)).toEqual(['platinum', 'mono', 'green', 'dos']);
  });

  it('isThemeId chỉ nhận id đã khai báo', () => {
    expect(isThemeId('amber')).toBe(true);
    expect(isThemeId('paper')).toBe(true);
    expect(isThemeId('gameboy')).toBe(false);
    expect(isThemeId('"><script>')).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it('applyTheme: theme mặc định gỡ thuộc tính, theme khác đặt data-theme', () => {
    const attrs = new Map<string, string>();
    const root = {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
    } as unknown as HTMLElement;
    applyTheme('green', root);
    expect(attrs.get('data-theme')).toBe('green');
    applyTheme('paper', root);
    expect(attrs.get('data-theme')).toBe('paper');
    applyTheme(DEFAULT_THEME, root);
    expect(attrs.has('data-theme')).toBe(false);
  });

  it.each(others.map((t) => t.id))('%s: có khối CSS và có trong theme-init.js', (id) => {
    expect(css).toContain(`:root[data-theme="${id}"] {`);
    expect(init).toContain(`'${id}'`);
  });

  // Giấy giữ grain nền riêng và không bị phủ màu ảnh; các theme còn lại dùng vệt quét hoặc không nền hoa văn + phủ ảnh.
  it.each(others.filter((t) => t.id !== 'paper').map((t) => t.id))('%s: có màu phủ ảnh', (id) => {
    expect(css).toContain(`:root[data-theme="${id}"] {\n  --img-tint:`);
  });

  it('chỉ theme tối có selector vệt quét; Platinum mặc định có --img-tint ở :root', () => {
    expect(css).toContain('--img-tint: #b4bfd8;');
    for (const id of ['amber', 'green', 'blueprint', 'amiga', 'dos', 'mono']) {
      expect(css).toContain(`:root[data-theme="${id}"] body::before`);
    }
  });

  it('theme-init.js không chứa id lạ ngoài danh sách (trừ theme mặc định)', () => {
    const list = init.match(/var ok = \[([^\]]*)\]/)?.[1] ?? '';
    const ids = [...list.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(ids.sort()).toEqual(others.map((t) => t.id).sort());
  });
});
