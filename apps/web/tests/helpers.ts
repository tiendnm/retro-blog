import { vi } from 'vitest';

/** Mock fetch trả JSON (hoặc status lỗi); trả về mock để assert URL đã gọi. */
export function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn(async (..._args: unknown[]) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Nạp lại thin client với env cố định (module đọc env lúc import). */
export async function loadClient() {
  vi.resetModules();
  vi.stubEnv('DIRECTUS_INTERNAL_URL', 'http://directus.test');
  vi.stubEnv('PUBLIC_DIRECTUS_URL', 'https://cms.example.com');
  return import('../src/lib/directus');
}
