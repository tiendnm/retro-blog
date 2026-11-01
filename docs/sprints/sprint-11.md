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
- [x] `scripts/check-site.mjs` quét `dist/`: mọi `href`/`src` **nội bộ** trỏ tới file có thật; mọi URL trong `sitemap.xml` có file tương ứng và ngược lại (trừ 404/search-index); `canonical` khớp URL trang; `rss.xml` là XML hợp lệ, mục nào cũng có link tồn tại.
- [x] Bắt lỗi cấu hình: **không** có `localhost`/`http://` trong `dist/` khi build với `PUBLIC_SITE_URL`/`PUBLIC_DIRECTUS_URL` HTTPS (chặn lặp lại sự cố domain sai); JSON-LD của bài phân tích được JSON.
- [x] Link ngoài: **không** kiểm trong CI (dễ flaky); chỉ liệt kê vào báo cáo.

### B. Accessibility (axe-core)
- [x] Chạy axe trên **mỗi loại trang một mẫu**: trang chủ, bài viết, chuyên mục, thẻ, tác giả, lưu trữ, tìm kiếm, `/categories`, 404; viewport desktop và mobile.
- [x] Ngưỡng: **0 vi phạm mức serious/critical**; moderate/minor ghi vào Kết quả kèm lý do nếu chưa sửa.
- [x] Kiểm tương tác bằng bàn phím bằng test E2E (mục D): skip-link, focus nhìn thấy được, lightbox mở/đóng bằng phím (Esc), tìm kiếm.

### C. Hiệu năng (Lighthouse CI, preset mobile)
- [x] Đo **baseline** trên cùng các trang mẫu, ghi số vào Kết quả; sau đó đặt ngân sách = baseline trừ biên an toàn. Mức khởi điểm đề xuất (chỉnh theo baseline thật): Performance ≥ 0,90 · Accessibility ≥ 0,95 · SEO ≥ 0,95 · Best Practices ≥ 0,90; ghi thêm tổng JS và tổng byte mỗi trang.
- [x] `lighthouserc` trong repo; `assert` ở mức `warn` trong sprint này.

### D. E2E (Playwright, Chromium)
- [x] Phục vụ `dist/` bằng server tĩnh trong CI; không cần Directus khi chạy E2E.
- [x] Kịch bản: trang chủ → bài → chuyên mục → thẻ → tác giả; phân trang; **tìm kiếm** (gõ → có kết quả → không kết quả); **lightbox** (mở, Esc, ảnh rộng không bị cắt — lỗi từng gặp ở commit `f754767`); trang 404; `rss.xml`/`sitemap.xml`/`robots.txt` trả về đúng loại nội dung; điều hướng mobile.
- [x] Ảnh chụp lỗi + trace được đẩy làm artifact CI khi fail.

### E. Quyền Public và đường publish trên Directus thật (tích hợp)
- [x] Trong job `build` (Directus + seed đã chạy): bằng API với vai Public, kiểm **bài nháp không đọc được**, **bài `published_at` ở tương lai không đọc được**, `/users` trả 403, trường ngoài allowlist không lộ.
- [x] Luồng publish → build: tạo bài nháp → build → **không** có trong `dist/`; đặt `published` → build → **có** trong `dist/` và trong `sitemap.xml`/`rss.xml`; ngược lại khi gỡ.
- [x] Đây là test của cấu hình quyền, không đổi quyền; nếu phát hiện lộ dữ liệu → dừng và báo Product (cổng bảo mật).

### F. Độ bền thin client (Vitest)
- [x] Test: Directus trả 5xx / lỗi mạng / JSON hỏng / phản hồi chậm → `DirectusError` kiểu `system`, không rò chi tiết; danh sách rỗng; trang không tồn tại → `null`.
- [x] Thêm **timeout cho `fetch`** (`AbortSignal.timeout`) nếu test chứng minh build treo — sửa tối thiểu, chỉ trong `directus.ts`, kèm test; không thêm retry khi chưa có bằng chứng cần.
- [x] _(Product duyệt sau review, 01/11/2026)_ Phần `.astro` chứa logic (cửa sổ phân trang `Pagination.astro`, JSON-LD ở `posts/[slug].astro`): tách thành module `.ts` rồi test là **refactor** → ghi Backlog, **chỉ làm nếu Product duyệt**. Trong sprint này chỉ phủ bằng E2E/JSON-LD của mục A.

### G. CI & tài liệu
- [x] Job `site-checks` (cần artifact `dist` từ `build`): chạy A + B + C + D; thời gian thêm ≤ ~5 phút; cache trình duyệt Playwright.
- [x] Cập nhật [11-testing §2–3](../11-testing.md) (kim tự tháp, bảng trạng thái), [15 §B3](../15-seo-accessibility.md), [14 §4](../14-quality-gates.md) (DoD nhắc job mới).

## Ngoài phạm vi / Backlog
- ~~**Favicon**~~ → đã làm sau Sprint 16: CRT pixel-art, khung giấy + viền mực, màn hình hổ phách `#f0a830`, đèn nguồn đỏ gạch (`apps/web/public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`; thẻ `<link>` trong `Base.astro`). Ghi chú cũ: site không có `<link rel="icon">` nên `/favicon.ico` → 404, Lighthouse Best Practices bị trừ vì `errors-in-console`.
- ~~`apps/web/biome.json` khai `$schema` 2.5.5~~ → đã `biome migrate` sau review (`$schema` 2.6.4, `rules.preset`). Ghi chú cũ: khai `$schema` 2.5.5 trong khi CLI là 2.6.4 (Dependabot đã nâng) + cảnh báo `recommended` deprecated → chạy `biome migrate` (chỉ là `info`, lint vẫn xanh).
- Tổng byte mỗi trang **không** đặt ngân sách: khi chạy offline ảnh là ảnh giả 26 KB, không đại diện cho ảnh thật (webp từ Directus). Đo byte thật cần chạy trên bản deploy.
- Rule Public của `tags` chỉ lọc `status=published` (không lọc `published_at`) → tên/slug thẻ của bài hẹn giờ lộ ra trước giờ đăng. Đã được ghi nhận và chấp nhận trong `apply-permissions.sh` (Directus 11.3.5 lỗi `$NOW` ở đường o2m); test không khẳng định điều này. Cân nhắc xem lại khi nâng Directus.
- Biến các job mới thành check bắt buộc, branch protection → **Sprint 13** (Product đã đồng ý).
- Kiểm link ngoài định kỳ; visual regression bằng ảnh chụp (chờ sau [Sprint 16](./sprint-16.md)); test tải.
- ~~Tách logic khỏi `.astro` (mục F)~~ → đã làm sau review: `lib/pagination.ts` (`pageCells`) + `lib/json-ld.ts`, thêm 12 unit test (tổng 132); hành vi giữ nguyên, E2E/JSON-LD của CI là lưới an toàn.

## Tiêu chí xong
- `quality` và `build` vẫn xanh; `site-checks` chạy xanh trên `main` **10 lần liên tiếp**, không flaky.
- Axe: 0 serious/critical trên mọi trang mẫu. Có số baseline Lighthouse trong Kết quả và `lighthouserc` trong repo.
- E2E phủ đủ kịch bản mục D; test quyền Public (mục E) chạy trong CI.
- Thử phá có chủ đích (đột biến) cho ít nhất: link hỏng, thiếu `alt`, bài nháp lộ → job tương ứng chuyển đỏ (ghi vào Kết quả).
- Tài liệu mục G đã cập nhật.

## Cổng review
Chỉ **cuối sprint**. Giữa sprint không dừng (test/tooling/CI); chỉ dừng nếu mục E phát hiện lộ dữ liệu hoặc mục F cần đổi hành vi thin client ngoài timeout.

## Kết quả

**Trạng thái:** mã + tài liệu xong, CI xanh lần đầu (run 41309920972: `quality` · `build` · `site-checks` đều success). Tiêu chí **"site-checks xanh 10 lần liên tiếp"**: xem mục *Độ ổn định* bên dưới.

### Lỗi/khoảng trống tìm ra nhờ test
| # | Phát hiện | Xử lý |
|---|---|---|
| 1 | `directusGet` không có timeout: Directus treo ⇒ `astro build` treo vô hạn (test "phản hồi chậm" treo) | Thêm `AbortSignal.timeout(15 s)` — chỉ trong `directus.ts` |
| 2 | Thân phản hồi không phải JSON ⇒ `SyntaxError` thô, thông điệp lộ đầu thân (`Unexpected token '<', "<html…`) | Bọc thành `DirectusError('system')` không kèm thân (Product đã duyệt) |
| 3 | axe `label-content-name-mismatch` (serious, WCAG 2.5.3): nút "100%" của lightbox có `aria-label` không chứa chữ hiển thị | `aria-label` = "<n>% — về kích thước vừa khung", cập nhật khi zoom |
| 4 | `seed-showcase` không tạo thẻ ⇒ **không trang `/tag/*` nào được build/kiểm** ở CI | Thêm 3 thẻ gắn vào bài |
| 5 | `/favicon.ico` 404 (xem Backlog) | Không sửa (đổi giao diện) |

axe `color-contrast` trên lightbox là **dương tính giả** (axe không đánh giá `::backdrop`; nền thật `rgb(20 17 12 / 92%)`) → tắt rule riêng ở test đó và tự tính tỉ lệ thật (≥ 4,5:1, thực tế ≈ 14:1).

### Accessibility (axe, WCAG 2.2 AA)
11 loại trang × desktop + mobile (+ lightbox đang mở): **0 serious/critical, 0 moderate/minor** sau khi sửa #3. Không có vi phạm để lại.

### Lighthouse baseline (mobile, trung vị 3 lượt, máy dev)
| Trang | Perf | A11y | SEO | BP | LCP (s) | TBT (ms) | CLS | JS (KB) | Tổng (KB)* |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 0,96 | 1,00 | 1,00 | 0,96 | 2,6 | 0 | 0 | 0,0 | 511,5 |
| `/archive` | 0,99 | 1,00 | 1,00 | 0,96 | 1,7 | 0 | 0 | 0,0 | 88,0 |
| `/archive/2026/10` | 0,96 | 1,00 | 1,00 | 0,96 | 2,6 | 0 | 0 | 0,0 | 720,4 |
| `/author/…` | 0,98 | 1,00 | 1,00 | 0,96 | 2,1 | 0 | 0 | 0,0 | 296,8 |
| `/categories` | 0,99 | 1,00 | 1,00 | 0,96 | 1,7 | 0 | 0 | 0,0 | 88,5 |
| `/category/…` | 0,99 | 1,00 | 1,00 | 0,96 | 2,0 | 0 | 0 | 0,0 | 194,0 |
| `/posts/…` (có ảnh) | 0,98 | 1,00 | 1,00 | 0,96 | 2,3 | 0 | 0 | 5,5 | 200,0 |
| `/search` | 0,99 | 1,00 | **0,66** | 0,96 | 1,7 | 0 | 0 | 3,3 | 91,4 |
| `/tag/…` | 0,97 | 1,00 | 1,00 | 0,96 | 2,4 | 0 | 0 | 0,0 | 611,8 |

* Tổng byte bị thổi phồng bởi ảnh giả 26 KB/ảnh (không đại diện) — chỉ dùng để so sánh trước/sau. `/search` SEO 0,66 do `noindex` chủ đích. BP 0,96 vì `/favicon.ico` 404.
**Ngân sách (`warn`):** Perf ≥ 0,90 · A11y ≥ 0,95 · SEO ≥ 0,95 (trừ `/search`) · BP ≥ 0,90 · script ≤ 20 KB. Trên CI (1 lượt/trang, 10 URL): không cảnh báo.

### Thử phá có chủ đích (đột biến)
| Đột biến | Job/test chuyển đỏ |
|---|---|
| Xoá file trang chuyên mục / JSON-LD hỏng / sitemap lệch | `check-site` (9 lỗi) |
| Bỏ `alt` của ảnh trong bài | axe `image-alt` (critical) |
| Hoàn tác CSS lightbox (`max-height:100%`) | `lightbox.spec` "ảnh nằm trọn trong khung nhìn" (956 > 800 px) |
| Gỡ bộ lọc `status`/`published_at` khỏi quyền Public (bài nháp lộ) | `permissions.test` (4 test) **và** `publish-flow.test` (cả 2) |
Lần phá đầu cho lightbox/alt **không** bị bắt (ảnh fixture 1600×600 quá thấp; mẫu bỏ `alt` không phải trang axe chọn) → đổi fixture 4:3 và phá đúng trang mẫu. Bài học: test xanh chưa chứng minh gì cho tới khi đã thấy nó đỏ.

### Quyền Public / luồng publish (mục E)
**Không phát hiện lộ dữ liệu** (30 test quyền + 2 test luồng publish). Test chỉ đọc cấu hình, không đổi quyền.

### Thời gian CI (run 41309920972)
`build` thêm ≈ 25 s (seed showcase 2 s, test quyền/publish 17 s). `site-checks` ≈ 3 phút 22 s tổng (cài Chromium 17 s, Playwright 40 s, Lighthouse 2 phút) — trong ngân sách ≤ ~5 phút.

### Số test
Vitest 102 → 120 (+18 độ bền thin client). `check-site` 15 test. Playwright 88 (44 × 2 viewport). Tích hợp 32.

### Changed / Unchanged / Product should verify (thay đổi chạm `apps/web`)
- **Changed:** `lightbox.ts` — chỉ thuộc tính `aria-label` của nút "100%"; `directus.ts` — timeout 15 s + lỗi JSON hỏng; seed showcase có thêm 3 thẻ (chỉ dev/CI).
- **Unchanged:** giao diện, CSS, nội dung hiển thị, Content Model, API Contract, quyền, hạ tầng deploy.
- **Product should verify:** (1) timeout 15 s có phù hợp với Directus trên máy chủ yếu khi build? (2) có làm favicon không (Backlog); (3) các job mới thành bắt buộc ở Sprint 13.

### Độ ổn định (tiêu chí 10 lần xanh)
**10/10 lần xanh liên tiếp, không flake.** Cùng commit `be30aad` (run 41310443193): lần chạy gốc + 9 lần rerun, cả `quality`, `build` và `site-checks` đều `success`, không step nào fail. Trước đó run `72ac3b3` cũng xanh. Đo ngày 01/11/2026.
