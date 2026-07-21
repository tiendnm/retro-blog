# 06 — API Implementation (Directus Binding)

> **Trạng thái:** 🟡 Draft (Sprint 2 Phase 3) · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chờ review)_
>
> 🎯 **Mục đích:** Mô tả *cách hiện thực* API Contract bằng backend được chọn — endpoint/truy vấn thật, xác thực, phân trang, caching ở tầng vận chuyển. Tầng RÌA, gắn công nghệ.
> 🔗 **Liên quan:** [03d-api-contract](./03d-api-contract.md) ← SSOT · [05-cms](./05-cms.md) · [08-deployment](./08-deployment.md) · [12-security](./12-security.md)

---

> ⚙️ **Tầng RÌA (IMPLEMENTATION — gắn transport).** Hợp đồng API *logic* là **nguồn sự thật** ở [03d-api-contract](./03d-api-contract.md); DTO định nghĩa ở đó. Tài liệu này **không định nghĩa lại** hợp đồng — chỉ ánh xạ sang endpoint/truy vấn cụ thể. Tuân [Nguyên tắc 0 & P3](./03a-architecture-principles.md).

## 0. Tầng truy cập DUY NHẤT (thin fetch client)

- Mọi truy cập Directus đi qua **một tầng client** duy nhất: [`apps/web/src/lib/directus.ts`](../apps/web/src/lib/directus.ts). **Page/component KHÔNG gọi Directus trực tiếp** (P3 — decoupling).
- Client **map** item Directus → **DTO** ([`types.ts`](../apps/web/src/lib/types.ts) khớp [03d §3](./03d-api-contract.md)). UI chỉ thấy DTO, không bao giờ chạm JSON gốc Directus → đổi CMS chỉ cần viết lại client, UI không đổi.

## 1. Giao thức & Chiến lược fetch

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Giao thức | **REST** (`/items/*`, `/assets/*`) | Đơn giản, đủ cho read-only blog |
| Chiến lược fetch | **SSG build-time** ([ADR-0006](./adr/0006-render-strategy.md)); dev = `astro dev` render on-demand | Route động dựng bằng `getStaticPaths` |
| Xác thực | **Public role — KHÔNG token** | Fetch server-side qua `DIRECTUS_INTERNAL_URL`; không nhúng secret ([12](./12-security.md)) |
| URL asset (ảnh) | `PUBLIC_DIRECTUS_URL/assets/<file-id>` | Nhúng vào HTML để **browser** tải |

> **Bảo mật nằm ở tầng permission, không ở client:** vì client gọi bằng vai Public, Directus tự lọc `status=published AND published_at ≤ $NOW` và **chỉ trả field trong allowlist** ([05-cms §2](./05-cms.md)). Client chỉ được xin field ⊆ allowlist, nếu không Directus trả `FORBIDDEN`.

## 2. Ánh xạ Contract → Endpoint

> Mỗi thao tác ở [03d §2](./03d-api-contract.md) → truy vấn REST thật + hàm client. KHÔNG định nghĩa lại DTO ([03d §3](./03d-api-contract.md)).

| Thao tác (03d) | Truy vấn Directus (Public) | Hàm client | DTO |
|---|---|---|---|
| Liệt kê bài published | `GET /items/posts?fields=<summary>&sort=-published_at&limit&offset&meta=filter_count` | `listPublishedPosts()` | `PostSummary[]` + `PageInfo` |
| Lấy bài theo slug | `GET /items/posts?filter[slug][_eq]=<slug>&fields=<detail>&limit=1` | `getPostBySlug()` | `PostDetail \| null` |
| Liệt kê theo Category | `GET /items/posts?filter[category][slug][_eq]=<slug>&fields=<summary>&sort=-published_at&limit&offset&meta=filter_count` | `listPostsByCategory()` | `PostSummary[]` + `PageInfo` |
| (SSG) slug bài/chuyên mục | `GET /items/{posts,categories}?fields=slug&limit=-1` | `getAllPublishedPostSlugs()` · `getAllCategorySlugs()` | `string[]` |

- **Không có filter `status`/`published_at` trong truy vấn** — Public role đã enforce (defense-in-depth: client quên cũng không lộ draft).
- **Media:** M2O `cover`/`avatar` → `{ url: PUBLIC_DIRECTUS_URL/assets/<id>, alt }`. `alt` từ field tuỳ biến trên `directus_files`.
- **`<summary>` / `<detail>`** = allowlist field khớp `PostSummary` / `PostDetail` (xem hằng `SUMMARY_FIELDS`/`DETAIL_FIELDS` trong client).

## 3. Phân trang / lọc / sắp xếp (hiện thực)

- **Phân trang** ([03d §4](./03d-api-contract.md)): `page`/`pageSize` → Directus `limit=pageSize` + `offset=(page-1)*pageSize`. `pageSize` **mặc định 10, tối đa 50** (clamp trong client); `page` tối thiểu 1. `total` lấy từ `meta.filter_count` (thêm `?meta=filter_count`); `hasMore = offset + len < total`.
- **Lọc:** published do Public role; theo category qua `filter[category][slug][_eq]`.
- **Sắp xếp:** `sort=-published_at` (mới nhất trước). Bài Public thấy luôn có `published_at` (rule yêu cầu `≤ $NOW`) nên không có vấn đề null.

## 4. Caching & Revalidation

- **SSG:** nội dung được "nướng" vào HTML tĩnh lúc `astro build` ([ADR-0006](./adr/0006-render-strategy.md)) → nhanh, cache tự nhiên ở tầng CDN/tĩnh. **Dev** (`astro dev`) render on-demand → publish thấy ngay.
- **Revalidate khi publish (production):** rebuild-on-publish qua CI/CD là **future work** (§6, [ADR-0006](./adr/0006-render-strategy.md)) — ngoài Sprint 2.

## 5. Xử lý lỗi & Fallback (hiện thực)

- Client dùng lớp lỗi `DirectusError { code: 'not_found' | 'system' }` ([03d §5](./03d-api-contract.md)):
  - HTTP **401/403/404** (vai Public) → `not_found` → `getPostBySlug`/`getCategoryBySlug` trả **`null`** (không lộ sự tồn tại của draft).
  - Network/5xx → `system` (ném lỗi → build fail rõ ràng thay vì render sai).
- Trang chi tiết chỉ dựng cho slug đã publish (`getStaticPaths`) ⇒ slug không hợp lệ → **404** tự nhiên của Astro.

## 6. Webhooks (kích hoạt rebuild)

- Publish → webhook → trigger build/deploy: **future work** ([ADR-0006](./adr/0006-render-strategy.md), [05-cms §6](./05-cms.md), [08-deployment](./08-deployment.md)). Không thuộc Sprint 2.
