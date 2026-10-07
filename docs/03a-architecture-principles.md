# 03a — Architecture Principles

> 🎯 **Mục đích:** Tuyên bố các nguyên tắc kiến trúc *bắt buộc* mà mọi tài liệu thiết kế, ADR và code phải tuân theo. Đây là tài liệu **governing** — khi có xung đột, nguyên tắc ở đây thắng.
> 🔗 **Liên quan:** [03-architecture](./03-architecture.md) · [03b-domain-model](./03b-domain-model.md) · [10-decisions](./10-decisions.md) · [adr/](./adr/)

---

## Nguyên tắc 0 — Trung lập công nghệ ở tầng LÕI (BAO TRÙM)

> **Các tài liệu ở tầng LÕI (Domain Model, Content Model, API Contract, Data Model...) phải hoàn toàn trung lập với công nghệ. Các công nghệ như Astro, Directus, PostgreSQL, Docker... CHỈ được xuất hiện trong tài liệu implementation, `Tech Stack`, hoặc ADR.**

- **Hệ quả:** không nhắc tên sản phẩm/công nghệ trong tài liệu LÕI; mô tả bằng *vai trò* (Headless Content Service, Content Store, Site Generator...).
- **Kiểm chứng:** grep tên công nghệ trong file LÕI phải cho **0 kết quả**.
- **Bài test no-lock-in:** đổi CMS/DB/framework chỉ được chạm tầng RÌA. Nếu buộc sửa tầng LÕI → thiết kế sai.

---

## Governance — cách các nguyên tắc này có hiệu lực

> Để Principles thực sự là *nền tảng* chứ không phải khẩu hiệu, áp dụng hai quy tắc cưỡng chế sau:

- **G1 — Trích dẫn bắt buộc:** *Mọi* tài liệu kiến trúc ([03-architecture](./03-architecture.md), [Tech Stack](./10a-tech-stack.md), các tài liệu thiết kế) và *mọi* ADR phải có mục **"Nguyên tắc tuân thủ"** chỉ rõ Principle(s) liên quan (và Principle nào bị đánh đổi, nếu có).
- **G2 — Cổng review:** reviewer dùng danh sách nguyên tắc làm gate để chấp nhận/bác một thiết kế hoặc ADR. Thiết kế vi phạm nguyên tắc mà không có waiver (§ cuối) sẽ bị từ chối.

Mỗi nguyên tắc gồm: **Phát biểu · Lý do · Hệ quả thiết kế · Cách kiểm chứng**.

## P1 — Headless CMS
- **Phát biểu:** Quản trị nội dung tách khỏi lớp trình bày; nội dung phân phối qua API.
- **Lý do:** Cho phép nhiều kênh tiêu thụ, thay lớp trình bày độc lập.
- **Hệ quả:** Không có logic hiển thị trong CMS; CMS chỉ là nguồn nội dung.
- **Kiểm chứng:** Lớp trình bày không truy cập trực tiếp storage của CMS.

## P2 — CMS-agnostic
- **Phát biểu:** Hệ thống không phụ thuộc một CMS cụ thể; CMS là chi tiết thay thế được.
- **Lý do:** Tránh lock-in; bảo vệ tri thức content model dài hạn.
- **Hệ quả:** Content Model sống ở tầng LÕI ([03c](./03c-content-model.md)); ánh xạ CMS ở tầng RÌA ([05](./05-cms.md)).
- **Kiểm chứng:** Thay CMS chỉ cần viết lại tài liệu CMS Mapping, không đụng Content/Domain.

## P3 — API-first
- **Phát biểu:** API Contract ([03d](./03d-api-contract.md)) là ranh giới trước tiên; cả producer lẫn consumer tuân theo nó.
- **Lý do:** Tách nhịp phát triển frontend/backend; hợp đồng ổn định.
- **Hệ quả:** Contract định nghĩa *trước* khi hiện thực; transport là chi tiết.
- **Kiểm chứng:** Frontend code chỉ phụ thuộc DTO của Contract, không phụ thuộc cú pháp backend.

## P4 — Self-host first
- **Phát biểu:** Hệ thống phải chạy được đầy đủ trên hạ tầng tự quản.
- **Lý do:** Chủ quyền dữ liệu, chi phí, không phụ thuộc nhà cung cấp.
- **Hệ quả:** Không dùng dịch vụ độc quyền không thể self-host cho luồng cốt lõi.
- **Kiểm chứng:** Có kịch bản chạy toàn bộ local/on-prem không cần dịch vụ đám mây bắt buộc.

## P5 — Cloud-ready
- **Phát biểu:** Đồng thời có thể triển khai lên cloud mà không sửa mã domain.
- **Lý do:** Mở rộng linh hoạt khi cần.
- **Hệ quả:** Cấu hình qua biến môi trường (12-factor), stateless nơi có thể, tách state ra ngoài.
- **Kiểm chứng:** Chuyển self-host → cloud chỉ đổi cấu hình/hạ tầng, không đổi domain.

## P6 — Low coupling
- **Phát biểu:** Các thành phần/tài liệu phụ thuộc qua *hợp đồng ổn định*, không qua chi tiết nội bộ.
- **Lý do:** Thay đổi cục bộ không lan rộng.
- **Hệ quả:** Ports & adapters; tầng trong không biết tầng ngoài.
- **Kiểm chứng:** Sơ đồ phụ thuộc không có mũi tên từ LÕI → RÌA.

## P7 — High cohesion
- **Phát biểu:** Mỗi tài liệu/thành phần có *một* trách nhiệm rõ ràng.
- **Lý do:** Dễ hiểu, dễ bảo trì, dễ định vị.
- **Hệ quả:** Không gộp nhiều tầng vào một file; tách khi phát sinh trách nhiệm mới.
- **Kiểm chứng:** Có thể tóm tắt trách nhiệm mỗi file trong một câu.

## P8 — Tách LÕI / RÌA (Dependency Inversion tài liệu)
- **Phát biểu:** *Định nghĩa* ở tầng trong (LÕI, tech-neutral) KHÔNG được **phụ thuộc** vào tầng ngoài (RÌA/Edge, công nghệ). Tính đúng đắn & đầy đủ của tài liệu LÕI phải độc lập với mọi tài liệu RÌA.
- **Con trỏ hiện thực (ĐƯỢC PHÉP):** tài liệu LÕI được phép chứa *con trỏ hiện thực không mang tính chuẩn tắc* (non-normative implementation pointer) trỏ xuống tài liệu RÌA — nên gắn nhãn rõ (vd "▼ Hiện thực: …") — miễn là nó chỉ để **điều hướng**, không phải nguồn phụ thuộc.
- **Ranh giới:** con trỏ điều hướng ≠ phụ thuộc. **Cấm:** (a) nội dung LÕI *cần* thông tin từ RÌA mới hoàn chỉnh; (b) nhúng chi tiết/tên công nghệ (đã cấm bởi Nguyên tắc 0 & P9).
- **Kiểm chứng:** (1) LÕI không chứa tên công nghệ (grep = 0); (2) xoá mọi link RÌA khỏi tài liệu LÕI thì phần *định nghĩa* vẫn đúng & đủ.

## P9 — Ranh giới tầng nghiêm ngặt (Strict Layer Boundaries)
- **Phát biểu:** Bốn tầng mô hình có ranh giới *cứng*, không được lấn nội dung của nhau:
  - **Domain Model** ([03b](./03b-domain-model.md)) — KHÔNG chứa chi tiết kỹ thuật (không field storage, không kiểu CMS, không transport).
  - **Content Model** ([03c](./03c-content-model.md)) — KHÔNG chứa chi tiết CMS hay Database (không collection/interface, không kiểu cột/index).
  - **API Contract** ([03d](./03d-api-contract.md)) — KHÔNG chứa endpoint hay transport implementation (không URL/route, không REST/GraphQL cụ thể).
  - **Data Model** ([03e](./03e-data-model.md)) — KHÔNG chứa persistence detail (không index vật lý, không migration, không tối ưu riêng của một database).
- **Lý do:** Ngăn tái diễn tình trạng chồng chéo/trùng trách nhiệm (finding F8) và giữ tính thay thế được.
- **Hệ quả:** Chi tiết bị cấm ở tầng nào sẽ nằm ở tầng RÌA tương ứng: CMS→[05](./05-cms.md), Database/persistence→[04](./04-database.md), transport/endpoint→[06](./06-api.md).
- **Kiểm chứng:** Mỗi tài liệu LÕI có "banner tech-neutral"; review đối chiếu bảng ranh giới này.

| Tầng | Được chứa | KHÔNG được chứa | Chi tiết bị cấm nằm ở |
|---|---|---|---|
| Domain Model | Khái niệm, luật nghiệp vụ, state machine | Bất kỳ chi tiết kỹ thuật nào | Các tầng dưới |
| Content Model | Loại nội dung, field (kiểu trung lập), quan hệ | Collection/interface CMS; kiểu cột/index DB | [05](./05-cms.md), [04](./04-database.md) |
| API Contract | Resource, DTO, ngữ nghĩa phân trang/lỗi | Endpoint, URL, REST/GraphQL, transport | [06](./06-api.md) |
| Data Model | Thực thể logic, khoá, toàn vẹn | Index vật lý, migration, tối ưu DB | [04](./04-database.md) |

---

## Ngoại lệ & Waiver
> Khi một quyết định buộc phải vi phạm một nguyên tắc, phải ghi **ADR** nêu rõ nguyên tắc bị đánh đổi, lý do, phạm vi, và điều kiện gỡ bỏ ngoại lệ.

| Ngày | Nguyên tắc bị đánh đổi | ADR | Điều kiện gỡ |
|---|---|---|---|
| — | — | — | — |
