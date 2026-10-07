// ── Webhook receiver tối giản (Sprint 6 Phase 3 — ADR-0008; siết ở Sprint 8) ─
// KHÔNG phải microservice: glue nhỏ. Nhận Directus Flow webhook, kiểm token, chạy
// services/rebuild/rebuild.sh (build + atomic swap). Debounce: gộp các webhook tới
// trong lúc đang build thành 1 lần chạy lại.
// Chạy TRÊN HOST:  REBUILD_TOKEN=... node services/rebuild/webhook.mjs
//   (chạy dài hạn bằng systemd: services/ops/systemd/retro-rebuild-webhook.service)
//
// Bảo mật:
//  - Token CHỈ qua header `x-rebuild-token` (không query string — URL hay lọt vào log/proxy).
//  - So sánh hằng-thời-gian (timingSafeEqual trên SHA-256 của 2 vế).
//  - Mọi yêu cầu sai (token/method/path) trả CÙNG 404 → không lộ endpoint tồn tại.
//  - Giới hạn thử sai: quá MAX_FAILS lần/phút từ một IP → 429 (làm chậm dò token).
//  - Mặc định chỉ lắng nghe 127.0.0.1 (REBUILD_HOST). Docker Desktop tới được loopback host;
//    trên Linux container tới host qua docker0 → đặt REBUILD_HOST=<IP docker0> (vd 172.17.0.1)
//    và CHẶN cổng này ở firewall từ ngoài.
import { spawn } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = (s) => createHash('sha256').update(String(s)).digest();

export function tokenMatches(given, expected) {
  if (!given || !expected) return false;
  return timingSafeEqual(sha256(given), sha256(expected));
}

/**
 * Tạo request handler. Tách khỏi server để test được.
 * @param {{token: string, onTrigger: () => void, maxFails?: number, windowMs?: number, now?: () => number}} opts
 */
export function createHandler({
  token,
  onTrigger,
  maxFails = 10,
  windowMs = 60_000,
  now = Date.now,
}) {
  const fails = new Map(); // ip -> timestamps lần sai trong cửa sổ

  const failCount = (ip) => {
    const t = now();
    const list = (fails.get(ip) ?? []).filter((x) => t - x < windowMs);
    fails.set(ip, list);
    return list.length;
  };

  return (req, res) => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    if (failCount(ip) >= maxFails) {
      res.writeHead(429, { 'Retry-After': String(Math.ceil(windowMs / 1000)) }).end();
      return;
    }
    const ok =
      req.method === 'POST' &&
      new URL(req.url, 'http://x').pathname === '/rebuild' &&
      tokenMatches(req.headers['x-rebuild-token'], token);
    if (!ok) {
      fails.get(ip).push(now());
      res.writeHead(404).end();
      return;
    }
    res.writeHead(202).end('accepted');
    onTrigger();
  };
}

/** Trigger với debounce: đang build thì gộp các sự kiện tới thành 1 lần chạy lại. */
export function createTrigger(run) {
  let running = false;
  let pending = false;
  const trigger = () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    run((code) => {
      console.log(`[webhook] rebuild kết thúc (code ${code})`);
      running = false;
      if (pending) {
        pending = false;
        trigger();
      }
    });
  };
  return trigger;
}

// ── main (chỉ chạy khi gọi trực tiếp, không chạy khi import trong test) ──
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const TOKEN = process.env.REBUILD_TOKEN;
  const PORT = Number(process.env.REBUILD_PORT || 9000);
  const HOST = process.env.REBUILD_HOST || '127.0.0.1';
  if (!TOKEN || TOKEN.length < 32) {
    console.error('❌ REBUILD_TOKEN chưa đặt hoặc quá ngắn (>= 32 ký tự; openssl rand -hex 32)');
    process.exit(1);
  }
  const REBUILD = join(dirname(fileURLToPath(import.meta.url)), 'rebuild.sh');
  const trigger = createTrigger((done) => {
    console.log(`[webhook] ${new Date().toISOString()} → rebuild`);
    spawn('sh', [REBUILD], { stdio: 'inherit' }).on('exit', done);
  });
  createServer(createHandler({ token: TOKEN, onTrigger: trigger })).listen(PORT, HOST, () =>
    console.log(`[webhook] receiver lắng nghe ${HOST}:${PORT} (POST /rebuild)`),
  );
}
