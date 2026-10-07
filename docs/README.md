# 📚 Mục lục tài liệu — Retro Blog

> 🎯 **Mục đích:** Điểm vào (entry point) để **điều hướng** toàn bộ tài liệu. File này *chỉ* dùng để tìm & sắp thứ tự đọc — **không** chứa logic kiến trúc hay quyết định thiết kế (những nội dung đó ở [03a-architecture-principles](./03a-architecture-principles.md) và [03-architecture](./03-architecture.md)).

---

## 1. Chú thích

- **Cột "Tầng":** 🧭 LÕI (tech-neutral) · ⚙️ RÌA (implementation) · 🏛️ Governing. *Ý nghĩa & quy tắc các tầng:* xem [03a-architecture-principles](./03a-architecture-principles.md).
- **Đánh số là ĐỊNH DANH ổn định, không phải thứ tự bắt buộc.** Thứ tự đọc xem §3. Tài liệu chèn thêm dùng **hậu tố chữ** (vd `03a`, `10a`).

---

## 2. Danh sách tài liệu

| # | Tài liệu | Tầng | Mục đích ngắn gọn | Trước khi code? |
|---|---|---|---|---|
| — | [README (gốc)](../README.md) | — | Giới thiệu dự án | Nên |
| 00 | [Project & Vision](./00-project.md) | — | Tầm nhìn, phạm vi, personas | ✅ |
| 01 | [Requirements](./01-requirements.md) | — | Yêu cầu FR & NFR | ✅ (MVP) |
| 01a | [MVP Scope](./01a-mvp-scope.md) | — | Khóa phạm vi v1: Must/Nice/Future (SSOT) | ✅ |
| 02 | [Roadmap](./02-roadmap.md) | — | Milestone, sprint/release | Nên |
| 03 | [Architecture](./03-architecture.md) | — | Vai trò, ports & adapters, luồng dữ liệu | ✅ |
| 03a | [Architecture Principles](./03a-architecture-principles.md) | 🏛️ Governing | Nguyên tắc kiến trúc bắt buộc | ✅ |
| 03b | [Domain Model](./03b-domain-model.md) | 🧭 LÕI | Khái niệm & luật nghiệp vụ | ✅ |
| 03c | [Content Model](./03c-content-model.md) | 🧭 LÕI | Loại nội dung & field (SSOT) | ✅ |
| 03d | [API Contract](./03d-api-contract.md) | 🧭 LÕI | Hợp đồng API logic (SSOT) | ✅ |
| 03e | [Data Model](./03e-data-model.md) | 🧭 LÕI | Mô hình dữ liệu logic (SSOT) | ✅ |
| 04 | [Persistence / Database](./04-database.md) | ⚙️ RÌA | Hiện thực lưu trữ vật lý | ✅ |
| 05 | [CMS Mapping (Directus)](./05-cms.md) | ⚙️ RÌA | Ánh xạ Content Model → CMS | ✅ |
| 06 | [API Implementation](./06-api.md) | ⚙️ RÌA | Ánh xạ Contract → endpoint | ✅ |
| 07 | [UI / UX & Design System](./07-ui-ux.md) | — | Ngôn ngữ thiết kế retro | Nên (trước UI) |
| 08 | [Deployment](./08-deployment.md) | — | CI/CD, môi trường, release | Nên |
| 09 | [Coding Standards](./09-coding-standards.md) | — | Quy ước code | ✅ |
| 10 | [Decisions (ADR index)](./10-decisions.md) | — | Ghi nhận & tra cứu quyết định | ✅ |
| 10a | [Tech Stack](./10a-tech-stack.md) | ⚙️ RÌA | Sổ đăng ký công nghệ theo vai trò | Nên |
| 11 | [Testing Strategy](./11-testing.md) | — | Triết lý test, cổng chất lượng | Nên |
| 12 | [Security](./12-security.md) | — | Threat model, xác thực, secrets | Nên (baseline) |
| 13 | [Operations](./13-operations.md) | — | Runbook, observability, backup | Trước staging/prod |
| 14 | [Quality Gates](./14-quality-gates.md) | — | DoR/DoD, checklist review | ✅ (DoD) |
| 15 | [SEO & Accessibility](./15-seo-accessibility.md) | — | SEO & a11y cho blog | Trước launch |
| 16 | [Glossary](./16-glossary.md) | — | Ngôn ngữ chung | ✅ (seed) |
| 17 | [Contributing](./17-contributing.md) | — | Quy trình đóng góp & viết docs | Nên |
| — | [ADR/](./adr/) | — | Kho Architecture Decision Record | ✅ |
| — | [reviews/](./reviews/) | — | Review & change report | — |
| — | [sprints/](./sprints/) | — | Kế hoạch triển khai theo sprint | — |

> 📌 **Còn thiếu (đợt refactor sau):** `Information Architecture / Navigation` của site (Đợt 3). Xem [Architecture Review Report](./reviews/architecture-review-2026-07-21.md).

---

## 3. Thứ tự đọc (theo tầng — LÕI trước RÌA)

- **Pha 0 — Nền tảng:** `16-glossary` → `00-project` → `03a-architecture-principles` → `17-contributing` → `10-decisions` + `adr/0001`.
- **Pha 1 — Định hướng:** `01-requirements` → `01a-mvp-scope` → `02-roadmap` → `03-architecture` → `adr/0002–0005` + `10a-tech-stack`.
- **Pha 2a — LÕI (CỔNG trước code):** `03b-domain-model` → `03c-content-model` → `03d-api-contract` → `03e-data-model`.
- **Pha 2b — RÌA:** `04-database` → `05-cms` → `06-api`.
- **Pha 2c — Thiết kế & chất lượng:** `07-ui-ux` → `09-coding-standards` → `14-quality-gates` → `11-testing` → `12-security` (baseline).
- **Pha 3 — Vận hành:** `08-deployment` → `13-operations` → `15-seo-accessibility` → `12-security` (đầy đủ).

> 🚦 Cổng "Sẵn sàng code": các tài liệu ✅ phải đạt 🟢 — chi tiết [14-quality-gates §5](./14-quality-gates.md).

---

## 4. Quy ước thêm/điều hướng tài liệu

1. Chèn tài liệu mới bằng **hậu tố chữ** trên số gần nhất (không renumber); cập nhật bảng §2.
2. Không dùng header trạng thái/owner/ngày — git ghi lịch sử ([17 §4](./17-contributing.md)).
3. Quy tắc *tầng LÕI/RÌA*, *tech-neutral*, *link giữa các tầng* → xem [03a-architecture-principles](./03a-architecture-principles.md). Quy trình viết docs → [17-contributing](./17-contributing.md).
4. Ngôn ngữ: tiếng Việt diễn giải, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.
