// Generator — ĐỘC LẬP Directus. Sinh manifest (skeleton deterministic) + file body.
// Skeleton chỉ phụ thuộc index/cấu hình (KHÔNG rng) ⇒ slug ỔN ĐỊNH qua regenerate.
// Nội dung (body/excerpt) dùng rng seeded (làm mới được, không ảnh hưởng slug).
// CLI: node generator.mjs --set normal --profile small --seed 42 --content static --cover none
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRng } from './rng.mjs';
import { slugify, pad2 } from './model.mjs';
import { CATEGORIES, AUTHORS } from './taxonomy.mjs';
import { normalCount } from './profiles.mjs';
import * as edgeSet from './sets/edge.mjs';
import * as stressSet from './sets/stress.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(HERE, '../content');
const MANIFEST_VERSION = 1;
// Base date CỐ ĐỊNH (không dùng đồng hồ thật) — mọi publishedAt < mốc này (đã là quá khứ).
const BASE_MS = Date.parse('2026-06-15T09:00:00Z');
const DAY = 86400000;

const CONTENT_PROVIDERS = {
  static: () => import('./providers/content/static.mjs'),
  ai: () => import('./providers/content/ai.mjs'),
  future: () => import('./providers/content/future.mjs'),
};
const COVER_PROVIDERS = {
  none: () => import('./providers/cover/none.mjs'),
  manual: () => import('./providers/cover/manual.mjs'),
  ai: () => import('./providers/cover/ai.mjs'),
};

function parseArgs(argv) {
  const a = { set: 'normal', profile: 'small', seed: 42, content: 'static', cover: 'none' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) a[k.slice(2)] = argv[i + 1], i++;
  }
  a.seed = Number(a.seed);
  return a;
}

// Wheel phân bổ category: mỗi category weight lần, xếp xen kẽ theo vị trí phân số.
function categoryWheel() {
  const marks = [];
  for (const c of CATEGORIES) {
    for (let k = 0; k < c.weight; k++) marks.push({ pos: (k + 0.5) / c.weight, key: c.key });
  }
  marks.sort((a, b) => a.pos - b.pos || a.key.localeCompare(b.key));
  return marks.map((m) => m.key); // độ dài = tổng weight
}

const lengthAt = (i) => ([2, 7].includes(i % 10) ? 'long' : [0, 5, 9].includes(i % 10) ? 'short' : 'medium');
const isDraft = (i) => i % 5 === 4; // ~2/10
const authorAt = (i) => (i % 5 === 2 ? AUTHORS[1] : AUTHORS[0]); // ~20% guest

/** Skeleton DETERMINISTIC (không rng). */
function buildSkeleton(count) {
  const wheel = categoryWheel();
  const seqByCat = {};
  const posts = [];
  for (let i = 0; i < count; i++) {
    const catKey = wheel[i % wheel.length];
    const cat = CATEGORIES.find((c) => c.key === catKey);
    const seq = (seqByCat[catKey] = (seqByCat[catKey] ?? 0) + 1);
    const draft = isDraft(i);
    posts.push({
      key: `normal-${pad2(i + 1)}`,
      slug: `${cat.slug}-${pad2(seq)}`,
      categoryKey: catKey,
      categoryName: cat.name,
      authorKey: authorAt(i).key,
      length: lengthAt(i),
      status: draft ? 'draft' : 'published',
      publishedAt: draft ? null : new Date(BASE_MS - (i * 9 + (i % 3) * 3) * DAY).toISOString(),
      set: 'normal',
      edgeType: undefined,
    });
  }
  return posts;
}

// Bộ CỐ ĐỊNH (edge/stress) — nội dung hand-crafted, author/category riêng, cover=none.
async function genFixed(setName, args) {
  const mod = setName === 'edge' ? edgeSet : stressSet;
  const { author, category, posts, bodies } = mod.build();
  const outDir = resolve(CONTENT_DIR, setName);
  const bodyDir = resolve(outDir, 'body');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(bodyDir, { recursive: true });
  for (const [slug, md] of Object.entries(bodies)) writeFileSync(resolve(bodyDir, `${slug}.md`), md, 'utf8');
  const manifest = {
    version: MANIFEST_VERSION, set: setName, seed: args.seed,
    contentProvider: 'fixed', coverProvider: 'none',
    authors: [author], categories: [category], covers: [], posts,
  };
  writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Generated set="${setName}": ${posts.length} bài (author=${author.slug}, category=${category.slug}), cover=none.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.set === 'edge' || args.set === 'stress') {
    await genFixed(args.set, args);
    return;
  }
  if (args.set !== 'normal') {
    console.error(`Set "${args.set}" không hỗ trợ (chỉ normal/edge/stress).`);
    process.exit(1);
  }
  const count = normalCount(args.profile);
  if (!count) {
    console.error(`Profile "${args.profile}" không có 'normal'.`);
    process.exit(1);
  }
  const content = await CONTENT_PROVIDERS[args.content]();
  const cover = await COVER_PROVIDERS[args.cover]();
  const rng = makeRng(args.seed);

  const skeleton = buildSkeleton(count);
  const outDir = resolve(CONTENT_DIR, args.set);
  const bodyDir = resolve(outDir, 'body');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(bodyDir, { recursive: true });

  const covers = [];
  const posts = skeleton.map((sk) => {
    const ctx = { categoryName: sk.categoryName };
    const title = makeTitle(sk, ctx);
    const body = content.produceBody(sk, rng, ctx);
    const excerpt = content.produceExcerpt(sk, rng, ctx);
    const bodyPath = `body/${sk.slug}.md`;
    writeFileSync(resolve(outDir, bodyPath), body + '\n', 'utf8');
    let coverKey = null;
    const cov = cover.resolveCover(sk);
    if (cov) {
      coverKey = `cover-${sk.slug}`;
      covers.push({ key: coverKey, source: cov.source, pathOrPrompt: cov.pathOrPrompt, alt: cov.alt });
    }
    return {
      key: sk.key, slug: sk.slug, title, excerpt, bodyPath,
      authorKey: sk.authorKey, categoryKey: sk.categoryKey, coverKey,
      status: sk.status, publishedAt: sk.publishedAt, set: sk.set, edgeType: sk.edgeType,
    };
  });

  const manifest = {
    version: MANIFEST_VERSION,
    set: args.set,
    seed: args.seed,
    contentProvider: args.content,
    coverProvider: args.cover,
    authors: AUTHORS.map(({ key, name, slug, bio }) => ({ key, name, slug, bio })),
    categories: CATEGORIES.map(({ key, name, slug, description }) => ({ key, name, slug, description })),
    covers,
    posts,
  };
  writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  const published = posts.filter((p) => p.status === 'published').length;
  console.log(`Generated set="${args.set}" profile="${args.profile}" seed=${args.seed}: ${posts.length} bài (${published} published, ${posts.length - published} draft), ${CATEGORIES.length} category, cover=${args.cover}.`);
}

const TITLE_TPL = ['{c}: nhìn lại một thời', 'Ghi chép về {c}', 'Hoài niệm {c}', 'Chuyện chưa kể về {c}', 'Khám phá {c} thời kỳ đầu'];
function makeTitle(sk, ctx) {
  // Tiêu đề deterministic theo index (không rng) — ổn định cùng slug.
  const i = Number(sk.key.split('-')[1]) - 1;
  return TITLE_TPL[i % TITLE_TPL.length].replace('{c}', ctx.categoryName) + ` #${pad2(Number(sk.slug.split('-').pop()))}`;
}

main();
