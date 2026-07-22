# ADR-0008 — Rebuild-on-publish: Directus Flow → Webhook → Shell script → Atomic swap

> **Status:** Accepted <!-- ratified 2026-07-23 (Sprint 6 Phase 0, Product chốt) -->
> **Ngày đề xuất:** 2026-07-23 · **Ngày Accepted:** 2026-07-23
> **Người quyết định:** Product
> **Người liên quan / tham vấn:** Team dự án
> **Nguyên tắc tuân thủ (Principles):** P3 (API-first), P4 (Self-host first), P5 (Cloud-ready), Hiệu năng (NFR); giải "SSG stale" nêu ở [ADR-0006](./0006-render-strategy.md).

---

## Bối cảnh (Context)

SSG static ([ADR-0006](./0006-render-strategy.md)): ở production nội dung mới **chỉ xuất hiện sau khi rebuild** — ADR-0006 để ngỏ "rebuild-on-publish qua CI/CD là future work". Sprint 6 cần: Editor publish trong Directus → site tự cập nhật, theo hướng **self-host tối giản**, **không** thêm hạ tầng nặng (CI ngoài / microservice) khi chưa cần ([Plan §3.3](../sprints/sprint-6-implementation-plan.md), yêu cầu Product).

## Quyết định (Decision)

Chúng ta chọn pipeline **on-server, tối giản**:

**Directus Flow** (trigger `items.create/update/delete` trên `posts` + `categories`/`authors`) → **Webhook** (bảo vệ bằng **token**) → **Shell script / internal utility** on-server chạy `astro build` → **Atomic swap** thư mục static mà Caddy ([ADR-0007](./0007-reverse-proxy-and-tls.md)) phục vụ.

Ràng buộc thiết kế:
- **KHÔNG** triển khai **microservice riêng** trong MVP (chỉ script/utility) — trừ khi có lý do rõ ràng (queue/điều phối phức tạp) về sau.
- **KHÔNG** phụ thuộc CI ngoài (GitHub Actions) ở MVP.
- **Web image = build-runner TÁI LẬP** ([apps/web/Dockerfile](../../apps/web/Dockerfile)): deps cài `--frozen-lockfile` lúc build image; **`astro build` chạy lúc RUNTIME** (fetch Directus qua network nội bộ). ⇒ **không bake nội dung vào image**; rebuild-on-publish chỉ chạy build + swap, **không** rebuild Docker image mỗi lần publish.
- **Atomic swap:** build vào thư mục staging rồi đổi con trỏ (symlink) → Caddy không bao giờ phục vụ bản dở; **giữ N build gần nhất** cho **rollback** ([08 §6](../08-deployment.md)).
- **Debounce** gộp publish liên tiếp; build **fail → giữ bản đang phục vụ**.
- **Fallback:** rebuild thủ công (runbook [13](../13-operations.md)).

## Nguyên tắc tuân thủ & đánh đổi (Principle Compliance — G1)

| Principle | Tuân thủ / Đánh đổi | Ghi chú |
|---|---|---|
| P3 API-first | ✅ | Build đọc [API Contract 03d](../03d-api-contract.md) qua thin client |
| P4 Self-host | ✅ | Toàn bộ on-server, không dịch vụ ngoài |
| P5 Cloud-ready | ✅ | Script/Flow di chuyển được |
| Hiệu năng | ✅ | Giữ static (nhanh); chỉ swap khi có bản mới |
| Tức thời ở prod | ⚠️ | Có độ trễ = thời gian build (chấp nhận cho blog) |

## Các phương án đã cân nhắc (Alternatives Considered)

| Phương án | Ưu điểm | Nhược điểm | Vì sao không chọn |
|---|---|---|---|
| **On-server Flow→webhook→script→swap** (đã chọn) | Tối giản, self-host, không phụ thuộc ngoài, atomic | Logic build/queue tự quản (nhẹ) | — |
| GitHub Actions CD | CI/CD chuẩn, có lịch sử | Phụ thuộc GitHub + secrets ngoài; nặng cho MVP self-host | Để cân nhắc khi cần CI (Sprint 7+) |
| Microservice rebuild riêng | Mở rộng tốt (queue/điều phối) | Thừa hạ tầng khi chưa cần | Chỉ làm khi có lý do rõ ràng |
| SSR/hybrid (bỏ static) | Tức thời | Lệch ADR-0006/0002, self-host phức tạp | Ngoài phạm vi; thừa nhu cầu |
| Rebuild thủ công | Đơn giản nhất | Không tự động (dễ quên) | Chỉ giữ làm fallback |

## Hệ quả & Trade-off (Consequences)

**Tích cực:** publish → tự cập nhật; atomic → không downtime/bản dở; build-runner tái lập; rollback bằng swap bản trước; không phụ thuộc dịch vụ ngoài.
**Tiêu cực / Đánh đổi:** nội dung mới trễ bằng thời gian build; script tự quản debounce/giữ-N-build (độ phức tạp nhỏ); webhook cần bảo vệ token.
**Cần theo dõi:** tần suất publish cao → cân nhắc queue/microservice (khi đó có "lý do rõ ràng"); dung lượng giữ N build.

## Chi phí migration nếu thay thế trong tương lai (Migration Cost)

- **Phải sửa:** script rebuild + Directus Flow (nếu chuyển sang CI/CD ngoài hoặc microservice); cấu hình swap.
- **LÕI KHÔNG ảnh hưởng:** [03b](../03b-domain-model.md)/[03c](../03c-content-model.md)/[03d](../03d-api-contract.md)/[03e](../03e-data-model.md); Reader; thin client/DTO; **rule** phân quyền.
- **Dữ liệu cần di trú:** không.
- **Mức chi phí ước tính:** **Thấp–Trung bình** — pipeline là tầng RÌA/vận hành; hợp đồng dữ liệu & render mode giữ nguyên.

## Liên kết (Links)

- [ADR-0006](./0006-render-strategy.md) (SSG — nêu future rebuild) · [ADR-0007](./0007-reverse-proxy-and-tls.md) (Caddy phục vụ static) · [08-deployment §4](../08-deployment.md) · [13-operations](../13-operations.md) · [Sprint 6 Plan](../sprints/sprint-6-implementation-plan.md)
