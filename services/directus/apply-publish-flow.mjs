// ── Tạo Directus Flow auto-set published_at (Sprint 6.5, C1) ────────────────
// Vá "bẫy 2 bước" khi publish: editor đặt status=published nhưng quên published_at
// ⇒ bài không hiện (Public yêu cầu published_at ≤ $NOW). Flow này TỰ set
// published_at = thời điểm hiện tại khi status được đặt 'published' mà chưa có.
//
// Cơ chế (Directus 11): trigger event "action" (chạy SAU khi lưu) trên posts
// (create+update) → Run Script tính điều kiện + timestamp → Condition → Update Data
// với emitEvents=false. emitEvents=false ⇒ KHÔNG phát event ⇒ KHÔNG loop trigger,
// KHÔNG kích rebuild-on-publish thừa. (Filter/exec-return KHÔNG sửa được payload
// ở Directus 11.3.5 — đã kiểm chứng — nên dùng action + self-update có guard.)
//
// Reproducible + idempotent (như apply-permissions / apply-rebuild-flow).
// Chạy TRÊN HOST:  node services/directus/apply-publish-flow.mjs
// Env: DIRECTUS_URL (admin API, mặc định http://localhost:8055),
//      ADMIN_EMAIL, ADMIN_PASSWORD.
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const FLOW_NAME = 'Auto set published_at';
const COLLECTION = 'posts';

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

// Idempotent: xoá flow cũ cùng tên (kèm operations) trước khi tạo lại.
const existing = await api(
  `/flows?filter[name][_eq]=${encodeURIComponent(FLOW_NAME)}&fields=id`,
  {},
  token,
);
for (const f of existing.data || []) {
  await api(`/flows/${f.id}`, { method: 'DELETE' }, token);
  console.log(`đã xoá flow cũ ${f.id}`);
}

// Script sandbox (isolate) — chỉ built-in (Date). Quyết định có set không + timestamp.
// Chỉ can thiệp khi CHÍNH thay đổi này đặt status=published mà không kèm published_at
// ⇒ không đụng bài đang publish khi chỉ sửa nội dung (payload.status vắng mặt).
// Trả cờ CHUỖI 'yes'/'no' (condition dùng _eq:'yes'): filter engine của Directus
// so khớp boolean _eq:true KHÔNG đáng tin — dùng chuỗi cho chắc (đã kiểm chứng).
const SCRIPT = `module.exports = function (data) {
  var t = data.$trigger || {};
  var payload = t.payload || {};
  var keys = t.keys || (t.key !== undefined && t.key !== null ? [t.key] : []);
  var go =
    payload.status === 'published' &&
    (payload.published_at === undefined || payload.published_at === null) &&
    keys.length > 0
      ? 'yes'
      : 'no';
  return { go: go, keys: keys, ts: new Date().toISOString() };
};`;

// Tạo Flow (trigger event "action" — không chặn, chạy sau khi lưu).
const { data: flow } = await api(
  '/flows',
  {
    method: 'POST',
    body: JSON.stringify({
      name: FLOW_NAME,
      icon: 'schedule',
      color: '#6644FF',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update'],
        collections: [COLLECTION],
      },
    }),
  },
  token,
);

// Op1: Run Script — tính apply/keys/ts.
const { data: op1 } = await api(
  '/operations',
  {
    method: 'POST',
    body: JSON.stringify({
      flow: flow.id,
      name: 'Tính điều kiện',
      key: 'compute',
      type: 'exec',
      position_x: 19,
      position_y: 1,
      options: { code: SCRIPT },
    }),
  },
  token,
);

// Op2: Condition — chỉ đi tiếp khi compute.apply === true.
const { data: op2 } = await api(
  '/operations',
  {
    method: 'POST',
    body: JSON.stringify({
      flow: flow.id,
      name: 'Cần set?',
      key: 'need_set',
      type: 'condition',
      position_x: 37,
      position_y: 1,
      options: { filter: { compute: { go: { _eq: 'yes' } } } },
    }),
  },
  token,
);

// Op3: Update Data — set published_at, emitEvents=false (không loop / không rebuild thừa).
const { data: op3 } = await api(
  '/operations',
  {
    method: 'POST',
    body: JSON.stringify({
      flow: flow.id,
      name: 'Set published_at',
      key: 'set_published_at',
      type: 'item-update',
      position_x: 55,
      position_y: 1,
      options: {
        collection: COLLECTION,
        key: '{{compute.keys}}',
        payload: { published_at: '{{compute.ts}}' },
        emitEvents: false,
      },
    }),
  },
  token,
);

// Nối chuỗi: flow → op1 → (resolve) op2 → (resolve) op3.
await api(`/operations/${op1.id}`, { method: 'PATCH', body: JSON.stringify({ resolve: op2.id }) }, token);
await api(`/operations/${op2.id}`, { method: 'PATCH', body: JSON.stringify({ resolve: op3.id }) }, token);
await api(`/flows/${flow.id}`, { method: 'PATCH', body: JSON.stringify({ operation: op1.id }) }, token);

console.log(
  `✓ Flow "${FLOW_NAME}" (${flow.id}) — auto-set published_at trên [${COLLECTION}] (create+update, action + guard, emitEvents=false)`,
);
