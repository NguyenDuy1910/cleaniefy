# Cleandly Vercel-native audit

This audit was completed before the runtime migration. It describes the
repository as found on `refactor/vercel-native`.

## A. Current architecture

| Area | Current implementation |
| --- | --- |
| Framework | Next.js 15.1, React 19, TypeScript 5.7, App Router, Bun |
| Frontend | `frontend/` contains routes, client-heavy dashboard/editor UI, template renderer, and a generic API client |
| Backend | `backend/` is a FastAPI application running independently as a Vercel Service |
| Data flow | Server-rendered public pages and browser UI call `frontend/lib/api/client.ts`; Next either calls the private FastAPI service directly or proxies `/api/v1/*` to it |
| Database | SQLAlchemy 2 over Neon PostgreSQL in hosted environments, with SQLite-only local demo fallback; Alembic owns the initial schema |
| Auth | FastAPI signs 30-day HS256 JWTs; the frontend places bearer tokens in `localStorage` |
| Blob | FastAPI validates uploads then calls the Python Blob SDK; private blobs are served through a FastAPI proxy |
| Validation | Pydantic schemas duplicate TypeScript request and response types |
| Templates | One normalized `PublicSite` renderer and ten persisted template keys; theme presets are duplicated between Python and TypeScript |
| Tests | Python API tests cover public visibility, tenant scope, booking conflict, private media, publish readiness, and template persistence; frontend has Vitest configured but no tests |
| Deployment | `vercel.json` declares two Vercel Services and injects `BACKEND_INTERNAL_URL` into the frontend |

### FastAPI responsibility and endpoint map

| Current endpoint group | Responsibility | Caller |
| --- | --- | --- |
| `auth/signup`, `auth/login` | account creation, password verification, bearer token issuance | auth form |
| `partners/me` and nested routes | partner overview, profile, theme, sections, services, portfolio, reviews, availability, booking settings, publishing, bookings, uploads | dashboard and editor |
| `partners/slug-availability` | public slug validation | API consumer; no active editor caller |
| `public/partners/:slug` | public site aggregate | public server page |
| `public/partners/:slug/availability` | available booking slots | booking browser UI |
| `public/partners/:slug/bookings` | public, transactional booking creation | booking browser UI |
| `media/:pathname` | private Blob streaming | public and dashboard images |
| `admin/*` | partner and booking operational views | admin UI |

## B. Problems found

- Every internal read and write crosses a Next-to-FastAPI HTTP boundary, including the public server page.
- Auth requires a browser-only bearer token, making authenticated Server Components and Server Actions impractical.
- Pydantic and TypeScript duplicate validation, template keys, theme defaults, and response models.
- One 355-line FastAPI router mixes transport, authorization, validation, domain rules, Blob access, and persistence.
- The frontend API client combines actual public APIs with internal dashboard calls and direct server-to-server fetches.
- Business read models are assembled in FastAPI instead of reusable feature queries; templates are fortunately already DB-independent.
- `vercel.json`, Make targets, README, and environment examples encode a two-runtime deployment.

## C. Target architecture

The Next.js application lives at the repository root with source in `src/`, so
the Vercel project needs no Root Directory override. The repository becomes one
Vercel project with one Next.js service.

```text
src/
├── app/
│   ├── (marketing)/, (auth)/, dashboard/, admin/, [partnerSlug]/
│   └── api/public/[partnerSlug]/{availability,bookings}/route.ts
├── components/{ui,partner,booking,public-site}/
├── db/{schema,migrations,index.ts}        # Drizzle mapping and baseline
├── features/{auth,partner,services,portfolio,reviews,booking,publishing,admin}/
├── lib/{auth,blob,errors,validation,config,utils}/
└── templates/{clean,warm-home,pro}/
```

The adapter boundary is:

```text
Server Component / Server Action / Route Handler
  -> feature service
  -> feature query
  -> Drizzle / Blob helper
```

## D. Migration map

| Current | Responsibility | Target | Migration |
| --- | --- | --- | --- |
| FastAPI auth routes | signup/login and session creation | `features/auth/actions.ts` + httpOnly cookie session | migrate |
| SQLAlchemy models | existing persistence contract | `db/schema/*` Drizzle definitions | migrate without column renames |
| Pydantic schemas | input validation | feature-local Zod schemas | migrate |
| `GET /partners/me` | private dashboard aggregate | server component + `features/partner/queries.ts` | migrate |
| partner/editor write endpoints | partner-owned mutations | feature Server Actions | migrate |
| `GET /public/partners/:slug` | public aggregate | public server component + `getPublicPartnerSite` | migrate |
| availability/booking endpoints | browser/public HTTP boundary | focused Next Route Handlers | retain as HTTP |
| FastAPI media upload/proxy | Blob authorization and streaming | `lib/blob`, upload and media Route Handlers | migrate |
| FastAPI admin endpoints | authenticated read models | admin Server Component query | migrate |
| frontend API proxy/client | internal network transport | direct actions/queries; small public booking client only | remove/replace |
| Alembic initial migration | deployed schema baseline | Drizzle schema mapping and documented baseline | retain data compatibility; remove Python runtime |

## Compatibility decisions

- Existing table and column names, JSON shapes, string UUIDs, and unique booking-slot constraint remain unchanged.
- Existing `scrypt$...` password hashes are verified by the TypeScript auth service, so account credentials do not need a data migration.
- Existing private Blob URLs beginning with `/api/v1/media/` are normalized at read time to the new `/api/media/` route.
- The one-time auth transport change moves sessions from local storage to secure httpOnly cookies. Existing users sign in once after the deploy; no account data changes.
- The pre-existing uncommitted product changes are preserved semantically in the Vercel-native implementation; unrelated editor settings are not modified.
