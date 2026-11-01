// Lighthouse CI (preset mobile = mặc định của Lighthouse) trên dist/ phục vụ bởi serve.mjs — Sprint 11 §C.
// Trang mẫu lấy từ sitemap.xml của dist (mỗi loại một mẫu) nên không bám slug của seed. 404 không đo.
// Biến: DIST (../apps/web/dist), ASSET_ORIGIN (PUBLIC_DIRECTUS_URL lúc build), LH_PORT, LH_RUNS.
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.resolve(process.env.DIST ?? '../apps/web/dist');
const ASSET_ORIGIN = process.env.ASSET_ORIGIN ?? 'https://cms.example.test';
const PORT = Number(process.env.LH_PORT ?? 4322);
const RUNS = Number(process.env.LH_RUNS ?? 1);

function samples() {
  const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const first = (re) => paths.find((p) => re.test(p));
  const posts = paths.filter((p) => p.startsWith('/posts/'));
  const hasImg = (p) => /class="prose"[\s\S]*<img/.test(fs.readFileSync(path.join(DIST, p, 'index.html'), 'utf8'));
  const rich = posts.find(hasImg);
  return [
    '/',
    posts[0],
    rich,
    first(/^\/category\/[^/]+$/),
    first(/^\/tag\/[^/]+$/),
    first(/^\/author\/[^/]+$/),
    '/archive',
    first(/^\/archive\/\d{4}\/\d{2}$/),
    '/categories',
    '/search',
  ].filter((p, i, a) => p && a.indexOf(p) === i);
}

module.exports = {
  ci: {
    collect: {
      url: samples().map((p) => `http://127.0.0.1:${PORT}${p}`),
      numberOfRuns: RUNS,
      startServerCommand: `node serve.mjs ${DIST} ${PORT} --asset-origin=${ASSET_ORIGIN}`,
      startServerReadyPattern: 'Serving',
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        // Ghi nhận trên máy dev lẫn CI cùng một cấu hình mô phỏng (mặc định mobile + Slow 4G).
      },
    },
    assert: {
      // Mức `warn` trong Sprint 11; chuyển `error` (bắt buộc) ở Sprint 13 sau khi ổn định.
      // Ngân sách = baseline (docs/sprints/sprint-11.md «Kết quả») trừ biên an toàn.
      // Tổng byte KHÔNG đặt ngân sách: ảnh trong dist chạy offline là ảnh giả 26 KB/ảnh, không đại diện.
      assertMatrix: [
        {
          // /search có <meta robots=noindex> chủ đích → SEO 0,66 là đúng, không đưa vào ngân sách SEO.
          matchingUrlPattern: '^(?!.*/search$).*',
          assertions: {
            'categories:performance': ['warn', { minScore: 0.9 }], // baseline thấp nhất 0,96
            'categories:accessibility': ['warn', { minScore: 0.95 }], // baseline 1,00
            'categories:seo': ['warn', { minScore: 0.95 }], // baseline 1,00
            'categories:best-practices': ['warn', { minScore: 0.9 }], // baseline 0,96 (trừ điểm: /favicon.ico 404)
            'resource-summary:script:size': ['warn', { maxNumericValue: 20480 }], // baseline lớn nhất 5,5 KB
          },
        },
        {
          matchingUrlPattern: '.*/search$',
          assertions: {
            'categories:performance': ['warn', { minScore: 0.9 }],
            'categories:accessibility': ['warn', { minScore: 0.95 }],
            'categories:best-practices': ['warn', { minScore: 0.9 }],
            'resource-summary:script:size': ['warn', { maxNumericValue: 20480 }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
