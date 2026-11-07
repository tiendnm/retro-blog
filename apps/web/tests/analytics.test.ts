import { describe, expect, it } from 'vitest';
import { cfBeaconAttr } from '../src/lib/analytics';

describe('cfBeaconAttr', () => {
  it('token hợp lệ → JSON cho data-cf-beacon', () => {
    const t = '0123456789abcdef0123456789abcdef';
    expect(JSON.parse(cfBeaconAttr(t) ?? '')).toEqual({ token: t });
  });

  it('thiếu / rỗng → null (không chèn beacon)', () => {
    expect(cfBeaconAttr(undefined)).toBeNull();
    expect(cfBeaconAttr(null)).toBeNull();
    expect(cfBeaconAttr('')).toBeNull();
    expect(cfBeaconAttr('   ')).toBeNull();
  });

  it('giá trị có ký tự lạ hoặc quá ngắn → null', () => {
    expect(cfBeaconAttr('abc')).toBeNull();
    expect(cfBeaconAttr('"><script>alert(1)</script>xxxxxxxx')).toBeNull();
  });
});
