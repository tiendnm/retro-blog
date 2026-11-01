# 12 — Security

> 🎯 **Mục đích:** Xác lập *tư thế bảo mật* của hệ thống — tài sản cần bảo vệ, mối đe doạ, và biện pháp kiểm soát. Bảo mật là mối quan tâm xuyên suốt, rẻ hơn nhiều khi thiết kế từ đầu.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [05-cms](./05-cms.md) · [08-deployment](./08-deployment.md) · [13-operations](./13-operations.md)

---

## 1. Nguyên tắc

- Least privilege · Defense in depth · Secure by default · Không tin dữ liệu đầu vào.

## 2. Mô hình đe doạ (Threat Model — sơ lược)

| Tài sản (Asset) | Tác nhân đe doạ | Mối đe doạ | Biện pháp kiểm soát |
|---|---|---|---|
| Nội dung/DB | Kẻ tấn công ngoài | Rò rỉ/sửa dữ liệu | Phân quyền, backup, TLS |
| Tài khoản admin Directus | Brute force/phishing | Chiếm quyền | Mật khẩu mạnh, giới hạn tốc độ (2FA không bật — §3) |
| Secrets/API token | Lộ qua repo/log | Lạm dụng API | Quản lý secret, không log |
| Người dùng cuối | XSS qua nội dung | Chèn script | Sanitize/escape khi render |

> Có thể dùng STRIDE để rà soát: Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation.

## 3. Xác thực & Phân quyền

- **Vai trò Directus** (chi tiết & ma trận: [05-cms §2](./05-cms.md)): **Admin** (`admin_access`, full) · **Editor** (`app_access`, chỉ CRUD nội dung — *không* quản trị user/role/policy) · **Public** (read-only).
- **Public API tối thiểu (least privilege):** Public chỉ `read`; `posts` bị chặn bằng rule **`status=published` AND `published_at ≤ $NOW`** → bản nháp và bài hẹn giờ tương lai **không** lộ qua API. Đã kiểm thử Phase 2: draft/future → `403`, published → `200`.
- **Reproducible, không thủ công:** phân quyền nằm ở [`services/directus/apply-permissions.sh`](../services/directus/apply-permissions.sh) (`pnpm permissions:apply`) — không dựa vào thao tác UI. Đây là ranh giới bảo mật cần review khi thay đổi.
- **Không frontend auth, không public CMS users** (MVP). **2FA cho tài khoản admin: không bật** — Product chốt 2026-11-02, chấp nhận rủi ro (một admin, không bề mặt đăng nhập công khai ngoài Cloudflare). Giảm thiểu: mật khẩu ≥ 24 ký tự ngẫu nhiên (§4), rate limit Directus theo IP (§6); giới hạn riêng cho `/auth/login` ở Cloudflare do Product tự cấu hình, chưa kiểm chứng (Sprint 13). Bật lại nếu có thêm tài khoản Editor/Admin hoặc mô hình đe doạ đổi.

## 4. Quản lý Secrets

- Không commit secret. **Nơi lưu:** `.env.production` trên server (quyền 600, gitignored; bản mẫu `.env.production.example`); mỗi lần sửa để lại bản sao `.env.production.bak-<tên>` cùng quyền. Secret **không** nằm trong image, repo, hay bản backup đẩy lên R2 (`env.bak` không được đẩy). Mật khẩu admin Directus thực tế nằm trong DB (đã đổi sau lần đầu), `ADMIN_PASSWORD` trong env chỉ là giá trị khởi tạo — `ensure_admin_login` ([scripts/lib/common.sh](../scripts/lib/common.sh)) hỏi mật khẩu hiện tại khi hai giá trị lệch nhau (hoặc đặt `ADMIN_PASSWORD_OVERRIDE`).
- **Khi nào xoay:** ngay khi nghi lộ (log/ảnh chụp/commit nhầm/máy thất lạc); khi người có quyền truy cập rời đi; còn lại không xoay định kỳ (một người vận hành, không có bề mặt công khai ngoài Cloudflare) — xem lại hằng năm.
- **Nguyên tắc chung:** (1) backup tay trước (`13 §2`); (2) sinh giá trị mới bằng `openssl rand -hex 32` (mật khẩu: ≥ 24 ký tự ngẫu nhiên); (3) xoay MỘT secret mỗi lần, kiểm xong mới sang cái khác; (4) giá trị cũ chỉ bị thu hồi **sau** khi giá trị mới đã được kiểm; (5) không dán secret vào chat/ticket/log — nhập thẳng trên server.

**Runbook xoay secret** (thứ tự: rủi ro thấp → cao; mọi lệnh chạy trong `~/retro-blog` trên server, `dc` = `docker compose --env-file .env.production`):

| Secret | Dùng ở đâu | Tác động khi xoay | Các bước (theo thứ tự) | Kiểm sau khi xoay | Bằng chứng |
|---|---|---|---|---|---|
| `HEALTHCHECK_PING_URL` | `ops` ping healthchecks.io | Ai có URL gọi được "báo OK giả". Gián đoạn: không | Healthchecks.io → check → đổi UUID (Settings) hoặc tạo check mới; sửa `.env.production`; `dc up -d ops` | Check về *Up* trong ≤ 5 phút; gỡ check cũ | Chưa chạy |
| `REBUILD_TOKEN` | Receiver `web` (kiểm token) **và** Directus Flow "Rebuild on publish" (gửi token) — hai nơi phải khớp | **Cửa sổ mất rebuild:** `web` khởi động lại sẽ build site TRƯỚC khi receiver lắng nghe (vài phút trên J1900; `web-entrypoint.sh`) → publish trong lúc đó không kích hoạt rebuild (khi nghe thấy thì Flow cũ bị 404). Site cũ vẫn phục vụ | 1) Chọn lúc không đăng bài. 2) `cp -p .env.production .env.production.bak-rot`. 3) `sed -i "s\|^REBUILD_TOKEN=.*\|REBUILD_TOKEN=$(openssl rand -hex 32)\|" .env.production` (một dòng, không chú thích cuối dòng). 4) `dc up -d --wait --wait-timeout 1200 web`. 5) Áp lại Flow: `. scripts/lib/common.sh; ensure_admin_login; ops_run node services/directus/apply-rebuild-flow.mjs` (hoặc `./scripts/update.sh`). 6) Nếu có bài đăng trong khoảng 4→5: `sh services/rebuild/rebuild.sh` | (a) token cũ → `404`, token mới → `202` khi POST `http://web:9000/rebuild` từ `ops`; (b) đăng/sửa một bài thử trong CMS → bản build mới xuất hiện (`ls site_dist/builds`); (c) `healthcheck.sh` toàn `OK`. Thu hồi bản cũ: xoá `.env.production.bak-rot` sau khi (a)–(c) đạt | **Chờ Product duyệt** để chạy thử thật (sửa `.env.production` trên server + cần mật khẩu admin) |
| Token R2 (`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`) | `ops` đẩy backup lên R2 | Backup ra ngoài host tạm dừng nếu sai; backup local không ảnh hưởng | 1) Cloudflare → R2 → Manage API Tokens → tạo token MỚI (Object Read & Write, giới hạn đúng bucket). 2) Sửa 2 dòng R2 trong `.env.production`. 3) `dc up -d ops`. 4) Chạy backup tay. 5) Xoá token CŨ ở Cloudflare | Log backup có dòng đẩy R2 thành công; `restore-drill.sh --r2` đạt ([13 §4](./13-operations.md)); backup R2 mới có tuổi ≈ 0 giờ trong `hostcheck` | Chưa chạy |
| `TUNNEL_TOKEN` | `cloudflared` | Token cũ KHÔNG mở thêm kết nối mới nhưng kết nối đang chạy sống tới khi khởi động lại ([tài liệu Cloudflare](https://developers.cloudflare.com/tunnel/reference/tunnel-tokens/)). Tunnel chỉ 1 replica ⇒ **site và CMS gián đoạn** từ lúc `cloudflared` khởi động lại tới lúc kết nối lại (vài giây–chục giây) | 1) Cloudflare Zero Trust → Networks → Tunnels → tunnel → *Refresh token* (hoặc API) và sao chép token mới. 2) Sửa `TUNNEL_TOKEN` trong `.env.production`. 3) `dc up -d cloudflared`. (Nếu mất truy cập SSH từ ngoài: tunnel chỉ phục vụ web, SSH vào qua LAN) | Tunnel *Healthy* ở dashboard; site và CMS trả 200 từ internet | Chưa chạy |
| Mật khẩu admin Directus | Đăng nhập CMS, `ensure_admin_login`, các script `apply-*` | Phiên admin hiện tại vẫn sống tới hết hạn; script phải nhận mật khẩu mới | 1) Đổi trong CMS (User → Password). 2) Dùng `ADMIN_PASSWORD_OVERRIDE` cho script, hoặc cập nhật `ADMIN_PASSWORD` trong env **chỉ** nếu chấp nhận lưu mật khẩu thật trên đĩa (quyền 600) | Đăng nhập CMS bằng mật khẩu mới; `./scripts/update.sh` chạy được | Chưa chạy |
| `SECRET` (Directus) | Ký access token (JWT) | **Đã thử (bản sao):** access token cũ → `403`; **refresh token cũ vẫn dùng được** (trình duyệt admin tự xin token mới, không bị đá ra); static token không đổi; đăng nhập mới bình thường. Chưa thử 2FA/SSO (đang không bật) | 1) Backup. 2) Sửa `SECRET` trong `.env.production`. 3) `dc up -d directus` (≈ 55 giây không có CMS; site tĩnh vẫn phục vụ; publish trong lúc này không rebuild → `rebuild.sh` tay) | Đăng nhập CMS; `GET /users/me` bằng token cũ ≠ 200, bằng phiên mới = 200; `healthcheck.sh` OK | Đã diễn tập 2026-11-02 trên Directus 11.17.4 + Postgres tạm (không phải server thật) |
| `KEY` (Directus) | Định danh instance | **Đã thử (bản sao):** đổi KEY không làm mất access/refresh/static token nào; không thấy tác động quan sát được. Chỉ đổi cùng lúc với nghi lộ | Như `SECRET` | Như `SECRET` | Đã diễn tập (bản sao) |
| `DB_PASSWORD` | Postgres (`POSTGRES_PASSWORD` **chỉ có tác dụng ở lần khởi tạo volume đầu tiên**), Directus, `ops` (`PGPASSWORD`, backup) | Sửa env KHÔNG đổi mật khẩu trong DB. **Đã thử (bản sao):** `ALTER USER` không làm rớt kết nối đang chạy; mật khẩu cũ bị từ chối ngay cho kết nối mới; Directus khởi động với mật khẩu cũ sau ALTER thì không lên | 1) Backup + `restore-drill.sh` đạt gần đây. 2) `dc exec -T postgres psql -U postgres -c "ALTER USER postgres PASSWORD '<mới>'"`. 3) Sửa `DB_PASSWORD` trong `.env.production` **ngay sau đó** (Directus giữ kết nối cũ nhưng sẽ không kết nối lại được nếu pool đóng). 4) `dc up -d directus ops` (recreate). Hoàn tác: ALTER lại mật khẩu cũ + sửa env | Directus healthy, `healthcheck.sh` OK, chạy backup tay thành công | Đã diễn tập (bản sao) |

**Chưa nằm trong runbook (ngoài phạm vi sprint 13):** khoá SSH của máy triển khai, token `gh`/GitHub, tài khoản Cloudflare và email (bật 2FA ở các dịch vụ này là việc của chủ tài khoản).

## 5. Bảo mật dữ liệu & Quyền riêng tư

- **Site công khai không thu thập dữ liệu cá nhân:** không form, bình luận, đăng nhập, cookie của site, analytics hay script bên thứ ba (mã nguồn `apps/web` không có; CSP cấm script ngoài — §6). Do đó **không cần banner cookie/consent**. Font tự host (gói npm, không gọi nhà cung cấp font).
- **Dữ liệu cá nhân duy nhất:** tên/email/mật khẩu băm của Admin/Editor trong CMS, và hồ sơ tác giả hiển thị công khai (tên, tiểu sử, avatar — nội dung do Editor nhập). Cloudflare (tunnel) thấy IP độc giả theo chính sách của họ; Caddy không ghi access log (§9). Nếu về sau thêm analytics/bình luận → đổi mô hình đe doạ, cập nhật mục này và [01a §7](./01a-mvp-scope.md) trước.

## 6. Bảo mật hạ tầng

**Đã có (Sprint 6):**
- **TLS bắt buộc:** Caddy auto-HTTPS (Let's Encrypt/ACME), HTTP→HTTPS redirect ([ADR-0007](./adr/0007-reverse-proxy-and-tls.md)).
- **Network segmentation:** Postgres **không expose** (chỉ nội bộ `retro-net`); Directus **bind `127.0.0.1`** trên host (public **chỉ** qua Caddy). Edge duy nhất = Caddy (80/443).
- **Image pin cứng** (không `latest`): `postgres:16.15-alpine` · `directus:11.17.4` · `caddy:2.10-alpine` · `cloudflare/cloudflared:2026.10.6` · web + ops build từ `node:26.13.0-alpine`.
- **Build tái lập:** `--frozen-lockfile` (chống drift → giảm rủi ro chuỗi cung ứng, [S6-P1](./10-decisions.md)).
- **Secrets ngoài repo:** `.env.production` gitignored; chỉ commit `.env.production.example` (placeholder).

**Sprint 8 (Hardening hạ tầng):**
- **Security headers ở Caddy** (`Caddyfile`): HSTS 1 năm `includeSubDomains` (không preload; nâng 2026-11-01), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, ẩn `Server`; **CSP chặt cho site tĩnh** (không script/style inline; ảnh chỉ từ domain CMS). Admin Directus **không** bị đè CSP (Directus tự phát). Header cũng có trên trang lỗi (404/502) nhờ `handle_errors`.
- **Webhook rebuild siết** (`services/rebuild/webhook.mjs`): token chỉ qua header, so sánh hằng-thời-gian, mọi yêu cầu sai trả cùng 404, khoá tạm theo IP sau nhiều lần sai (429), receiver chạy trong container `web`, chỉ tới được trong mạng compose (không publish cổng), token ≥ 32 ký tự. Có test (`node --test services/rebuild/webhook.test.mjs`, chạy trong CI).
- **Backup:** `umask 077`, tự dọn bản cũ (`BACKUP_KEEP`), chạy hằng ngày trong service `ops`.

**Sprint 9 (server tại nhà):** không mở/forward cổng nào — truy cập duy nhất qua Cloudflare Tunnel ([ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md)); Postgres không publish cổng (chỉ `retro-net`); cookie Directus `Secure`; `ufw deny incoming` (SSH chỉ từ LAN). Đoạn tunnel→Caddy là HTTP trong mạng Docker nội bộ.

**Sprint 10 (đóng gói deploy):** **không `docker.sock`** ở bất kỳ container nào ([ADR-0016](./adr/0016-rebuild-receiver-in-web-container.md): webhook ngay trong `web`; [ADR-0017](./adr/0017-ops-services-in-compose.md): `ops` mount repo/uploads `:ro`, chạy non-root theo uid của user triển khai); Directus không publish cổng ra host (chỉ Caddy/`ops` tới được qua `retro-net`); không user hệ thống riêng, không unit systemd, không rule `ufw` cho cổng 9000; `.env.production` quyền 600 do script sinh, cấm chú thích cuối dòng.

**Hardening 2026-11-01:**
- **Container tối thiểu quyền:** mọi service có `security_opt: no-new-privileges`; `cap_drop: ALL` cho directus, web, ops, caddy (+`NET_BIND_SERVICE`), cloudflared. Không chạy root: directus (`node`), web (`USER node`), ops (uid triển khai), caddy (`1000:1000`), cloudflared (`nonroot`); postgres chạy tiến trình DB bằng user `postgres` (entrypoint hạ quyền, image chuẩn).
- **Rate limiting Directus:** `RATE_LIMITER_*` theo IP, mặc định 100 yêu cầu/10 giây (`RATE_LIMITER_POINTS/DURATION`), quá mức → 429. IP thật = header `CF-Connecting-IP` (`IP_CUSTOM_HEADER`): Cloudflare luôn ghi đè header này và Caddy không publish cổng nên chỉ tunnel tới được. Yêu cầu nội bộ (web build, ops) không có header → khoá theo IP container. Giới hạn: kho bộ nhớ trong 1 instance; chưa có hạn mức riêng cho `/auth/login`.
- **Astro 5 → 7 (2026-11-01):** audit giảm từ 31 (1 critical, 11 high) xuống 3 (2 low, 1 moderate). Kéo theo base image `node:22.23.4-alpine` (Astro 7 cần Node ≥22.23.4); sau đó nâng tiếp lên `node:26.13.0-alpine` (2026-11-01, Dependabot #4/#6/#8). Đã so build trước/sau trên nội dung thật: cùng 19 trang/39 file, không script/style inline (CSP giữ nguyên), khác biệt chỉ là tên gói CSS, khoảng trắng và `&amp;` trong URL ảnh; tìm kiếm và lightbox chạy đúng.
- **Quét dependency:** `.github/dependabot.yml` (npm, docker, compose, actions — hằng tuần) và workflow `security.yml` (`pnpm audit --prod --audit-level high`, hằng tuần, hiện chỉ báo cáo).
- **Đợt Dependabot đầu (2026-11-01, 13 PR):** merge 12, đóng 1. Image: `node:26.13.0-alpine` (web, ops, compose dev; thử trọn pipeline gồm seed + `astro build`), `caddy:2.10-alpine` (header/CSP/404 giống hệt 2.8), `cloudflared:2026.10.5`. Actions: `checkout@v7`, `setup-node@v7`, `pnpm/action-setup@v6`. npm: `marked` 12→18 (HTML seed giống hệt), `vitest` 3→5, `@types/node` 22→26, nhóm minor-patch. **Postgres 16 → 18 (#1) đóng có chủ đích:** nâng major cần dump/restore, làm riêng, không qua Dependabot. CI ghim Node 26 (ghim `22` từng lấy 22.23.3 < 22.23.4 mà Astro 7 yêu cầu). Quy trình xử lý PR Dependabot: [13 §2](./13-operations.md). Sau đó bỏ `pnpm-workspace.yaml` (nguyên nhân PR npm thiếu lockfile), thêm `ignore` major Postgres và gom nhóm docker/compose/actions trong `dependabot.yml`.

**Audit sạch high+ (2026-11-01):** `pnpm.overrides` `fast-uri >=3.1.9 <4` trong `apps/web/package.json` vá chuỗi dev `@astrojs/check`→`ajv`; `security.yml` quét mọi deps ở mức high+ và **không còn `continue-on-error`** (đỏ khi có lỗ hổng high/critical mới). Còn 1 lỗ hổng low (`esbuild` qua vite, bản vá 0.28.1 chưa vào chuỗi astro/vite) — không chặn.

**Đánh giá Directus 12.6.0 (2026-11-01, PR #17 — KHÔNG nâng):** thử thật trên bản sao backup prod (Postgres 16.15). Migration chạy được (có `Add Licensing`), `schema apply` và permissions qua. **Chặn:** (1) bản tự host không giấy phép là tầng *Core* — tạo Flow thứ 6 trả `403 LIMIT_EXCEEDED "flows limit exceeded"`; dự án cần **9 Flow** (Auto slug ×4, Guard slug ×4, Rebuild on publish) → `apply-rebuild-flow.mjs`/`apply-slug-flow.mjs` lỗi (script còn xoá flow cũ rồi mới tạo nên để lại trạng thái dở). (2) Theo release notes (chưa tự kiểm): sau 30 ngày ân hạn, *custom rules* của access policy bị bỏ qua nếu không có license — Public đang dựa vào filter `status=published AND published_at<=$NOW`, rủi ro lộ bài nháp hoặc ẩn hết; SSO cũng cần license; relicense BUSL-1.1 → MSCL-1.0-GPL. **Cũng đổi (đã thấy):** `/server/health` ẩn danh trả 403 (dùng `/server/ping`; sửa healthcheck compose, `ops/healthcheck.sh`, `update.sh`, CI), image không còn `npx` (dùng `node cli.js …`), Node 26 tối thiểu từ 12.6.0, `IP_TRUST_PROXY` mặc định `false`, Flow Update/Delete Items đổi hành vi khi key/query rỗng. Kết luận: ở lại 11.17.4 (còn nhận bản vá 11.x) cho tới khi có quyết định về license/giới hạn Flow.

**Sprint 13 (2026-11-02):**
- **Hồi quy header bảo mật trong CI:** [`scripts/test-caddy-headers.sh`](../scripts/test-caddy-headers.sh) (bước trong job `quality`, bắt buộc) chạy image Caddy lấy từ `docker-compose.prod.yml` với `Caddyfile` thật và ràng buộc như prod (`user 1000`, `cap_drop ALL` + `NET_BIND_SERVICE`, `no-new-privileges`), rồi khẳng định HSTS, nosniff, `X-Frame-Options` (site `DENY`, CMS `SAMEORIGIN`), `Referrer-Policy`, `Permissions-Policy`, CSP từng chỉ thị (site), **không** CSP ở CMS, **không** có `Server` — trên trang 200, 404 (`handle_errors` của site) và 502 (Directus down). Đã thử phản chứng: bỏ `X-Content-Type-Options` → 3 khẳng định sai, exit 1; bỏ `import site_headers` trong `handle_errors` → 15 khẳng định sai, exit 1.
- **Spike "gom Flow ≤ 5" cho Directus 12 — KHẢ THI về mặt Flow** (chạy trên instance **mới dựng từ `schema.yaml` của repo + dữ liệu thử**, KHÔNG phải bản sao DB production như kế hoạch ban đầu; không đụng production — Flow chỉ phụ thuộc cấu trúc collection, nhưng trước khi nâng thật phải lặp lại trên bản sao backup): 1 Flow `items.create` + 1 Flow `items.update` phủ cả `posts/authors/categories/tags`, phân nhánh theo `$trigger.collection` (bảng nguồn/slug dự phòng trong code, `item-read` dùng `{{$trigger.collection}}`). Bộ 25 kiểm thử hành vi (tạo không slug, trùng tên → `-2`, slug gõ tay chuẩn hoá, tên toàn ký tự đặc biệt → slug dự phòng, đổi tên không đổi slug, xoá trắng slug bị chặn) cho kết quả **giống hệt** 8 Flow hiện tại, trên cả Directus 11.17.4 và 12.6.0. Cùng Flow `Auto set published_at` và `Rebuild on publish`: **tổng 4 Flow** trên 12.6.0 (tầng Core), không `LIMIT_EXCEEDED`. **Chưa giải quyết (không kiểm được bằng spike):** *custom rules* của access policy bị bỏ qua sau 30 ngày ân hạn nếu không có license (theo release notes, chưa tự kiểm) — Public đang dựa vào filter `status=published AND published_at<=$NOW`; SSO cần license. Tài liệu Directus 12 xác nhận "Self-hosted instances run on the Core tier by default… custom permission rules… now require a license". **Kết luận:** gỡ được blocker Flow, KHÔNG gỡ được blocker quyền ⇒ vẫn ở 11.17.4; chỉ mở lại khi Product quyết định về license. Mã spike chưa vào repo (chỉ sinh khi có quyết định nâng).
- **Postgres 16 → 18 — đánh giá (không thực thi):** Postgres 16 hỗ trợ tới **2028-11-09**; 17 tới 2029-11-08; 18 tới 2030-11-14 ([postgresql.org/support/versioning](https://www.postgresql.org/support/versioning/), tra 2026-11-02) ⇒ **không gấp**, còn ≈ 2 năm. Diễn tập thật trên bản sao (Postgres 16.15 → 18.6, Directus 11.17.4, schema repo + 4 Flow): `pg_dump -Fc` bằng client 16 → `pg_restore` vào 18 sạch lỗi; số bài/tác giả/thẻ/Flow giữ nguyên, 101 migration Directus nguyên vẹn, Directus 11.17.4 healthy sau 14 giây trên PG 18, Flow slug còn hoạt động. Thời gian dump 0,45 giây + restore 0,84 giây ở 104 KB; production ≈ 10 MB (restore drill Sprint 12: restore + kiểm trọn vẹn 70 giây) ⇒ gián đoạn thực tế bị chi phối bởi **dừng/khởi động lại dịch vụ** (Directus healthy ≈ 55 giây, `web` build lại site vài phút nhưng site cũ vẫn phục vụ), dự kiến **5–10 phút không có CMS**. **Bẫy phải xử lý khi nâng:** (1) image Postgres 18 khai báo `VOLUME /var/lib/postgresql` (PGDATA = `/var/lib/postgresql/18/docker`), compose hiện mount `pgdata:/var/lib/postgresql/data` ⇒ chỉ đổi tag là dữ liệu rơi vào volume ẩn danh; phải mount `/var/lib/postgresql` vào volume **mới** (không dùng lại `pgdata` cũ); (2) `services/ops/Dockerfile` đổi `postgresql16-client` → `postgresql18-client` (có trên Alpine 3.24 của `node:26.13.0-alpine`); (3) Dependabot đã `ignore` major postgres — nâng làm tay; (4) `restore-drill.sh` và CI (`postgres:16.15-alpine` trong `ci.yml`) cùng phải đổi. **Khuyến nghị:** làm trong cửa sổ bảo trì có kế hoạch trước 2028, không phải 2026; trước đó chờ bản vá 18.x ổn định vài tháng. Nháp quy trình: backup + `restore-drill` đạt → dừng `web`/`directus`/`ops` → `pg_dump` cuối → dựng `postgres:18` volume mới → `pg_restore` → đổi compose/Dockerfile/CI → `update.sh` → smoke → giữ volume 16 cũ ≥ 7 ngày để hoàn tác. ADR nháp chỉ viết khi Product duyệt thực thi.
- **Directus 11.x — chính sách vá:** Directus công bố *Extended Security Updates* cho phiên bản major cũ trong giai đoạn chuyển major (v10: tới hết 2024 sau khi v11 ra; [thảo luận LTS](https://github.com/directus/directus/discussions/18709)); **không tìm thấy ngày kết thúc hỗ trợ hay cam kết ESU cho 11.x** ở nguồn chính thức ⇒ coi như chưa có hạn. Rủi ro: khi 11.x ngừng nhận bản vá thì lỗ hổng mới không có đường vá trừ khi nâng 12 (cần license/giới hạn Flow, xem trên). **Mốc xem lại hằng quý** (đầu T2/T5/T8/T11): đọc trang [releases](https://directus.com/docs/releases) tìm thông báo EOL/ESU 11.x và kiểm có bản 11.x mới; kết quả ghi vào đây. Lần này (2026-11-02): chưa có thông báo.

**Còn lại (Backlog):** Directus 12.x: đã đánh giá, chưa nâng (xem trên; đã nâng 11.3.5 → 11.17.4, 2026-11-01) · chưa có rate limit riêng cho đăng nhập admin.

## 7. Bảo mật chuỗi cung ứng (Supply chain)

- Khoá phiên bản: image pin cứng, `--frozen-lockfile`. Quét + cập nhật định kỳ: Dependabot và `security.yml` (xem §6 Hardening 2026-11-01).

## 8. Bảo mật tầng ứng dụng

- **Render nội dung từ CMS (`body`):** `body` lưu **HTML** (WYSIWYG, [ADR-0011](./adr/0011-body-stored-as-html-wysiwyg.md); trước đó markdown + `marked`) và hiển thị qua `set:html`. Nội dung do **Editor tin cậy** nhập (không có input công khai — không comment/không user-generated content ở MVP), nên rủi ro XSS thấp. **Đã hardening ([ADR-0013](./adr/0013-sanitize-body-html.md)):** HTML được sanitize bằng allowlist thẻ/thuộc tính/scheme lúc build (`apps/web/src/lib/sanitize-body.ts`) trước khi render — defense-in-depth kể cả khi tài khoản Editor bị chiếm.
- **Không tự lộ field nội bộ:** Public API dùng **field allowlist** (không `*`) — field thêm về sau không tự ra Public ([05-cms §2](./05-cms.md), [06-api §1](./06-api.md)).
- **Security headers:** xem §6 (cấu hình ở Caddyfile, không ở code app). Site không có form/endpoint ghi công khai nên CSRF không áp dụng; admin Directus dùng cơ chế auth của Directus.
- Rate limiting Directus: xem §6 (Hardening 2026-11-01).

## 9. Logging & Audit

- **Log tiến trình:** mọi container ghi stdout/stderr, Docker lưu `json-file` xoay vòng 10 MB × 3 file mỗi service (`docker-compose.prod.yml`). Xem và truy vết sự cố: [13 §3, §5](./13-operations.md).
- **Log truy cập:** Caddy **không bật access log** (không có chỉ thị `log` trong `Caddyfile`) ⇒ không lưu IP/URL độc giả; đổi lại không truy vết được ai gọi gì — chấp nhận ở quy mô này. Rate limit Directus đếm IP trong bộ nhớ, không lưu.
- **Log thay đổi nội dung:** Directus ghi activity + revision cho mọi sửa của Admin/Editor ([04 §7](./04-database.md)); là dấu vết "ai sửa gì, khi nào", nằm trong sao lưu.
- **Không log secret/PII:** script và `ops` chỉ in trạng thái và đường dẫn; lỗi từ CMS không kèm nội dung phản hồi ([09 §10](./09-coding-standards.md), test `directus-resilience`).

## 10. Quy trình khi phát hiện lỗ hổng

- **Báo cáo:** không có kênh riêng (Product chốt 2026-11-02) — blog cá nhân, không tài khoản độc giả. Site chưa có trang/thông tin liên hệ; điểm liên hệ công khai duy nhất hiện có là repo GitHub (`tiendnm/retro-blog`). Muốn có đường báo kín đáo hơn (email, Security Advisories) phải bổ sung — Product chưa yêu cầu.
- **Mức độ và thời gian vá (mục tiêu, không cam kết):** critical/high — xử lý trong tuần phát hiện (vá, hoặc gỡ/chặn tạm bằng Cloudflare); medium/low — gom vào đợt Dependabot hằng tuần hoặc sprint kế. Lỗ hổng phụ thuộc: `security.yml` hằng tuần đỏ khi có high/critical (§6).
- **Khi nghi bị xâm nhập:** xoay secret theo runbook §4 và xử lý theo [13 §5](./13-operations.md); công bố (nếu cần) bằng một bài trên chính blog.

## 11. Checklist bảo mật trước phát hành

- [x] Không secret trong repo/log — `.env*` gitignored; chỉ `.example` placeholder _(S6)_
- [x] HTTPS/TLS bắt buộc — Caddy auto-TLS + HTTP→HTTPS _(S6, ADR-0007)_
- [x] Quyền Directus theo least privilege — Public read + gate `published`/`$NOW` + field allowlist _(S2)_
- [x] Postgres không expose; Directus chỉ qua proxy _(S6)_
- [x] **Security headers cấu hình** — Caddyfile, đã kiểm trên 200/404/502 _(S8)_; đã xác nhận bằng trình duyệt trên domain thật (2026-11-01: trang chủ + bài viết + lightbox, 0 vi phạm CSP) và nâng HSTS lên 1 năm
- [x] **Webhook rebuild siết** — header-only token, hằng-thời-gian, khoá thử sai, bind loopback _(S8)_
- [x] **Sanitize HTML body (XSS)** — allowlist lúc build, [ADR-0013](./adr/0013-sanitize-body-html.md) _(S7)_
- [x] **Dependencies quét lỗ hổng** — Dependabot + `security.yml` (2026-11-01, §6); còn 3 lỗ hổng mức thấp/vừa chưa vá
- [x] 2FA admin — **quyết định không bật**, rủi ro chấp nhận (Product, 2026-11-02; §3)
