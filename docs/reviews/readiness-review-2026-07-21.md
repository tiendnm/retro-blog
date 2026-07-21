# 🚦 Pre-Implementation Readiness Review — Retro Blog

> **Ngày:** 2026-07-21 · **Người review:** Staff Software Architect · **Phạm vi:** toàn bộ `docs/` như một hệ thống · **Loại:** review-only (KHÔNG sửa tài liệu)
>
> ❓ **Câu hỏi duy nhất:** *Một developer có thể bắt đầu triển khai Sprint 1 ngày mai mà không cần dừng lại để đưa ra quyết định kiến trúc lớn hay không?*
> ✅ **Trả lời ngắn:** **CÓ.** Không có quyết định kiến trúc lớn nào còn thiếu. Xem §9 (Exit Decision) và §10 (Action Plan close-out).

---

## 1. Executive Summary

Hệ thống tài liệu đã đạt độ chín **kiến trúc** cần thiết để bàn giao: stack đã chọn (ADR 0002–0005), kiến trúc mô tả theo **ports & adapters**, phân tầng **LÕI/RÌA** rõ ràng và được kiểm chứng tự động, **SSOT sạch**, **0 link hỏng**, **0 orphan**.

Phần còn "trống" của tài liệu là **nội dung chi tiết (TODO)** — điều này **bình thường** ở cuối Sprint 0 và sẽ được điền *trong* Sprint 1 khi quyết định được đưa ra *đúng ngữ cảnh*. Không phần trống nào là một *quyết định kiến trúc lớn* chặn việc bắt đầu.

**Kết luận:** 🟢 **READY TO CODE** — đề nghị **đóng Sprint 0** và bắt đầu **Sprint 1**, sau khi thực hiện một **close-out tối thiểu (~nửa ngày)** ở §10 (chủ yếu là *phê duyệt*, không phải thiết kế lại).

| Hạng mục audit | Kết quả |
|---|---|
| Link hỏng | **0** ✅ |
| Orphan (tài liệu không được tham chiếu) | **0** ✅ |
| Trùng lặp SSOT | **0** (Post định nghĩa 1 lần, nơi khác *dẫn xuất*) ✅ |
| Tech-neutral tầng LÕI (03b–03e) | **0 tên công nghệ** ✅ |
| ADR cho stack | 4/4 tồn tại, trạng thái **Proposed** ⚠️ (cần ratify) |
| Blocker kiến trúc | **0** ✅ |
| Vi phạm ranh giới (P8 link xuống RÌA) | 4 file — mức **LOW** ⚠️ |
| Cross-ref lỗi thời (glossary) | 4 link — mức **LOW** ⚠️ |

---

## 2. Architecture Audit

**Đã quyết định (dev không phải dừng):**
- **Kiến trúc & vai trò:** Presentation, Headless Content Service, Content Store, Edge/Proxy, Build/Deploy Orchestrator — mô tả theo *port* ổn định + *adapter* thay được ([03-architecture](../03-architecture.md)).
- **Stack (adapter):** Astro / Directus / PostgreSQL / Docker — mỗi cái có ADR nêu Principle + trade-off + chi phí migration ([10a-tech-stack](../10a-tech-stack.md), [adr/](../adr/)).
- **Phân tầng & nguyên tắc:** P0–P9 governing ([03a](../03a-architecture-principles.md)); LÕI (Domain/Content/API Contract/Data Model) tách khỏi RÌA (Persistence/CMS/API Impl).
- **Render default:** static-first (đã hàm ý trong [ADR-0002](../adr/0002-use-astro-site-generator.md)).

**Còn mở (quyết trong Sprint 1, không chặn):** chi tiết render per-page (ADR-0006), tối ưu ảnh, search, caching, versioning, cấu trúc error, danh sách biến cấu hình. Tất cả có *default hợp lý* — xem §7.

**Đánh giá:** kiến trúc **đủ ổn định để scaffold + render nội dung MVP** ngay. Không thiếu style/quyết định kiến trúc lớn nào.

---

## 3. Consistency Report

Kiểm chứng tự động trên toàn `docs/`:

| Chỉ số | Giá trị | Diễn giải |
|---|---|---|
| Link nội bộ hỏng | 0 | Toàn bộ tham chiếu resolve được |
| Tài liệu không được trỏ tới | 0 | Mọi tài liệu có ≥1 inbound ref |
| Tên công nghệ trong LÕI | 0 | Nguyên tắc 0 được giữ |
| ADR đủ field bắt buộc (Principle+Migration) | 5/5 | Governance G1 được tuân |
| Trạng thái 🟢 (Đã duyệt) | **0 file** | Chưa tài liệu nào được ratify chính thức |

> ⚠️ **Điểm cần lưu ý:** chưa tài liệu nào ở trạng thái 🟢 và ADR đều **Proposed**. Đây là *ratification gap* (phê duyệt), không phải *content gap* — xử lý ở §10. Mật độ TODO cao ở các tài liệu template là **kỳ vọng được** cho cuối Sprint 0.

---

## 4. Single Source of Truth Review

Mỗi khái niệm cốt lõi có **đúng một** tài liệu nguồn — không phát hiện trùng lặp:

| Khái niệm | SSOT | Nơi khác chỉ *dẫn xuất/tham chiếu* |
|---|---|---|
| Architecture (logic) | `03-architecture` | 10a, các ADR |
| Architecture Principles | `03a` | mọi doc kiến trúc & ADR trích dẫn |
| Domain Model | `03b` | 03c/03e tham chiếu luật |
| Content Model | `03c` | 03d (DTO dẫn xuất), 03e, 05 |
| API Contract | `03d` | 06 (ánh xạ endpoint) |
| Data Model (logic) | `03e` | 04 (ánh xạ vật lý) |
| CMS mapping | `05` | — |
| Persistence/Database | `04` | — |
| API Implementation | `06` | — |
| Deployment | `08` | 03 §8 (chủ sở hữu topology đã phân định) |
| Security | `12` | 05/08/13 tham chiếu |
| Tech Stack | `10a` | 03, README |
| ADR | `adr/` + index `10` | — |

**Kiểm tra "Post":** định nghĩa **1 lần** ở `03c §2.1`; `03d` DTO ghi rõ `← 03c: Post.title`; `06` chỉ *ánh xạ*; `16-glossary` chỉ là mục từ điển. ✅ Không trùng lặp.

---

## 5. Cross Reference Review

- **Link hỏng:** 0 ✅
- **Orphan:** 0 ✅ (mọi tài liệu được tham chiếu; các file trong `reviews/` là artifact lịch sử, terminal — đúng thiết kế)
- **Tham chiếu vòng có hại:** Không. Các link tương hỗ giữa `03c↔03d↔03e` là **cùng tầng LÕI** (sibling), hợp lệ theo P8, không tạo phụ thuộc vòng độc hại.
- **Link lỗi thời (LOW):** 4 mục trong `16-glossary` trỏ tới *nơi không còn là SSOT* sau refactor:

| Dòng | Hiện trỏ | Nên trỏ |
|---|---|---|
| Post → `[04]` | Persistence (sai) | `03b`/`03c` |
| Draft → `[05]` | CMS Mapping | `03b` (state machine) |
| Data contract → `[06]` | API Impl | `03d` |
| Header "Liên quan" → `[04][05]` | — | thêm `03b`/`03c` |

> (Mục "Collection → [05]" là **đúng** — Collection là khái niệm của tầng CMS.)

---

## 6. Layer Boundary Review

**PASS — tiêu chí quan trọng nhất:** tầng LÕI (03b–03e) **hoàn toàn không chứa tên công nghệ** (grep = 0). Domain không phụ thuộc công nghệ; Content Model không chứa collection/kiểu cột; API Contract không chứa endpoint; Data Model không chứa index/migration. Nguyên tắc 0 & P9 được giữ trong *nội dung*.

**Phát hiện (LOW) — P8 "link chỉ đi lên":** các tài liệu LÕI hiện có **link "xuống" tầng RÌA** (con trỏ "xem hiện thực"): `03b→05`, `03c→05`, `03d→06`, `03e→04` (ở header "Liên quan" và vài dòng inline). Theo *chữ* của P8 ("tài liệu LÕI chỉ link tới LÕI/Principles"), đây là vi phạm nhẹ.

- Đây là **con trỏ thông tin (non-normative)**, không phải phụ thuộc nội dung — tài liệu LÕI vẫn *hoàn chỉnh & đúng* khi không có tài liệu RÌA. Không rò rỉ công nghệ.
- **Đề xuất (chọn 1, không chặn code):** (a) gỡ các link xuống ở LÕI (các doc RÌA đã link *lên* nên vẫn tìm thấy nhau); **hoặc** (b) sửa P8 để cho phép một "▼ con trỏ hiện thực" có nhãn rõ. → Đề nghị (b): rẻ, giữ tính hữu ích, và làm P8 khớp thực tế.

---

## 7. Blocking Issues

> **KHÔNG có blocker kiến trúc.** Đối chiếu từng quyết định thường bị coi là "chặn":

| Quyết định | Phân loại | Vì sao KHÔNG chặn Sprint 1 |
|---|---|---|
| Chiến lược rendering | **NON-BLOCKER** | static-first đã set (ADR-0002); chi tiết per-page (ADR-0006) quyết trong sprint |
| Authentication | **NON-BLOCKER** | Reader: không cần; Editor: admin của CMS; Public API: public role — đã quyết qua stack |
| Xử lý ảnh | **NON-BLOCKER** | CMS Files phục vụ ảnh; tối ưu/transform quyết sau; luật alt-text đã có ở LÕI |
| Search | **NON-BLOCKER** | FR-R4 mức "Could" — ngoài MVP |
| Caching | **NON-BLOCKER** | SSG ⇒ tài sản tĩnh; CDN/edge thêm sau |
| Versioning | **NON-BLOCKER** | Một consumer nội bộ ở MVP; chính sách quyết sau |
| Error model | **NON-BLOCKER** | Loại lỗi logic đã có ở 03d §5; cấu trúc cụ thể quyết trong sprint |
| Configuration model | **NON-BLOCKER** | Cách tiếp cận (12-factor env) đã quyết qua P5; danh sách biến quyết trong sprint |

> **Lưu ý ratification:** việc ADR còn **Proposed** không phải *quyết định kiến trúc còn thiếu* — quyết định đã được ghi; chỉ cần *phê duyệt* (§10 A1). Đây là hành động đóng Sprint 0, không phải blocker giữa Sprint 1.

---

## 8. Non-Blocking Improvements

> Không nice-to-have. Đây là các mục nên làm ở **close-out** hoặc sớm trong Sprint 1 để tránh ma sát ngày 1–2. Không cái nào chặn *bắt đầu*.

1. **Hoàn thiện Content Model MVP** (`03c §2.2`): điền field cho Author/Category/Tag/Media (thường lệ, suy ra từ `03b`) và reconcile với `03d` (author fields) + `03e` (thực thể). → cần cho việc dựng schema, nhưng là *điền spec*, không phải quyết định kiến trúc.
2. **Sửa 4 link lỗi thời ở glossary** (§5).
3. **Reconcile P8** (§6) — chọn (a) hoặc (b).
4. **(Đợt 3 tồn đọng, không chặn):** tách Design System khỏi binding framework (F11); ranh giới Glossary↔Domain (F14); cân nhắc tách SEO/A11y (F15); tạo Information Architecture/Navigation của site khi bắt đầu làm UI/route (F12).

---

## 9. Sprint 0 Exit Decision

# 🟢 READY TO CODE

**Cơ sở:** không thiếu quyết định kiến trúc lớn nào; stack/vai trò/port/phân tầng đã quyết; SSOT & liên kết sạch; các quyết định còn mở đều có default hợp lý và thuộc loại "quyết trong khi triển khai".

**Điều kiện đi kèm (close-out, ~nửa ngày — §10):** phê duyệt ADR + điền stub Content Model MVP + sửa vài link. Đây là *hành động đóng Sprint 0*, do Tech Lead/Architect thực hiện, **không** phải công việc thiết kế cho developer.

→ **Đề nghị đóng Sprint 0 và khởi động Sprint 1 (M1: dựng khung Astro/Directus/Docker chạy local).**

---

## 10. Action Plan (tập nhỏ nhất trước Sprint 1)

| # | Hành động | Ai | Loại | Chặn code? |
|---|---|---|---|---|
| **A1** | Ratify **ADR 0002–0005**: Proposed → **Accepted**; cập nhật `10a`/`10`/`adr/README` | Tech Lead | Phê duyệt (phút) | Nên xong trước |
| **A2** | Điền Content Model MVP ở `03c §2.2` (Author/Category/Tag/Media) + reconcile `03d`/`03e` | Architect | Điền spec (giờ) | Nên xong trước (cho schema) |
| **A3** | Sửa 4 link lỗi thời trong `16-glossary` (§5) | Architect | Link (phút) | Không |
| **A4** | Chọn cách reconcile P8 (§6a hoặc §6b) và áp dụng | Architect | Governance (phút) | Không |
| **A5** | Sau A1–A2: nâng trạng thái các tài liệu ✅ (gate 14 §5) lên 🟢 | Tech Lead | Phê duyệt | Không |

> ✋ **Không mở rộng thêm.** Ngoài A1–A5, không cần tạo/viết thêm tài liệu để bắt đầu Sprint 1. Render strategy (ADR-0006) và các mục ở §7 được quyết *trong* Sprint 1.

---

> **Bảo toàn lịch sử:** báo cáo này chỉ đọc & không sửa tài liệu; ADR và các Change Report được giữ nguyên. Đặt trong `docs/reviews/` cùng các review trước.
