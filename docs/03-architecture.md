# 03 — Architecture

> **Trạng thái:** 🟢 Đã duyệt · **Owner:** _(chưa gán)_ · **Cập nhật lần cuối:** 2026-07-21 · **Người duyệt:** Tech Lead (Sprint 0 close-out)
>
> 🎯 **Mục đích:** Mô tả *hình dạng logic* của hệ thống theo **vai trò (roles)** và **ports & adapters** — tách phần ổn định (port/contract) khỏi phần thay thế được (adapter/công nghệ). Là bản đồ tổng thể, tech-neutral.
> 🔗 **Liên quan:** [03a-architecture-principles](./03a-architecture-principles.md) · [03c-content-model](./03c-content-model.md) · [03d-api-contract](./03d-api-contract.md) · [03e-data-model](./03e-data-model.md) · [10a-tech-stack](./10a-tech-stack.md)

---

> 🧭 **Mô tả theo VAI TRÒ & PORT (tech-neutral).** Tài liệu này KHÔNG chốt tên công nghệ cụ thể. Adapter (công nghệ hiện tại cho mỗi vai trò) được liệt kê ở [Tech Stack](./10a-tech-stack.md), mỗi lựa chọn có ADR ([10-decisions](./10-decisions.md)). Tuân [Nguyên tắc 0 & P6](./03a-architecture-principles.md).

## 0. Nguyên tắc tuân thủ (Principle Compliance — G1)

> Kiến trúc này hiện thực các Architecture Principles sau. Xem §9 để đối chiếu chi tiết.

| Principle | Cách kiến trúc này hiện thực |
|---|---|
| P1 Headless | Vai trò Presentation tách khỏi Content Service, giao tiếp qua API |
| P2 CMS-agnostic | Content Service là *vai trò* + port; adapter (CMS) thay được |
| P3 API-first | Mọi consumer phụ thuộc **API Contract** ([03d](./03d-api-contract.md)), không phụ thuộc adapter |
| P4/P5 Self-host / Cloud | Hai topology triển khai (§7) dùng chung roles |
| P6 Low coupling | Ports ổn định; adapters thay thế không lan sang LÕI |
| P8/P9 Ranh giới tầng | Kiến trúc chỉ tham chiếu contract của LÕI, không nhúng chi tiết |

## 1. Thuộc tính chất lượng (Quality Attributes) — xếp ưu tiên

> Kiến trúc là đánh đổi. Xếp hạng để biết khi xung đột thì ưu tiên gì.

1. TODO (vd: Hiệu năng đọc — Core Web Vitals) · 2. TODO (Bảo trì/agnostic) · 3. TODO (Bảo mật) · 4. TODO (Chi phí)...

## 2. Sơ đồ ngữ cảnh (C4 L1 — System Context)

```
        [ Độc giả ]                 [ Biên tập viên ]
             │ đọc                        │ soạn/xuất bản
             ▼                            ▼
      ┌──────────────────  RETRO BLOG  ──────────────────┐
      │  (hệ thống blog headless, content-driven)         │
      └───────────────────────────────────────────────────┘
             │ (tuỳ chọn) dịch vụ ngoài: analytics, search...
```
> Tech-neutral. TODO: bổ sung actor/dịch vụ ngoài thực tế.

## 3. Vai trò thành phần (Component Roles) — C4 L2

> Mô tả bằng *trách nhiệm* và *port*, KHÔNG bằng sản phẩm.

| Vai trò (Role) | Trách nhiệm | Port (giao diện ổn định) | Adapter hiện tại |
|---|---|---|---|
| **Presentation / Site** | Render trang cho độc giả | *tiêu thụ* API Contract [03d](./03d-api-contract.md) | → [Tech Stack](./10a-tech-stack.md) |
| **Headless Content Service** | Quản trị & phục vụ nội dung | *phơi bày* API Contract; hiện thực Content Model [03c](./03c-content-model.md) | → [Tech Stack](./10a-tech-stack.md) |
| **Content Store** | Lưu trữ bền vững | hiện thực Data Model [03e](./03e-data-model.md) | → [Tech Stack](./10a-tech-stack.md) |
| **Edge / Reverse Proxy** | TLS, routing, cache biên | HTTP(S) | → [Tech Stack](./10a-tech-stack.md) |
| **Build / Deploy Orchestrator** | Build site & phát hành khi nội dung đổi | sự kiện "nội dung đã xuất bản" | → [Tech Stack](./10a-tech-stack.md) |

## 4. Ports & Adapters (Hexagonal view)

> **Port** = hợp đồng ổn định (thuộc LÕI). **Adapter** = hiện thực thay thế được (thuộc RÌA).

| Port (ổn định) | Định nghĩa ở | Adapter phải thoả | Thay adapter ảnh hưởng |
|---|---|---|---|
| Content API | [03d-api-contract](./03d-api-contract.md) | Phơi bày đúng DTO & ngữ nghĩa | [06-api](./06-api.md) |
| Content Authoring | [03c-content-model](./03c-content-model.md) | Hiện thực đủ content types/roles | [05-cms](./05-cms.md) |
| Persistence | [03e-data-model](./03e-data-model.md) | Bảo toàn thực thể/khoá/toàn vẹn | [04-database](./04-database.md) |

> 🔒 **Quy tắc:** mọi mũi tên phụ thuộc chỉ đi từ **Adapter → Port**, không bao giờ Port → Adapter (P6).

## 5. Luồng dữ liệu (Data Flow) — tech-neutral

- **Build-time (SSG):** nội dung *Published* → sự kiện → Orchestrator build site tĩnh → phát hành.
- **Runtime:** độc giả yêu cầu → Edge → Presentation (tĩnh hoặc render) → (nếu cần) Content API.
- TODO: chốt build-time vs runtime cho từng loại trang (chiến lược render — cần ADR).

## 6. Mối quan tâm xuyên suốt (Cross-cutting)

- Xác thực & phân quyền: [12-security](./12-security.md), hiện thực ở [05-cms](./05-cms.md).
- Caching & invalidation, Media/assets, Error/fallback: định nghĩa ngữ nghĩa ở [03d](./03d-api-contract.md), hiện thực ở [06](./06-api.md).
- Observability: [13-operations](./13-operations.md). i18n: [03c §6](./03c-content-model.md).

## 7. Topology triển khai (logic) — Self-host first & Cloud-ready

> Cùng bộ **vai trò**, hai cách đặt. Chi tiết pipeline ở [08-deployment](./08-deployment.md); vận hành runtime ở [13-operations](./13-operations.md) (xem §8 phân định chủ sở hữu).

- **Self-host (mặc định — P4):** tất cả vai trò chạy trên hạ tầng tự quản (một/nhiều node).
- **Cloud-ready (P5):** cùng vai trò, đặt trên dịch vụ cloud; cấu hình qua biến môi trường, state tách ngoài.

```
[Edge/Proxy] → [Presentation] → (build-time) ← [Orchestrator]
                     │
                     ▼ (API Contract)
            [Headless Content Service] → [Content Store]
```

## 8. Phân định chủ sở hữu "topology" (sửa F9)

| Góc nhìn | Chủ sở hữu | Nội dung |
|---|---|---|
| Logic (vai trò, ranh giới, port) | **03 (tài liệu này)** | Sơ đồ vai trò & luồng |
| Pipeline / phát hành | [08-deployment](./08-deployment.md) | CI/CD, build, release |
| Runtime vận hành | [13-operations](./13-operations.md) | Topo thực thi, scaling, backup |

## 9. Quyết định kiến trúc (→ ADR)

> Không chôn quyết định ở đây. Adapter cho mỗi vai trò được chọn qua ADR & tổng hợp ở [Tech Stack](./10a-tech-stack.md).

| Quyết định | ADR |
|---|---|
| Adapter cho Presentation/Site | [ADR-0002](./adr/0002-use-astro-site-generator.md) |
| Adapter cho Headless Content Service | [ADR-0003](./adr/0003-use-directus-headless-cms.md) |
| Adapter cho Content Store | [ADR-0004](./adr/0004-use-postgresql-content-store.md) |
| Đóng gói & runtime | [ADR-0005](./adr/0005-use-docker-packaging.md) |
| Chiến lược render (SSG/SSR/ISR) | _TBD (ADR-0006)_ |

## 10. Rủi ro & Đánh đổi

| Rủi ro/đánh đổi | Bối cảnh | Hệ quả | Hướng xử lý |
|---|---|---|---|
| ... | ... | ... | ... |

## 11. Câu hỏi mở

- [ ] Chiến lược render mặc định? · [ ] Search tự host hay dịch vụ? · [ ] Media CDN?
