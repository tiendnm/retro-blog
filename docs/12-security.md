# 12 — Security

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Xác lập *tư thế bảo mật* của hệ thống — tài sản cần bảo vệ, mối đe doạ, và biện pháp kiểm soát. Bảo mật là mối quan tâm xuyên suốt, rẻ hơn nhiều khi thiết kế từ đầu.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [05-cms](./05-cms.md) · [08-deployment](./08-deployment.md) · [13-operations](./13-operations.md)

---

## 1. Nguyên tắc

- Least privilege · Defense in depth · Secure by default · Không tin dữ liệu đầu vào.

## 2. Mô hình đe doạ (Threat Model — sơ lược)

| Tài sản (Asset) | Tác nhân đe doạ | Mối đe doạ | Biện pháp kiểm soát |
|---|---|---|---|
| Nội dung/DB | Kẻ tấn công ngoài | Rò rỉ/sửa dữ liệu | Phân quyền, backup, TLS |
| Tài khoản admin Directus | Brute force/phishing | Chiếm quyền | Mật khẩu mạnh, 2FA, giới hạn |
| Secrets/API token | Lộ qua repo/log | Lạm dụng API | Quản lý secret, không log |
| Người dùng cuối | XSS qua nội dung | Chèn script | Sanitize/escape khi render |

> Có thể dùng STRIDE để rà soát: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation.

## 3. Xác thực & Phân quyền

- TODO _(vai trò Directus [05-cms §2](./05-cms.md), quyền public API tối thiểu, 2FA cho admin)_.

## 4. Quản lý Secrets

- Không commit secret; dùng biến môi trường/secret manager. TODO: nơi lưu & xoay vòng (rotation).

## 5. Bảo mật dữ liệu & Quyền riêng tư

- TODO _(PII? bình luận? cookie/analytics; tuân thủ GDPR nếu có người dùng EU; cookie consent)_.

## 6. Bảo mật hạ tầng

- TODO _(Docker: image tin cậy, không chạy root, cập nhật vá lỗi; network segmentation; TLS bắt buộc)_.

## 7. Bảo mật chuỗi cung ứng (Supply chain)

- TODO _(khoá phiên bản dependency, quét lỗ hổng, cập nhật định kỳ)_.

## 8. Bảo mật tầng ứng dụng

- TODO _(chống XSS khi render richtext từ CMS, CSRF, security headers, rate limiting)_.

## 9. Logging & Audit

- TODO _(ghi log truy cập/thay đổi; **không** log secret/PII)_. Xem [13-operations](./13-operations.md).

## 10. Quy trình khi phát hiện lỗ hổng

- TODO _(cách báo cáo, mức độ, thời gian vá, disclosure)_.

## 11. Checklist bảo mật trước phát hành

- [ ] Không secret trong repo/log
- [ ] HTTPS/TLS bắt buộc
- [ ] Quyền Directus theo least privilege
- [ ] Security headers cấu hình
- [ ] Dependencies không có lỗ hổng nghiêm trọng
- [ ] TODO.
