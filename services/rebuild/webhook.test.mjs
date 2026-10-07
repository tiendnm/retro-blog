// Test receiver webhook — chạy: node --test services/rebuild/
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createHandler, createTrigger, tokenMatches } from './webhook.mjs';

const TOKEN = 'a'.repeat(40);

/** Dựng server thật trên cổng ngẫu nhiên; trả hàm gọi + số lần trigger. */
async function start(opts = {}) {
  let triggers = 0;
  const server = createServer(createHandler({ token: TOKEN, onTrigger: () => triggers++, ...opts }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.unref(); // test lỗi không làm treo tiến trình
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    call: (path, init) => fetch(base + path, init),
    triggers: () => triggers,
    close: () => new Promise((r) => server.close(r)),
  };
}

test('token đúng qua header → 202 và trigger', async () => {
  const s = await start();
  const res = await s.call('/rebuild', { method: 'POST', headers: { 'x-rebuild-token': TOKEN } });
  assert.equal(res.status, 202);
  assert.equal(s.triggers(), 1);
  await s.close();
});

test('token trong query string KHÔNG được chấp nhận', async () => {
  const s = await start();
  const res = await s.call(`/rebuild?token=${TOKEN}`, { method: 'POST' });
  assert.equal(res.status, 404);
  assert.equal(s.triggers(), 0);
  await s.close();
});

test('sai token / thiếu token / sai method / sai path → cùng 404, không trigger', async () => {
  const s = await start();
  const bad = [
    s.call('/rebuild', { method: 'POST', headers: { 'x-rebuild-token': 'x'.repeat(40) } }),
    s.call('/rebuild', { method: 'POST' }),
    s.call('/rebuild', { method: 'GET', headers: { 'x-rebuild-token': TOKEN } }),
    s.call('/other', { method: 'POST', headers: { 'x-rebuild-token': TOKEN } }),
  ];
  for (const r of await Promise.all(bad)) assert.equal((await r).status, 404);
  assert.equal(s.triggers(), 0);
  await s.close();
});

test('thử sai quá ngưỡng → 429 (kể cả khi sau đó dùng token đúng); hết cửa sổ thì mở lại', async () => {
  let t = 0;
  const s = await start({ maxFails: 3, windowMs: 1000, now: () => t });
  for (let i = 0; i < 3; i++) await s.call('/rebuild', { method: 'POST' });
  const locked = await s.call('/rebuild', { method: 'POST', headers: { 'x-rebuild-token': TOKEN } });
  assert.equal(locked.status, 429);
  assert.equal(s.triggers(), 0);
  t = 5000; // qua cửa sổ
  const ok = await s.call('/rebuild', { method: 'POST', headers: { 'x-rebuild-token': TOKEN } });
  assert.equal(ok.status, 202);
  await s.close();
});

test('tokenMatches: khác độ dài / rỗng không ném lỗi', () => {
  assert.equal(tokenMatches('short', TOKEN), false);
  assert.equal(tokenMatches('', TOKEN), false);
  assert.equal(tokenMatches(undefined, TOKEN), false);
  assert.equal(tokenMatches(TOKEN, TOKEN), true);
});

test('createTrigger: webhook tới khi đang build được gộp thành đúng 1 lần chạy lại', () => {
  const finishers = [];
  const trigger = createTrigger((done) => finishers.push(done));
  trigger(); // bắt đầu build #1
  trigger(); // gộp
  trigger(); // gộp
  assert.equal(finishers.length, 1);
  finishers[0](0); // build #1 xong → chạy lại đúng 1 lần
  assert.equal(finishers.length, 2);
  finishers[1](0); // build #2 xong → không còn gì
  assert.equal(finishers.length, 2);
});
