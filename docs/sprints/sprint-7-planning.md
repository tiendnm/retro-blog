# 🛡️ Sprint 7 — Planning (System Hardening & Quality)

> **Trạng thái:** 🟢 **Approved with minor revisions** (Product 2026-07-28) — bản Planning cuối, chờ Product xác nhận trước khi implement · **Người soạn:** Implementation (Software Architect)
>
> ⚠️ Đây là **tài liệu lập kế hoạch** (bản 3 — đã áp các điều chỉnh của Product). Chưa implement, chưa commit, chưa đụng code. Phase 1 chỉ bắt đầu **sau khi Product xác nhận bản cuối này**.
> 🔗 [11-testing](../11-testing.md) · [14-quality-gates](../14-quality-gates.md) · [09-coding-standards](../09-coding-standards.md) · [08-deployment](../08-deployment.md) · [Sprint 6 Completion](./sprint-6-completion-report.md) · [Architecture Review 2026-07-21](../reviews/architecture-review-2026-07-21.md).
>
> 📌 **Bối cảnh:** roadmap định vị Sprint 7 là **Hardening** (`14 §2.2`: "CI tự động = Sprint 7"; `08 §3`: "CI test tự động… để Sprint 7"). Bản 1 (Category Discoverability) đã bị Product từ chối; bản này (bản 2→3) tập trung chất lượng hệ thống, không thêm feature Reader.

---

## ⭐ Product Decisions (đã chốt — 2026-07-28)

> Thay cho §8 "Questions" của bản trước — Product đã quyết. Ghi lại để làm ràng buộc thực thi.

| # | Quyết định |
|---|---|
| **Goal** | ✅ Giữ nguyên **System Hardening & Quality**. |
| **Tooling** | ✅ **Biome** (lint + format) · **Vitest** (test) · **astro check** (typecheck). Chốt — vẫn ghi ADR để lưu lý do/khả nghịch. |
| **CI** | 🔧 **Build là BẮT BUỘC trong CI.** Pipeline đầy đủ: `install → lint → format check → typecheck → test → build`. Không được bỏ bước build. Cần môi trường tối thiểu để build → đề xuất giải pháp ở Phase 3. |
| **Format-only** | ✅ Cho phép **1 commit format-only độc lập** làm baseline. |
| **Phase 4** | ❌ **Không còn thuộc Sprint 7** → chuyển toàn bộ sang **Deferred Backlog**. Sprint 7 chỉ gồm Phase 1–3. |
| **Deploy-only** | ✅ Tiếp tục **Out of Scope** (2FA / ACME-DNS / health check trên domain thật). |
| **Deliverable mới** | ➕ **Quality Report** cuối Sprint (§4) để Product đánh giá mức hardening. |

---

## 0. Đánh giá trạng thái hiện tại (căn cứ để chọn hạng mục)

> Rà soát code + docs thật (không giả định). Cột **Bằng chứng** trích nguồn.

| Trục | Hiện trạng | Bằng chứng |
|---|---|---|
| **Testability** | 🔴 **Chưa có** test tự động. Không test runner, không script `test`, 0 test app (các `*.test.ts` chỉ trong `node_modules`). `11-testing` toàn TODO. **Nhưng** bề mặt testable tốt: nhiều hàm thuần + fixtures deterministic ~100 bài. | `apps/web/package.json` (chỉ `dev/build/preview/astro`) · `11-testing.md` §1–§8 TODO · `services/directus/fixtures/` |
| **CI/CD** | 🔴 **Không có CI**. `.github/` chỉ có `copilot-instructions.md`. Điều kiện merge/branch protection chưa định nghĩa. | `.github/` · `08 §3` ("CI… để Sprint 7") · `14 §2.2` + `14 §4` (TODO) |
| **Maintainability** | 🔴 **Không có cưỡng chế**. Không lint/format/typecheck tooling; `09` §4/§5/§10 TODO. Code sạch, chú thích tốt (nền tốt) nhưng chất lượng phụ thuộc kỷ luật tay. | Không có `eslint/prettier/biome` config · chỉ `apps/web/tsconfig.json` · `09-coding-standards.md` |
| **Reliability** | 🟢 **Nền tốt, chưa được test chứng minh**. Thin client có `DirectusError` model, xử lý fetch-fail/HTTP-non-ok, nuốt `not_found`→`null` đúng chỗ; input clamp phòng thủ. Build byte-identical (S6). Thiếu: test hồi quy + runtime contract-validation. | `apps/web/src/lib/directus.ts` (§`directusGet`, `clampPage*`) · `08 §3` (reproducible) |
| **Deployment confidence** | 🟢 **Phần lớn đạt (S6)**. Backup/restore drill, rollback atomic-swap, rebuild-on-publish, launch checklist đã kiểm. Thiếu: smoke-test tự động sau deploy; vài mục **@deploy** chờ domain thật. | `08 §4/§6/§8` · `sprint-6-completion-report.md` |

**Kết luận:** khoảng trống lớn nhất & đúng-roadmap là **lưới an toàn tự động** — *static gates (lint/format/typecheck) → test foundation → CI (kèm build)*. Reliability/Deployment đã có nền vững; giá trị hardening cao nhất là **ngăn hồi quy** và **cưỡng chế chất lượng** trước khi codebase lớn thêm.

---

## 1. Sprint Goal

**Mục tiêu chính:** Dựng **lưới an toàn tự động** cho dự án — cưỡng chế chất lượng tĩnh (lint/format/typecheck), phủ test cho logic cốt lõi, và **CI chạy đầy đủ các cổng này + build** trên mỗi PR/push — để đội refactor & phát hành **tự tin**, ngăn hồi quy khi codebase mở rộng.

**Giá trị mang lại:**
- **Reliability / Regression safety:** test khoá hành vi mapping DTO / error / phân trang → sửa code không âm thầm phá hợp đồng; CI build bắt lỗi tích hợp Astro↔Directus trước khi merge.
- **Maintainability:** formatter + linter + typecheck loại tranh luận phong cách, bắt lỗi sớm, giữ code nhất quán.
- **Deployment confidence:** CI xanh (gồm build) là điều kiện merge → mọi thay đổi vào `main` đã qua cổng chất lượng.
- **Đóng nợ tài liệu:** hiện thực hóa `11-testing`, `09-coding-standards §4/§5`, `14 §4`, `08 §3` (đang TODO/hứa hẹn).

**Lý do ưu tiên:** roadmap **đã định vị** Sprint 7 là hardening. Sản phẩm vừa polish (S6.5) và production-ready về vận hành (S6) — thời điểm đúng để khoá chất lượng bằng automation **trước** feature lớn (Search/RSS/Tags). Không có lưới an toàn, mỗi feature tương lai là rủi ro hồi quy không được canh gác.

---

## 2. Scope

### In Scope

| Nhóm | Hạng mục | Lấp nợ doc |
|---|---|---|
| **Static gates** | Cấu hình **Biome** (lint + format) + **astro check** (typecheck); scripts `lint`/`format`/`format:check`/`typecheck`; fix vi phạm hiện có (tối thiểu, **không** đổi hành vi); **1 commit format-only** baseline. | `09 §1/§4/§5/§9/§10` |
| **Test foundation** | **Vitest**; **unit test** logic thuần (DTO mappers, `clampPage/Size`, `DirectusError` mapping, pagination window, JSON-LD escape); **contract test** fixtures/mock ⇄ DTO (`03d`). | `11 §1–§3/§8` |
| **CI pipeline** | `.github/workflows/ci.yml`: `install → lint → format check → typecheck → test → **build (bắt buộc)**` trên PR + push `main`; **môi trường tối thiểu để build** (Phase 3); định nghĩa **merge gate / branch protection**. | `08 §3` · `14 §2.2/§4` |
| **Quality Report** | Báo cáo hardening cuối Sprint (§4) cho Product. | — |
| **Đồng bộ docs** | Cập nhật `09`, `11`, `14 §4`, `08 §3`; ADR công cụ. | các doc trên |

### Out of Scope (KHÔNG làm — phát hiện giữa chừng → Backlog, chờ Product)

- **Reader feature bất kỳ** (Category discoverability, Search, RSS, Tags, Archive, Author pages…).
- **Thay đổi hành vi/hợp đồng:** permission, data model `schema.yaml`, DTO/`types.ts`, `03c/03d`. Hardening **không** đổi behavior; chỉ thêm gate/test/format. (Format-only diff là ngoại lệ cơ học, không đổi ngữ nghĩa.)
- **Refactor lớn** code hay **docs-layer architecture refactor** (F1–F15 Architecture Review) — sáng kiến riêng.
- **@deploy-only hardening**: 2FA admin, ACME/DNS, health check/uptime, post-deploy smoke *chạy thật* (chờ domain).
- **Phase 4 cũ → Deferred Backlog:** test độ bền thin client, build-time contract assertion, **axe a11y**, **link-check**, **Lighthouse/perf budget**, **E2E (Playwright)**, script post-deploy smoke. (Xem §9.)

---

## 3. Phase Breakdown

> Mỗi Phase = 1 mục tiêu + 1 commit; xong → dừng, báo cáo, chờ review. **Các Phase chỉ chạm tooling/test/CI/docs → KHÔNG ảnh hưởng Reader/UI ⇒ KHÔNG cần Build Preview** (Working Agreement §2 miễn trừ). Verification = gate/test/CI chạy sạch + log.

### Phase 1 — Static quality gates (Biome + astro check)
- **Objective:** Có cổng chất lượng tĩnh chạy được cục bộ; code hiện tại pass sạch.
- **Estimated Deliverables:** ADR chốt Biome/Vitest/astro check · `biome.json` · scripts `lint`/`format`/`format:check`/`typecheck` (+ `@astrojs/check`, `typescript` dev-dep) · **1 commit format-only** (cô lập) rồi commit config/fix · cập nhật `09-coding-standards §1/§4/§5/§9/§10`.
- **Verification plan:** `pnpm lint` + `pnpm format:check` + `pnpm typecheck` **sạch**; `pnpm --dir apps/web build` vẫn xanh. Regression Checklist: Build ✅ · Reader UI / Category / Pagination / SEO / CMS = *Not affected*.
- **Exit Criteria:** gates xanh cục bộ; docs cập nhật; **không** đổi hành vi runtime; Product approve.

### Phase 2 — Test foundation (unit + contract)
- **Objective:** Logic cốt lõi được test khoá; `pnpm test` xanh.
- **Estimated Deliverables:** Vitest config + `test` script · unit test: `toMedia/toCategory/toSummary/toDetail`, `clampPage/clampPageSize`, `DirectusError` (mock fetch: fail→system, 403/404→not_found), pagination window, JSON-LD escape · **contract test** fixtures/mock ⇄ DTO (không field rò ngoài allowlist `03d`; null-handling) · cập nhật `11-testing §1–§3/§8`.
- **Verification plan:** `pnpm test` xanh; liệt kê logic được phủ; `lint/format:check/typecheck` vẫn sạch. Reader *Not affected*.
- **Exit Criteria:** test xanh, logic thuần cốt lõi + ≥1 contract test có mặt; docs cập nhật; Product approve.

### Phase 3 — CI pipeline (build bắt buộc) + merge gates
- **Objective:** Mỗi PR/push tự chạy **đầy đủ** `install → lint → format check → typecheck → test → build`; policy merge định nghĩa.
- **Giải pháp môi trường tối thiểu cho build (Product yêu cầu không bỏ bước build):**
  - `astro build` là SSG → **cần Directus có dữ liệu** lúc build. Đề xuất **tái dùng bootstrap dev sẵn có** trong CI (không viết mới): GitHub Actions dựng **Postgres + Directus** (qua `docker-compose.yml` dev, hoặc `services:`), chờ healthy, chạy `pnpm schema:apply` → `pnpm permissions:apply` → **`pnpm seed:dev`** (seed tối thiểu — đủ route để build, nhanh hơn full fixtures), rồi `pnpm --dir apps/web build`.
  - **Phương án B (dự phòng/tùy Product):** thay `seed:dev` bằng `fixtures:load` (~100 bài) nếu muốn build phủ dữ liệu lớn/edge — chậm hơn.
  - **Lưu ý reproducibility:** dùng đúng scripts đã version-control (`schema.yaml` + `apply-permissions.sh` + seed) ⇒ CI build khớp cơ chế deploy, không thêm đường dựng dữ liệu mới.
- **Estimated Deliverables:** `.github/workflows/ci.yml` (pnpm 10.33.2 + Node 22; job dựng Directus+Postgres + seed + build) · định nghĩa **branch protection / required checks / ≥1 approval** trong `14 §4` · cập nhật `08 §3` (CI ✅) + `14 §2.2`.
- **Verification plan:** workflow **xanh** trên một PR thử, **gồm bước build thành công** với dữ liệu seed; log/ảnh kết quả CI. (Tooling/CI → không Build Preview.)
- **Exit Criteria:** CI xanh trên PR (đủ 6 bước, build pass); merge policy tài liệu hóa; Product approve.

### Phase cuối (không phải Phase riêng) — Quality Report
- Sau khi Phase 3 approve, tổng hợp **Quality Report** (§4) — có thể đính kèm trong báo cáo hoàn tất Phase 3 hoặc là artifact riêng, để Product đánh giá mức hardening.

---

## 4. Deliverables

- **Source/config:** `biome.json` · `astro check` setup · Vitest config + test suite (unit + contract) · `.github/workflows/ci.yml` · scripts `lint`/`format`/`format:check`/`typecheck`/`test`.
- **Documentation:** cập nhật `09-coding-standards`, `11-testing`, `14-quality-gates §4`, `08-deployment §3`.
- **ADR:** lựa chọn Biome + Vitest + astro check (lý do, chi phí, khả nghịch) — theo tiền lệ ADR stack (`F13`).
- **Test:** bộ unit + contract test (Phase 2); CI logs (Phase 3).
- **Quality Report (bắt buộc, cuối Sprint):** tối thiểu gồm — **Lint · Typecheck · Test · Build · CI · Static Gates · Known limitations** (trạng thái + kết quả từng mục; giới hạn còn lại như: không E2E, build-in-CI dùng seed tối thiểu, các mục @deploy chưa verify trên domain thật).
- **Verification report:** mỗi Phase (gate/test/CI kết quả). **Screenshot:** không áp dụng (không đổi UI) — ghi "Not affected".
- **Docker/CI:** workflow CI mới; **không** đổi image runtime web.

---

## 5. Risks

| Loại | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| **Scope** | Hardening phình sang refactor code/docs-architecture | TB | Out of Scope tường minh; phát hiện → Backlog. Fix chỉ mức lint/format tối thiểu, **không** đổi hành vi. |
| **Maintainability/diff** | Format lần đầu tạo **diff lớn toàn repo** khó review | TB | **1 commit format-only** cô lập (Product đã duyệt), tách khỏi commit logic; nêu rõ ở báo cáo Phase 1. |
| **CI build** | `astro build` cần Directus → CI phức tạp/chậm/đỏ giả | **Cao** | Tái dùng bootstrap sẵn có (compose + `schema:apply`/`permissions:apply`/`seed:dev`); **seed tối thiểu** để nhanh; cache pnpm; chờ healthcheck Directus trước build. (Build **bắt buộc** — không bỏ, theo Product.) |
| **Dependency** | Thêm dev-dep (Biome/Vitest/`@astrojs/check`) | Thấp | Chốt qua ADR; **pin version**; chỉ **devDependencies**; không ảnh hưởng runtime/image. |
| **Regression** | Config mới vô tình phá build | Thấp | Verify `astro build` xanh sau mỗi Phase; config tối thiểu, thêm dần. |
| **Test brittleness** | Contract test bám implementation → giòn | Thấp–TB | Test **hành vi/hình dạng DTO** (`03d`), dùng fixtures/mock ổn định, không bám cú pháp Directus. |
| **CI infra** | Dựng Directus+Postgres trong Actions có thể flaky (timing/health) | TB | Healthcheck + retry chờ; pin image tag; fallback Phương án B; ghi Known limitations nếu cần. |

---

## 6. Definition of Done (Sprint 7)

- **Functional completeness:** `lint` + `format:check` + `typecheck` + `test` + `build` chạy được và **xanh**; CI thực thi **đầy đủ 6 bước** (build bắt buộc) trên PR/push; merge gate định nghĩa.
- **Verification completed:** mỗi Phase có report; CI xanh trên PR thử (gồm build).
- **Documentation updated:** `09`, `11`, `14 §4`, `08 §3` phản ánh trạng thái đã hiện thực; ADR công cụ Accepted.
- **Build successful:** `pnpm --dir apps/web build` xanh cục bộ **và** trong CI (với seed tối thiểu).
- **Regression completed:** Regression Checklist mỗi Phase (Build ✅; Reader UI / Category / Pagination / SEO render / CMS = *Not affected*).
- **Quality Report** hoàn tất (Lint/Typecheck/Test/Build/CI/Static Gates/Known limitations) & gửi Product.
- **Product review passed:** Phase 1–3 approve; **không** phát sinh thay đổi permission/data model/DTO/behavior.

---

## 7. Dependencies

- **Product:** xác nhận **bản Planning cuối** này trước Phase 1 (các quyết định §Product Decisions đã chốt).
- **Kỹ thuật:** cài **devDependencies** mới (network cho `pnpm install`); Node 22 + pnpm 10.33.2 (đã pin). `apps/web/pnpm-lock.yaml` sẽ đổi (thêm dev-dep) — ngoài workspace (đã biết từ S6.5).
- **CI:** GitHub Actions khả dụng (remote `main` là GitHub); Actions chạy Docker (dựng Directus+Postgres cho build). *(Repo hiện có `.github/` untracked — Phase 3 đưa workflow vào version control có chủ đích.)*
- **Không** phụ thuộc domain thật (các mục @deploy = Out of Scope).

---

## 8. Definition of Ready (đã thỏa cho Phase 1)

- [x] Goal + scope rõ, verification & exit criteria mỗi Phase xác định (§3).
- [x] Phụ thuộc xác định, không bị chặn (§7).
- [x] Đủ nhỏ để hoàn thành trong sprint (3 Phase gọn).
- [x] Không ảnh hưởng UX/Reader (hardening) → không cần quyết định thiết kế.
- [x] Product đã chốt tooling + phạm vi CI (§Product Decisions).

---

## 9. Deferred Backlog (chuyển ra khỏi Sprint 7 theo Product)

- **Reliability sâu:** test độ bền thin client (Directus down / payload lệch) · build-time contract assertion.
- **Specialized test tier:** **axe** a11y tự động · **link-check** trên `dist/` · **Lighthouse/perf budget** · **E2E (Playwright)**.
- **Deploy hardening (@deploy):** 2FA admin · ACME/DNS · health check/uptime · script **post-deploy smoke** (verify trên domain thật).
- **Reader features:** Category discoverability (bản 1) · Search · RSS · Tags · Archive · Author pages.
- **Docs-architecture refactor:** F1–F15 (Architecture Review 2026-07-21).

---

> 🛑 **Dừng — chờ Product xác nhận bản Planning cuối này.** Không bắt đầu Phase 1, không thay đổi code cho tới khi Product xác nhận.
