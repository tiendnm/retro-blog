// ── Webhook receiver tối giản (Sprint 6 Phase 3 — ADR-0008; siết ở Sprint 8) ─
// KHÔNG phải microservice: glue nhỏ. Nhận Directus Flow webhook, kiểm token, chạy
// lệnh build (REBUILD_COMMAND). Debounce: gộp các webhook tới trong lúc đang build thành 1 lần chạy lại.
// Production (ADR-0016): chạy TRONG container `web` (xem services/rebuild/web-entrypoint.sh), mặc định
//   REBUILD_COMMAND="sh /rebuild/build-swap.sh", REBUILD_HOST=0.0.0.0 (chỉ mạng compose, KHÔNG publish cổng).
// Dev/thủ công trên host:  REBUILD_TOKEN=... node services/rebuild/webhook.mjs  (mặc định chạy rebuild.sh)
//
// Bảo mật:
//  - Token CHỈ qua header `x-rebuild-token` (không query string — URL hay lọt vào log/proxy).
//  - So sánh hằng-thời-gian (timingSafeEqual trên SHA-256 của 2 vế).
//  - Mọi yêu cầu sai (token/method/path) trả CÙNG 404 → không lộ endpoint tồn tại.
//  - Giới hạn thử sai: quá MAX_FAILS lần/phút từ một IP → 429 (làm chậm dò token).
//  - Mặc định chỉ lắng nghe 127.0.0.1 (REBUILD_HOST). Trong container production đặt 0.0.0.0 — an toàn vì
//    cổng KHÔNG được publish ra host và không route qua Caddy/tunnel (chỉ Directus trong mạng compose tới được).
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

/**
 * Chạy lệnh shell build; luôn gọi `done` đúng MỘT lần (kể cả khi không spawn được) để trigger không kẹt "running".
 * Build lỗi chỉ ghi log — receiver vẫn sống và giữ nguyên bản đang phục vụ (build-swap.sh thoát trước khi swap).
 */
export function runShell(command, done, spawnFn = spawn) {
  let finished = false;
  const finish = (code) => {
    if (finished) return;
    finished = true;
    done(code);
  };
  const child = spawnFn('sh', ['-c', command], { stdio: 'inherit' });
  child.on('error', (err) => {
    console.error(`[webhook] không chạy được lệnh build: ${err.message}`);
    finish(-1);
  });
  child.on('exit', (code) => finish(code ?? -1));
}

/** Lệnh build: REBUILD_COMMAND nếu đặt, ngược lại `sh <rebuildSh>` (hành vi cũ trên host). */
export function resolveCommand(env, rebuildSh) {
  const c = env.REBUILD_COMMAND?.trim();
  return c ? c : `sh "${rebuildSh}"`;
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
  const COMMAND = resolveCommand(process.env, REBUILD);
  const trigger = createTrigger((done) => {
    console.log(`[webhook] ${new Date().toISOString()} → rebuild (${COMMAND})`);
    runShell(COMMAND, done);
  });
  createServer(createHandler({ token: TOKEN, onTrigger: trigger })).listen(PORT, HOST, () =>
    console.log(`[webhook] receiver lắng nghe ${HOST}:${PORT} (POST /rebuild)`),
  );
}
