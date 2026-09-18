# Cleanie V1

Cleanie gives a cleaning business one polished, mobile-first booking page at `/{partnerSlug}`. Partners choose one of three focused templates, customize only meaningful conversion details, publish the same URL, and receive bookings without a separate deployment per partner.

## Architecture

- Next.js App Router provides the landing page, public partner pages, partner dashboard/editor, and minimal admin UI.
- FastAPI owns authentication, validation, authorization, tenant-scoped business writes, public renderer data, publishing, availability, and booking conflict prevention.
- SQLAlchemy 2 models work with PostgreSQL/Neon in hosted environments; local development is zero-config SQLite.
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

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# terminal one — FastAPI starts with SQLite and seeds the demos
.venv/bin/uvicorn backend.main:app --reload --port 8000

# terminal two — Next proxies /api/v1 to the local FastAPI server
npm run dev
```

Open `http://localhost:3000/jessica`. Use the demo partner account in the login form:

```text
jessica@example.com
cleanie-demo
```

The Jessica demo user is also the seeded local admin.

## Database and deployment

Copy `.env.example` to `.env.local` and set production values. `DATABASE_URL` should be a Neon/PostgreSQL SQLAlchemy URL, `AUTH_SECRET` must be a strong unique secret, `NEXT_PUBLIC_APP_URL` should be the deployed root URL, and `BLOB_READ_WRITE_TOKEN` is required for Blob uploads.

Run migrations against the target database before serving production traffic:

```bash
DATABASE_URL='postgresql+psycopg://…' .venv/bin/alembic upgrade head
```

`vercel.json` keeps the frontend and FastAPI app in one Vercel project by routing `/api/v1/*` to `api/index.py`. On Vercel, connect a public Blob store to the project and make the required environment variables available to Preview and Production. Do not run local SQLite auto-creation in PostgreSQL; apply Alembic migrations instead.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
.venv/bin/pytest -q
```

The API tests cover public publish visibility, reserved slugs, partner tenant isolation, and a repeated booking conflict.

## V1 boundaries

This is intentionally not a generic page builder or workforce-management system. Partner customization is constrained to identity, one template, controlled theme tokens, proof, services, reviews, visibility, and simple availability. Payments default to `none`; the database supports future payment modes without presenting fake checkout behavior.
