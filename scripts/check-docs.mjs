#!/usr/bin/env node
// ── Kiểm tài liệu (Sprint 14) ──────────────────────────────────────────────────────────────────────
// Node thuần, không phụ thuộc, không cần Docker. Chạy từ gốc repo:  node scripts/check-docs.mjs
//   1) Mọi link tương đối trong docs/**/*.md và README.md trỏ tới file/thư mục CÓ THẬT; link có #neo thì neo phải
//      khớp một heading của file đích (quy tắc slug của GitHub).
//   2) Không còn `TODO`/`TBD` trong tài liệu "sống" (docs/ trừ sprints/, adr/, reviews/ — là lịch sử, mô tả sự việc
//      tại thời điểm viết) ngoài danh sách cho phép docs/.todo-allowlist.
// Exit 0 = sạch · 1 = có lỗi. Định dạng allowlist: xem đầu file docs/.todo-allowlist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const ALLOWLIST = join(DOCS, '.todo-allowlist');
// Thư mục lịch sử: không quét ô trống (vẫn kiểm link).
const HISTORY_DIRS = ['sprints', 'adr', 'reviews'];

const rel = (p) => relative(ROOT, p).split(sep).join('/');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** Bỏ khối code rào (```), giữ nguyên số dòng để báo lỗi đúng vị trí. */
function stripFences(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return '';
      }
      return inFence ? '' : line;
    })
    .join('\n');
}

/** Slug heading kiểu GitHub: chữ thường, bỏ ký tự không phải chữ/số/_/-/khoảng trắng, khoảng trắng → "-". */
function slugify(heading) {
  return heading
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

const anchorCache = new Map();
function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const seen = new Map();
  const set = new Set();
  for (const line of stripFences(readFileSync(file, 'utf8')).split('\n')) {
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const base = slugify(m[1]);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    set.add(n === 0 ? base : `${base}-${n}`);
  }
  anchorCache.set(file, set);
  return set;
}

/** Các link `[text](target)` ngoài khối code và ngoài `code` nội dòng, kèm số dòng (1-based). */
function* linksOf(text) {
  const lines = stripFences(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/`[^`]*`/g, (s) => ' '.repeat(s.length));
    for (const m of line.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      yield { target: m[1], line: i + 1 };
    }
  }
}

const errors = [];
const fail = (file, line, msg) => errors.push(`${rel(file)}:${line}: ${msg}`);

// ── 1) Link ────────────────────────────────────────────────────────────────────────────────────────
const files = [join(ROOT, 'README.md'), ...walk(DOCS)].filter(existsSync);
let linkCount = 0;
for (const file of files) {
  for (const { target, line } of linksOf(readFileSync(file, 'utf8'))) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue; // http:, mailto:, tel:, …
    linkCount++;
    const [pathPart, rawAnchor] = target.split('#');
    const anchor = rawAnchor ? decodeURIComponent(rawAnchor).toLowerCase() : '';
    const dest = pathPart ? resolve(dirname(file), decodeURIComponent(pathPart)) : file;
    if (!existsSync(dest)) {
      fail(file, line, `link hỏng → ${target} (không có ${rel(dest)})`);
      continue;
    }
    if (anchor && dest.endsWith('.md') && statSync(dest).isFile() && !anchorsOf(dest).has(anchor)) {
      fail(file, line, `neo không tồn tại → ${target} (không có heading #${anchor} trong ${rel(dest)})`);
    }
  }
}

// ── 2) TODO/TBD ngoài allowlist ────────────────────────────────────────────────────────────────────
/** Mỗi dòng: `đường-dẫn :: đoạn trích trong dòng :: lý do :: sprint đích` (bỏ dòng trống và dòng bắt đầu bằng #). */
function loadAllowlist() {
  const entries = [];
  if (!existsSync(ALLOWLIST)) return entries;
  readFileSync(ALLOWLIST, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const [file, fragment, reason, sprint] = line.split('::').map((s) => s.trim());
      if (!file || !fragment || !reason || !sprint) {
        fail(ALLOWLIST, i + 1, 'mục allowlist phải đủ 4 phần: đường-dẫn :: đoạn trích :: lý do :: sprint đích');
        return;
      }
      entries.push({ file, fragment, used: false, at: i + 1 });
    });
  return entries;
}

const allow = loadAllowlist();
let todoCount = 0;
for (const file of walk(DOCS)) {
  const r = rel(file);
  if (HISTORY_DIRS.some((d) => r.startsWith(`docs/${d}/`))) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((text, i) => {
      if (!/\b(TODO|TBD)\b/.test(text)) return;
      todoCount++;
      const hit = allow.find((a) => a.file === r && text.includes(a.fragment));
      if (hit) hit.used = true;
      else fail(file, i + 1, `TODO/TBD ngoài allowlist → "${text.trim().slice(0, 80)}"`);
    });
}
for (const a of allow) {
  if (!a.used) fail(ALLOWLIST, a.at, `mục allowlist không còn khớp dòng nào (${a.file} :: ${a.fragment}) — xoá đi`);
}

// ── Kết quả ────────────────────────────────────────────────────────────────────────────────────────
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n✗ check-docs: ${errors.length} lỗi (${files.length} file, ${linkCount} link tương đối, ${todoCount} TODO/TBD)`);
  process.exit(1);
}
console.log(`✓ check-docs: ${files.length} file, ${linkCount} link tương đối đều trỏ tới đích có thật; ${todoCount} TODO/TBD (đều trong allowlist)`);
