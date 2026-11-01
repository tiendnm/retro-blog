#!/usr/bin/env node
// Kiểm tra cấu trúc site đã build (Sprint 11 §A) — Node thuần, không dependency.
//   node scripts/check-site.mjs [thư-mục-dist] [--site-url=https://...] [--report=file.txt]
// Kiểm:
//   1. href/src/srcset/og:image NỘI BỘ trỏ tới file có thật trong dist.
//   2. Mọi <loc> trong sitemap.xml có file; mọi trang nội dung trong dist có trong sitemap.
//   3. <link rel="canonical"> khớp URL trang (tuyệt đối, không dấu "/" cuối trừ gốc).
//   4. rss.xml là XML hợp lệ; mỗi <item> có <link> nội bộ tồn tại.
//   5. JSON-LD parse được; trang bài (/posts/...) phải có ít nhất một khối.
//   6. Khi site URL là HTTPS: không còn `localhost` / `http://` trong dist (trừ namespace XML).
// Link ngoài KHÔNG được kiểm (dễ flaky) — chỉ liệt kê vào báo cáo.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Trang có trong dist nhưng KHÔNG thuộc sitemap theo chính sách (xem src/pages/sitemap.xml.ts).
const NOT_IN_SITEMAP = [/^\/404$/, /^\/search$/, /(^|\/)page\/\d+$/];
// Namespace XML hợp lệ chứa "http://".
const HTTP_ALLOWED = /http:\/\/(www\.w3\.org|www\.sitemaps\.org|purl\.org|www\.rssboard\.org)\b/g;
const TEXT_EXT = /\.(html|xml|txt|json|webmanifest)$/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** /posts/x/index.html → /posts/x ; /index.html → / ; /404.html → /404 */
export function filePathToUrlPath(rel) {
  const p = `/${rel.split(sep).join('/')}`;
  if (p === '/index.html') return '/';
  if (p.endsWith('/index.html')) return p.slice(0, -'/index.html'.length);
  return p.replace(/\.html$/, '');
}

function attrValues(html) {
  const urls = [];
  const re = /\b(href|src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (const m of html.matchAll(re)) {
    const name = m[1].toLowerCase();
    const val = (m[2] ?? m[3] ?? m[4] ?? '').trim().replaceAll('&amp;', '&');
    if (name === 'srcset') {
      for (const part of val.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) urls.push(u);
      }
    } else if (val) urls.push(val);
  }
  const meta = /<meta\b[^>]*(?:og:image|twitter:image)[^>]*>/gi;
  for (const m of html.matchAll(meta)) {
    const c = m[0].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (c) urls.push(c[1] ?? c[2]);
  }
  return urls;
}

/** Kiểm tra tính hợp lệ (well-formed) của XML bằng ngăn xếp thẻ; trả về chuỗi lỗi hoặc null. */
export function xmlError(xml) {
  const stack = [];
  const tok = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/?([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let last = 0;
  let sawRoot = false;
  for (const m of xml.matchAll(tok)) {
    const gap = xml.slice(last, m.index);
    if (/<|>/.test(gap.replace(/&[^;\s]+;/g, ''))) return `ký tự "<" hoặc ">" lạc tại vị trí ${last}`;
    if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(gap)) return `thực thể "&" không hợp lệ gần vị trí ${last}`;
    if (stack.length === 0 && gap.trim() && sawRoot) return 'văn bản ngoài phần tử gốc';
    last = m.index + m[0].length;
    if (!m[1]) continue;
    if (m[0].startsWith('</')) {
      const top = stack.pop();
      if (top !== m[1]) return `thẻ đóng </${m[1]}> không khớp (đang mở <${top ?? 'không có'}>)`;
    } else if (m[3] !== '/') {
      if (stack.length === 0) {
        if (sawRoot) return 'nhiều phần tử gốc';
        sawRoot = true;
      }
      stack.push(m[1]);
    } else if (stack.length === 0) {
      if (sawRoot) return 'nhiều phần tử gốc';
      sawRoot = true;
    }
  }
  if (/<|>/.test(xml.slice(last))) return 'thẻ chưa hoàn chỉnh ở cuối tài liệu';
  if (stack.length) return `thẻ <${stack.at(-1)}> không được đóng`;
  if (!sawRoot) return 'không có phần tử gốc';
  return null;
}

export function checkSite(distDir, { siteUrl } = {}) {
  const errors = [];
  const externals = new Map(); // url → số lần gặp
  const files = walk(distDir);
  const rel = (f) => relative(distDir, f);
  const fileSet = new Set(files.map((f) => `/${rel(f).split(sep).join('/')}`));

  const robots = fileSet.has('/robots.txt')
    ? readFileSync(join(distDir, 'robots.txt'), 'utf8')
    : '';
  const site =
    siteUrl ??
    robots.match(/^Sitemap:\s*(\S+)\/sitemap\.xml/im)?.[1] ??
    errors.push('Không xác định được site URL (truyền --site-url hoặc cần robots.txt).');
  const origin = typeof site === 'string' ? new URL(site).origin : null;
  const base = typeof site === 'string' ? site.replace(/\/$/, '') : '';

  /** URL nội bộ → đường dẫn trong dist tồn tại? */
  const resolves = (urlPath) => {
    const p = decodeURIComponent(urlPath);
    if (fileSet.has(p) && !p.endsWith('/')) return true;
    const dir = p.replace(/\/$/, '');
    return fileSet.has(`${dir}/index.html`) || fileSet.has(`${dir}.html`);
  };

  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const pageUrls = new Map(); // urlPath → file

  for (const f of htmlFiles) {
    const html = readFileSync(f, 'utf8');
    const urlPath = filePathToUrlPath(rel(f));
    pageUrls.set(urlPath, f);
    const where = `/${rel(f).split(sep).join('/')}`;

    // 1. Link/asset nội bộ
    for (const raw of attrValues(html)) {
      if (/^(mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
      let u;
      try {
        u = new URL(raw, `${origin ?? 'http://invalid.test'}${urlPath === '/' ? '/' : `${urlPath}/`}`);
      } catch {
        errors.push(`${where}: URL không hợp lệ "${raw}"`);
        continue;
      }
      if (!/^https?:$/.test(u.protocol)) continue;
      if (origin && u.origin !== origin) {
        externals.set(u.href, (externals.get(u.href) ?? 0) + 1);
        continue;
      }
      if (!resolves(u.pathname)) errors.push(`${where}: link nội bộ hỏng → ${raw}`);
    }

    // 3. Canonical
    if (/^\/404$/.test(urlPath)) {
      // 404.html được phục vụ ở mọi URL lỗi nên canonical không có nghĩa — bỏ qua.
    } else {
      const m = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i);
      const href = m?.[0].match(/\bhref=["']([^"']*)["']/i)?.[1];
      if (!href) errors.push(`${where}: thiếu <link rel="canonical">`);
      else if (base && href !== `${base}${urlPath === '/' ? '/' : urlPath}`) {
        errors.push(`${where}: canonical "${href}" ≠ "${base}${urlPath === '/' ? '/' : urlPath}"`);
      }
    }

    // 5. JSON-LD
    let blocks = 0;
    for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      blocks++;
      try {
        const data = JSON.parse(m[1]);
        if (!data['@context'] || !data['@type']) errors.push(`${where}: JSON-LD thiếu @context/@type`);
      } catch (e) {
        errors.push(`${where}: JSON-LD không phải JSON hợp lệ (${e.message})`);
      }
    }
    if (blocks === 0 && /^\/posts\/[^/]+$/.test(urlPath)) errors.push(`${where}: trang bài thiếu JSON-LD`);
  }

  // 2. Sitemap ⇄ dist
  if (!fileSet.has('/sitemap.xml')) errors.push('Thiếu sitemap.xml');
  else {
    const xml = readFileSync(join(distDir, 'sitemap.xml'), 'utf8');
    const bad = xmlError(xml);
    if (bad) errors.push(`sitemap.xml không phải XML hợp lệ: ${bad}`);
    const inSitemap = new Set();
    for (const m of xml.matchAll(/<loc>([^<]*)<\/loc>/g)) {
      const loc = m[1].replaceAll('&amp;', '&');
      let u;
      try {
        u = new URL(loc);
      } catch {
        errors.push(`sitemap.xml: <loc> không hợp lệ "${loc}"`);
        continue;
      }
      if (origin && u.origin !== origin) errors.push(`sitemap.xml: <loc> sai origin "${loc}"`);
      const p = u.pathname.length > 1 ? u.pathname.replace(/\/$/, '') : u.pathname;
      inSitemap.add(p);
      if (!pageUrls.has(p)) errors.push(`sitemap.xml: ${loc} không có trang tương ứng trong dist`);
    }
    for (const p of pageUrls.keys()) {
      if (NOT_IN_SITEMAP.some((re) => re.test(p))) continue;
      if (!inSitemap.has(p)) errors.push(`${p}: có trong dist nhưng thiếu trong sitemap.xml`);
    }
  }

  // 4. RSS
  if (!fileSet.has('/rss.xml')) errors.push('Thiếu rss.xml');
  else {
    const xml = readFileSync(join(distDir, 'rss.xml'), 'utf8');
    const bad = xmlError(xml);
    if (bad) errors.push(`rss.xml không phải XML hợp lệ: ${bad}`);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    for (const [i, it] of items.entries()) {
      const link = it[1].match(/<link>\s*([^<\s]+)\s*<\/link>/)?.[1];
      if (!link) {
        errors.push(`rss.xml: mục #${i + 1} thiếu <link>`);
        continue;
      }
      const u = new URL(link);
      if (origin && u.origin !== origin) errors.push(`rss.xml: mục #${i + 1} sai origin "${link}"`);
      else if (!resolves(u.pathname)) errors.push(`rss.xml: mục #${i + 1} trỏ tới trang không có → ${link}`);
    }
  }

  // 6. Cấu hình: localhost / http:// khi site là HTTPS
  if (typeof site === 'string' && site.startsWith('https://')) {
    for (const f of files.filter((x) => TEXT_EXT.test(x))) {
      const text = readFileSync(f, 'utf8').replace(HTTP_ALLOWED, '');
      const hits = new Set(text.match(/localhost|127\.0\.0\.1|http:\/\/[^\s"'<>)]+/gi) ?? []);
      for (const h of hits) errors.push(`/${rel(f).split(sep).join('/')}: chứa "${h}" dù site là HTTPS`);
    }
  }

  return { errors, externals, pages: pageUrls.size };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const dist = args.find((a) => !a.startsWith('--')) ?? 'apps/web/dist';
  if (!existsSync(dist)) {
    console.error(`Không thấy thư mục dist: ${dist}`);
    process.exit(2);
  }
  const { errors, externals, pages } = checkSite(dist, {
    siteUrl: opt('site-url') ?? process.env.PUBLIC_SITE_URL,
  });
  const lines = [`Đã quét ${pages} trang HTML trong ${dist}.`];
  lines.push(`Link ngoài (không kiểm): ${externals.size}`);
  for (const [u, n] of [...externals].sort()) lines.push(`  ${u}${n > 1 ? ` ×${n}` : ''}`);
  const report = opt('report');
  if (report) writeFileSync(report, `${lines.join('\n')}\n`);
  for (const l of lines.slice(0, 2)) console.log(l);
  if (errors.length) {
    console.error(`\n${errors.length} lỗi:`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log('OK — không có lỗi.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
