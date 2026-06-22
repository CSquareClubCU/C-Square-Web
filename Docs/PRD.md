# Product Requirements Document
## C Square Club Website

**Club:** C Square Club, Chandigarh University
**Document version:** 1.1
**Status:** Active

---

## 1. Overview

C Square Club is a technical club at Chandigarh University that hosts coding competitions, hackathons, workshops, and seminars. This website is the club's official platform for event discovery, student registration, admin event management, and QR-based attendance check-in on event day.

The primary inspiration for the admin experience is Luma. The primary inspiration for the event registration experience is Devfolio.

---

## 2. Users and Roles

### 2.1 Student (Default)
Any student who logs in via magic link. Students can discover events, register individually or as a team, and check in on event day using their QR code. CU students are identified by their `@cuchd.in` or `@cumail.in` email domain.

### 2.2 Admin
Club members with full platform access. Admins create and manage events, review and approve or reject registration requests, assign volunteers to events, mark attendance, and access attendance reports. There is no permission hierarchy within the admin role — all admins have equal access.

### 2.3 Volunteer
Club members assigned to specific events by an admin. Volunteers can access the QR scanner and attendance list only for their assigned events. They mark student attendance by scanning QR codes or using the manual attendance list on their personal devices. Volunteer profiles are publicly listed on the website's team page.

---

## 3. Core Features

### 3.1 Authentication

The platform uses a single authentication method for all users — magic link login. No passwords, no OAuth providers, no third party identity dependency.

**How it works for everyone:**
1. User visits the login page and enters their email address
2. System sends a one-time magic link to that email, valid for 15 minutes
3. User clicks the link and is immediately logged in
4. If the link expires, they request a new one — no friction

**CU Students (`@cuchd.in` or `@cumail.in`):**
- Enter their university email address
- Magic link is sent to their CU inbox
- On first login, automatically assigned the student role
- Can only register for events open to CU students or all participants

**External Students (any other email):**
- Enter their personal email address
- Magic link is sent to their personal inbox
- On first login, automatically assigned the student role
- Can only register for events explicitly marked as open to external participants by admin

**Domain-based access control:**
- CU vs external distinction is determined by email domain at login time
- `@cuchd.in` or `@cumail.in` → CU student
- Any other domain → external student
- This is enforced at the registration level per event, not at the auth level

**Role assignment:**
- All new users default to the student role on first login
- Admins and volunteers are manually assigned their roles by existing admins through the dashboard
- Role changes take effect on the user's next login

**Implementation:**
- `django-sesame` handles magic link token generation, signing, and validation
- Azure Communication Services sends the magic link email
- Tokens are UUID-based, signed, and time-limited to 15 minutes
- Standard Django session management takes over after login

### 3.2 Public Website

- Homepage with club description, upcoming events, and team showcase
- Events listing page — all upcoming and past events publicly visible
- Individual event detail page — title, description, date, time, venue, capacity, registration status
- Team page — publicly listed club members and volunteers with name, photo, and designation
- All public pages are accessible without logging in
- SEO optimised for event discovery within CU

### 3.3 Event Management (Admin)

Admins can create and manage events with the following fields:

| Field | Type | Notes |
|---|---|---|
| Title | Text | Required |
| Description | Rich text | Supports formatting |
| Event type | Select | Hackathon, Competition, Workshop, Seminar |
| Date and time | DateTime | Start and end |
| Venue | Text | Location within CU campus |
| Capacity | Integer | Maximum attendees |
| Registration deadline | DateTime | After this, registration closes |
| Open to external participants | Boolean | Controls whether non-CU students can register |
| Team event | Boolean | Enables team registration flow |
| Min team size | Integer | Only if team event |
| Max team size | Integer | Only if team event |
| Assigned volunteers | Multi-select | Volunteers assigned to this event only |
| Banner image | Image | Uploaded to Azure Blob Storage |
| Status | Select | Draft, Published, Cancelled, Completed |

Admins can:
- Create, edit, publish, unpublish, and cancel events
- View all registrations for an event with full student details
- Approve or reject individual registrations
- Move waitlisted registrations to pending manually
- Assign volunteers to specific events
- Export attendance data as CSV
- View real-time check-in count on event day
- Access the searchable attendance list and mark attendance manually

### 3.4 Registration Flow

#### Individual Events
1. Student visits event page and clicks Register
2. Student fills registration form — fields collected below
3. Registration is submitted with status `pending`
4. Admin reviews and approves or rejects
5. On approval — student receives confirmation email with QR code and event details
6. On rejection — student receives notification email with reason

#### Team Events (Hackathons)
1. Team leader visits event page and clicks Register as Team
2. Team leader fills their own details and adds teammates by their email address
3. Teammates receive an email to confirm their participation
4. Once all teammates confirm, registration is submitted with status `pending`
5. Admin reviews and approves or rejects the entire team as one unit
6. On approval — all team members receive individual confirmation emails with their own QR codes
7. On rejection — team leader receives notification with reason

#### Registration Fields Collected
- Full name
- Email address
- Student UID
- Branch
- Year
- Semester
- Batch
- Phone number

#### Capacity and Waitlist
- When an event reaches maximum capacity, new registrations are automatically added to a waitlist with status `waitlisted`
- If an approved registration is cancelled, the first person on the waitlist is automatically moved to `pending` and notified
- Admin can manually move waitlisted registrations to pending for review

#### Registration Statuses
- `pending` — submitted, awaiting admin review
- `approved` — admin approved, QR code sent
- `rejected` — admin rejected, notification sent
- `waitlisted` — event full, on waitlist
- `cancelled` — student or admin cancelled

### 3.5 QR Check-in and Attendance System

**QR Code Generation:**
- On registration approval, a unique UUID token is generated per registration
- QR code is generated from this token and included in the confirmation email
- QR code is also accessible from the student's dashboard at any time

**On Event Day — QR Scanning:**
- Admins and assigned volunteers open the check-in page on their personal device (mobile-optimised)
- They scan a student's QR code using their device camera
- System validates the token — checks event, registration status, and whether already checked in
- On valid scan — attendance is marked, check-in timestamp recorded, success confirmation shown
- On invalid scan — clear error shown: already checked in / invalid token / wrong event

**On Event Day — Manual Attendance (Fallback):**
- Admins and assigned volunteers can also access a searchable attendance list
- List shows all approved registrations for the event
- Searchable by name, UID, or email
- Each entry has a checkbox to mark as present
- Both QR scanning and manual marking update the same attendance record

**Admin Dashboard:**
- Live check-in counter visible on the event dashboard
- Real-time count of checked-in vs total approved registrations

### 3.6 Email Notifications

All emails are sent from the club's official email address.

| Trigger | Recipient | Content |
|---|---|---|
| Registration submitted | Student | Confirmation of submission, pending review |
| Registration approved | Student | QR code, event details, venue, date, what to bring |
| Registration rejected | Student | Rejection notification with reason from admin |
| Waitlist position | Student | Notified of waitlist position |
| Moved off waitlist | Student | Notified that a spot opened, registration now pending |
| Teammate invite | Teammate | Link to confirm participation in team |
| Event reminder | Approved students | 24 hours before event — venue, time, QR code reminder |

### 3.7 Student Dashboard

After logging in, students can:
- View all their registrations and current status
- Download or view their QR code for approved registrations
- Cancel a pending or approved registration
- View upcoming events they are registered for

### 3.8 Team Members Page

- Public page listing club members and volunteers
- Each profile includes name, photo, and designation
- Managed entirely by admins through the Django Admin dashboard
- No system permissions are attached to appearing on this page
- A club member can appear on the team page without having admin or volunteer system access

### 3.9 Volunteer Management (Admin)

- Admins assign volunteers to specific events from the admin dashboard
- Volunteers can only access the check-in scanner and attendance list for their assigned events
- Volunteers cannot access event management, registration approvals, or any other admin functionality
- Volunteer profiles are managed by admins and appear on the public team page

---

## 4. Out of Scope for v1

- Payment gateway or paid events
- Mobile app (iOS or Android)
- Public API
- Social features (comments, likes, sharing)
- Custom email domains per event
- Certificate generation post-event
- Sponsor management
- Multi-language support
- Celery / background task queue (emails sent synchronously in v1)

---

## 5. Non-Functional Requirements

### 5.1 Scale
- Expected peak: 1000 concurrent users during large event registrations
- Database must handle 1000+ users, 50+ events, and full attendance records without performance issues

### 5.2 Authentication
- Magic link login for all users — no passwords, no OAuth providers
- CU vs external distinction enforced at the event registration level via email domain (`@cuchd.in` or `@cumail.in`)

### 5.3 Availability
- Website must be live and stable on event days — this is non-negotiable
- Azure App Service with standard tier provides sufficient uptime guarantees

### 5.4 Mobile Responsiveness
- Student-facing pages must be fully responsive — students will register and view QR codes on mobile
- Check-in scanner and manual attendance list must work on mobile browsers (camera access required for QR)
- Admin dashboard can be desktop-first

### 5.5 Security
- No secrets or credentials in code or version control
- All environment variables via Azure App Service configuration
- QR tokens are UUID-based — not guessable or sequential
- Check-in page is auth-protected — only admins and assigned volunteers can access it
- Volunteers can only access check-in for their assigned events

### 5.6 Branding
- Club has existing logos in black and white
- Design system follows club's black and white brand identity
- Clean, minimal, technical aesthetic

---

## 6. Success Metrics for v1

- A student can discover an event, register, get approved, and receive a QR code end to end
- An admin or volunteer can scan a QR code and mark attendance without errors
- An admin can create an event, manage registrations, and export attendance data
- The manual attendance list is searchable and functional as a fallback on event day
- The system handles an event with 1000 registrations without performance issues
- Zero manual processes required on event day outside the platform

---

## 7. Phased Delivery

### Phase 1 — Foundation (Weeks 1–2)
Magic link auth, base Django project, base Next.js project, Azure infrastructure provisioned, public homepage, events listing page

### Phase 2 — Core Features (Weeks 3–5)
Event creation and management, individual and team registration flow, approval workflow, email notifications, student dashboard, Django Admin configuration, volunteer assignment

### Phase 3 — Check-in System (Weeks 6–7)
QR code generation, confirmation email with QR, QR scanner page (mobile-optimised), manual searchable attendance list, attendance marking, live check-in counter, waitlist automation

### Phase 4 — Polish (Week 8)
Mobile responsiveness, SEO, error handling, edge cases, CSV export, team page, performance testing at scale

### Phase 5 — Ship and Iterate
Deploy to production, gather feedback from first real event, fix bugs, plan v2 features

---

## 8. Decisions Log

| Decision | Outcome |
|---|---|
| Email service | Azure Communication Services — covered under Azure credits |
| Domain | Already registered — to be configured in Phase 1 |
| Initial admins | Seeded at launch by the core club team |
| Notification email | `csquare.core@gmail.com` for now, migrated to official club email post-launch |
| Authentication | Magic link via django-sesame — single method for all users |
| Microsoft Entra ID | Removed — magic link achieves the same result with zero external dependency |
| Volunteer role | Retained — per-event assignment, check-in and attendance list access only |
| QR check-in | Retained in v1 — admin and assigned volunteers can scan |
| Manual attendance | Added as Option C fallback — searchable list with checkboxes |
| Background tasks | Synchronous in v1 — Celery/Redis deferred to v2 |
| External participants | Supported via event-level toggle — domain check enforces CU vs external |
