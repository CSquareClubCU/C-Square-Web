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

<<<<<<< HEAD
=======
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

>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
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
<<<<<<< HEAD
    "/onboarding/:path*",
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    "/admin/:path*",
    "/checkin/:path*",
  ],
};
