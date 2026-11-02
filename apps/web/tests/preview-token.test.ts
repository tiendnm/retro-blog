import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadClient, mockFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const authOf = (f: ReturnType<typeof mockFetch>) =>
  (f.mock.calls[0]?.[1] as { headers: Record<string, string> } | undefined)?.headers.Authorization;

describe('token xem trước bản nháp', () => {
  it('máy chủ xem trước (PREVIEW_SERVER=1 + token) gửi Bearer', async () => {
    vi.stubEnv('PREVIEW_SERVER', '1');
    vi.stubEnv('DIRECTUS_PREVIEW_TOKEN', ' tok-xem-truoc ');
    const f = mockFetch({ data: [] });
    const { getAllPublishedPostSlugs } = await loadClient();
    await getAllPublishedPostSlugs();
    expect(authOf(f)).toBe('Bearer tok-xem-truoc');
  });

  it('có token nhưng KHÔNG có PREVIEW_SERVER ⇒ bỏ qua (build SSG không bao giờ lấy nháp)', async () => {
    vi.stubEnv('DIRECTUS_PREVIEW_TOKEN', 'tok-xem-truoc');
    const f = mockFetch({ data: [] });
    const { getAllPublishedPostSlugs } = await loadClient();
    await getAllPublishedPostSlugs();
    expect(authOf(f)).toBeUndefined();
  });

  it('không có token ⇒ vai Public (không Authorization)', async () => {
    vi.stubEnv('PREVIEW_SERVER', '1');
    const f = mockFetch({ data: [] });
    const { getAllPublishedPostSlugs } = await loadClient();
    await getAllPublishedPostSlugs();
    expect(authOf(f)).toBeUndefined();
  });
});
