# 🏗️ Sprint 4 — Implementation Plan (Fixture Framework & Dogfooding)

> **Trạng thái:** 🟢 **Đã duyệt hướng (kèm điều chỉnh) — sẵn sàng Phase 0** · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-22 · **Người duyệt:** Product
>
> 🎯 **Mục tiêu Sprint 4:** xây **Fixture Framework** (tái lập, có profile) để nạp/sinh dữ liệu dogfooding; **generate content là command độc lập**, không phải phần cố định của Sprint.
> 🔗 **Nguồn:** [02-roadmap](../02-roadmap.md) · [03c-content-model §2](../03c-content-model.md) · [03d-api-contract §4](../03d-api-contract.md) (phân trang) · [05-cms](../05-cms.md) · [Sprint 2 seed](./sprint-2-completion-report.md) · [Sprint 3 `.prose`](./sprint-3-completion-report.md).

---

> 🔒 **Ranh giới:** Sprint 4 là **công cụ + DỮ LIỆU (fixture) ở tầng RÌA** — dùng **đúng** Content Model ([03c](../03c-content-model.md)), API ([03d](../03d-api-contract.md)), thin client & Reader (`apps/web`) **hiện có**. **KHÔNG** thêm content type/field, **KHÔNG** đổi API/DTO/kiến trúc, **KHÔNG** sửa Reader.

## 1. Goal

Sản phẩm chính là **Fixture Framework** (bền vững, tái dùng): sinh & nạp dữ liệu fixture **tái lập được**, theo **profile** (small/medium/large/stress), **tách bộ** (normal/edge/stress), **providers mở** (content: static/ai/future · cover: none/manual/ai), **định danh ổn định + seed** để regression không đổi. **Generator độc lập Directus** (chỉ Loader phụ thuộc backend). **Nội dung là output của command** (`fixtures:generate`), không phải phần cố định của Sprint. Kèm một **dataset tham chiếu** đủ để dogfood & chứng minh framework.

## 2. Ảnh hưởng kiến trúc

| Khía cạnh | Ảnh hưởng |
|---|---|
| **Content Model** ([03c](../03c-content-model.md)) | ❌ Không — dùng Post/Author/Category/`directus_files`; **không field mới** |
| **API** ([03d](../03d-api-contract.md)) | ❌ Không |
| **Architecture** | ❌ Không — công cụ dev + dữ liệu (RÌA); không đổi port/contract |
| **Reader** (`apps/web`) | ❌ Không sửa |

## 3. Fixture Framework (deliverable chính)

### 3.1. Tách **Framework** vs **Content** + **độc lập Directus**
- **Framework** = engine sinh + loader + reset + provider + profile + manifest + định danh + seed. **Là phần Sprint xây.**
- **Content** = output chạy `fixtures:generate` (theo profile/set/seed). **Command độc lập** — chạy/mở rộng/regenerate bất cứ lúc nào (CI/local), **không** cố định trong Sprint.
- **Độc lập Directus (ports & adapters):** **Generator** + **Content Model của fixture** (kiểu dữ liệu trung lập) **KHÔNG** phụ thuộc Directus; **chỉ Loader** là adapter phụ thuộc Directus. ⇒ đổi backend chỉ cần viết Loader mới, tái dùng generator/content.

### 3.2. Bộ fixture **tách riêng** (không trộn chung)
| Set | Mục đích | Đặc điểm |
|---|---|---|
| `normal` | Nội dung thực tế cho dogfooding | Bài retro-computing đọc được, đa dạng category/độ dài/cover |
| `edge` | Soi UI với ca biên | title rất dài · không cover · không category · nested list sâu · nhiều heading · slug dài · excerpt rỗng · ký tự đặc biệt… |
| `stress` | Ép tải/hiệu năng & giới hạn render | markdown rất dài · **bảng rất rộng** · **code block rất lớn** · số bài lớn |

> Mỗi set **nạp/reset độc lập**; không trộn để kết quả test rõ ràng.

### 3.3. **Profile** (small / medium / large / stress) — cho CI & local
| Profile | Thành phần | Dùng cho |
|---|---|---|
| `small` | `normal` (~10–20) | CI smoke nhanh, local nhẹ |
| `medium` | `normal` (~50) | Dev/QA thường ngày |
| `large` | `normal` (~100) | Dogfooding đầy đủ, perf baseline |
| `stress` | `normal(large)` + `edge` + `stress` | Kiểm giới hạn UI/render/build |

> Profile chỉ là **preset** chọn set + số lượng; chọn qua cờ: `fixtures:load --profile <p>`.

### 3.4. **Providers mở** (không phụ thuộc một cách sinh duy nhất)
- **Content Provider** — `produceBody(postSkeleton, rng) → markdown`:
  - **`static`** — nội dung gốc từ template/curated (deterministic; không cần dịch vụ ngoài).
  - **`ai`** — sinh bằng AI.
  - **`future`** — chỗ cắm provider tương lai.
- **Cover Provider** — `resolveCover(postSkeleton) → file | null`:
  - **`none`** (mặc định; Reader đã hỗ trợ text-only) · **`manual`** (ảnh cung cấp, map trong manifest) · **`ai`** (ảnh AI, một phong cách thống nhất).
- Chọn qua cờ (`--content static|ai|future`, `--cover none|manual|ai`). **Không** hardcode AI, **không** SVG/placeholder mặc định. Framework không lệ thuộc một cách sinh nội dung/ảnh duy nhất.

### 3.5. **Định danh ổn định + seed** (regression an toàn)
- **Slug & định danh test-phụ-thuộc là DETERMINISTIC** (dẫn xuất từ khoá ổn định trong manifest, **không** ngẫu nhiên) ⇒ **regenerate không đổi slug/route** ⇒ regression/screenshot test không vỡ.
- **Manifest (skeleton) tách khỏi prose:** skeleton (slug/category/author/cover-flag/date/set/loại-edge) ổn định; chỉ **text** có thể làm mới.
- **Seed cho ngẫu nhiên:** generator nhận `--seed <n>`; **cùng seed + profile ⇒ cùng dataset** (kể cả lựa chọn ngẫu nhiên). Seed mặc định cố định.

### 3.6. Command (DEV-only)
- `fixtures:generate --set <s> --profile <p> --seed <n> --cover <provider>` → sinh/cập nhật fixture files.
- `fixtures:load --profile <p>` (hoặc `--set`) → nạp vào Directus (idempotent).
- `fixtures:reset [--set <s>]` → **xoá theo slug/manifest** (không đụng content khác).
- **Guard DEV-only:** chỉ chạy khi `DIRECTUS_URL` localhost hoặc có `--yes`; không tự chạy khi deploy.

## 4. Fixture Content (thiết kế nội dung)

### 4.1. Taxonomy — **theo đối tượng phần cứng/phần mềm** (không phải dạng bài)
`cpu` · `mainboard` · `gpu` · `memory` (RAM/Bộ nhớ) · `storage` · `operating-system` · `software` · `sound` (Âm thanh) · `peripheral` (Ngoại vi) · `networking` (Mạng). ~10 category **chủ thể**.
> ⚠️ **Review / Tutorial / Build Log / History là *article type*, KHÔNG phải category.** Content model hiện **không có field "type"** (đóng băng) ⇒ **không** mô hình hoá chúng thành category. Giữ ≥1 category **thưa/rỗng** để test empty-state.

### 4.2. Author — **tối giản 1–2** (sát hiện tại)
1 chính (+ tối đa 1 phụ), `bio` gốc. Avatar theo cover provider (mặc định none).

### 4.3. `normal` set — đa dạng + phủ `.prose`
| Trục | Phân bố |
|---|---|
| Category | Không đều + 1 thưa/rỗng |
| Cover | Theo provider (`none` mặc định); nếu `manual/ai` → tập con có cover |
| Độ dài | Ngắn ~30% · Vừa ~50% · Dài ~20% |
| Trạng thái | đa số published + ~5 draft (ẩn) |
| `published_at` | Rải nhiều tháng (sort/pagination) |
| Phủ `.prose` | ≥15 code · ≥10 table · ≥15 blockquote · ≥10 image · ≥20 nested list |

### 4.4. `edge` set (tách riêng) — §3.2.
### 4.5. `stress` set (tách riêng) — §3.2 (markdown rất dài, bảng rất rộng, code rất lớn, số lượng lớn).

### 4.6. Chất lượng & lớp sinh
- **KHÔNG Lorem Ipsum. KHÔNG copy Internet.** Gốc, tiếng Việt, đọc được. **UTF-8** qua file + Node.
- **Sinh theo LỚP:** (1) metadata → (2) body → (3) bài rất dài/edge/stress (lớp cuối).
- **DEV FIXTURE**, không phải tri thức chính thống; không phát hành như nội dung thật.

## 5. Phủ kiểm thử

| Mục tiêu | Phục vụ bởi |
|---|---|
| Homepage | `normal` nhiều bài (>pageSize) → list thật, nhiều trang |
| Category | Nhiều category chênh lệch + 1 rỗng + ≥1 nhiều trang |
| Pagination *(UI = backlog B4)* | Tổng ≫ pageSize ([03d §4](../03d-api-contract.md)) → test API + **phơi bày nhu cầu UI** |
| Reading experience | `normal` (dài) + `edge`/`stress` phủ đủ `.prose` |
| Search / SEO *(sau)* | Title/nội dung/metadata đa dạng |
| Performance | `large`/`stress` → build N trang, thời gian build, tải ảnh |

## 6. Scope / Out of scope

### ✅ Scope
1. **Fixture Framework** (§3): sets · profiles · cover provider (none/manual/ai) · định danh ổn định + seed · commands DEV-only.
2. Thiết kế content (§4): taxonomy chủ thể, author tối giản, ma trận `normal`, bộ `edge`/`stress`.
3. **Dataset tham chiếu** đủ dogfood (chạy command theo profile).
4. Dogfooding verify (§8).

### ⛔ Out of scope
- **KHÔNG** thêm content type/field; đổi API/DTO/kiến trúc/Reader.
- **KHÔNG** hiện thực Pagination UI / Search / SEO (chỉ chuẩn bị & phơi bày nhu cầu).
- **KHÔNG** deploy/production; **KHÔNG** ảnh cover Internet; **KHÔNG** SVG/placeholder mặc định.
- **KHÔNG** dùng nội dung như tri thức/nội dung thật phát hành.

## 7. Phase breakdown

> Sprint-gated: mỗi phase 1 commit trên `main`, **dừng chờ review**.

### Phase 0 — Design & decisions
- Chốt kiến trúc framework (sets/profiles/provider/seed/manifest & lược đồ định danh), taxonomy chủ thể, author (1–2), danh sách edge/stress. → Decision Log. *(Chưa code, chưa sinh dữ liệu.)*

### Phase 1 — **Fixture Framework** (engine + commands)
- Xây generator engine (**độc lập Directus**) + **Content/Cover provider interface** (`content: static`(+`ai`/`future` stub); `cover: none`+`manual`(+`ai` stub)) + **Loader** (adapter Directus) + reset, **profiles**, **tách set**, **định danh deterministic + `--seed`**, DEV-only guard.
- Kèm **Batch 1 rất nhỏ (`normal` ~10 bài)** — mục tiêu **kiểm chứng framework** (generate · load · reset · **regenerate** · **deterministic**), *không* nhằm test UI. Review.

### Phase 2 — **Content qua command** (`normal` → medium → large)
- Chạy `fixtures:generate` mở rộng `normal` (medium ~50 → large ~100); verify đa dạng + phủ `.prose` + **ổn định slug khi regenerate**. Review.

### Phase 3 — **Bộ `edge` & `stress`**
- Sinh `edge` + `stress` (tách riêng); ca cực đoan. Verify UI robustness (không vỡ/không cuộn ngang trang). Review.

### Phase 4 — Dogfooding verify + Sprint 4 Completion
- Kiểm thử đầy đủ theo §8 (gồm chạy profiles); **Sprint 4 Completion Report**.

## 8. Acceptance Criteria

- [ ] **Framework**: `fixtures:generate/load/reset` chạy được; **profiles** small/medium/large/stress hoạt động; **sets** normal/edge/stress nạp **độc lập**; **providers** chọn được (content `static|ai|future`, cover `none|manual|ai`); **Generator độc lập Directus** (chỉ Loader phụ thuộc); **DEV-only guard**.
- [ ] **Tái lập**: cùng `--seed`+profile ⇒ **cùng dataset**; **slug/định danh ổn định** qua regenerate (regression không đổi).
- [ ] **Pagination**: tổng > pageSize → API trả đúng `page/pageSize/total/hasMore` ([03d §4](../03d-api-contract.md)); ghi rõ giới hạn (trang hiện tại hiển thị **trang đầu**; Pagination UI = backlog B4).
- [ ] **Category rỗng** → empty-state đúng (không vỡ). **Category nhiều trang** & **Homepage nhiều trang** → phân trang API đúng.
- [ ] **Bài rất dài** → phủ đủ `.prose`, **không overflow ngang** (@390 & desktop). **Bài không cover** → text-only đúng (không placeholder).
- [ ] **Edge/Stress**: title rất dài / không category / bảng rất rộng / code block lớn / nested list sâu / nhiều heading → **không vỡ layout, không cuộn ngang trang** (code/table cuộn trong khung).
- [ ] Reset **chỉ theo slug/manifest**; `astro build` ra N trang không lỗi; **thời gian build** ghi nhận (perf baseline).
- [ ] **Không đổi** Content Model/API/DTO/Reader: `03c`/`03d`/`03e`/`apps/web/**`/`directus.ts`/`types.ts` **không** trong diff.

## 9. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Regenerate **đổi slug** | Regression/screenshot vỡ | Slug **deterministic** từ manifest; seed cố định (§3.5) |
| **Reset xoá nhầm** content thật | Mất dữ liệu | Reset **chỉ theo slug/manifest**; DEV-only guard |
| Hỏng **UTF-8** khi nạp | Nội dung lỗi | File UTF-8 + Node |
| **Cover AI** chi phí/độ nhất quán | Style lệch/tốn công | Provider mở; mặc định `none`; `ai` là adapter cắm sau |
| Ảnh cover **binary** trong repo | Phình repo | Chỉ khi `manual/ai`; giới hạn số lượng; thư mục riêng |
| **Scope creep** sang feature (pagination UI/search/SEO/sửa Reader) | Vỡ ranh giới | Fixture chỉ *chuẩn bị & phơi bày nhu cầu*; bug UI từ edge/stress → **ghi backlog**, không tự sửa Reader |
| **Sai lệch facts** nội dung AI | Hiểu nhầm là tri thức | Đánh dấu DEV fixture; ưu tiên cấu trúc/đọc-được |

## 10. File dự kiến thay đổi

**Tạo mới:**
- `services/directus/fixtures/framework/**` — engine, loader, reset, **provider (none/manual/ai)**, profiles, manifest & định danh, seed.
- `services/directus/fixtures/content/**` — fixture data (theo set: `normal`/`edge`/`stress`; UTF-8) + (nếu `manual/ai`) ảnh cover.
- `docs/sprints/sprint-4-completion-report.md` (cuối sprint).

**Sửa:**
- `package.json` — `fixtures:generate` / `fixtures:load` / `fixtures:reset` (cờ `--set/--profile/--seed/--cover/--yes`).
- `docs/05-cms.md` (mục fixture/dogfooding — RÌA) · `README.md` (lệnh + trạng thái) · `docs/10-decisions.md` (Decision Log `[S4-*]`).

**KHÔNG đổi (đóng băng):**
- `docs/03c-content-model.md`, `docs/03d-api-contract.md`, `docs/03e-data-model.md` (LÕI).
- `apps/web/**` (Reader), `apps/web/src/lib/{directus,types}.ts`, `services/directus/apply-permissions.sh`, `services/directus/snapshots/schema.yaml`, `docker-compose.yml`.

---

> 🛑 **Chưa code, chưa sinh dữ liệu.** Plan đã cập nhật đủ 7 điểm. Khi anh xác nhận, tôi **commit plan rồi bắt đầu Phase 0** (Design & decisions), dừng chờ review theo từng phase.
