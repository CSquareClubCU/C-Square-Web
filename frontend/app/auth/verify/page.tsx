"use client";

/**
 * /auth/verify
 *
 * Magic link landing page. The Django backend sends users here after clicking
 * the magic link in their email. URL format: /auth/verify?token=<sesame_token>
 *
 * Flow:
 * 1. Extract token from URL query params
 * 2. Call GET /api/auth/verify/?token=<token>
 * 3. On success → redirect by role
 * 4. On error   → show error state with "request new link" option
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { verifyMagicLink } from "@/lib/api";
import type { User } from "@/types";

type VerifyState = "loading" | "success" | "error";

function getRoleRedirect(user: User): string {
  // Check if the user was redirected from a specific page before login
  const rawNext = typeof window !== "undefined" ? sessionStorage.getItem("auth_next") : null;
  if (rawNext) {
    sessionStorage.removeItem("auth_next");
    if (rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      return rawNext;
    }
  }
  switch (user.role) {
    case "admin":
      return "/admin";
    case "volunteer":
      return "/checkin";
    default:
      return "/dashboard";
  }
}

// ============================================================================
// Inner component — must be wrapped in Suspense when using useSearchParams
// ============================================================================

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) {
      const t = setTimeout(() => {
        setState("error");
        setError("No token found in this link. Please request a new magic link.");
      }, 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;

    async function verify() {
      try {
        const verifiedUser = await verifyMagicLink(token as string);
        if (cancelled) return;
        setUser(verifiedUser);
        setState("success");

        // Brief delay so user sees the success state
        setTimeout(() => {
          if (!cancelled) {
            router.replace(getRoleRedirect(verifiedUser));
          }
        }, 1500);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "This link is invalid or has expired.";
        setError(message);
        setState("error");
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-5">
      <div className="w-full max-w-md text-center">

        {/* Loading state */}
        {state === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">
              Verifying your link...
            </h1>
            <p className="text-[var(--c-secondary-text)]">
              Just a moment while we log you in securely.
            </p>
          </motion.div>
        )}

        {/* Success state */}
        {state === "success" && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-8 shadow-lg"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Welcome back, {user.full_name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-[var(--c-secondary-text)] mb-2">
              You&apos;re signed in as{" "}
              <span className="font-semibold text-[var(--c-accent)]">{user.email}</span>
            </p>
            <p className="text-sm text-[var(--c-muted-text)]">Redirecting you now...</p>
            <div className="flex justify-center mt-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-8"
            >
              <XCircle className="w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Link expired or invalid
            </h1>
            <p className="text-[var(--c-secondary-text)] mb-8 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Request a new magic link
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full text-[var(--c-muted-text)]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to home
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// ============================================================================
// Page export — wraps content in Suspense (required for useSearchParams)
// ============================================================================

export default function AuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
