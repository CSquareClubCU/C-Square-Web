# Architecture Document
## C Square Club Website

**Version:** 1.0
**Status:** Active
**Last Updated:** June 2026

---

## 1. System Overview

The C Square Club website is a full-stack web application with a clear separation between frontend and backend. The frontend is a Next.js application served via Azure Static Web Apps. The backend is a Django application served via Azure App Service. They communicate exclusively through a REST API. The database is a managed PostgreSQL instance on Azure. All file assets are stored in Azure Blob Storage. Emails are sent via Azure Communication Services.

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
┌───────────────▼──────────┐  ┌───────────▼───────────────────┐
│   Next.js 16 (Frontend)  │  │     Django 6 (Backend)        │
│   Azure Static Web Apps  │  │     Azure App Service         │
│                          │  │                               │
│  - Public pages          │  │  - REST API (/api/)           │
│  - Student dashboard     │  │  - Django Admin (/admin/)     │
│  - Admin dashboard UI    │  │  - Magic link auth            │
│  - QR scanner page       │  │  - Business logic             │
│  - Team page             │  │  - QR generation              │
└───────────────┬──────────┘  └───────────┬───────────────────┘
                │   REST API              │
                └─────────────────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
        ┌────────────▼──────┐  ┌──────────▼────────┐  ┌───────▼────────────┐
        │   PostgreSQL      │  │  Azure Blob        │  │  Azure             │
        │   Flexible Server │  │  Storage           │  │  Communication     │
        │                   │  │                    │  │  Services          │
        │  - All app data   │  │  - QR images       │  │  - Magic link      │
        │  - User records   │  │  - Event banners   │  │    emails          │
        │  - Registrations  │  │  - Team photos     │  │  - Notifications   │
        │  - Attendance     │  │                    │  │  - Reminders       │
        └───────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 2. Frontend Architecture

### Framework
Next.js 16.2.9 with App Router and TypeScript. Turbopack is the default bundler.

### Rendering Strategy

| Page Type | Strategy | Reason |
|---|---|---|
| Homepage | SSG (Static) | Never changes between deploys |
| Events listing | ISR (Incremental Static Regeneration) | Updates when new events published, revalidate every 60s |
| Event detail | ISR | Same as above |
| Team page | SSG | Rarely changes |
| Student dashboard | CSR (Client-side) | Auth-gated, personal data |
| Admin dashboard UI | CSR | Auth-gated, real-time data |
| QR scanner | CSR | Auth-gated, camera access |

### Folder Structure

```
frontend/
├── app/
│   ├── (public)/               # Public routes — no auth required
│   │   ├── page.tsx            # Homepage
│   │   ├── events/
│   │   │   ├── page.tsx        # Events listing
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Event detail
│   │   └── team/
│   │       └── page.tsx        # Team members page
│   ├── (auth)/                 # Auth routes
│   │   └── login/
│   │       └── page.tsx        # Magic link login page
│   ├── dashboard/              # Student dashboard — auth required
│   │   ├── page.tsx            # My registrations
│   │   └── [registrationId]/
│   │       └── page.tsx        # QR code view
│   ├── admin/                  # Admin dashboard — admin role required
│   │   ├── page.tsx            # Admin overview
│   │   ├── events/
│   │   │   ├── page.tsx        # Event list
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create event
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Event detail + registrations
│   │   │       └── attendance/
│   │   │           └── page.tsx # Attendance dashboard
│   │   └── team/
│   │       └── page.tsx        # Manage team members
│   └── checkin/                # Check-in — admin + volunteer role required
│       └── [eventId]/
│           └── page.tsx        # QR scanner + manual attendance list
├── components/
│   ├── ui/                     # Base UI components (buttons, inputs, cards)
│   ├── events/                 # Event-specific components
│   ├── registrations/          # Registration form components
│   ├── attendance/             # QR scanner, attendance list components
│   └── layout/                 # Header, footer, navigation
├── lib/
│   ├── api.ts                  # API client — all fetch calls to Django
│   ├── auth.ts                 # Auth helpers, role checks
│   └── utils.ts                # Shared utilities
├── types/
│   └── index.ts                # All TypeScript type definitions
└── middleware.ts               # Route protection — auth and role checks
```

### Authentication Flow (Frontend)

```
1. User visits /login
2. Enters email → POST /api/auth/magic-link/
3. Django sends magic link email via Azure Communication Services
4. User clicks link → GET /api/auth/verify/?token=<token>
5. Django validates token → returns session cookie
6. Frontend stores session → redirects based on role:
   - student → /dashboard
   - volunteer → /checkin
   - admin → /admin
```

### Role-based Route Protection

Handled in `middleware.ts` using the session cookie. Three levels:

```typescript
// Public — no auth required
/ , /events/*, /team

// Auth required — any logged in user
/dashboard/*

// Admin only
/admin/*

// Admin or Volunteer only
/checkin/*
```

---

## 3. Backend Architecture

### Framework
Django 6.0.6 with Django REST Framework 3.17.1.

### URL Structure

```
/admin/          → Django Admin panel
/api/auth/       → Authentication endpoints
/api/users/      → User profile endpoints
/api/events/     → Event endpoints
/api/registrations/ → Registration endpoints
/api/attendance/ → Attendance endpoints
/api/team/       → Team member endpoints
```

### Django Apps

```
backend/
├── core/               # Shared base models, utilities, permissions
├── users/              # Custom user model, role management
├── events/             # Event CRUD, volunteer assignment
├── registrations/      # Registration flow, waitlist, team registration
├── attendance/         # QR check-in, manual attendance
└── team/               # Public team member profiles
```

#### core/
- `BaseModel` — abstract model with `id` (UUID), `created_at`, `updated_at`
- Custom DRF permissions — `IsAdmin`, `IsVolunteer`, `IsAdminOrVolunteer`
- Shared exception handlers and error response format

#### users/
- Custom `User` model extending `AbstractBaseUser`
- Fields: `email`, `full_name`, `role`, `is_cu_student`, `student_uid`, `branch`, `year`, `semester`, `batch`, `phone`
- Role choices: `student`, `volunteer`, `admin`
- `is_cu_student` derived from email domain on first login
- Magic link auth via `django-sesame`

#### events/
- `Event` model with all event fields
- `VolunteerAssignment` model — links volunteers to specific events
- Admin-only CRUD via DRF viewsets
- Public read-only listing and detail endpoints

#### registrations/
- `Registration` model — links user to event with status
- `Team` model — group of registrations for team events
- `TeamMember` model — links teammates to a team
- Waitlist logic — auto-promotes first waitlisted on cancellation
- Team confirmation flow — teammate email invites

#### attendance/
- `AttendanceRecord` model — links registration to check-in status and timestamp
- QR token generation on registration approval
- QR image generation via `qrcode` lib → stored in Azure Blob Storage
- Check-in endpoint — validates token, prevents duplicate check-ins
- Manual attendance endpoint — marks present from list

#### team/
- `TeamMember` model — name, photo, designation, display order
- Admin CRUD via Django Admin
- Public read-only listing endpoint

### Request Lifecycle

```
Next.js (CSR page)
    │
    ▼
fetch('/api/events/', { headers: { Cookie: sessionid } })
    │
    ▼
Django URL Router
    │
    ▼
DRF View (authentication check → permission check → business logic)
    │
    ▼
Django ORM → PostgreSQL
    │
    ▼
Serializer → JSON Response
    │
    ▼
Next.js renders data
```

### Error Response Format

All API errors return a consistent JSON shape:

```json
{
  "error": {
    "code": "REGISTRATION_CLOSED",
    "message": "Registration for this event has closed.",
    "field": null
  }
}
```

Field-level validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "fields": {
      "phone": "Enter a valid 10-digit phone number.",
      "batch": "This field is required."
    }
  }
}
```

---

## 4. Authentication Architecture

### Magic Link Flow (Full)

```
┌──────────┐         ┌──────────┐         ┌──────────────┐      ┌──────────┐
│  Browser │         │  Django  │         │  Azure Comms │      │  Email   │
└────┬─────┘         └────┬─────┘         └──────┬───────┘      └────┬─────┘
     │                    │                       │                   │
     │ POST /api/auth/     │                       │                   │
     │ magic-link/         │                       │                   │
     │ {email}            │                       │                   │
     ├───────────────────►│                       │                   │
     │                    │ Generate sesame token  │                   │
     │                    │ Store against user     │                   │
     │                    ├──────────────────────►│                   │
     │                    │ Send magic link email  │                   │
     │                    │                       ├──────────────────►│
     │ 200 OK             │                       │                   │
     │ "Check your email" │                       │                   │
     │◄───────────────────┤                       │                   │
     │                    │                       │                   │
     │ User clicks link   │                       │                   │
     │ GET /api/auth/     │                       │                   │
     │ verify/?token=xxx  │                       │                   │
     ├───────────────────►│                       │                   │
     │                    │ Validate token         │                   │
     │                    │ Create/update user     │                   │
     │                    │ Assign role            │                   │
     │                    │ Create Django session  │                   │
     │ 200 OK + cookie    │                       │                   │
     │◄───────────────────┤                       │                   │
     │ Redirect by role   │                       │                   │
```

### Role Enforcement

- **Frontend** — `middleware.ts` checks session and role before rendering protected routes
- **Backend** — DRF custom permissions check role on every API request
- Both layers enforce roles independently — frontend is UX protection, backend is the real security layer

### CU vs External Student Distinction

```python
CU_DOMAINS = ['cuchd.in', 'cumail.in']

def is_cu_student(email: str) -> bool:
    domain = email.split('@')[-1].lower()
    return domain in CU_DOMAINS
```

This runs at first login and sets `user.is_cu_student`. It is then checked at registration time — not at login time.

---

## 5. Data Flow — Key Scenarios

### 5.1 Event Registration (Individual)

```
Student clicks Register
        │
        ▼
POST /api/registrations/
        │
        ▼
Check: event exists and is published
Check: registration deadline not passed
Check: student not already registered
Check: event open to external if student is external
        │
    ┌───┴───┐
    │       │
  Full    Space
    │       │
    ▼       ▼
Waitlist  Create Registration (status=pending)
    │       │
    ▼       ▼
Email:   Email: registration received, pending review
waitlist
position
```

### 5.2 Admin Approves Registration

```
Admin clicks Approve
        │
        ▼
POST /api/registrations/{id}/approve/
        │
        ▼
Set status = approved
Generate UUID qr_token
Generate QR image via qrcode lib
Upload QR image to Azure Blob Storage
Store QR image URL in registration record
        │
        ▼
Send confirmation email with:
- QR code image
- Event details
- Venue, date, time
- What to bring
        │
        ▼
Check waitlist — if capacity now full, no action
```

### 5.3 QR Check-in on Event Day

```
Volunteer/Admin scans QR
        │
        ▼
POST /api/attendance/checkin/
{ token: "uuid" }
        │
        ▼
Find registration by qr_token
Check: registration status = approved
Check: not already checked in
Check: event matches (token belongs to this event)
        │
    ┌───┴───┐
  Valid   Invalid
    │       │
    ▼       ▼
Mark     Return error:
checked  - already_checked_in
in       - invalid_token
    │    - wrong_event
    ▼
Return success + student name
```

### 5.4 Manual Attendance Marking

```
Admin/Volunteer opens attendance list
        │
        ▼
GET /api/attendance/{eventId}/list/
Returns: all approved registrations with checked_in status
        │
        ▼
Searchable by name, UID, email on frontend
        │
        ▼
Admin/Volunteer checks a checkbox
        │
        ▼
POST /api/attendance/{registrationId}/manual-checkin/
        │
        ▼
Same validation as QR check-in
Mark checked_in = True, timestamp recorded
```

### 5.5 Live Check-in Counter

```
Admin event dashboard opens
        │
        ▼
Frontend polls every 5 seconds:
GET /api/events/{id}/checkin-stats/
        │
        ▼
Returns:
{
  "total_approved": 450,
  "checked_in": 312,
  "remaining": 138
}
        │
        ▼
Dashboard updates counter in real time
```

---

## 6. File Upload Architecture

All file uploads go through Django first for validation before being stored in Azure Blob Storage.

```
Browser selects file
        │
        ▼
POST /api/events/{id}/banner/
multipart/form-data
        │
        ▼
Django validates:
- File type (jpg, png, webp only)
- File size (max 5MB)
- Authenticated admin
        │
        ▼
Upload to Azure Blob Storage
Container: event-banners/{event_id}/banner.jpg
        │
        ▼
Store public URL in Event.banner_image field
Return URL in response
```

Same pattern for:
- Team member photos → `team-photos/{member_id}/photo.jpg`
- QR code images → `qr-codes/{registration_id}/qr.png`

---

## 7. Email Architecture

All emails are sent synchronously in v1. Celery/Redis background queue is a v2 upgrade.

```
Django view completes business logic
        │
        ▼
Call email utility function:
send_magic_link_email(user, token)
send_registration_approved_email(registration)
send_registration_rejected_email(registration, reason)
etc.
        │
        ▼
Render HTML email template
        │
        ▼
Azure Communication Services SDK
        │
        ▼
Email delivered to recipient
        │
        ▼
View returns HTTP response to frontend
```

**Email templates live in:** `backend/core/email_templates/`

**Known limitation:** If Azure Communication Services is slow, the API response will be slow. This is acceptable for v1 at club scale. Celery will be introduced in v2 if this becomes a problem.

---

## 8. Deployment Architecture

### CI/CD Pipeline

```
Developer pushes to feature branch
        │
        ▼
Opens Pull Request → other dev reviews
        │
        ▼
PR merged to main
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
backend.yml fires                   frontend.yml fires
        │                                 │
        ▼                                 ▼
Run Django tests                    Run TypeScript build
        │                                 │
        ▼                                 ▼
Build Docker image                  Build Next.js
        │                                 │
        ▼                                 ▼
Deploy to Azure App Service         Deploy to Azure Static Web Apps
        │                                 │
        ▼                                 ▼
Run DB migrations                   Invalidate CDN cache
```

### Environment Variables

**Backend (Azure App Service Configuration):**
```
DJANGO_SECRET_KEY
DATABASE_URL
AZURE_STORAGE_CONNECTION_STRING
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING
ALLOWED_HOSTS
DEBUG=False
SESAME_MAX_AGE=900
NOTIFICATION_EMAIL=csquare.core@gmail.com
```

**Frontend (Azure Static Web Apps):**
```
NEXT_PUBLIC_API_URL=https://api.csquare.in
```

---

## 9. Security Architecture

### API Security
- All non-public endpoints require a valid Django session cookie
- Role-based permissions enforced on every request via DRF custom permission classes
- CSRF protection enabled for all state-changing endpoints
- CORS configured to allow only the frontend domain

### Data Security
- PostgreSQL not publicly exposed — internal Azure VNet only
- Azure Blob Storage containers are private — files served via signed URLs or through Django
- QR tokens are UUID v4 — not guessable, not sequential
- No secrets in code or version control — all via Azure App Service configuration

### Volunteer Access Isolation
- Volunteer's check-in access is scoped to assigned events only
- `VolunteerAssignment` table enforced on every check-in API request
- Volunteer cannot access registration approvals, event management, or other admin features

---

## 10. Key Architectural Decisions and Rationale

| Decision | Choice | Rationale |
|---|---|---|
| API style | REST | Simpler than GraphQL for this data shape; DRF handles it cleanly |
| Real-time counter | Polling (5s) | WebSockets add infrastructure complexity for marginal benefit at club scale |
| Email sending | Synchronous | Celery/Redis deferred to v2; acceptable latency for v1 |
| File uploads | Through Django | Validation control; acceptable performance at club scale |
| Auth | Magic link only | Single method for all users; no OAuth or password complexity |
| QR token storage | UUID in PostgreSQL | Simple, fast, no external token service needed |
| Frontend rendering | Mixed SSG/ISR/CSR | Public pages are fast and SEO-friendly; auth pages are dynamic |
| Django Admin | For admin panel | Free, fully functional; avoids building custom admin UI in Phase 1 |

---

## 11. Future Architecture Considerations (v2)

- **Celery + Redis** — background task queue for emails and QR generation
- **WebSockets** — real-time check-in counter via Django Channels
- **CDN for assets** — Azure CDN in front of Blob Storage for faster file delivery
- **Certificate generation** — post-event PDF certificates via a background task
- **Rate limiting** — throttle magic link requests to prevent abuse
- **Caching** — Redis cache for event listings at peak traffic
