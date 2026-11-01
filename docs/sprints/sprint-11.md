# 🧪 Sprint 11 — Kiểm thử mở rộng (link, a11y, hiệu năng, E2E, độ bền)

> **Vai trò:** QA / Test Engineer · **Mục tiêu:** có bằng chứng **tự động** cho chất lượng trang xuất ra và cho đường publish → hiển thị, thay cho kiểm thủ công. Không đổi giao diện, Content Model, API Contract hay hạ tầng deploy.
> 🔗 [11-testing](../11-testing.md) · [15-seo-accessibility](../15-seo-accessibility.md) · [14-quality-gates §4](../14-quality-gates.md) · [ADR-0009](../adr/0009-quality-tooling-biome-vitest.md)

## Bối cảnh
- Hiện có: 102 test Vitest (unit + contract với `fetch` mock), job CI `quality` (bắt buộc) và `build` (Directus + Postgres + seed → `astro build`, `continue-on-error`).
- Chưa có: kiểm link nội bộ, axe, Lighthouse, E2E, test quyền Public trên Directus thật. Mục tiêu WCAG 2.2 AA ([15 §B](../15-seo-accessibility.md)) mới là cam kết, chưa có số đo.
- Thin client `apps/web/src/lib/directus.ts` hiện **không có timeout/retry** cho `fetch` (đã kiểm bằng grep) → một Directus treo sẽ làm treo cả `astro build`.

## Nguyên tắc
- Mọi kiểm tra site chạy trên **`dist/` đã build** từ job `build` (đã có Directus + seed), không dựng thêm hạ tầng.
- Công cụ dễ thay → một dòng trong brief, không ADR. Ưu tiên script Node thuần cho phần đơn giản (link-check) để ít phụ thuộc.
- Job mới vào CI ở chế độ **không chặn** (`continue-on-error`), chỉ chuyển thành bắt buộc ở Sprint 13 sau khi ổn định.

## Phạm vi
### A. Link & cấu trúc (script Node, không thêm dependency)
- [ ] `scripts/check-site.mjs` quét `dist/`: mọi `href`/`src` **nội bộ** trỏ tới file có thật; mọi URL trong `sitemap.xml` có file tương ứng và ngược lại (trừ 404/search-index); `canonical` khớp URL trang; `rss.xml` là XML hợp lệ, mục nào cũng có link tồn tại.
- [ ] Bắt lỗi cấu hình: **không** có `localhost`/`http://` trong `dist/` khi build với `PUBLIC_SITE_URL`/`PUBLIC_DIRECTUS_URL` HTTPS (chặn lặp lại sự cố domain sai); JSON-LD của bài phân tích được JSON.
- [ ] Link ngoài: **không** kiểm trong CI (dễ flaky); chỉ liệt kê vào báo cáo.

### B. Accessibility (axe-core)
- [ ] Chạy axe trên **mỗi loại trang một mẫu**: trang chủ, bài viết, chuyên mục, thẻ, tác giả, lưu trữ, tìm kiếm, `/categories`, 404; viewport desktop và mobile.
- [ ] Ngưỡng: **0 vi phạm mức serious/critical**; moderate/minor ghi vào Kết quả kèm lý do nếu chưa sửa.
- [ ] Kiểm tương tác bằng bàn phím bằng test E2E (mục D): skip-link, focus nhìn thấy được, lightbox mở/đóng bằng phím (Esc), tìm kiếm.

### C. Hiệu năng (Lighthouse CI, preset mobile)
- [ ] Đo **baseline** trên cùng các trang mẫu, ghi số vào Kết quả; sau đó đặt ngân sách = baseline trừ biên an toàn. Mức khởi điểm đề xuất (chỉnh theo baseline thật): Performance ≥ 0,90 · Accessibility ≥ 0,95 · SEO ≥ 0,95 · Best Practices ≥ 0,90; ghi thêm tổng JS và tổng byte mỗi trang.
- [ ] `lighthouserc` trong repo; `assert` ở mức `warn` trong sprint này.

### D. E2E (Playwright, Chromium)
- [ ] Phục vụ `dist/` bằng server tĩnh trong CI; không cần Directus khi chạy E2E.
- [ ] Kịch bản: trang chủ → bài → chuyên mục → thẻ → tác giả; phân trang; **tìm kiếm** (gõ → có kết quả → không kết quả); **lightbox** (mở, Esc, ảnh rộng không bị cắt — lỗi từng gặp ở commit `f754767`); trang 404; `rss.xml`/`sitemap.xml`/`robots.txt` trả về đúng loại nội dung; điều hướng mobile.
- [ ] Ảnh chụp lỗi + trace được đẩy làm artifact CI khi fail.

### E. Quyền Public và đường publish trên Directus thật (tích hợp)
- [ ] Trong job `build` (Directus + seed đã chạy): bằng API với vai Public, kiểm **bài nháp không đọc được**, **bài `published_at` ở tương lai không đọc được**, `/users` trả 403, trường ngoài allowlist không lộ.
- [ ] Luồng publish → build: tạo bài nháp → build → **không** có trong `dist/`; đặt `published` → build → **có** trong `dist/` và trong `sitemap.xml`/`rss.xml`; ngược lại khi gỡ.
- [ ] Đây là test của cấu hình quyền, không đổi quyền; nếu phát hiện lộ dữ liệu → dừng và báo Product (cổng bảo mật).

### F. Độ bền thin client (Vitest)
- [ ] Test: Directus trả 5xx / lỗi mạng / JSON hỏng / phản hồi chậm → `DirectusError` kiểu `system`, không rò chi tiết; danh sách rỗng; trang không tồn tại → `null`.
- [ ] Thêm **timeout cho `fetch`** (`AbortSignal.timeout`) nếu test chứng minh build treo — sửa tối thiểu, chỉ trong `directus.ts`, kèm test; không thêm retry khi chưa có bằng chứng cần.
- [ ] Phần `.astro` chứa logic (cửa sổ phân trang `Pagination.astro`, JSON-LD ở `posts/[slug].astro`): tách thành module `.ts` rồi test là **refactor** → ghi Backlog, **chỉ làm nếu Product duyệt**. Trong sprint này chỉ phủ bằng E2E/JSON-LD của mục A.

### G. CI & tài liệu
- [ ] Job `site-checks` (cần artifact `dist` từ `build`): chạy A + B + C + D; thời gian thêm ≤ ~5 phút; cache trình duyệt Playwright.
- [ ] Cập nhật [11-testing §2–3](../11-testing.md) (kim tự tháp, bảng trạng thái), [15 §B3](../15-seo-accessibility.md), [14 §4](../14-quality-gates.md) (DoD nhắc job mới).

## Ngoài phạm vi / Backlog
- Biến các job mới thành check bắt buộc, branch protection → **Sprint 13**.
- Kiểm link ngoài định kỳ; visual regression bằng ảnh chụp (chờ sau [Sprint 16](./sprint-16.md)); test tải.
- Tách logic khỏi `.astro` (mục F) nếu chưa được duyệt.

## Tiêu chí xong
- `quality` và `build` vẫn xanh; `site-checks` chạy xanh trên `main` **10 lần liên tiếp**, không flaky.
- Axe: 0 serious/critical trên mọi trang mẫu. Có số baseline Lighthouse trong Kết quả và `lighthouserc` trong repo.
- E2E phủ đủ kịch bản mục D; test quyền Public (mục E) chạy trong CI.
- Thử phá có chủ đích (đột biến) cho ít nhất: link hỏng, thiếu `alt`, bài nháp lộ → job tương ứng chuyển đỏ (ghi vào Kết quả).
- Tài liệu mục G đã cập nhật.

## Cổng review
Chỉ **cuối sprint**. Giữa sprint không dừng (test/tooling/CI); chỉ dừng nếu mục E phát hiện lộ dữ liệu hoặc mục F cần đổi hành vi thin client ngoài timeout.

## Kết quả
_(điền khi xong sprint: số baseline Lighthouse, danh sách vi phạm axe đã sửa/để lại, thời gian CI thêm, các lỗi test tìm ra)_
