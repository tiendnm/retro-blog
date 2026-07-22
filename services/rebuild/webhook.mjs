// ── Webhook receiver tối giản (Sprint 6 Phase 3 — ADR-0008) ────────────────
// KHÔNG phải microservice: ~50 dòng glue. Nhận Directus Flow webhook, kiểm
// token, chạy services/rebuild/rebuild.sh (build + atomic swap). Debounce:
// gộp các webhook tới trong lúc đang build thành 1 lần chạy lại.
// Chạy TRÊN HOST:  REBUILD_TOKEN=... node services/rebuild/webhook.mjs
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKEN = process.env.REBUILD_TOKEN;
const PORT = Number(process.env.REBUILD_PORT || 9000);
if (!TOKEN) {
  console.error('❌ REBUILD_TOKEN chưa đặt');
  process.exit(1);
}

const REBUILD = join(dirname(fileURLToPath(import.meta.url)), 'rebuild.sh');
let running = false;
let pending = false;

function trigger() {
  if (running) {
    pending = true; // debounce: gộp các sự kiện tới khi đang build
    return;
  }
  running = true;
  console.log(`[webhook] ${new Date().toISOString()} → rebuild`);
  const p = spawn('sh', [REBUILD], { stdio: 'inherit' });
  p.on('exit', (code) => {
    console.log(`[webhook] rebuild kết thúc (code ${code})`);
    running = false;
    if (pending) {
      pending = false;
      trigger(); // chạy lại nếu có webhook đến trong lúc build
    }
  });
}

createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const token = u.searchParams.get('token') || req.headers['x-rebuild-token'];
  if (req.method === 'POST' && u.pathname === '/rebuild' && token === TOKEN) {
    res.writeHead(202).end('accepted');
    trigger();
  } else {
    res.writeHead(token && token !== TOKEN ? 403 : 404).end();
  }
}).listen(PORT, () => console.log(`[webhook] receiver lắng nghe :${PORT} (POST /rebuild)`));
