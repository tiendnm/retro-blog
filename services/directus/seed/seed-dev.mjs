// ============================================================================
// Retro Blog — SEED DỮ LIỆU DEV (Sprint 2 Phase 4). CHỈ dữ liệu mẫu phát triển,
// KHÔNG phải nội dung blog thật. Idempotent: xoá seed cũ (theo slug) rồi tạo lại.
//
// Chạy sau khi Directus healthy + schema + permissions đã áp:  pnpm seed:dev
// Dùng Node (đọc source UTF-8 chuẩn — tránh shell Windows làm hỏng tiếng Việt).
// Nội dung: 1 author · 2 categories · 3 published posts · 1 draft.
// Chủ đề blog: MÁY TÍNH CỔ (phần cứng, phần mềm, kiến thức) — xem memory content-direction.
// body soạn bằng markdown rồi chuyển HTML khi ghi (CMS lưu HTML — ADR-0011).
// Muốn dữ liệu phong phú + ảnh: chạy thêm `pnpm seed:showcase`.
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
  { name: 'Phần cứng', slug: 'phan-cung', description: 'Máy tính, linh kiện và thiết bị cổ (demo).' },
  { name: 'Phần mềm', slug: 'phan-mem', description: 'Hệ điều hành, công cụ và phần mềm một thời (demo).' },
];
const DAY = 86400000;
const POSTS = [
  {
    title: 'Chào mừng đến với Retro Blog', slug: 'bat-dau-voi-retro-blog', cat: 'phan-mem',
    excerpt: 'Nơi ghi lại phần cứng, phần mềm và kiến thức của thời máy tính còn có tiếng quạt và đĩa mềm.',
    body: '## Chào mừng\n\nĐây là blog về **máy tính cổ**: những chiếc máy 8-bit, đĩa mềm, màn hình CRT và các chương trình chạy trong vài chục kilobyte.\n\nBạn sẽ tìm thấy ở đây:\n\n- **Phần cứng** — cách các cỗ máy cũ được làm ra\n- **Phần mềm** — hệ điều hành và công cụ một thời\n- **Kiến thức** — những nền tảng vẫn còn đúng đến hôm nay',
    daysAgo: 70,
  },
  {
    title: 'Vì sao chúng ta vẫn mê máy tính cổ?', slug: 'tham-my-hoai-co', cat: 'phan-cung',
    excerpt: 'Bàn phím lạch cạch, đèn báo nhấp nháy và những giới hạn kỳ lạ vẫn còn sức hút.',
    body: '## Sức hút của giới hạn\n\nMáy tính cổ **đơn giản đủ để hiểu hết**: ít chip, ít lớp trừu tượng, và bạn có thể chạm vào từng linh kiện.\n\n1. Giới hạn buộc người ta sáng tạo\n2. Mọi thứ đều có thể sửa được\n3. Mỗi cỗ máy có một "tính cách" riêng',
    daysAgo: 66,
  },
  {
    title: 'Vòng đời một bài viết: từ bản nháp đến xuất bản', slug: 'vong-doi-mot-bai-viet', cat: 'phan-mem',
    excerpt: 'Bài viết đi từ nháp tới xuất bản như thế nào trong hệ thống CMS của blog.',
    body: '## Vòng đời\n\n`draft` → `published`. Chỉ bài đã publish & tới giờ mới hiển thị công khai.\n\n```\n10 PRINT "XUAT BAN"\n20 GOTO 10\n```',
    daysAgo: 62,
  },
];
const DRAFT = {
  title: 'Ghi chú nội bộ chưa xuất bản', slug: 'ghi-chu-noi-bo', cat: 'phan-cung',
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
  description: 'Blog về máy tính cổ: phần cứng, phần mềm, lập trình và những kiến thức nền tảng — viết cho người thích hiểu máy tính từ gốc.',
  footer_text: '© {year} Retro Blog — nhật ký của những chiếc máy tính cổ.',
  default_og_image: null,
});

console.log('Seed dev hoàn tất:');
console.log(`  authors=1  categories=${CATEGORIES.length}  published=${POSTS.length}  draft=1`);
