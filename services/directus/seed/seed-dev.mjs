// ============================================================================
// Retro Blog — SEED DỮ LIỆU DEV (Sprint 2 Phase 4). CHỈ dữ liệu mẫu phát triển,
// KHÔNG phải nội dung blog thật. Idempotent: xoá seed cũ (theo slug) rồi tạo lại.
//
// Chạy sau khi Directus healthy + schema + permissions đã áp:  pnpm seed:dev
// Dùng Node (đọc source UTF-8 chuẩn — tránh shell Windows làm hỏng tiếng Việt).
// body soạn bằng markdown rồi chuyển HTML khi ghi (CMS lưu HTML — ADR-0011).
// Nội dung: 1 author · 2 categories · 3 published posts · 1 draft.
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mdToHtml } from '../lib/md-to-html.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(HERE, '../../../.env');
const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';

// --- đọc ADMIN creds từ .env ---
let env = '';
try { env = readFileSync(ENV_PATH, 'utf8'); } catch { /* dùng process.env */ }
const pick = (k) =>
  process.env[k] ?? (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const ADMIN_EMAIL = pick('ADMIN_EMAIL');
const ADMIN_PASSWORD = pick('ADMIN_PASSWORD');
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Thiếu ADMIN_EMAIL/ADMIN_PASSWORD (.env).');
  process.exit(1);
}

const login = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
}).then((r) => r.json());
const TOKEN = login?.data?.access_token;
if (!TOKEN) {
  console.error('Đăng nhập admin thất bại.');
  process.exit(1);
}
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${text}`);
  return json;
}

async function delBySlug(collection, slug) {
  const res = await api('GET', `/items/${collection}?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id`);
  for (const it of res.data ?? []) await api('DELETE', `/items/${collection}/${it.id}`);
}

// ---- Định nghĩa seed (slug là danh tính để idempotent) ----
const AUTHOR = { name: 'Biên tập viên Demo', slug: 'bien-tap-vien-demo', bio: 'Tài khoản demo cho môi trường phát triển.' };
const CATEGORIES = [
  { name: 'Công nghệ', slug: 'cong-nghe', description: 'Bài viết công nghệ (demo).' },
  { name: 'Đời sống', slug: 'doi-song', description: 'Bài viết đời sống (demo).' },
];
const DAY = 86400000;
const POSTS = [
  {
    title: 'Bắt đầu với Retro Blog', slug: 'bat-dau-voi-retro-blog', cat: 'cong-nghe',
    excerpt: 'Giới thiệu nhanh về blog demo phong cách retro.',
    body: '## Chào mừng\n\nĐây là bài **demo** đầu tiên với [liên kết ví dụ](https://example.com).\n\n- Nội dung do Directus quản trị\n- Astro hiển thị tĩnh',
    daysAgo: 3,
  },
  {
    title: 'Thẩm mỹ hoài cổ trong thiết kế', slug: 'tham-my-hoai-co', cat: 'doi-song',
    excerpt: 'Vài ghi chú demo về phong cách hoài cổ.',
    body: '## Hoài cổ\n\nMàu giấy ngả vàng, phông chữ đánh máy — *chất retro* cơ bản.\n\n1. Đơn giản\n2. Ấm áp',
    daysAgo: 2,
  },
  {
    title: 'Vòng đời một bài viết', slug: 'vong-doi-mot-bai-viet', cat: 'cong-nghe',
    excerpt: 'Từ bản nháp tới xuất bản — mô tả demo.',
    body: '## Vòng đời\n\n`draft` → `published`. Chỉ bài đã publish & tới giờ mới hiển thị công khai.',
    daysAgo: 1,
  },
];
const DRAFT = {
  title: 'Ghi chú nội bộ chưa xuất bản', slug: 'ghi-chu-noi-bo', cat: 'cong-nghe',
  excerpt: 'Bản nháp — không được lộ ra công khai.',
  body: 'Nội dung nháp, chỉ nhìn thấy trong CMS.',
};

// ---- Idempotent cleanup (posts trước author/categories) ----
for (const p of [...POSTS, DRAFT]) await delBySlug('posts', p.slug);
await delBySlug('authors', AUTHOR.slug);
for (const c of CATEGORIES) await delBySlug('categories', c.slug);

// ---- Tạo ----
const author = await api('POST', '/items/authors', AUTHOR);
const catId = {};
for (const c of CATEGORIES) {
  const created = await api('POST', '/items/categories', c);
  catId[c.slug] = created.data.id;
}
const now = Date.now();
for (const p of POSTS) {
  await api('POST', '/items/posts', {
    title: p.title, slug: p.slug, excerpt: p.excerpt, body: mdToHtml(p.body),
    status: 'published',
    published_at: new Date(now - p.daysAgo * DAY).toISOString(),
    author: author.data.id,
    category: catId[p.cat],
  });
}
await api('POST', '/items/posts', {
  title: DRAFT.title, slug: DRAFT.slug, excerpt: DRAFT.excerpt, body: mdToHtml(DRAFT.body),
  status: 'draft',
  author: author.data.id,
  category: catId[DRAFT.cat],
});

// ---- Site settings (singleton, ADR-0012) — đặt lại giá trị dev mặc định ----
await api('PATCH', '/items/site_settings', {
  site_name: 'Retro Blog',
  description: 'Blog headless phong cách retro.',
  footer_text: '© {year} Retro Blog — blog headless phong cách retro.',
  default_og_image: null,
});

console.log('Seed dev hoàn tất:');
console.log(`  authors=1  categories=${CATEGORIES.length}  published=${POSTS.length}  draft=1`);
