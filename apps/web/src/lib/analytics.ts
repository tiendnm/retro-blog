// Cloudflare Web Analytics (không cookie). Chỉ bật khi có token hợp lệ trong PUBLIC_CF_BEACON_TOKEN:
// dev/CI/preview không đặt biến này ⇒ không gửi số liệu. Token không phải bí mật (nằm công khai trong HTML).
// Kiểm định dạng để giá trị lạ không thể phá thuộc tính HTML.

export const CF_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Giá trị cho `data-cf-beacon`, hoặc `null` nếu không có token hợp lệ. */
export function cfBeaconAttr(token: string | undefined | null): string | null {
  const t = token?.trim();
  if (!t || !/^[A-Za-z0-9]{16,64}$/.test(t)) return null;
  return JSON.stringify({ token: t });
}
