# API Specification
## C Square Club Website

**Version:** 1.0
**Status:** Active
**Last Updated:** June 2026
**Base URL:** `https://api.csquare.in/api`

---

## Critical Rule

**Update this document the same day you write or modify an endpoint.**
This file is the contract between backend and frontend.
Frontend never builds against assumptions — only against what is documented here.
Feed this file to Antigravity at the start of every session.

---

## General Conventions

### Authentication
All protected endpoints require a valid Django session cookie.
The session cookie is set automatically after magic link verification.
Unauthenticated requests to protected endpoints return `401`.

### Request Headers
```text
Content-Type: application/json
X-CSRFToken: <csrf_token>   # Required for all POST, PUT, PATCH, DELETE
```

### Response Format
All responses return JSON.
Success responses return the resource or a message.
Error responses always follow this shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message.",
    "fields": {
      "field_name": "Specific error message for this field."
    }
  }
}
```

**Note on `fields`:** The `fields` object is optional and only included for validation errors (like 400 Bad Request). It maps specific input field names (or field paths) to their respective error messages to help the frontend display inline form errors.

### Common Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | Logged in but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid input — see fields |
| `CONFLICT` | 409 | Duplicate or conflicting resource |
| `SERVER_ERROR` | 500 | Unexpected server error |

### Pagination
List endpoints return paginated responses:

```json
{
  "count": 100,
  "next": "https://api.csquare.in/api/events/?page=2",
  "previous": null,
  "results": []
}
```

Default page size: 20. Max page size: 100.
Pass `?page=2` or `?page_size=50` as query params.

### UUID
All `id` fields are UUID v4 strings.
Example: `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`

---

## Roles Reference

| Role | Access Level |
|---|---|
| `student` | Public endpoints + own dashboard |
| `volunteer` | Student access + check-in for assigned events |
| `admin` | Full access to everything |

---

## 1. Authentication

### POST /auth/magic-link/
Request a magic link. Sends an email with a one-time login link.

**Auth required:** No

**Request:**
```json
{
  "email": "student@cuchd.in"
}
```

**Response 200:**
```json
{
  "message": "Magic link sent. Check your email.",
  "email": "student@cuchd.in"
}
```

**Response 400:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "fields": {
      "email": "Enter a valid email address."
    }
  }
}
```

**Notes:**
- Rate limited to 5 requests per email per hour
- Does not reveal whether the email exists in the system
- If email is new, a user account is created on successful verification

---

### GET /auth/verify/
Verify a magic link token and create a session.

**Auth required:** No

**Query params:**
```text
?token=<sesame_token>
```

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@cuchd.in",
    "full_name": "Arjun Singh",
    "role": "student",
    "is_cu_student": true
  }
}
```
Sets `sessionid` cookie on response.

**Response 400:**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "This link is invalid or has expired. Please request a new one."
  }
}
```

---

### POST /auth/logout/
Log out the current user. Clears the session.

**Auth required:** Yes

**Request:** No body

**Response 200:**
```json
{
  "message": "Logged out successfully."
}
```

---

### GET /auth/me/
Get the currently logged-in user's profile.

**Auth required:** Yes

**Response 200:**
```json
{
  "id": "uuid",
  "email": "student@cuchd.in",
  "full_name": "Arjun Singh",
  "role": "student",
  "is_cu_student": true,
  "student_uid": "22BCS10001",
  "branch": "CSE",
  "year": 3,
  "semester": 5,
  "batch": "2022-2026",
  "phone": "9876543210"
}
```

---

## 2. Users

### PATCH /users/me/
Update the current user's profile fields.

**Auth required:** Yes

**Request:**
```json
{
  "full_name": "Arjun Singh",
  "student_uid": "22BCS10001",
  "branch": "CSE",
  "year": 3,
  "semester": 5,
  "batch": "2022-2026",
  "phone": "9876543210"
}
```
All fields optional — only provided fields are updated.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "student@cuchd.in",
  "full_name": "Arjun Singh",
  "role": "student",
  "is_cu_student": true,
  "student_uid": "22BCS10001",
  "branch": "CSE",
  "year": 3,
  "semester": 5,
  "batch": "2022-2026",
  "phone": "9876543210"
}
```

---

### GET /users/
List all users.

**Auth required:** Yes — Admin only

**Query params:**
```text
?role=student|volunteer|admin
?search=<name or email>
?page=1
```

**Response 200:**
```json
{
  "count": 500,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "email": "student@cuchd.in",
      "full_name": "Arjun Singh",
      "role": "student",
      "is_cu_student": true,
      "date_joined": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

### PATCH /users/{id}/role/
Change a user's role.

**Auth required:** Yes — Admin only

**Request:**
```json
{
  "role": "volunteer"
}
```
Role choices: `student`, `volunteer`, `admin`

**Response 200:**
```json
{
  "id": "uuid",
  "email": "volunteer@cuchd.in",
  "role": "volunteer"
}
```

**Response 400:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid role.",
    "fields": {
      "role": "Must be one of: student, volunteer, admin."
    }
  }
}
```

---

## 3. Events

### GET /events/
List all published events. Public endpoint.

**Auth required:** No

**Query params:**
```text
?status=published|completed|cancelled    # Default: published
?event_type=hackathon|competition|workshop|seminar
?upcoming=true                           # Only future events
?page=1
```

**Response 200:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "HackCU 2026",
      "event_type": "hackathon",
      "start_datetime": "2026-08-15T09:00:00Z",
      "end_datetime": "2026-08-16T18:00:00Z",
      "venue": "Block 10, Chandigarh University",
      "capacity": 200,
      "status": "published",
      "is_team_event": true,
      "is_open_to_external": true,
      "banner_image_url": "https://storage.azure.com/...",
      "registration_deadline": "2026-08-10T23:59:00Z",
      "registered_count": 145
    }
  ]
}
```

---

### GET /events/{id}/
Get a single event's full details. Public endpoint.

**Auth required:** No

**Response 200:**
```json
{
  "id": "uuid",
  "title": "HackCU 2026",
  "description": "<p>Join us for...</p>",
  "event_type": "hackathon",
  "start_datetime": "2026-08-15T09:00:00Z",
  "end_datetime": "2026-08-16T18:00:00Z",
  "venue": "Block 10, Chandigarh University",
  "capacity": 200,
  "status": "published",
  "is_team_event": true,
  "min_team_size": 2,
  "max_team_size": 4,
  "is_open_to_external": true,
  "banner_image_url": "https://storage.azure.com/...",
  "registration_deadline": "2026-08-10T23:59:00Z",
  "registered_count": 145,
  "created_at": "2026-07-01T10:00:00Z"
}
```

**Response 404:** Event not found or not published.

---

### POST /events/
Create a new event.

**Auth required:** Yes — Admin only

**Request:**
```json
{
  "title": "HackCU 2026",
  "description": "<p>Join us for...</p>",
  "event_type": "hackathon",
  "start_datetime": "2026-08-15T09:00:00Z",
  "end_datetime": "2026-08-16T18:00:00Z",
  "venue": "Block 10, Chandigarh University",
  "capacity": 200,
  "registration_deadline": "2026-08-10T23:59:00Z",
  "is_open_to_external": true,
  "is_team_event": true,
  "min_team_size": 2,
  "max_team_size": 4,
  "status": "draft"
}
```

**Response 201:**
Returns the full event object.

---

### PATCH /events/{id}/
Update an event.

**Auth required:** Yes — Admin only

**Request:**
All fields optional — only provided fields are updated.
```json
{
  "title": "HackCU 2026 — Updated",
  "status": "published"
}
```

**Response 200:**
Returns the full updated event object.

---

### DELETE /events/{id}/
Delete an event. Only allowed if status is `draft`.

**Auth required:** Yes — Admin only

**Response 204:** No content.

**Response 400:**
```json
{
  "error": {
    "code": "CANNOT_DELETE",
    "message": "Only draft events can be deleted. Cancel the event instead."
  }
}
```

---

### POST /events/{id}/banner/
Upload an event banner image.

**Auth required:** Yes — Admin only

**Request:** `multipart/form-data`
```text
banner: <file>   # jpg, png, webp only — max 5MB
```

**Response 200:**
```json
{
  "banner_image_url": "https://storage.azure.com/event-banners/uuid/banner.jpg"
}
```

**Response 400:**
```json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "File must be jpg, png, or webp and under 5MB."
  }
}
```

---

### GET /events/{id}/volunteers/
Get all volunteers assigned to an event.

**Auth required:** Yes — Admin only

**Response 200:**
```json
{
  "event_id": "uuid",
  "volunteers": [
    {
      "assignment_id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "Rahul Sharma",
        "email": "rahul@cuchd.in"
      },
      "assigned_by": "uuid",
      "created_at": "2026-07-01T10:00:00Z"
    }
  ]
}
```

---

### POST /events/{id}/volunteers/
Assign a volunteer to an event.

**Auth required:** Yes — Admin only

**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response 201:**
```json
{
  "assignment_id": "uuid",
  "event_id": "uuid",
  "volunteer": {
    "id": "uuid",
    "full_name": "Rahul Sharma",
    "email": "rahul@cuchd.in"
  }
}
```

**Response 400:**
```json
{
  "error": {
    "code": "NOT_A_VOLUNTEER",
    "message": "User must have the volunteer role to be assigned to an event."
  }
}
```

**Response 409:**
```json
{
  "error": {
    "code": "ALREADY_ASSIGNED",
    "message": "This volunteer is already assigned to this event."
  }
}
```

---

### DELETE /events/{id}/volunteers/{assignment_id}/
Remove a volunteer from an event.

**Auth required:** Yes — Admin only

**Response 204:** No content.

---

### GET /events/{id}/checkin-stats/
Get live check-in statistics for an event. Polled every 5 seconds on event day.

**Auth required:** Yes — Admin or assigned Volunteer

**Response 200:**
```json
{
  "event_id": "uuid",
  "total_approved": 450,
  "checked_in": 312,
  "remaining": 138,
  "waitlisted": 23,
  "pending": 5
}
```

---

## 4. Registrations

### POST /registrations/
Register for an event. Individual registration only.

**Auth required:** Yes — Student, Volunteer, or Admin

**Request:**
```json
{
  "event_id": "uuid",
  "full_name": "Arjun Singh",
  "student_uid": "22BCS10001",
  "branch": "CSE",
  "year": 3,
  "semester": 5,
  "batch": "2022-2026",
  "phone": "9876543210"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "status": "pending",
  "registered_at": "2026-07-15T14:30:00Z",
  "message": "Registration submitted. You will be notified once reviewed."
}
```

**Response 400 — Registration closed:**
```json
{
  "error": {
    "code": "REGISTRATION_CLOSED",
    "message": "Registration for this event has closed."
  }
}
```

**Response 400 — External not allowed:**
```json
{
  "error": {
    "code": "EXTERNAL_NOT_ALLOWED",
    "message": "This event is open to Chandigarh University students only."
  }
}
```

**Response 409 — Already registered:**
```json
{
  "error": {
    "code": "ALREADY_REGISTERED",
    "message": "You are already registered for this event."
  }
}
```

**Notes:**
- If event is at capacity, registration is automatically waitlisted
- User profile fields (branch, year, etc.) are updated from this request if not already set

---

### POST /registrations/team/
Register as a team for a team event.

**Auth required:** Yes — Student, Volunteer, or Admin

**Request:**
```json
{
  "event_id": "uuid",
  "team_name": "Team Nexus",
  "leader_details": {
    "full_name": "Arjun Singh",
    "student_uid": "22BCS10001",
    "branch": "CSE",
    "year": 3,
    "semester": 5,
    "batch": "2022-2026",
    "phone": "9876543210"
  },
  "teammates": [
    { "email": "teammate1@cuchd.in" },
    { "email": "teammate2@cuchd.in" }
  ]
}
```

**Response 201:**
```json
{
  "team_id": "uuid",
  "team_name": "Team Nexus",
  "status": "pending_confirmation",
  "message": "Team registration submitted. Invite emails sent to teammates.",
  "teammates": [
    {
      "email": "teammate1@cuchd.in",
      "has_confirmed": false
    },
    {
      "email": "teammate2@cuchd.in",
      "has_confirmed": false
    }
  ]
}
```

**Response 400 — Not a team event:**
```json
{
  "error": {
    "code": "NOT_A_TEAM_EVENT",
    "message": "This event does not support team registration."
  }
}
```

**Response 400 — Team size invalid:**
```json
{
  "error": {
    "code": "INVALID_TEAM_SIZE",
    "message": "Team size must be between 2 and 4 members."
  }
}
```

---

### GET /registrations/team/{team_id}/confirm/
Confirm a teammate's participation via the invite link.

**Auth required:** Yes (teammate must be logged in)

**Query params:**
```text
?token=<confirmation_token>
```

**Response 200:**
```json
{
  "message": "You have confirmed your participation in Team Nexus.",
  "team_id": "uuid",
  "team_name": "Team Nexus",
  "event": {
    "id": "uuid",
    "title": "HackCU 2026"
  }
}
```

**Response 400:**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "This confirmation link is invalid or has already been used."
  }
}
```

---

### GET /registrations/me/
Get all registrations for the currently logged-in user.

**Auth required:** Yes

**Query params:**
```text
?status=pending|approved|rejected|waitlisted|cancelled
?upcoming=true
```

**Response 200:**
```json
{
  "count": 3,
  "results": [
    {
      "id": "uuid",
      "event": {
        "id": "uuid",
        "title": "HackCU 2026",
        "start_datetime": "2026-08-15T09:00:00Z",
        "venue": "Block 10, Chandigarh University"
      },
      "status": "approved",
      "qr_image_url": "https://storage.azure.com/qr-codes/uuid/qr.png",
      "registered_at": "2026-07-15T14:30:00Z",
      "approved_at": "2026-07-16T10:00:00Z",
      "waitlist_position": null
    }
  ]
}
```

---

### GET /registrations/{id}/
Get a single registration detail.

**Auth required:** Yes — Owner, Admin, or assigned Volunteer

**Response 200:**
```json
{
  "id": "uuid",
  "event": {
    "id": "uuid",
    "title": "HackCU 2026",
    "start_datetime": "2026-08-15T09:00:00Z",
    "venue": "Block 10, Chandigarh University"
  },
  "user": {
    "id": "uuid",
    "full_name": "Arjun Singh",
    "email": "student@cuchd.in"
  },
  "status": "approved",
  "qr_image_url": "https://storage.azure.com/qr-codes/uuid/qr.png",
  "registered_at": "2026-07-15T14:30:00Z",
  "approved_at": "2026-07-16T10:00:00Z",
  "rejection_reason": null,
  "waitlist_position": null,
  "is_team_registration": false
}
```

---

### POST /registrations/{id}/cancel/
Cancel a registration.

**Auth required:** Yes — Owner or Admin

**Request:** No body

**Response 200:**
```json
{
  "id": "uuid",
  "status": "cancelled",
  "message": "Registration cancelled successfully."
}
```

**Response 400:**
```json
{
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Rejected or already cancelled registrations cannot be cancelled."
  }
}
```

---

### GET /registrations/event/{event_id}/
Get all registrations for a specific event.

**Auth required:** Yes — Admin only

**Query params:**
```text
?status=pending|approved|rejected|waitlisted|cancelled
?search=<name, email, or UID>
?page=1
```

**Response 200:**
```json
{
  "count": 145,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "Arjun Singh",
        "email": "student@cuchd.in",
        "student_uid": "22BCS10001",
        "branch": "CSE",
        "year": 3,
        "semester": 5,
        "batch": "2022-2026",
        "phone": "9876543210",
        "is_cu_student": true
      },
      "status": "pending",
      "registered_at": "2026-07-15T14:30:00Z",
      "waitlist_position": null,
      "is_team_registration": false
    }
  ]
}
```

---

### POST /registrations/{id}/approve/
Approve a registration. Generates QR code and sends confirmation email.

**Auth required:** Yes — Admin only

**Request:** No body

**Response 200:**
```json
{
  "id": "uuid",
  "status": "approved",
  "qr_token": "uuid",
  "qr_image_url": "https://storage.azure.com/qr-codes/uuid/qr.png",
  "approved_at": "2026-07-16T10:00:00Z",
  "message": "Registration approved. Confirmation email sent."
}
```

---

### POST /registrations/{id}/reject/
Reject a registration with a reason.

**Auth required:** Yes — Admin only

**Request:**
```json
{
  "reason": "Event capacity has been allocated to priority registrations."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "rejected",
  "rejection_reason": "Event capacity has been allocated to priority registrations.",
  "message": "Registration rejected. Notification email sent."
}
```

---

### POST /registrations/{id}/move-from-waitlist/
Manually move a waitlisted registration to pending.

**Auth required:** Yes — Admin only

**Request:** No body

**Response 200:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Registration moved from waitlist to pending. Student notified."
}
```

---

## 5. Attendance

### POST /attendance/checkin/
Mark attendance via QR code scan.

**Auth required:** Yes — Admin or assigned Volunteer

**Request:**
```json
{
  "qr_token": "uuid",
  "event_id": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "student": {
    "full_name": "Arjun Singh",
    "student_uid": "22BCS10001",
    "branch": "CSE"
  },
  "checked_in_at": "2026-08-15T09:45:00Z",
  "message": "Check-in successful."
}
```

**Response 400 — Already checked in:**
```json
{
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "This student has already checked in.",
    "checked_in_at": "2026-08-15T09:32:00Z"
  }
}
```

**Response 400 — Wrong event:**
```json
{
  "error": {
    "code": "WRONG_EVENT",
    "message": "This QR code is not valid for this event."
  }
}
```

**Response 400 — Invalid token:**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "This QR code is invalid."
  }
}
```

**Response 400 — Not approved:**
```json
{
  "error": {
    "code": "NOT_APPROVED",
    "message": "This registration has not been approved."
  }
}
```

**Response 403 — Volunteer not assigned:**
```json
{
  "error": {
    "code": "NOT_ASSIGNED",
    "message": "You are not assigned to this event."
  }
}
```

---

### POST /attendance/{registration_id}/manual-checkin/
Mark attendance manually from the attendance list.

**Auth required:** Yes — Admin or assigned Volunteer

**Request:** No body

**Response 200:**
```json
{
  "success": true,
  "student": {
    "full_name": "Arjun Singh",
    "student_uid": "22BCS10001"
  },
  "checked_in_at": "2026-08-15T09:45:00Z",
  "check_in_method": "manual",
  "message": "Attendance marked manually."
}
```

Same error responses as QR check-in where applicable.

---

### GET /attendance/{event_id}/list/
Get the full attendance list for an event. Used for the manual check-in page.

**Auth required:** Yes — Admin or assigned Volunteer

**Query params:**
```text
?search=<name, email, or UID>
?checked_in=true|false
?page=1
```

**Response 200:**
```json
{
  "count": 450,
  "next": "...",
  "previous": null,
  "results": [
    {
      "registration_id": "uuid",
      "user": {
        "full_name": "Arjun Singh",
        "email": "student@cuchd.in",
        "student_uid": "22BCS10001",
        "branch": "CSE",
        "year": 3
      },
      "is_checked_in": false,
      "checked_in_at": null,
      "check_in_method": null
    }
  ]
}
```

---

### GET /attendance/{event_id}/export/
Export attendance data as CSV.

**Auth required:** Yes — Admin only

**Response 200:**
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="hackcu-2026-attendance.csv"

Full Name, Email, Student UID, Branch, Year, Semester, Batch, Phone, Status, Checked In, Check-in Time, Method
Arjun Singh, student@cuchd.in, 22BCS10001, CSE, 3, 5, 2022-2026, 9876543210, approved, Yes, 2026-08-15 09:45, qr
...
```

---

## 6. Team Members (Public Page)

### GET /team/
Get all active team members for the public page.

**Auth required:** No

**Response 200:**
```json
{
  "results": [
    {
      "id": "uuid",
      "full_name": "Arjun Singh",
      "designation": "Secretary",
      "photo_url": "https://storage.azure.com/team-photos/uuid/photo.jpg",
      "display_order": 1
    }
  ]
}
```

---

### POST /team/
Add a team member.

**Auth required:** Yes — Admin only

**Request:** `multipart/form-data`
```text
full_name: Arjun Singh
designation: Secretary
display_order: 1
photo: <file>   # jpg, png, webp only — max 2MB
```

**Response 201:**
```json
{
  "id": "uuid",
  "full_name": "Arjun Singh",
  "designation": "Secretary",
  "photo_url": "https://storage.azure.com/team-photos/uuid/photo.jpg",
  "display_order": 1,
  "is_active": true
}
```

---

### PATCH /team/{id}/
Update a team member.

**Auth required:** Yes — Admin only

**Request:** `multipart/form-data` or `application/json`
All fields optional.

**Response 200:**
Returns the full updated team member object.

---

### DELETE /team/{id}/
Remove a team member (sets is_active=False, does not delete the record).

**Auth required:** Yes — Admin only

**Response 200:**
```json
{
  "message": "Team member hidden from public page."
}
```

---

## 7. Endpoint Summary

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | /auth/magic-link/ | No | — |
| GET | /auth/verify/ | No | — |
| POST | /auth/logout/ | Yes | Any |
| GET | /auth/me/ | Yes | Any |
| PATCH | /users/me/ | Yes | Any |
| GET | /users/ | Yes | Admin |
| PATCH | /users/{id}/role/ | Yes | Admin |
| GET | /events/ | No | — |
| GET | /events/{id}/ | No | — |
| POST | /events/ | Yes | Admin |
| PATCH | /events/{id}/ | Yes | Admin |
| DELETE | /events/{id}/ | Yes | Admin |
| POST | /events/{id}/banner/ | Yes | Admin |
| GET | /events/{id}/volunteers/ | Yes | Admin |
| POST | /events/{id}/volunteers/ | Yes | Admin |
| DELETE | /events/{id}/volunteers/{assignment_id}/ | Yes | Admin |
| GET | /events/{id}/checkin-stats/ | Yes | Admin, Volunteer |
| POST | /registrations/ | Yes | Any |
| POST | /registrations/team/ | Yes | Any |
| GET | /registrations/team/{team_id}/confirm/ | Yes | Any |
| GET | /registrations/me/ | Yes | Any |
| GET | /registrations/{id}/ | Yes | Owner, Admin, Volunteer |
| POST | /registrations/{id}/cancel/ | Yes | Owner, Admin |
| GET | /registrations/event/{event_id}/ | Yes | Admin |
| POST | /registrations/{id}/approve/ | Yes | Admin |
| POST | /registrations/{id}/reject/ | Yes | Admin |
| POST | /registrations/{id}/move-from-waitlist/ | Yes | Admin |
| POST | /attendance/checkin/ | Yes | Admin, Volunteer |
| POST | /attendance/{registration_id}/manual-checkin/ | Yes | Admin, Volunteer |
| GET | /attendance/{event_id}/list/ | Yes | Admin, Volunteer |
| GET | /attendance/{event_id}/export/ | Yes | Admin |
| GET | /team/ | No | — |
| POST | /team/ | Yes | Admin |
| PATCH | /team/{id}/ | Yes | Admin |
| DELETE | /team/{id}/ | Yes | Admin |
