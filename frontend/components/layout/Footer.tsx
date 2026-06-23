"use client";

import Link from "next/link";
import { ArrowUpRight, Globe, Code2, ExternalLink } from "lucide-react";

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

const socialLinks = [
  { icon: <Code2 className="w-4 h-4" />, href: "#", label: "GitHub" },
  { icon: <Globe className="w-4 h-4" />, href: "#", label: "Website" },
  { icon: <ExternalLink className="w-4 h-4" />, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="w-full bg-black text-white mt-auto relative overflow-hidden">
      {/* Subtle gradient glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="max-w-[1280px] mx-auto px-5 md:px-10">
        {/* Main Footer */}
        <div className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-white inline-block mb-4"
            >
              CSquareClub
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
              The official technical club of Chandigarh University. Building the
              future, one event at a time.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors flex items-center group"
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
        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center text-xs text-white/25">
          <p>&copy; {new Date().getFullYear()} C Square Club. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Chandigarh University</p>
        </div>
      </div>
    </footer>
  );
}
