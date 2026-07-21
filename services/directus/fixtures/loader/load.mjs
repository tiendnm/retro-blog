// Load fixture vào Directus — idempotent (reset-by-slug rồi tạo). Adapter Directus.
// CLI: node load.mjs [--set normal | --profile small] [--yes]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect, assertDevOnly } from './directus.mjs';
import { resetManifest } from './reset.mjs';
import { parseArgs, resolveSets, readManifest, readBody, DEFAULT_BASE } from './common.mjs';

async function loadManifest(client, manifest, dir) {
  const { api, uploadFile } = client;
  await resetManifest(client, manifest); // idempotent

  const authorId = {};
  for (const a of manifest.authors) {
    const r = await api('POST', '/items/authors', { name: a.name, slug: a.slug, bio: a.bio });
    authorId[a.key] = r.data.id;
  }
  const categoryId = {};
  for (const c of manifest.categories) {
    const r = await api('POST', '/items/categories', { name: c.name, slug: c.slug, description: c.description ?? null });
    categoryId[c.key] = r.data.id;
  }
  const coverId = {};
  for (const cov of manifest.covers ?? []) {
    const buf = readFileSync(resolve(dir, cov.pathOrPrompt));
    const type = cov.pathOrPrompt.endsWith('.svg') ? 'image/svg+xml' : cov.pathOrPrompt.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const file = await uploadFile(buf, `${cov.key}.img`, type, { title: cov.key });
    await api('PATCH', `/files/${file.id}`, { alt: cov.alt ?? '' });
    coverId[cov.key] = file.id;
  }
  let created = 0;
  for (const p of manifest.posts) {
    await api('POST', '/items/posts', {
      title: p.title, slug: p.slug, excerpt: p.excerpt ?? null,
      body: readBody(dir, p.bodyPath),
      status: p.status, published_at: p.publishedAt ?? null,
      author: authorId[p.authorKey],
      category: p.categoryKey ? categoryId[p.categoryKey] : null,
      cover: p.coverKey ? coverId[p.coverKey] : null,
    });
    created++;
  }
  return { authors: manifest.authors.length, categories: manifest.categories.length, covers: (manifest.covers ?? []).length, posts: created };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = DEFAULT_BASE;
  assertDevOnly(base, args.yes);
  const client = await connect(base);
  for (const set of resolveSets(args)) {
    const m = readManifest(set);
    if (!m) { console.log(`(bỏ qua) set "${set}" chưa generate — chạy fixtures:generate trước.`); continue; }
    const r = await loadManifest(client, m.manifest, m.dir);
    console.log(`load set="${set}": authors ${r.authors}, categories ${r.categories}, covers ${r.covers}, posts ${r.posts}`);
  }
}

main();
