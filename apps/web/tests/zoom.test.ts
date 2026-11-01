import { describe, expect, it } from 'vitest';
import { MAX_SCALE, RESET, clampPan, clampScale, zoomAt } from '../src/lib/zoom';

describe('clampScale', () => {
  it('giữ trong [1, MAX]', () => {
    expect(clampScale(0.3)).toBe(1);
    expect(clampScale(2.5)).toBe(2.5);
    expect(clampScale(99)).toBe(MAX_SCALE);
  });
});

describe('zoomAt', () => {
  it('phóng quanh tâm: không dịch', () => {
    expect(zoomAt(RESET, 2, 0, 0)).toEqual({ s: 2, x: 0, y: 0 });
  });
  it('phóng quanh điểm lệch tâm: điểm đó đứng yên trên màn hình', () => {
    const r = zoomAt(RESET, 2, 100, 40);
    // điểm ảnh dưới con trỏ sau phóng: p = x + (p0 - ... ) → x = px - (px - 0) * 2
    expect(r).toEqual({ s: 2, x: -100, y: -40 });
    // kiểm tra bất biến: (px - x) / s == (px - x0) / s0
    expect((100 - r.x) / r.s).toBe(100);
  });
  it('bị chặn ở MAX: hệ số thực = MAX / s hiện tại', () => {
    const r = zoomAt({ s: 4, x: 0, y: 0 }, 10, 50, 0);
    expect(r.s).toBe(MAX_SCALE);
    expect(r.x).toBeCloseTo(50 - 50 * (MAX_SCALE / 4));
  });
  it('thu nhỏ về 1 không vượt dưới 1', () => {
    expect(zoomAt({ s: 1.2, x: 10, y: 10 }, 0.1, 0, 0).s).toBe(1);
  });
});

describe('clampPan', () => {
  it('s=1 → về gốc dù x,y bất kỳ', () => {
    expect(clampPan({ s: 1, x: 50, y: -20 }, 800, 600, 1000, 700)).toEqual(RESET);
  });
  it('ảnh sau phóng vẫn nhỏ hơn khung → căn giữa (x,y = 0)', () => {
    expect(clampPan({ s: 1.2, x: 40, y: 40 }, 800, 600, 1000, 800)).toEqual({ s: 1.2, x: 0, y: 0 });
  });
  it('ảnh lớn hơn khung → dịch tối đa bằng nửa phần tràn', () => {
    // 800*3=2400 vs 1000 → tràn 1400 → tối đa ±700 ; 600*3=1800 vs 700 → ±550
    expect(clampPan({ s: 3, x: 5000, y: -5000 }, 800, 600, 1000, 700)).toEqual({
      s: 3,
      x: 700,
      y: -550,
    });
    expect(clampPan({ s: 3, x: 100, y: -100 }, 800, 600, 1000, 700)).toEqual({
      s: 3,
      x: 100,
      y: -100,
    });
  });
});
