#!/usr/bin/env node
// Server tĩnh cho dist/ khi chạy E2E / axe / Lighthouse — Node thuần, KHÔNG cần Directus.
//   node serve.mjs <dist> <port> [--asset-origin=https://cms.example.test]
// - URL → file: đúng tên, <dir>/index.html, <tên>.html; không thấy → 404.html với mã 404.
// - Dist build ra tham chiếu ảnh tới PUBLIC_DIRECTUS_URL (không tới được khi chạy offline). Với
//   --asset-origin, server ghi đè "<origin>/assets/" → "/assets/" trong HTML và trả ảnh PNG sinh sẵn
//   (1600×1200, 4:3: cao hơn khung xem lightbox ở desktop → tái hiện lỗi cắt đáy f754767 nếu CSS hỏng) cho mọi /assets/<uuid>.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { deflateSync, crc32 } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};
// CSP giống Caddyfile (site_headers) để E2E bắt vi phạm CSP; img-src không cần CMS vì ảnh đã về cùng nguồn.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const ASSET_RE = /^\/assets\/[0-9a-f-]{36}$/i;

function png(width, height) {
  const row = Buffer.alloc(1 + width * 3);
  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    const o = y * row.length;
    for (let x = 0; x < width; x++) {
      const band = Math.floor(x / 100) % 2; // sọc dọc để nhìn thấy khi cắt/méo ảnh
      raw[o + 1 + x * 3] = band ? 190 : 150;
      raw[o + 2 + x * 3] = 170 + Math.floor((y / height) * 60);
      raw[o + 3 + x * 3] = band ? 140 : 120;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function createStaticServer(distDir, { assetOrigin } = {}) {
  const root = resolve(distDir);
  const image = png(1600, 1200);
  const fileFor = (pathname) => {
    const p = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
    const abs = resolve(root, p);
    if (abs !== root && !abs.startsWith(root + sep)) return null; // chặn ../
    for (const c of [abs, join(abs, 'index.html'), `${abs}.html`]) {
      if (existsSync(c) && statSync(c).isFile()) return c;
    }
    return null;
  };

  return createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    if (assetOrigin && ASSET_RE.test(pathname)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
      return res.end(image);
    }
    let file = null;
    try {
      file = fileFor(pathname);
    } catch {
      /* URL hỏng → coi như không tìm thấy */
    }
    const status = file ? 200 : 404;
    file ??= join(root, '404.html');
    if (!existsSync(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    let body = readFileSync(file);
    if (assetOrigin && type.startsWith('text/html')) {
      body = Buffer.from(body.toString('utf8').replaceAll(`${assetOrigin}/assets/`, '/assets/'));
    }
    res.writeHead(status, { 'Content-Type': type, 'Content-Security-Policy': CSP });
    res.end(body);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const args = process.argv.slice(2);
  const pos = args.filter((a) => !a.startsWith('--'));
  const assetOrigin = args.find((a) => a.startsWith('--asset-origin='))?.slice(15);
  const dist = pos[0] ?? '../apps/web/dist';
  const port = Number(pos[1] ?? 4321);
  if (!existsSync(dist)) {
    console.error(`Không thấy dist: ${dist}`);
    process.exit(2);
  }
  createStaticServer(dist, { assetOrigin }).listen(port, '127.0.0.1', () =>
    console.log(`Serving ${resolve(dist)} on http://127.0.0.1:${port}`),
  );
}
