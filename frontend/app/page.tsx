"use client";

import { useEffect, useState } from "react";
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
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  TiltCard,
  AnimatedCounter,
  ScaleIn,
  SlideIn,
  Marquee,
} from "@/components/animations/MotionElements";
import { HoverDotGrid } from "@/components/animations/HoverDotGrid";
import { fetchStats, fetchEvents, fetchTeam, type PublicStats } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Event, TeamMemberPublic } from "@/types";

export default function Home() {
  const [stats, setStats] = useState<PublicStats>({
    total_registrations: 0,
    total_events: 0,
    total_checkins: 0,
    active_team_members: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberPublic[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    // Fetch all homepage live data in parallel
    Promise.allSettled([
      fetchStats(),
      fetchEvents({ upcoming: true, status: "published" }),
      fetchTeam(),
    ]).then(([statsRes, eventsRes, teamRes]) => {
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
        setStatsLoaded(true);
      }
      if (eventsRes.status === "fulfilled") {
        // Show at most 3 upcoming events
        setUpcomingEvents(eventsRes.value.results.slice(0, 3));
      }
      if (teamRes.status === "fulfilled") {
        // Show at most 6 team members
        setTeamMembers(teamRes.value.slice(0, 6));
      }
    });
  }, []);

  // Build stat cards from live data
  const statCards = [
    {
      value: stats.total_registrations,
      suffix: "+",
      label: "Students Registered",
      icon: <Users className="w-5 h-5" />,
    },
    {
      value: stats.total_events,
      suffix: "+",
      label: "Events Hosted",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      value: stats.total_checkins,
      suffix: "+",
      label: "Check-ins Processed",
      icon: <QrCode className="w-5 h-5" />,
    },
    {
      value: stats.active_team_members,
      suffix: "",
      label: "Team Members",
      icon: <Trophy className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full h-[calc(100vh-129px)] overflow-hidden flex flex-col items-center text-center px-5 md:px-10 bg-white text-black noise-overlay">
        {/* Interactive dots background */}
        <HoverDotGrid />
        {/* Subtle white ambient glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="flex-1 flex items-center justify-center w-full pb-24">
        <div className="relative z-10 max-w-[900px] w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-semibold tracking-wider text-gray-600 mb-6">
              <span className="w-2 h-2 rounded-full bg-black" />
              CHANDIGARH UNIVERSITY&apos;S TECH CLUB
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
              <Button size="lg" className="group bg-black text-white hover:bg-gray-800 w-[200px] justify-center">
                Explore Events
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/team">
              <Button
                variant="outline"
                size="lg"
                className="border-black/10 text-black hover:bg-black/5 w-[200px] justify-center"
              >
                Meet the Team
              </Button>
            </Link>
          </motion.div>
        </div>
        </div>

        {/* Scroll indicator — absolute so it truly anchors to section bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-black/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-0.5 h-1.5 rounded-full bg-black/40" />
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
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {statCards.map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1} className="text-center stat-underline cursor-default">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-black/[0.02] border border-black/[0.08] flex items-center justify-center text-black/40">
                  {stat.icon}
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold tracking-tight text-black">
                {statsLoaded ? (
                  <>
                    <AnimatedCounter value={stat.value} />
                    {stat.suffix}
                  </>
                ) : (
                  <span className="inline-block w-16 h-10 bg-gray-100 rounded animate-pulse align-bottom" />
                )}
              </p>
              <p className="text-sm text-black/40 mt-2">{stat.label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── UPCOMING EVENTS PREVIEW ─── */}
      {upcomingEvents.length > 0 && (
        <section className="w-full py-16 md:py-24 bg-white border-b border-black/[0.04]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10">
            <FadeUp className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
                  What&apos;s On
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Upcoming Events.
                </h2>
              </div>
              <Link href="/events" className="hidden sm:block">
                <Button variant="ghost" className="text-[var(--c-muted-text)] group">
                  View all
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <TiltCard className="h-full">
                    <Link href={`/events/${event.slug}`} className="block h-full">
                      <div className="h-full flex flex-col rounded-[24px] border border-[var(--c-border)] bg-white overflow-hidden hover:shadow-xl transition-all duration-500 group">
                        {/* Banner */}
                        <div className="h-36 bg-black flex items-center justify-center relative overflow-hidden">
                          {event.banner_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={event.banner_image_url} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl font-black text-white/[0.04] tracking-tighter select-none relative z-10">
                              {event.event_type.toUpperCase()}
                            </span>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full capitalize">
                              {event.event_type}
                            </span>
                          </div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-6">
                          <h3 className="font-semibold text-lg mb-3 group-hover:text-[var(--c-accent)] transition-colors leading-snug">
                            {event.title}
                          </h3>
                          <div className="space-y-2 text-sm text-[var(--c-secondary-text)]">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>{formatDate(event.start_datetime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span>{event.registered_count}/{event.capacity} registered</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 pb-6">
                          <div className="flex items-center text-sm font-medium text-black group-hover:gap-2 transition-all gap-1">
                            View Details
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── WHAT WE DO (3D Cards) ─── */}
      <section className="w-full py-16 md:py-24 relative">
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
      <section className="w-full bg-[var(--c-surface)] py-16 md:py-24 relative overflow-hidden">

        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Three simple steps.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connecting line on desktop — centered on the 64px icon (32px from top) */}
            <div className="hidden md:block absolute top-[31px] left-[16.5%] right-[16.5%] h-[1px] bg-gray-200 z-0">
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
                desc: "On event day, show your QR code at the venue. A volunteer scans it and you're instantly checked in.",
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

      {/* ─── MEET THE TEAM PREVIEW ─── */}
      {teamMembers.length > 0 && (
        <section className="w-full py-16 md:py-24 bg-white border-b border-black/[0.04]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10">
            <FadeUp className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--c-muted-text)] mb-4 inline-block">
                  Our People
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Meet the team.
                </h2>
              </div>
              <Link href="/team" className="hidden sm:block">
                <Button variant="ghost" className="text-[var(--c-muted-text)] group">
                  See everyone
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 md:gap-8">
              {teamMembers.map((member) => (
                <StaggerItem key={member.id}>
                  <TiltCard className="flex flex-col items-center text-center group cursor-default">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--c-surface)] border-2 border-[var(--c-border)] mb-3 overflow-hidden transition-all duration-500 group-hover:border-black/20 group-hover:shadow-md">
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[var(--c-muted-text)] bg-gradient-to-br from-gray-50 to-gray-100">
                          {member.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-xs leading-tight mb-0.5">{member.full_name}</p>
                    <p className="text-[10px] text-[var(--c-muted-text)] leading-tight">{member.designation}</p>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="mt-10 text-center sm:hidden">
              <Link href="/team">
                <Button variant="outline">Meet Everyone</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURE SHOWCASE (Split Section) ─── */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 flex flex-col md:flex-row gap-12 items-center">
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
      <section className="w-full py-16 md:py-24">
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
