// CoverProvider 'ai' — STUB (adapter cắm sau). Sinh ảnh AI theo phong cách thống nhất.
// Chưa hiện thực: chọn --cover ai sẽ báo lỗi rõ ràng thay vì âm thầm không cover.
export const name = 'ai';

export function resolveCover() {
  throw new Error('CoverProvider "ai" chưa hiện thực (stub). Dùng --cover none hoặc manual.');
}
