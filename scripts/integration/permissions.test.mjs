// Quyền Public trên Directus thật (Sprint 11 §E) — kiểm cấu hình, KHÔNG đổi quyền.
//   node --test scripts/integration/permissions.test.mjs     (cần Directus + seed đang chạy)
// Nếu test nào đỏ vì LỘ DỮ LIỆU: dừng và báo Product (cổng bảo mật, sprint-11 §E).
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { admin, cleanup, makePost, pub } from './lib.mjs';

// Allowlist Public — hợp đồng bảo mật (services/directus/apply-permissions.sh, docs/05-cms §2).
const ALLOW = {
  posts: ['id', 'title', 'slug', 'excerpt', 'body', 'published_at', 'author', 'category', 'cover', 'tags'],
  authors: ['id', 'name', 'slug', 'bio', 'avatar'],
  categories: ['id', 'name', 'slug', 'description'],
  tags: ['id', 'name', 'slug'],
  posts_tags: ['id', 'posts_id', 'tags_id'],
  directus_files: ['id', 'alt'],
  site_settings: ['site_name', 'description', 'footer_text', 'default_og_image'],
};

const keysOf = (rows) => [...new Set([rows].flat().filter(Boolean).flatMap((r) => Object.keys(r)))];
const outside = (collection, rows) => keysOf(rows).filter((k) => !ALLOW[collection].includes(k));
const DENIED = [401, 403];

let draft;
let future;
let live;

before(async () => {
  await cleanup();
  draft = await makePost({ status: 'draft', label: 'draft' });
  future = await makePost({ status: 'published', publishedAt: 86_400_000, label: 'future' });
  live = await makePost({ status: 'published', publishedAt: -60_000, label: 'live' });
});
after(cleanup);

describe('bài viết', () => {
  it('bài nháp không đọc được (theo slug, theo id, theo bộ lọc dò trường status)', async () => {
    const bySlug = await pub('GET', `/items/posts?filter[slug][_eq]=${draft.slug}&fields=id,slug`);
    assert.equal(bySlug.json?.data?.length ?? 0, 0, 'bài nháp lộ qua danh sách');
    const byId = await pub('GET', `/items/posts/${draft.id}`);
    assert.ok([...DENIED, 404].includes(byId.status), `bài nháp đọc được theo id: HTTP ${byId.status}`);
    assert.equal(byId.json?.data, undefined);
    // Dò bằng trường không nằm trong allowlist: phải bị chặn hoặc không trả bài nháp.
    const probe = await pub('GET', '/items/posts?filter[status][_eq]=draft&fields=id,slug');
    assert.ok(!(probe.json?.data ?? []).some((p) => p.slug === draft.slug), 'dò filter[status] làm lộ bài nháp');
  });

  it('bài published_at ở tương lai không đọc được', async () => {
    const bySlug = await pub('GET', `/items/posts?filter[slug][_eq]=${future.slug}&fields=id,slug`);
    assert.equal(bySlug.json?.data?.length ?? 0, 0, 'bài hẹn giờ lộ qua danh sách');
    const byId = await pub('GET', `/items/posts/${future.id}`);
    assert.ok([...DENIED, 404].includes(byId.status), `bài hẹn giờ đọc được theo id: HTTP ${byId.status}`);
    const sorted = await pub('GET', '/items/posts?fields=slug&sort=-published_at&limit=-1');
    assert.ok(!(sorted.json?.data ?? []).some((p) => p.slug === future.slug), 'bài hẹn giờ lộ trong danh sách tổng');
  });

  it('bài đã xuất bản đọc được; fields=* chỉ trả trường trong allowlist (không có status)', async () => {
    const r = await pub('GET', `/items/posts?filter[slug][_eq]=${live.slug}&fields=*`);
    assert.equal(r.status, 200);
    assert.equal(r.json.data.length, 1, 'bài đã xuất bản phải đọc được');
    assert.deepEqual(outside('posts', r.json.data), [], 'posts trả trường ngoài allowlist');
    assert.ok(!('status' in r.json.data[0]));
  });

  it('quan hệ lồng nhau (author/category/cover/tags) cũng chỉ trả trường trong allowlist', async () => {
    const r = await pub(
      'GET',
      '/items/posts?fields=author.*,category.*,cover.*,tags.*,tags.tags_id.*&limit=-1',
    );
    assert.equal(r.status, 200);
    const rows = r.json.data;
    assert.deepEqual(outside('authors', rows.map((p) => p.author)), [], 'authors lộ trường');
    assert.deepEqual(outside('categories', rows.map((p) => p.category)), [], 'categories lộ trường');
    assert.deepEqual(outside('directus_files', rows.map((p) => p.cover)), [], 'cover lộ trường file');
    assert.deepEqual(outside('posts_tags', rows.flatMap((p) => p.tags ?? [])), [], 'posts_tags lộ trường');
    assert.deepEqual(outside('tags', rows.flatMap((p) => (p.tags ?? []).map((t) => t.tags_id))), [], 'tags lộ trường');
  });

  it('số bài Public thấy = số bài đã xuất bản và đã tới giờ (theo admin)', async () => {
    const now = new Date().toISOString();
    const a = await admin(
      'GET',
      `/items/posts?filter[status][_eq]=published&filter[published_at][_lte]=${now}&aggregate[count]=id`,
    );
    const p = await pub('GET', '/items/posts?aggregate[count]=id');
    assert.equal(Number(p.json.data[0].count.id), Number(a.json.data[0].count.id));
  });
});

describe('collection khác', () => {
  for (const [collection, path] of [
    ['authors', '/items/authors'],
    ['categories', '/items/categories'],
    ['tags', '/items/tags'],
    ['directus_files', '/files'],
  ]) {
    it(`${collection}: fields=* chỉ trả trường trong allowlist`, async () => {
      const r = await pub('GET', `${path}?fields=*&limit=-1`);
      assert.equal(r.status, 200);
      assert.deepEqual(outside(collection, r.json.data), []);
    });
  }

  it('site_settings: chỉ trả trường trong allowlist', async () => {
    const r = await pub('GET', '/items/site_settings?fields=*');
    assert.equal(r.status, 200);
    assert.deepEqual(outside('site_settings', r.json.data), []);
  });
});

describe('bề mặt hệ thống', () => {
  for (const path of [
    '/users',
    '/users/me',
    '/roles',
    '/policies',
    '/permissions',
    '/activity',
    '/revisions',
    '/settings',
    '/flows',
    '/operations',
    '/dashboards',
    '/sessions',
    '/presets',
    '/shares',
    '/notifications',
    '/webhooks',
    '/extensions',
  ]) {
    it(`GET ${path} bị từ chối`, async () => {
      const r = await pub('GET', path);
      assert.ok(DENIED.includes(r.status) || (r.status === 404 && !r.json?.data), `${path}: HTTP ${r.status}`);
      assert.equal(Array.isArray(r.json?.data) && r.json.data.length > 0, false, `${path} trả dữ liệu`);
    });
  }

  it('/users: không lộ email dù hỏi thẳng', async () => {
    const r = await pub('GET', '/users?fields=email,first_name,last_name,password,token');
    assert.equal(r.status, 403);
    assert.ok(!/@/.test(r.text), 'phản hồi chứa địa chỉ email');
  });
});

describe('ghi bị cấm', () => {
  it('Public không tạo/sửa/xoá được bài', async () => {
    const create = await pub('POST', '/items/posts', { title: 'x', slug: 'int-test-public-write', status: 'published' });
    assert.ok(DENIED.includes(create.status), `POST posts: HTTP ${create.status}`);
    const patch = await pub('PATCH', `/items/posts/${live.id}`, { title: 'bị sửa' });
    assert.ok(DENIED.includes(patch.status), `PATCH posts: HTTP ${patch.status}`);
    const del = await pub('DELETE', `/items/posts/${live.id}`);
    assert.ok(DENIED.includes(del.status), `DELETE posts: HTTP ${del.status}`);
    const check = await admin('GET', `/items/posts/${live.id}?fields=title`);
    assert.notEqual(check.json.data.title, 'bị sửa');
  });

  it('Public không tạo được tác giả / chuyên mục / thẻ / file', async () => {
    for (const [path, body] of [
      ['/items/authors', { name: 'x', slug: 'x' }],
      ['/items/categories', { name: 'x', slug: 'x' }],
      ['/items/tags', { name: 'x', slug: 'x' }],
      ['/files', {}],
    ]) {
      const r = await pub('POST', path, body);
      assert.ok(DENIED.includes(r.status) || r.status === 400, `POST ${path}: HTTP ${r.status}`);
      assert.ok(r.status !== 200 && r.status !== 204);
    }
  });
});
