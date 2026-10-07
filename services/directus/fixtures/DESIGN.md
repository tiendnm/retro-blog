# Fixture Framework — Design Spec (Sprint 4 · Phase 0)

> **Trạng thái:** 🟢 Chốt thiết kế (Phase 0) — *chưa code, chưa sinh dữ liệu*. Hiện thực: Phase 1.
> Kế hoạch: [../../../docs/sprints/sprint-4.md](../../../docs/sprints/sprint-4.md) · Content Model (đóng băng): [03c](../../../docs/03c-content-model.md) · Prose: Sprint 3.

Đặc tả này **chốt các quyết định** để Phase 1 hiện thực. Nguyên tắc: **framework độc lập Directus** (ports & adapters), **providers mở**, **tái lập** (deterministic + seed), **DEV-only**.

## 1. Kiến trúc (ports & adapters)

```
[ Fixture Content Model ]  ← kiểu dữ liệu trung lập (KHÔNG biết Directus)
          ▲
[ Generator ] ── dùng ──► [ ContentProvider ] (static | ai | future)
   (deterministic)   └──► [ CoverProvider ]   (none | manual | ai)
          │ sinh
          ▼
     [ Manifest + content files ]   ← artifact versioned (nguồn sự thật của slug)
          │ đọc
          ▼
[ Loader ]  ← ADAPTER DUY NHẤT phụ thuộc Directus (tạo/upload/reset qua REST)
```

- **Layer độc lập Directus:** Fixture Content Model · Generator · Providers · Manifest. → đổi backend chỉ cần viết **Loader** mới.
- **Layer phụ thuộc Directus:** chỉ **Loader** (+ reset).

## 2. Fixture Content Model (trung lập — phản chiếu [03c], KHÔNG field mới)

| Thực thể | Field (fixture) |
|---|---|
| `FixtureAuthor` | `key` · `name` · `slug` · `bio` |
| `FixtureCategory` | `key` · `name` · `slug` · `description?` · `parentKey?` |
| `FixturePost` | `key` · `slug` · `title` · `excerpt?` · `bodyPath` · `authorKey` · `categoryKey?` · `coverKey?` · `status` (`draft`/`published`) · `publishedAt?` · `set` · `edgeType?` |
| `FixtureCover` | `key` · `source` (`manual`/`ai`) · `pathOrPrompt` · `alt` |

> `key` = định danh nội bộ ổn định; `slug` = định danh public ổn định (§5). Không dùng khái niệm Directus ở layer này.

## 3. Providers (mở)

### ContentProvider — `produceBody/produceExcerpt/produceBio(skeleton, rng) → text`
- **`static`** *(mặc định)* — nội dung **gốc** từ template/curated bank, deterministic theo `rng`; không cần dịch vụ ngoài.
- **`ai`** — sinh bằng AI (adapter cắm sau; có thể stub).
- **`future`** — chỗ cắm provider tương lai.

### CoverProvider — `resolveCover(skeleton) → {pathOrPrompt, alt} | null`
- **`none`** *(mặc định)* — luôn `null` (Reader hỗ trợ text-only — Sprint 3).
- **`manual`** — ảnh do người cung cấp, map trong manifest.
- **`ai`** — ảnh AI **một phong cách thống nhất** (adapter cắm sau).

> Chọn qua cờ: `--content static|ai|future` · `--cover none|manual|ai`. **Không** hardcode AI, **không** SVG/placeholder mặc định.

## 4. Sets & Profiles

- **Sets (tách riêng, nạp/reset độc lập):** `normal` (dogfooding thật) · `edge` (ca biên UI) · `stress` (ép tải/giới hạn render).
- **Profiles (preset chọn set + số lượng):**

| Profile | Thành phần | Dùng cho |
|---|---|---|
| `small` | `normal` ~10 | CI smoke / **Batch 1 kiểm chứng framework** |
| `medium` | `normal` ~50 | Dev/QA |
| `large` | `normal` ~100 | Dogfooding + perf baseline |
| `stress` | `normal(large)` + `edge` + `stress` | Giới hạn UI/render/build |

## 5. Định danh ổn định + Seed (regression an toàn)

- **Slug DETERMINISTIC & ỔN ĐỊNH:** manifest (versioned) là **nguồn sự thật của slug**. Slug dẫn xuất ổn định (vd `slugify(title)` với title từ bank seeded, hoặc `${categorySlug}-${seq}`); **regenerate GIỮ NGUYÊN slug theo `key`** (không đổi route ⇒ regression/screenshot test không vỡ). Bài mới nhận slug deterministic mới.
- **Skeleton tách khỏi prose:** manifest giữ skeleton ổn định (key/slug/category/author/cover-flag/date/set/edgeType); chỉ **text** (body/excerpt) có thể làm mới.
- **Seed:** generator nhận `--seed <n>` → PRNG deterministic (vd mulberry32). **Cùng seed + profile ⇒ cùng manifest + cùng lựa chọn nội dung**. **Cấm** `Date.now()`/`Math.random()` trong generator; `publishedAt` = base-date cố định + offset deterministic.
- **Kiểm chứng:** generate 2 lần cùng seed ⇒ manifest **giống hệt**; load→reset→load ⇒ slug **không đổi**.

## 6. Loader (adapter Directus) & Commands

- **Loader** (idempotent): tạo authors/categories (theo key→slug), upload cover (nếu có) + `alt`, tạo posts; **reset theo slug/manifest** (KHÔNG đụng content khác).
- **DEV-only guard:** chỉ chạy khi `DIRECTUS_URL` = localhost hoặc có cờ `--yes`; **không** tự chạy khi deploy.
- **Commands:**
  - `fixtures:generate --set <s> --profile <p> --seed <n> --content <cp> --cover <cv>`
  - `fixtures:load --profile <p>` (hoặc `--set <s>`) `[--yes]`
  - `fixtures:reset [--set <s>] [--yes]`

## 7. Nội dung (chốt)

- **Taxonomy (10 category — theo ĐỐI TƯỢNG phần cứng/phần mềm):** `cpu` · `mainboard` · `gpu` · `memory` · `storage` · `operating-system` · `software` · `sound` · `peripheral` · `networking`.
  - ⚠️ **Review/Tutorial/Build Log/History = *article type*, KHÔNG phải category** (content model không có field "type" — không mô hình hoá).
  - Giữ **≥1 category thưa/rỗng** (vd `networking`) để test empty-state.
- **Author:** **1 chính** (+ tối đa 1 phụ), `bio` gốc; avatar theo cover provider (mặc định none).
- **`normal`:** đa dạng category/độ dài (ngắn 30% · vừa 50% · dài 20%), đa số published + ~5 draft; `published_at` rải; phủ `.prose` (≥15 code · ≥10 table · ≥15 blockquote · ≥10 image · ≥20 nested list).
- **`edge`:** title rất dài · không cover · không category · nested list ≥4 cấp · ≥12 heading · slug dài · excerpt rỗng · unicode nặng · một-từ-siêu-dài · đoạn chỉ ảnh · nhiều link.
- **`stress`:** markdown rất dài (5000+ từ) · bảng rất rộng (nhiều cột) · code block rất lớn (dòng dài + nhiều dòng) · số lượng lớn (perf).
- **Chất lượng:** KHÔNG Lorem/KHÔNG copy; gốc, tiếng Việt, đọc được; UTF-8 (file + Node). **DEV fixture** — không phải tri thức chính thống.

## 8. Bố cục file (Phase 1 hiện thực)

```
services/directus/fixtures/
  framework/                 # ĐỘC LẬP Directus
    model.mjs                # kiểu Fixture Content Model
    rng.mjs                  # PRNG seeded (deterministic)
    generator.mjs            # sinh manifest + gọi providers
    profiles.mjs             # preset small/medium/large/stress
    providers/
      content/{static,ai,future}.mjs
      cover/{none,manual,ai}.mjs
  loader/                    # ADAPTER Directus (chỉ đây phụ thuộc Directus)
    load.mjs · reset.mjs
  content/                   # OUTPUT versioned
    normal/ · edge/ · stress/   # manifest.json + body/*.md (+ cover nếu manual/ai)
  DESIGN.md                  # (tài liệu này)
```

## 9. Batch plan

- **Batch 1 (Phase 1): `normal` ~10** — mục tiêu **kiểm chứng framework** (generate · load · reset · **regenerate** · **deterministic**), *không* test UI.
- **Phase 2:** `normal` medium ~50 → large ~100 (qua command).
- **Phase 3:** `edge` + `stress` (tách riêng).

---

> ✅ Phase 0 chốt thiết kế. **Chưa code.** Chờ review trước khi sang Phase 1 (hiện thực framework + Batch 1 ~10).
