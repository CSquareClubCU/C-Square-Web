"use client";

/**
 * contexts/AuthContext.tsx
 *
 * Global auth state for the entire app.
 * Wraps the app in a provider that:
 *   - Fetches /api/auth/me/ on mount to restore session
 *   - Exposes `user`, `loading`, `setUser`, and `signOut`
 *
 * Usage:
 *   const { user, loading, signOut } = useAuth();
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { fetchCurrentUser, logout } from "@/lib/api";
import type { User } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      // 401 / not logged in — that's fine
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await refresh();
      }
    };
    init();
    return () => { mounted = false; };
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
