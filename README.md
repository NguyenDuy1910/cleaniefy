# Cleanie

Cleanie gives each cleaning business one focused booking page at
`/{partnerSlug}`. Partners choose a template, add proof and services, set
availability, then publish the same link they share with customers.

## Architecture

This is one Vercel-native Next.js application at the repository root, with all
application code in `src/`:

```text
Server Components / Server Actions / Route Handlers
                     ↓
              feature services
                     ↓
            Drizzle + Neon Postgres
                     ↓
                Vercel Blob
```

- Server Components load the public partner page, dashboard, bookings, and
  admin views directly through feature queries.
- Server Actions own authenticated partner mutations. Session cookies are
  httpOnly; no bearer token is stored in local storage.
- Route Handlers remain only for public availability/booking, Blob client
  upload tokens, and streamed private media.
- Feature code lives in `src/features`; Drizzle schema mappings live in
  `src/db/schema`; Blob access is centralized in `src/lib/blob`.
- The current ten product templates remain supported. They share normalized
  site data and controlled theme settings rather than separate backends.

`docs/vercel-native-audit.md` contains the pre-migration audit, endpoint map,
target layout, and data-compatibility decisions.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Cleanie landing page |
| `/:partnerSlug` | Published partner booking page |
| `/login`, `/signup` | Partner account entry |
| `/dashboard` | Partner overview and template gallery |
| `/dashboard/page` | Page editor |
| `/dashboard/bookings` | Partner bookings |
| `/admin` | Admin operations view |
| `/api/public/:partnerSlug/availability` | Public availability boundary |
| `/api/public/:partnerSlug/bookings` | Public transactional booking boundary |

## Local development

Install the frontend workspace, configure Neon and Blob values, then start
Next.js:

```bash
cp .env.example .env.local
make install
make dev
```

Use a Neon development database. For a new database, apply the Drizzle
baseline and add the demo data:

```bash
make migrate DATABASE_URL='postgresql://…'
make seed DATABASE_URL='postgresql://…'
```

The seeded accounts use `cleanie-demo`; `jessica@example.com` is the demo
admin. The seed is idempotent and provides the ten template examples used by
the landing and dashboard flows.

### Existing database migration

The Drizzle definitions retain the original FastAPI/Alembic table and column
contract. Do not run the initial Drizzle baseline against an existing Cleanie
database—there is no required DDL change for this runtime migration. See
[src/db/migrations/README.md](src/db/migrations/README.md) for the baseline
procedure before generating future schema deltas.

## Environment variables

Set these in the one Vercel project and in `.env.local` for local
work:

```text
DATABASE_URL=postgresql://…
AUTH_SECRET=<long random secret>
BLOB_STORE_ID=store_<connected-blob-store>
BLOB_READ_WRITE_TOKEN=<server-only token for client upload tokens>
NEXT_PUBLIC_APP_URL=https://cleandly.com
```

When deployed on Vercel, the Blob SDK prefers its automatically injected OIDC
credentials for server reads. The read/write token remains necessary for the
browser upload-token exchange and must never be exposed with a `NEXT_PUBLIC_`
prefix. Partner media is stored in a private Blob store, then delivered by a
same-origin route only to its owner or from a published partner page.

## Database and quality commands

```bash
make check       # typecheck, lint, and Vitest
make build       # optimized Next.js build
make migrate DATABASE_URL='postgresql://…'
make seed DATABASE_URL='postgresql://…'
```

## Vercel deployment

Import this repository as one Vercel project with no **Root Directory**
override. Connect the project's Neon database and private Blob store, add
the environment variables above to Preview and Production, and deploy the
`refactor/vercel-native` branch for a Preview before merging. No `vercel.json`,
backend service binding, Python runtime, or separate deployment is required.

The public page cache is revalidated centrally after partner profile, theme,
content, service, portfolio, review, booking-setting, and publishing changes.
