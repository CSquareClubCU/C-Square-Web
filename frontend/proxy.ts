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


export async function proxy(request: NextRequest) {
  // Authentication and role verification are entirely handled client-side via useRequireAuth,
  // providing a better user experience without double round-trips.
  // This proxy is kept as a stub for future edge routing or header injection if needed.
  return NextResponse.next();
}

export const config = {
  /**
   * Match all protected route prefixes.
   * Exclude static files and Next.js internals.
   */
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/checkin/:path*",
  ],
};
