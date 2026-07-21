# 01a — MVP Scope

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** **Khóa phạm vi phiên bản đầu tiên (v1)** — là **SSOT** cho câu hỏi *"cái gì thuộc MVP?"*. Phân loại các hạng mục *đã có* thành **Must Have / Nice To Have / Future** để tránh mở rộng ngoài kế hoạch.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) (nguồn FR/NFR) · [03c-content-model](./03c-content-model.md) (content types) · [02-roadmap](./02-roadmap.md) · [14-quality-gates](./14-quality-gates.md)

---

> 🔒 **Đây là tài liệu KHÓA PHẠM VI.** Nó **không định nghĩa feature mới** — chỉ *phân loại* các hạng mục đã có ở `01-requirements` và `03c-content-model`. Mọi thay đổi Must/Nice/Future phải qua **§7 Scope Change Control**.

## 1. Cách dùng tài liệu

- Trả lời một câu hỏi: *hạng mục X có nằm trong v1 không?* → tra §3/§4/§5.
- **Nguồn định nghĩa** của mỗi hạng mục vẫn ở `01-requirements` (FR/NFR) và `03c-content-model` (content types); tài liệu này chỉ *lọc & xếp loại*.
- 3 mức: **Must** = không có thì không phát hành được · **Nice** = vào v1 nếu đủ nguồn lực, *cắt được không hoãn launch* · **Future** = không thuộc v1 (chống scope creep).

## 2. Tuyên bố MVP (MVP Goal)

> Phiên bản đầu tiên = **một blog vận hành được đầu-cuối**: độc giả đọc được các bài *đã xuất bản* (tổ chức theo chuyên mục); biên tập viên soạn, đính ảnh và *xuất bản* bài qua CMS.

- Suy ra từ nhóm FR "Must" của [01-requirements](./01-requirements.md) + tầm nhìn [00-project](./00-project.md) (nếu vision đổi → cập nhật qua §7).
- **"MVP xong" khi:** hoàn thành toàn bộ §3, đạt DoD phát hành ([14 §2.2](./14-quality-gates.md)), qua mốc [02-roadmap M3 — Launch](./02-roadmap.md).

## 3. ✅ Must Have (BẮT BUỘC trong v1)

| Hạng mục | Nguồn | Vì sao Must |
|---|---|---|
| Xem danh sách bài đã xuất bản | FR-R1 | Cửa vào của blog |
| Đọc chi tiết một bài | FR-R2 | Giá trị cốt lõi cho độc giả |
| Soạn/sửa bài trong CMS | FR-E1 | Không có thì không tạo được nội dung |
| Lưu nháp & xem trước | FR-E2 | Quy trình biên tập tối thiểu |
| Quản lý media (ảnh bìa) | FR-E4 | Bài cần ảnh; alt-text a11y |
| **Xuất bản** bài (Nháp → Đã xuất bản) | [03b §4](./03b-domain-model.md) (state machine, nhánh *Published*) | Không xuất bản = không có blog |
| Content types tối thiểu: **Post, Author, Category, Media** | [03c](./03c-content-model.md) §2.1/2.2/2.3/2.5 | Đủ để hiển thị một bài có tác giả, chuyên mục + ảnh |
| Tổ chức & duyệt nội dung theo **Category** | FR-R3 (phần Category); [03c §2.3](./03c-content-model.md) | Category định hình information architecture, navigation & khả năng mở rộng nội dung |
| Quản trị & phân quyền cơ bản — **chỉ Admin + Editor** | FR-A1, [05-cms §2](./05-cms.md), [12-security](./12-security.md) | Vận hành CMS an toàn. **Không** gồm: frontend authentication, user account, permission phức tạp, custom RBAC (xem §6) |

**Chuẩn phi chức năng áp cho MVP (Must):** responsive · HTTPS · HTML ngữ nghĩa + SEO cơ bản (title/meta/sitemap) · a11y baseline (alt, bàn phím, tương phản — [15](./15-seo-accessibility.md)) · mục tiêu Core Web Vitals · không lộ secret ([12](./12-security.md)). Nguồn: [01 §2 NFR](./01-requirements.md).

## 4. 🟡 Nice To Have (vào v1 nếu đủ nguồn lực — cắt được)

| Hạng mục | Nguồn | Ghi chú |
|---|---|---|
| Duyệt theo **Tag** | FR-R3 (phần Tag) | Kèm content type **Tag** ([03c §2.4](./03c-content-model.md)); Category đã là Must (§3) |
| RSS / Atom feed | FR-R5 (Should) | |
| Lên lịch xuất bản (Scheduled) | FR-E3 (phần "schedule"); [03b §4](./03b-domain-model.md) nhánh *Scheduled* | "Publish" là Must; "schedule" là Nice |
| Trạng thái *Chờ duyệt* (In Review) | [03b §4](./03b-domain-model.md) | Chỉ cần khi nhiều biên tập viên |

> ✂️ Các mục này **có thể cắt khỏi v1** mà không hoãn launch.

## 5. 🔮 Future (KHÔNG thuộc v1 — chống scope creep)

| Hạng mục | Ghi chú / nguồn |
|---|---|
| Tìm kiếm bài viết | FR-R4 (Could) |
| Đa ngôn ngữ (i18n) | [03c §6](./03c-content-model.md) — ghi rõ "ngoài MVP" |
| Bình luận, newsletter/đăng ký | Chưa có trong yêu cầu — **không đưa vào v1** |
| Dark/light mode | [07-ui-ux §6](./07-ui-ux.md) — hoãn |
| Related posts, analytics dashboard, tối ưu ảnh nâng cao/CDN, full-text search | **Anti-scope** cho v1 |

> ⛔ Các mục Future **không được** đưa vào v1 nếu không qua §7.

## 6. Anti-scope (ranh giới cứng)

- Không xây tính năng ngoài §3/§4.
- Không thêm content type ngoài **Post, Author, Category, Tag, Media** ([03c](./03c-content-model.md)).
- Không tối ưu sớm (search, cache nâng cao, i18n, CDN) khi chưa cần.
- **Phân quyền chỉ gồm Admin + Editor.** KHÔNG: frontend authentication · user account (đăng ký/đăng nhập độc giả) · permission system phức tạp · custom RBAC ([05-cms §2](./05-cms.md), [12-security](./12-security.md)).

## 7. Kiểm soát thay đổi phạm vi (Scope Change Control)

Bất kỳ thay đổi Must/Nice/Future nào phải:
1. Ghi vào **Nhật ký quyết định nhẹ** ([10 §5](./10-decisions.md)) — hoặc **ADR** nếu ảnh hưởng kiến trúc.
2. Cập nhật bảng phân loại ở tài liệu này.
3. Đồng bộ [02-roadmap](./02-roadmap.md) nếu đổi thứ tự phát hành.

> Mục tiêu: chặn *scope creep* giữa Sprint. "Có vẻ dễ thêm" **không** phải lý do đưa vào v1.

## 8. Truy vết (Traceability)

| Hạng mục MVP (§3) | Nguồn | Milestone ([02](./02-roadmap.md)) |
|---|---|---|
| Đọc bài (FR-R1/R2) | 01, 03c, 03d | M2 (MVP nội dung) |
| Tổ chức theo Category (FR-R3 phần Category) | 01, 03c | M2 |
| Soạn/xuất bản (FR-E1/E2/E4) | 01, 03b, 03c, 05 | M2 |
| Quản trị Admin+Editor (FR-A1) | 01, 05, 12 | M2 |
| Chuẩn NFR (SEO/a11y/perf/security) | 01 §2, 12, 15 | M3 (Launch) |
