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

## 1. Ánh xạ Content Type → Collection (Sprint 2)

> Ánh xạ từ [03c §2](./03c-content-model.md). **Tag: ngoài Sprint 2.**

### `posts` ← Post ([03c §2.1](./03c-content-model.md))
| Field (03c) | Directus type | Interface | Ghi chú |
|---|---|---|---|
| title | string | input | required |
| slug | string | input | required, **unique** |
| excerpt | text | input-multiline | |
| body | text | input-rich-text-md | |
| status | string | select-dropdown | choices **draft/published**, default `draft` |
| published_at | timestamp | datetime | |
| author | uuid (M2O) | select-dropdown-m2o → `authors` | required; on_delete NO ACTION |
| category | uuid (M2O) | select-dropdown-m2o → `categories` | on_delete SET NULL |
| cover | uuid (M2O) | file-image → `directus_files` | on_delete SET NULL |

### `authors` ← Author ([03c §2.2](./03c-content-model.md))
| name (string, req) · slug (string, req, unique) · bio (text) · avatar (M2O → `directus_files`) |

### `categories` ← Category ([03c §2.3](./03c-content-model.md))
| name (string, req) · slug (string, req, unique) · description (text) · parent (M2O → `categories`, phân cấp, on_delete SET NULL) |

### Media ← Media ([03c §2.5](./03c-content-model.md))
- **Dùng Directus Files (`directus_files`, built-in)** — *không tạo Media collection riêng*.
- Thêm field tuỳ biến: **`alt`** (string — a11y, bắt buộc theo quy ước) · **`caption`** (string).
- Post.cover / Author.avatar tham chiếu `directus_files`.

> Mọi collection dùng khoá chính `id` kiểu **uuid** (auto-generate).

## 2. Phân quyền (Roles & Permissions) — **Phase 2**

> Sẽ hiện thực ở Sprint 2 Phase 2. Dự kiến: **Admin** (quản trị CMS), **Editor** (tạo/sửa/xuất bản posts/authors/categories/files; không quản lý user/role), **Public** (read-only, **chỉ `status=published`**). Không frontend auth, không public CMS users. Chi tiết: [12-security](./12-security.md).

## 3. Workflow biên tập — **Phase 2**

- Field `status` đã tạo (enum `draft`/`published`, mặc định `draft`) — Phase 1.
- Luật chuyển `draft → published` (+ `published_at`) và ai được phép: hiện thực ở Phase 2 theo [03b §4](./03b-domain-model.md). In-review/scheduled ngoài Sprint 2.

## 4. Preview bản nháp

- Ngoài Sprint 2 (Nice). TODO khi cần.

## 5. Media & Assets

- Lưu trữ qua Directus Files (volume `directus_uploads`). Alt bắt buộc (a11y [15](./15-seo-accessibility.md)). Tối ưu ảnh nâng cao: ngoài Sprint 2.

## 6. Flows / Webhooks / Automation

- **Rebuild-on-publish** (webhook → build) là *future work* theo [ADR-0006](./adr/0006-render-strategy.md) — không thuộc Sprint 2.

## 7. Cấu hình & Môi trường (không chứa secret)

- Biến môi trường ở [`.env.example`](../.env.example) (DB, KEY/SECRET, ADMIN_*). Secrets: [12-security](./12-security.md).
