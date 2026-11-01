// ── Directus Flow: tự sinh slug từ tiêu đề/tên (posts, authors, categories, tags) ────────────
// Vấn đề: slug bắt buộc phải gõ tay. Giải pháp: Flow kiểu `filter` (chạy TRƯỚC khi ghi, sửa được payload — hoạt động
// ở Directus 11.17; ở 11.3.5 filter không sửa được payload nên trước đây phải dùng action + self-update).
//
// Mỗi collection có 2 Flow (idempotent: xoá flow cũ cùng tên rồi tạo lại):
//   • "Auto slug — <c>" (items.create):  gen (Run Script) → taken (Read Data) → final (Run Script)
//       - slug để trống  → bỏ dấu tiếng Việt (đ→d) từ title/name, nối bằng "-", nếu trùng thì thêm -2, -3…
//       - slug có gõ tay → chỉ chuẩn hoá (chữ thường, không dấu); KHÔNG tự thêm hậu tố (trùng thì Directus báo unique)
//   • "Guard slug — <c>" (items.update): slug KHÔNG đổi khi sửa tiêu đề (URL ổn định, BR-2); nếu cố xoá trắng slug → từ chối.
// Cột `slug` ở DB là NOT NULL + UNIQUE; field cần `required: false` ở schema để giao diện admin cho phép để trống.
//
// Chạy TRÊN HOST hoặc trong container `ops`:  node services/directus/apply-slug-flow.mjs
// Env: DIRECTUS_URL (mặc định http://localhost:8055), ADMIN_EMAIL, ADMIN_PASSWORD.
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

// collection → { field nguồn, slug dự phòng khi nguồn không có chữ/số nào }
const TARGETS = {
  posts: { source: 'title', fallback: 'bai-viet' },
  authors: { source: 'name', fallback: 'tac-gia' },
  categories: { source: 'name', fallback: 'chuyen-muc' },
  tags: { source: 'name', fallback: 'the' },
};

if (!EMAIL || !PASSWORD) {
  console.error('❌ cần ADMIN_EMAIL/ADMIN_PASSWORD');
  process.exit(1);
}

async function api(path, opts = {}, token) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
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

// Hàm slugify dùng chung trong sandbox (isolated-vm: chỉ có built-in của V8, không require).
const SLUGIFY = `
function slugify(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  return s;
}`;

const genCode = (source, fallback) => `${SLUGIFY}
module.exports = async function (data) {
  var p = data.$trigger.payload;
  if (!p || Array.isArray(p) || typeof p !== 'object') return { skip: true, base: 'skip' };
  var typed = typeof p.slug === 'string' ? slugify(p.slug) : '';
  if (typed) return { typed: typed, base: typed };
  return { base: slugify(p.${source}) || '${fallback}' };
};`;

const finalCode = `module.exports = async function (data) {
  var p = data.$trigger.payload;
  var g = data.gen || {};
  if (g.skip) return p;
  var slug = g.typed;
  if (!slug) {
    var used = {};
    (data.taken || []).forEach(function (r) { if (r && r.slug) used[r.slug] = true; });
    slug = g.base;
    for (var n = 2; used[slug]; n++) slug = g.base + '-' + n;
  }
  return Object.assign({}, p, { slug: slug });
};`;

const guardCode = `${SLUGIFY}
module.exports = async function (data) {
  var p = data.$trigger.payload;
  if (!p || Array.isArray(p) || typeof p !== 'object' || !('slug' in p)) return p;
  var s = slugify(p.slug);
  if (!s) throw new Error('Slug không được để trống (để trống chỉ dùng khi tạo mới — hệ thống tự sinh).');
  return Object.assign({}, p, { slug: s });
};`;

async function createFlow(name, collection, scope) {
  const { data: flow } = await api(
    '/flows',
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        icon: 'link',
        color: '#6644FF',
        status: 'active',
        trigger: 'event',
        accountability: 'all',
        options: { type: 'filter', scope: [scope], collections: [collection], return: '$last' },
      }),
    },
    token,
  );
  return flow;
}

async function createOp(flow, key, type, x, options) {
  const { data } = await api(
    '/operations',
    {
      method: 'POST',
      body: JSON.stringify({ flow, name: key, key, type, position_x: x, position_y: 1, options }),
    },
    token,
  );
  return data;
}

// Idempotent: xoá mọi flow "Auto slug — …" / "Guard slug — …" cũ (kèm operations).
const old = await api(
  '/flows?filter[_or][0][name][_starts_with]=Auto slug&filter[_or][1][name][_starts_with]=Guard slug&fields=id',
  {},
  token,
);
for (const f of old.data || []) await api(`/flows/${f.id}`, { method: 'DELETE' }, token);
if ((old.data || []).length) console.log(`đã xoá ${old.data.length} flow slug cũ`);

for (const [collection, { source, fallback }] of Object.entries(TARGETS)) {
  // --- create: gen → taken → final
  const f1 = await createFlow(`Auto slug — ${collection}`, collection, 'items.create');
  const gen = await createOp(f1.id, 'gen', 'exec', 19, { code: genCode(source, fallback) });
  const taken = await createOp(f1.id, 'taken', 'item-read', 37, {
    collection,
    permissions: '$full',
    query: { filter: { slug: { _starts_with: '{{gen.base}}' } }, fields: ['slug'], limit: -1 },
  });
  const fin = await createOp(f1.id, 'final', 'exec', 55, { code: finalCode });
  await api(`/operations/${gen.id}`, { method: 'PATCH', body: JSON.stringify({ resolve: taken.id }) }, token);
  await api(`/operations/${taken.id}`, { method: 'PATCH', body: JSON.stringify({ resolve: fin.id }) }, token);
  await api(`/flows/${f1.id}`, { method: 'PATCH', body: JSON.stringify({ operation: gen.id }) }, token);

  // --- update: guard
  const f2 = await createFlow(`Guard slug — ${collection}`, collection, 'items.update');
  const guard = await createOp(f2.id, 'guard', 'exec', 19, { code: guardCode });
  await api(`/flows/${f2.id}`, { method: 'PATCH', body: JSON.stringify({ operation: guard.id }) }, token);

  console.log(`✓ ${collection}: slug tự sinh từ "${source}" (create) + guard (update)`);
}
