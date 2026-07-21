# ✅ Sprint 0 Close-out Report — Retro Blog

> **Ngày:** 2026-07-21 · **Người thực hiện:** Staff Software Architect · **Phạm vi:** đúng A1–A5 (tối thiểu) theo [Readiness Review §10](./readiness-review-2026-07-21.md)
> **Kết quả:** 🟢 **SPRINT 0 ĐÓNG.** Sẵn sàng Sprint 1 (Implementation).
>
> Không tạo tài liệu kiến trúc mới · Không mở wave review mới · Giữ nguyên numbering & lịch sử ADR/review.

---

## 1. Các hành động đã thực hiện

### A1 — Ratify ADR 0002–0005 (Proposed → Accepted)
- `adr/0002` (Astro), `adr/0003` (Directus), `adr/0004` (PostgreSQL), `adr/0005` (Docker): **Status → Accepted** (ratified 2026-07-21). **Nội dung quyết định không đổi** — chỉ cập nhật metadata (Status, ngày Accepted, người quyết).
- Index đồng bộ: `10-decisions §4`, `10a-tech-stack §2`, `adr/README` đều hiển thị **Accepted**.
- ℹ️ **ADR-0001** (process "dùng ADR") **giữ Proposed** — ngoài phạm vi A1. Đề nghị ratify ở đầu Sprint 1 (không chặn code).

### A2 — Hoàn thiện Content Model MVP (`03c`)
- Bổ sung định nghĩa field cho **Author (2.2), Category (2.3), Tag (2.4), Media (2.5)** bằng kiểu trung lập (tech-neutral).
- Bổ sung **§3 Quan hệ** và firm **§5** (alt-text bắt buộc, slug duy nhất/ổn định).
- **Nhất quán chéo đã xác nhận:**

| Điểm nhất quán | Kết quả |
|---|---|
| `03d` DTO `author {name, slug}` ↔ `03c` Author.name/slug | ✅ khớp |
| `03d` DTO `cover {url, alt}` ↔ `03c` Media.file/alt | ✅ khớp |
| `03e` thực thể Author/Category/Tag (id + slug unique) ↔ `03c` | ✅ khớp |
| `03e` Category parent (phân cấp) ↔ `03c` Category.parent & `03b` | ✅ khớp |
| Không mở rộng feature ngoài MVP (i18n để "ngoài MVP") | ✅ |

### A3 — Sửa cross-reference lỗi thời trong Glossary (`16`)
> Chỉ sửa **link**, **không đổi định nghĩa**.

| Mục | Trước | Sau |
|---|---|---|
| Header "Liên quan" | `[04-database]`,`[05-cms]` | `[03b-domain-model]`,`[03c-content-model]` |
| Post | `[04]` | `[03b]` |
| Draft | `[05]` | `[03b §4]` |
| Data contract | `[06]` | `[03d]` |

> (`Collection → [05]` giữ nguyên — đúng, là khái niệm tầng CMS.)

### A4 — Reconcile Architecture Principle P8 (`03a`)
- P8 được cập nhật: **cho phép** tài liệu LÕI chứa *con trỏ hiện thực không mang tính chuẩn tắc* (non-normative) trỏ xuống RÌA, **với điều kiện** *định nghĩa* LÕI không phụ thuộc RÌA (xoá con trỏ đi vẫn đúng & đủ).
- Kiểm chứng mới của P8: (1) LÕI grep tên công nghệ = 0; (2) bỏ mọi link RÌA khỏi LÕI thì định nghĩa vẫn hoàn chỉnh.
- ⇒ Các con trỏ "▼ Hiện thực" hiện có ở `03b/03c/03d/03e` **nay hợp lệ** (không cần gỡ). "Core không phụ thuộc Edge" được giữ.

### A5 — Cập nhật trạng thái tài liệu
- Nâng **🟢 Đã duyệt** cho cụm kiến trúc đã được review & chốt: `03`, `03a`, `03b`, `03c`, `03d`, `03e`, `10`, `10a` (+ ADR 0002–0005 Accepted).
- Các tài liệu spec/impl còn lại (`00, 01, 02, 04–09, 11–17`) **giữ trạng thái living** — sẽ điền/duyệt *trong* Sprint 1 khi quyết định đúng ngữ cảnh (đúng kết luận Readiness Review). Đây là *diễn giải có chủ đích* của cổng [14 §5](../14-quality-gates.md): nền tảng kiến trúc (cụm 🟢 + ADR Accepted) đã đủ để bắt đầu; phần còn lại là fill-in-sprint, không chặn.

---

## 2. Kiểm chứng sau close-out (đã chạy)

```
[1] Broken links ................. 0            ✅
[2] LÕI 03b–03e: tên công nghệ ... 0            ✅
[3] ADR: 0001 Proposed; 0002–0005 Accepted ..... ✅
[4] Glossary: Post→03b, Draft→03b, Data contract→03d ✅
[5] Trạng thái 🟢: 03,03a,03b,03c,03d,03e,10,10a  ✅ (8/8)
[6] Content Model MVP: Post/Author/Category/Tag/Media ✅
[7] P8 reconciled (non-normative pointer allowed) . ✅
```

---

## 3. Trạng thái tài liệu sau close-out

| Nhóm | Tài liệu | Trạng thái |
|---|---|---|
| Governing | `03a` | 🟢 |
| Kiến trúc | `03` | 🟢 |
| LÕI | `03b`, `03c`, `03d`, `03e` | 🟢 |
| Decisions/Stack | `10`, `10a` | 🟢 |
| ADR stack | `0002–0005` | ✅ Accepted |
| ADR process | `0001` | Proposed (ratify đầu Sprint 1) |
| Spec/Impl/Ops (living) | `00,01,02,04,05,06,07,08,09,11,12,13,14,15,16,17` | 🔴/🟡 — điền trong Sprint 1 |

---

## 4. Xác nhận đóng Sprint 0

> ## 🟢 SPRINT 0 — CLOSED

- Nền tảng tài liệu & kiến trúc hoàn tất; stack đã ratify; SSOT sạch; ranh giới tầng nhất quán; 0 link hỏng.
- Không blocker kiến trúc còn lại.

**Sprint kế tiếp: Sprint 1 — Implementation** (mốc M1: dựng khung Astro/Directus/Docker chạy local; xem [02-roadmap](../02-roadmap.md)).

**Quyết định "quyết-trong-sprint" (không chặn khởi động):** chốt phiên bản công nghệ; ADR-0006 render strategy; chi tiết ảnh/search/caching/versioning/error/config — theo [Readiness Review §7](./readiness-review-2026-07-21.md).

---

## 5. Điều chỉnh cuối trước Implementation (2026-07-21)

Sau khi Tech Lead review & đồng ý đóng phạm vi v1:

- **MVP Scope (`01a`) → 🟢 Đã duyệt.**
- **Category: Nice → Must Have** (định hình information architecture, navigation & khả năng mở rộng nội dung); **Tag** giữ Nice To Have (bổ sung sau). Ghi [Decision Log (10 §5)](../10-decisions.md).
- **Phân quyền MVP làm rõ = chỉ Admin + Editor** — loại trừ frontend authentication, user account, permission phức tạp, custom RBAC. Cập nhật [`01a §3/§6`](../01a-mvp-scope.md) + Decision Log.
- **Không mở rộng phạm vi:** không feature / content type / architecture / documentation wave mới.
- **Sprint 1 Implementation Plan** đã tạo: [`sprints/sprint-1-implementation-plan.md`](../sprints/sprint-1-implementation-plan.md).

> Từ Sprint 1: **MVP Scope** = SSOT phạm vi · **Architecture Principles** = SSOT kiến trúc · **ADR** = SSOT quyết định công nghệ. Thay đổi các tài liệu này phải qua Decision Log/ADR + review.

---

> Lịch sử ADR & các review/change report được giữ nguyên. Báo cáo này đặt trong `docs/reviews/`. **Kết thúc Sprint 0.**
