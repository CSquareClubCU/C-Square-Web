# Conventions
## C Square Club Website

**Version:** 1.0
**Last Updated:** June 2026

---

## Critical Rule

**Read this file before writing any code — manually or via Antigravity.**
These conventions keep the codebase consistent across sessions, developers, and agent outputs.
When in doubt, follow what's here. When something is missing, add it here before proceeding.

---

## 1. General

- All primary keys are UUID v4 — never auto-increment integers
- All timestamps are stored in UTC with timezone (`TIMESTAMPTZ`)
- All models inherit from `core.models.BaseModel` which provides `id`, `created_at`, `updated_at`
- Soft delete is used only for `team_teammember` via `is_active=False`. All other models use hard delete.
- Never put business logic in serializers — serializers validate and transform only
- Never put business logic in views — views handle HTTP and delegate to service functions
- Business logic lives in `services.py` inside each Django app

---

## 2. Django Conventions

### App Structure
Every Django app follows this structure:

```
app_name/
├── __init__.py
├── admin.py          # Django Admin registration
├── apps.py           # App config
├── models.py         # Data models only — no logic
├── serializers.py    # DRF serializers — validation and transformation only
├── views.py          # DRF views — HTTP handling only, delegate to services
├── services.py       # All business logic lives here
├── permissions.py    # Custom DRF permission classes for this app
├── urls.py           # URL patterns for this app
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_views.py
    └── test_services.py
```

### Model Conventions

```python
# Always inherit from BaseModel
from core.models import BaseModel

class Event(BaseModel):
    # Fields in this order:
    # 1. Required fields
    # 2. Optional fields (nullable)
    # 3. FK fields
    # 4. Status/choice fields
    # 5. Timestamp fields (inherited from BaseModel)

    title = models.CharField(max_length=255)
    # ...

    class Meta:
        db_table = 'events_event'        # Always set explicit table name
        ordering = ['-created_at']       # Always set default ordering
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return self.title                # Always implement __str__
```

### Choice Fields

```python
# Always use TextChoices — never bare strings or tuples
class EventStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published'
    CANCELLED = 'cancelled', 'Cancelled'
    COMPLETED = 'completed', 'Completed'

status = models.CharField(
    max_length=20,
    choices=EventStatus.choices,
    default=EventStatus.DRAFT
)
```

### Service Functions

```python
# services.py — all business logic here
# Functions are named as verb_noun

def approve_registration(registration_id: UUID, approved_by: User) -> Registration:
    """
    Approve a registration. Generates QR token, QR image, sends email.
    Raises RegistrationError if registration cannot be approved.
    """
    ...

def send_magic_link(email: str) -> None:
    """
    Send a magic link email to the given address.
    Creates user if they don't exist.
    """
    ...
```

### URL Naming

```python
# urls.py — always name your URLs
urlpatterns = [
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<uuid:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('events/<uuid:pk>/banner/', EventBannerView.as_view(), name='event-banner'),
]
```

### Error Raising in Services

```python
# Always raise domain-specific exceptions — never return None on failure
from core.exceptions import AppError

def approve_registration(registration_id):
    registration = Registration.objects.get(id=registration_id)

    if registration.status != 'pending':
        raise AppError(
            code='INVALID_STATUS',
            message='Only pending registrations can be approved.'
        )
```

---

## 3. API Conventions

### URL Structure
```
/api/resource/                    # List + Create
/api/resource/{uuid}/             # Retrieve + Update + Delete
/api/resource/{uuid}/action/      # Custom action — always a noun/verb pair
```

### HTTP Methods
```
GET     → Read only — never modifies state
POST    → Create new resource or trigger an action
PATCH   → Partial update — only provided fields are changed
PUT     → Never use — always use PATCH
DELETE  → Delete a resource
```

### Response Shapes

**Success — single resource:**
```json
{ "id": "uuid", "field": "value" }
```

**Success — list:**
```json
{
  "count": 100,
  "next": "url or null",
  "previous": "url or null",
  "results": []
}
```

**Success — action (no resource to return):**
```json
{ "message": "Human readable confirmation." }
```

**Error — always this shape, no exceptions:**
```json
{
  "error": {
    "code": "SCREAMING_SNAKE_CASE",
    "message": "Human readable message.",
    "fields": {}
  }
}
```

### HTTP Status Codes
```
200 — OK (GET, PATCH, POST action)
201 — Created (POST new resource)
204 — No content (DELETE)
400 — Bad request (validation error, business rule violation)
401 — Unauthenticated
403 — Forbidden (wrong role)
404 — Not found
409 — Conflict (duplicate resource)
500 — Server error
```

---

## 4. Frontend Conventions

### File Naming
```
Components:     PascalCase       EventCard.tsx
Pages:          lowercase        page.tsx (Next.js convention)
Utilities:      camelCase        formatDate.ts
Types:          PascalCase       EventType.ts
Hooks:          camelCase        useRegistrations.ts
API functions:  camelCase        fetchEvents.ts
```

### Component Structure

```tsx
// Always in this order:
// 1. Imports
// 2. Types
// 3. Component function
// 4. Export

import { useState } from 'react'
import { Event } from '@/types'

type EventCardProps = {
  event: Event
  onRegister: (eventId: string) => void
}

export function EventCard({ event, onRegister }: EventCardProps) {
  // 1. State
  // 2. Effects
  // 3. Handlers
  // 4. Return JSX
}
```

### API Calls

All API calls go through `lib/api.ts` — never use raw `fetch` in a component.

```typescript
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${BASE_URL}/events/`, {
    credentials: 'include',   // Always include for session cookie
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
```

### Error Handling in Components

```tsx
// Always handle loading, error, and empty states
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Check error.error.code — never parse error.error.message for logic
if (error?.error?.code === 'REGISTRATION_CLOSED') {
  // handle specifically
}
```

### TypeScript Types

All types live in `frontend/types/index.ts`. Never use `any`.

```typescript
export type UserRole = 'student' | 'volunteer' | 'admin'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'cancelled'

export type User = {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_cu_student: boolean
  student_uid: string | null
  branch: string | null
  year: number | null
  semester: number | null
  batch: string | null
  phone: string | null
}

export type Event = {
  id: string
  title: string
  description: string
  event_type: 'hackathon' | 'competition' | 'workshop' | 'seminar'
  start_datetime: string
  end_datetime: string
  venue: string
  capacity: number
  status: EventStatus
  is_team_event: boolean
  is_open_to_external: boolean
  banner_image_url: string | null
  registration_deadline: string
  registered_count: number
}
```

---

## 5. Naming Conventions

### Python / Django
```
Models:             PascalCase          class EventVolunteerAssignment
Model fields:       snake_case          start_datetime, is_team_event
Service functions:  snake_case verb     approve_registration, send_magic_link
URL names:          kebab-case          event-list, registration-approve
App names:          snake_case          events, registrations, attendance
```

### TypeScript / Next.js
```
Components:         PascalCase          EventCard, RegistrationForm
Functions:          camelCase           fetchEvents, approveRegistration
Variables:          camelCase           eventList, isLoading
Types/Interfaces:   PascalCase          Event, RegistrationStatus
Constants:          SCREAMING_SNAKE     MAX_TEAM_SIZE, CU_DOMAINS
```

### Git
```
Branches:           backend/feature-name
                    frontend/feature-name
                    fix/bug-description
                    docs/document-name

Commits:            feat: add registration approval endpoint
                    fix: prevent duplicate QR token generation
                    docs: update API_SPEC with checkin endpoint
                    chore: add qrcode to requirements.txt
                    refactor: move QR logic to attendance/services.py
                    test: add tests for waitlist auto-promotion
```

---

## 6. Environment Variables

### Backend
```bash
# Never hardcode these — always use os.environ.get()
DJANGO_SECRET_KEY
DATABASE_URL
AZURE_STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER_NAME
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING
NOTIFICATION_EMAIL
ALLOWED_HOSTS
DEBUG
SESAME_MAX_AGE
```

### Frontend
```bash
NEXT_PUBLIC_API_URL   # Only env var exposed to the browser
```

---

## 7. Testing Conventions

### What to Test
- Every service function — test happy path and all error paths
- Every API endpoint — test auth, permissions, and business logic
- Model constraints — test UNIQUE constraints and FK integrity

### What NOT to Test
- Django internals — don't test that Django saves models
- Serializer field names — these change with the schema
- Frontend unit tests in v1 — focus on backend tests first

### Test File Structure
```python
# Always follow Arrange → Act → Assert

def test_approve_registration_generates_qr_token():
    # Arrange
    user = UserFactory(role='student')
    event = EventFactory(status='published')
    registration = RegistrationFactory(user=user, event=event, status='pending')

    # Act
    result = approve_registration(registration.id, approved_by=admin_user)

    # Assert
    assert result.status == 'approved'
    assert result.qr_token is not None
    assert result.qr_image_url is not None
```

---

## 8. Schema Change Process

**Follow this every time. No exceptions.**

1. Update `DB_SCHEMA.md` first — before touching any model
2. Update `AGENT_CONTEXT.md` — mark the model status as "Modified" and describe the change
3. Update the Django model in the relevant app
4. Run `python manage.py makemigrations`
5. Review the generated migration file — read every line
6. Run `python manage.py migrate` locally to verify
7. Commit the model change and migration together in one commit

**Never:**
- Edit migration files manually
- Squash migrations in v1
- Run `makemigrations` without reviewing the output
- Commit a model change without the migration

---

## 9. Security Rules

These are non-negotiable. Antigravity must never violate these.

- Never commit secrets, API keys, or credentials to the repo
- Never expose database credentials in any file
- Never trust user input — validate everything at the serializer level
- Never use `DEBUG=True` in production settings
- Never disable CSRF protection
- Never return stack traces in API error responses
- Always use parameterised queries — never raw SQL with string formatting
- Always check role permissions on every protected endpoint — never rely on frontend alone
- QR tokens must be UUID v4 — never sequential, never predictable

---

## 10. What Antigravity Must Never Do

- Touch files outside its assigned folder (`/backend` or `/frontend`)
- Modify `DB_SCHEMA.md`, `ARCHITECTURE.md`, or `API_SPEC.md` directly
- Change a model without a corresponding migration
- Use `always-proceed` mode
- Add dependencies without updating `requirements.txt` or `package.json`
- Use `any` type in TypeScript
- Return error responses that don't match the standard error shape
- Hardcode URLs, credentials, or configuration values
- Create new Django apps without explicit instruction
- Skip writing tests for service functions
