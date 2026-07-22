// ── Tạo Directus Flow rebuild-on-publish (Sprint 6 Phase 3 — ADR-0008) ─────
// Reproducible + idempotent (như apply-permissions). Tạo Flow:
//   trigger event "action" (items.create/update/delete trên posts/categories/authors)
//   → operation Webhook POST tới REBUILD_WEBHOOK_URL kèm token bảo vệ.
// Chạy TRÊN HOST:  node services/directus/apply-rebuild-flow.mjs
// Env: DIRECTUS_URL (admin API, mặc định http://localhost:8055),
//      ADMIN_EMAIL, ADMIN_PASSWORD, REBUILD_WEBHOOK_URL, REBUILD_TOKEN.
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const WEBHOOK_URL = process.env.REBUILD_WEBHOOK_URL || 'http://host.docker.internal:9000/rebuild';
const TOKEN = process.env.REBUILD_TOKEN;
const FLOW_NAME = 'Rebuild on publish';
const COLLECTIONS = ['posts', 'categories', 'authors'];

if (!EMAIL || !PASSWORD) {
  console.error('❌ cần ADMIN_EMAIL/ADMIN_PASSWORD');
  process.exit(1);
}
if (!TOKEN) {
  console.error('❌ cần REBUILD_TOKEN');
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

// Tạo Flow (trigger event "action" — không chặn, chạy sau khi lưu).
const { data: flow } = await api(
  '/flows',
  {
    method: 'POST',
    body: JSON.stringify({
      name: FLOW_NAME,
      icon: 'sync',
      color: '#2ECDA7',
      status: 'active',
      trigger: 'event',
      accountability: 'all',
      options: {
        type: 'action',
        scope: ['items.create', 'items.update', 'items.delete'],
        collections: COLLECTIONS,
      },
    }),
  },
  token,
);

// Operation Webhook (POST kèm token) + đặt làm entry của flow.
const { data: op } = await api(
  '/operations',
  {
    method: 'POST',
    body: JSON.stringify({
      flow: flow.id,
      name: 'Rebuild webhook',
      key: 'rebuild_webhook',
      type: 'request',
      position_x: 19,
      position_y: 1,
      options: {
        url: WEBHOOK_URL,
        method: 'POST',
        headers: [{ header: 'x-rebuild-token', value: TOKEN }],
      },
    }),
  },
  token,
);
await api(`/flows/${flow.id}`, { method: 'PATCH', body: JSON.stringify({ operation: op.id }) }, token);

console.log(
  `✓ Flow "${FLOW_NAME}" (${flow.id}) → webhook ${WEBHOOK_URL} trên [${COLLECTIONS.join(', ')}]`,
);
