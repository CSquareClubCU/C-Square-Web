<p align="center">
  <img src="frontend/public/logo-black.png" alt="C Square Club Logo" width="120" />
</p>

<h1 align="center">C Square Club — Official Website</h1>

<p align="center">
  <strong>Event Management · QR Check-in · Student Registrations · Attendance Tracking</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-6.0.6-092E20?logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/DRF-3.17.1-A30000?logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16.2.9-000000?logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Flexible_Server-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Hosted-0078D4?logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=black" />
</p>

---

## 📋 Overview

C Square Club is a technical club at **Chandigarh University** that hosts coding competitions, hackathons, workshops, and seminars. This repository contains the club's official website — a full-stack platform that handles:

- **Event discovery** — Public listing of upcoming and past events
- **Student registration** — Individual and team-based event sign-ups
- **Admin management** — Event creation, registration approvals, volunteer assignment
- **QR-based attendance** — QR code generation, mobile scanning, and manual check-in fallback
- **Email notifications** — Magic link auth, registration confirmations, QR code delivery
- **Team showcase** — Public page for club members and volunteers

> **Design inspiration:** Admin experience inspired by [Luma](https://lu.ma), registration experience inspired by [Devfolio](https://devfolio.co).

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
┌───────────────▼──────────┐  ┌───────────▼───────────────────┐
│   Next.js 16 (Frontend)  │  │     Django 6 (Backend)        │
│   Azure Static Web Apps  │  │     Azure App Service         │
│                          │  │                               │
│  • Public pages (SSG)    │  │  • REST API (/api/)           │
│  • Student dashboard     │  │  • Django Admin (/admin/)     │
│  • Admin dashboard       │  │  • Magic link auth            │
│  • QR scanner            │  │  • Business logic             │
│  • Team page             │  │  • QR code generation         │
└───────────────┬──────────┘  └───────────┬───────────────────┘
                │    REST API (JSON)      │
                └─────────────────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
        ┌────────────▼──────┐  ┌──────────▼────────┐  ┌───────▼────────────┐
        │   PostgreSQL      │  │  Azure Blob        │  │  Azure             │
        │   Flexible Server │  │  Storage           │  │  Communication     │
        │                   │  │                    │  │  Services          │
        │  • All app data   │  │  • QR images       │  │  • Magic links     │
        │  • User records   │  │  • Event banners   │  │  • Notifications   │
        │  • Registrations  │  │  • Team photos     │  │  • Reminders       │
        └───────────────────┘  └────────────────────┘  └────────────────────┘
```

The frontend and backend are **completely decoupled** and communicate exclusively through a REST API. See [`Docs/ARCHITECTURE.md`](Docs/ARCHITECTURE.md) for the full system design.

---

## 🗂️ Repository Structure

```
C-Square-Web/
├── backend/                    # Django REST API
│   ├── core/                   #   Shared base models, permissions, utilities
│   │   ├── email_templates/    #     HTML email templates
│   │   ├── utils/              #     Email sender, Azure Blob Storage helpers
│   │   ├── permissions.py      #     IsAdmin, IsVolunteer, IsAdminOrVolunteer
│   │   ├── handlers.py         #     Global exception handler
│   │   └── pagination.py       #     Standard pagination class
│   ├── users/                  #   Custom user model, magic link auth, roles
│   ├── events/                 #   Event CRUD, volunteer assignment, past events
│   ├── registrations/          #   Registration flow, waitlist, team registration
│   ├── attendance/             #   QR check-in, manual attendance, records
│   ├── team/                   #   Public team member profiles
│   ├── csquare/                #   Django project config
│   │   └── settings/           #     base.py, local.py, production.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/                   # Next.js 16 App Router
│   ├── app/                    #   Routes and pages
│   │   ├── page.tsx            #     Homepage
│   │   ├── events/             #     Event listing & detail
│   │   ├── team/               #     Public team page
│   │   ├── login/              #     Magic link login
│   │   ├── onboarding/         #     New user onboarding
│   │   ├── dashboard/          #     Student dashboard & QR view
│   │   ├── admin/              #     Admin dashboard, event management, settings
│   │   └── checkin/            #     QR scanner & manual attendance
│   ├── components/             #   Reusable UI components
│   │   ├── ui/                 #     Button, Card, ConfirmAlert, StatusSelect
│   │   ├── layout/             #     Header, Footer
│   │   ├── events/             #     Event-specific components
│   │   └── animations/         #     Motion/animation components
│   ├── contexts/               #   React contexts (AuthContext)
│   ├── hooks/                  #   Custom hooks (useRequireAuth, useCategoryFilter)
│   ├── lib/                    #   API client, utilities
│   ├── types/                  #   TypeScript type definitions
│   ├── public/                 #   Static assets (logos, icons)
│   ├── package.json
│   └── next.config.ts
├── Docs/                       # Project documentation
│   ├── PRD.md                  #   Product Requirements Document
│   ├── ARCHITECTURE.md         #   System architecture & data flows
│   ├── API_SPEC.md             #   Complete API specification
│   ├── DB_SCHEMA.md            #   Database schema documentation
│   ├── TECH-STACK.md           #   Technology decisions & rationale
│   ├── CONVENTIONS.md          #   Coding conventions & patterns
│   └── DESIGN-cal.md           #   Design calculations & notes
├── .github/workflows/          # CI/CD pipelines
│   ├── backend.yml             #   Django → Azure App Service
│   └── frontend.yml            #   Next.js → Azure Static Web Apps
├── CONTRIBUTING.md             # Contributor guidelines & workflow
└── README.md                   # ← You are here
```

---

## ⚡ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend** | Django + Django REST Framework | 6.0.6 / 3.17.1 |
| **Frontend** | Next.js (App Router) + TypeScript | 16.2.9 |
| **UI** | Tailwind CSS + Framer Motion + Radix UI | 4.x / 12.x |
| **Database** | PostgreSQL (Azure Flexible Server) | — |
| **File Storage** | Azure Blob Storage | — |
| **Auth** | Magic Link (SMTP-based, no OAuth) | — |
| **QR System** | `qrcode` (Python) + `qrcode.react` + `jsqr` | — |
| **Email** | Azure Communication Services / SMTP | — |
| **Backend Hosting** | Azure App Service | — |
| **Frontend Hosting** | Azure Static Web Apps | — |
| **CI/CD** | GitHub Actions | — |
| **Icons** | Lucide React | — |
| **Markdown** | react-markdown + remark-gfm | — |

See [`Docs/TECH-STACK.md`](Docs/TECH-STACK.md) for detailed rationale behind every technology choice.

---

## 👥 Users & Roles

| Role | Access | Description |
|---|---|---|
| **Student** | Public pages, event registration, personal dashboard, QR code | Default role for all new users. CU vs external distinction via email domain. |
| **Volunteer** | QR scanner & attendance list for **assigned events only** | Assigned to specific events by admins. Cannot manage events or approve registrations. |
| **Admin** | Full platform access | Create/manage events, approve/reject registrations, assign volunteers, export data. |

---

## 🔐 Authentication

All users authenticate via **magic link** — no passwords, no OAuth providers.

1. User enters email on the login page
2. System sends a one-time magic link (valid for 15 minutes)
3. User clicks the link and is immediately logged in
4. Session cookie manages the rest

**CU student detection:** Users with `@cuchd.in` or `@cumail.in` emails are automatically flagged as CU students. This is enforced at the event registration level (not the auth level).

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.12+
- **Node.js** 20+ and npm
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/CsquareClub/C-Square-Web.git
cd C-Square-Web
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your values (generate a Django secret key, configure email, etc.)

# Run migrations
python manage.py migrate

# Create a superuser (for Django Admin access)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api/`.
Django Admin is at `http://localhost:8000/django-admin/`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Environment Variables

#### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key | *required* |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL connection string (production only) | SQLite in local |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection | — |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | `csquare` |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Azure Email service | — |
| `DEFAULT_FROM_EMAIL` | Sender email address | `DoNotReply@csquareclub.co.in` |
| `EMAIL_HOST` | SMTP host for local dev | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | SMTP username | — |
| `EMAIL_HOST_PASSWORD` | SMTP app password | — |
| `FRONTEND_URL` | Frontend URL for magic links | `http://localhost:3000` |

> **Local development** uses SQLite — no PostgreSQL setup required. Azure services (Blob Storage, Email) are optional for local dev.

---

## 🔌 API Endpoints

All endpoints are documented in [`Docs/API_SPEC.md`](Docs/API_SPEC.md). Key namespaces:

| Prefix | Description |
|---|---|
| `POST /api/auth/magic-link/` | Request magic link login email |
| `GET /api/auth/verify/` | Verify magic link token |
| `GET /api/users/me/` | Current user profile |
| `GET /api/events/` | Public event listing |
| `POST /api/registrations/` | Register for an event |
| `GET /api/registrations/me/` | Student's own registrations |
| `POST /api/attendance/checkin/` | QR code check-in |
| `GET /api/attendance/{eventId}/list/` | Attendance list for an event |
| `GET /api/team/` | Public team members |
| `GET /api/stats/` | Public platform statistics |

---

## 🗄️ Database Schema

The database consists of 8 main tables. Full documentation in [`Docs/DB_SCHEMA.md`](Docs/DB_SCHEMA.md).

```
users_user ─────────────── registrations_registration ─── attendance_attendancerecord
     │                              │
     ├── events_volunteerassignment │
     │                    registrations_team
     │                              │
     │                    registrations_teammember
     │
events_event
events_pastevent
team_teammember (standalone — public listing only)
```

---

## 🧪 Testing

### Backend

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific app's tests
pytest events/tests/ -v
```

Test configuration is in `pytest.ini`. Tests use Django's test framework with `factory-boy` for fixtures.

### Frontend

```bash
cd frontend

# Lint check
npm run lint

# Type check (via build)
npm run build
```

---

## 🚢 Deployment

### CI/CD Pipelines

Both backend and frontend auto-deploy on push to `main` via GitHub Actions:

| Workflow | Trigger | Deploys To |
|---|---|---|
| [`backend.yml`](.github/workflows/backend.yml) | Push to `main` (changes in `backend/`) | Azure App Service |
| [`frontend.yml`](.github/workflows/frontend.yml) | Push to `main` (changes in `frontend/`) | Azure Static Web Apps |

### Production Infrastructure

| Service | Purpose | Est. Cost |
|---|---|---|
| Azure App Service | Django backend hosting | $10–15/mo |
| Azure PostgreSQL Flexible Server | Database | $15–25/mo |
| Azure Static Web Apps | Next.js frontend hosting | Free |
| Azure Blob Storage | QR images, banners, photos | ~$1/mo |
| Azure Communication Services | Transactional emails | ~$1/mo |
| **Total** | | **$27–42/mo** |

All infrastructure is covered by **$150/month Azure student credits**.

---

## 📖 Documentation

| Document | Description |
|---|---|
| [PRD.md](Docs/PRD.md) | Product requirements — features, user stories, phased delivery plan |
| [ARCHITECTURE.md](Docs/ARCHITECTURE.md) | System architecture, data flows, rendering strategies, deployment |
| [API_SPEC.md](Docs/API_SPEC.md) | Complete REST API specification — every endpoint documented |
| [DB_SCHEMA.md](Docs/DB_SCHEMA.md) | Full database schema — every table, column, and relationship |
| [TECH-STACK.md](Docs/TECH-STACK.md) | Technology choices with detailed rationale |
| [CONVENTIONS.md](Docs/CONVENTIONS.md) | Coding conventions, naming patterns, agent rules |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor guidelines, branch naming, PR workflow |

---

## 🤝 Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before writing your first line of code. Key rules:

1. **Respect ownership boundaries** — Backend dev works in `/backend`, frontend dev works in `/frontend`
2. **Branch off main** — One branch per task, following naming conventions
3. **Read the docs first** — `ARCHITECTURE.md`, `API_SPEC.md`, `DB_SCHEMA.md` before every session
4. **PR checklist** — All tests pass, diff reviewed, no secrets, issue linked
5. **Mixed PRs rejected** — Never combine backend and frontend changes in one PR

---

## 📊 Core Features Summary

| Feature | Status | Details |
|---|---|---|
| Magic Link Auth | ✅ Implemented | Email-based, no passwords, 15-min expiry |
| Public Event Listing | ✅ Implemented | SSG/ISR for SEO, filtering by type |
| Event Detail Pages | ✅ Implemented | Rich detail with prizes, rules, FAQs |
| Individual Registration | ✅ Implemented | Form submission, approval workflow |
| Team Registration | ✅ Implemented | Join codes, teammate confirmation |
| Admin Dashboard | ✅ Implemented | Event CRUD, registration management |
| Registration Approval | ✅ Implemented | Approve/reject with email notifications |
| QR Code Generation | ✅ Implemented | Auto-generated on approval, stored in Blob |
| QR Scanner | ✅ Implemented | Mobile camera-based scanning |
| Manual Attendance | ✅ Implemented | Searchable list with checkboxes |
| Live Check-in Counter | ✅ Implemented | 5-second polling on event dashboard |
| Waitlist System | ✅ Implemented | Auto-promotion on cancellation |
| Email Notifications | ✅ Implemented | Confirmation, QR delivery, rejections |
| Team Page | ✅ Implemented | Public listing with categories and socials |
| Student Dashboard | ✅ Implemented | Registration history, QR code view |
| Volunteer Management | ✅ Implemented | Per-event assignment, scoped access |
| CSV Export | ✅ Implemented | Attendance data export |
| Settings Management | ✅ Implemented | Admin-configurable platform settings |
| Club Points / Gamification | ✅ Implemented | Points per event, leaderboard ranking |

---

## 📝 License

This project is developed and maintained by **C Square Club, Chandigarh University**. All rights reserved.

---

<p align="center">
  <sub>Built with ❤️ by the C Square Club team at Chandigarh University</sub>
</p>