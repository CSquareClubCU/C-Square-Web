/**
 * lib/api.ts
 *
 * Centralised API client for all backend calls.
 *
 * Rules:
 * - All requests go to BASE_URL (Django backend)
 * - Session auth: `credentials: "include"` on every request
 * - CSRF: fetch the token first via getCsrfToken(), then include
 *         X-CSRFToken header on all state-changing requests.
 * - Errors: backend returns { error: { code, message, fields? } }
 *           All errors are thrown as Error with the message.
 */

import type {
  User,
  Event,
  Registration,
  RegistrationAdmin,
  CheckinStats,
  AttendanceRecord,
  CoreTeamMemberPublic,
  PaginatedResponse,
  EventType,
  EventStatus,
  CheckinResponse,
} from "@/types";

// ============================================================================
// Base URL
// ============================================================================

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "");

// ============================================================================
// CSRF Helper
// ============================================================================

let _csrfToken: string | null = null;

/**
 * Fetches and caches the CSRF token from the backend.
 * Called automatically before any state-changing request.
 */
export async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;

  const res = await fetch(`${BASE_URL}/auth/csrf/`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token.");
  }
  const data = await res.json();
  _csrfToken = data.csrfToken as string;
  return _csrfToken;
}

/**
 * Call this to invalidate the cached CSRF token (e.g., after logout).
 */
export function invalidateCsrfToken(): void {
  _csrfToken = null;
}

// ============================================================================
// Shared fetch helpers
// ============================================================================

export class ApiError extends Error {
  public code?: string;
  public fields?: Record<string, string[]>;

  constructor(message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Parse the standardised error shape from the backend:
 *   { error: { code: string, message: string, fields?: Record<string, string[]> } }
 */
async function parseError(res: Response): Promise<Error> {
  try {
    const body = await res.json();
    const message =
      body?.error?.message ||
      body?.message ||
      body?.detail ||
      `Request failed with status ${res.status}`;
    
    return new ApiError(message, body?.error?.code, body?.error?.fields);
  } catch {
    return new ApiError(`Request failed with status ${res.status}`);
  }
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const csrf = await getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}
async function put<T>(path: string, body?: unknown): Promise<T> {
  const csrf = await getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const csrf = await getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const csrf = await getCsrfToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "X-CSRFToken": csrf,
    },
  });
  if (!res.ok) throw await parseError(res);
}

// ============================================================================
// AUTH
// ============================================================================

/**
 * POST /api/auth/magic-link/
 * Request a magic link email. Always returns 200 (even if email unknown).
 */
export async function requestMagicLink(
  email: string
): Promise<{ message: string; email: string }> {
  return post("/auth/magic-link/", { email });
}

/**
 * GET /api/auth/verify/?token=<sesame_token>
 * Verify the magic link token and establish a session.
 * Returns the authenticated user.
 */
export async function verifyMagicLink(token: string): Promise<User> {
  const res = await fetch(
    `${BASE_URL}/auth/verify/?token=${encodeURIComponent(token)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  
  // Clear cached CSRF token so subsequent state-changing requests fetch a fresh one
  invalidateCsrfToken();
  
  // Response shape: { user: User }
  return (data.user ?? data) as User;
}

/**
 * GET /api/auth/me/
 * Return the currently authenticated user's profile, or null if not logged in.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${BASE_URL}/auth/me/`, {
    credentials: "include",
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<User>;
}

/**
 * POST /api/auth/logout/
 * Clear the session.
 */
export async function logout(): Promise<{ message: string }> {
  const result = await post<{ message: string }>("/auth/logout/");
  invalidateCsrfToken();
  return result;
}

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * PATCH /api/users/me/
 * Update the current user's mutable profile fields.
 */
export async function updateUserProfile(
  data: Partial<Pick<User, "full_name" | "student_uid" | "batch" | "phone" | "institution" | "degree_type" | "graduation_year">>
): Promise<User> {
  return patch<User>("/users/me/", data);
}

/**
 * GET /api/users/?search=...
 * Admin: list/search users
 */
export async function searchUsers(query: string): Promise<User[]> {
  const data = await get<PaginatedResponse<User> | User[]>(`/users/?search=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : (data as PaginatedResponse<User>).results;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface EventListParams {
  event_type?: string;
  upcoming?: boolean;
  status?: string;
  page?: number;
  assigned_only?: boolean;
}

/**
 * GET /api/events/
 * List all published events. Paginated.
 */
export async function fetchEvents(
  params: EventListParams = {}
): Promise<PaginatedResponse<Event>> {
  const qs = new URLSearchParams();
  if (params.event_type) qs.set("event_type", params.event_type);
  if (params.upcoming) qs.set("upcoming", "true");
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.assigned_only) qs.set("assigned_only", "true");

  const query = qs.toString() ? `?${qs.toString()}` : "";
  return get<PaginatedResponse<Event>>(`/events/${query}`);
}

/**
 * GET /api/events/{slug}/
 * Get a single event by slug. Admins can see drafts; public sees published only.
 */
export async function fetchEventById(slug: string): Promise<Event> {
  return get<Event>(`/events/${slug}/`);
}

// ============================================================================
// REGISTRATIONS
// ============================================================================

/**
 * GET /api/registrations/me/
 * Current user's registrations. Paginated.
 */
export async function fetchMyRegistrations(params?: {
  status?: string;
  upcoming?: boolean;
  page?: number;
}): Promise<PaginatedResponse<Registration>> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.upcoming) qs.set("upcoming", "true");
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return get<PaginatedResponse<Registration>>(`/registrations/me/${query}`);
}

/**
 * POST /api/registrations/
 * Register for an event (individual).
 */
export async function registerForEvent(
  eventId: string
): Promise<Registration> {
  return post<Registration>("/registrations/", { event_id: eventId });
}

/**
 * POST /api/registrations/{id}/cancel/
 * Cancel a registration.
 */
export async function cancelRegistration(
  registrationId: string
): Promise<{ id: string; status: string; message: string }> {
  return post(`/registrations/${registrationId}/cancel/`);
}

/**
 * GET /api/registrations/{id}/
 * Get a specific registration. Accessible to owner, admin, or assigned volunteer.
 */
export async function fetchRegistration(
  registrationId: string
): Promise<Registration> {
  return get<Registration>(`/registrations/${registrationId}/`);
}

// ============================================================================
// ADMIN — REGISTRATIONS
// ============================================================================

/**
 * GET /api/registrations/event/{event_id}/
 * Admin: list registrations for a specific event. Paginated.
 */
export async function fetchEventRegistrations(
  eventId: string,
  params?: { status?: string; search?: string; page?: number }
): Promise<PaginatedResponse<RegistrationAdmin>> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return get<PaginatedResponse<RegistrationAdmin>>(
    `/registrations/event/${eventId}/${query ? query : ''}`
  );
}

/**
 * POST /api/registrations/{id}/approve/
 * Admin: approve a pending registration.
 */
export async function approveRegistration(registrationId: string): Promise<{
  id: string;
  status: string;
  qr_token: string | null;
  qr_image_url: string | null;
  approved_at: string;
  message: string;
}> {
  return post(`/registrations/${registrationId}/approve/`);
}

/**
 * POST /api/registrations/{id}/reject/
 * Admin: reject a pending registration.
 */
export async function rejectRegistration(
  registrationId: string,
  reason: string
): Promise<{ id: string; status: string; rejection_reason: string; message: string }> {
  return post(`/registrations/${registrationId}/reject/`, { reason });
}

/**
 * POST /api/registrations/{id}/move-from-waitlist/
 * Admin: move a waitlisted registration to pending.
 */
export async function moveFromWaitlist(
  registrationId: string
): Promise<{ id: string; status: string; message: string }> {
  return post(`/registrations/${registrationId}/move-from-waitlist/`);
}

// ============================================================================
// ADMIN — EVENTS
// ============================================================================

export interface EventCreateData {
  title: string;
  description: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  venue: string;
  capacity: number;
  status: EventStatus;
  is_open_to_external: boolean;
  is_team_event: boolean;
  min_team_size: number | null;
  max_team_size: number | null;
  registration_deadline: string;

  // Enhancements
  prizes?: { position: string; award: string; description: string }[] | null;
  faqs?: { question: string; answer: string }[] | null;
  rules?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  is_registration_open?: boolean;
  is_flagship?: boolean;
  points?: number;
}

/**
 * POST /api/events/
 * Admin: create a new event.
 */
export async function createEvent(data: EventCreateData): Promise<Event> {
  return post<Event>("/events/", data);
}

// ============================================================================
// ADMIN — EVENT VOLUNTEERS
// ============================================================================

export interface VolunteerAssignment {
  event_id: string;
  volunteers: {
    id: string; // The assignment ID
    user: {
      id: string; // User ID
      full_name: string;
      email: string;
    };
    assigned_by: {
      id: string;
      full_name: string;
      email: string;
    };
    created_at: string;
  }[];
}

export async function fetchEventVolunteers(eventId: string): Promise<VolunteerAssignment> {
  return get<VolunteerAssignment>(`/events/${eventId}/volunteers/`);
}

export async function assignVolunteer(eventId: string, userId: string): Promise<any> {
  return post(`/events/${eventId}/volunteers/`, { user_id: userId });
}

export async function removeVolunteer(eventId: string, assignmentId: string): Promise<void> {
  return del(`/events/${eventId}/volunteers/${assignmentId}/`);
}

/**
 * PATCH /api/events/{slug}/
 */
export async function updateEvent(slug: string, data: Partial<EventCreateData>): Promise<Event> {
  return patch<Event>(`/events/${slug}/`, data);
}


/**
 * POST /api/events/{id}/banner/
 */
export async function uploadEventBanner(id: string, file: File): Promise<Event> {
  const token = await getCsrfToken();
  const formData = new FormData();
  formData.append("banner", file);

  const res = await fetch(`${BASE_URL}/events/${id}/banner/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": token,
    },
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json();
}

/**
 * DELETE /api/events/{id}/
 * Admin: delete a draft event.
 */
export async function deleteEvent(id: string): Promise<void> {
  return del(`/events/${id}/`);
}

/**
 * GET /api/events/{id}/checkin-stats/
 * Admin + Volunteer: get live check-in stats for an event.
 */
export async function fetchCheckinStats(eventId: string): Promise<CheckinStats> {
  return get<CheckinStats>(`/events/${eventId}/checkin-stats/`);
}

// ============================================================================
// ATTENDANCE
// ============================================================================

/**
 * POST /api/attendance/checkin/
 * Check in an attendee by QR token.
 */
export async function checkinByQR(qrToken: string): Promise<CheckinResponse> {
  return post("/attendance/checkin/", { qr_token: qrToken });
}

/**
 * POST /api/attendance/{registration_id}/manual-checkin/
 * Check in an attendee manually by registration ID.
 */
export async function manualCheckin(registrationId: string): Promise<CheckinResponse> {
  return post(`/attendance/${registrationId}/manual-checkin/`);
}

/**
 * GET /api/attendance/{event_id}/list/
 * List attendance records for an event. Admin + assigned volunteer.
 */
export async function fetchAttendanceList(
  eventId: string,
  params?: { search?: string; page?: number }
): Promise<PaginatedResponse<AttendanceRecord>> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return get<PaginatedResponse<AttendanceRecord>>(
    `/attendance/${eventId}/list/${query}`
  );
}

/**
 * GET /api/attendance/{event_id}/export/
 * Download CSV of attendance records. Admin only.
 * Returns the raw Response so the caller can stream it as a download.
 */
export async function exportAttendanceCsv(eventId: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/attendance/${eventId}/export/`, {
    credentials: "include",
  });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

// ============================================================================
// PUBLIC STATS
// ============================================================================

export interface PublicStats {
  total_registrations: number;
  total_events: number;
  total_checkins: number;
  active_team_members: number;
}

/**
 * GET /api/stats/
 * Public aggregate stats for the homepage stats bar.
 */
export async function fetchStats(): Promise<PublicStats> {
  return get<PublicStats>("/stats/");
}

// ============================================================================
// TEAM (public page)
// ============================================================================

/**
 * GET /api/team/
 * List all active public team members.
 */
export async function fetchTeam(): Promise<CoreTeamMemberPublic[]> {
  const data = await get<PaginatedResponse<CoreTeamMemberPublic> | CoreTeamMemberPublic[]>("/team/");
  // Handle both paginated and flat array responses
  if (Array.isArray(data)) return data;
  return (data as PaginatedResponse<CoreTeamMemberPublic>).results;
}

/**
 * POST /api/team/
 * Admin: create a new team member.
 */
export async function createTeamMember(data: {
  full_name: string;
  designation: string;
  photo_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}): Promise<CoreTeamMemberPublic> {
  return post<CoreTeamMemberPublic>("/team/", data);
}

/**
 * PATCH /api/team/{id}/
 * Admin: update a team member.
 */
export async function updateTeamMember(
  id: string,
  data: Partial<{
    full_name: string;
    designation: string;
    photo_url: string | null;
    display_order: number;
    is_active: boolean;
  }>
): Promise<CoreTeamMemberPublic> {
  return patch<CoreTeamMemberPublic>(`/team/${id}/`, data);
}

/**
 * DELETE /api/team/{id}/
 * Admin: deactivate/remove a team member.
 */
export async function deleteTeamMember(id: string): Promise<void> {
  return del(`/team/${id}/`);
}

/**
 * POST /api/team/{id}/photo/
 * Admin: upload team member photo
 */
export async function uploadTeamPhoto(id: string, file: File): Promise<{ photo_url: string }> {
  const token = await getCsrfToken();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${BASE_URL}/team/${id}/photo/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": token,
    },
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json();
}

/**
 * POST /api/users/{id}/bonus-points/
 * Admin: award bonus points
 */
export async function awardBonusPoints(id: string, points: number): Promise<{ club_points: number }> {
  return post<{ club_points: number }>(`/users/${id}/bonus-points/`, { points });
}

// ============================================================================
// Deprecated aliases — kept for backwards compatibility during transition
// ============================================================================

/** @deprecated Use fetchCurrentUser() instead */
export const fetchUser = fetchCurrentUser;

// ============================================================================
// New Endpoints
// ============================================================================

export async function revokeCheckin(registrationId: string): Promise<void> {
  return del(`/attendance/${registrationId}/manual-checkin/`);
}

export async function deleteRegistration(registrationId: string): Promise<void> {
  return del(`/registrations/${registrationId}/admin-delete/`);
}

export async function fetchPastEvents(): Promise<any[]> {
  return get<any[]>("/events/past/");
}

export async function createPastEvent(data: any): Promise<any> {
  return post<any>("/events/past/", data);
}

export async function updatePastEvent(id: string, data: any): Promise<any> {
  return put<any>(`/events/past/${id}/`, data);
}

export async function deletePastEvent(id: string): Promise<void> {
  return del(`/events/past/${id}/`);
}

export async function uploadPastEventLogo(id: string, file: File): Promise<{ logo_url: string }> {
  const token = await getCsrfToken();
  const formData = new FormData();
  formData.append("logo", file);

  const res = await fetch(`${BASE_URL}/events/past/${id}/logo/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": token,
    },
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json();
}
/** @deprecated Use fetchMyRegistrations() instead */
export const fetchRegistrations = async () => {
  const data = await fetchMyRegistrations();
  return data.results;
};

// ============================================================================
// Site Settings
// ============================================================================

export interface SiteSettings {
  whatsapp_group_link: string | null;
}

export async function fetchSettings(): Promise<SiteSettings> {
  return get<SiteSettings>("/settings/");
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  return get<SiteSettings>("/admin/settings/");
}

export async function updateAdminSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  return put<SiteSettings>("/admin/settings/", data);
}
