# 17 — Contributing & Documentation Guide

> 🎯 **Mục đích:** Hướng dẫn *cách đóng góp* vào dự án (code lẫn tài liệu) — quy trình làm việc tinh gọn và quy ước viết docs-as-code.
> 🔗 **Liên quan:** [09-coding-standards](./09-coding-standards.md) · [14-quality-gates](./14-quality-gates.md) · [README](./README.md)

---

## 1. Trước khi bắt đầu

- Đọc [docs/README](./README.md) để nắm bản đồ tài liệu và [00-project](./00-project.md) để hiểu mục tiêu.
- Chạy dự án: xem [README gốc](../README.md) (Getting Started).

## 2. Quy trình làm việc (tinh gọn)

```
sprint brief → commit nhỏ → CI xanh → review ở ranh giới sprint → đóng sprint
```

**Sprint = một file** `docs/sprints/sprint-N.md`: mục tiêu, danh sách việc (checkbox), tiêu chí xong; điền phần "Kết quả" khi hoàn tất. Không tách planning / plan / completion report.

**Cổng review (dừng chờ Product):**
- **Cuối mỗi sprint** — một lần.
- **Giữa sprint, chỉ khi** thay đổi hạ tầng/deploy, bảo mật/quyền, schema/Content Model/API Contract, hoặc kiến trúc. Việc khác (tooling, test, docs, format, seed) commit liên tục, không dừng.

**Thay đổi giao diện (Reader/UI/SEO render)** — bắt buộc kèm: build preview (Docker, theo quy trình chính thức), smoke test route liên quan, URL local + screenshot, và 3 mục *Changed / Unchanged / Product should verify*. Thay đổi không ảnh hưởng Reader (docs, ADR, script, CI, CMS metadata, tooling) **không** cần.

**Bằng chứng chất lượng = CI** (lint, format, typecheck, test, build) — không viết "Quality Report" riêng. Giới hạn đã biết ghi ngắn trong brief hoặc README.

**Kỷ luật phạm vi & kiến trúc:**
- Vấn đề ngoài scope → ghi Backlog trong brief, chờ Product quyết; không tự sửa.
- Giữ SSOT; ưu tiên thay đổi additive; không đổi kiến trúc/hợp đồng khi chưa được Product duyệt.
- **ADR chỉ cho quyết định khó đảo ngược** (DB, hosting, kiến trúc build, bảo mật, hợp đồng). Chọn công cụ dễ thay (linter, formatter) chỉ cần một dòng trong brief.

**Việc nhỏ ngoài sprint** (chỉnh UI nhỏ, seed, theme): commit `feat`/`fix` thẳng, không cần brief; chỉ ghi lại nếu đổi hợp đồng hoặc kiến trúc.

## 3. Quy ước commit & branch

- Conventional Commits; commit nhỏ, một mục đích; mô tả "làm gì / tại sao". Chi tiết: [09-coding-standards §8](./09-coding-standards.md).
- Đạt DoD & checklist review ([14](./14-quality-gates.md)).

## 4. Cách viết tài liệu (Docs-as-code)

- **Một file = một mối quan tâm.** Không giữ file chỉ toàn TODO — chưa cần thì chưa tạo.
- **Không dùng header "Trạng thái / Owner / Cập nhật lần cuối / Người duyệt"** — git đã ghi lịch sử; các trường này luôn lỗi thời. Chỉ giữ dòng 🎯 Mục đích + 🔗 Liên quan nếu hữu ích.
- Liên kết chéo bằng đường dẫn tương đối; thêm doc mới → cập nhật bảng ở [docs/README](./README.md).
- Ngôn ngữ: tiếng Việt diễn giải, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.

## 5. Cách thêm một ADR

- Chỉ cho quyết định khó đảo ngược. Sao chép [adr/0000-adr-template](./adr/0000-adr-template.md), đánh số tiếp theo. Xem [adr/README](./adr/README.md).
