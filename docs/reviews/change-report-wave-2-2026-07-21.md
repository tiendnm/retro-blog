# 🔧 Change Report — Refactor Đợt 2 (Wave 2)

> **Ngày:** 2026-07-21 · **Người thực hiện:** Software Architect · **Phạm vi:** Đợt 2 — "Cô lập công nghệ" theo trình tự bạn ưu tiên
> **Trạng thái:** 🟡 Chờ review trước khi sang Đợt 3
>
> 🎯 **Mục tiêu Đợt 2:** (1) refactor Architecture theo **ports & adapters**, (2) tạo **Tech Stack** implementation, (3) tạo **ADR** cho từng công nghệ. Kèm 3 điều chỉnh governance bạn bổ sung. Xử lý **F6, F7, F9, F13** (một phần **F5**).

---

## 1. Governance được bổ sung (theo 3 nguyên tắc mới của bạn)

| Điều chỉnh | Nơi áp dụng |
|---|---|
| **Ranh giới tầng nghiêm ngặt** (Domain không tech; Content không CMS/DB; API Contract không endpoint; Data Model không persistence detail) | Thêm **P9** + bảng ranh giới vào [03a](../03a-architecture-principles.md) |
| **Principles là governing — mọi tài liệu kiến trúc & ADR phải trích dẫn Principle** | Thêm mục **Governance G1/G2** vào [03a](../03a-architecture-principles.md); thêm field "Nguyên tắc tuân thủ" vào [ADR template](../adr/0000-adr-template.md); mọi ADR & `03`/`10a` đều có mục này |
| **docs/README chỉ điều hướng** | Gỡ diễn giải kiến trúc/Nguyên tắc 0 khỏi [README](../README.md); thay bằng pointer tới `03a` |

---

## 2. Những file đã thay đổi

### Tạo mới (6)
| File | Tầng | Nội dung |
|---|---|---|
| `docs/10a-tech-stack.md` | ⚙️ RÌA | Sổ đăng ký công nghệ theo vai trò/port; mỗi mục có ADR + Principle |
| `docs/adr/0002-use-astro-site-generator.md` | ADR | Astro cho Presentation/Site |
| `docs/adr/0003-use-directus-headless-cms.md` | ADR | Directus cho Headless Content Service |
| `docs/adr/0004-use-postgresql-content-store.md` | ADR | PostgreSQL cho Content Store |
| `docs/adr/0005-use-docker-packaging.md` | ADR | Docker cho đóng gói & runtime |
| `docs/reviews/change-report-wave-2-2026-07-21.md` | — | Báo cáo này |

### Cập nhật (6)
| File | Thay đổi |
|---|---|
| `docs/03-architecture.md` | Refactor sang **ports & adapters**: mô tả theo *vai trò*, bảng Port↔Adapter, mục "Nguyên tắc tuân thủ", topology self-host/cloud, **phân định chủ sở hữu topology** (F9). Tech-neutral (adapter → trỏ Tech Stack) |
| `docs/03a-architecture-principles.md` | Thêm **P9** (ranh giới tầng) + mục **Governance G1/G2** |
| `docs/adr/0000-adr-template.md` | Thêm field **Nguyên tắc tuân thủ** + mục **Chi phí migration** |
| `docs/adr/0001-record-architecture-decisions.md` | Bổ sung mục Principle/Trade-off/Migration theo template mới |
| `docs/adr/README.md` | Cập nhật index (0002–0005) + quy tắc G1 bắt buộc |
| `docs/10-decisions.md` | Index ADR đầy đủ (0001–0005 + 0006 dự kiến), cột Principle; trỏ Tech Stack |
| `docs/README.md` | Chuyển **navigation-only**; thêm dòng `10a`; cập nhật thứ tự đọc |

### Không đụng tới
- Đánh số hiện có giữ nguyên; `10a` chèn bằng hậu tố (cạnh `10-decisions`, vì Tech Stack ↔ ADR gắn chặt).
- `00–02, 03b–03e, 04–09, 11–17` **không sửa**.

---

## 3. Thay đổi chính & Lý do

| # | Thay đổi | Finding | Lý do |
|---|---|---|---|
| 1 | `03-architecture` mô tả theo **vai trò + ports & adapters**, tech-neutral | F7 | Trước đây container theo *sản phẩm* → đọc như "hệ Directus". Nay Port ổn định tách khỏi Adapter thay được → dễ lập luận thay thế |
| 2 | Thêm bảng **Port ↔ Adapter** + quy tắc mũi tên chỉ Adapter→Port | F7, P6 | Cụ thể hoá điểm nối ổn định vs biến thiên |
| 3 | **Phân định chủ sở hữu topology** (03 logic / 08 pipeline / 13 runtime) | F9 | Hết chồng chéo sơ đồ ở 3 nơi |
| 4 | Tạo **Tech Stack** (`10a`) làm nơi *duy nhất* chứa tên công nghệ | F6 | Cô lập tên công nghệ; LÕI & Architecture không phải nhắc sản phẩm |
| 5 | Tạo **ADR 0002–0005** cho Astro/Directus/PostgreSQL/Docker | F13 | Ghi lại quyết định lớn nhất; mỗi ADR nêu **Principle + Trade-off + Chi phí migration** |
| 6 | Nâng cấp **ADR template** + Governance G1/G2 | F5, yêu cầu #2 | Principles thành nền tảng có hiệu lực, không phải khẩu hiệu |
| 7 | Thêm **P9** ranh giới tầng | yêu cầu #1 | Ngăn tái diễn chồng chéo (F8) trong tương lai |
| 8 | README **navigation-only** | yêu cầu #3 | Tách điều hướng khỏi logic kiến trúc |

---

## 4. Ảnh hưởng tới tài liệu khác (chưa sửa — để Đợt 3)

| File | Ảnh hưởng | Xử lý ở |
|---|---|---|
| `01-requirements`, `08-deployment`, `13-operations`, `12-security` | Nên bổ sung mục "Nguyên tắc tuân thủ" (G1) khi được chỉnh | Đợt 3 (dần dần) |
| `07-ui-ux` | Còn `PostCard.astro`; tách Design System khỏi binding framework | **Đợt 3** (F11) |
| `16-glossary` | Làm rõ ranh giới với `03b` (từ điển vs cấu trúc) | **Đợt 3** (F14) |
| Chưa tồn tại | `Information Architecture / Navigation` của site (route/taxonomy/permalink) | **Đợt 3** (F12) |
| `06-api` | Khi chốt REST/GraphQL & render strategy → cần **ADR-0006** | Sau, khi quyết |

> ✅ **Kiểm chứng Nguyên tắc 0 (đã chạy):** tầng LÕI `03b–03e` = 0 tên công nghệ. `03-architecture` cũng tech-neutral (công nghệ chỉ ở `10a` Tech Stack + ADR).

---

## 5. Chưa làm trong Đợt 2 (có chủ đích)

- Chưa quyết chiến lược render (ADR-0006) — cần input sản phẩm.
- Chưa gắn mục "Nguyên tắc tuân thủ" vào các tài liệu ngoài kiến trúc (08/12/13...) — làm dần ở Đợt 3.
- Chưa tạo Information Architecture, chưa tách Design System binding (Đợt 3).

---

## 6. Đợt tiếp theo (preview — Đợt 3: "Trật tự & tinh gọn")

Tạo **Information Architecture / Navigation** của site (F12) → tách **Design System** khỏi binding framework (F11) → dọn ranh giới **Glossary vs Domain** (F14) → cân nhắc tách **SEO/A11y** (F15) → rà soát cross-link tồn đọng.

---

> 🛑 **Dừng lại chờ bạn review Đợt 2.** Không tiến hành Đợt 3 cho tới khi bạn đồng ý.
