/**
 * hooks/useRequireAuth.ts
 *
 * Auth guard hook. Use at the top of any protected page.
 *
 * Usage:
 *   const { user, loading } = useRequireAuth({ role: "admin" });
 *   if (loading) return <Loader />;
 *   // user is guaranteed to be non-null and have the required role here
 *
 * Options:
 *   role?: "admin" | "volunteer" | "student"  - required role (default: any authenticated user)
 *   redirectTo?: string                        - where to send unauthenticated users (default: /login)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";

interface UseRequireAuthOptions {
  /** If set, user must have this role (or admin always passes for lower roles). */
  role?: "admin" | "volunteer" | "student";
  /** Where to redirect if not authenticated. Defaults to /login. */
  redirectTo?: string;
}

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
<<<<<<< HEAD
  authorized: boolean;
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
}

const ROLE_RANK: Record<string, number> = {
  student: 1,
  volunteer: 2,
  admin: 3,
};

export function useRequireAuth(
  options: UseRequireAuthOptions = {}
): UseRequireAuthResult {
  const { role: requiredRole, redirectTo = "/login" } = options;
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated — send to login
      const current = typeof window !== "undefined" ? window.location.pathname : "";
      router.replace(`${redirectTo}${current ? `?next=${encodeURIComponent(current)}` : ""}`);
      return;
    }

<<<<<<< HEAD
    // Check if profile is incomplete
    const isCuIncomplete = user.is_cu_student && (!user.full_name || !user.student_uid);
    const isExtIncomplete = !user.is_cu_student && (!user.full_name || !user.institution || !user.degree_type || !user.graduation_year);
    
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    if ((isCuIncomplete || isExtIncomplete) && currentPath !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    if (requiredRole) {
      const userRank = ROLE_RANK[user.role] ?? 0;
      const requiredRank = ROLE_RANK[requiredRole] ?? 0;
      if (userRank < requiredRank) {
        // Wrong role — redirect to their appropriate home
        if (user.role === "admin") router.replace("/admin");
        else if (user.role === "volunteer") router.replace("/checkin");
        else router.replace("/dashboard");
      }
    }
  }, [user, loading, router, requiredRole, redirectTo]);

<<<<<<< HEAD
  const isCuIncomplete = user?.is_cu_student && (!user.full_name || !user.student_uid);
  const isExtIncomplete = user && !user.is_cu_student && (!user.full_name || !user.institution || !user.degree_type || !user.graduation_year);
  const isIncomplete = isCuIncomplete || isExtIncomplete;
  
  let authorized = false;
  if (!loading && user && !isIncomplete) {
    if (!requiredRole) {
      authorized = true;
    } else {
      const userRank = ROLE_RANK[user.role] ?? 0;
      const requiredRank = ROLE_RANK[requiredRole] ?? 0;
      if (userRank >= requiredRank) {
        authorized = true;
      }
    }
  }

  return { user, loading, authorized };
=======
  return { user, loading };
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
}
