"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/team", label: "Team" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Pages that have a dark hero section
  const isDarkHero = pathname === "/" || pathname === "/events" || pathname === "/team" || pathname.startsWith("/events/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Determine text color: white on dark hero (not scrolled), else dark
  const isTransparentOnDark = isDarkHero && !scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "navbar-glass border-b border-[var(--c-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto h-20 px-5 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={`text-xl font-bold tracking-tight hover:opacity-80 transition-all relative z-10 ${
              isTransparentOnDark ? "text-white" : "text-[var(--c-accent)]"
            }`}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              CSquareClub
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <Link
                  href={link.href}
                  className={`text-sm font-medium animated-underline transition-colors ${
                    isTransparentOnDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--c-secondary-text)] hover:text-[var(--c-accent)]"
                  }`}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <motion.div
            className="hidden md:flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isTransparentOnDark
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : ""
                }
              >
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className={
                  isTransparentOnDark
                    ? "bg-white text-black hover:bg-gray-200"
                    : ""
                }
              >
                Get Started
              </Button>
            </Link>
          </motion.div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden relative z-10 p-2 ${
              isTransparentOnDark && !mobileOpen ? "text-white" : ""
            }`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-24 px-8"
          >
            <nav className="flex flex-col space-y-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-3xl font-bold text-[var(--c-accent)]"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto pb-12 flex flex-col space-y-3">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full" size="lg">
                  Log in
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
