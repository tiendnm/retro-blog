import { describe, expect, it } from 'vitest';
import { buildSlugRedirects } from '../src/lib/directus';

describe('buildSlugRedirects', () => {
  it('slug cũ trỏ về slug hiện tại của bài', () => {
    expect(buildSlugRedirects([{ slug: 'z80-moi', previous_slugs: ['z80', ' Z80-Cu '] }])).toEqual([
      { from: 'z80', to: 'z80-moi' },
      { from: 'z80-cu', to: 'z80-moi' },
    ]);
  });

  it('bỏ giá trị không hợp lệ và trường rỗng/không phải mảng', () => {
    expect(
      buildSlugRedirects([
        { slug: 'a', previous_slugs: ['', 'có dấu', '../x', 'a b', 42, null, '-x', 'x-'] },
        { slug: 'b', previous_slugs: null },
        { slug: 'c' },
        { slug: 'd', previous_slugs: 'chuoi-khong-phai-mang' },
      ]),
    ).toEqual([]);
  });

  it('slug cũ trùng một bài đang sống thì bỏ (bài sống thắng)', () => {
    expect(
      buildSlugRedirects([{ slug: 'moi', previous_slugs: ['dang-song'] }, { slug: 'dang-song' }]),
    ).toEqual([]);
  });

  it('slug cũ trùng giữa các bài thì bài đầu tiên thắng', () => {
    expect(
      buildSlugRedirects([
        { slug: 'a', previous_slugs: ['cu'] },
        { slug: 'b', previous_slugs: ['cu', 'cu'] },
      ]),
    ).toEqual([{ from: 'cu', to: 'a' }]);
  });
});
