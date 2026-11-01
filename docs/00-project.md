# 00 — Project & Vision

> 🎯 **Mục đích:** Xác lập *lý do tồn tại* của dự án — tầm nhìn, phạm vi, đối tượng và tiêu chí thành công. Đây là "hiến pháp" mà mọi tài liệu và quyết định khác phải nhất quán.
> 🔗 **Liên quan:** [01-requirements](./01-requirements.md) · [02-roadmap](./02-roadmap.md) · [16-glossary](./16-glossary.md)

---

## 1. Tóm tắt (Elevator pitch)

> _1–2 câu: "Retro Blog là một ___ giúp ___ có thể ___, khác biệt bởi ___."_

Retro Blog là một **blog về máy tính cổ** (phần cứng, phần mềm, lập trình, kiến thức nền tảng, lịch sử, retro gaming) giúp độc giả tìm và đọc nhanh các bài viết chọn lọc, khác biệt bởi **giao diện và nội dung cùng một chất retro** (motif cửa sổ/terminal/danh mục DIR, "thẻ giấy") và bởi một **hệ thống tự host, bền, ít bảo trì** — site tĩnh, CMS tách rời, có thể đổi từng thành phần mà không viết lại nội dung.

## 2. Vấn đề & Cơ hội

Nội dung về máy tính cổ tiếng Việt nằm rải rác (diễn đàn, mạng xã hội, trang cá nhân bỏ hoang), khó tìm, khó duy trì. Một blog riêng cho phép gom bài theo chuyên mục/thẻ, có URL ổn định, tải nhanh và không phụ thuộc nền tảng bên thứ ba. Đồng thời dự án là cơ hội thực hành một kiến trúc **headless, tech-neutral ở tầng LÕI** ([03a](./03a-architecture-principles.md)) chạy được nhiều năm trên phần cứng nhà.

## 3. Tầm nhìn sản phẩm (Product Vision)

Trong 6–12 tháng: một blog đã phát hành công khai, có kho bài đủ để duyệt theo chuyên mục/thẻ/lưu trữ/tìm kiếm; đăng bài là thao tác trong CMS rồi chờ site tự dựng lại; hệ thống tự sao lưu, tự báo khi hỏng, và một người vận hành xử lý được sự cố theo runbook ([13](./13-operations.md)) mà không phải nhớ. Thành công = người đọc ở lại đọc, người viết không phải nghĩ tới hạ tầng.

## 4. Mục tiêu & Chỉ số thành công (Goals & Success Metrics)

| Mục tiêu | Chỉ số (metric) | Mục tiêu định lượng | Cách đo |
|---|---|---|---|
| Trải nghiệm đọc nhanh | Core Web Vitals (LCP / CLS / INP) | LCP < 2,5s · CLS < 0,1 · INP < 200ms | Lighthouse CI (job `site-checks`, ngưỡng Performance ≥ 0,9) |
| Dễ tiếp cận | WCAG 2.2 AA | axe 0 serious/critical; Lighthouse Accessibility ≥ 0,95 | Job `site-checks` ([15 §B3](./15-seo-accessibility.md)) |
| Dễ tìm | SEO kỹ thuật | Lighthouse SEO ≥ 0,95; sitemap/canonical/RSS hợp lệ | `site-checks`, `scripts/check-site.mjs` |
| Đáng tin cậy | Khôi phục được | Restore drill đạt; backup ra ngoài host (R2) | `scripts/restore-drill.sh` ([13 §4](./13-operations.md)) |
| Dễ bảo trì | Cổng chất lượng | CI xanh (`quality` + `build`) mới merge | GitHub Actions ([14 §4](./14-quality-gates.md)) |

## 5. Phạm vi (Scope)

Nguồn sự thật về phạm vi v1 là [01a-mvp-scope](./01a-mvp-scope.md); dưới đây là tóm tắt.

**Trong phạm vi (In scope):**
- Đọc bài đã xuất bản; duyệt theo chuyên mục, thẻ, tác giả, lưu trữ theo tháng; tìm kiếm phía client; RSS.
- Soạn/sửa/xuất bản bài trong CMS bởi Admin và Editor; quản lý ảnh (alt/caption).
- SEO kỹ thuật, a11y baseline, sao lưu và giám sát cơ bản.

**Ngoài phạm vi (Out of scope):**
- Tài khoản/đăng nhập cho độc giả, phân quyền phức tạp (chỉ Admin + Editor).
- Bình luận, newsletter, analytics dashboard, related posts, CDN/tối ưu ảnh nâng cao.

**Sẽ cân nhắc sau (Later / Maybe):**
- Đa ngôn ngữ (i18n), trạng thái *Chờ duyệt*/*Lên lịch*/*Lưu trữ*, dark/light mode, hiệu ứng giấy cũ (grain/crease — Sprint 16).

## 6. Đối tượng người dùng (Personas)

| Persona | Vai trò | Nhu cầu chính | Nỗi đau (pain) |
|---|---|---|---|
| Độc giả (Reader) | Người đọc bài | Đọc nhanh, tìm bài dễ | Nội dung rải rác, trang nặng quảng cáo, URL chết |
| Biên tập/Tác giả (Editor/Author) | Soạn & xuất bản nội dung | Soạn thảo tiện, lưu nháp, xuất bản không cần biết hạ tầng | Công cụ đăng bài phức tạp, lo mất bài |
| Quản trị (Admin) | Vận hành hệ thống | Cấu hình, an toàn, khôi phục khi hỏng | Bảo trì tốn thời gian, nâng phiên bản gây vỡ |

## 7. Các bên liên quan (Stakeholders) & vai trò

| Bên liên quan | Vai trò | Quan tâm điều gì | Người đại diện |
|---|---|---|---|
| Product | Chủ sản phẩm, chốt phạm vi và ưu tiên | Blog đúng định vị retro-computing, chi phí và công sức bảo trì thấp | Chủ blog |
| Admin/Editor | Vận hành và đăng bài | CMS dễ dùng, runbook rõ, backup khôi phục được | Chủ blog (một người đảm nhiệm cả hai vai) |
| Độc giả | Người dùng cuối | Trang nhanh, đọc được trên mọi thiết bị | Công chúng |

## 8. Ràng buộc & Giả định (Constraints & Assumptions)

- **Ràng buộc:** tự host trên máy tại nhà (CPU thấp, RAM hạn chế), ingress duy nhất qua Cloudflare Tunnel ([ADR-0015](./adr/0015-cloudflare-tunnel-ingress.md)); chi phí hạ tầng tối thiểu; không frontend auth và không public CMS users; tầng LÕI không nhắc công nghệ ([03a](./03a-architecture-principles.md)).
- **Giả định:** một người vận hành; nội dung do Editor tin cậy nhập (không có nội dung do người dùng gửi); lưu lượng thấp tới vừa (site tĩnh chịu được); Directus 11.x còn nhận bản vá (xem lại hằng quý, [12 §6](./12-security.md)).

## 9. Rủi ro chính (Key Risks)

| Rủi ro | Ảnh hưởng | Khả năng | Giảm thiểu (mitigation) |
|---|---|---|---|
| Máy chủ nhà hỏng/mất điện | Cao | TB | Backup hằng ngày + đẩy R2, restore drill định kỳ ([13 §4](./13-operations.md)) |
| Directus 11.x ngừng nhận bản vá; 12.x đòi license cho quyền tuỳ biến | Cao | TB | Xem lại hằng quý; giữ tầng LÕI tech-neutral để thay CMS ([12 §6](./12-security.md)) |
| Nâng phiên bản gây vỡ build/deploy | TB | TB | Image pin cứng, lockfile, CI bắt buộc (`quality` + `build`), Dependabot hằng tuần |
| Postgres 16 hết hỗ trợ (2028-11-09) | TB | Thấp (xa) | Nâng có kế hoạch trước 2028 theo quy trình ở [12 §6](./12-security.md) |

## 10. Câu hỏi mở (Open Questions)

- [ ] Chiến lược nội dung dài hạn: tần suất đăng và nguồn bài (ngoài phạm vi kỹ thuật, Product quyết khi cần).
- [ ] Có thêm kênh theo dõi lưu lượng (analytics) không? Hiện chọn **không** vì quyền riêng tư và chi phí ([12 §5](./12-security.md)).
