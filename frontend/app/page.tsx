"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Code,
  Users,
  Calendar,
  Zap,
  Shield,
  QrCode,
  Terminal,
  Trophy,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  TiltCard,
  Float,
  AnimatedCounter,
  ScaleIn,
  SlideIn,
  Marquee,
  OrbitRing,
} from "@/components/animations/MotionElements";
import { HoverDotGrid } from "@/components/animations/HoverDotGrid";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center text-center px-5 md:px-10 bg-white text-black noise-overlay">
        {/* Interactive dots background */}
        <HoverDotGrid />
        {/* Subtle white ambient glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="relative z-10 max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-semibold tracking-wider text-gray-600 mb-6">
              <span className="w-2 h-2 rounded-full bg-black" />
              CHANDIGARH UNIVERSITY'S TECH CLUB
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] text-black">
              <span>Build the future,</span>
              <br />
              <span className="text-black/80">one line at a time.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-600 max-w-[600px] mx-auto mb-10 leading-relaxed font-medium"
          >
            We host hackathons, coding competitions, and workshops to help you
            level up your skills. Register, get your QR code, and check in
            seamlessly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center gap-4 flex-col sm:flex-row"
          >
            <Link href="/events">
              <Button size="lg" className="group bg-black text-white hover:bg-gray-800">
                Explore Events
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/team">
              <Button
                variant="outline"
                size="lg"
                className="border-black/10 text-black hover:bg-black/5"
              >
                Meet the Team
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-black/15 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-black/50" />
          </motion.div>
        </motion.div>

      </section>

      {/* ─── MARQUEE TICKER ─── */}
      <section className="w-full bg-white text-black py-5 border-b border-black/[0.04]">
        <Marquee speed={25}>
          <div className="flex items-center gap-12 px-6">
            {[
              "HACKATHONS",
              "WORKSHOPS",
              "SEMINARS",
              "COMPETITIONS",
              "CODE SPRINTS",
              "TECH TALKS",
              "OPEN SOURCE",
              "NETWORKING",
            ].map((item) => (
              <span
                key={item}
                className="text-sm font-semibold tracking-[0.25em] uppercase text-black/30 whitespace-nowrap flex items-center gap-4"
              >
                {item}
                <span className="w-1.5 h-1.5 rounded-full bg-black/10" />
              </span>
            ))}
          </div>
        </Marquee>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="w-full bg-white text-black border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 1000, suffix: "+", label: "Students Registered", icon: <Users className="w-5 h-5" /> },
            { value: 50, suffix: "+", label: "Events Hosted", icon: <Calendar className="w-5 h-5" /> },
            { value: 200, suffix: "+", label: "Check-ins Processed", icon: <QrCode className="w-5 h-5" /> },
            { value: 15, suffix: "", label: "Team Members", icon: <Trophy className="w-5 h-5" /> },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1} className="text-center stat-underline cursor-default">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-black/[0.02] border border-black/[0.08] flex items-center justify-center text-black/40">
                  {stat.icon}
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold tracking-tight text-black">
                <AnimatedCounter value={stat.value} />
                {stat.suffix}
              </p>
              <p className="text-sm text-black/40 mt-2">{stat.label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── WHAT WE DO (3D Cards) ─── */}
      <section className="w-full py-24 md:py-32 relative">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
              What We Do
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Events that matter.
            </h2>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-container">
            {[
              {
                icon: <Code className="w-6 h-6" />,
                title: "Hackathons",
                desc: "24 to 48-hour coding marathons. Collaborate with peers, build real solutions, and compete for prizes.",
                num: "01",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Workshops",
                desc: "Hands-on sessions on Web3, AI/ML, cloud, and more. Learn from industry experts and experienced seniors.",
                num: "02",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Seminars",
                desc: "Tech talks and panel discussions covering architecture, career growth, and industry trends.",
                num: "03",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 md:p-10 rounded-[24px] border border-[var(--c-border)] bg-white relative overflow-hidden group hover:shadow-xl hover:border-gray-200 transition-all duration-500">
                    {/* Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Number watermark */}
                    <span className="absolute top-6 right-8 text-7xl font-black text-gray-50 select-none pointer-events-none transition-colors duration-500 group-hover:text-gray-100">
                      {item.num}
                    </span>
                    <div className="w-14 h-14 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center mb-6 relative z-10 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-500">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 relative z-10">
                      {item.title}
                    </h3>
                    <p className="text-[var(--c-secondary-text)] leading-relaxed relative z-10">
                      {item.desc}
                    </p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── HOW IT WORKS (Process Steps) ─── */}
      <section className="w-full bg-[var(--c-surface)] py-24 md:py-32 relative overflow-hidden">

        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp className="text-center mb-20">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Three simple steps.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-[1px] bg-gray-200 z-0">
              <motion.div
                className="absolute top-0 left-0 h-full bg-black"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </div>

            {[
              {
                step: "01",
                title: "Discover & Register",
                desc: "Browse upcoming events, pick one, and register with a single click. Team events let you invite teammates by email.",
                icon: <Zap className="w-5 h-5" />,
              },
              {
                step: "02",
                title: "Get Approved",
                desc: "Admin reviews your registration. On approval, you receive a confirmation email with your unique QR code.",
                icon: <Shield className="w-5 h-5" />,
              },
              {
                step: "03",
                title: "Show Up & Check In",
                desc: "On event day, show your QR code at the venue. A volunteer scans it and you\u2019re instantly checked in.",
                icon: <QrCode className="w-5 h-5" />,
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-3 inline-block">
                    Step {item.step}
                  </span>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-[var(--c-secondary-text)] leading-relaxed max-w-sm mx-auto">
                    {item.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE SHOWCASE (Split Section) ─── */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 flex flex-col md:flex-row gap-16 items-center">
          <SlideIn direction="left" className="w-full md:w-1/2">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
              Built for Scale
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Execution over everything.
            </h2>
            <p className="text-lg text-[var(--c-secondary-text)] mb-8 leading-relaxed">
              We don&apos;t just talk about code. We build it. Our platform
              simplifies the entire event lifecycle — from discovery to on-site
              check-ins.
            </p>
            <ul className="space-y-5">
              {[
                { text: "No passwords. Just magic links.", icon: <Zap className="w-4 h-4" /> },
                { text: "Lightning fast QR check-ins.", icon: <QrCode className="w-4 h-4" /> },
                { text: "Real-time attendance dashboard.", icon: <Terminal className="w-4 h-4" /> },
                { text: "Built exclusively for CU students.", icon: <Shield className="w-4 h-4" /> },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <li className="flex items-center text-[var(--c-primary-text)] group">
                    <div className="w-8 h-8 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center mr-4 shrink-0 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
                      <span className="text-[var(--c-muted-text)] group-hover:text-white transition-colors duration-300">
                        {item.icon}
                      </span>
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </li>
                </FadeUp>
              ))}
            </ul>
          </SlideIn>

          <SlideIn direction="right" className="w-full md:w-1/2">
            <TiltCard>
              <div className="rounded-[24px] bg-[#080808] border border-white/[0.08] relative overflow-hidden shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center px-5 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <div className="w-3 h-3 rounded-full bg-white/15" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                  </div>
                  <span className="ml-4 text-xs text-white/20 font-mono">
                    csquare-cli — event-manager
                  </span>
                </div>
                {/* Terminal body */}
                <div className="p-6 font-mono text-sm space-y-3">
                  <div className="flex items-center text-white/25">
                    <span className="text-white/50 mr-2">▲</span>
                    <span className="text-white/40">csquare</span>
                    <span className="text-white/20 mx-1">~</span>
                    <span className="text-white/60">event create</span>
                  </div>
                  <div className="text-white/20 pl-5 space-y-1.5">
                    <p>
                      <span className="text-white/40">title:</span>{" "}
                      <span className="text-white/50">&quot;Hackathon 2025&quot;</span>
                    </p>
                    <p>
                      <span className="text-white/40">type:</span>{" "}
                      <span className="text-white/50">&quot;hackathon&quot;</span>
                    </p>
                    <p>
                      <span className="text-white/40">capacity:</span>{" "}
                      <span className="text-white/60">200</span>
                    </p>
                    <p>
                      <span className="text-white/40">qr_enabled:</span>{" "}
                      <span className="text-white/60">true</span>
                    </p>
                  </div>
                  <div className="flex items-center text-white/30 mt-4">
                    <span className="text-white/50 mr-2">✓</span>
                    Event created. Link: <span className="text-white/50 ml-1 underline">csquare.club/e/h25</span>
                  </div>
                  <div className="flex items-center text-white/30">
                    <span className="text-white/50 mr-2">✓</span>
                    QR codes generated for <span className="text-white/60 mx-1">200</span> seats
                  </div>
                  <div className="flex items-center text-white/20 mt-2">
                    <span className="text-white/50 mr-2">▲</span>
                    <span className="text-white/40">csquare</span>
                    <span className="text-white/20 mx-1">~</span>
                    <span className="cursor-blink text-white/60">|</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </SlideIn>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <ScaleIn>
            <div className="relative rounded-[32px] overflow-hidden shimmer">
              {/* Pure black background */}
              <div className="absolute inset-0 bg-black" />

              <div className="relative z-10 p-12 md:p-20 text-center text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Rocket className="w-10 h-10 mx-auto mb-6 text-white/30" />
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    Ready to join the club?
                  </h2>
                  <p className="text-lg text-white/40 max-w-lg mx-auto mb-10">
                    Sign in with your university email and start registering for
                    events in seconds. No passwords, no hassle.
                  </p>
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-gray-100 font-semibold px-8 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                    >
                      Get Started
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>
    </div>
  );
}
