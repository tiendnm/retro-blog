// Directus adapter helper — CHỖ DUY NHẤT phụ thuộc Directus (REST qua fetch).
// Dùng fetch (Node 18+) → không dính lỗi curl URL-globbing.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FIXTURES_ROOT = new URL('../../../../', import.meta.url).pathname; // repo root (…/retro-blog/)

export function readAdminCreds() {
  const envPath = resolve(process.cwd(), '.env');
  let env = '';
  try { env = readFileSync(envPath, 'utf8'); } catch { /* dùng process.env */ }
  const pick = (k) => process.env[k] ?? (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
  return { email: pick('ADMIN_EMAIL'), password: pick('ADMIN_PASSWORD') };
}

/** DEV-only guard: chỉ cho chạy với Directus localhost, trừ khi có --yes. */
export function assertDevOnly(base, allowYes) {
  const host = new URL(base).hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  if (!local && !allowYes) {
    console.error(`⛔ DEV-only: Directus không phải localhost (${host}). Thêm --yes nếu chủ đích.`);
    process.exit(1);
  }
}

export async function connect(base) {
  const { email, password } = readAdminCreds();
  if (!email || !password) throw new Error('Thiếu ADMIN_EMAIL/ADMIN_PASSWORD (.env).');
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  const token = login?.data?.access_token;
  if (!token) throw new Error('Đăng nhập admin thất bại.');

  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  async function api(method, path, body) {
    const r = await fetch(`${base}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${text.slice(0, 200)}`);
    return json;
  }
  async function uploadFile(buffer, filename, type, fields = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    fd.append('file', new Blob([buffer], { type }), filename);
    const r = await fetch(`${base}/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(`upload ${filename} -> ${r.status}`);
    return j.data;
  }
  return { base, api, uploadFile };
}

export { FIXTURES_ROOT };
