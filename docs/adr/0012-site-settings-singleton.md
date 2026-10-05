# ADR-0012 — Cấu hình site động qua singleton `site_settings` trong CMS

> **Status:** Accepted <!-- 2026-10-06 -->
> **Ngày đề xuất:** 2026-10-06 · **Ngày Accepted:** 2026-10-06
> **Người quyết định:** Product
> **Nguyên tắc tuân thủ (Principles):** P6 (Low coupling) — thêm content type trung lập `SiteSettings` ([03c §2.6](../03c-content-model.md)), UI chỉ thấy DTO ([03d §3.3](../03d-api-contract.md)); P4 (config tách khỏi code) cho phần *nội dung* của site. Additive — không đổi DTO/contract cũ.

---

## Bối cảnh (Context)

Tên site, mô tả mặc định, chữ footer và ảnh chia sẻ mặc định bị **hardcode** ở ~10 chỗ trong web ("Retro Blog"). Product muốn các giá trị kiểu này **cấu hình động** trong CMS thay vì sửa code.

## Quyết định (Decision)

- Thêm collection **singleton `site_settings`** trong Directus: `site_name` (bắt buộc), `description`, `footer_text` (hỗ trợ `{year}`), `default_og_image` (→ `directus_files`).
- Web đọc qua thin client `getSiteSettings()` → DTO `SiteSettings`, **luôn có giá trị** (fallback về mặc định cũ khi chưa có bản ghi/field trống/chưa có quyền ⇒ không đổi hành vi nếu chưa cấu hình). Build cache 1 lần; dev đọc mới mỗi lần.
- **Public** chỉ đọc 4 field trên (allowlist); **Editor** đọc + sửa (không create/delete — singleton). Cấp quyền trong `apply-permissions.sh` (block idempotent riêng, chạy lại được trên môi trường cũ).
- Flow **rebuild-on-publish** (ADR-0008) thêm `site_settings` vào danh sách collection → sửa cấu hình tự kích hoạt rebuild. Môi trường đã triển khai cần chạy lại `pnpm rebuild:flow`.

**Ngoài phạm vi (cố ý):** *không* đưa vào bảng này các giá trị hạ tầng/bí mật — `PUBLIC_URL`/`PUBLIC_SITE_URL`, `KEY`/`SECRET`, `DB_*`: Directus cần chúng lúc khởi động (không thể đọc từ DB của chính nó), `astro.config` đọc `site` trước khi gọi CMS, và secret không nên nằm trong DB. Cũng chưa làm: page size, social links, tagline (chưa có UI dùng — thêm khi cần).

## Hệ quả (Consequences)

- ➕ Đổi tên/mô tả/footer/ảnh OG không cần sửa code.
- ➕ Trang không có mô tả riêng nay có `meta description` mặc định từ settings (trước đó không có thẻ) — cải thiện SEO nhỏ, không đổi nội dung đã có.
- ➖ SSG: thay đổi chỉ hiện sau **rebuild** (tự động nhờ Flow, nhưng chậm hơn sửa tức thời).
- ➖ Thêm một lần gọi API lúc build (đã cache) và một collection cần backup (nằm trong DB nên đã được `db.dump` phủ).
- ➖ Thêm quyền Public mới → cập nhật bảng allowlist ở [12-security](../12-security.md)/[05-cms](../05-cms.md).

## Khả nghịch

Cao: bỏ collection + khôi phục chuỗi hardcode (giá trị mặc định đã nằm trong `directus.ts`).
