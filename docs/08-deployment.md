# 08 — Deployment

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Mô tả *cách đưa code lên môi trường* — kiến trúc triển khai, pipeline CI/CD, quản lý secrets, và quy trình phát hành/rollback. Đảm bảo phát hành lặp lại được và an toàn.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [13-operations](./13-operations.md) · [12-security](./12-security.md)

---

## 1. Môi trường (Environments)

| Môi trường | Mục đích | URL | Ghi chú |
|---|---|---|---|
| dev (local) | Phát triển | localhost | Docker compose (dự kiến) |
| staging | Kiểm thử trước prod | TBD | Gần giống prod |
| production | Người dùng thật | TBD | |

> Ma trận cấu hình chi tiết theo môi trường: xem [13-operations](./13-operations.md).

## 2. Kiến trúc triển khai

> Các container/service khi chạy (Astro site, Directus, DB, reverse proxy/TLS). Sơ đồ tổng thể ở [03-architecture §3](./03-architecture.md).

- TODO.

## 3. Pipeline CI/CD

| Giai đoạn | Hành động | Cổng chất lượng |
|---|---|---|
| CI — Lint | Chạy linter/format check | Phải pass |
| CI — Test | Unit/integration/e2e | Xem [11-testing](./11-testing.md) |
| CI — Build | Build site + image | Không lỗi |
| CD — Deploy | Triển khai staging → prod | Cần phê duyệt? |

- TODO: chọn công cụ CI/CD (TBD → cần ADR).

## 4. Chiến lược build & phát hành nội dung

- TODO _(khi biên tập viên publish trong Directus → webhook → rebuild/redeploy? xem [06-api §8](./06-api.md))_.

## 5. Quản lý secrets & cấu hình

> **Không bao giờ** commit secret vào repo. Chi tiết: [12-security](./12-security.md).

- TODO _(nơi lưu secret, cách inject vào môi trường)_.

## 6. Rollback & Zero-downtime

- TODO _(cách quay lại phiên bản trước; blue-green/canary nếu cần)_.

## 7. DNS, TLS, Domain

- TODO.

## 8. Checklist phát hành (Release Checklist)

- [ ] Tất cả cổng CI xanh
- [ ] DoD đạt (xem [14-quality-gates](./14-quality-gates.md))
- [ ] Backup trước khi deploy (xem [13-operations](./13-operations.md))
- [ ] Kiểm tra SEO & a11y (xem [15](./15-seo-accessibility.md))
- [ ] Kế hoạch rollback sẵn sàng
- [ ] TODO.
