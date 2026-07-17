import Link from "next/link";
import { ArrowUpRight, Globe, ExternalLink, Instagram } from "lucide-react";

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
  { icon: <ExternalLink className="w-4 h-4" />, href: "https://www.linkedin.com/company/csquare-club", label: "LinkedIn" },
  { icon: <Globe className="w-4 h-4" />, href: "https://www.csquareclub.co.in", label: "Website" },
  { icon: <Instagram className="w-4 h-4" />, href: "https://www.instagram.com/csquare_club/", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="w-full bg-[#050505] text-white mt-auto relative z-50 pt-20 pb-8">
      {/* Multi-color gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-80" />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
        
        {/* Top Section: Info & Links */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20 md:mb-24">
          
          {/* Brand & Mission */}
          <div className="max-w-sm">
            <h3 className="text-3xl font-black tracking-tighter text-white mb-5">
              CSquare<span className="text-blue-500">.</span>
            </h3>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8 font-medium">
              The official technical club of Chandigarh University. We don&apos;t just talk about code. We build it.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 hover:border-white/30 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="flex flex-wrap gap-16 md:gap-24 pt-2">
            {footerLinks.map((col) => (
              <div key={col.title}>
                <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-white/40 mb-6">
                  {col.title}
                </p>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[16px] text-white/70 hover:text-white transition-colors flex items-center group font-medium"
                      >
                        {link.label}
                        <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-blue-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Giant Typography & Copyright */}
        <div className="w-full relative border-t border-white/10 pt-10 flex flex-col items-center">
          
          {/* Giant Background Typography */}
          <div className="w-full flex justify-center mb-8 mt-2 overflow-hidden">
            <h1 aria-hidden="true" className="text-[18vw] sm:text-[16vw] md:text-[180px] lg:text-[220px] font-black tracking-tighter leading-none text-white/10 select-none text-center">
              CSQUARE
            </h1>
          </div>

          {/* Copyright & Location */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center text-[11px] md:text-[13px] text-white/40 uppercase tracking-[0.2em] font-bold">
            <p className="mb-3 sm:mb-0">&copy; {new Date().getFullYear()} C Square Club.</p>
            <p>Chandigarh University</p>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
