# Database Schema
## C Square Club Website

**Version:** 1.0
**Status:** Active
**Last Updated:** June 2026

---

## Critical Rule

**Update this document before modifying any Django model.**
This file is the single source of truth for the database schema.
The Django model implements what is defined here — not the other way around.
Feed this file to Antigravity at the start of every backend session.

---

## Overview

```
users_user
    │
    ├──── registrations_registration (user → event)
    │               │
    │               └──── attendance_attendancerecord
    │
    ├──── registrations_team (team_leader)
    │               │
    │               └──── registrations_teammember (user → team)
    │
    └──── events_volunteerassignment (volunteer → event)

events_event
    │
    ├──── registrations_registration
    ├──── events_volunteerassignment
    └──── attendance_attendancerecord

team_teammember (standalone — public listing only)
```

---

## 1. users_user

Custom user model. Extends Django's AbstractBaseUser. Every person who logs in via magic link gets a record here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| email | VARCHAR(254) | UNIQUE, NOT NULL | Primary identifier |
| full_name | VARCHAR(255) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL, default='student' | Choices: student, volunteer, admin |
| is_cu_student | BOOLEAN | NOT NULL, default=False | True if email domain is cuchd.in or cumail.in |
| student_uid | VARCHAR(20) | NULL | CU student UID — collected at first registration |
| branch | VARCHAR(100) | NULL | e.g. CSE, ECE, MBA |
| year | INTEGER | NULL | 1–5 |
| semester | INTEGER | NULL | 1–10 |
| batch | VARCHAR(20) | NULL | e.g. 2022–2026 |
| phone | VARCHAR(15) | NULL | |
| is_active | BOOLEAN | NOT NULL, default=True | |
| is_staff | BOOLEAN | NOT NULL, default=False | Required for Django Admin access |
| date_joined | TIMESTAMPTZ | NOT NULL, default=now | |
| last_login | TIMESTAMPTZ | NULL | Updated by Django on each login |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Indexes:**
- `email` — unique index (already enforced by UNIQUE constraint)
- `role` — index for filtering by role

**Notes:**
- `student_uid`, `branch`, `year`, `semester`, `batch`, `phone` are NULL on first login
- These fields are collected when a student submits their first registration
- `is_cu_student` is set automatically based on email domain at first login
- `is_staff=True` required for Django Admin — only set for admin role users

---

## 2. events_event

Stores all club events — hackathons, competitions, workshops, seminars.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NOT NULL | Rich text — stored as HTML |
| event_type | VARCHAR(20) | NOT NULL | Choices: hackathon, competition, workshop, seminar |
| start_datetime | TIMESTAMPTZ | NOT NULL | |
| end_datetime | TIMESTAMPTZ | NOT NULL | |
| venue | VARCHAR(255) | NOT NULL | |
| capacity | INTEGER | NOT NULL | Maximum approved registrations |
| registration_deadline | TIMESTAMPTZ | NOT NULL | After this, registration closes |
| is_open_to_external | BOOLEAN | NOT NULL, default=False | If True, non-CU students can register |
| is_team_event | BOOLEAN | NOT NULL, default=False | If True, enables team registration flow |
| min_team_size | INTEGER | NULL | Only set if is_team_event=True |
| max_team_size | INTEGER | NULL | Only set if is_team_event=True |
| banner_image_url | VARCHAR(500) | NULL | Azure Blob Storage URL |
| status | VARCHAR(20) | NOT NULL, default='draft' | Choices: draft, published, cancelled, completed |
| created_by | UUID | FK → users_user.id, NOT NULL | Admin who created the event |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Indexes:**
- `status` — for filtering published events
- `start_datetime` — for ordering and upcoming event queries
- `event_type` — for filtering by type

**Notes:**
- Only `published` events are visible on the public listing page
- `capacity` counts approved registrations only — pending and waitlisted don't count
- `min_team_size` and `max_team_size` must both be set if `is_team_event=True`

---

## 3. events_volunteerassignment

Links volunteers to specific events. A volunteer can only access check-in for events they are assigned to.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| event | UUID | FK → events_event.id, NOT NULL | |
| volunteer | UUID | FK → users_user.id, NOT NULL | Must have role=volunteer |
| assigned_by | UUID | FK → users_user.id, NOT NULL | Admin who made the assignment |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |

**Constraints:**
- UNIQUE (`event`, `volunteer`) — a volunteer can only be assigned to an event once

**Indexes:**
- `event` — for fetching all volunteers for an event
- `volunteer` — for fetching all events a volunteer is assigned to

---

## 4. registrations_registration

Core registration table. Links a user to an event with a status and QR token.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| event | UUID | FK → events_event.id, NOT NULL | |
| user | UUID | FK → users_user.id, NOT NULL | |
| status | VARCHAR(20) | NOT NULL, default='pending' | Choices: pending, approved, rejected, waitlisted, cancelled |
| qr_token | UUID | UNIQUE, NULL | Generated on approval — unique per registration |
| qr_image_url | VARCHAR(500) | NULL | Azure Blob Storage URL — set when QR is generated |
| rejection_reason | TEXT | NULL | Set by admin on rejection |
| waitlist_position | INTEGER | NULL | Set when status=waitlisted |
| is_team_registration | BOOLEAN | NOT NULL, default=False | True if part of a team registration |
| team | UUID | FK → registrations_team.id, NULL | Set if is_team_registration=True |
| registered_at | TIMESTAMPTZ | NOT NULL, default=now | |
| approved_at | TIMESTAMPTZ | NULL | Set when status changes to approved |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Constraints:**
- UNIQUE (`event`, `user`) — a user can only register once per event

**Indexes:**
- `event` — for fetching all registrations for an event
- `user` — for fetching all registrations for a user
- `status` — for filtering by status
- `qr_token` — for fast QR check-in lookup (unique index)
- `waitlist_position` — for ordering waitlist

**Notes:**
- `qr_token` and `qr_image_url` are NULL until status changes to `approved`
- `waitlist_position` is set when capacity is full and status=`waitlisted`
- When a registration is cancelled, the waitlist auto-promotion logic runs

---

## 5. registrations_team

Groups individual registrations for team events. One team per event registration.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| event | UUID | FK → events_event.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | Team name |
| leader | UUID | FK → users_user.id, NOT NULL | User who initiated the team registration |
| status | VARCHAR(20) | NOT NULL, default='pending_confirmation' | Choices: pending_confirmation, pending_approval, approved, rejected, cancelled |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Indexes:**
- `event` — for fetching all teams for an event
- `leader` — for fetching teams by leader
- `status` — for filtering by status

**Notes:**
- `status=pending_confirmation` means waiting for all teammates to confirm
- `status=pending_approval` means all teammates confirmed, awaiting admin review
- When admin approves a team, all linked `registrations_registration` records are approved together

---

## 6. registrations_teammember

Links individual users to a team. Each teammate gets their own record here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| team | UUID | FK → registrations_team.id, NOT NULL | |
| user | UUID | FK → users_user.id, NULL | NULL until teammate confirms and logs in |
| email | VARCHAR(254) | NOT NULL | Email used to invite the teammate |
| has_confirmed | BOOLEAN | NOT NULL, default=False | True when teammate clicks confirmation link |
| confirmation_token | UUID | UNIQUE, NULL | Token sent in invite email — invalidated on confirm |
| confirmed_at | TIMESTAMPTZ | NULL | Set when has_confirmed becomes True |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |

**Constraints:**
- UNIQUE (`team`, `email`) — same email can't be added to same team twice

**Indexes:**
- `team` — for fetching all members of a team
- `confirmation_token` — for fast lookup on confirmation click
- `email` — for checking if email is already in a team

**Notes:**
- `user` is NULL when the teammate is first added — they may not have an account yet
- `user` is populated when the teammate clicks the confirmation link and logs in
- `confirmation_token` is invalidated (set to NULL) after confirmation

---

## 7. attendance_attendancerecord

Tracks check-in status per registration. One record per registration — created on registration approval.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| registration | UUID | FK → registrations_registration.id, UNIQUE, NOT NULL | One record per registration |
| event | UUID | FK → events_event.id, NOT NULL | Denormalised for fast event-level queries |
| user | UUID | FK → users_user.id, NOT NULL | Denormalised for fast user-level queries |
| is_checked_in | BOOLEAN | NOT NULL, default=False | |
| checked_in_at | TIMESTAMPTZ | NULL | Set when is_checked_in becomes True |
| check_in_method | VARCHAR(10) | NULL | Choices: qr, manual |
| marked_by | UUID | FK → users_user.id, NULL | Admin or volunteer who marked attendance |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Indexes:**
- `event` — for fetching all attendance records for an event
- `is_checked_in` — for counting checked-in vs total
- `registration` — unique index (already enforced by UNIQUE constraint)

**Notes:**
- Record is created automatically when a registration is approved
- `event` and `user` are denormalised here to avoid JOINs on the event dashboard query
- `check_in_method` distinguishes QR scan from manual marking for reporting

---

## 8. team_teammember

Public team page listing. No relation to the volunteer system — purely for display.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default uuid4 | |
| full_name | VARCHAR(255) | NOT NULL | |
| designation | VARCHAR(100) | NOT NULL | e.g. President, Technical Lead, Volunteer |
| photo_url | VARCHAR(500) | NULL | Azure Blob Storage URL |
| display_order | INTEGER | NOT NULL, default=0 | Controls order on public page |
| is_active | BOOLEAN | NOT NULL, default=True | If False, hidden from public page |
| created_at | TIMESTAMPTZ | NOT NULL, default=now | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-update | |

**Indexes:**
- `display_order` — for ordered listing
- `is_active` — for filtering active members

**Notes:**
- This table has no FK to `users_user` — a team member does not need a system account
- Managed entirely through Django Admin by admins
- `designation` is free text — not an enum, to allow flexibility

---

## Summary Table

| Table | Rows at Scale | Notes |
|---|---|---|
| users_user | ~5,000 | Grows with each new student who registers |
| events_event | ~200 | ~50 events per year |
| events_volunteerassignment | ~500 | ~2–5 volunteers per event |
| registrations_registration | ~50,000 | ~200–1000 per event |
| registrations_team | ~2,000 | Hackathon teams only |
| registrations_teammember | ~8,000 | ~3–4 members per team |
| attendance_attendancerecord | ~50,000 | One per approved registration |
| team_teammember | ~50 | Club team page |

All well within PostgreSQL free tier limits and Azure Flexible Server capacity.

---

## Migration Strategy

- Never edit a migration file manually
- Always run `python manage.py makemigrations` after updating a model
- Always run `python manage.py migrate` before deploying
- Migration files are committed to version control
- Never squash migrations in v1

## Schema Change Process

1. Update this document (`DB_SCHEMA.md`) first
2. Update `AGENT_CONTEXT.md` to note the change
3. Update the Django model in the relevant app
4. Run `python manage.py makemigrations`
5. Review the generated migration file before committing
6. Run `python manage.py migrate` locally to verify
7. Commit both the model change and the migration together in one commit
