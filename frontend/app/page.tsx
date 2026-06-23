"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Code, Users, Calendar, Zap, Shield, QrCode } from "lucide-react";
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
} from "@/components/animations/MotionElements";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-5 md:px-10 bg-black text-white">
        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-50" />
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 mesh-gradient" />

        {/* Floating geometric shapes for 3D depth */}
        <Float duration={6} distance={15} className="absolute top-[15%] left-[8%] hidden lg:block">
          <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 shadow-sm rotate-12" />
        </Float>
        <Float duration={5} distance={10} className="absolute top-[25%] right-[10%] hidden lg:block">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 shadow-sm" />
        </Float>
        <Float duration={7} distance={18} className="absolute bottom-[20%] left-[12%] hidden lg:block">
          <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 shadow-sm -rotate-6" />
        </Float>
        <Float duration={4} distance={8} className="absolute bottom-[30%] right-[8%] hidden lg:block">
          <div className="w-20 h-20 rounded-3xl border border-white/10 bg-white/5 shadow-sm rotate-45" />
        </Float>

        <div className="relative z-10 max-w-[900px]">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-white/80 mb-8 px-4 py-2 rounded-full border border-white/20 bg-white/10"
          >
            Chandigarh University&apos;s Tech Club
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] mb-8"
          >
            Build the future,
            <br />
            <span className="relative">
              one line at a time
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="absolute bottom-2 left-0 right-0 h-3 bg-white/20 -z-10 origin-left rounded-sm"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 max-w-[650px] mx-auto mb-12 leading-relaxed"
          >
            We host hackathons, coding competitions, and workshops to help you
            level up your skills. Register, get your QR code, and check in
            seamlessly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/events">
              <Button size="lg" className="group px-8 bg-white text-black hover:bg-gray-200">
                Explore Events
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/team">
              <Button variant="secondary" size="lg" className="px-8 border-white/20 text-white hover:bg-white/10 bg-transparent">
                Meet the Team
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-white" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="w-full border-y border-[var(--c-border)] bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 1000, suffix: "+", label: "Students Registered" },
            { value: 50, suffix: "+", label: "Events Hosted" },
            { value: 200, suffix: "+", label: "Check-ins Processed" },
            { value: 15, suffix: "", label: "Team Members" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1} className="text-center">
              <p className="text-4xl md:text-5xl font-bold tracking-tight">
                <AnimatedCounter value={stat.value} />
                {stat.suffix}
              </p>
              <p className="text-sm text-[var(--c-secondary-text)] mt-2">
                {stat.label}
              </p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── WHAT WE DO (3D Cards) ─── */}
      <section className="w-full py-24 md:py-32">
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
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Workshops",
                desc: "Hands-on sessions on Web3, AI/ML, cloud, and more. Learn from industry experts and experienced seniors.",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Seminars",
                desc: "Tech talks and panel discussions covering architecture, career growth, and industry trends.",
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 md:p-10 rounded-[24px] border border-[var(--c-border)] bg-white hover:shadow-xl transition-shadow duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center mb-6">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                    <p className="text-[var(--c-secondary-text)] leading-relaxed">
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
      <section className="w-full bg-[var(--c-surface)] py-24 md:py-32 dot-grid">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
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
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[1px] bg-[var(--c-border)]" />

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
                desc: "On event day, show your QR code at the venue. A volunteer scans it and you're instantly checked in.",
                icon: <QrCode className="w-5 h-5" />,
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="w-14 h-14 rounded-full bg-white border border-[var(--c-border)] flex items-center justify-center mx-auto mb-6 relative z-10 shadow-sm">
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-3 inline-block">
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
                "No passwords. Just magic links.",
                "Lightning fast QR check-ins.",
                "Real-time attendance dashboard.",
                "Built exclusively for CU students.",
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <li className="flex items-center text-[var(--c-primary-text)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--c-accent)] mr-4 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                </FadeUp>
              ))}
            </ul>
          </SlideIn>

          <SlideIn direction="right" className="w-full md:w-1/2">
            <TiltCard>
              <div className="aspect-[4/3] rounded-[32px] bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center relative overflow-hidden">
                {/* Fake dashboard mockup */}
                <div className="absolute inset-6 rounded-2xl bg-white border border-[var(--c-border)] shadow-sm p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                    <div className="w-3 h-3 rounded-full bg-yellow-300" />
                    <div className="w-3 h-3 rounded-full bg-green-300" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                    <div className="h-8 bg-[var(--c-surface)] rounded-xl w-full mt-4" />
                    <div className="h-8 bg-[var(--c-surface)] rounded-xl w-full" />
                    <div className="h-8 bg-[var(--c-surface)] rounded-xl w-full" />
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
            <div className="relative rounded-[32px] bg-[var(--c-accent)] text-white p-12 md:p-20 text-center overflow-hidden">
              {/* Subtle overlay pattern */}
              <div className="absolute inset-0 opacity-5 dot-grid" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                  Ready to join the club?
                </h2>
                <p className="text-lg text-white/70 max-w-lg mx-auto mb-10">
                  Sign in with your university email and start registering for
                  events in seconds. No passwords, no hassle.
                </p>
                <Link href="/login">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>
    </div>
  );
}
