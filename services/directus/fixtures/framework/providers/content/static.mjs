// ContentProvider 'static' (mặc định) — nội dung GỐC, tiếng Việt, chủ đề retro
// computing, sinh DETERMINISTIC từ skeleton + rng (bank + template). KHÔNG Lorem,
// KHÔNG copy. Layer độc lập Directus. Là DEV fixture (không phải tri thức chính thống).
import { pick, pickSome, rint, chance } from '../../rng.mjs';

export const name = 'static';

// Chủ thể thật theo category (name + ghi chú ngắn). Dùng để dệt câu.
const SUBJECTS = {
  cpu: [
    { s: 'Intel 8086', y: 1978 }, { s: 'MOS 6502', y: 1975 }, { s: 'Zilog Z80', y: 1976 },
    { s: 'Motorola 68000', y: 1979 }, { s: 'Intel 80386', y: 1985 },
  ],
  mainboard: [
    { s: 'bo mạch IBM PC 5150', y: 1981 }, { s: 'chipset Intel 440BX', y: 1998 },
    { s: 'bus ISA', y: 1981 }, { s: 'khe cắm PCI', y: 1992 }, { s: 'jumper cấu hình', y: 1990 },
  ],
  gpu: [
    { s: 'card CGA', y: 1981 }, { s: 'card VGA', y: 1987 }, { s: 'chip Voodoo của 3dfx', y: 1996 },
    { s: 'card Hercules', y: 1982 }, { s: 'chuẩn EGA', y: 1984 },
  ],
  memory: [
    { s: 'thanh RAM 30-pin SIMM', y: 1987 }, { s: 'ROM BIOS', y: 1981 },
    { s: 'bộ nhớ mở rộng EMS', y: 1985 }, { s: 'DRAM động', y: 1970 }, { s: 'SRAM cache', y: 1990 },
  ],
  storage: [
    { s: 'đĩa mềm 5.25 inch', y: 1976 }, { s: 'ổ cứng MFM', y: 1980 },
    { s: 'băng từ lưu trữ', y: 1972 }, { s: 'đĩa mềm 3.5 inch', y: 1982 }, { s: 'chuẩn IDE', y: 1986 },
  ],
  'operating-system': [
    { s: 'MS-DOS', y: 1981 }, { s: 'CP/M', y: 1974 }, { s: 'AmigaOS', y: 1985 },
    { s: 'Windows 3.1', y: 1992 }, { s: 'Unix bản đầu', y: 1971 },
  ],
  software: [
    { s: 'bảng tính Lotus 1-2-3', y: 1983 }, { s: 'trình soạn thảo WordStar', y: 1978 },
    { s: 'Turbo Pascal', y: 1983 }, { s: 'trình thông dịch BASIC', y: 1975 }, { s: 'Norton Commander', y: 1986 },
  ],
  sound: [
    { s: 'card Sound Blaster', y: 1989 }, { s: 'chip AdLib OPL2', y: 1987 },
    { s: 'loa PC speaker', y: 1981 }, { s: 'chip SID của Commodore', y: 1982 }, { s: 'chuẩn MIDI', y: 1983 },
  ],
  peripheral: [
    { s: 'bàn phím cơ IBM Model M', y: 1985 }, { s: 'chuột bi', y: 1980 },
    { s: 'máy in kim', y: 1970 }, { s: 'cần điều khiển joystick', y: 1977 }, { s: 'màn hình CRT phosphor', y: 1975 },
  ],
  networking: [
    { s: 'modem quay số', y: 1980 }, { s: 'hệ thống BBS', y: 1978 }, { s: 'chuẩn RS-232', y: 1969 },
  ],
};
const GENERIC = [{ s: 'một cỗ máy cũ', y: 1985 }, { s: 'một món linh kiện', y: 1988 }];

const INTRO = [
  'Trong thế giới {c}, {s} là một cái tên khó quên với những ai từng gắn bó với máy tính thời kỳ đầu.',
  'Nhắc tới {c}, nhiều người sẽ nghĩ ngay tới {s} — thứ đã định hình cả một thế hệ.',
  'Bài viết này ghi lại đôi điều về {s}, một mảnh ghép thú vị trong lịch sử {c}.',
  'Có những món đồ tưởng đã lỗi thời, nhưng {s} vẫn khiến người chơi hoài cổ say mê khi bàn về {c}.',
];
const PARA = [
  'Ra mắt khoảng năm {y}, {s} phản ánh rõ những ràng buộc kỹ thuật của thời đại: tài nguyên eo hẹp buộc kỹ sư phải tối ưu từng chi tiết.',
  'Điều đáng nói ở {s} không nằm ở sức mạnh thô, mà ở cách nó được thiết kế để làm nhiều nhất với ít nhất.',
  'Người dùng ngày ấy quen với việc tự tay cấu hình, và {s} là một ví dụ điển hình cho tinh thần vọc vạch đó.',
  'Đặt cạnh phần cứng hiện đại, {s} khiêm tốn về thông số, nhưng lại giàu tính cách và câu chuyện.',
  'Sự bền bỉ của {s} khiến không ít máy còn chạy tốt sau hàng chục năm, một điều hiếm thấy ngày nay.',
];
const SECTIONS = ['Bối cảnh', 'Thiết kế', 'Trải nghiệm sử dụng', 'Di sản để lại', 'Ghi chú kỹ thuật', 'Góc hoài niệm'];
const LIST_INTRO = ['Vài điểm đáng chú ý:', 'Có thể tóm lại như sau:', 'Những đặc điểm nổi bật:'];
const QUOTE = [
  'Công nghệ cũ không hề chết — nó chỉ chờ đúng người kể lại câu chuyện của mình.',
  'Giới hạn của phần cứng xưa chính là cái nôi của sự sáng tạo.',
  'Mỗi tiếng ổ đĩa quay là một mảnh ký ức.',
];
const CODE = [
  'assembly\n; nạp giá trị vào thanh ghi\nMOV AX, 0x1234\nADD AX, BX\nINT 0x21',
  'basic\n10 PRINT "XIN CHAO RETRO"\n20 FOR I = 1 TO 3\n30 PRINT I\n40 NEXT I',
];

const fill = (tpl, o) => tpl.replaceAll('{c}', o.c).replaceAll('{s}', o.s).replaceAll('{y}', String(o.y));

// Ảnh minh hoạ trong BODY (không phải cover): SVG "sơ đồ" gốc, nhúng data-URI
// (không asset ngoài). Deterministic theo label. Phủ phần tử .prose img.
function retroSvg(label) {
  const safe = String(label).replace(/&/g, 'và').replace(/[<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180"><rect width="100%" height="100%" fill="#efe8d6"/><rect x="8" y="8" width="464" height="164" fill="none" stroke="#7b2d26" stroke-width="3" stroke-dasharray="8 6"/><text x="50%" y="50%" fill="#2b2b2b" font-family="monospace" font-size="20" text-anchor="middle" dominant-baseline="middle">${safe}</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}

function paragraphs(rng, ctx, n) {
  return pickSome(rng, PARA, n).map((t) => fill(t, ctx));
}

function nestedList(rng, ctx) {
  const items = [
    `- Chủ thể tiêu biểu: **${ctx.s}** (khoảng ${ctx.y}).`,
    '- Điểm mạnh:',
    '  - Thiết kế tối giản, dễ bảo trì.',
    '  - Tương thích ngược tốt trong hệ sinh thái.',
    '- Hạn chế: tài nguyên hạn hẹp so với ngày nay.',
  ];
  return [pick(rng, LIST_INTRO), '', items.join('\n')].join('\n');
}

function specTable(subjects) {
  const rows = subjects.slice(0, 3).map((x) => `| ${x.s} | ${x.y} |`).join('\n');
  return ['| Chủ thể | Năm ra mắt |', '| --- | --- |', rows].join('\n');
}

/** @param {import('../../model.mjs').FixturePost & {length:string}} sk */
export function produceBody(sk, rng, ctx) {
  const cat = ctx.categoryName ?? 'máy tính cổ';
  const subjects = SUBJECTS[sk.categoryKey] ?? GENERIC;
  const subj = pick(rng, subjects);
  const c = { c: cat, s: subj.s, y: subj.y };
  const nSection = sk.length === 'short' ? 1 : sk.length === 'medium' ? 2 : rint(rng, 3, 4);

  const out = [fill(pick(rng, INTRO), c)];
  for (let i = 0; i < nSection; i++) {
    out.push(`## ${pick(rng, SECTIONS)}`);
    out.push(...paragraphs(rng, c, sk.length === 'short' ? 1 : 2));
    if (chance(rng, 0.5)) out.push(nestedList(rng, c));
    if (chance(rng, 0.4)) out.push(`> ${pick(rng, QUOTE)}`);
    if (sk.length === 'long' && i === 0) {
      out.push('```' + pick(rng, CODE) + '\n```');
      out.push(specTable(subjects));
      out.push(`![Sơ đồ minh hoạ ${subj.s}](${retroSvg(subj.s)})`);
    }
  }
  out.push('---');
  out.push(fill(pick(rng, PARA), c));
  return out.join('\n\n');
}

export function produceExcerpt(sk, rng, ctx) {
  const subjects = SUBJECTS[sk.categoryKey] ?? GENERIC;
  const subj = pick(rng, subjects);
  const cat = ctx.categoryName ?? 'máy tính cổ';
  return fill(pick(rng, ['Đôi dòng về {s} — một lát cắt của {c}.', 'Ghi chép ngắn về {s} trong dòng chảy {c}.']), {
    c: cat, s: subj.s, y: subj.y,
  });
}
