import { Event } from '@/types';

// ============================================================================
// API FUNCTIONS
// Real API integration. Ensure BASE_URL points to the Django backend.
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : '');

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required in production.');
}

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${BASE_URL}/events/`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.results || data;
}

export async function fetchEventById(id: string): Promise<Event> {
  const res = await fetch(`${BASE_URL}/events/${id}/`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchTeam() {
  const res = await fetch(`${BASE_URL}/team/`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.results || data;
}

export async function fetchUser() {
  const res = await fetch(`${BASE_URL}/users/me/`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchRegistrations() {
  const res = await fetch(`${BASE_URL}/registrations/me/`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.results || data;
}

export async function requestMagicLink(email: string) {
  const res = await fetch(`${BASE_URL}/auth/magic-link/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API request failed with status ${res.status}`);
  }
  
  return res.json();
}
