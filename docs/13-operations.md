# 13 — Operations (Runbook, Observability, Backup, Incident)

> **Trạng thái:** 🔴 Chưa bắt đầu · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** _(chưa gán)_
>
> 🎯 **Mục đích:** Hướng dẫn *vận hành hệ thống khi đã chạy* — thao tác thường ngày, giám sát, sao lưu/khôi phục và xử lý sự cố. Đảm bảo hệ thống chạy ổn định và phục hồi được.
> 🔗 **Liên quan:** [08-deployment](./08-deployment.md) · [12-security](./12-security.md) · [04-database](./04-database.md)

---

## 1. Tổng quan môi trường & topo

- TODO _(các service đang chạy, sơ đồ, cổng, phụ thuộc)_.

## 2. Runbook — thao tác thường gặp

| Thao tác | Khi nào | Các bước | Rủi ro |
|---|---|---|---|
| Khởi động / dừng hệ thống | | TODO | |
| Triển khai phiên bản mới | | Xem [08-deployment](./08-deployment.md) | |
| Rollback | Deploy lỗi | TODO | |
| Rebuild site (sau khi publish) | Nội dung đổi | TODO | |
| Khởi động lại Directus / DB | Treo/lỗi | TODO | |
| Xoá cache | Dữ liệu cũ | TODO | |

## 3. Observability (Log / Metric / Alert)

| Hạng mục | Công cụ (dự kiến) | Ngưỡng cảnh báo |
|---|---|---|
| Logging | TBD | — |
| Metrics (CPU/mem/latency) | TBD | TODO |
| Uptime / Health check | TBD | Down > x phút |
| Error tracking | TBD | TODO |

## 4. Sao lưu & Khôi phục (Backup & Recovery)

| Hạng mục | Chính sách |
|---|---|
| Sao lưu gì | DB, media/assets, cấu hình |
| Tần suất | TODO |
| Lưu giữ (retention) | TODO |
| Nơi lưu | TODO (tách khỏi prod) |
| **RPO** (mất tối đa bao nhiêu dữ liệu) | TODO |
| **RTO** (phục hồi trong bao lâu) | TODO |
| Diễn tập khôi phục (restore drill) | Định kỳ — TODO |

> ⚠️ Backup chưa được kiểm chứng khôi phục = **không có backup**. Phải diễn tập restore.

## 5. Xử lý sự cố (Incident Response)

- **Mức độ (Severity):** SEV1 (sập/dữ liệu) · SEV2 (suy giảm) · SEV3 (nhỏ).
- **Vai trò:** người điều phối (IC), người xử lý, người liên lạc.
- **Kênh liên lạc:** TODO.

### Mẫu ghi nhận sự cố (Postmortem)
```
- Tóm tắt:
- Dòng thời gian (timeline):
- Nguyên nhân gốc (root cause):
- Ảnh hưởng:
- Cách khắc phục:
- Hành động phòng ngừa (không đổ lỗi cá nhân):
```

## 6. Bảo trì, On-call, Chi phí

- TODO _(cửa sổ bảo trì, ai trực, theo dõi chi phí hạ tầng)_.
