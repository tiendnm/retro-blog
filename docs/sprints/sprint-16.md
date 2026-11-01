# 🎨 Sprint 16 — Visual Polish: cảm giác "manual / tạp chí phần cứng cũ"

> **Vai trò:** Frontend / UI Designer · **Mục tiêu:** hiện thực định hướng mỹ thuật của Product — trang đọc như một cuốn manual hoặc tạp chí phần cứng cũ — bằng chất liệu **procedural** (không asset ảnh ngoài), **không làm tụt a11y, hiệu năng hay CSP**. Không đổi Content Model, API, bố cục trang chủ (đã chốt phương án D), hạ tầng.
> 🔗 [07-ui-ux](../07-ui-ux.md) · [15-seo-accessibility](../15-seo-accessibility.md) · [Sprint 11](./sprint-11.md) (axe/Lighthouse baseline) · [Sprint 15](./sprint-15.md) (Design System)

## Bối cảnh
- Hiện tại nền giấy vàng phẳng. Định hướng dài hạn của Product (Design Backlog): **grain/sợi giấy** rất nhẹ, **nếp gấp (crease)** cực mờ, sinh bằng thuật toán; chủ đề blog là máy tính cổ.
- Sprint này đặt **sau Sprint 11** vì cần số đo trước/sau (axe, Lighthouse, E2E) để biết hiệu ứng có gây hồi quy không, và **sau Sprint 15** nếu có Design System để ghi token mới đúng chỗ.
- Ràng buộc kỹ thuật hiện có (Caddyfile): CSP `style-src 'self'` (**không style inline**), `script-src 'self'`, `img-src 'self' data: <CMS>`. Hiệu ứng phải nằm trong file CSS tĩnh; ảnh nền sinh bằng SVG/CSS đặt trong CSS hoặc `data:` URI (được phép bởi `img-src data:`). Không cần nới CSP.

## Nguyên tắc
- **Đọc trước tiên:** độ tương phản chữ/nền vẫn đạt WCAG AA trên *mọi* vùng của texture; texture không bao giờ làm giảm khả năng đọc.
- **Rẻ:** tĩnh, không animation, không tải thêm byte đáng kể (ngân sách do Sprint 11 đặt); không `filter`/`backdrop-filter` nặng trên cuộn.
- **Tôn trọng người dùng:** tắt hiệu ứng với `prefers-contrast: more`, `forced-colors: active`; bản in không có texture; `prefers-reduced-motion` không liên quan vì không có chuyển động (ghi rõ nếu sau này thêm).
- **Tăng dần và đảo ngược được:** mỗi hiệu ứng là một lớp CSS tách biệt, có biến cường độ (`--paper-grain`, `--paper-crease`) để Product chỉnh bằng một số.

## Phạm vi
- [ ] **Spike thuật toán (không merge):** thử 2–3 cách sinh grain (SVG `feTurbulence` trong `data:` URI, gradient chồng, ô lát nhỏ lặp) và 2 cách tạo crease (gradient tuyến tính mờ ở vị trí cố định/ngẫu nhiên theo bài); đo byte, thời gian paint, hiển thị trên màn hình thường/retina.
- [ ] **Chọn phương án + triển khai** vào CSS hiện có (`apps/web/src/styles`), áp cho nền trang và khối bài viết; token mới ghi vào [`07b-design-system`](../07b-design-system.md) §3.
- [ ] **Phương án cường độ:** trình bày 3 mức (rất nhẹ / vừa / rõ) bằng ảnh chụp cạnh nhau để **Product chọn**; mặc định ship mức nhẹ nhất được Product chấp nhận.
- [ ] **Kiểm a11y và hiệu năng:** chạy lại axe (0 serious/critical), Lighthouse so với baseline Sprint 11 (không vượt biên cho phép), E2E; kiểm tương phản tại vùng tối nhất/sáng nhất của texture bằng công cụ, không bằng mắt.
- [ ] **Chế độ đặc biệt:** `forced-colors`, `prefers-contrast`, in ấn (print), màn hình độ sáng thấp; ghi kết quả.
- [ ] **Build preview theo quy trình chính thức** ([17 §2](../17-contributing.md)): Docker build, smoke các route liên quan, URL local + ảnh chụp trước/sau cho trang chủ, bài viết, chuyên mục, 404; ba mục *Changed / Unchanged / Product should verify*.

## Ngoài phạm vi / Backlog
- Đổi bố cục, font, màu chủ đạo, hình minh hoạ/asset ảnh; animation, parallax, dark mode mới.
- Visual regression tự động bằng ảnh chụp (có thể làm sau khi giao diện ổn định).

## Tiêu chí xong
- Product xác nhận bằng ảnh chụp cạnh nhau mức cường độ cuối cùng.
- Axe: 0 serious/critical; Lighthouse và byte không vượt ngân sách Sprint 11; E2E xanh.
- Không thêm nới CSP; `forced-colors`/`prefers-contrast`/print không có texture.
- Có thể tắt toàn bộ hiệu ứng bằng một biến (đã thử).

## Cổng review
Thay đổi **Reader/UI** nên bắt buộc có build preview và bằng chứng như trên. Dừng chờ Product ở bước chọn cường độ (giữa sprint) và cuối sprint.

## Kết quả (Product duyệt và đóng sprint 2026-11-02, đã xem ảnh)
### Spike (giữa sprint)
- **Grain:** `feTurbulence` (+≈0,9 KB CSS) trông giống giấy thật nhất → chọn. Ô lát thủ công (+≈9,8 KB) lộ chấm lặp như bụi → loại. Gradient chồng (+≈0,5 KB) kẻ sọc → loại.
- **Crease:** gáy sách dọc giữa trang (cuộn theo nội dung) → chọn; hai nếp ngang ở 1/3 và 2/3 thành dải lạ mắt → loại.
- **Hiệu năng:** cuộn 30 khung: 470–500 ms ở mọi biến thể kể cả tắt (bị giới hạn bởi rAF) → không thấy chậm đi. Tổng CSS thêm ≈1,1 KB.
- **Tương phản (đo pixel tối nhất trên ảnh chụp):** xem §3.5 của 07b. Mức "rõ" làm `muted` xuống 4,00 < 4,5.
### Quyết định và số đo (2026-11-02)
- **Product chọn:** grain mức "vừa" (`--paper-grain: 0.5`), **không** nếp gáy sách (đã gỡ khỏi CSS). Công tắc tổng `--paper-fx`.
- **Tương phản trên pixel tối nhất của grain:** text 10,15 · muted **5,02** · accent 6,70 (đều ≥ 4,5).
- **Axe + E2E** (Playwright, 88 test, desktop+mobile): xanh. **Lighthouse** (mobile, trung vị 3 lượt, 9 trang, cùng máy): điểm Perf/A11y/SEO/BP, LCP, TBT, CLS **không đổi** so với bản tắt; byte mỗi trang +≈1,2 KB; JS +0.
- **Giới hạn bằng chứng:** chưa có Docker build preview — các phép đo trên `dist` cũ (build 2026-11-01) có nối CSS mới, vì chưa dựng Directus. CI (`build` + `site-checks`) sẽ kiểm trên bản build thật khi push.
- **Product should verify:** cảm nhận grain trên màn hình thật (retina, độ sáng thấp); không đổi gì khác (Unchanged: bố cục, font, màu, nội dung).
