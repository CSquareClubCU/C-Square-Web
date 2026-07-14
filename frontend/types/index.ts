// ============================================================================
// Domain Types — C Square Club
// All types mirror the API_SPEC.md response shapes exactly.
// ============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = "student" | "volunteer" | "admin";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventType = "hackathon" | "competition" | "workshop" | "seminar";
export type RegistrationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "cancelled";
export type TeamStatus =
  | "pending_confirmation"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "cancelled";
export type CheckInMethod = "qr" | "manual";

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_cu_student: boolean;
  student_uid: string | null;
  batch: string | null;
  phone: string | null;
  institution: string | null;
  degree_type: string | null;
  graduation_year: number | null;
  club_points: number;
  club_rank: number | null;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface Prize {
  position: string;
  award: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export interface Prize {
  position: string;
  award: string;
  description: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  venue: string;
  capacity: number;
  registration_deadline: string;
  status: EventStatus;
  is_team_event: boolean;
  is_open_to_external: boolean;
  banner_image_url: string | null;
  registered_count: number;
  created_at?: string;
  // Team-event fields (only present when is_team_event=true)
  min_team_size?: number | null;
  max_team_size?: number | null;
  // Enhancements
  prizes: Prize[] | null;
  rules: string | null;
  contact_name: string | null;
  contact_email: string | null;
  is_registration_open: boolean;
<<<<<<< HEAD
  is_flagship: boolean;
  points: number;
  faqs: { question: string; answer: string }[] | null;
}

export interface PastEvent {
  id: string;
  title: string;
  logo_url: string | null;
  order: number;
  created_at?: string;
  updated_at?: string;
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/** Compact event summary nested inside a registration (student view). */
export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  venue: string;
<<<<<<< HEAD
  status: EventStatus;
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
}

/** Registration as seen by the student (GET /registrations/me/ and /registrations/{id}/). */
export interface Registration {
  id: string;
  event: EventSummary;
  status: RegistrationStatus;
  qr_token: string | null;
  qr_image_url: string | null;
  rejection_reason: string | null;
  waitlist_position: number | null;
  is_team_registration: boolean;
  team: string | null; // UUID of the team
  registered_at: string;
  approved_at: string | null;
  // Populated in RegistrationDetailSerializer
  user_email?: string;
  user_full_name?: string;
  user_student_uid?: string | null;
}

/** Registration as seen by an admin (GET /registrations/event/{event_id}/). */
export interface RegistrationAdmin {
  id: string;
  event: string; // UUID
  event_title: string;
  event_type: EventType;
  user: string; // UUID
  user_email: string;
  user_full_name: string;
  user_student_uid: string | null;
<<<<<<< HEAD
=======
  user_branch: string | null;
  user_year: number | null;
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  user_phone: string | null;
  status: RegistrationStatus;
  qr_token: string | null;
  qr_image_url: string | null;
  rejection_reason: string | null;
  waitlist_position: number | null;
  is_team_registration: boolean;
  team: string | null;
  registered_at: string;
  approved_at: string | null;
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamMemberRecord {
  id: string;
  email: string;
  has_confirmed: boolean;
  confirmed_at: string | null;
  user: string | null; // UUID
}

export interface Team {
  id: string;
  event: string; // UUID
  event_title: string;
  name: string;
  leader: string; // UUID
  leader_email: string;
  leader_full_name: string;
  status: TeamStatus;
  members: TeamMemberRecord[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  registration_id: string;
  user_full_name: string;
  user_email: string;
  user_student_uid: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  check_in_method: CheckInMethod | null;
  marked_by_email: string | null;
}

/** Response from POST /attendance/checkin/ and /manual-checkin/ */
export interface CheckinResponse {
  success: boolean;
  already_checked_in: boolean;
  message: string;
  event_id: string;
  registration_id: string;
  student: {
    full_name: string;
    email: string;
    student_uid: string | null;
<<<<<<< HEAD
    institution: string | null;
    degree_type: string | null;
    graduation_year: number | null;
=======
    branch: string | null;
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  };
  checked_in_at: string | null;
  check_in_method: CheckInMethod | null;
}

/** Response from GET /events/{id}/checkin-stats/ */
export interface CheckinStats {
  event_id: string;
  total_approved: number;
  checked_in: number;
  remaining: number;
  waitlisted: number;
  pending: number;
}

// ---------------------------------------------------------------------------
<<<<<<< HEAD
// Public Core Team Page
// ---------------------------------------------------------------------------

/** Core Team member as shown on the public /team page. */
export interface CoreTeamMemberPublic {
=======
// Public Team Page
// ---------------------------------------------------------------------------

/** Team member as shown on the public /team page. */
export interface TeamMemberPublic {
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  id: string;
  full_name: string;
  designation: string;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
<<<<<<< HEAD
  user: string | null; // UUID
  user_email?: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

/** Standard paginated response envelope from the backend. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Standard error shape returned by the backend global exception handler. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}
