"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const footerLinks = [
  {
    title: "Navigate",
    links: [
      { label: "Home", href: "/" },
      { label: "Events", href: "/events" },
      { label: "Team", href: "/team" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--c-border)] bg-white mt-auto">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10">
        {/* Main Footer */}
        <div className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-[var(--c-accent)] inline-block mb-4"
            >
              CSquareClub
            </Link>
            <p className="text-[var(--c-secondary-text)] text-sm leading-relaxed max-w-sm">
              The official technical club of Chandigarh University. Building the
              future, one event at a time.
            </p>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--c-muted-text)] mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--c-secondary-text)] hover:text-[var(--c-accent)] transition-colors flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[var(--c-border)] flex flex-col sm:flex-row justify-between items-center text-xs text-[var(--c-muted-text)]">
          <p>&copy; {new Date().getFullYear()} C Square Club. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Chandigarh University</p>
        </div>
      </div>
    </footer>
  );
}
