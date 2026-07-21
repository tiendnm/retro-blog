// Taxonomy fixture — CATEGORY theo ĐỐI TƯỢNG phần cứng/phần mềm (không phải article type).
// Author tối giản. Layer độc lập Directus. weight = tỉ lệ phân bổ bài (0 = để trống → test empty-state).

/** @type {{key:string,name:string,slug:string,description:string,weight:number}[]} */
export const CATEGORIES = [
  { key: 'cpu', name: 'CPU', slug: 'cpu', description: 'Bộ vi xử lý và kiến trúc tập lệnh cổ điển.', weight: 6 },
  { key: 'mainboard', name: 'Mainboard', slug: 'mainboard', description: 'Bo mạch chủ, chipset và bus hệ thống.', weight: 3 },
  { key: 'gpu', name: 'GPU', slug: 'gpu', description: 'Đồ hoạ, card màn hình và chip tăng tốc.', weight: 5 },
  { key: 'memory', name: 'Bộ nhớ', slug: 'memory', description: 'RAM, ROM và các loại bộ nhớ.', weight: 3 },
  { key: 'storage', name: 'Lưu trữ', slug: 'storage', description: 'Ổ đĩa, băng từ và thiết bị lưu trữ.', weight: 4 },
  { key: 'operating-system', name: 'Hệ điều hành', slug: 'operating-system', description: 'Các hệ điều hành và môi trường một thời.', weight: 5 },
  { key: 'software', name: 'Phần mềm', slug: 'software', description: 'Ứng dụng, trình biên dịch và tiện ích.', weight: 6 },
  { key: 'sound', name: 'Âm thanh', slug: 'sound', description: 'Card âm thanh và chip tạo tiếng.', weight: 2 },
  { key: 'peripheral', name: 'Ngoại vi', slug: 'peripheral', description: 'Bàn phím, chuột, máy in và thiết bị ngoại vi.', weight: 3 },
  { key: 'networking', name: 'Mạng', slug: 'networking', description: 'Mạng, modem và BBS.', weight: 0 }, // để trống → test empty-state
];

/** @type {{key:string,name:string,slug:string,bio:string,share:number}[]} — share = tỉ trọng gán bài. */
export const AUTHORS = [
  {
    key: 'author-main',
    name: 'Nguyễn Hoài Cổ',
    slug: 'nguyen-hoai-co',
    bio: 'Người sưu tầm và viết về máy tính cổ, dành phần lớn thời gian rảnh để phục chế phần cứng thập niên 80–90.',
    share: 0.8,
  },
  {
    key: 'author-guest',
    name: 'Trần Vi Mạch',
    slug: 'tran-vi-mach',
    bio: 'Kỹ sư điện tử yêu thích tháo lắp bo mạch và ghi chép lại từng con chip.',
    share: 0.2,
  },
];
