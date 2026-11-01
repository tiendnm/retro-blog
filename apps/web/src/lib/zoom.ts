// Toán zoom/pan cho lightbox (thuần, không DOM → test được). Toạ độ con trỏ tính từ TÂM khung xem.

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

export interface ZoomState {
  s: number; // tỉ lệ phóng
  x: number; // dịch ngang (px)
  y: number; // dịch dọc (px)
}

export const RESET: ZoomState = { s: 1, x: 0, y: 0 };

export function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

/** Giới hạn dịch chuyển: ảnh không trượt khỏi khung; ảnh nhỏ hơn khung thì căn giữa. */
export function clampPan(
  st: ZoomState,
  imgW: number,
  imgH: number,
  stageW: number,
  stageH: number,
): ZoomState {
  if (st.s <= MIN_SCALE) return RESET;
  const maxX = Math.max(0, (imgW * st.s - stageW) / 2);
  const maxY = Math.max(0, (imgH * st.s - stageH) / 2);
  return {
    s: st.s,
    x: Math.min(maxX, Math.max(-maxX, st.x)),
    y: Math.min(maxY, Math.max(-maxY, st.y)),
  };
}

/** Phóng theo `factor` quanh điểm (px, py) — điểm đó đứng yên trên màn hình. */
export function zoomAt(st: ZoomState, factor: number, px: number, py: number): ZoomState {
  const s = clampScale(st.s * factor);
  const k = s / st.s;
  return { s, x: px - (px - st.x) * k, y: py - (py - st.y) * k };
}
