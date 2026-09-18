# Cleanie V1 — Full Product Implementation & Vercel Deployment

You are working directly inside **my existing Cleanie repository**.

Your task is to inspect the current codebase, create a detailed implementation plan, then implement the complete Cleanie V1 flow from the supplied Figma design.

The primary engineering goals are:

**simple architecture, clean code, strong reuse, fast Vercel deployment, low operational cost, and complete end-to-end product flow.**

Do not overengineer.

Do not build hypothetical infrastructure for future scale.

Traffic is expected to be relatively low initially. Product quality and development speed matter more than premature scalability.

---

# 1. Product Definition

Cleanie is a vertical SaaS product for cleaning-service businesses.
Main domain using: cleandly.com
The core idea is:

> A cleaner or cleaning company can create a professional branded service page in a few minutes, share one Cleanie URL with customers, and receive cleaning bookings.

Think conceptually:

**Linktree-style ease of setup + cleaning-service-specific conversion + booking.**

The product is NOT:

* Wix
* Shopify
* Jobber
* a general CMS
* a generic website builder
* a workforce management platform

The core V1 loop is:

```text
Partner joins Cleanie
        ↓
Chooses a template
        ↓
Adds business identity
        ↓
Customizes brand/theme
        ↓
Adds cleaning services
        ↓
Adds before/after proof
        ↓
Adds reviews/trust
        ↓
Configures booking
        ↓
Publishes
        ↓
Gets:

cleanie.app/jessica
        ↓
Shares the link
        ↓
Customer opens page
        ↓
Trusts the cleaner
        ↓
Chooses service
        ↓
Chooses time
        ↓
Books
```

Optimize primarily for:

```text
Time to first published page
```

Target UX:

```text
Sign up → published partner page in < 5 minutes
```

---

# 2. Source of Truth

## Figma

Primary product/UI reference:

https://www.figma.com/design/gYnw9TXT9QUE8OE4UrrGjV/unclutter-OC?node-id=86-2&t=l2fUQYkzhbhhmZfn-0

Inspect the entire board before implementing.

Important nodes:

| Node   | Purpose                       |
| ------ | ----------------------------- |
| `86:2` | Main Cleanie V1 product board |
| `90:4` | Partner Overview              |
| `90:5` | Main Customize Editor         |
| `90:6` | Clean template                |
| `90:7` | Warm Home template            |
| `90:8` | Pro template                  |
| `90:9` | Customization scope           |
| `97:2` | Content & Trust Editor        |
| `97:3` | Booking Settings Editor       |

Do not implement isolated screenshots.

Understand the complete product flow first.

Figma defines:

```text
visual hierarchy
interaction intent
template differences
customization boundaries
partner flow
customer conversion flow
```

The existing repository defines:

```text
technical conventions
folder structure
framework conventions
auth conventions
existing reusable components
```

Respect both.

---

# 3. Template Inspiration

The product concept takes inspiration from:

https://linktr.ee/s/templates

Use Linktree only as conceptual inspiration for:

```text
template selection
fast setup
theme customization
live preview
one public shareable link
```

Do NOT copy Linktree's implementation or create a generic block builder.

Cleanie templates must remain cleaning-specific.

---

# 4. Existing Repository First

Before editing code, inspect the complete repository.

Determine:

```text
framework versions
Next.js architecture
App Router vs Pages Router
TypeScript configuration
Python setup
package manager
CSS / Tailwind configuration
component library
authentication
database
existing APIs
validation libraries
testing setup
environment configuration
Vercel configuration
current deployment assumptions
```

Search for reusable code before creating anything new.

Do not duplicate:

```text
buttons
forms
modals
API clients
auth utilities
database abstractions
upload components
date utilities
layout components
```

Do not replace working architecture simply because another library is preferred.

Before implementation, produce a concise repo audit and proposed changes.

---

# 5. Required Architecture

The target V1 architecture is:

```text
                ONE EXISTING REPOSITORY
                         │
                         ▼
                       VERCEL
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
          Next.js                  FastAPI
             │                       │
             │                  SQLAlchemy 2
             │                       │
             │                       ▼
             │                Neon PostgreSQL
             │
             └────────── Vercel Blob
```

Responsibilities:

```text
Next.js
=
UI
routing
partner dashboard
admin UI
template rendering
live preview
public partner website
booking UI
```

```text
FastAPI
=
API
business rules
validation
authorization
tenant isolation
database access
booking logic
publish logic
media metadata
```

---

# 6. Deployment Constraint

Everything must remain:

```text
ONE repository
ONE Vercel project
ONE PostgreSQL database
ONE root domain
```

Do NOT create:

```text
separate frontend repo
separate backend repo
separate Vercel project per service
separate Vercel project per partner
database per partner
Git branch per partner
generated codebase per partner
```

A partner page is dynamically rendered from database configuration.

---

# 7. Backend Must Use FastAPI

Backend stack:

```text
Python
FastAPI
Pydantic
SQLAlchemy 2
Alembic
PostgreSQL
```

FastAPI must remain stateless and suitable for Vercel's execution model.

Do not depend on:

```text
persistent local filesystem
permanent worker process
in-memory queue
long-lived mutable process state
```

Use managed state:

```text
PostgreSQL
Vercel Blob
```

---

# 8. Frontend Stack

Prefer the current repository stack where possible.

For new implementation:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui if already present or useful
lucide-react
```

Do not install an alternative UI framework when existing components are sufficient.

---

# 9. Suggested Repository Shape

Adapt to the current repository.

Do not force this structure if equivalent architecture already exists.

Conceptually:

```text
project/

├── app/
│   ├── dashboard/
│   ├── admin/
│   ├── templates/
│   ├── [partnerSlug]/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── partner/
│   ├── templates/
│   ├── booking/
│   └── public-site/
│
├── features/
│   ├── partner/
│   ├── services/
│   ├── booking/
│   └── portfolio/
│
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils/
│
├── api/
│   └── index.py
│
├── backend/
│   ├── api/
│   ├── schemas/
│   ├── models/
│   ├── services/
│   ├── repositories/
│   ├── db/
│   └── core/
│
├── alembic/
│
└── public/
```

Prefer domain organization over infrastructure-oriented naming.

---

# 10. FastAPI API Structure

Keep the REST API small and product-oriented.

Conceptual API:

```text
/api/v1/partners/me

/api/v1/partners/me/site
/api/v1/partners/me/theme
/api/v1/partners/me/sections

/api/v1/partners/me/services

/api/v1/partners/me/portfolio

/api/v1/partners/me/reviews

/api/v1/partners/me/availability

/api/v1/partners/me/booking-config

/api/v1/partners/me/publish

/api/v1/partners/slug-availability

/api/v1/public/partners/{slug}

/api/v1/public/partners/{slug}/availability

/api/v1/public/partners/{slug}/bookings
```

Do not create an endpoint for every database table unless the actual product flow needs it.

---

# 11. FastAPI Code Organization

Prefer:

```text
backend/

api/
schemas/
services/
db/
core/
```

But do not mechanically create:

```text
Controller
Interface
Service
Repository
Implementation
Mapper
DTO
```

for every trivial CRUD function.

Use abstraction only where it provides value.

Good service boundaries:

```text
partner_site
booking
media
publishing
```

Avoid abstractions like:

```text
ColorService
ButtonService
PageTitleService
```

---

# 12. Database Ownership

Once FastAPI is the backend:

```text
Next.js
    ↓
FastAPI
    ↓
PostgreSQL
```

Do not let React components or random Next.js utilities query PostgreSQL directly.

All business writes must go through FastAPI.

Avoid duplicated business logic between FastAPI and Next.js.

---

# 13. Database

Preferred managed database:

```text
Neon PostgreSQL
```

ideally provisioned/integrated through Vercel.

Reuse existing PostgreSQL if the repository already has one.

Expected:

```text
DATABASE_URL
```

Use SQLAlchemy 2.

Use Alembic migrations.

Database operations must always be tenant-safe.

---

# 14. Core Data Model

Start simple.

Conceptual schema:

```text
users

partners

partner_site_config

services

portfolio_items

reviews

availability_rules

booking_config

bookings
```

Example:

```text
partners
----------------------------
id
owner_user_id
business_name
slug
tagline
service_area
profile_image_url
status
published_at
created_at
updated_at
```

Site config:

```text
partner_site_config
----------------------------
partner_id
template
theme_config JSONB
sections_config JSONB
updated_at
```

Use relational tables for business entities.

Use JSONB for lightweight UI/theme configuration where appropriate.

Do not over-normalize theme configuration.

---

# 15. Partner URL — V1 Decision

Do NOT use partner subdomains for V1.

The partner URL format is:

```text
https://cleanie.app/{partnerSlug}
```

Examples:

```text
cleanie.app/jessica

cleanie.app/jessica-cleaning

cleanie.app/sparkle-austin
```

This is an intentional architecture simplification.

Do NOT implement:

```text
*.cleanie.app
wildcard DNS
hostname middleware
subdomain parsing
custom hostname verification
wildcard SSL
```

for V1.

---

# 16. Partner Chooses URL

During setup, partner chooses their public handle.

UI:

```text
Your Cleanie link

cleanie.app/
[ jessica-cleaning ]

✓ Available
```

Generate an initial suggestion from the business name.

Example:

```text
Jessica's Home Care

→

jessicas-home-care
```

Partner may modify it.

---

# 17. Slug Rules

Use a centralized authoritative backend validator.

Recommended:

```text
lowercase

a-z

0-9

hyphen

3–40 characters
```

Reject:

```text
spaces
underscores
special characters
leading hyphen
trailing hyphen
```

FastAPI is authoritative.

Database must also guarantee uniqueness.

---

# 18. Reserved Slugs

Because public pages are:

```text
/{partnerSlug}
```

reserve application routes.

Examples:

```text
admin
api
dashboard
login
logout
signup
register
pricing
features
templates
settings
bookings
about
support
help
privacy
terms
assets
static
robots
sitemap
favicon
```

Keep this centralized.

Example:

```python
RESERVED_PARTNER_SLUGS
```

---

# 19. Slug Availability API

Provide:

```text
GET /api/v1/partners/slug-availability?slug=jessica
```

Response:

```json
{
  "slug": "jessica",
  "available": true
}
```

This endpoint improves UX.

Final create/update must still perform a transactional uniqueness check.

---

# 20. Public Routing

Next.js:

```text
app/
  [partnerSlug]/
    page.tsx
```

Request:

```text
GET cleanie.app/jessica
```

Flow:

```text
partnerSlug = jessica
        ↓
Next.js
        ↓
GET /api/v1/public/partners/jessica
        ↓
FastAPI
        ↓
PostgreSQL
        ↓
normalized site response
        ↓
SiteRenderer
        ↓
Clean / Warm Home / Pro
```

Static Cleanie routes must take precedence normally:

```text
/dashboard
/admin
/templates
/pricing
/login
```

---

# 21. Public Site API Contract

Avoid many waterfall API requests.

Prefer one normalized public endpoint:

```text
GET /api/v1/public/partners/{slug}
```

Concept:

```json
{
  "partner": {
    "name": "Jessica's Home Care",
    "slug": "jessica",
    "tagline": "Thoughtful cleaning for busy families",
    "serviceArea": "Austin",
    "profileImageUrl": "..."
  },

  "site": {
    "template": "clean",

    "theme": {
      "primaryColor": "#26573D",
      "backgroundTone": "light",
      "fontPreset": "modern",
      "buttonStyle": "soft"
    },

    "sections": {
      "services": true,
      "portfolio": true,
      "reviews": true,
      "about": true
    }
  },

  "services": [],

  "portfolio": [],

  "reviews": [],

  "booking": {}
}
```

Frontend should receive a normalized renderer contract.

---

# 22. Template System

Implement exactly three templates for V1:

```text
Clean
Warm Home
Pro
```

Source:

```text
Figma nodes:

90:6
90:7
90:8
```

Do not create 20 templates.

Do not treat simple color changes as new templates.

---

# 23. Template vs Theme

Important distinction:

```text
Template
=
layout/composition
```

```text
Theme
=
visual identity
```

Template controls:

```text
hero composition
service presentation
trust layout
review presentation
section styling
```

Theme controls:

```text
primary color
background tone
font preset
button shape
surface radius
```

---

# 24. Template Implementation

Do NOT duplicate complete application logic three times.

Create common components.

Concept:

```text
components/public-site/

SiteHero
RatingBadge
ServiceCard
ServiceList
BeforeAfterGallery
ReviewSection
AboutSection
BookingCTA
```

Templates:

```text
components/templates/

CleanTemplate
WarmHomeTemplate
ProTemplate
```

Renderer:

```tsx
const templateMap = {
  clean: CleanTemplate,
  'warm-home': WarmHomeTemplate,
  pro: ProTemplate,
}
```

Then:

```tsx
const Template = templateMap[site.template]

return <Template site={site} />
```

All templates consume the same domain data.

---

# 25. Clean Template

Figma:

```text
90:6
```

Direction:

```text
minimal
professional
solo cleaner
trust-first
green/default professional theme
```

Main hierarchy:

```text
Hero
Business identity
Google rating
Tagline

Book CTA

Popular services

Trust/review

Optional before/after

About
```

---

# 26. Warm Home Template

Figma:

```text
90:7
```

Direction:

```text
warm
residential
family-friendly
larger photography
soft cards
```

Main hierarchy:

```text
Business identity

Large image

Google badge

Friendly headline

Booking CTA

Services

Customer reviews
```

---

# 27. Pro Template

Figma:

```text
90:8
```

Direction:

```text
professional company/team
structured layout
stronger trust metrics
more business-like presentation
```

Main hierarchy:

```text
Hero

Verified badge

Business name

Rating
Jobs completed

Booking CTA

Services

Trust metrics

Google review
```

Pro must not simply be Clean with a different color.

---

# 28. Images

The Figma prototype currently includes temporary/reference cleaning images.

Reference source used while designing:

```text
GitHub:

MarynaShavlak/comfort-group-cleaning
```

Examples:

```text
docs/images/team/member-2.png

docs/images/team/member-7.png

docs/images/before-after/before-6.jpg

docs/images/before-after/after-6.jpg

docs/images/before-after/before-11.jpg

docs/images/before-after/after-11.jpg
```

These are reference/demo assets only.

Do NOT hotlink GitHub raw URLs in production.

Before copying any external image into production, verify that its license allows usage.

If license is unclear:

```text
use existing project-owned demo assets
or
use local placeholders
or
use partner-uploaded images
```

Production partner media must come from partner uploads.

---

# 29. Production Image Storage

Use:

```text
Vercel Blob
```

For:

```text
logo
profile photo
hero image
before image
after image
gallery image
```

Database stores:

```text
Blob URL
metadata
ownership
sort order
caption
```

Do NOT store raw images in PostgreSQL.

---

# 30. Image Upload Flow

Prefer a secure Vercel Blob-compatible flow.

Conceptually:

```text
Partner selects image
        ↓
authorization validated
        ↓
upload to Vercel Blob
        ↓
Blob URL
        ↓
FastAPI stores metadata
        ↓
PostgreSQL
```

Ensure one partner cannot attach or delete another partner's assets.

Avoid writing a custom image-processing service.

---

# 31. Icons

Use one icon source:

```text
lucide-react
```

Examples:

```text
Calendar
Clock
MapPin
Star
Share2
Upload
Image
Eye
Settings
Palette
LayoutTemplate
CreditCard
Check
Plus
Trash2
ChevronRight
ExternalLink
```

Do not:

```text
export dozens of icon SVGs from Figma
mix multiple icon libraries
```

---

# 32. Theme System

Theme must be intentionally constrained.

Example:

```ts
type TemplateKey =
  | 'clean'
  | 'warm-home'
  | 'pro'

type FontPreset =
  | 'modern'
  | 'soft'

type ButtonStyle =
  | 'soft'
  | 'pill'

interface ThemeConfig {
  template: TemplateKey
  primaryColor: string
  backgroundTone: string
  fontPreset: FontPreset
  buttonStyle: ButtonStyle
}
```

Render theme through controlled design tokens/CSS variables.

Example:

```css
--brand-primary
--brand-background
--brand-text
--surface-radius
--button-radius
```

Do not allow arbitrary CSS.

---

# 33. What Partner Can Customize

Reference:

```text
90:9
```

Partner MAY customize:

```text
logo/profile photo

business name

tagline

service area

template

primary color

background tone

font preset

button style

services

service prices

service duration

before/after gallery

review highlights

about content

section visibility

booking CTA

availability

required booking fields
```

---

# 34. What Partner Cannot Customize

Cleanie controls:

```text
responsive layout

breakpoints

spacing

hierarchy

CTA placement

accessibility

SEO structure

performance defaults

mobile behavior
```

Do NOT implement:

```text
drag/drop blocks

custom CSS

custom HTML

free-form positioning

columns editor

margin controls

padding controls

Wix-style page builder
```

---

# 35. Partner Overview

Reference:

```text
90:4
```

Partner opens the application and sees immediately:

```text
YOUR PAGE

cleanie.app/jessica

246 views
12 bookings
4.9 rating

[ Edit Page ]

[ Share Page ]
```

Then:

```text
Start from a template
```

Cards:

```text
Clean

Warm Home

Pro
```

Each template card should show a real visual preview.

Actions:

```text
Preview

Use Template
```

Changing template must preserve:

```text
business identity
services
portfolio
reviews
booking settings
```

Only presentation changes.

---

# 36. Main Editor

Reference:

```text
90:5
```

Desktop editor structure:

```text
┌──────────────┬──────────────────────┬─────────────────┐
│ Navigation   │ Editor               │ Mobile Preview  │
│              │                      │                 │
│ Brand        │                      │                 │
│ Theme        │                      │                 │
│ Content      │                      │                 │
│ Booking      │                      │                 │
└──────────────┴──────────────────────┴─────────────────┘
```

Prefer one main editor route.

Example:

```text
/dashboard/page
```

Tabs can use URL search params or local state.

Do not create dozens of routes for small settings.

---

# 37. Brand Editor

Allow:

```text
profile/logo

business name

tagline

service area
```

Use Vercel Blob for media.

Validate:

```text
file type
file size
ownership
required fields
```

---

# 38. Theme Editor

Allow:

```text
template

brand color

font preset

button style
```

Changes should immediately update Live Preview locally.

Prefer explicit:

```text
Save Changes
```

for V1 unless existing architecture already uses reliable autosave.

---

# 39. Content & Trust Editor

Reference:

```text
97:2
```

Allow section visibility:

```text
Services            ON/OFF

Before & After      ON/OFF

Google Reviews      ON/OFF

About               ON/OFF
```

Partner cannot arbitrarily reorder sections.

Cleanie owns conversion hierarchy.

---

# 40. Services

Basic service fields:

```text
name
description
price
duration
active
sort_order
```

Allow:

```text
create
edit
disable
delete
```

Keep management inline/simple.

Avoid building a separate complex service-management system.

---

# 41. Before / After Portfolio

Data:

```text
portfolio_items

id
partner_id
before_image_url
after_image_url
caption
sort_order
created_at
```

UI:

```text
Upload Before

Upload After

Caption

Delete
```

Use Vercel Blob.

---

# 42. Reviews

Data model should support:

```text
author
rating
text
source
source_url
featured
```

Sources may include:

```text
google
manual
```

Do NOT make Google Business integration a prerequisite for V1.

If Google integration already exists, reuse it.

Otherwise build the data model/service boundary so Google synchronization can be added later.

---

# 43. Booking Settings

Reference:

```text
97:3
```

Partner configures:

```text
available weekdays

working start time

working end time

CTA label
```

Keep availability intentionally simple.

Do not build a full scheduling engine.

---

# 44. Required Customer Fields

Partner can configure:

```text
name
phone
email
address
notes
```

Recommended defaults:

```text
name      required

phone     required

email     optional

address   required

notes     optional
```

FastAPI must still validate the final booking payload.

---

# 45. Payment

Model may support:

```text
none
deposit
full
```

But Cleanie V1 must work perfectly with:

```text
none
```

Default:

```text
No online payment
```

Do not block partner activation on payment setup.

Do not build fake payment functionality.

Only activate Stripe/payment functionality if infrastructure already exists or it can be implemented cleanly as a later phase.

---

# 46. Customer Public Page

Primary experience is mobile-first.

Conversion hierarchy:

```text
Identity
    ↓
Trust
    ↓
Service
    ↓
Proof
    ↓
Reviews
    ↓
Booking
```

Customer should quickly answer:

```text
Who is this?

Can I trust them?

What do they clean?

How much?

What does their work look like?

What do customers think?

When can they come?

How do I book?
```

Avoid unnecessary navigation.

---

# 47. Booking Customer Flow

Keep the booking flow short:

```text
Choose service
      ↓
Choose date
      ↓
Choose available time
      ↓
Contact + address
      ↓
Confirm
      ↓
Success
```

Do not create a long checkout wizard.

---

# 48. Booking Creation API

Concept:

```text
POST

/api/v1/public/partners/{slug}/bookings
```

FastAPI must:

```text
validate partner

validate published status

validate service

validate availability

validate customer fields

check slot conflict

create booking transactionally
```

---

# 49. Prevent Booking Conflicts

Before creating a booking, verify that the slot is still available.

Do this transactionally where appropriate.

If already taken:

```text
return conflict response
```

Frontend should display:

```text
This time was just booked. Please choose another available time.
```

---

# 50. Partner Daily View

Keep the original product philosophy:

Partner wakes up and needs only:

```text
Where?

When?

How much?
```

Partner home should emphasize:

```text
today's bookings

time

customer

service

address

amount
```

Do not overload it with analytics.

---

# 51. Admin V1

Admin remains desktop-oriented.

Keep scope minimal:

```text
partners

status

published page

bookings

basic account state
```

Do not build a CRM.

Do not create features not represented by the actual product needs.

---

# 52. Publish Flow

Publishing does NOT deploy code.

Correct:

```text
Partner edits page
        ↓
Next.js
        ↓
FastAPI
        ↓
PostgreSQL
        ↓
Publish
        ↓
status = published
        ↓
revalidate public page
        ↓
same URL updates
```

Example:

```text
cleanie.app/jessica
```

Do NOT:

```text
create Git branch

generate source code

create Vercel project

run Vercel deployment

create DNS entry
```

per partner.

---

# 53. Caching

Keep it simple.

Public partner pages can use Next.js/Vercel caching where appropriate.

Authenticated dashboard/admin pages remain dynamic.

After:

```text
profile update
theme update
service update
portfolio update
review update
publishing
```

invalidate only the relevant partner page.

Do not add Redis solely for cache invalidation.

---

# 54. API Client

Create one centralized TypeScript API layer.

Example:

```text
lib/api/
```

Expose clean functions such as:

```text
getPartnerOverview()

updatePartnerProfile()

updateTheme()

updateSections()

listServices()

createService()

updateService()

deleteService()

getPortfolio()

createPortfolioItem()

updateBookingConfig()

getPublicPartner(slug)

createBooking(slug, payload)
```

Do not scatter raw fetch calls everywhere.

Centralize:

```text
base URL
headers
error parsing
response typing
authentication handling
```

---

# 55. Validation

Pydantic schemas are authoritative on backend.

Examples:

```text
PartnerUpdate

SlugUpdate

ThemeConfig

SectionConfig

ServiceCreate

ServiceUpdate

BookingConfigUpdate

PublicBookingCreate
```

Frontend validation is UX only.

Backend must always revalidate.

---

# 56. Authentication

First inspect existing auth.

If auth exists:

```text
reuse it
```

Do not replace it.

Partner routes must require authenticated partner ownership.

Admin routes require admin authorization.

Public partner pages require no authentication.

Customer booking requires no account.

Keep V1 auth simple.

Do not redesign the auth system unless it is fundamentally missing.

---

# 57. Multi-Tenant Security

Every tenant-owned business entity must contain or resolve to:

```text
partner_id
```

Never trust:

```text
partner_id
```

coming directly from the client for authorization.

Determine authenticated partner ownership server-side.

Verify:

```text
Jessica cannot read Maria's services.

Jessica cannot update Maria's portfolio.

Jessica cannot see Maria's bookings.
```

Public APIs expose only public/published information.

---

# 58. Performance

Keep client JavaScript low.

Prefer server rendering for public pages.

Use Client Components only where actual interaction requires them.

Examples:

```text
color picker
template selector
live preview
booking date/time selection
interactive forms
```

Do not mark whole application trees:

```tsx
'use client'
```

without need.

---

# 59. Avoid N+1 Queries

Public partner page should load efficiently.

FastAPI should assemble the page data using a small predictable number of database queries.

Do not have React make separate requests for:

```text
partner
theme
services
portfolio
reviews
availability
```

when the public endpoint can return the full renderer payload.

---

# 60. Error States

Implement proper states for:

```text
partner does not exist

partner unpublished

slug unavailable

service not found

time slot unavailable

booking conflict

image upload failed

invalid form

API unavailable
```

Do not expose raw internal stack traces to end users.

---

# 61. Vercel Services to Prefer

Keep platform services minimal.

Use:

```text
Vercel
→ application hosting

Vercel Preview Deployments
→ branch testing

Vercel Blob
→ partner media

Neon via Vercel integration
→ PostgreSQL
```

Use native framework/Vercel caching.

Do not introduce infrastructure just because Vercel offers it.

V1 does NOT need by default:

```text
Redis

Kafka

RabbitMQ

Temporal

Kubernetes

custom queue infrastructure

Elasticsearch

separate CDN architecture
```

---

# 62. Vercel Environment Variables

Determine actual requirements from implementation.

Likely:

```text
DATABASE_URL

BLOB_READ_WRITE_TOKEN

NEXT_PUBLIC_APP_URL
```

Possibly auth variables depending on existing implementation.

Update:

```text
.env.example
```

Do not commit secrets.

---

# 63. Local Development

Public pages must work locally:

```text
localhost:3000/jessica
```

Preview:

```text
feature-preview.vercel.app/jessica
```

Production:

```text
cleanie.app/jessica
```

Same routing model everywhere.

This simplicity is intentional.

---

# 64. Git Branch

Create or use a dedicated implementation branch.

Preferred:

```text
feat/cleanie-platform-v1
```

Do not work directly on production/main unless repository workflow explicitly requires it.

---

# 65. Vercel Preview Deployment

The feature branch must deploy through the project's Vercel Git integration.

Expected workflow:

```text
implement
   ↓
commit
   ↓
push feature branch
   ↓
Vercel Preview Deployment
   ↓
QA
   ↓
fix
   ↓
push again
```

Do not manually create a new Vercel project for the branch.

---

# 66. Preview QA

Verify at minimum:

```text
/                  platform landing

/dashboard         partner area

/jessica           Clean template

/warm-demo         Warm Home template

/sparkle           Pro template
```

Include seeded/demo partners if useful.

---

# 67. Database Migration Rules

Use Alembic.

Before migration:

```text
review schema

generate migration

inspect SQL

apply development/preview

run tests
```

Do not automatically run destructive production changes.

Prefer backward-compatible migrations where practical.

---

# 68. Demo Seed Data

Create useful development/demo data.

Example partners:

```text
Jessica's Home Care
slug: jessica
template: clean
```

```text
Warm Home Cleaning
slug: warm-demo
template: warm-home
```

```text
Sparkle Austin
slug: sparkle
template: pro
```

Include:

```text
services

theme configuration

reviews

availability

demo portfolio
```

Use licensed/project-owned placeholder assets.

---

# 69. Responsive Scope

Customer public pages:

```text
mobile-first
```

Test:

```text
375

390

430

768

1440
```

Partner builder:

```text
desktop-first
```

but basic mobile usability should not completely break.

Partner daily view remains mobile-friendly.

Admin is desktop-first.

---

# 70. Accessibility

Basic production requirements:

```text
semantic HTML

form labels

keyboard navigation

visible focus states

button semantics

image alt text

heading hierarchy

reasonable contrast
```

Do not build a special accessibility framework.

Implement standard web accessibility properly.

---

# 71. Clean Code Rules

Before creating anything new:

```text
search the repo first
```

Reuse existing architecture.

Prefer:

```text
small explicit functions

domain-based naming

typed API contracts

clear ownership boundaries

minimal dependencies
```

Avoid:

```text
duplicate utilities

god components

god services

massive route files

premature generic abstractions

technical names leaking into product domain
```

Good names:

```text
Partner
Service
Booking
Theme
PortfolioItem
Review
Availability
```

Bad names:

```text
VercelPartnerManager

NeonTenantHandler

PostgresServiceImplementation
```

---

# 72. Do Not Overengineer

Explicitly do NOT introduce unless the current repository already requires it:

```text
microservices

GraphQL

CQRS

event sourcing

Redis

Kafka

RabbitMQ

Temporal

Kubernetes

separate API gateway

separate CMS

multi-database architecture

repository generation per partner
```

Choose the smallest implementation that cleanly solves Cleanie V1.

---

# 73. Implementation Plan

Execute work in this order:

| Phase | Scope                                                 | Result                        |
| ----- | ----------------------------------------------------- | ----------------------------- |
| 0     | Audit repository + Figma                              | implementation map            |
| 1     | Create feature branch                                 | isolated work                 |
| 2     | Confirm Vercel-compatible Next.js + FastAPI structure | app boots                     |
| 3     | PostgreSQL models + Alembic                           | database ready                |
| 4     | Auth/partner ownership integration                    | secure partner context        |
| 5     | Partner slug system                                   | `/jessica` routing foundation |
| 6     | Public site API                                       | normalized public payload     |
| 7     | Shared template renderer                              | reusable components           |
| 8     | Clean template                                        | Figma `90:6`                  |
| 9     | Warm Home template                                    | Figma `90:7`                  |
| 10    | Pro template                                          | Figma `90:8`                  |
| 11    | Partner Overview                                      | Figma `90:4`                  |
| 12    | Main editor                                           | Figma `90:5`                  |
| 13    | Content & Trust                                       | Figma `97:2`                  |
| 14    | Booking Settings                                      | Figma `97:3`                  |
| 15    | Vercel Blob uploads                                   | real partner media            |
| 16    | Customer booking                                      | full customer flow            |
| 17    | Partner daily booking view                            | provider workflow             |
| 18    | Minimal admin                                         | operations                    |
| 19    | Publishing + cache invalidation                       | instant updates               |
| 20    | Tests + responsive QA                                 | stable implementation         |
| 21    | Vercel Preview                                        | deployment QA                 |
| 22    | Documentation + handoff                               | production-ready review       |

---

# 74. Work Incrementally

Do NOT generate the entire application blindly in one pass.

Each phase:

```text
inspect
   ↓
plan
   ↓
implement
   ↓
lint
   ↓
typecheck
   ↓
test
   ↓
review diff
   ↓
continue
```

Use the package manager already configured in the repository.

Also run relevant Python checks/tests.

---

# 75. Protect Existing Code

Do not:

```text
delete unrelated functionality

mass rename unrelated files

replace working libraries

upgrade major framework versions unnecessarily

format the entire repository

rewrite infrastructure unrelated to Cleanie
```

Keep diffs focused.

---

# 76. Minimum Testing

Partner flow:

```text
login
 ↓
overview
 ↓
choose template
 ↓
customize identity
 ↓
customize theme
 ↓
add/edit service
 ↓
add portfolio
 ↓
toggle trust sections
 ↓
configure booking
 ↓
publish
 ↓
share public page
```

Customer flow:

```text
open /jessica
 ↓
view trust
 ↓
view service
 ↓
select service
 ↓
choose date/time
 ↓
enter details
 ↓
confirm booking
 ↓
success
```

Security:

```text
tenant isolation

unpublished pages unavailable

reserved slugs rejected

duplicate slug rejected

booking conflict prevented
```

---

# 77. Definition of Done

Cleanie V1 is considered complete when:

```text
Partner creates account

Partner chooses a Cleanie slug

Partner sees template gallery

Partner selects:
Clean / Warm Home / Pro

Partner uploads logo/profile image

Partner configures colors/theme

Partner creates services

Partner uploads before/after images

Partner configures reviews/trust

Partner configures availability

Partner publishes

Public URL works:

cleanie.app/{slug}

Customer opens partner page

Customer selects service

Customer selects available time

Customer enters details/address

Customer confirms booking

Partner can see booking
```

All of this must run from:

```text
ONE repository

ONE Vercel project

ONE FastAPI backend

ONE Next.js frontend

ONE PostgreSQL database
```

---

# 78. Final Verification Before Push

Run all applicable checks:

```text
frontend lint

frontend typecheck

frontend tests

Next.js production build

Python lint/static checks if configured

FastAPI tests

database migration verification
```

Fix errors rather than bypassing them.

---

# 79. Final Deployment

Push:

```text
feat/cleanie-platform-v1
```

Verify the Vercel Preview deployment.

Test:

```text
preview-url/

preview-url/jessica

preview-url/warm-demo

preview-url/sparkle

partner dashboard

editor

booking flow

Blob upload

FastAPI API

database connection
```

Do NOT automatically merge to production.

---

# 80. Final Codex Report

When finished, report:

```text
Repository architecture discovered

Architecture implemented

Main files added

Main files changed

FastAPI endpoints added

Database tables/migrations

Vercel services used

Environment variables required

Public routes

Partner routes

Admin routes

Template architecture

Theme architecture

Slug routing

Image upload flow

Booking flow

Tenant isolation approach

Caching/revalidation behavior

Tests executed

Build status

Known limitations

Git branch

Commits

Vercel Preview URL

Remaining work before production
```

Also include:

```bash
git status
git diff --stat
```

Do not claim deployment success unless the deployment was actually verified.

---

# 81. Product Boundary

Whenever there is uncertainty between:

```text
building a flexible generic platform
```

and:

```text
implementing exactly what Cleanie V1 needs
```

choose the second.

The product should remain easy to understand:

```text
Choose template
      ↓
Customize
      ↓
Publish
      ↓
Share
      ↓
Get booked
```

Do not turn Cleanie V1 into a generic website builder or cleaning operations ERP.

---

# 82. Final Engineering Principle

The implementation should be understandable by another engineer quickly.

Favor:

```text
explicit code

reusable domain components

small APIs

controlled templates

controlled theme configuration

simple database schema

simple deployment

clear frontend/backend boundary
```

The best V1 infrastructure is infrastructure that is boring and rarely needs attention.

Build the complete Cleanie flow shown in Figma, preserve the existing repository architecture wherever reasonable, and optimize the implementation for shipping quickly and maintaining it easily.
