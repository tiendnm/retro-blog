# 🔒 Sprint 13 — Bảo mật bổ sung & cổng chất lượng CI

> **Vai trò:** Security Engineer · **Mục tiêu:** đóng backlog bảo mật còn lại, biến kết quả CI thành **cổng thật** (không chỉ báo cáo) và có đường đi rõ cho các nâng cấp lớn (Postgres 18, Directus 12). Không đổi Content Model, API, Reader.
> 🔗 [12-security §6](../12-security.md) · [14-quality-gates §4](../14-quality-gates.md) · [13 §2](../13-operations.md)

## Bối cảnh
- Còn trong backlog: hạn mức riêng cho đăng nhập admin (Directus chỉ có rate limit chung 100/10 giây); `build` đang `continue-on-error`; branch protection `main` **đã bật từ 2026-10-07** (required check `quality`, `enforce_admins=false` nên chủ repo push thẳng được — `14 §4`); `build`/`site-checks` chưa bắt buộc.
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
- [x] Xác nhận đợt Dependabot npm _(2026-11-02: **giả thuyết đúng** — PR #19 có kèm lockfile; `13 §2` đã cập nhật)_: PR mới có kèm `pnpm-lock.yaml` không (giả thuyết bỏ `pnpm-workspace.yaml`); cập nhật `13 §2` theo kết quả.

### C. Hồi quy header bảo mật tự động
- [x] Test CI _(2026-11-02, `scripts/test-caddy-headers.sh`, bước trong job `quality`; đã thử phản chứng)_: chạy Caddy với `Caddyfile` thật (không root, `cap-drop ALL`) và khẳng định CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, không có `Server`, kể cả trên trang 404/502.
- [x] Mục đích: bắt khi nâng Caddy/đổi cấu hình làm mất header (đã kiểm tay khi nâng 2.10).

### D. Xoay vòng secret
- [x] Runbook xoay _(viết ở [12 §4](../12-security.md); diễn tập `SECRET`/`KEY`/`DB_PASSWORD` trên bản sao)_: `REBUILD_TOKEN`, mật khẩu DB, `DIRECTUS_SECRET`/`KEY`, token tunnel, token R2, tài khoản admin — cho từng secret: tác động, thứ tự, cách kiểm sau khi xoay.
- [ ] Chạy thử thật với loại rủi ro thấp nhất (`REBUILD_TOKEN`) và ghi kết quả; các loại có thể làm mất phiên/dữ liệu (`DIRECTUS_SECRET`, DB) chỉ viết quy trình và thử trên bản sao.

### E. Nâng cấp lớn — đánh giá, **không tự thực thi**
- [x] **Postgres 16 → 18** _(đánh giá + diễn tập bản sao xong, ghi ở [12 §6](../12-security.md); chưa viết ADR vì chưa duyệt thực thi)_: kiểm ngày hết hỗ trợ của 16 ở nguồn chính thức; viết kế hoạch dump/restore (thời gian gián đoạn thực đo trên bản sao, rollback), đồng bộ client `postgresql16-client` của `ops`; nháp ADR. Thực thi **chỉ khi Product duyệt**.
- [x] **Directus 11.x:** tìm chính sách hỗ trợ/vá của 11.x ở nguồn chính thức; đặt mốc xem lại hằng quý.
- [x] **Spike tính khả thi "gom Flow ≤ 5" cho Directus 12** (đường nâng cấp không cần license): một Flow slug dùng trigger nhiều collection (`posts`, `authors`, `categories`, `tags`) và phân nhánh theo `$trigger.collection` để thay 8 Flow hiện tại, giữ Flow publish + rebuild → còn ≈ 4. **Chưa kiểm chứng** — thử trên bản sao DB production với Directus 12, đo xem hành vi slug/guard có giữ nguyên không; kết luận khả thi/không khả thi vào `12 §6`, không đổi production.
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

## Đề xuất chờ Product (2026-11-02)
### A. Hạn mức đăng nhập admin — số liệu đã tra ở nguồn chính thức
| Phương án | Giới hạn thực tế | Chi phí/rủi ro |
|---|---|---|
| **1. Luật rate limiting của Cloudflare** | Gói **Free: 1 luật**, đặc tính đếm **IP**, cửa sổ đếm **10 giây**, thời gian chặn **10 giây**, biểu thức lọc theo **Path** ([rate-limiting-rules](https://developers.cloudflare.com/waf/rate-limiting-rules/); trang tham số liệt kê thêm Host/Country — kiểm lại trong dashboard khi tạo) | Không đổi mã/image. Là *làm chậm*, không phải *khoá*: ngưỡng 5 lần/10 giây ⇒ một IP vẫn thử được ≈ 15 lần/phút (≈ 21.600/ngày) sau khi trừ thời gian chặn. Dùng hết luật miễn phí duy nhất |
| 2. Module rate limit của Caddy | Cửa sổ/ngưỡng tuỳ ý (vd 5 lần/phút, chặn vài phút), khoá theo `CF-Connecting-IP` | Phải dựng image Caddy tuỳ biến (xcaddy): mất cập nhật tự động của Dependabot cho phần plugin, test header (§C) phải chạy trên image tuỳ biến, thêm bề mặt chuỗi cung ứng |
| 3. Cấu hình Directus | Chỉ `RATE_LIMITER_*` chung theo IP (hiện 100/10 giây) + bộ riêng cho đăng ký/email/OAuth; **không** có hạn mức theo đường dẫn đăng nhập; `LOGIN_STALL_TIME` mặc định 500 ms/lần ([security-limits](https://directus.com/docs/configuration/security-limits)) | Hạ ngưỡng chung sẽ làm hỏng build/ops (cùng IP container) — không phù hợp |

**Khuyến nghị: phương án 1** (ngưỡng 5 yêu cầu/10 giây trên `Path = /auth/login`, hành động *Block*), kèm thừa nhận giới hạn: lớp phòng thủ chính vẫn là **mật khẩu admin dài ngẫu nhiên** (+ độ trễ 500 ms/lần của Directus); lớp này chỉ chặn công cụ dò mật khẩu ngây thơ. Chọn phương án 2 chỉ khi Product muốn khoá thật (phút) và chấp nhận gánh nặng bảo trì. **Việc của Product:** tạo luật ở Cloudflare (Security → WAF → Rate limiting rules) hoặc cấp API token giới hạn `Zone WAF: Edit`; sau đó Claude chạy thử vượt ngưỡng (kỳ vọng `429`, đăng nhập đúng sau ≥ 10 giây) và ghi vào `12 §6`.

### B. Cổng CI & bảo vệ nhánh — dữ kiện
- **Đã có** branch protection (`quality` bắt buộc, `enforce_admins=false`). Hệ quả thật: **CI `main` đỏ 5 commit liên tiếp (`602d2ca` → `3096a8f`, 2026-11-01) mà không ai chặn/nhìn thấy** — `scripts/restore-drill.sh` vi phạm shellcheck SC2010 (sửa ở `7620fa8`, chưa push). Quy tắc hiện tại chỉ bắt người ngoài, không bắt chủ repo.
- Độ ổn định (đếm theo từng job, 2026-11-01): `build` xanh **28/28** lần chạy gần nhất (không tính lần huỷ); `site-checks` xanh **8/8** kể từ khi có (13:09) — **chưa đủ 10** liên tiếp mà tiêu chí đặt ra, mẫu nhỏ và gói trong một ngày.
- Dependabot: PR npm giờ kèm lockfile (xem `13 §2`), nên tự động hoá patch/minor *khả thi về kỹ thuật*; vẫn **khuyến nghị giữ merge tay** vì PR đổi image cần thử thật (CI không build image), và PR #19 là *major* (TypeScript 6).

Các lựa chọn cho Product chốt:
1. **Bỏ `continue-on-error` của `build` và đặt `quality` + `build` làm check bắt buộc ngay** *(khuyến nghị)*; `site-checks` nâng sau khi đủ 10 lần xanh liên tiếp (tự đạt sau vài lần push).
2. Giữ `enforce_admins=false` (push thẳng, đúng tinh thần "commit liên tục" của [17 §2](../17-contributing.md)) — chấp nhận rủi ro đỏ bị bỏ sót, bù bằng thói quen `gh run list` cuối mỗi sprint; **hoặc** bật `enforce_admins=true` ⇒ mọi thay đổi qua PR (đỏ không thể vào `main`), đổi lại thêm ma sát cho commit docs nhỏ.
3. Tự động hoá Dependabot: không làm (mặc định).

## Cổng review
- **Giữa sprint, dừng chờ Product:** phương án mục A (đụng bảo mật/hạ tầng Cloudflare) và quy tắc merge mục B trước khi áp dụng.
- Cuối sprint: review một lần.

## Kết quả
_(cập nhật 2026-11-02 — **giữa sprint, dừng chờ Product** ở mục A và B)_
**Đã xong, không cần cổng:** C (test header trong CI, phản chứng đạt); D (runbook trong `12 §4`; `SECRET`/`KEY`/`DB_PASSWORD` đã diễn tập trên bản sao — `SECRET` đổi làm access token cũ bị từ chối nhưng refresh token cũ vẫn sống); E (Postgres 18, Directus 11.x, spike gom Flow — kết luận ở `12 §6`); xác nhận Dependabot (giả thuyết đúng).
**Phát hiện ngoài kế hoạch:** CI `main` đỏ vì shellcheck SC2010 trong `restore-drill.sh` — đã sửa (xem B).
**Còn chờ:** A (Product chọn phương án + tạo luật Cloudflare); B (chốt quy tắc merge); D-thử thật `REBUILD_TOKEN` (sửa `.env.production` trên server + cần mật khẩu admin ⇒ cần Product duyệt); bằng chứng "PR thử nghiệm bị chặn khi CI đỏ" (chỉ sau khi B áp dụng).
**Kết quả cuối sprint:** _(điền khi xong: phương án rate limit đã chọn và kết quả thử, quyết định bảo vệ nhánh, kết luận spike Flow, khuyến nghị Postgres 18)_
