#!/usr/bin/env node
// Tóm tắt báo cáo Lighthouse CI (.lighthouseci/lhr-*.json) thành bảng Markdown: trung vị mỗi trang.
//   node lh-summary.mjs [thư-mục-báo-cáo]   (CI: ghi tiếp vào $GITHUB_STEP_SUMMARY)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? '.lighthouseci';
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];

const byUrl = new Map();
for (const f of readdirSync(dir).filter((n) => /^lhr-.*\.json$/.test(n))) {
  const lhr = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const path = new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname;
  const sum = lhr.audits['resource-summary']?.details?.items ?? [];
  const size = (t) => sum.find((i) => i.resourceType === t)?.transferSize ?? 0;
  const row = {
    perf: lhr.categories.performance.score,
    a11y: lhr.categories.accessibility.score,
    seo: lhr.categories.seo.score,
    bp: lhr.categories['best-practices'].score,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    js: size('script'),
    total: size('total'),
  };
  byUrl.set(path, [...(byUrl.get(path) ?? []), row]);
}

const kb = (b) => `${(b / 1024).toFixed(1)}`;
const out = [
  `| Trang | Perf | A11y | SEO | BP | LCP (s) | TBT (ms) | CLS | JS (KB) | Tổng (KB) | Lượt |`,
  '|---|---|---|---|---|---|---|---|---|---|---|',
];
for (const [path, rows] of [...byUrl].sort()) {
  const m = (k) => median(rows.map((r) => r[k]));
  out.push(
    `| \`${path}\` | ${m('perf').toFixed(2)} | ${m('a11y').toFixed(2)} | ${m('seo').toFixed(2)} | ${m('bp').toFixed(2)} | ${(m('lcp') / 1000).toFixed(1)} | ${Math.round(m('tbt'))} | ${m('cls').toFixed(3)} | ${kb(m('js'))} | ${kb(m('total'))} | ${rows.length} |`,
  );
}
console.log(out.join('\n'));
