# 14 — Quality Gates (Definition of Ready / Done, Review)

> 🎯 **Mục đích:** Định nghĩa *các cổng chất lượng* — khi nào một hạng mục sẵn sàng làm (Ready), khi nào coi là hoàn thành (Done), và checklist review. Tạo tiêu chuẩn chung, tránh "định nghĩa hoàn thành" mỗi người một kiểu.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [09-coding-standards](./09-coding-standards.md) · [11-testing](./11-testing.md)

---

## 1. Definition of Ready (DoR) — sẵn sàng để làm

Một hạng mục (story/task) chỉ được kéo vào sprint khi:

- [ ] Có mô tả rõ ràng & giá trị mang lại
- [ ] Tiêu chí chấp nhận (Acceptance Criteria) kiểm chứng được
- [ ] Phụ thuộc đã xác định & không bị chặn
- [ ] Đủ nhỏ để hoàn thành trong một sprint
- [ ] Ảnh hưởng thiết kế/UX đã làm rõ (nếu có)
- [ ] TODO: bổ sung theo team

## 2. Definition of Done (DoD) — hoàn thành

### 2.1. DoD cho một hạng mục (story)
- [ ] Đáp ứng toàn bộ tiêu chí chấp nhận
- [ ] Code theo chuẩn [09-coding-standards](./09-coding-standards.md), lint/format pass
- [ ] Có test phù hợp & pass ([11-testing](./11-testing.md))
- [ ] Đã được review & duyệt (mục 3)
- [ ] Tài liệu liên quan được cập nhật
- [ ] Không hạ thấp a11y/SEO/performance ([15](./15-seo-accessibility.md))
- [ ] Không cảnh báo bảo mật mới ([12](./12-security.md))

### 2.2. DoD cho một bản phát hành (release)
> **Checklist Launch cụ thể (Sprint 6):** [08-deployment §8](./08-deployment.md).

- [x] Toàn bộ cổng CI xanh ([08 §3](./08-deployment.md)) — `quality` + `build` _(workflow có từ Sprint 7; xác nhận xanh trên GitHub khi có remote)_
- [x] Backup trước khi phát hành ([13 §4](./13-operations.md)) — cơ chế + restore drill đạt _(S6)_
- [x] Checklist launch (SEO, a11y, security) đạt — [08 §8](./08-deployment.md) _(S6; a11y S3–S5)_
- [x] Kế hoạch rollback sẵn sàng — atomic swap về build trước _(S6, ADR-0008)_

## 3. Checklist Code Review

**Người viết (Author) — trước khi mở PR:**
- [ ] PR nhỏ, một mục đích; mô tả rõ "làm gì, tại sao"
- [ ] Tự review diff; đã chạy test & lint cục bộ

**Người review (Reviewer):**
- [ ] Đúng đắn (correctness) & xử lý edge case
- [ ] Dễ đọc, đúng chuẩn code
- [ ] Có test tương xứng
- [ ] Không rủi ro bảo mật / lộ secret
- [ ] Không nợ kỹ thuật vô cớ

## 4. Điều kiện merge

- CI xanh là điều kiện bắt buộc: job **`quality`** (lint → format → typecheck → test) là required check ngay; job **`build`** (cần Directus + Postgres + seed) chạy `continue-on-error` cho tới khi ổn định (vài lần xanh liên tiếp), rồi nâng thành required — Product xác nhận lúc nâng.
- **Branch protection (đã bật, 2026-10-07)** trên `main` của repo public `tiendnm/retro-blog`: required check **`quality`**, cấm force-push và xoá nhánh. `enforce_admins=false` → chủ repo vẫn push thẳng được (repo một người); người khác chỉ merge được khi `quality` xanh. Job `build` chưa required (còn `continue-on-error`). Gói GitHub Free chỉ cho protection ở repo **public**.
- Branch protection + required checks (`quality`): bật trên GitHub khi repo có remote.

## 5. Cổng "Sẵn sàng bắt đầu code" (Ready to Code — thoát Sprint 0) — ✅ đã qua

> Cổng riêng cho giai đoạn tài liệu. Không viết code cho tới khi:

- [ ] `00-project`, `01-requirements` (MVP), `03-architecture` đạt 🟢
- [ ] `04-database`, `05-cms`, `06-api` (content model & hợp đồng dữ liệu) đạt 🟢
- [ ] `09-coding-standards` đạt 🟢
- [ ] ADR cho stack chính (Astro/Directus/DB/Docker) ở trạng thái Accepted
- [ ] Mục 2 (DoD) đã được thống nhất
