# 17 — Contributing & Documentation Guide

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Hướng dẫn *cách đóng góp* vào dự án (cả code lẫn tài liệu) — quy trình, quy ước, và cách viết tài liệu docs-as-code. Giúp người mới bắt nhịp nhanh và giữ chất lượng nhất quán.
> 🔗 **Liên quan:** [09-coding-standards](./09-coding-standards.md) · [14-quality-gates](./14-quality-gates.md) · [README](./README.md)

---

## 1. Trước khi bắt đầu

- Đọc [docs/README](./README.md) để nắm bản đồ tài liệu.
- Đọc [00-project](./00-project.md) để hiểu mục tiêu.
- TODO: yêu cầu môi trường (bổ sung khi bắt đầu code).

## 2. Quy trình đóng góp (Workflow)

```
tạo branch → commit nhỏ, rõ nghĩa → mở PR → review → CI xanh → merge
```
1. Tạo branch từ nhánh chính theo quy ước [09 §8](./09-coding-standards.md).
2. Commit theo **Conventional Commits**.
3. Mở PR: mô tả "làm gì / tại sao", liên kết issue/story.
4. Đảm bảo đạt **DoD** & checklist review ([14](./14-quality-gates.md)).
5. Được duyệt & CI xanh → merge.

## 3. Quy ước commit & branch

- Xem [09-coding-standards §8](./09-coding-standards.md).

## 4. Cách chạy dự án

- TODO: bổ sung khi có code (link tới hướng dẫn setup).

## 5. Cách viết tài liệu (Docs-as-code)

- **Một file = một mối quan tâm.**
- Bắt đầu bằng **header block chuẩn** (trạng thái / owner / cập nhật / người duyệt / mục đích / liên quan).
- Cập nhật trường **Cập nhật lần cuối** mỗi lần sửa.
- Liên kết chéo bằng đường dẫn tương đối; thêm doc mới → cập nhật bảng ở [docs/README](./README.md).
- Ngôn ngữ: tiếng Việt diễn giải, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.
- Tài liệu review qua PR như code.

## 6. Cách thêm một ADR

- Sao chép [adr/0000-adr-template](./adr/0000-adr-template.md), đánh số tiếp theo, mở PR. Xem [adr/README](./adr/README.md).

## 7. Báo lỗi & Đề xuất

- TODO _(kênh báo lỗi/đề xuất, mẫu issue — bổ sung khi thiết lập repo)_.

## 8. Quy tắc ứng xử (Code of Conduct)

- TODO _(tùy chọn — nếu mở cho cộng đồng)_.
