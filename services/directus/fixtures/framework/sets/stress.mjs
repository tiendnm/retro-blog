// Bộ STRESS — ép tải/giới hạn render. Author/Category RIÊNG → load/reset độc lập.
// Nội dung CỐ ĐỊNH, deterministic (không rng, không đồng hồ thật). Layer độc lập Directus.
import { pad2 } from '../model.mjs';

export const AUTHOR = { key: 'stress-author', name: 'Ban Ép Tải', slug: 'stress-author', bio: 'Tài khoản fixture cho các ca ép tải (stress).' };
export const CATEGORY = { key: 'stress-cat', name: 'Ép Tải', slug: 'stress-cat', description: 'Nhóm bài kiểm thử giới hạn render/hiệu năng.' };

const BASE_MS = Date.parse('2026-04-01T09:00:00Z');
const DAY = 86400000;

const SENT = [
  'Cỗ máy cũ vận hành theo những ràng buộc mà ngày nay khó hình dung nổi.',
  'Từng byte bộ nhớ đều quý giá, buộc lập trình viên phải tối ưu đến cực hạn.',
  'Bus hệ thống chậm chạp nhưng ổn định qua nhiều năm sử dụng liên tục.',
  'Người dùng tự tay cấu hình jumper, cắm thẻ mở rộng và gỡ lỗi bằng đèn LED.',
  'Âm thanh beep từ loa nội bộ là tất cả những gì nhiều máy có thể phát ra.',
  'Ổ đĩa mềm quay rè rè mỗi khi nạp chương trình từ đĩa 5.25 inch.',
  'Màn hình phosphor xanh in đậm dấu ấn của một thời kỳ điện toán.',
];

function longMarkdown() {
  const parts = [];
  parts.push('Bài rất dài để ép tải render và cuộn dọc. Nội dung lặp có biến thể theo mục.');
  for (let s = 1; s <= 40; s++) {
    parts.push(`## Phần ${s}`);
    const para = [];
    for (let k = 0; k < 18; k++) para.push(SENT[(s + k) % SENT.length]);
    parts.push(para.join(' '));
  }
  return parts.join('\n\n');
}

function wideTable() {
  const cols = 15;
  const header = '| ' + Array.from({ length: cols }, (_, i) => `Cột ${i + 1}`).join(' | ') + ' |';
  const sep = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |';
  const rows = Array.from({ length: 6 }, (_, r) =>
    '| ' + Array.from({ length: cols }, (_, i) => `ô ${r + 1}.${i + 1}`).join(' | ') + ' |',
  );
  return ['Bảng rất rộng (cuộn ngang trong khung `.prose`):', '', header, sep, ...rows].join('\n');
}

function hugeCode() {
  const lines = Array.from({ length: 160 }, (_, i) =>
    `MOV AX, ${pad2(i % 100)}   ; dòng ${i + 1} — nạp giá trị và cộng dồn vào thanh ghi tích luỹ để ép chiều rộng`,
  );
  return ['Code block rất lớn (dài + dòng dài → cuộn ngang):', '', '```assembly', ...lines, '```'].join('\n');
}

const CASES = [
  { id: 'long-markdown', type: 'markdown rất dài', title: 'Bài markdown cực dài', body: longMarkdown() },
  { id: 'wide-table', type: 'bảng rất rộng', title: 'Bảng rất rộng', body: wideTable() },
  { id: 'huge-code', type: 'code block rất lớn', title: 'Code block rất lớn', body: hugeCode() },
];

export function build() {
  const posts = [];
  const bodies = {};
  CASES.forEach((c, i) => {
    const slug = `stress-${c.id}`;
    bodies[slug] = c.body + '\n';
    posts.push({
      key: `stress-${pad2(i + 1)}`, slug, title: c.title,
      excerpt: `Ép tải: ${c.type}.`, bodyPath: `body/${slug}.md`,
      authorKey: AUTHOR.key, categoryKey: CATEGORY.key, coverKey: null,
      status: 'published', publishedAt: new Date(BASE_MS - i * 2 * DAY).toISOString(),
      set: 'stress', edgeType: c.type,
    });
  });
  return { author: AUTHOR, category: CATEGORY, posts, bodies };
}
