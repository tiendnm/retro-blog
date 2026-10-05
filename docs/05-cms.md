# 05 — CMS Mapping (Directus) — Implementation

> **Trạng thái:** 🟡 Draft · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chờ review)_
>
> 🎯 **Mục đích:** Mô tả *cách hiện thực* Content Model trên CMS được chọn — collections, interface field, phân quyền, workflow. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03c-content-model](./03c-content-model.md) ← SSOT · [03b-domain-model](./03b-domain-model.md) · [12-security](./12-security.md) · [06-api](./06-api.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn CMS).** Content Model *trung lập CMS* là **nguồn sự thật** ở [03c](./03c-content-model.md); máy trạng thái ở [03b](./03b-domain-model.md). Tài liệu này **không định nghĩa lại** loại nội dung/field — chỉ mô tả ánh xạ sang Directus.

## 0. Schema-as-code (artifact chính thức)

- Content model được version-control dưới dạng **Directus schema snapshot**: [`services/directus/snapshots/schema.yaml`](../services/directus/snapshots/schema.yaml).
- **Tái tạo schema** trên một Directus (volume trống): `pnpm schema:apply` (hoặc `docker compose exec directus npx directus schema apply --yes //directus/snapshots/schema.yaml`).
- Snapshot **không** phụ thuộc export thủ công UI; là nguồn tái lập cho mọi môi trường. Cập nhật schema → export lại snapshot & commit.

> 🧪 **Dữ liệu dev:** seed tối thiểu `services/directus/seed/seed-dev.mjs` (`pnpm seed:dev`) · **seed showcase có ảnh** `seed-showcase.mjs` (`pnpm seed:showcase`, chạy sau seed:dev; ảnh demo ở `seed/images/`, nguồn Picsum/Unsplash + retro grade — `build-images.py`) · **Fixture dogfooding** (dataset ~100 bài + edge/stress, deterministic, DEV-only) ở `services/directus/fixtures/` — xem [DESIGN.md](../services/directus/fixtures/DESIGN.md) (Sprint 4). Loader là adapter Directus duy nhất; generator/content độc lập backend.

## 1. Ánh xạ Content Type → Collection (Sprint 2)

> Ánh xạ từ [03c §2](./03c-content-model.md). **Tag: ngoài Sprint 2.**

### `posts` ← Post ([03c §2.1](./03c-content-model.md))
| Field (03c) | Directus type | Interface | Ghi chú |
|---|---|---|---|
| title | string | input | required |
| slug | string | input | required, **unique**; auto-slugify (`options.slug`) + help note (S6.5) |
| excerpt | text | input-multiline | help note: dùng cho list + SEO description (S6.5) |
| body | text | input-rich-text-html (WYSIWYG) | lưu **HTML**; toolbar giới hạn, không h1 ([ADR-0011](./adr/0011-body-stored-as-html-wysiwyg.md)) |
| status | string | select-dropdown | choices **draft/published**, default `draft`; help note (S6.5) |
| published_at | timestamp | datetime | help note: để trống → auto-set khi publish (Flow C1, S6.5) |
| author | uuid (M2O) | select-dropdown-m2o → `authors` | required; on_delete NO ACTION |
| category | uuid (M2O) | select-dropdown-m2o → `categories` | on_delete SET NULL |
| cover | uuid (M2O) | file-image → `directus_files` | on_delete SET NULL |

### `authors` ← Author ([03c §2.2](./03c-content-model.md))
| name (string, req) · slug (string, req, unique) · bio (text) · avatar (M2O → `directus_files`) |

### `categories` ← Category ([03c §2.3](./03c-content-model.md))
| name (string, req) · slug (string, req, unique) · description (text) · parent (M2O → `categories`, phân cấp, on_delete SET NULL) |

### `site_settings` ← SiteSettings ([03c §2.6](./03c-content-model.md)) — **singleton** ([ADR-0012](./adr/0012-site-settings-singleton.md))
| site_name (string, req, default "Retro Blog") · description (text) · footer_text (string, `{year}`) · default_og_image (M2O → `directus_files`, SET NULL) — khoá chính `id` integer (singleton) |

### Media ← Media ([03c §2.5](./03c-content-model.md))
- **Dùng Directus Files (`directus_files`, built-in)** — *không tạo Media collection riêng*.
- Thêm field tuỳ biến: **`alt`** (string — a11y; **`required` ở form editor** từ S6.5, R6) · **`caption`** (string).
- Post.cover / Author.avatar tham chiếu `directus_files`.

> Mọi collection dùng khoá chính `id` kiểu **uuid** (auto-generate), **trừ `site_settings`** (singleton, `id` integer).

## 2. Phân quyền (Roles & Permissions)

> Directus 11 dùng mô hình **role → policy → permissions**. Public là *policy mặc định* (`$t:public_label`) gắn với access-row `role=null, user=null`; Admin/Editor là role gắn policy tương ứng.

### 2.1. Ma trận phân quyền

| Collection | **Public** (read-only) | **Editor** (`app_access`) | **Admin** (`admin_access`) |
|---|---|---|---|
| `posts` | read — **lọc `status=published` AND `published_at ≤ $NOW`**; field: `id,title,slug,excerpt,body,published_at,author,category,cover` | create · read · update · delete | full |
| `authors` | read (mọi hàng); field: `id,name,slug,avatar` | create · read · update · delete | full |
| `categories` | read (mọi hàng); field: `id,name,slug` | create · read · update · delete | full |
| `directus_files` | read (mọi hàng); field: `id,alt` *(đủ cho `/assets/<id>` + a11y)* | create · read · update · delete | full |
| `directus_users`, `directus_roles`, `directus_policies` | — | — *(chỉ app-baseline: xem hồ sơ của chính mình; **không** tạo/sửa/xoá)* | full |

- **`$NOW`** = biến thời gian động của Directus → thực thi được yêu cầu "chỉ nội dung đã publish **và đã tới giờ**" (lịch phát hành cơ bản) ngay trong rule, không cần job nền.
- **Field allowlist (không `*`):** Public chỉ đọc đúng field cần cho hợp đồng [03d](./03d-api-contract.md). Field nội bộ thêm về sau (vd `internal_notes`, `status`) **không tự động lộ** — xin field ngoài allowlist → Directus trả `FORBIDDEN`. Đây là ranh giới chống-lộ (Sprint 2 Phase 3).
- **Editor không quản trị user/role/policy** (không `admin_access`); chỉ thao tác nội dung. **Public không có** create/update/delete ở bất kỳ collection nào; không frontend auth, không public CMS users.
- `site_settings` (singleton): Public đọc **4 field** `site_name`/`description`/`footer_text`/`default_og_image`; Editor **read + update** (không create/delete). Sửa → Flow rebuild-on-publish kích hoạt rebuild.
- `authors`/`categories`/`directus_files` cho Public đọc **mọi hàng** (dữ liệu tham chiếu để render bài) nhưng **giới hạn field** như trên — không lộ `bio`/`description`/`parent`…

### 2.2. Tái lập (reproducible) — **không thao tác thủ công**

> ⚠️ Directus schema snapshot **KHÔNG** bắt roles/policies/permissions. Vì vậy phân quyền được version-control ở **script tái lập**: [`services/directus/apply-permissions.sh`](../services/directus/apply-permissions.sh).

- Áp dụng: `pnpm permissions:apply` (sau khi Directus healthy & `pnpm schema:apply`). Script **idempotent** (bỏ qua phần đã cấu hình), dùng Admin API bằng `ADMIN_EMAIL`/`ADMIN_PASSWORD` từ `.env`.
- Kết hợp: `schema.yaml` (collections/fields/relations) **+** `apply-permissions.sh` (roles/policies/permissions) = tái lập đầy đủ CMS trên môi trường trống. Chi tiết bảo mật: [12-security §3](./12-security.md).

## 3. Workflow biên tập (draft → published)

Theo máy trạng thái [03b §4](./03b-domain-model.md); field `status` (enum `draft`/`published`, mặc định `draft`) tạo ở Phase 1.

1. Editor **tạo bài** → mặc định `status=draft`, `published_at` trống → **Public không thấy**.
2. Editor **xuất bản**: đặt `status=published` **và** `published_at` = thời điểm phát hành.
   - `published_at ≤ hiện tại` → Public **thấy** ngay.
   - `published_at` ở **tương lai** → Public **chưa thấy** cho tới khi tới giờ (lịch phát hành cơ bản, do rule `$NOW` đảm nhiệm — SSG cần rebuild để phản ánh, xem [ADR-0006](./adr/0006-render-strategy.md)).
3. Editor **gỡ công khai**: chuyển `published → draft` → Public không còn thấy.

> **Ngoài Sprint 2:** trạng thái `in-review`, scheduled-publish nâng cao (tự rebuild đúng giờ), phê duyệt nhiều cấp.

## 4. Preview bản nháp

- Ngoài Sprint 2 (Nice). TODO khi cần.

## 5. Media & Assets

- Lưu trữ qua Directus Files (volume `directus_uploads`). Alt bắt buộc (a11y [15](./15-seo-accessibility.md)). Tối ưu ảnh nâng cao: ngoài Sprint 2.

## 6. Flows / Webhooks / Automation

- **Rebuild-on-publish** (webhook → build) là *future work* theo [ADR-0006](./adr/0006-render-strategy.md) — không thuộc Sprint 2.

## 7. Cấu hình & Môi trường (không chứa secret)

- Biến môi trường ở [`.env.example`](../.env.example) (DB, KEY/SECRET, ADMIN_*). Secrets: [12-security](./12-security.md).
