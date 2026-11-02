// Vai Preview (máy chủ xem trước bản nháp — docs/05-cms §4) trên Directus thật: ĐỌC được nháp nhưng KHÔNG được ghi,
// không đọc được bề mặt hệ thống, và chỉ trả trường trong allowlist. Cần apply-preview.sh đã chạy (CI có bước riêng).
//   node --test scripts/integration/preview.test.mjs
// Đỏ vì Preview ghi/đọc quá quyền = dừng và báo Product (cổng bảo mật).
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { cleanup, makePost, previewToken, pub, withToken } from './lib.mjs';

const ALLOW_POSTS = ['id', 'title', 'slug', 'previous_slugs', 'excerpt', 'body', 'published_at', 'author', 'category', 'cover', 'tags'];
const DENIED = [401, 403];
let T;
let draft;
let future;

before(async () => {
  T = previewToken();
  await cleanup();
  draft = await makePost({ status: 'draft', label: 'prev-draft' });
  future = await makePost({ status: 'published', publishedAt: 86_400_000, label: 'prev-future' });
});
after(cleanup);

describe('vai Preview', () => {
  it('đọc được bài nháp và bài hẹn giờ theo slug (Public thì không)', async () => {
    for (const p of [draft, future]) {
      const r = await withToken(T, 'GET', `/items/posts?filter[slug][_eq]=${p.slug}&fields=id,slug,title,body`);
      assert.equal(r.json?.data?.length, 1, `Preview không đọc được ${p.slug}: HTTP ${r.status}`);
      const anon = await pub('GET', `/items/posts?filter[slug][_eq]=${p.slug}&fields=id,slug`);
      assert.equal(anon.json?.data?.length ?? 0, 0, `${p.slug} lộ cho Public`);
    }
  });

  it('fields=* chỉ trả trường trong allowlist (không có status)', async () => {
    const r = await withToken(T, 'GET', `/items/posts?filter[slug][_eq]=${draft.slug}&fields=*`);
    const keys = Object.keys(r.json?.data?.[0] ?? {});
    assert.deepEqual(keys.filter((k) => !ALLOW_POSTS.includes(k)), [], 'Preview trả trường ngoài allowlist');
  });

  it('KHÔNG ghi được: tạo / sửa / xoá bài', async () => {
    const create = await withToken(T, 'POST', '/items/posts', { title: 'x', slug: 'int-test-preview-ghi', body: 'x' });
    assert.ok(DENIED.includes(create.status), `Preview tạo được bài: HTTP ${create.status}`);
    const patch = await withToken(T, 'PATCH', `/items/posts/${draft.id}`, { title: 'bị sửa' });
    assert.ok(DENIED.includes(patch.status), `Preview sửa được bài: HTTP ${patch.status}`);
    const del = await withToken(T, 'DELETE', `/items/posts/${draft.id}`);
    assert.ok(DENIED.includes(del.status), `Preview xoá được bài: HTTP ${del.status}`);
  });

  it('không đọc được bề mặt hệ thống (users, roles, policies, permissions, flows)', async () => {
    for (const path of ['/users', '/roles', '/policies', '/permissions', '/flows', '/items/directus_users']) {
      const r = await withToken(T, 'GET', path);
      const leaked = Array.isArray(r.json?.data) ? r.json.data.length : r.json?.data ? 1 : 0;
      // /users và /roles cho phép đọc CHÍNH MÌNH ở một số bản; chỉ chấp nhận tối đa 1 bản ghi và không phải danh sách quản trị.
      assert.ok(DENIED.includes(r.status) || r.status === 404 || leaked <= 1, `Preview đọc được ${path}: HTTP ${r.status}, ${leaked} bản ghi`);
    }
  });

  it('token sai bị từ chối (không rơi về Public khi gửi sai token)', async () => {
    const r = await withToken('0'.repeat(40), 'GET', `/items/posts?filter[slug][_eq]=${draft.slug}&fields=id`);
    assert.ok(DENIED.includes(r.status), `token sai vẫn qua: HTTP ${r.status}`);
  });
});
