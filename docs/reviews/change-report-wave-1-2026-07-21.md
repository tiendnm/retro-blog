# 🔧 Change Report — Refactor Đợt 1 (Wave 1)

> **Ngày:** 2026-07-21 · **Người thực hiện:** Software Architect · **Phạm vi:** Đợt 1 — "Nền tảng trung lập (LÕI)" theo [Architecture Review Report §6](./architecture-review-2026-07-21.md)
> **Trạng thái:** 🟡 Chờ review trước khi sang Đợt 2
>
> 🎯 **Mục tiêu Đợt 1:** tách tầng LÕI (tech-neutral) ra khỏi các tài liệu gắn công nghệ, thiết lập **single source of truth (SSOT)**, và áp dụng **Nguyên tắc 0** (trung lập công nghệ ở LÕI). Xử lý các finding **F1, F2, F3, F4, F5, F8** (một phần **F10**).

---

## 1. Những file đã thay đổi

### 1.1. Tạo mới (5 tài liệu LÕI + governing)
| File | Tầng | Nội dung |
|---|---|---|
| `docs/03a-architecture-principles.md` | 🏛️ Governing | Nguyên tắc 0 (tech-neutral) + P1–P8 (Headless, CMS-agnostic, API-first, Self-host, Cloud-ready, Low coupling, High cohesion, Core/Edge) + quy trình waiver |
| `docs/03b-domain-model.md` | 🧭 LÕI | Thực thể miền, luật nghiệp vụ (BR), máy trạng thái Post — tech-neutral |
| `docs/03c-content-model.md` | 🧭 LÕI | Loại nội dung & field (kiểu trung lập) — **SSOT cấu trúc nội dung** |
| `docs/03d-api-contract.md` | 🧭 LÕI | Hợp đồng API logic, DTO — **SSOT hợp đồng**, transport-agnostic |
| `docs/03e-data-model.md` | 🧭 LÕI | Mô hình dữ liệu logic (khoá, toàn vẹn) — **SSOT dữ liệu**, storage-agnostic |

### 1.2. Cập nhật (chuyển sang tầng RÌA + trỏ SSOT)
| File | Trước | Sau |
|---|---|---|
| `docs/04-database.md` | "Database / Data Model" (trộn logic + vật lý) | "Persistence / Database (Implementation)" — chỉ vật lý, trỏ [03e] |
| `docs/05-cms.md` | "CMS (Directus)" (chứa content model) | "CMS Mapping (Directus)" — chỉ ánh xạ, trỏ [03c]/[03b] |
| `docs/06-api.md` | "API Integration" (Astro↔Directus, trộn contract) | "API Implementation (Directus Binding)" — chỉ endpoint, trỏ [03d] |
| `docs/README.md` | Mục lục phẳng 00–17 | Thêm 03a–03e, cột **Tầng**, mục LÕI/RÌA, thứ tự đọc theo tầng, quy ước hậu tố |

### 1.3. Không đụng tới
- Toàn bộ số thứ tự hiện có (00–17) **giữ nguyên**; không renumber; không đổi filename `04/05/06`.
- Các file `00–02, 03, 07–17`, `adr/*` **không sửa nội dung** (chỉ được tham chiếu).

---

## 2. Những thay đổi chính & Lý do

| # | Thay đổi | Finding | Lý do |
|---|---|---|---|
| 1 | Thêm **Architecture Principles** (`03a`) làm tài liệu governing, đặt **Nguyên tắc 0** làm điều khoản bao trùm | F5 | Trước đây các mục tiêu (agnostic, API-first...) chỉ là khẩu hiệu, không có cơ chế cưỡng chế. Nay có gate để review & để ADR tham chiếu |
| 2 | Tách **Domain Model** (`03b`) thành tầng riêng | F3 | Ngữ nghĩa nghiệp vụ trước đây nằm rải rác; nay có 1 nguồn sự thật cho luật & máy trạng thái |
| 3 | Tách **Content Model** (`03c`) khỏi `05-cms` | F1, F8 | Content model từng bị nhốt trong Directus → đổi CMS phải viết lại. Nay tech-neutral, SSOT |
| 4 | Tách **API Contract** (`03d`) khỏi `06-api` | F4, F8 | Hợp đồng từng trộn transport Directus; nay API-first, logic thuần |
| 5 | Tách **Data Model** (`03e`) khỏi `04-database` | F2, F8 | Mô hình logic từng dính PostgreSQL/index/migration; nay storage-agnostic |
| 6 | `04/05/06` → tầng RÌA, gỡ định nghĩa mô hình, thêm **banner implementation** + trỏ SSOT | F1, F2, F4, F8 | Loại bỏ trùng định nghĩa Post (3 nơi → 1); cô lập công nghệ về RÌA |
| 7 | Chèn `03a–03e` bằng **hậu tố chữ**; block `03*` sắp trước `04–06` | Quyết định của bạn + F10 | Giữ nguyên đánh số, đồng thời sửa thứ tự đảo (Content trước Data; LÕI trước RÌA) |
| 8 | README: cột **Tầng**, mục LÕI/RÌA, thứ tự đọc theo tầng | F10 | Định nghĩa thứ tự phụ thuộc rõ ràng; số chỉ là định danh |

---

## 3. Ảnh hưởng tới các tài liệu khác (cần xử lý ở đợt sau)

> Các file dưới đây **chưa sửa** (ngoài phạm vi Đợt 1) nhưng có tham chiếu/ngữ nghĩa cần cập nhật:

| File | Ảnh hưởng | Xử lý ở |
|---|---|---|
| `03-architecture.md` | Bảng container còn theo *sản phẩm*; cần chuyển sang *port* + trỏ `03a` | Đợt 2 (F7) |
| `01-requirements.md` | Link "04 (data model)" nay là Data Model logic `03e`; NFR nên trỏ Principles | Đợt 2/3 |
| `07-ui-ux.md` | Còn tên `PostCard.astro`; Design System cần tách binding | Đợt 3 (F11) |
| `10-decisions.md` / `adr/` | Chưa có ADR cho stack; ADR cần khai báo tuân Principles nào | Đợt 2 (F13) |
| `16-glossary.md` | Ranh giới với `03b` (Glossary = từ điển, Domain = cấu trúc) | Đợt 3 (F14) |
| `08/13` | Chồng chéo topology với `03` | Đợt 2 (F9) |
| Chưa tồn tại | `Tech Stack` (Đợt 2), `Information Architecture/Navigation` (Đợt 3) | Đợt 2 & 3 |

> ✅ **Kiểm chứng Nguyên tắc 0:** các file LÕI mới (`03b–03e`) không nhắc tên công nghệ; tên công nghệ (Directus/PostgreSQL/Astro) chỉ còn ở RÌA (`04/05/06`) và các câu "cần ADR". *(Khuyến nghị: thêm bước grep tự động ở CI khi có repo.)*

---

## 4. Chưa làm trong Đợt 1 (có chủ đích)

- Chưa tạo `Tech Stack`, chưa viết ADR stack (Đợt 2).
- Chưa chuyển `03-architecture` sang mô hình port/adapter (Đợt 2).
- Chưa thêm `Information Architecture / Navigation` của site (Đợt 3).
- Chưa cập nhật cross-link ngữ nghĩa ở các file ngoài phạm vi (liệt kê ở §3).

---

## 5. Đợt tiếp theo (preview — Đợt 2: "Cô lập công nghệ")

`Tech Stack` (F6) → ADR stack (F13) → `03-architecture` theo port + topo self-host/cloud (F7) → gán chủ sở hữu topology (F9).

---

> 🛑 **Dừng lại chờ bạn review Đợt 1.** Không tiến hành Đợt 2 cho tới khi bạn đồng ý. Nếu muốn điều chỉnh cơ chế chèn hậu tố hoặc ranh giới tầng, đây là thời điểm phù hợp nhất (càng về sau càng nhiều cross-link phụ thuộc).
