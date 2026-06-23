# Agent Context
## C Square Club Website

**Last Updated:** June 2026
**Current Phase:** Phase 1 — Foundation

---

## Critical Rule

**Read this file at the start of every Antigravity session.**
**Update this file whenever you change a model, make an architectural decision, or complete a phase.**
This file is the living state of the project. It is short by design — current, not historical.

---

## Project Summary

C Square Club website for Chandigarh University. Full-stack web application for event discovery, student registration, and QR-based attendance check-in.

**Repo:** `https://github.com/CSquareClubCU/C-Square-Web`
**Backend:** Django 6.0.6 + DRF 3.17.1 — lives in `/backend`
**Frontend:** Next.js 16.2.9 + TypeScript — lives in `/frontend`
**Database:** PostgreSQL on Azure Flexible Server
**Auth:** Magic link via django-sesame — no passwords, no OAuth

---

## Current State

### What Exists
- [ ] Django project scaffold
- [ ] Next.js project scaffold
- [ ] PostgreSQL provisioned on Azure
- [ ] Azure Blob Storage provisioned
- [ ] Azure Communication Services provisioned
- [ ] GitHub Actions CI/CD pipelines
- [ ] Magic link auth working end to end
- [ ] Any Django models created
- [ ] Any API endpoints live

> Update this checklist as things get built. Check boxes as they are completed.

### Current Phase Tasks
**Phase 1 — Foundation**
- [ ] Scaffold Django project in `/backend`
- [ ] Scaffold Next.js project in `/frontend`
- [ ] Provision Azure PostgreSQL
- [ ] Provision Azure Blob Storage
- [ ] Provision Azure Communication Services
- [ ] Implement magic link auth (django-sesame)
- [ ] Build public homepage in Next.js
- [ ] Build events listing page in Next.js
- [ ] Set up GitHub Actions pipelines

---

## Models — Current State

> This section is the most critical. Update it every time a model changes.
> Always cross-reference with DB_SCHEMA.md for full field definitions.

### users_user
**Status:** Not yet created
**Key fields:** id (UUID), email, full_name, role (student/volunteer/admin), is_cu_student, student_uid, branch, year, semester, batch, phone
**Notes:** Custom AbstractBaseUser. Magic link auth via django-sesame.

### events_event
**Status:** Not yet created
**Key fields:** id, title, description, event_type, start_datetime, end_datetime, venue, capacity, registration_deadline, is_open_to_external, is_team_event, min_team_size, max_team_size, banner_image_url, status, created_by
**Notes:** status choices — draft, published, cancelled, completed

### events_volunteerassignment
**Status:** Not yet created
**Key fields:** id, event (FK), volunteer (FK to user), assigned_by (FK to user)
**Notes:** UNIQUE on (event, volunteer). Volunteer must have role=volunteer.

### registrations_registration
**Status:** Not yet created
**Key fields:** id, event (FK), user (FK), status, qr_token (UUID, unique), qr_image_url, rejection_reason, waitlist_position, is_team_registration, team (FK, nullable)
**Notes:** status choices — pending, approved, rejected, waitlisted, cancelled. qr_token generated on approval only.

### registrations_team
**Status:** Not yet created
**Key fields:** id, event (FK), name, leader (FK to user), status
**Notes:** status choices — pending_confirmation, pending_approval, approved, rejected, cancelled

### registrations_teammember
**Status:** Not yet created
**Key fields:** id, team (FK), user (FK, nullable), email, has_confirmed, confirmation_token (UUID, nullable), confirmed_at
**Notes:** user is NULL until teammate confirms. UNIQUE on (team, email).

### attendance_attendancerecord
**Status:** Not yet created
**Key fields:** id, registration (FK, unique), event (FK), user (FK), is_checked_in, checked_in_at, check_in_method (qr/manual), marked_by (FK to user, nullable)
**Notes:** Created automatically on registration approval. event and user are denormalised for fast queries.

### team_teammember
**Status:** Not yet created
**Key fields:** id, full_name, designation, photo_url, display_order, is_active
**Notes:** No FK to users_user. Purely for public team page. Managed via Django Admin.

---

## Active Decisions

These are decisions that directly affect how the agent should write code.
Do not deviate from these without updating this file first.

| Decision | Detail |
|---|---|
| Auth method | Magic link only via django-sesame. No passwords. No OAuth. |
| CU domains | `@cuchd.in` and `@cumail.in` are CU student domains. All others are external. |
| File uploads | All uploads go through Django first — validate then push to Azure Blob Storage |
| Email sending | Synchronous in v1 — no Celery, no Redis |
| Real-time counter | Polling every 5 seconds — no WebSockets |
| Volunteer access | Per-event assignment only — enforced via VolunteerAssignment table on every check-in request |
| QR token | Generated on registration approval — UUID v4, stored in registrations_registration.qr_token |
| Attendance record | Created automatically when registration is approved — not when check-in happens |
| Role enforcement | Both frontend (middleware.ts) and backend (DRF permissions) enforce roles independently |
| Error format | All API errors return `{ error: { code, message, fields } }` — never deviate from this shape |
| UUID for all PKs | Every model uses UUID v4 as primary key — never auto-increment integers |
| Soft delete | team_teammember uses is_active=False instead of hard delete. All other models hard delete unless noted. |
| Django Admin | Admin panel lives at /admin/ — used by admins for content management. No custom admin UI in v1. |

---

## Known Gotchas

> Add to this section whenever you hit a non-obvious bug or behaviour.
> This prevents the agent from repeating the same mistakes across sessions.

None yet — add entries as you encounter them using this format:

```text
### [Short title]
**Date:** YYYY-MM-DD
**Context:** What were you doing when this happened
**Problem:** What went wrong
**Fix:** Exactly what resolved it
```

---

## Recent Changes

> Most recent first. Keep only the last 10 entries. Archive older ones if needed.

None yet — add entries as you make changes using this format:

```text
### [YYYY-MM-DD] — [Short description]
- What changed
- Which files were affected
- Any follow-on tasks this creates
```

---

## How to Use This File With Antigravity

At the start of every session, paste this into Antigravity:

```text
@AGENT_CONTEXT.md @ARCHITECTURE.md @DB_SCHEMA.md @API_SPEC.md

My task for this session: [your specific task here]
```

For backend sessions, also include:
```text
@CONVENTIONS.md
```

For model changes, always state explicitly:
```text
I am updating the [model_name] model. The change is:
[describe the change]

I have already updated DB_SCHEMA.md and AGENT_CONTEXT.md to reflect this.
Please update the Django model, create a migration, and update any affected serializers.
```

### Example Session Transcript

Here is a realistic, end-to-end example of a well-structured session prompt for Antigravity:

```text
@AGENT_CONTEXT.md @ARCHITECTURE.md @DB_SCHEMA.md @API_SPEC.md @CONVENTIONS.md

My task for this session: Implement the `/events/{id}/volunteers/` endpoints for assigning and removing volunteers.

I have already pre-updated the following docs to reflect the new API endpoints and logic:
- DB_SCHEMA.md (checked volunteer assignment schema)
- API_SPEC.md (added endpoints for volunteer assignment)
- AGENT_CONTEXT.md (no model changes needed as events_volunteerassignment already exists)

Please provide the following deliverables:
1. Update `events/views.py` to add `EventVolunteerListView` and `EventVolunteerAssignmentView`.
2. Update `events/urls.py` with the new routes.
3. Update `events/services.py` with the business logic for assigning and removing volunteers, strictly enforcing the role check from the Active Decisions table.
4. Add unit tests for these new endpoints in `events/tests/test_views.py`.
```
