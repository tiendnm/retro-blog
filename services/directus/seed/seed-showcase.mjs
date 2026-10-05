// ============================================================================
// Retro Blog — SEED SHOWCASE (DEV-only): nhiều bài viết về MÁY TÍNH CỔ + ẢNH thật.
// Bổ sung cho seed-dev (KHÔNG xoá dữ liệu seed-dev): chạy SAU `pnpm seed:dev`.
//   pnpm seed:showcase
// Có gì: 4 chuyên mục mới · 2 tác giả mới · avatar tác giả · 20 bài có ảnh bìa (1 bài cố ý
// KHÔNG có ảnh bìa để thấy thẻ text-only) · ảnh minh hoạ trong thân bài · ảnh bìa cho 3 bài seed-dev.
// Ảnh: services/directus/seed/images (Wikimedia Commons — xem CREDITS.md; build-images.py).
// Nội dung là DEMO tự soạn (kiến thức máy tính cổ), không phải bài blog thật. body soạn markdown
// → ghi HTML (ADR-0011). Idempotent theo slug / tiêu đề file `showcase-*`.
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { connect, assertDevOnly } from '../fixtures/loader/directus.mjs';
import { DEFAULT_BASE } from '../fixtures/loader/common.mjs';
import { mdToHtml } from '../lib/md-to-html.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const IMG = resolve(HERE, 'images');
const PUBLIC_URL = process.env.PUBLIC_DIRECTUS_URL ?? 'http://localhost:8055';
assertDevOnly(DEFAULT_BASE, process.argv.includes('--yes'));
const { api, uploadFile } = await connect(DEFAULT_BASE);

// ---- Ảnh: key → alt (a11y) ----
const PHOTOS = {
  apple2: 'Máy tính Apple II màu be với bàn phím tích hợp và logo Apple',
  'c64-setup': 'Bộ Commodore 64 với màn hình nhỏ, ổ băng cassette và ổ đĩa 1541 đặt trên bệ màu hồng',
  'c64-keys': 'Commodore 64 nhìn chéo: thân máy màu be liền bàn phím nâu',
  spectrum: 'Máy ZX Spectrum đen với bàn phím cao su, đặt cạnh màn hình và biển giới thiệu',
  'ibm-pc': 'IBM PC 5150 với màn hình đơn sắc, hai ổ đĩa mềm và bàn phím rời',
  mac128: 'Macintosh 128K màu kem với màn hình tích hợp, bàn phím và chuột',
  'floppy-disks': 'Hộp đĩa mềm 3,5 inch Verbatim cùng vài chiếc đĩa dán nhãn',
  'floppy-drives': 'Ba loại ổ đĩa mềm tháo vỏ: 8 inch, 5,25 inch và 3,5 inch',
  'floppy-525': 'Hai đĩa mềm 5,25 inch màu đen nhìn từ hai mặt',
  'crt-monitor': 'Bên trong màn hình CRT của Macintosh Plus: ống tia và bo mạch nguồn',
  'crt-tube': 'Ống tia âm cực (CRT) thủy tinh với màn hình phủ lưới kẻ ô',
  'model-m': 'Bàn phím IBM Model M màu xám nhạt đặt trên nền trắng',
  'smk-switch': 'Hai công tắc phím cơ cổ đã tháo rời cùng hai chiếc lò xo',
  gameboy: 'Máy chơi game Nintendo Game Boy nguyên bản với màn hình xanh lá',
  'punch-card': 'Thẻ đục lỗ màu xanh với các hàng lỗ chữ nhật',
  'punch-cards-stack': 'Xấp thẻ đục lỗ in mẫu hồng dùng để lập trình',
  altair: 'Máy Altair 8800 với bảng công tắc và đèn, đặt cạnh máy teletype ASR 33',
  motherboard: 'Cận cảnh bo mạch chủ xanh với con chip lớn và các tụ điện',
  'motherboard-2': 'Cận cảnh mạch in với chip vuông, thạch anh và hàng chân cắm',
  vt100: 'Thiết bị đầu cuối DEC VT100 hiển thị chữ xanh trên màn hình đen',
  'modem-atari800': 'Atari 800XL nối với modem, hai chiếc điện thoại quay số và ổ băng cassette',
  'acoustic-coupler': 'Thiết bị ghép âm (acoustic coupler) với hai núm cao su gắn vào ống nghe điện thoại',
  atari2600: 'Máy chơi game Atari 2600 vỏ giả gỗ cùng tay cầm joystick',
  amiga500: 'Máy Commodore Amiga 500 với bàn phím, chuột và màn hình hiển thị Workbench',
  hdd: 'Ổ cứng Atasi 3051 tháo nắp nhìn từ phía nhãn',
  'hdd-2': 'Ổ cứng Atasi 3051 nhìn từ phía mặt dưới với bo mạch điều khiển',
  ascii: 'Bảng tra mã ASCII gồm cột thập phân, thập lục phân và nhị phân',
  amstrad: 'Máy Amstrad CPC464 với màn hình xanh hiển thị chữ "Ready" của BASIC',
  nes: 'Máy chơi game Nintendo Entertainment System màu xám',
  'shop-window': 'Tủ kính trưng bày các máy tính cổ đời đầu',
  'amiga-board': 'Bo mạch chủ Amiga 500+ màu xanh lục bên trong vỏ nhựa',
  'retro-lab': 'Phòng máy retro với hàng bàn đặt màn hình CRT và những chiếc ghế xanh',
  'avatar-keyboard': 'Ảnh đại diện: công tắc bàn phím cơ cổ',
  'avatar-floppy': 'Ảnh đại diện: hộp đĩa mềm',
  'avatar-chip': 'Ảnh đại diện: con chip trên bo mạch',
};

// ---- Dữ liệu ----
const NEW_CATEGORIES = [
  { name: 'Lập trình', slug: 'lap-trinh', description: 'BASIC, mã máy và cách người xưa viết chương trình (demo).' },
  { name: 'Kiến thức', slug: 'kien-thuc', description: 'Nền tảng máy tính vẫn còn đúng đến hôm nay (demo).' },
  { name: 'Lịch sử', slug: 'lich-su', description: 'Những cỗ máy đã làm nên lịch sử (demo).' },
  { name: 'Retro gaming', slug: 'retro-gaming', description: 'Máy chơi game và trò chơi một thời (demo).' },
];
const NEW_AUTHORS = [
  { name: 'Lan Hương', slug: 'lan-huong', bio: 'Sưu tầm máy 8-bit, viết về phần mềm cổ và lập trình BASIC. (Tác giả demo)', avatar: 'avatar-floppy' },
  { name: 'Quốc Bảo', slug: 'quoc-bao', bio: 'Sửa phần cứng cũ, mê bàn phím cơ và màn hình CRT. (Tác giả demo)', avatar: 'avatar-keyboard' },
];
const BASE_AUTHOR = { slug: 'bien-tap-vien-demo', avatar: 'avatar-chip' };

// cover cho 3 bài của seed-dev
const EXISTING_COVERS = {
  'bat-dau-voi-retro-blog': 'shop-window',
  'tham-my-hoai-co': 'c64-keys',
  'vong-doi-mot-bai-viet': 'floppy-525',
};

// {{key}} trong body → ảnh minh hoạ (alt lấy từ PHOTOS)
const POSTS = [
  {
    title: 'Apple II: chiếc máy biến máy tính thành đồ gia dụng', slug: 'apple-ii-may-tinh-gia-dinh', cat: 'lich-su', author: 'lan-huong', cover: 'apple2', daysAgo: 1,
    excerpt: 'Ra mắt năm 1977, Apple II mang bàn phím, màn hình màu và BASIC tới phòng khách của người bình thường.',
    body: `## Một chiếc máy "đóng hộp" sẵn sàng dùng

Trước Apple II, phần lớn máy tính cá nhân là bộ kit để tự lắp. Apple II thì khác: cắm điện, nối màn hình là chạy. Máy dùng vi xử lý **MOS 6502** khoảng 1 MHz, có đồ họa màu và ngôn ngữ BASIC nằm sẵn trong ROM.

| Thông số | Giá trị |
|---|---|
| Năm ra mắt | 1977 |
| Vi xử lý | MOS 6502, ~1 MHz |
| Khe mở rộng | 8 khe |
| Ngôn ngữ có sẵn | BASIC (trong ROM) |

Điểm làm nên sức mạnh của nó là **8 khe cắm mở rộng**: thêm RAM, thẻ đồ họa, ổ đĩa, card âm thanh — người dùng tự nâng cấp mà không cần mở hộp hàn mạch.

> Một nền tảng mở bằng khe cắm thường sống lâu hơn một sản phẩm khép kín.`,
  },
  {
    title: 'Commodore 64: 64 KB và con chip âm thanh SID', slug: 'commodore-64-64kb-va-sid', cat: 'lich-su', author: 'lan-huong', cover: 'c64-setup', daysAgo: 4,
    excerpt: 'Ra mắt năm 1982, C64 bán được hơn mười triệu máy nhờ giá vừa phải, đồ họa màu và âm thanh ba kênh.',
    body: `## Vì sao C64 làm nên cả một thế hệ

Commodore 64 có **64 KB RAM**, vi xử lý MOS 6510 chạy khoảng 1 MHz, chip đồ họa **VIC-II** (16 màu) và chip âm thanh **SID** với ba kênh phát. Bật máy lên là thấy ngay dấu nhắc BASIC V2.

{{c64-keys}}

*Thân máy liền bàn phím — bạn chỉ cần cắm vào một chiếc TV.*

Phần mềm thường nạp từ **băng cassette** hoặc ổ đĩa 1541 — nạp một trò chơi có thể mất vài phút, và đó là lúc cả nhà ngồi chờ.

- Lập trình: BASIC có sẵn, hoặc mã máy 6502
- Âm nhạc: SID vẫn được giới chiptune yêu thích đến nay
- Cộng đồng: hàng nghìn trò chơi và chương trình demo`,
  },
  {
    title: 'ZX Spectrum và những phím cao su', slug: 'zx-spectrum-phim-cao-su', cat: 'lich-su', author: 'lan-huong', cover: 'spectrum', daysAgo: 6,
    excerpt: 'Chiếc máy nhỏ của Sinclair mở cánh cửa lập trình cho cả một thế hệ ở Anh.',
    body: `## Nhỏ, rẻ và lạ lùng

ZX Spectrum (1982) dùng vi xử lý **Z80A** 3,5 MHz, có bản 16 KB và 48 KB RAM, hiển thị 8 màu (kèm chế độ sáng). Bàn phím là một **tấm cao su** với nhiều từ khóa BASIC in sẵn trên từng phím — bấm một phím là ra cả lệnh.

Chương trình nạp từ băng cassette qua tiếng kêu rít đặc trưng; người dùng có thể vừa chơi game vừa học viết game ngay trên máy.

\`\`\`
10 PRINT "XIN CHAO"
20 GOTO 10
\`\`\`

Đơn giản, nhưng đó là bài học đầu tiên của rất nhiều lập trình viên.`,
  },
  {
    title: 'IBM PC 5150 và chuẩn của cả ngành', slug: 'ibm-pc-5150-va-chuan-nganh', cat: 'lich-su', author: 'quoc-bao', cover: 'ibm-pc', daysAgo: 9,
    excerpt: 'Năm 1981, IBM tung ra chiếc PC với kiến trúc mở — và vô tình đặt nền cho máy tính ngày nay.',
    body: `## "PC" trở thành một khái niệm

IBM PC 5150 dùng vi xử lý **Intel 8088 4,77 MHz** và chạy PC DOS (do Microsoft cung cấp). Điều quan trọng không phải tốc độ mà là **kiến trúc mở**: khe cắm mở rộng, tài liệu công bố, linh kiện lấy từ nhiều nhà.

Chính điều đó khiến các hãng khác làm được máy "tương thích IBM PC", và hệ sinh thái x86 + DOS/Windows lớn dần.

1. Chuẩn hóa phần cứng → giá giảm
2. Nhiều nhà cung cấp → phần mềm chạy được trên mọi máy
3. Hệ quả: di sản x86 vẫn còn trong CPU ngày nay`,
  },
  {
    title: 'Macintosh 128K: giao diện đồ họa và con chuột', slug: 'macintosh-128k-chuot-va-gui', cat: 'lich-su', author: 'lan-huong', cover: 'mac128', daysAgo: 12,
    excerpt: 'Năm 1984, một chiếc máy màu kem nhỏ gọn đưa cửa sổ, biểu tượng và con trỏ chuột tới đại chúng.',
    body: `## Bàn làm việc trên màn hình

Macintosh 128K có **128 KB RAM**, vi xử lý **Motorola 68000** 8 MHz, màn hình đơn sắc 9 inch độ phân giải **512×342**. Điều khác biệt lớn nhất: giao diện đồ họa với cửa sổ, biểu tượng và con chuột.

Đĩa mềm 3,5 inch (400 KB) vừa là nơi chứa hệ điều hành vừa là nơi lưu tài liệu — đổi đĩa liên tục là chuyện bình thường.

> Ý tưởng "bàn làm việc trên màn hình" nay là điều hiển nhiên — năm 1984 thì chưa.`,
  },
  {
    title: 'Altair 8800: chiếc máy kit khởi đầu cuộc cách mạng PC', slug: 'altair-8800-may-kit-dau-tien', cat: 'lich-su', author: 'lan-huong', cover: 'altair', daysAgo: 15,
    excerpt: 'Không bàn phím, không màn hình — chỉ công tắc, đèn và một thế hệ người đam mê.',
    body: `## Công tắc và đèn

Altair 8800 của MITS (1975), dùng vi xử lý **Intel 8080**, xuất hiện trên bìa tạp chí Popular Electronics và bán dưới dạng kit tự lắp. Bạn nhập chương trình bằng cách **bật tắt từng công tắc** ở mặt trước, rồi xem kết quả qua dãy đèn.

{{altair}}

Chính chiếc máy này khiến Bill Gates và Paul Allen viết **BASIC** cho nó — sản phẩm đầu tiên của Microsoft.

- Không có màn hình: kết quả hiển thị bằng đèn LED
- Bộ nhớ nhỏ, chương trình ngắn
- Truyền cảm hứng cho cả cộng đồng tự lắp máy`,
  },
  {
    title: 'Đĩa mềm: từ 8 inch đến 1,44 MB', slug: 'dia-mem-tu-8-inch-den-1-44mb', cat: 'phan-cung', author: 'quoc-bao', cover: 'floppy-disks', daysAgo: 5,
    excerpt: 'Chiếc đĩa nhựa dẹt từng là cách chính để mang dữ liệu đi khắp nơi.',
    body: `## Ba thế hệ đĩa mềm

Đĩa mềm là một đĩa từ mỏng đặt trong vỏ nhựa; đầu đọc chạm vào đĩa để đọc/ghi từng rãnh. Có ba kích cỡ phổ biến:

| Loại | Dung lượng thường gặp |
|---|---|
| 8 inch | vài trăm KB |
| 5,25 inch | 360 KB – 1,2 MB |
| 3,5 inch | 720 KB – 1,44 MB |

{{floppy-drives}}

*Ba thế hệ ổ đĩa mềm đặt cạnh nhau: 8 inch, 5,25 inch và 3,5 inch.*

Bản 3,5 inch cứng cáp hơn nhờ vỏ nhựa và nắp trượt che đĩa. Ngày nay biểu tượng "Save" vẫn là hình một chiếc đĩa mềm.`,
  },
  {
    title: 'CRT: bên trong chiếc màn hình dày cộp', slug: 'crt-ben-trong-man-hinh-day-cop', cat: 'phan-cung', author: 'quoc-bao', cover: 'crt-monitor', daysAgo: 8,
    excerpt: 'Một ống thủy tinh, một súng điện tử và những cuộn dây làm chùm tia quét khắp màn hình.',
    body: `## Chùm tia quét từng dòng

Màn hình CRT có một **súng điện tử** bắn chùm electron vào lớp phosphor ở mặt trong màn hình; **cuộn lái tia** làm chùm tia quét từ trái sang phải, từng dòng từng dòng. Phosphor sáng lên rồi tắt dần — nên hình ảnh được "vẽ lại" liên tục.

{{crt-tube}}

*Một ống tia âm cực (CRT) cổ, mặt trước phủ lưới kẻ ô.*

⚠️ **Lưu ý an toàn:** CRT có thể giữ điện áp rất cao (hàng chục nghìn volt) ngay cả khi đã rút điện. Đừng tự mở máy nếu chưa biết cách xả điện.`,
  },
  {
    title: 'Bàn phím IBM Model M: tiếng lạch cạch huyền thoại', slug: 'ban-phim-ibm-model-m', cat: 'phan-cung', author: 'quoc-bao', cover: 'model-m', daysAgo: 20,
    excerpt: 'Cơ chế buckling spring làm nên cảm giác gõ mà nhiều người vẫn tìm kiếm.',
    body: `## Cảm giác của lò xo

IBM Model M (giữa thập niên 1980) dùng cơ chế **buckling spring**: khi bạn nhấn phím, lò xo bị uốn cong đột ngột và tạo ra tiếng "tách" cùng cú nảy rõ rệt. Vỏ nặng, phím bền — nhiều chiếc vẫn dùng tốt sau hàng chục năm.

{{smk-switch}}

*Công tắc phím cơ cổ (loại SMK) tháo rời — mỗi phím là một cơ cấu cơ khí riêng.*

Hôm nay, bàn phím cơ hiện đại là hậu duệ tinh thần của những chiếc như vậy: mỗi phím một công tắc, có cảm giác bấm riêng.`,
  },
  {
    title: 'Đọc một bo mạch chủ: con chip nào làm gì?', slug: 'doc-mot-bo-mach-chu', cat: 'kien-thuc', author: 'quoc-bao', cover: 'motherboard', daysAgo: 25,
    excerpt: 'Học cách nhận diện CPU, chipset, thạch anh và tụ điện trên một tấm mạch in.',
    body: `## Bản đồ của một tấm mạch

Nhìn một bo mạch lần đầu, bạn thấy hàng chục linh kiện nhỏ. Vài dấu hiệu dễ nhận:

- **Chip vuông lớn nhiều chân:** thường là bộ xử lý hoặc chipset
- **Hộp kim loại nhỏ:** thạch anh (crystal) tạo xung nhịp
- **Hình trụ nhỏ:** tụ điện lọc nguồn
- **Hàng chân cắm:** cổng mở rộng, jumper cấu hình

{{motherboard-2}}

*Cận cảnh mạch in: chip vuông, thạch anh và hàng chân cắm.*

Mẹo: đọc chữ in trên chip — thường là tên nhà sản xuất và mã sản phẩm, đủ để tra datasheet.`,
  },
  {
    title: 'Amiga 500: máy tính đa nhiệm của thập niên 1980', slug: 'amiga-500-da-nhiem', cat: 'phan-cung', author: 'lan-huong', cover: 'amiga500', daysAgo: 30,
    excerpt: 'Chip đồ họa và âm thanh chuyên dụng giúp Amiga đi trước thời đại.',
    body: `## Ba chip đặc biệt

Amiga 500 (1987) dùng vi xử lý **Motorola 68000** (~7 MHz), 512 KB RAM, và bộ ba chip tùy biến **Agnus, Denise, Paula** lo đồ họa, âm thanh. Hệ điều hành **Workbench** có giao diện cửa sổ và đa nhiệm, điều còn hiếm trên máy gia đình thời đó.

{{amiga-board}}

*Bên trong Amiga 500+: các chip tùy biến chiếm phần lớn mạch.*

Nhờ kiến trúc này, Amiga trở thành nền tảng yêu thích của dân làm đồ họa, nhạc tracker và game.`,
  },
  {
    title: 'Ổ cứng cơ học hoạt động ra sao?', slug: 'o-cung-co-hoc-hoat-dong-ra-sao', cat: 'phan-cung', author: 'quoc-bao', cover: 'hdd', daysAgo: 38,
    excerpt: 'Đĩa từ quay nhanh, đầu đọc lướt trên một lớp không khí mỏng hơn sợi tóc.',
    body: `## Đĩa quay, đầu đọc lướt

Ổ cứng cơ học lưu dữ liệu trên các **đĩa từ** quay liên tục. Đầu đọc/ghi không chạm vào đĩa mà "bay" trên một lớp không khí cực mỏng. Nếu đầu chạm đĩa — hiện tượng **head crash** — dữ liệu có thể hỏng.

{{hdd-2}}

*Mặt dưới ổ cứng cổ với bo mạch điều khiển.*

Ổ cứng đầu tiên, IBM 305 RAMAC (1956), lưu khoảng 5 triệu ký tự — tương đương chưa tới 4 MB — trên một thiết bị to cỡ vài chiếc tủ lạnh.`,
  },
  {
    title: 'Vì sao terminal hôm nay vẫn bắt chước VT100?', slug: 'vi-sao-terminal-bat-chuoc-vt100', cat: 'phan-mem', author: 'lan-huong', cover: 'vt100', daysAgo: 11,
    excerpt: 'Thiết bị đầu cuối DEC ra mắt năm 1978 để lại chuẩn mà phần mềm còn dùng tới giờ.',
    body: `## Một chiếc màn hình chữ

DEC VT100 hiển thị **80 cột × 24 dòng** và hiểu một bộ **mã thoát ANSI** để di chuyển con trỏ, đổi màu, xóa dòng. Rất nhiều chương trình được viết cho nó, nên trình giả lập terminal sau này đều "nói" được VT100.

Ví dụ một chuỗi điều khiển: \`ESC [ 2 J\` xóa màn hình.

> Mỗi khi bạn mở terminal, bạn đang dùng hậu duệ của một chiếc máy năm 1978.`,
  },
  {
    title: 'BBS và modem 300 baud: mạng xã hội thời quay số', slug: 'bbs-va-modem-300-baud', cat: 'phan-mem', author: 'lan-huong', cover: 'modem-atari800', daysAgo: 17,
    excerpt: 'Gọi điện tới máy của một người lạ, đọc thư và để lại lời nhắn — không cần Internet.',
    body: `## Mạng trước khi có web

Bảng tin điện tử (**BBS**) là một máy tính nối với đường điện thoại. Hệ thống đầu tiên, CBBS ở Chicago, ra đời năm 1978. Người dùng gọi vào bằng modem, đọc tin, tải tập tin và nhắn tin cho nhau.

{{acoustic-coupler}}

*Thiết bị ghép âm: úp ống nghe điện thoại vào hai núm cao su để truyền dữ liệu bằng âm thanh.*

Modem đời đầu chạy **300 baud** — chữ hiện ra trên màn hình chậm rãi, từng dòng một. Về sau modem Hayes phổ biến bộ lệnh \`AT\` mà modem còn dùng nhiều năm.`,
  },
  {
    title: 'ASCII: bảng chữ cái của máy tính', slug: 'ascii-bang-chu-cai-cua-may-tinh', cat: 'kien-thuc', author: 'lan-huong', cover: 'ascii', daysAgo: 22,
    excerpt: 'Bảy bit đủ cho 128 ký tự — và vẫn nằm dưới nền mọi bảng mã hôm nay.',
    body: `## 128 ký tự

ASCII dùng 7 bit, tức 128 mã: chữ cái, chữ số, dấu câu và 32 mã điều khiển đầu tiên (xuống dòng, tab...). Vài mốc đáng nhớ:

| Ký tự | Mã thập phân |
|---|---|
| \`A\` | 65 |
| \`a\` | 97 |
| \`0\` | 48 |
| khoảng trắng | 32 |

Chữ hoa và chữ thường cách nhau đúng **32** — chỉ khác một bit.

{{ascii}}

*Một bảng tra mã: ký tự, thập phân, thập lục phân, nhị phân.*`,
  },
  {
    title: 'BASIC: dòng lệnh đầu tiên của cả một thế hệ', slug: 'basic-dong-lenh-dau-tien', cat: 'lap-trinh', author: 'lan-huong', cover: 'amstrad', daysAgo: 7,
    excerpt: 'Bật máy lên là thấy dấu nhắc BASIC, và chương trình đầu tiên chỉ cách bạn hai dòng.',
    body: `## Ngôn ngữ để ai cũng bắt đầu được

BASIC ra đời năm 1964 tại Dartmouth, do John Kemeny và Thomas Kurtz thiết kế để sinh viên mới học cũng lập trình được. Thập niên 1980, nhiều máy 8-bit **khởi động thẳng vào BASIC**.

\`\`\`
10 PRINT "XIN CHAO RETRO BLOG"
20 FOR I = 1 TO 5
30 PRINT I
40 NEXT I
\`\`\`

Số dòng đứng đầu cho biết thứ tự thực thi; gõ \`RUN\` để chạy. Không cần trình biên dịch, không cần cài đặt.`,
  },
  {
    title: 'Thẻ đục lỗ và vì sao màn hình rộng 80 cột', slug: 'the-duc-lo-va-80-cot', cat: 'kien-thuc', author: 'quoc-bao', cover: 'punch-card', daysAgo: 27,
    excerpt: 'Khổ 80 ký tự của thẻ đục lỗ IBM còn để lại dấu vết trong terminal và trình soạn thảo.',
    body: `## Mỗi thẻ một dòng

Thẻ đục lỗ IBM chứa **80 cột**, mỗi cột mã hóa một ký tự bằng các lỗ. Một dòng chương trình tương ứng một thẻ, và cả chương trình là cả một xấp thẻ — thứ tự lộn là chương trình hỏng.

{{punch-cards-stack}}

*Xấp thẻ đục lỗ in mẫu dùng để lập trình.*

Khi màn hình xuất hiện, các terminal giữ **80 cột** để quen với dữ liệu cũ. Nhiều công cụ ngày nay vẫn khuyên giữ dòng code ngắn quanh con số này.`,
  },
  {
    title: 'Game Boy: 160×144 điểm ảnh làm nên một huyền thoại', slug: 'game-boy-160x144', cat: 'retro-gaming', author: 'lan-huong', cover: 'gameboy', daysAgo: 10,
    excerpt: 'Màn hình xanh lá nhòe, bốn sắc độ và tuổi thọ pin đáng nể.',
    body: `## Cầm tay, đơn giản, bền

Game Boy (1989) có vi xử lý 8-bit tương tự Z80 chạy ~4 MHz, màn hình **160×144** với **4 sắc độ xám-xanh**, chạy bằng 4 pin AA. Trò **Tetris** đi kèm máy là một trong những lý do nó thành hiện tượng.

- Không đèn nền: phải tìm chỗ sáng để chơi
- Pin đủ cho hàng chục giờ chơi
- Thiết kế bền đến mức nhiều chiếc còn chạy được tới nay

Giới hạn của nó buộc nhà làm game tập trung vào lối chơi hơn là đồ họa.`,
  },
  {
    title: 'Atari 2600: 128 byte RAM và nghệ thuật "đua với tia"', slug: 'atari-2600-128-byte-ram', cat: 'retro-gaming', author: 'quoc-bao', cover: 'atari2600', daysAgo: 34,
    excerpt: 'Không có bộ nhớ khung hình — lập trình viên phải vẽ từng dòng quét đúng lúc tia điện tử đi qua.',
    body: `## Lập trình theo nhịp tia

Atari 2600 (1977) chỉ có **128 byte RAM** và dùng vi xử lý MOS 6507 chạy khoảng 1,19 MHz; cartridge thường chứa chương trình vài KB. Máy **không có bộ nhớ khung hình**, nên chương trình phải chuẩn bị dữ liệu cho **từng dòng quét** ngay khi tia điện tử của TV đang vẽ — kỹ thuật được gọi là *racing the beam*.

Ràng buộc cực đoan này sinh ra nhiều mẹo thông minh, và cho thấy phần cứng "ít" có thể được tận dụng đến mức nào.`,
  },
  {
    title: 'Dựng một góc máy retro tại nhà: nên bắt đầu từ đâu?', slug: 'dung-goc-may-retro-tai-nha', cat: 'kien-thuc', author: 'quoc-bao', cover: null, daysAgo: 45,
    excerpt: 'Bài này cố ý không có ảnh bìa — để xem danh sách hiển thị khi thiếu ảnh.',
    body: `## Một bài viết không ảnh bìa

Đây là bài **không có ảnh bìa** để bạn thấy thẻ bài viết chuyển sang dạng chỉ có chữ, đúng thiết kế (không dùng ảnh giả). Dù vậy bài vẫn có ảnh minh hoạ trong thân:

{{retro-lab}}

*Một phòng máy với hàng màn hình CRT và những chiếc ghế xanh.*

Vài gợi ý khi bắt đầu:

1. Chọn **một** dòng máy bạn thích thay vì mua mọi thứ
2. Kiểm tra nguồn điện và bộ đổi nguồn trước khi bật máy cũ
3. Ưu tiên máy còn nguyên vỏ, phím đầy đủ
4. Tìm cộng đồng — họ có phụ tùng và kinh nghiệm`,
  },
];

// ---------------------------------------------------------------------------
async function findOne(collection, slug) {
  const r = await api('GET', `/items/${collection}?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id&limit=1`);
  return r.data?.[0]?.id ?? null;
}

// 1) Dọn lần chạy trước (posts → authors mới; files showcase-*)
for (const p of POSTS) {
  const id = await findOne('posts', p.slug);
  if (id) await api('DELETE', `/items/posts/${id}`);
}
for (const a of NEW_AUTHORS) {
  const id = await findOne('authors', a.slug);
  if (id) await api('DELETE', `/items/authors/${id}`);
}
const oldFiles = await api('GET', '/files?filter[title][_starts_with]=showcase-&fields=id&limit=-1');
for (const f of oldFiles.data ?? []) await api('DELETE', `/files/${f.id}`);

// 2) Upload ảnh (title `showcase-<key>`, alt bắt buộc)
const fileId = {};
for (const [key, alt] of Object.entries(PHOTOS)) {
  const buf = readFileSync(resolve(IMG, `${key}.jpg`));
  const f = await uploadFile(buf, `${key}.jpg`, 'image/jpeg', { title: `showcase-${key}` });
  await api('PATCH', `/files/${f.id}`, { alt });
  fileId[key] = f.id;
}
const assetUrl = (key) => `${PUBLIC_URL}/assets/${fileId[key]}`;

// 3) Chuyên mục (tạo nếu chưa có) + tác giả
const catId = {};
for (const slug of ['phan-cung', 'phan-mem']) catId[slug] = await findOne('categories', slug);
for (const c of NEW_CATEGORIES) {
  catId[c.slug] = (await findOne('categories', c.slug)) ?? (await api('POST', '/items/categories', c)).data.id;
}
const authorId = {};
authorId[BASE_AUTHOR.slug] = await findOne('authors', BASE_AUTHOR.slug);
if (!authorId[BASE_AUTHOR.slug] || !catId['phan-cung']) {
  console.error('Thiếu dữ liệu seed-dev — chạy `pnpm seed:dev` trước.');
  process.exit(1);
}
await api('PATCH', `/items/authors/${authorId[BASE_AUTHOR.slug]}`, { avatar: fileId[BASE_AUTHOR.avatar] });
for (const a of NEW_AUTHORS) {
  const r = await api('POST', '/items/authors', { name: a.name, slug: a.slug, bio: a.bio, avatar: fileId[a.avatar] });
  authorId[a.slug] = r.data.id;
}

// 4) Ảnh bìa cho bài seed-dev
let patched = 0;
for (const [slug, key] of Object.entries(EXISTING_COVERS)) {
  const id = await findOne('posts', slug);
  if (id) { await api('PATCH', `/items/posts/${id}`, { cover: fileId[key] }); patched++; }
}

// 5) Bài mới
const now = Date.now();
const DAY = 86400000;
for (const p of POSTS) {
  const md = p.body.replace(/\{\{([a-z0-9-]+)\}\}/g, (_, k) => `![${PHOTOS[k]}](${assetUrl(k)})`);
  await api('POST', '/items/posts', {
    title: p.title, slug: p.slug, excerpt: p.excerpt, body: mdToHtml(md),
    status: 'published',
    published_at: new Date(now - p.daysAgo * DAY - (p.daysAgo % 5) * 3600000).toISOString(),
    author: authorId[p.author], category: catId[p.cat],
    cover: p.cover ? fileId[p.cover] : null,
  });
}

console.log('Seed showcase hoàn tất:');
console.log(`  ảnh=${Object.keys(fileId).length}  chuyên mục mới=${NEW_CATEGORIES.length}  tác giả mới=${NEW_AUTHORS.length}`);
console.log(`  bài mới=${POSTS.length} (${POSTS.filter((p) => !p.cover).length} không ảnh bìa)  bìa gắn cho bài seed-dev=${patched}/3`);
