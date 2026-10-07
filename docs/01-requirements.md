# 01 — Requirements

> 🎯 **Mục đích:** Định nghĩa *cái gì* hệ thống phải làm (chức năng) và *tốt đến đâu* (phi chức năng). Là nguồn để lập roadmap, thiết kế và kiểm thử.
> 🔗 **Liên quan:** [00-project](./00-project.md) · [02-roadmap](./02-roadmap.md) · [11-testing](./11-testing.md) · [15-seo-accessibility](./15-seo-accessibility.md)

---

## 1. Yêu cầu chức năng (Functional Requirements)

> Ưu tiên theo **MoSCoW**: Must / Should / Could / Won't. Mỗi yêu cầu có tiêu chí chấp nhận (Acceptance Criteria) kiểm chứng được.

### 1.1. Trải nghiệm độc giả (Reader)

| ID | Yêu cầu / User story | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-R1 | Xem danh sách bài viết mới nhất | Must | ... |
| FR-R2 | Đọc chi tiết một bài viết | Must | ... |
| FR-R3 | Duyệt theo category / tag | Should | ... |
| FR-R4 | Tìm kiếm bài viết | Could | ... |
| FR-R5 | RSS / Atom feed | Should | ... |

### 1.2. Biên tập & xuất bản (Editorial)

| ID | Yêu cầu / User story | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-E1 | Soạn/sửa bài trong Directus | Must | ... |
| FR-E2 | Lưu nháp (draft) & xem trước (preview) | Must | ... |
| FR-E3 | Xuất bản / lên lịch (schedule) | Should | ... |
| FR-E4 | Quản lý media (ảnh, thumbnail) | Must | ... |

### 1.3. Quản trị (Admin)

| ID | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-A1 | Quản lý người dùng & phân quyền | Must | ... |
| FR-A2 | ... | ... | ... |

## 2. Yêu cầu phi chức năng (Non-Functional Requirements)

| Nhóm | Yêu cầu | Mục tiêu định lượng | Ghi chú |
|---|---|---|---|
| Hiệu năng (Performance) | Core Web Vitals | LCP < 2.5s, CLS < 0.1, INP < 200ms | Đo trên 4G |
| SEO | Chỉ mục & structured data | Sitemap, JSON-LD Article | Xem [15](./15-seo-accessibility.md) |
| Accessibility | Tuân thủ WCAG | 2.2 mức AA | Xem [15](./15-seo-accessibility.md) |
| Bảo mật (Security) | Baseline security | Không lộ secrets, HTTPS bắt buộc | Xem [12](./12-security.md) |
| Độ tin cậy (Reliability) | Uptime | ≥ 99.x% | Xem [13](./13-operations.md) |
| Khả năng bảo trì | Chuẩn code & test | Lint pass, coverage ≥ _x%_ | Xem [09](./09-coding-standards.md), [11](./11-testing.md) |
| Đa ngôn ngữ (i18n) | Hỗ trợ ngôn ngữ | _(có/không?)_ | ... |
| Quyền riêng tư | Cookie/analytics/GDPR | ... | Xem [12](./12-security.md) |
| Khả năng mở rộng | Lượng bài/traffic mục tiêu | ... | ... |
| Observability | Log/metric/alert | ... | Xem [13](./13-operations.md) |

## 3. Ràng buộc kỹ thuật (Technical Constraints)

- TODO _(trình duyệt hỗ trợ, thiết bị, hosting, ngân sách hạ tầng...)_.

## 4. Ngoài phạm vi (Explicitly Out of Scope)

- TODO.

## 5. Truy vết (Traceability)

> Mỗi FR/NFR nên map tới: mục roadmap → thiết kế → test case. Bảng dưới cập nhật dần.

| Requirement ID | Roadmap item | Tài liệu thiết kế | Test |
|---|---|---|---|
| FR-R1 | ... | ... | ... |
