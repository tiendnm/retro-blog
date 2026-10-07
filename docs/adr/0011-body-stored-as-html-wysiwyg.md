# ADR-0011 — Lưu `posts.body` dạng HTML (WYSIWYG) thay cho Markdown

> **Status:** Accepted <!-- 2026-10-06 -->
> **Ngày đề xuất:** 2026-10-06 · **Ngày Accepted:** 2026-10-06
> **Người quyết định:** Product
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) — kiểu trung lập `rich-text` ở [03c](../03c-content-model.md) **không đổi**; chỉ đổi định dạng lưu ở tầng RÌA. Thay thế quyết định `[S2-P3]` (render Markdown bằng `marked`) ở [10-decisions](../10-decisions.md).

---

## Bối cảnh (Context)

`body` lưu markdown (interface `input-rich-text-md`), web render bằng `marked`. Editor không phải WYSIWYG thật (khung markdown + preview), khó dùng với người viết không quen markdown.

## Quyết định (Decision)

- Đổi interface `posts.body` sang **`input-rich-text-html`** (WYSIWYG TinyMCE native của Directus). Cột vẫn `text` → **không migrate schema**. Toolbar giới hạn theo thứ có style trong `.prose`: h2–h4, bold/italic/strike, list, blockquote, link, image, table, hr, source, removeformat, undo/redo, fullscreen (**không h1** — trang đã có `<h1>` tiêu đề).
- Dữ liệu lưu là **HTML**. Web **bỏ `marked`**, render `post.body` qua `set:html`.
- **Ghi đè** dữ liệu cũ, **không** giữ cột markdown (Product quyết định). Script một-lần, idempotent: `services/directus/migrate-body-to-html.mjs`.
- Seed/fixtures vẫn soạn bằng markdown, chuyển HTML khi ghi (`services/directus/lib/md-to-html.mjs`). `marked` chuyển sang **devDependency** của `apps/web` (chỉ phục vụ script dữ liệu, không vào runtime site).

## Hệ quả (Consequences)

- ➕ Người viết dùng WYSIWYG thật, không cần biết markdown.
- ➕ Render đã kiểm chứng: HTML trang chi tiết của 3 bài seed **giống hệt** trước/sau migration.
- ➖ **Không hoàn tác bằng dữ liệu:** markdown gốc bị ghi đè; quay lại markdown cần chuyển ngược HTML→MD (mất định dạng). Khuyến nghị backup trước khi chạy migration trên môi trường có dữ liệu thật.
- ➕ Ảnh/tệp chèn trong bài có thể lưu URL tuyệt đối theo domain CMS lúc soạn → **viết lại lúc build** (`apps/web/src/lib/rewrite-assets.ts`, gọi trong `toDetail`) thành `PUBLIC_DIRECTUS_URL` hiện hành; đổi domain CMS không làm hỏng ảnh. Chỉ xử lý thuộc tính `src/href/poster` trỏ `/assets/<uuid>`; URL ngoài giữ nguyên.
- ➖ HTML tự do hơn markdown → bề mặt XSS lớn hơn. Hiện chấp nhận (Editor tin cậy); **sanitize** là bắt buộc trước khi có tác giả không tin cậy ([12-security §8](../12-security.md)) — **đã xử lý ở [ADR-0013](./0013-sanitize-body-html.md)**.
- ➖ Fixtures `stress/edge` mô phỏng "markdown dài" nay là HTML sinh từ markdown; HTML do TinyMCE sinh có thể khác (chưa kiểm).

## Khả nghịch

Trung bình: đổi interface lại + render lại bằng `marked`, nhưng dữ liệu đã là HTML.
