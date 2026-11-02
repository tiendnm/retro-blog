// ── Preset biến đổi ảnh cho trình soạn thảo (Settings → Storage Asset Presets) ──────
// Vì sao: ảnh gốc ~4000×3000 làm TinyMCE giật khi kéo/cuộn. Hộp thoại "Add/Edit Image" của Directus có ô
// "Transformation Preset Key"; chọn `editor` thì ảnh trong bài là `/assets/<id>.jpg?key=editor` — editor chỉ tải
// bản ≤1200px WebP. Site KHÔNG bị ảnh hưởng: optimizeBodyImages bỏ query và tự sinh srcset từ file gốc.
// Idempotent: chỉ thêm/ghi đè đúng preset `editor`, giữ nguyên preset khác (nếu có).
// Chạy: node services/directus/apply-asset-presets.mjs  (hoặc: pnpm presets:apply). Env: DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD.
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ cần ADMIN_EMAIL/ADMIN_PASSWORD');
  process.exit(1);
}

const EDITOR_PRESET = {
  key: 'editor',
  fit: 'inside',
  width: 1200,
  height: 1200,
  quality: 80,
  withoutEnlargement: true,
  format: 'webp',
};

async function api(path, opts = {}, token) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const { data: login } = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const token = login.access_token;

const { data: settings } = await api('/settings?fields=storage_asset_presets', {}, token);
const others = (settings.storage_asset_presets ?? []).filter((p) => p.key !== EDITOR_PRESET.key);

await api(
  '/settings',
  { method: 'PATCH', body: JSON.stringify({ storage_asset_presets: [...others, EDITOR_PRESET] }) },
  token,
);

console.log(`✅ preset ảnh "${EDITOR_PRESET.key}" (≤${EDITOR_PRESET.width}px, WebP) đã sẵn trong Directus.`);
