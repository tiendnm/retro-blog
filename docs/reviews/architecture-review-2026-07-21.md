# 🏛️ Architecture Review Report — Hệ thống tài liệu Retro Blog

> **Ngày:** 2026-07-21 · **Người review:** Software Architect · **Phạm vi:** toàn bộ `docs/` (23 file) · **Loại:** review-only (KHÔNG sửa tài liệu)
> **Trạng thái:** 🟡 Chờ phê duyệt trước khi refactor
>
> 🎯 **Mục tiêu review:** đánh giá khả năng bảo trì dài hạn, khả năng mở rộng, và mức độ **không lock-in** (Directus/Astro/PostgreSQL) của hệ thống tài liệu — theo 7 câu hỏi được giao.

---

## 0. Kết luận tổng quan (Executive Summary)

Nền tảng tài liệu **mạnh về quy trình** (status header, ADR system, docs-as-code, quality gates, cross-link) nhưng có **một điểm yếu kiến trúc cốt lõi**:

> **Tri thức domain bền vững đang bị nhúng bên trong các tài liệu gắn chặt công nghệ.** Cụ thể, 5 tầng mô hình (Domain / Content / Data / CMS / API Contract) bị gộp vào 2 file mang tên công nghệ (`04-database`, `05-cms`) và một file `06-api` framing theo "Astro ↔ Directus". Hệ quả: **muốn đổi CMS/DB/framework thì phải viết lại cả tri thức domain** — đúng thứ lock-in mà mục tiêu dự án muốn tránh.

**Kim chỉ nam refactor:** áp dụng **Dependency Inversion ở cấp tài liệu** — kéo các tầng tech-agnostic (Domain, Content, API Contract, Data logic) vào *trung tâm*; đẩy Directus/Astro/PostgreSQL ra *rìa* dưới dạng "implementation binding" có nhãn rõ ràng và có thể thay thế.

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| Quy trình & governance | ⭐⭐⭐⭐ | Tốt (ADR, gates, status) |
| Độ phủ tài liệu | ⭐⭐⭐⭐ | Rộng cho Sprint 0 |
| Phân tách tầng (layering) | ⭐⭐ | Gộp tầng, thiếu Domain/Content/Principles |
| Trung lập công nghệ (no lock-in) | ⭐⭐ | Domain đang dính Directus/PG/Astro |
| Cohesion / Coupling | ⭐⭐½ | Vài file low-cohesion, trùng trách nhiệm |

---

## 1. Những điểm tốt (Strengths — giữ nguyên)

- **Governance chín:** mỗi file có header trạng thái/owner/updated; docs-as-code; review qua PR.
- **Có sẵn ADR system** (`adr/` + template + 0001) — đúng cơ chế để tách "quyết định công nghệ" khỏi văn bản domain.
- **Navigation index** (`docs/README`) có status legend, thứ tự đọc theo pha, và cổng "Ready to Code".
- **Quality Gates** (DoR/DoD/Ready-to-Code) đã định nghĩa sớm.
- **Cross-cutting concerns** (security, testing, operations, SEO/a11y) được phủ — hiếm thấy ở Sprint 0.
- **`00-project`** khá sạch domain (vision/personas/scope), không dính công nghệ.
- **Glossary** seed ubiquitous language; kỷ luật "no secrets in repo" nhắc lại nhất quán.
- `04-database` đã có một câu lưu ý đúng hướng ("mô tả *mô hình khái niệm* là nguồn sự thật") — nền tốt để tách tầng.

---

## 2. Những điểm cần cải thiện (Findings)

> Mỗi finding gồm: **Quan sát** · **Ưu tiên** · **Đề xuất thay đổi** · **Ảnh hưởng nếu không đổi**. Cột "Q" ánh xạ tới 7 câu hỏi được giao.

### 🔴 F1 — Content Model bị nhốt trong tài liệu CMS (Directus) · Q1, Q2, Q7 · **HIGH**
- **Quan sát:** `05-cms.md` định nghĩa content model (Post, collections, fields, quan hệ, workflow biên tập) như artifact của Directus. Khái niệm bền vững (loại nội dung) bị trộn với một CMS cụ thể. Tiêu đề & mục đích đều nói "trong Directus".
- **Đề xuất:** Tách một tài liệu **Content Model** *trung lập CMS* (loại nội dung, field, quan hệ, vòng đời biên tập draft→published bằng ngôn ngữ nghiệp vụ). Đổi `05-cms` thành **CMS Mapping (Directus)** = *cách hiện thực* Content Model trên Directus (collections/roles/flows/preview).
- **Ảnh hưởng nếu không đổi:** đổi CMS = viết lại tri thức nội dung; content model trôi lệch khỏi data/API; **vi phạm mục tiêu CMS-agnostic**.

### 🔴 F2 — Data Model bị trộn với công nghệ database · Q1, Q2 · **HIGH**
- **Quan sát:** `04-database.md` (tên "Database / Data Model") trộn mô hình dữ liệu *logic* (thực thể/quan hệ) với chi tiết *vật lý* (PostgreSQL, indexing, migration) và giữ bản canonical của Post.
- **Đề xuất:** Tách (a) **Data Model** (logic: thực thể, khoá, quan hệ, ràng buộc — storage-agnostic) và (b) **Persistence / Database** (vật lý: DB được chọn, index, migration, backup) như tài liệu implementation. Bỏ chữ "database" khỏi tầng logic.
- **Ảnh hưởng nếu không đổi:** đổi DB (hoặc thực tế Directus tự quản schema) buộc sửa tầng domain; nhãn "Data Model" gây hiểu nhầm vì dính DB.

### 🔴 F3 — Thiếu tài liệu Domain Model · Q2, Q4 · **HIGH (nền tảng)**
- **Quan sát:** Khái niệm & **business rules** domain (vòng đời Post như *luật nghiệp vụ*, khác biệt Category vs Tag, luật tác giả) nằm rải rác ở 00/04/05/16, không có một Domain Model thống nhất.
- **Đề xuất:** Thêm **Domain Model** — tầng *trong cùng, bền nhất*: thực thể, quan hệ, invariants, state machine (draft→in_review→published/scheduled), độc lập storage/CMS/API. Glossary (16) nuôi tầng này.
- **Ảnh hưởng nếu không đổi:** không có "nguồn sự thật" cho ngữ nghĩa nghiệp vụ; mỗi tài liệu công nghệ tự định nghĩa lại domain, dễ lệch.

### 🔴 F4 — API là "integration" gắn transport Directus, chưa phải "contract" API-first · Q1, Q2, Q3 · **HIGH**
- **Quan sát:** `06-api.md` framing "Astro ↔ Directus", nhét cú pháp endpoint Directus (`GET /items/posts?filter[status]=published`) chung với hợp đồng logic (Post DTO).
- **Đề xuất:** Tách **API Contract** (logic, bền: resource, hình dạng DTO, ngữ nghĩa phân trang/lọc, error model — trung lập cả consumer lẫn backend) khỏi **API Implementation Binding (Directus)** (endpoint, token). Đưa API Contract thành *ranh giới* mà cả Site lẫn CMS phải tuân (API-first).
- **Ảnh hưởng nếu không đổi:** cả Directus lẫn Astro rò rỉ vào hợp đồng; không đạt API-first; đổi backend → sửa frontend.

### 🔴 F5 — Thiếu Architecture Principles; mục tiêu agnostic chỉ là "khẩu hiệu", không có cơ chế cưỡng chế · Q3, Q4 · **HIGH (nền tảng)**
- **Quan sát:** 7 nguyên tắc (Headless CMS, CMS-agnostic, API-first, Self-host first, Cloud-ready, Low coupling, High cohesion) **không được phát biểu ở đâu** thành principle có rationale/implication. `03-architecture` ngầm lấy Directus làm trung tâm; self-host/cloud-ready không được nêu.
- **Đề xuất:** Thêm **Architecture Principles** — tài liệu *governing*: mỗi nguyên tắc gồm *phát biểu → lý do → hệ quả thiết kế → cách kiểm chứng tuân thủ*. `03` và mọi doc thiết kế phải tuân; mỗi ADR khai báo nó *tôn trọng/vi phạm* nguyên tắc nào.
- **Ảnh hưởng nếu không đổi:** không gì ngăn trôi về lock-in; reviewer không có cơ sở khách quan để bác thiết kế bị coupling.

### 🟠 F6 — Thiếu tài liệu Tech Stack; lựa chọn công nghệ nằm rải rác · Q4 · **MEDIUM-HIGH**
- **Quan sát:** Tên công nghệ xuất hiện ở README gốc, bảng container `03`, và ngầm khắp nơi. Không có một "current implementation stack" tập trung.
- **Đề xuất:** Thêm **Tech Stack** — liệt kê công nghệ *đang chọn* + phiên bản + link ADR, gắn nhãn rõ "implementation detail, có thể thay". Đây là nơi *duy nhất* chứa tên công nghệ dễ đổi, để domain doc không bao giờ phải nhắc tên tech.
- **Ảnh hưởng nếu không đổi:** tên tech vương vãi nhiều file; đổi lựa chọn/phiên bản phải sửa nhiều nơi; khó giữ domain doc "tech-free".

### 🟠 F7 — Architecture mô tả container bằng *sản phẩm* thay vì *vai trò/port* · Q1, Q3 · **MEDIUM**
- **Quan sát:** Bảng container `03 §3` để "Astro/Directus/PostgreSQL" làm danh tính container. Đúng về vận hành nhưng cột chặt narrative kiến trúc vào sản phẩm. Chưa có góc nhìn ports-and-adapters, chưa có topo self-host vs cloud.
- **Đề xuất:** Mô tả container theo **vai trò/port** (Site Generator, Headless Content Service, Content Store, Edge/Proxy) + cột "hiện thực hiện tại" link Tech Stack/ADR. Bổ sung sơ đồ **ports & adapters** (đâu là port ổn định, đâu là adapter thay được) và **topo triển khai self-host-first + cloud-ready**.
- **Ảnh hưởng nếu không đổi:** kiến trúc đọc như "một hệ Directus" thay vì "một hệ headless content *hiện* dùng Directus"; khó lập luận khi thay thế.

### 🔴 F8 — Trùng định nghĩa Post (và các thực thể) ở 04/05/06 · Q6 · **HIGH**
- **Quan sát:** Post được định nghĩa 3 lần: `04` (data entity), `05` (Directus collection), `06` (DTO) → **drift**.
- **Đề xuất:** **Single source of truth**: Content/Domain Model định nghĩa Post *một lần*; Data Model, CMS Mapping, API Contract chỉ *tham chiếu/dẫn xuất* và chỉ ghi phần *delta* của tầng mình (vd API thêm `excerpt`; CMS thêm field-type/interface).
- **Ảnh hưởng nếu không đổi:** định nghĩa lệch nhau; bug do giả định không khớp; chi phí bảo trì nhân lên.

### 🟠 F9 — Topology/triển khai được mô tả ở 3 nơi (03 §3, 08 §2, 13 §1) · Q6 · **MEDIUM**
- **Quan sát:** Chồng chéo quyền sở hữu "cái gì chạy ở đâu".
- **Đề xuất:** Phân định chủ sở hữu: `03` = kiến trúc *logic* (vai trò, ranh giới); `08` = *pipeline/release*; `13` = *runtime topology* vận hành. Một sơ đồ topo canonical do `08` sở hữu, các nơi khác link tới, không vẽ lại.
- **Ảnh hưởng nếu không đổi:** các sơ đồ phân kỳ; người đọc không biết bản nào là chuẩn.

### 🟠 F10 — Thứ tự phụ thuộc/đánh số bị đảo so với phụ thuộc khái niệm · Q5 · **MEDIUM**
- **Quan sát:**
  - `04` (Data) đứng **trước** `05` (Content/CMS) — nhưng content định hình data; hệ content-driven nên đi **Domain → Content → Data**. Hiện đang đảo.
  - `16-glossary` là nền tảng nhưng đánh số 16 (cuối); Tech Stack/Principles (thiếu) lẽ ra ở đầu.
  - **Forward references:** `03 → 04/05/06/08`, `04 → 05/13`, `06 → 08`. Vài cái chấp nhận được ("xem chi tiết"), nhưng nguyên tắc *high-level không phụ thuộc low-level detail* đang bị vi phạm.
- **Đề xuất:** Sắp lại theo layering: **Principles → Domain → Content → API Contract → Data → (Persistence, CMS Mapping, API Impl) → cross-cutting**. Đưa Glossary lên sớm (hoặc đánh dấu "reference luôn mở"). Đảm bảo mỗi doc chỉ phụ thuộc doc *sớm hơn/nền tảng*; doc chi tiết có thể back-link nhưng doc nền tảng **không** được phụ thuộc doc chi tiết.
- **Ảnh hưởng nếu không đổi:** người đọc gặp forward reference; vi phạm luật "không phụ thuộc tài liệu viết sau"; thứ tự onboarding rối.

### 🟡 F11 — Design System dính tên framework; nhập nhằng "Design System" vs "UI/UX" · Q1, Q4 · **MEDIUM/LOW**
- **Quan sát:** `07-ui-ux` trộn design system (tokens/components — bền) với binding framework (`PostCard.astro`).
- **Đề xuất:** Giữ **Design System** trung lập (tokens, component *contract*, a11y, brand retro); tách phần ánh xạ hiện thực (Astro components) vào mục implementation hoặc Tech Stack. Tuỳ chọn: tách "Information Architecture/UX" khỏi "Design System" (xem F12).
- **Ảnh hưởng nếu không đổi:** đổi framework động vào tài liệu thiết kế; token khó tái sử dụng.

### 🟠 F12 — "Navigation": docs-navigation đã có; **site Information Architecture còn thiếu** · Q4 · **MEDIUM**
- **Quan sát:** `docs/README` = điều hướng *tài liệu* (tốt). Nhưng chưa có tài liệu **Information Architecture / Navigation của site** (sơ đồ URL/route, menu, taxonomy→nav, breadcrumb, phân trang) — vốn là mối quan tâm domain/UX, hiện ẩn trong slug/category/tag.
- **Đề xuất:** Làm rõ ý "Navigation" bạn muốn:
  - Nếu là *điều hướng tài liệu* → đã đủ, chỉ cần polish.
  - Nếu là *IA của site* → thêm tài liệu **Information Architecture / Navigation** (bản đồ route, taxonomy→nav, quy tắc permalink) gắn với Content Model, trung lập công nghệ.
- **Ảnh hưởng nếu không đổi:** quyết định URL/permalink (mối quan tâm domain, **rất khó đổi về sau** vì ảnh hưởng SEO) bị làm ad-hoc trong code, không tài liệu hoá.

### 🔴 F13 — Chưa có ADR cho các quyết định stack; không nối với Principles · Q4 · **HIGH (nội dung, không phải cấu trúc)**
- **Quan sát:** `adr/` mới có 0001. Các quyết định *gây ra* rủi ro lock-in (chọn Directus, Astro, DB, render strategy, Docker) chưa được ghi, và sẽ không tham chiếu Architecture Principles.
- **Đề xuất:** Viết ADR 0002–000x cho Astro / Directus / DB / Docker / render strategy; mỗi ADR nêu *tuân nguyên tắc nào* và **chi phí thoát/migration (mức độ khả nghịch)** — phục vụ trực tiếp mục tiêu tránh lock-in.
- **Ảnh hưởng nếu không đổi:** các quyết định lớn nhất không được ghi; không có migration path; tuyên bố "agnostic" không có bằng chứng.

### 🟡 F14 — Ranh giới Glossary vs Domain Model · Q2, Q6 · **LOW**
- **Quan sát:** `16-glossary` chứa thuật ngữ domain; khi có Domain Model, cần tránh chồng lấn.
- **Đề xuất:** Glossary = *từ điển thuật ngữ*; Domain Model = *cấu trúc & luật*. Cross-link, không lặp.
- **Ảnh hưởng nếu không đổi:** lặp nhẹ, nguy cơ lệch định nghĩa.

### 🟡 F15 — SEO + A11y gộp một file · Q6 · **LOW**
- **Quan sát:** `15` gộp hai mối quan tâm; liên quan (chất lượng trang xuất ra) nhưng tách được.
- **Đề xuất:** Giữ gộp ở giai đoạn này (cohesion chấp nhận được) hoặc tách khi mỗi phần phình to.
- **Ảnh hưởng nếu không đổi:** không đáng kể.

---

## 3. Mô hình phân tầng mục tiêu (backbone của refactor)

> Nguyên tắc: **tầng trong KHÔNG tham chiếu tầng ngoài (công nghệ). Tầng ngoài tham chiếu tầng trong.** Đây là Dependency Inversion ở cấp tài liệu.

```
        ┌───────────────────────────────────────────────┐
        │  Architecture Principles  (governing, tech-free)│
        └───────────────────────────────────────────────┘
                          ▼ ràng buộc
   ╔══════════════ LÕI — TRUNG LẬP CÔNG NGHỆ (bền nhất) ══════════════╗
   ║  Domain Model      → thực thể, luật nghiệp vụ, state machine     ║
   ║  Content Model     → loại nội dung, field, quan hệ, vòng đời BT  ║
   ║  API Contract      → resource, DTO, phân trang, error (logic)    ║
   ║  Data Model        → thực thể logic, khoá, ràng buộc (no DB)     ║
   ╚═════════════════════════════════════════════════════════════════╝
                          ▼ được hiện thực bởi (swappable)
   ┌──────────────── RÌA — IMPLEMENTATION BINDING (thay được) ────────┐
   │  CMS Mapping (Directus)     │  API Impl Binding (Directus REST/GQL)│
   │  Persistence / Database (PG)│  Frontend/Site + Design binding (Astro)│
   │  Tech Stack  → chỉ mục tên công nghệ hiện tại → link ADR         │
   └─────────────────────────────────────────────────────────────────┘
```

**Bài kiểm tra "không lock-in":** *đổi Directus → Strapi/Payload, hoặc Astro → khác, chỉ được chạm các tài liệu ở tầng RÌA. Nếu buộc phải sửa tầng LÕI → thiết kế tài liệu sai.*

---

## 4. Đề xuất ánh xạ tài liệu (hiện tại → mục tiêu) — *đề xuất, chưa áp dụng*

> Tinh thần "refactor không tạo mới": phần lớn là **đổi tên / tách / trích xuất**, không vứt bỏ nội dung.

| Hiện tại | Vấn đề | Đề xuất |
|---|---|---|
| `03-architecture` | Container theo sản phẩm; thiếu ports/adapters, thiếu principles | Giữ, nhưng mô tả theo vai trò/port + thêm topo self-host/cloud; tuân **Architecture Principles** (mới) |
| `04-database` | Trộn Data logic + DB tech + canonical Post | **Tách:** `Data Model` (logic) ⟂ `Persistence/Database` (vật lý) |
| `05-cms` (Directus) | Content Model bị nhốt trong CMS | **Tách:** `Content Model` (tech-agnostic) ⟂ `CMS Mapping (Directus)` |
| `06-api` (Astro↔Directus) | Contract trộn transport | **Tách:** `API Contract` (logic) ⟂ `API Impl Binding (Directus)` |
| `07-ui-ux` | Design tokens dính Astro | Tách `Design System` (bền) ⟂ binding framework; cân nhắc `Information Architecture` (F12) |
| — (thiếu) | — | **Thêm:** `Architecture Principles`, `Domain Model`, `Tech Stack` |
| `16-glossary` | Nền tảng nhưng đánh số cuối + ranh giới với Domain Model | Đưa lên sớm; giới hạn thành từ điển |
| `adr/` | Mới có 0001 | Thêm ADR 0002+ cho stack, nối Principles |

> ⚠️ **Lưu ý về đánh số phẳng:** chèn tài liệu mới (Principles/Domain/Content/Tech Stack) vào giữa dãy `00–17` sẽ gây **renumber & vỡ cross-link**. Đây là điểm cần bạn quyết ở bước refactor (xem "Câu hỏi mở" §7).

---

## 5. Bảng tổng hợp ưu tiên (Priority Summary)

| # | Finding | Câu hỏi | Ưu tiên |
|---|---|---|---|
| F1 | Content Model bị nhốt trong CMS doc | Q1,Q2,Q7 | 🔴 High |
| F2 | Data Model trộn công nghệ DB | Q1,Q2 | 🔴 High |
| F3 | Thiếu Domain Model | Q2,Q4 | 🔴 High |
| F4 | API là integration, chưa phải contract | Q1,Q2,Q3 | 🔴 High |
| F5 | Thiếu Architecture Principles | Q3,Q4 | 🔴 High |
| F8 | Trùng định nghĩa Post ở 04/05/06 | Q6 | 🔴 High |
| F13 | Thiếu ADR cho stack | Q4 | 🔴 High |
| F6 | Thiếu Tech Stack doc | Q4 | 🟠 Med-High |
| F7 | Architecture theo sản phẩm, không theo port | Q1,Q3 | 🟠 Medium |
| F9 | Topology trùng ở 3 doc | Q6 | 🟠 Medium |
| F10 | Thứ tự phụ thuộc bị đảo + forward refs | Q5 | 🟠 Medium |
| F12 | Thiếu site Information Architecture | Q4 | 🟠 Medium |
| F11 | Design System dính framework | Q1,Q4 | 🟡 Med/Low |
| F14 | Ranh giới Glossary vs Domain | Q2,Q6 | 🟡 Low |
| F15 | SEO+A11y gộp | Q6 | 🟡 Low |

---

## 6. Trình tự refactor đề xuất (sau khi bạn duyệt)

1. **Đợt 1 — Nền tảng trung lập (High):** tạo `Architecture Principles` (F5) → `Domain Model` (F3) → tách `Content Model` khỏi `05` (F1) → tách `API Contract` khỏi `06` (F4) → tách `Data Model` khỏi `04` (F2). Thiết lập **single source of truth** cho Post (F8).
2. **Đợt 2 — Cô lập công nghệ (High/Med):** tạo `Tech Stack` (F6) → viết ADR stack (F13) → chuyển `03` sang mô tả theo port + topo self-host/cloud (F7) → gán chủ sở hữu topology (F9).
3. **Đợt 3 — Trật tự & tinh gọn (Med/Low):** sắp lại thứ tự phụ thuộc/đánh số (F10) → làm rõ `Navigation`/IA (F12) → tách Design System binding (F11) → dọn ranh giới Glossary (F14) → cân nhắc tách SEO/A11y (F15).

Mỗi đợt: cập nhật `docs/README` (navigation) + bảng ánh xạ, giữ nguyên tắc "không doc nào phụ thuộc doc viết sau".

---

## 7. Câu hỏi mở cần bạn quyết trước khi refactor

1. **Chiến lược đánh số:** khi thêm doc nền tảng vào giữa dãy phẳng — bạn muốn (a) **renumber toàn bộ** (sạch nhưng vỡ link cũ), (b) **chuyển sang tên ổn định, bỏ số** (đề xuất cho dự án dài hạn), hay (c) **đánh số thập phân / thêm section prefix** (vd `02a-domain-model`)?
2. **Phạm vi "no lock-in":** tách tầng LÕI/RÌA đến mức nào — tách hẳn thành các file riêng (rõ nhưng nhiều file hơn), hay tách bằng *section trong file* (ít file, kỷ luật thấp hơn)?
3. **"Navigation"** trong câu hỏi 4 của bạn: ý là *điều hướng tài liệu* (đã có) hay *Information Architecture của site* (F12 — tôi nghiêng về việc bổ sung)?

---

> ✅ **Không có tài liệu nào bị chỉnh sửa trong quá trình review này.** Report này nằm ở `docs/reviews/` để tách khỏi bộ doc chính. Chờ bạn phê duyệt để bắt đầu refactor theo §6.
