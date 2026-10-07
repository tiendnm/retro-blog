# Copilot Instructions — Retro Blog

Headless blog: **Astro 5.x** (SSG, static site) + **Directus 11.3.5** (headless CMS) + **PostgreSQL 16.8**, packaged entirely in **Docker Compose**. Architecture uses a Ports & Adapters (Hexagonal) model; the `docs/` folder is the tech-neutral "core" (stable contracts), and the concrete tools are swappable adapters.

---

## Running the stack

The full stack runs in Docker. Node on the host is optional (only needed for the `pnpm ...` helper scripts).

```bash
# Start everything
docker compose up -d        # or: pnpm start

# Watch logs
docker compose logs -f      # or: pnpm logs

# Tear down (keeps volumes/data)
docker compose down         # or: pnpm down
```

Services once healthy:
- Astro site → http://localhost:4321
- Directus admin → http://localhost:8055/admin  (credentials from `.env`)

### First-time setup (fresh volume)

```bash
cp .env.example .env        # fill in secrets; generate KEY/SECRET with: openssl rand -hex 32
docker compose up -d
pnpm schema:apply           # apply content model snapshot (idempotent)
pnpm permissions:apply      # configure Public/Editor roles & permissions (idempotent)
pnpm seed:dev               # (optional) seed 1 author, 2 categories, 3 posts + 1 draft (idempotent)
```

### Fixture data (dev-only, larger datasets)

```bash
pnpm fixtures:load -- --profile large   # ~100 posts; profiles: small/medium/large/stress
pnpm fixtures:load -- --set edge        # 10 edge-case posts
pnpm fixtures:reset -- --set edge       # remove only fixture slugs (safe for other content)
```

### Production deploy

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
pnpm rebuild:flow           # create Directus Flow for rebuild-on-publish
pnpm backup                 # backup db + uploads + config
pnpm restore <dir>          # restore from a backup
```

---

## Architecture

```
[Caddy / Edge]
      │
      ▼
[Astro (web)]  ←─── build-time SSG fetch ───→  [Directus (CMS)]
                                                        │
                                                 [PostgreSQL (DB)]
```

- **Astro** renders statically at build time by fetching from Directus via the API contract. In dev (`astro dev`), it renders on-demand.
- **Directus** serves content via its REST API. Schema is version-controlled as `services/directus/snapshots/schema.yaml`.
- **PostgreSQL** is not exposed to the host — only reachable by Directus within the `retro-net` Docker network.
- **Caddy** handles TLS and routing in production (`docker-compose.prod.yml`).

Architecture details: [`docs/03-architecture.md`](../docs/03-architecture.md). Contracts: [`docs/03d-api-contract.md`](../docs/03d-api-contract.md).

---

## Key conventions

### Thin client — never call Directus directly from pages/components

All Directus access goes through `apps/web/src/lib/directus.ts`. Pages and components import only the typed functions from that module and receive DTOs from `apps/web/src/lib/types.ts`. **No page or component may call Directus or parse raw Directus JSON directly.**

```ts
// ✅ correct
import { listPublishedPosts } from '../lib/directus';
const { items, pageInfo } = await listPublishedPosts({ page: 1 });

// ❌ wrong — don't fetch Directus directly in a page
const res = await fetch('http://directus:8055/items/posts');
```

### Two Directus URL env vars

| Variable | Used where | Value in docker |
|---|---|---|
| `DIRECTUS_INTERNAL_URL` | Server-side fetch in `directus.ts` | `http://directus:8055` |
| `PUBLIC_DIRECTUS_URL` | Asset URLs embedded in rendered HTML | `http://localhost:8055` |

Never expose `DIRECTUS_INTERNAL_URL` to the browser. Asset URLs (images) must use `PUBLIC_DIRECTUS_URL` so browsers can load them.

### Public role — no auth token

Fetches in `directus.ts` send **no token**. Directus's Public role permission is the sole access control — it automatically filters to published posts only, and blocks any field not in the allowlist. The field lists in `SUMMARY_FIELDS` / `DETAIL_FIELDS` constants must be a subset of the Public allowlist.

### DTO types must mirror the API contract

`apps/web/src/lib/types.ts` defines the DTO interfaces. These must stay aligned with [`docs/03d-api-contract.md §3`](../docs/03d-api-contract.md). Mapping from raw Directus shapes to DTOs happens only inside `directus.ts`'s `toSummary()` / `toDetail()` / `toMedia()` helpers — never elsewhere.

### Content model changes

Schema changes must be captured in `services/directus/snapshots/schema.yaml` (apply with `pnpm schema:apply`). Permission changes go in `services/directus/apply-permissions.sh` (apply with `pnpm permissions:apply`). Both are idempotent.

### Windows/Linux node_modules isolation

The `web_node_modules` Docker volume keeps the container's Linux `node_modules` separate from the Windows host. Do **not** run `pnpm install` on the host for `apps/web` — let the container manage it.

### Astro SSG + `getStaticPaths`

Dynamic routes (`/posts/[slug]`, `/category/[slug]`, `/page/[page]`) use `getStaticPaths` backed by `getAllPublishedPostSlugs()` / `getAllCategorySlugs()` from the thin client. No adapter is needed (`output: 'static'`).

### Pagination defaults

Default page size: **10**. Maximum: **50**. Metadata returned: `{ total, page, pageSize, hasMore }`. Reference: `docs/03d-api-contract.md §4`.

### Commit & branch conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Branches:** `type/short-description` (e.g., `feat/post-list`, `fix/pagination-edge`)

### Documentation conventions

Docs live in `docs/` (one file per concern). Each doc starts with a header block: `Trạng thái / Owner / Cập nhật lần cuối / Người duyệt / Mục đích / Liên quan`. Update `Cập nhật lần cuối` on every edit. Language: Vietnamese prose, English technical terms left as-is. New docs → add entry to `docs/README.md` table.

ADRs live in `docs/adr/`; copy `docs/adr/0000-adr-template.md`, increment the number, open a PR.

---

## Project layout (key paths)

| Path | Purpose |
|---|---|
| `apps/web/src/lib/directus.ts` | Thin client — sole Directus access point |
| `apps/web/src/lib/types.ts` | DTO interfaces (API contract types) |
| `apps/web/src/pages/` | Astro pages (index, posts, category, page, sitemap, robots) |
| `apps/web/src/components/` | Astro components |
| `apps/web/src/layouts/` | Astro layout wrappers |
| `services/directus/snapshots/schema.yaml` | Version-controlled Directus schema |
| `services/directus/apply-permissions.sh` | Roles/Policies/Permissions setup script |
| `services/directus/seed/seed-dev.mjs` | Dev seed data |
| `services/directus/fixtures/` | Fixture framework (deterministic, reset-by-slug) |
| `services/ops/` | Backup/restore scripts |
| `services/rebuild/` | Rebuild-on-publish script |
| `docs/` | Architecture docs (source of truth for contracts) |
| `docs/adr/` | Architecture Decision Records |

---

## Environment variables

Copy `.env.example` → `.env`. Never commit `.env`. Generate `KEY` and `SECRET` with `openssl rand -hex 32`. See `.env.example` for all required variables; `.env.production.example` for production overrides.
