// Tiện ích dùng chung cho test tích hợp trên Directus THẬT (Sprint 11 §E).
// Cần: DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD (CI đặt sẵn; cục bộ xem docs/11-testing §5).
// CHẠY TUẦN TỰ (`node --test --test-concurrency=1 scripts/integration/`): các file dùng chung PREFIX và cleanup() xoá theo PREFIX.
// Bài thử có slug bắt đầu bằng PREFIX và luôn được dọn (cả bài sót lại từ lần chạy hỏng trước).
import { randomBytes } from 'node:crypto';

export const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
export const PREFIX = 'int-test-';
const RUN = randomBytes(3).toString('hex');

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Thiếu biến môi trường ${name} cho test tích hợp`);
  return v;
}

async function call(method, path, { token, body } = {}) {
  const send = () =>
    fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  // Kết nối keep-alive nghỉ lâu (giữa các lần build) có thể đã bị Directus đóng → ECONNRESET. Thử lại đúng một lần.
  const res = await send().catch(() => send());
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* thân không phải JSON */
  }
  return { status: res.status, json, text };
}

/** Request KHÔNG kèm token ⇒ vai Public. */
export const pub = (method, path, body) => call(method, path, { body });

let adminToken;
export async function admin(method, path, body) {
  if (!adminToken) {
    const r = await call('POST', '/auth/login', {
      body: { email: need('ADMIN_EMAIL'), password: need('ADMIN_PASSWORD') },
    });
    adminToken = r.json?.data?.access_token;
    if (!adminToken) throw new Error(`Đăng nhập admin thất bại (HTTP ${r.status})`);
  }
  return call(method, path, { token: adminToken, body });
}

let refs;
/** Tác giả + chuyên mục có sẵn từ seed để gắn vào bài thử. */
async function getRefs() {
  if (refs) return refs;
  const a = (await admin('GET', '/items/authors?fields=id&limit=1')).json?.data?.[0]?.id;
  const c = (await admin('GET', '/items/categories?fields=id&limit=1')).json?.data?.[0]?.id;
  if (!a || !c) throw new Error('Thiếu tác giả/chuyên mục — chạy seed trước');
  refs = { author: a, category: c };
  return refs;
}

let n = 0;
/** Tạo bài thử. publishedAt: ISO hoặc offset tính bằng ms so với bây giờ. */
export async function makePost({ status, publishedAt = -60_000, label = 'bai' }) {
  const { author, category } = await getRefs();
  const at = typeof publishedAt === 'number' ? new Date(Date.now() + publishedAt).toISOString() : publishedAt;
  const slug = `${PREFIX}${RUN}-${label}-${++n}`;
  const r = await admin('POST', '/items/posts', {
    title: `Bài thử tích hợp ${slug}`,
    slug,
    excerpt: 'Bài thử tích hợp — sẽ bị xoá.',
    body: '<p>Nội dung bài thử.</p>',
    status,
    published_at: at,
    author,
    category,
  });
  if (r.status !== 200) throw new Error(`Tạo bài thử thất bại: HTTP ${r.status} ${r.text}`);
  return { id: r.json.data.id, slug };
}

export const setStatus = (id, status, extra = {}) => admin('PATCH', `/items/posts/${id}`, { status, ...extra });

export async function cleanup() {
  const r = await admin('GET', `/items/posts?filter[slug][_starts_with]=${PREFIX}&fields=id&limit=-1`);
  for (const p of r.json?.data ?? []) await admin('DELETE', `/items/posts/${p.id}`);
}
