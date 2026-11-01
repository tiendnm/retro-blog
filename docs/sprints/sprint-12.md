# 🛠️ Sprint 12 — Vận hành & quan sát (runbook, log, metric, sự cố, restore định kỳ)

> **Vai trò:** DevOps / SRE · **Mục tiêu:** lấp các ô TODO/TBD của [13-operations](../13-operations.md) bằng quy trình **đã chạy thật** trên server nhà, để một người vận hành xử lý được sự cố mà không phải nhớ. Không đổi Content Model, API, Reader.
> 🔗 [13-operations](../13-operations.md) · [08a runbook](../08a-deploy-home-tunnel.md) · [ADR-0017](../adr/0017-ops-services-in-compose.md)

## Bối cảnh
- Server nhà J1900, 4 GB RAM, HDD; một người vận hành; không UPS/SSD (rủi ro đã chấp nhận).
- Đã có: backup hằng ngày + đẩy R2, healthcheck 5 phút, rate limit Directus, quy trình nâng Directus và xử lý PR Dependabot.
- Còn trống ở `13`: hàng runbook *Khởi động/dừng*, *Khởi động lại Directus/DB*, *Xoá cache*; mục Logging, Metrics, Error tracking; kênh liên lạc sự cố; bảo trì/chi phí.

## Nguyên tắc
- Mỗi quy trình trong tài liệu phải **được chạy thử trên server thật** và ghi kết quả; không viết lệnh chưa kiểm.
- Máy nhỏ: **không** dựng Prometheus/Grafana/ELK (tốn RAM, thừa với một blog). Dùng log container + healthcheck + một số chỉ số nhẹ trong `ops`.

## Phạm vi
### A. Runbook thao tác (điền ô TODO)
- [ ] Khởi động / dừng toàn hệ thống và từng service, đúng thứ tự phụ thuộc; kiểm sau khi lên (`healthcheck.sh`).
- [ ] Khởi động lại Directus / Postgres: khi nào, hệ quả (CMS và webhook gián đoạn, site tĩnh vẫn phục vụ), cách xác nhận hồi phục.
- [ ] Xoá cache: các tầng thực có (trình duyệt/Cloudflare, `current` của site tĩnh → rebuild, cache Directus nếu bật); ghi rõ cái nào không có.
- [ ] Máy tắt/khởi động lại bất ngờ: trình tự tự phục hồi (`restart: unless-stopped`, backup chạy bù), việc cần kiểm tay.

### B. Logging
- [ ] Kiểm hiện trạng: dung lượng log Docker trên server, có xoay vòng chưa.
- [ ] Cấu hình xoay vòng (`json-file` với `max-size`/`max-file`) cho mọi service trong `docker-compose.prod.yml` + tunnel — **thay đổi hạ tầng → cổng review giữa sprint** trước khi deploy.
- [ ] Ghi vào `13 §3`: log nằm ở đâu, xem bằng lệnh nào, giữ bao lâu, dòng nào là bình thường (vd cảnh báo `Custom IP header…` của Directus).

### C. Metric & cảnh báo nhẹ
- [ ] Mở rộng `healthcheck.sh` (hoặc script kề bên) kiểm: dung lượng đĩa (cảnh báo theo ngưỡng), RAM/swap, kích thước `pgdata`/uploads/backups, **tuổi backup gần nhất** (cảnh báo nếu > 26 giờ) và tuổi bản mới nhất trên R2.
- [ ] Bật báo động ngoài host: Product tạo dịch vụ ping (kiểu healthchecks.io) và điền `HEALTHCHECK_PING_URL` (hiện để trống trong file mẫu); ghi cách xác nhận cảnh báo thật sự tới tay người vận hành.
- [ ] Ghi ngưỡng và hành động tương ứng vào bảng `13 §3`.

### D. Error tracking — quyết định của Product
- [ ] Đề xuất mặc định: **không dùng dịch vụ ngoài**; nguồn lỗi = log container + healthcheck (site là tĩnh, không có mã chạy phía người dùng đáng kể). Product chốt hoặc chọn dịch vụ khác; ghi quyết định vào `13 §3` (một dòng, không ADR).

### E. Xử lý sự cố
- [ ] Định nghĩa SEV1/2/3 cụ thể cho blog này (vd SEV1 = site hoặc CMS sập > 1 giờ, mất dữ liệu).
- [ ] Vai trò khi chỉ có một người; **kênh liên lạc/cảnh báo do Product chọn** (email, Telegram…).
- [ ] Playbook ngắn, mỗi kịch bản có lệnh đã chạy thử: site 5xx/530 (tunnel), CMS không vào được, Postgres không lên, đĩa đầy, chứng chỉ gần hết hạn, token/secret bị lộ, rebuild kẹt, **máy hỏng hoàn toàn → dựng lại từ backup R2** (liên kết [08 §8](../08-deployment.md)).
- [ ] Giữ mẫu postmortem sẵn có; thêm một bản ví dụ từ sự cố thật gần đây (vd `530` thoáng qua khi cloudflared khởi động lại, 2026-11-01).

### F. Restore drill định kỳ
- [ ] Viết `scripts/restore-drill.sh`: tải bản mới nhất từ R2 (hoặc dùng bản local), khôi phục vào Postgres tạm, so số liệu (posts, files, migrations), khởi động Directus cùng phiên bản prod, dọn sạch; **không đụng stack đang chạy** và xoá dữ liệu tạm ngay sau đó.
- [ ] Chạy một lần thật, ghi kết quả; đặt lịch (đề xuất mỗi quý) và nhắc trong `13 §4`.

### G. Bảo trì & chi phí
- [ ] Cửa sổ bảo trì, quy trình cập nhật hằng tuần (Dependabot → thử → deploy), danh sách chi phí hiện có (tên miền; hạ tầng $0) và các rủi ro vật lý đã chấp nhận (không UPS, HDD).

## Ngoài phạm vi / Backlog
- Rate limit đăng nhập admin, branch protection → [Sprint 13](./sprint-13.md).
- Prometheus/Grafana, tracing, APM; nhiều server/HA; UPS/SSD (quyết định mua sắm của Product).

## Tiêu chí xong
- `13-operations` không còn `TODO`/`TBD` ở các mục A–G (mục còn lại, nếu có, ghi rõ lý do giữ).
- Mỗi lệnh trong runbook/playbook được chạy thử trên server; ngày chạy ghi trong Kết quả.
- Log có xoay vòng (nếu đã được duyệt và deploy); cảnh báo "backup quá cũ" và đường ping ngoài host được thử gây lỗi có chủ đích để xác nhận tới tay người vận hành.
- Restore drill bằng script chạy đạt và để lại số liệu.

## Cổng review
- **Giữa sprint, dừng chờ Product** trước khi deploy thay đổi compose (log) hoặc `ops` lên server (hạ tầng/deploy).
- Cuối sprint: review một lần. Phần docs/script không đụng server: commit liên tục.

## Kết quả
_(điền khi xong sprint: kết quả từng lần chạy thử, ngưỡng đã chốt, quyết định error tracking và kênh liên lạc)_
