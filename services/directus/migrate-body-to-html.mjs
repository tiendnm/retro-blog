// Migration MỘT LẦN (ADR-0011): posts.body markdown → HTML (ghi đè tại chỗ, không giữ bản cũ).
// Idempotent: bỏ qua body đã là HTML. Chạy:  node services/directus/migrate-body-to-html.mjs
import { connect, assertDevOnly } from './fixtures/loader/directus.mjs';
import { DEFAULT_BASE } from './fixtures/loader/common.mjs';
import { mdToHtml, looksLikeHtml } from './lib/md-to-html.mjs';

const yes = process.argv.includes('--yes');
assertDevOnly(DEFAULT_BASE, yes);
const { api } = await connect(DEFAULT_BASE);

const { data } = await api('GET', '/items/posts?fields=id,slug,body&limit=-1');
let converted = 0, skipped = 0;
for (const p of data) {
  if (!p.body || looksLikeHtml(p.body)) { skipped++; continue; }
  await api('PATCH', `/items/posts/${p.id}`, { body: mdToHtml(p.body) });
  converted++;
}
console.log(`Migration body→HTML: converted=${converted} skipped=${skipped} total=${data.length}`);
