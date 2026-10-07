# ADR-0013 — Sanitize HTML `posts.body` lúc build (allowlist)

> **Status:** Accepted <!-- 2026-10-07 -->
> **Ngày đề xuất:** 2026-10-07 · **Ngày Accepted:** 2026-10-07
> **Người quyết định:** Product (chọn xử lý từ Backlog Sprint 6 → Hardening)
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) — chỉ thêm bước ở thin client, DTO/`03c`/`03d` **không đổi**; defense-in-depth (bảo mật không chỉ dựa vào việc Editor tin cậy).

---

## Bối cảnh (Context)

[ADR-0011](./0011-body-stored-as-html-wysiwyg.md) lưu `body` dạng HTML và render qua `set:html` — bề mặt XSS lớn hơn markdown. Khi đó chấp nhận vì Editor tin cậy, kèm cam kết sanitize trước khi có tác giả không tin cậy. Tài khoản Editor bị chiếm hoặc dán HTML lạ từ nguồn ngoài vẫn có thể đưa script vào trang public.

## Quyết định (Decision)

- Thêm `apps/web/src/lib/sanitize-body.ts` dùng **`sanitize-html`** (thuần JS, chạy lúc build SSG, không cần DOM), gọi trong `toDetail` **trước** `rewriteAssetUrls`.
- **Allowlist thẻ** bám toolbar TinyMCE: h2–h4, p, br, hr, strong/b, em/i, u, s/strike/del, sub/sup, ul/ol/li, blockquote, pre/code, a, img, figure/figcaption, table (+ thead/tbody/tfoot/tr/th/td/caption/colgroup/col). `h1` bị bỏ thẻ (giữ chữ) vì trang đã có `<h1>`.
- **Thuộc tính:** `a[href,title,target,rel]`, `img[src,alt,title,width,height,loading]`, `th/td[colspan,rowspan]`, `id`; `class` chỉ dạng `language-*` trên `pre/code`. **Không** `style`, không `on*`.
- **Scheme:** `http/https/mailto/tel`; `img` chỉ `http/https`; chặn `javascript:`, `data:`, protocol-relative. `target="_blank"` tự thêm `rel="noopener noreferrer"`.
- Bỏ cả nội dung của `script/style/textarea/option/noscript/iframe/object/embed`. Không cho `iframe/video/svg/form` (chưa có nhu cầu — thêm khi Product yêu cầu, kèm allowlist host).

## Hệ quả (Consequences)

- ➕ Script/handler/URL nguy hiểm bị loại ở build; không tăng chi phí runtime (SSG).
- ➕ Verify: build 23 bài seed cho HTML **tương đương** trước/sau (chỉ khác `<img />` và `&quot;`→`"`, vô hại).
- ➖ Thêm dependency runtime-build `sanitize-html` (+ `@types/sanitize-html` dev).
- ➖ Căn chỉnh qua `style="text-align"` và kích thước inline của TinyMCE bị loại; cần thì thêm `allowedStyles` có chọn lọc.
- ➖ Chưa có unit test cho allowlist — thuộc Sprint 7 Phase 2 (Vitest).

## Khả nghịch

Dễ: bỏ một lời gọi trong `toDetail`.
