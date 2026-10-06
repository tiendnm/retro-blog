// ── Đồng bộ giao diện Directus Admin với màu/font của web (Appearance) ──────
// Reproducible + idempotent: PATCH /settings (singleton directus_settings).
// Nguồn màu/font: apps/web/src/styles/global.css (:root tokens) — đổi tokens thì cập nhật ở đây.
//   - project_name             → tên hiển thị (tab, màn login)
//   - project_color            → màu nhấn chính (nút, link, mục đang chọn)
//   - default_appearance=light → mặc định theme sáng (nền giấy)
//   - theme_light_overrides    → ghi đè theme sáng (màu + font), cách Directus 11 hỗ trợ chính thức
//   - custom_css               → phần nhỏ theme overrides không phủ tới (viền, bo góc phẳng kiểu giấy)
// Chạy TRÊN HOST:  node services/directus/apply-theme.mjs   (hoặc: pnpm theme:apply)
// Env: DIRECTUS_URL (mặc định http://localhost:8055), ADMIN_EMAIL, ADMIN_PASSWORD.
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ cần ADMIN_EMAIL/ADMIN_PASSWORD');
  process.exit(1);
}

// Tokens — khớp apps/web/src/styles/global.css
const C = {
  bg: '#f4f1e8',
  surface: '#efe8d6',
  card: '#faf7ee',
  text: '#2b2b2b',
  muted: '#595959',
  accent: '#7b2d26',
  accentStrong: '#5c211c',
  border: '#d9d2c0',
};
const PROJECT_NAME = "tiendnm's retro blog";
const FONT_MONO = '"IBM Plex Mono", "Courier New", Courier, monospace';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';

const themeLightOverrides = {
  background: C.bg,
  backgroundNormal: C.surface,
  backgroundAccent: C.border,
  foreground: C.text,
  foregroundSubdued: C.muted,
  foregroundAccent: C.text,
  borderColor: C.border,
  borderColorAccent: C.muted,
  primary: C.accent,
  primaryBackground: C.surface,
  primarySubdued: C.card,
  primaryAccent: C.accentStrong,
  fonts: {
    display: { fontFamily: FONT_MONO },
    sans: { fontFamily: FONT_MONO },
    serif: { fontFamily: FONT_SERIF },
    monospace: { fontFamily: FONT_MONO },
  },
  navigation: {
    background: C.surface,
    backgroundAccent: C.border,
    modules: { background: C.accentStrong },
  },
  header: { background: C.bg, borderColor: C.border },
  sidebar: { background: C.surface, borderColor: C.border },
  form: { field: { input: { background: C.card, borderColor: C.border } } },
  popover: { menu: { background: C.card } },
};

// Font nạp từ Google Fonts (Directus không có chỗ cấu hình font riêng; cần internet
// khi mở admin — thiếu mạng thì rơi về Courier New). Web thì self-host qua @fontsource.
// Bo góc phẳng kiểu giấy/in — web dùng khối vuông + viền mảnh.
// Ẩn mục "Documentation" (link ngoài tới docs.directus.io) ở menu trái — module `docs`
// là link ngoài nên chọn theo href. Có thể hỏng khi nâng cấp Directus: kiểm tra lại.
const customCss = `/* retro-blog theme — sinh bởi services/directus/apply-theme.mjs */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
:root {
  --theme--border-radius: 2px;
}
.module-bar a[href^="https://docs.directus.io"],
#module-bar a[href^="https://docs.directus.io"] {
  display: none !important;
}
`;

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

await api(
  '/settings',
  {
    method: 'PATCH',
    body: JSON.stringify({
      project_name: PROJECT_NAME,
      project_color: C.accent,
      default_appearance: 'light',
      theme_light_overrides: themeLightOverrides,
      custom_css: customCss,
    }),
  },
  login.access_token,
);

console.log('✅ đã áp dụng theme Directus (màu + font khớp web). Tải lại trang admin (Ctrl+F5).');
