import { Event, User } from '@/types';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to get token from localStorage (client-side only)
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Helper for authenticated requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw { status: res.status, data: errorData };
  }

  // Handle 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function requestMagicLink(email: string) {
  return fetchWithAuth('/auth/magic-link/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyMagicLink(token: string) {
  const res = await fetch(`${BASE_URL}/auth/verify/?token=${token}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw { status: res.status, data: errorData };
  }
  const data = await res.json();
  if (data.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
  }
  return data;
}

export async function logoutUser() {
  await fetchWithAuth('/auth/logout/', {
    method: 'POST',
  });
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export async function fetchCurrentUser(): Promise<User> {
  return fetchWithAuth('/auth/me/');
}

// ============================================================================
// EVENTS API
// ============================================================================

export async function fetchEvents(): Promise<Event[]> {
  const data = await fetchWithAuth('/events/');
  return data.results || data;
}

export async function fetchEventById(id: string): Promise<Event> {
  return fetchWithAuth(`/events/${id}/`);
}

// ============================================================================
// TEAM API
// ============================================================================

export async function fetchTeam() {
  const data = await fetchWithAuth('/team/');
  return data.results || data;
}
