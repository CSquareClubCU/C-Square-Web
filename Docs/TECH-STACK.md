# C Square Club — Tech Stack

> **Club:** C Square Club, Chandigarh University
> **Project:** Official Club Website
> **Last Updated:** June 2026 (Django 6.0.6 · DRF 3.17.1 · Next.js 16.2.9)

---

## Overview

C Square Club's website is a full-stack web application supporting event discovery, student registrations, QR-based attendance check-in, and club administration. The stack is chosen for developer familiarity, Azure-native hosting, and agentic engineering compatibility.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| Backend | Django 6.0.6 + Django REST Framework 3.17.1 |
| Frontend | Next.js 16.2.9 (App Router) + TypeScript |
| Database | PostgreSQL — Azure Database for PostgreSQL Flexible Server |
| File Storage | Azure Blob Storage |
| Authentication | django-sesame (magic link for all users — CU and external) |
| QR Check-in | Python `qrcode` + UUID tokens |
| Agentic Tool | Google Antigravity (CLI + Desktop) |
| Backend Hosting | Azure App Service |
| Frontend Hosting | Azure Static Web Apps |
| CI/CD | GitHub Actions → Azure |

---

## Backend

### Django 6.0.6 + Django REST Framework 3.17.1

**Why Django:**
- Primary developer's core expertise — zero learning curve
- Django Admin provides a free, fully functional management dashboard covering event management, user records, and attendance without writing custom UI
- Django ORM with migrations handles all schema changes cleanly and predictably
- Native PostgreSQL support — no adapters or workarounds needed
- Battle-tested conventions mean the entire team always knows where things live (`models.py`, `views.py`, `urls.py`)

**Why Django REST Framework (DRF):**
- Browsable API — frontend dev can explore every endpoint in a browser without asking questions
- Built-in serializers, viewsets, and routers reduce boilerplate
- Consistent patterns that Antigravity agents generate reliably

**Key Django Apps (Planned):**
```
backend/
├── users/          # Custom user model, magic link auth, role management
├── events/         # Event creation, listing, management
├── registrations/  # Event registration logic, waitlist, team registration
├── attendance/     # QR check-in, manual attendance, attendance records
├── team/           # Public team member profiles
└── core/           # Shared utilities, base models
```

---

## Frontend

### Next.js 16.2.9 (App Router) + TypeScript

**Why Next.js:**
- Frontend developer has existing React/Next.js experience — no ramp-up required
- App Router with Server Components gives fast, SEO-friendly public pages
- Clean component model that Antigravity generates reliably
- Deploys to Azure Static Web Apps with zero configuration
- Next.js 16 ships with Turbopack as default bundler — faster dev builds

**Why TypeScript:**
- Type safety catches agent-generated errors at compile time rather than runtime
- API contracts between frontend and backend are enforced through types
- Both developers can read and understand each other's code more easily

---

## Database

### Azure Database for PostgreSQL Flexible Server

**Why PostgreSQL:**
- All application data (users, events, registrations, attendance) is structured, relational, and predictable
- Core queries are JOINs by nature: "all registrations for event X", "all events user Y attended", "check-in count vs registered count"
- ACID transactions ensure registration integrity — no partial writes
- Native Django ORM support — migrations, admin, relationships all work out of the box
- Django Admin requires a relational database to function properly

**Why Azure Flexible Server specifically:**
- Covered under $150/month Azure student credits
- Automated backups with point-in-time restore — no manual backup scripts needed
- No inactivity pausing unlike free-tier alternatives
- Internal Azure networking between App Service and PostgreSQL — database never publicly exposed
- Estimated cost: $15–25/month

**Why not MongoDB:**
- No flexible schema requirement — all entities have fixed, known fields
- No nested document queries — data is flat and relational
- Django ORM and Admin do not support MongoDB natively
- MongoDB's strengths are irrelevant at club-website scale

---

## Authentication

### django-sesame — Magic Link for All Users

The platform uses a single, unified authentication method for everyone — magic link login. No passwords, no OAuth providers, no external identity dependency.

**Why magic link for everyone:**
- Zero password management — no reset flows, no verification emails, no credential storage
- Same consistent experience for CU students and external participants
- No dependency on university IT or third party OAuth providers
- `django-sesame` is lightweight, well-maintained, and integrates cleanly with Django's built-in auth system
- Azure Communication Services handles email delivery — same service used for all other notifications

**How CU vs external distinction works:**
- Everyone enters their email and receives a magic link — no separate auth paths
- The distinction between CU (`@cuchd.in` or `@cumail.in`) and external users is made by email domain
- This domain check is enforced at the event registration level, not the auth level
- Admins toggle "Open to external participants" per event — controls who can register, not who can log in

**Token details:**
- Magic link tokens are UUID-based, cryptographically signed by `django-sesame`
- Tokens expire after 15 minutes
- Single-use — clicking the link invalidates the token immediately
- Standard Django session management takes over after login

**Setup:**
```bash
pip install django-sesame
```

```python
# settings.py
INSTALLED_APPS += ['sesame']
AUTHENTICATION_BACKENDS = ['sesame.backends.ModelBackend']
SESAME_MAX_AGE = 900  # 15 minutes in seconds
```

---

## File Storage

### Azure Blob Storage

**Why Azure Blob Storage:**
- Covered under existing $150/month Azure credits (~$1/month at expected usage)
- Stores QR code images generated at registration approval
- Stores event banner images and assets
- Stores team member profile photos
- Native integration with Azure App Service (same network, low latency)
- Estimated usage: well under 1 GB for club-scale application

---

## QR Check-in System

### Python `qrcode` library + UUID tokens

**How it works:**
1. Admin approves a registration
2. Backend generates a unique UUID token, stores it in the `registrations` table
3. `qrcode` lib encodes the token as a QR image, stored in Azure Blob Storage
4. QR image URL is included in the approval confirmation email and shown on the student dashboard
5. On event day, admin or assigned volunteer opens the check-in page on their device
6. Option A — Scan QR: camera reads QR → hits `POST /api/attendance/checkin/` with the token
7. Option B — Manual: searchable list of approved registrations, checkbox to mark present
8. Both options update the same attendance record
9. Live check-in counter updates on the admin event dashboard

**Why this approach:**
- No third-party QR service dependency
- Tokens are unique per registration — no sharing or duplicating check-ins
- Manual fallback ensures event day works even if QR scanning fails
- Simple to debug and maintain

---

## Agentic Engineering Tool

### Google Antigravity

**What it is:** Google's agent-first development platform, currently free in public preview with Gemini 3 Pro access.

**How the team uses it:**

| Developer | Antigravity Mode | Responsibilities |
|---|---|---|
| Backend Dev | Antigravity CLI | Django models, DRF endpoints, migrations, auth logic, QR generation |
| Frontend Dev | Antigravity Desktop App | Next.js pages, components, API integration, UI polish |

**Key rules for agentic work:**
- Never run both agents simultaneously on overlapping files
- All agent output must be reviewed before merging to `main`
- Feed context files (`ARCHITECTURE.md`, `API_SPEC.md`, `DB_SCHEMA.md`) to the agent at the start of every session
- Backend dev reviews all frontend PRs
- Frontend dev reviews all backend PRs

---

## Hosting and Infrastructure

### Azure App Service (Backend)
- Hosts the Django application
- Auto-deploy via GitHub Actions on push to `main`
- Internal VNet connection to Azure PostgreSQL — database not publicly exposed
- Estimated cost: $10–15/month

### Azure Static Web Apps (Frontend)
- Hosts the Next.js application
- Free under Azure
- Global CDN included
- Auto-deploy via GitHub Actions on push to `main`

### CI/CD — GitHub Actions

```
.github/workflows/
├── backend.yml    # On push to main: test → build → deploy to Azure App Service
└── frontend.yml   # On push to main: build → deploy to Azure Static Web Apps
```

---

## Cost Breakdown

```
Azure PostgreSQL Flexible Server    $15–25/month
Azure App Service                   $10–15/month
Azure Static Web Apps               Free
Azure Blob Storage                  ~$1/month
Azure Communication Services        ~$1/month
Google Antigravity                  Free (public preview)
GitHub                              Free
─────────────────────────────────────────────────
Estimated Total                     $27–42/month
Monthly Azure Credits               $150/month
Remaining Headroom                  ~$108/month
```

---

## Repository Structure

```
csquare-web/
├── backend/                  # Django project
│   ├── core/                 # Shared utilities, base models
│   ├── users/                # Custom user model, magic link auth
│   ├── events/               # Event management
│   ├── registrations/        # Registration logic, waitlist, teams
│   ├── attendance/           # QR check-in, manual attendance
│   ├── team/                 # Public team member profiles
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # Next.js project
│   ├── app/                  # App Router pages
│   ├── components/           # Reusable UI components
│   ├── lib/                  # API client, utilities
│   ├── types/                # TypeScript type definitions
│   └── package.json
├── .github/
│   └── workflows/
│       ├── backend.yml
│       └── frontend.yml
├── PRD.md
├── TECH-STACK.md             # This file
├── ARCHITECTURE.md           # System design and data flow
├── API_SPEC.md               # Every endpoint documented
├── DB_SCHEMA.md              # Every table and relationship
├── CONVENTIONS.md            # Naming, patterns, agent rules
└── CONTRIBUTING.md           # Collaboration workflow
```

---

## What We Decided Against and Why

| Technology | Considered | Rejected Because |
|---|---|---|
| FastAPI | Yes | Django Admin alone saves weeks; Django is the primary dev's expertise |
| MongoDB | Yes | Relational data needs a relational DB; Django ORM doesn't support Mongo natively |
| Microsoft Entra ID | Yes | Requires university IT cooperation; magic link achieves the same result with zero external dependency |
| Google OAuth | Yes | Adds OAuth provider dependency; magic link is simpler and works for any email |
| Supabase | Yes | Free tier pauses after 7 days of inactivity; Azure credits make it unnecessary |
| Railway / Neon | Yes | Azure credits cover everything; fewer platforms to manage |
| WebSockets | Yes | Polling every 5 seconds is sufficient for live check-in counter at club scale |
| Celery / Redis | Yes | Synchronous email sending is sufficient for v1; deferred to v2 |
| Luma integration | Yes | Fragmented data and inconsistent experience; QR check-in built natively instead |
| Vibe-coding | Yes | Agentic engineering with Antigravity gives structured, reviewable output |

---

## Next Steps

- [ ] Verify Azure subscription and $150 credits are active
- [ ] Set up GitHub monorepo (`csquare-web`)
- [ ] Install Antigravity CLI (backend dev) and Desktop App (frontend dev)
- [ ] Write `ARCHITECTURE.md`
- [ ] Write `DB_SCHEMA.md`
- [ ] Write `API_SPEC.md`
- [ ] Write `CONVENTIONS.md`
- [ ] Provision Azure resources (PostgreSQL, App Service, Static Web Apps, Blob Storage)
- [ ] Set up GitHub Actions pipelines
- [ ] Begin Phase 1 development
