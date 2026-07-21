// Bộ EDGE — ca biên soi UI. Author/Category RIÊNG (slug tách biệt) → load/reset độc lập.
// Nội dung CỐ ĐỊNH (deterministic, không rng). Layer độc lập Directus.
import { pad2 } from '../model.mjs';

export const AUTHOR = { key: 'edge-author', name: 'Ban Kiểm Thử Biên', slug: 'edge-author', bio: 'Tài khoản fixture cho các ca biên (edge cases).' };
export const CATEGORY = { key: 'edge-cat', name: 'Ca Biên', slug: 'edge-cat', description: 'Nhóm bài kiểm thử ca biên giao diện.' };

const BASE_MS = Date.parse('2026-05-01T09:00:00Z');
const DAY = 86400000;
const svg = (label) =>
  'data:image/svg+xml;base64,' +
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160"><rect width="100%" height="100%" fill="#efe8d6"/><text x="50%" y="50%" fill="#7b2d26" font-family="monospace" font-size="18" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`, 'utf8').toString('base64');

// Định nghĩa từng ca: { id, title, slug, excerpt, categoryKey, edgeType, body }
const LONG_WORD = 'phầncứngmáytínhcổđiểnsiêucấpvôcùngdàikhôngcókhoảngtrắngđểkiểmthửngắtdòngvàtrànngang'.repeat(2);
const CASES = [
  {
    id: 'long-title', edgeType: 'title rất dài',
    title: 'Bài viết có tiêu đề cực kỳ dài để kiểm thử khả năng ngắt dòng của thẻ tiêu đề trên cả card danh sách lẫn trang chi tiết khi văn bản vượt quá nhiều dòng liên tục mà không xuống hàng tự nhiên',
    body: 'Thân bài ngắn. Trọng tâm ca này là **tiêu đề rất dài** (xem tiêu đề phía trên) để kiểm tra wrap ở card và heading detail.',
  },
  {
    id: 'no-category', edgeType: 'không category', categoryKey: null,
    title: 'Bài không thuộc chuyên mục nào',
    body: 'Bài này **không gán category** (M2O null) — kiểm tra meta ở detail và card không hiển thị chuyên mục, không vỡ.',
  },
  {
    id: 'deep-nested-list', edgeType: 'nested list sâu',
    title: 'Danh sách lồng nhau rất sâu',
    body: 'Kiểm thử danh sách lồng nhiều cấp:\n\n- Cấp 1\n  - Cấp 2\n    - Cấp 3\n      - Cấp 4\n        - Cấp 5\n          - Cấp 6\n- Mục cấp 1 khác',
  },
  {
    id: 'many-headings', edgeType: 'nhiều heading',
    title: 'Bài có rất nhiều heading',
    body: Array.from({ length: 14 }, (_, i) => `## Mục ${i + 1}\n\nĐoạn ngắn cho mục ${i + 1}.`).join('\n\n'),
  },
  {
    id: 'long-slug-nay-la-mot-duong-dan-rat-dai-de-kiem-thu-hien-thi-va-tran-ngang-tren-thanh-dia-chi-va-trong-cac-lien-ket', edgeType: 'slug dài',
    title: 'Bài có slug rất dài',
    body: 'Slug của bài này **rất dài** — kiểm tra URL và hiển thị link không vỡ.',
  },
  {
    id: 'empty-excerpt', edgeType: 'excerpt rỗng', excerpt: '',
    title: 'Bài không có tóm tắt',
    body: 'Bài này **excerpt rỗng** — card và meta description không được vỡ khi thiếu tóm tắt.',
  },
  {
    id: 'unicode', edgeType: 'unicode nặng',
    title: 'Ký tự đặc biệt 🖥️ 日本語 Ω≈ç√∫ 中文 ①②③',
    body: 'Nội dung nhiều unicode: emoji 🕹️💾📼, chữ Nhật 日本語, Trung 中文, ký hiệu ∑∏∆√≈≠, mũi tên ←↑→↓. Kiểm tra encoding & render.',
  },
  {
    id: 'long-word', edgeType: 'một-từ-siêu-dài',
    title: 'Bài có một từ siêu dài',
    body: `Một từ không khoảng trắng rất dài để kiểm tra ngắt dòng/tràn ngang:\n\n${LONG_WORD}\n\nĐoạn sau để đối chiếu.`,
  },
  {
    id: 'image-only', edgeType: 'đoạn chỉ ảnh',
    title: 'Bài chỉ có ảnh',
    body: `![Sơ đồ kiểm thử ảnh đơn](${svg('IMAGE ONLY')})`,
  },
  {
    id: 'many-links', edgeType: 'nhiều link',
    title: 'Bài có rất nhiều liên kết',
    body: 'Nhiều link để kiểm mật độ link trong prose:\n\n' + Array.from({ length: 18 }, (_, i) => `[liên kết ${i + 1}](https://example.com/${i + 1})`).join(' · '),
  },
];

/** @returns {{author, category, posts, bodies}} */
export function build() {
  const posts = [];
  const bodies = {};
  CASES.forEach((c, i) => {
    const slug = `edge-${c.id}`;
    const key = `edge-${pad2(i + 1)}`;
    bodies[slug] = c.body + '\n';
    posts.push({
      key, slug, title: c.title,
      excerpt: c.excerpt === undefined ? `Ca biên: ${c.edgeType}.` : c.excerpt,
      bodyPath: `body/${slug}.md`,
      authorKey: AUTHOR.key,
      categoryKey: c.categoryKey === undefined ? CATEGORY.key : c.categoryKey,
      coverKey: null,
      status: 'published',
      publishedAt: new Date(BASE_MS - i * 2 * DAY).toISOString(),
      set: 'edge', edgeType: c.edgeType,
    });
  });
  return { author: AUTHOR, category: CATEGORY, posts, bodies };
}
