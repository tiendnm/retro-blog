# 🔒 Sprint 13 — Bảo mật bổ sung & cổng chất lượng CI

> **Vai trò:** Security Engineer · **Mục tiêu:** đóng backlog bảo mật còn lại, biến kết quả CI thành **cổng thật** (không chỉ báo cáo) và có đường đi rõ cho các nâng cấp lớn (Postgres 18, Directus 12). Không đổi Content Model, API, Reader.
> 🔗 [12-security §6](../12-security.md) · [14-quality-gates §4](../14-quality-gates.md) · [13 §2](../13-operations.md)

## Bối cảnh
- Còn trong backlog: hạn mức riêng cho đăng nhập admin (Directus chỉ có rate limit chung 100/10 giây); `build` đang `continue-on-error`; chưa có quy tắc bảo vệ nhánh `main`.
- 2026-11-01: Directus 12.6.0 bị chặn vì tầng *Core* giới hạn Flow (thử thật: Flow thứ 6 bị từ chối; dự án cần 9). Quyết định hiện tại: giữ 11.17.4, Dependabot bỏ qua major.
- Postgres đang ở 16.15; nâng major cần dump/restore.
- Mọi con số/ngày hỗ trợ dưới đây **phải kiểm lại ở nguồn chính thức** trong sprint, không lấy từ ghi chú này.

## Phạm vi
### A. Hạn mức đăng nhập admin — quyết định + triển khai
- [ ] So sánh phương án, đề xuất để Product chốt:
  1. **Luật rate limiting của Cloudflare** cho `POST /auth/login` trên `retro-cms` (không đổi mã, không đổi image; cần kiểm giới hạn của gói miễn phí).
  2. Module rate limit của Caddy (phải dựng image Caddy tuỳ biến → thêm gánh nặng bảo trì).
  3. Cấu hình Directus: chỉ có hạn mức chung theo IP, không theo đường dẫn.
- [ ] Triển khai phương án được chọn; test: vượt ngưỡng → `429`, đăng nhập đúng sau khi hết cửa sổ; IP thật lấy từ `CF-Connecting-IP`.
- [ ] Ghi vào `12 §6`; bỏ mục khỏi backlog.

### B. Cổng CI & bảo vệ nhánh *(đổi quy tắc merge → cần Product duyệt)*
- [ ] Đề xuất: `quality`, `build` và `site-checks` ([Sprint 11](./sprint-11.md)) là **check bắt buộc** trên `main`; bỏ `continue-on-error` của `build` khi `site-checks` đã xanh ổn định.
- [ ] Quyết định quy trình: bật branch protection (nghĩa là commit đi qua PR) hay giữ push trực tiếp; nếu bật, ghi cách xử lý PR của Dependabot.
- [ ] Phương án tự động hoá cho PR Dependabot (patch/minor): chỉ làm nếu Product đồng ý; mặc định giữ merge tay có kiểm thử như quy trình `13 §2`.
- [ ] Xác nhận đợt Dependabot npm: PR mới có kèm `pnpm-lock.yaml` không (giả thuyết bỏ `pnpm-workspace.yaml`); cập nhật `13 §2` theo kết quả.

### C. Hồi quy header bảo mật tự động
- [ ] Test CI: chạy Caddy với `Caddyfile` thật (không root, `cap-drop ALL`) và khẳng định CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, không có `Server`, kể cả trên trang 404/502.
- [ ] Mục đích: bắt khi nâng Caddy/đổi cấu hình làm mất header (đã kiểm tay khi nâng 2.10).

### D. Xoay vòng secret
- [ ] Runbook xoay: `REBUILD_TOKEN`, mật khẩu DB, `DIRECTUS_SECRET`/`KEY`, token tunnel, token R2, tài khoản admin — cho từng secret: tác động, thứ tự, cách kiểm sau khi xoay.
- [ ] Chạy thử thật với loại rủi ro thấp nhất (`REBUILD_TOKEN`) và ghi kết quả; các loại có thể làm mất phiên/dữ liệu (`DIRECTUS_SECRET`, DB) chỉ viết quy trình và thử trên bản sao.

### E. Nâng cấp lớn — đánh giá, **không tự thực thi**
- [ ] **Postgres 16 → 18:** kiểm ngày hết hỗ trợ của 16 ở nguồn chính thức; viết kế hoạch dump/restore (thời gian gián đoạn thực đo trên bản sao, rollback), đồng bộ client `postgresql16-client` của `ops`; nháp ADR. Thực thi **chỉ khi Product duyệt**.
- [ ] **Directus 11.x:** tìm chính sách hỗ trợ/vá của 11.x ở nguồn chính thức; đặt mốc xem lại hằng quý.
- [ ] **Spike tính khả thi "gom Flow ≤ 5" cho Directus 12** (đường nâng cấp không cần license): một Flow slug dùng trigger nhiều collection (`posts`, `authors`, `categories`, `tags`) và phân nhánh theo `$trigger.collection` để thay 8 Flow hiện tại, giữ Flow publish + rebuild → còn ≈ 4. **Chưa kiểm chứng** — thử trên bản sao DB production với Directus 12, đo xem hành vi slug/guard có giữ nguyên không; kết luận khả thi/không khả thi vào `12 §6`, không đổi production.
- [ ] Tra giá/điều khoản license Directus để Product có số liệu khi cần (Product đã chọn tạm thời không làm — chỉ làm nếu có yêu cầu).

## Ngoài phạm vi / Backlog
- 2FA admin (bỏ qua có chủ đích); WAF tuỳ biến ngoài luật đăng nhập; quét SAST; pentest.
- Thực thi nâng Postgres 18 / Directus 12 (cần quyết định riêng của Product).

## Tiêu chí xong
- Đăng nhập admin có hạn mức riêng, đã thử vượt ngưỡng; `12 §6` cập nhật.
- Quy tắc check bắt buộc/branch protection được Product chốt (kể cả quyết định "không bật") và ghi lại; nếu bật, PR thử nghiệm bị chặn khi CI đỏ.
- Test header chạy trong CI; cố ý bỏ một header thì job đỏ.
- Runbook xoay secret có bằng chứng chạy thử cho `REBUILD_TOKEN`.
- Có báo cáo đánh giá cho Postgres 18, Directus 11.x và spike gom Flow, kèm khuyến nghị.

## Cổng review
- **Giữa sprint, dừng chờ Product:** phương án mục A (đụng bảo mật/hạ tầng Cloudflare) và quy tắc merge mục B trước khi áp dụng.
- Cuối sprint: review một lần.

## Kết quả
_(điền khi xong sprint: phương án rate limit đã chọn và kết quả thử, quyết định bảo vệ nhánh, kết luận spike Flow, khuyến nghị Postgres 18)_
