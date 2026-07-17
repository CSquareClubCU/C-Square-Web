"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  Loader2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Nav config ────────────────────────────────────────────────────────────
const publicNavLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "/events", label: "Events" },
  { href: "/team",   label: "Team"   },
  { href: "/cusoc",  label: "CUSoC", external: true },
];

const roleNav: Record<string, { href: string; label: string; icon: React.ReactNode }> = {
  admin:     { href: "/admin",     label: "Admin",     icon: <ShieldCheck    className="w-3.5 h-3.5" /> },
  volunteer: { href: "/checkin",   label: "Check-in",  icon: <QrCode         className="w-3.5 h-3.5" /> },
  student:   { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
};

// ─── Component ─────────────────────────────────────────────────────────────
export function Header() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, loading, signOut } = useAuth();

  // ── Scroll detection ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial state immediately
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close user menu on outside click ─────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close mobile menu on route change ────────────────────────────────
  useEffect(() => { 
    const t = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    router.replace("/");
  }

  const roleLink  = user ? roleNav[user.role] : null;
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const initial   = user?.full_name?.charAt(0)?.toUpperCase() || "U";

  // ── The pill container transitions ────────────────────────────────────
  // At top: full-width, transparent, h-16
  // Scrolled: centered pill, white bg, rounded-full, shadow, h-14
  return (
    <>
      {/* ── Outer fixed shell ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
        <header
          className={`pointer-events-auto w-full max-w-[1200px] border transition-all duration-300 ${
            scrolled
              ? "bg-white border-[rgba(20,20,20,0.2)] shadow-sm rounded-[16px]"
              : "bg-transparent border-transparent shadow-none rounded-[16px]"
          }`}
        >
          <div className="relative flex items-center justify-between h-[56px] px-6">
            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-75 transition-opacity shrink-0 select-none"
            >
              <Image
                src="/logo-mark.png"
                alt="C Square"
                width={28}
                height={28}
                priority
                className="w-[24px] h-[24px] object-contain"
              />
              <span
                style={{ fontFamily: "inherit", letterSpacing: "0.1em" }}
                className="text-[14px] font-bold uppercase tracking-widest text-[#292929]"
              >
                C Square
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {publicNavLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-medium px-4 py-2 rounded-full transition-all duration-150 flex items-center gap-1 text-[#292929] hover:bg-gray-100/50"
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink key={link.href} href={link.href} active={pathname === link.href}>
                    {link.label}
                  </NavLink>
                )
              )}
              {roleLink && (
                <NavLink href={roleLink.href} active={pathname.startsWith(roleLink.href)}>
                  <span className="flex items-center gap-1.5">
                    {roleLink.icon}
                    {roleLink.label}
                  </span>
                </NavLink>
              )}
            </nav>

            {/* ── Desktop actions ── */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              ) : user ? (
                /* ── Logged-in user menu ── */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2 text-[13.5px] font-medium text-[#444] hover:text-black px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all"
                  >
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                      {initial}
                    </span>
                    <span>{firstName}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e5e7eb] rounded-2xl shadow-xl overflow-hidden z-50"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[#f0f0f0]">
                          <p className="text-xs font-semibold truncate text-[#111]">{user.full_name}</p>
                          <p className="text-[11px] text-[#888] truncate mt-0.5">{user.email}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                            {user.role}
                          </span>
                        </div>
                        {/* Links */}
                        <div className="py-1">
                          {roleLink && (
                            <Link
                              href={roleLink.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#333] hover:bg-gray-50 transition-colors"
                            >
                              {roleLink.icon}
                              {roleLink.label}
                            </Link>
                          )}
                          {user.role !== "student" && (
                            <Link
                              href="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#333] hover:bg-gray-50 transition-colors"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              My Registrations
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-[#f0f0f0] py-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 w-full transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Logged-out ── */
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-between pl-4 pr-3 py-1.5 gap-2 text-[14px] font-medium text-white bg-black border border-[#141414] rounded-[12px] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.15)] hover:bg-[#222] transition-colors group"
                  >
                    <span>Sign in</span>
                    <ChevronRight className="w-4 h-4 text-[#898989] group-hover:text-white transition-colors" />
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile toggle ── */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-[#333] hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
      </div>

      {/* ── Spacer so content doesn't sit under the fixed header ── */}
      <div className="h-[80px]" />

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed top-[80px] left-4 right-4 z-50 bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Nav links */}
              <nav className="px-2 py-3 border-b border-[#f0f0f0]">
                {publicNavLinks.map((link) =>
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors text-[#444] hover:bg-gray-50 hover:text-black"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                        pathname === link.href
                          ? "bg-gray-100 text-black"
                          : "text-[#444] hover:bg-gray-50 hover:text-black"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                )}
                {roleLink && (
                  <Link
                    href={roleLink.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                      pathname.startsWith(roleLink.href)
                        ? "bg-gray-100 text-black"
                        : "text-[#444] hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {roleLink.icon}
                    {roleLink.label}
                  </Link>
                )}
              </nav>

              {/* Auth section */}
              <div className="px-4 py-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-xl">
                      <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate">{user.full_name}</p>
                        <p className="text-[11px] text-[#888] truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-[13px] font-medium hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-black text-white text-[13.5px] font-semibold rounded-xl hover:bg-[#222] transition-colors"
                    >
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── NavLink sub-component ──────────────────────────────────────────────────
function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-[14px] font-medium px-4 py-2 rounded-full transition-all duration-150 flex items-center gap-1 ${
        active
          ? "text-black bg-gray-100"
          : "text-[#292929] hover:bg-gray-100/50"
      }`}
    >
      {children}
    </Link>
  );
}
