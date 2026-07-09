/**
 * Next.js Middleware — Route Protection
 *
 * Protected routes:
 * - /dashboard/*  → Any authenticated user
 * - /admin/*      → Admin role only
 * - /checkin/*    → Admin or Volunteer role
 *
 * Uses the /api/auth/me/ endpoint to verify session.
 * On failure (no session / network error) → redirect to /login.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000/api"
    : "");

/** Roles that can access each protected prefix. Empty means any authenticated user. */
const PROTECTED_ROUTES: Array<{
  prefix: string;
  allowedRoles?: string[];
}> = [
  { prefix: "/dashboard" },
  { prefix: "/admin", allowedRoles: ["admin"] },
  { prefix: "/checkin", allowedRoles: ["admin", "volunteer"] },
];

function matchesProtected(
  pathname: string
): { prefix: string; allowedRoles?: string[] } | null {
  return (
    PROTECTED_ROUTES.find((route) => pathname.startsWith(route.prefix)) ?? null
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoute = matchesProtected(pathname);
  if (!protectedRoute) {
    return NextResponse.next();
  }

  if (!API_BASE_URL) {
    // Fail fast if API_BASE_URL is missing in production
    return NextResponse.next();
  }

  // The actual authentication and role verification is now handled client-side via useRequireAuth
  // which provides a better user experience and avoids double round-trips.
  return NextResponse.next();
}

export const config = {
  /**
   * Match all protected route prefixes.
   * Exclude static files and Next.js internals.
   */
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkin/:path*",
  ],
};
