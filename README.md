# Cleanie V1

Cleanie gives a cleaning business one polished, mobile-first booking page at `/{partnerSlug}`. Partners choose one of three focused templates, customize only meaningful conversion details, publish the same URL, and receive bookings without a separate deployment per partner.

## Services architecture

- This repository uses [Vercel Services](https://vercel.com/blog/vercel-services-run-full-stack-on-vercel): `frontend/` is the Next.js service and `backend/` is the FastAPI service. They build, preview, deploy, and roll back atomically in one Vercel project.
- The FastAPI service has no public Vercel route. `vercel.json` injects its private `BACKEND_INTERNAL_URL` binding into the frontend, so server-rendered Next.js pages call it over Vercel’s internal network.
- `frontend/app/api/v1/[...path]/route.ts` is the narrow same-origin proxy used by browser interactions. It passes requests to the private backend without a public backend URL, reverse proxy, or CORS dependency.
- Next.js App Router provides the landing page, public partner pages, partner dashboard/editor, and minimal admin UI.
- FastAPI owns authentication, validation, authorization, tenant-scoped business writes, public renderer data, publishing, availability, and booking conflict prevention.
- SQLAlchemy 2 uses Neon PostgreSQL in hosted environments; local development is zero-config SQLite.
- Alembic owns the hosted database schema. The initial migration is at `alembic/versions/20260918_0001_initial_schema.py`.
- Vercel Blob stores partner media in production. FastAPI validates the authenticated owner, file type, and 4 MB size limit before writing Blob metadata URLs into PostgreSQL.

The public API returns one normalized renderer payload, so a customer page does not waterfall through separate calls for its partner, theme, services, reviews, and booking settings.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Cleanie landing page |
| `/jessica`, `/warm-demo`, `/sparkle` | Seeded Clean, Warm Home, and Pro public pages |
| `/login`, `/signup` | Partner account entry |
| `/dashboard` | Partner overview and template gallery |
| `/dashboard/editor` | Brand, theme, content, service, gallery, review, and booking editor |
| `/dashboard/bookings` | Partner booking daily view |
| `/admin` | Minimal partner and booking operations view (admin accounts only) |

The full FastAPI surface is prefixed with `/api/v1`. Important endpoints include:

- `POST /auth/signup`, `POST /auth/login`
- `GET/PATCH /partners/me`, `GET /partners/slug-availability`
- `/partners/me/{theme,sections,services,portfolio,reviews,availability,booking-config,media,publish,bookings}`
- `GET /public/partners/{slug}` and `/availability`
- `POST /public/partners/{slug}/bookings`

## Local development

The root Makefile is the quickest way to work across both services:

```bash
make install  # bun install + uv sync
make dev      # FastAPI on :8000 and Next.js on :3000
```

Use `make check` for type checking, linting, and tests; `make build` for the production frontend build; and `make all` to install, verify, and build the whole project.

The equivalent explicit commands are:

```bash
(cd frontend && bun install)
(cd backend && uv sync)

# terminal one — FastAPI starts with SQLite and seeds the demos
(cd backend && uv run uvicorn main:app --reload --port 8000)

# terminal two — Next proxies browser requests and calls FastAPI directly for SSR
(cd frontend && BACKEND_INTERNAL_URL=http://127.0.0.1:8000 bun run dev)
```

Open `http://localhost:3000/jessica`. Use the demo partner account in the login form:

```text
jessica@example.com
cleanie-demo
```

The Jessica demo user is also the seeded local admin.

### Template end-to-end flow

Local startup seeds 10 published pages—one for each selectable template—so every public composition is backed by the same FastAPI payload used in production. Open `/jessica`, `/warm-demo`, `/sparkle`, `/fresh-start`, `/signature-clean`, `/green-room`, `/move-ready`, `/bright-home`, `/studio-luxe`, or `/neighborly` to inspect them. All demo accounts use `cleanie-demo` as their password.

To exercise the owner flow end to end, log in as one of those demo users, choose a card in **Dashboard → Overview** (or **Page → Theme**), and open that partner’s live URL. The dashboard sends the selection to `PUT /api/v1/partners/me/theme`; FastAPI persists the template and preset theme; the public Next.js page then renders the same saved services, gallery, reviews, availability, and booking flow in the selected composition.

For a production-shaped local process that starts both services and supplies bindings, use `npx vercel dev` after linking the one Vercel project.

## Neon, Blob, and deployment

Use the service-scoped examples: `backend/.env.example` contains database, auth, and Blob configuration; `frontend/.env.example` contains only local development defaults. The backend reads Vercel's Neon `DATABASE_URL` (or `NEON_DATABASE_URL` when the integration was installed with a `NEON_` prefix), and local development falls back to SQLite only when neither is set.

Connect Neon and Vercel Blob to the Vercel project, then expose these values to the **backend** service in Preview and Production:

```text
DATABASE_URL=postgresql://…                # supplied by the Neon integration
AUTH_SECRET=<long, unique random secret>
BLOB_STORE_ID=<the Blob store URL subdomain>
BLOB_READ_WRITE_TOKEN=<Vercel Blob read/write token>
```

The FastAPI upload route passes `BLOB_READ_WRITE_TOKEN` directly to the Blob SDK and verifies that the returned public URL belongs to `BLOB_STORE_ID`. This prevents a token for the wrong store from silently writing partner media elsewhere. Keep both values server-only; the frontend never receives the token. Vercel's Blob SDK requires the read/write token, and Vercel documents Blob URLs as including the store ID. [Blob SDK reference](https://vercel.com/docs/vercel-blob/using-blob-sdk) and [Blob security reference](https://vercel.com/docs/vercel-blob/security).

Vercel's Neon integration injects its database credentials into the project. If you install it with `vercel integration add neon --prefix NEON_`, the backend accepts the resulting `NEON_DATABASE_URL`; otherwise use the default `DATABASE_URL`. [Neon integration guide](https://vercel.com/marketplace/neon/neon).

Vercel injects `BACKEND_INTERNAL_URL` into the frontend through the service binding, so it should not be set to a public production endpoint.

Run migrations against the target database before serving production traffic:

```bash
make migrate NEON_DATABASE_URL='postgresql+psycopg://…'
```

`vercel.json` declares both service roots explicitly, binds `backend` to `frontend`, and routes public traffic only to `frontend`. On Vercel, connect a public Blob store to the project and make backend environment variables available to Preview and Production. Do not run local SQLite auto-creation in PostgreSQL; apply Alembic migrations instead.

## Checks

```bash
make check
make build
```

The API tests cover public publish visibility, reserved slugs, partner tenant isolation, and a repeated booking conflict.

## V1 boundaries

This is intentionally not a generic page builder or workforce-management system. Partner customization is constrained to identity, one template, controlled theme tokens, proof, services, reviews, visibility, and simple availability. Payments default to `none`; the database supports future payment modes without presenting fake checkout behavior.
