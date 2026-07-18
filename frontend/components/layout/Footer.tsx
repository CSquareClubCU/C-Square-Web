import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail } from "lucide-react";

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
  { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, href: "https://www.linkedin.com/company/csquare-club", label: "LinkedIn" },
  { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, href: "https://www.instagram.com/csquare_club/", label: "Instagram" },
  { icon: <Mail className="w-4 h-4" />, href: "mailto:csquareclub@cumail.in", label: "Email" },
  { icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>, href: "https://wa.me/917494947018", label: "WhatsApp" },
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
            <div className="flex items-center gap-3 mb-5">
              <Image src="/logo-mark.png" alt="C Square Logo" width={40} height={40} className="object-contain invert brightness-0" />
              <h3 className="text-3xl font-black tracking-tighter text-white">
                C Square<span className="text-blue-500">.</span>
              </h3>
            </div>
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
            <h1 aria-hidden="true" className="text-[18vw] sm:text-[16vw] md:text-[180px] lg:text-[220px] font-black tracking-tighter leading-none text-white/10 select-none text-center whitespace-nowrap">
              C SQUARE
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
