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

  // Attempt to verify auth by calling /api/auth/me/
  // Forward the session cookie from the browser request
  let user: { role?: string } | null = null;
  try {
    const meResponse = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: {
        Cookie: request.headers.get("cookie") ?? "",
      },
      redirect: "manual",
    });

    if (meResponse.ok) {
      user = await meResponse.json();
    }
  } catch {
    // Network error or backend down — redirect to login
    user = null;
  }

  // Not authenticated → redirect to login with ?next= param
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but wrong role → redirect to homepage
  if (protectedRoute.allowedRoles && user.role) {
    if (!protectedRoute.allowedRoles.includes(user.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

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
