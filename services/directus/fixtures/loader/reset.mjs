// Reset fixture — XOÁ THEO SLUG/MANIFEST (không đụng content khác). Adapter Directus.
// CLI: node reset.mjs [--set normal | --profile small] [--yes]
import { connect, assertDevOnly } from './directus.mjs';
import { parseArgs, resolveSets, readManifest, DEFAULT_BASE } from './common.mjs';

/** Xoá toàn bộ item của 1 manifest theo slug (posts → authors/categories; covers theo filename). */
export async function resetManifest(client, manifest) {
  const { api } = client;
  let removed = { posts: 0, authors: 0, categories: 0, files: 0 };

  const delBySlug = async (coll, slug) => {
    const res = await api('GET', `/items/${coll}?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id&limit=-1`);
    for (const it of res.data ?? []) { await api('DELETE', `/items/${coll}/${it.id}`); return true; }
    return false;
  };

  for (const p of manifest.posts) if (await delBySlug('posts', p.slug)) removed.posts++;
  for (const a of manifest.authors) if (await delBySlug('authors', a.slug)) removed.authors++;
  for (const c of manifest.categories) if (await delBySlug('categories', c.slug)) removed.categories++;
  // covers: file có title = cover.key (đặt lúc upload) → xoá theo title
  for (const cov of manifest.covers ?? []) {
    const f = await api('GET', `/files?filter[title][_eq]=${encodeURIComponent(cov.key)}&fields=id&limit=-1`);
    for (const it of f.data ?? []) { await api('DELETE', `/files/${it.id}`); removed.files++; }
  }
  return removed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = DEFAULT_BASE;
  assertDevOnly(base, args.yes);
  const client = await connect(base);
  for (const set of resolveSets(args)) {
    const m = readManifest(set);
    if (!m) { console.log(`(bỏ qua) set "${set}" chưa generate.`); continue; }
    const r = await resetManifest(client, m.manifest);
    console.log(`reset set="${set}": posts ${r.posts}, authors ${r.authors}, categories ${r.categories}, files ${r.files}`);
  }
}

// Chạy như CLI (không chạy khi được import).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reset.mjs')) main();
