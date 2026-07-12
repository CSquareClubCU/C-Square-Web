"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
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
  User,
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
import { ScrollGallery } from "@/components/animations/ScrollGallery";
import { fetchStats, fetchEvents, fetchTeam, type PublicStats } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Event, TeamMemberPublic } from "@/types";

const getGradientForType = (type: string) => {
  switch (type.toLowerCase()) {
    case "hackathon": return "from-[#ff8c5a] to-[#e42c64]";
    case "workshop": return "from-[#5477f5] to-[#804cf3]";
    case "seminar": return "from-[#4cd4b0] to-[#207af5]";
    case "competition": return "from-[#f55497] to-[#b14cf3]";
    default: return "from-gray-400 to-gray-600";
  }
};

const getDotColorForType = (type: string) => {
  switch (type.toLowerCase()) {
    case "hackathon": return "bg-gradient-to-br from-[#ff8c5a] to-[#e42c64]";
    case "workshop": return "bg-gradient-to-br from-[#5477f5] to-[#804cf3]";
    case "seminar": return "bg-gradient-to-br from-[#4cd4b0] to-[#207af5]";
    case "competition": return "bg-gradient-to-br from-[#f55497] to-[#b14cf3]";
    default: return "bg-gradient-to-br from-gray-400 to-gray-600";
  }
};

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
      }
      setStatsLoaded(true);
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
      <section className="relative w-full min-h-[calc(100vh-165px)] overflow-hidden flex flex-col items-center text-center px-5 md:px-10 bg-white text-black noise-overlay">
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
            className="text-xl md:text-2xl text-gray-600 max-w-[650px] mx-auto mb-10 leading-[1.25] font-medium"
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
      <section className="w-full bg-gradient-to-b from-white to-[#f8f9fa] text-black py-5 border-b border-black/[0.04]">
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

      {/* ─── FLAGSHIP SECTION ─── */}
      <section className="w-full bg-[#f8f9fa] border-b border-black/[0.04] py-16 md:py-24">
        <div className="max-w-[1200px] w-full mx-auto px-5 md:px-10">
          <FadeUp>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-orange-600 mb-3 inline-block">
              FLAGSHIP EVENT
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 md:mb-10 text-black">
              Our biggest weekend of the year.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card */}
            <FadeUp delay={0.1} className="bg-[#0a0a0a] text-white rounded-[24px] p-8 md:p-10 border border-black/[0.04] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold text-white/90 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Flagship • Hackathon
                </div>
                
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">
                  CodeStorm 2026
                </h3>
                
                <p className="text-lg text-gray-400 mb-8 font-medium">
                  48-hour flagship hackathon. ₹5L prize pool.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 mb-8 text-[14px] font-medium text-gray-300">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Friday, August 14
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    CU Innovation Hub, Block C
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-gray-500" />
                    ₹5,00,000 prize pool
                  </div>
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-gray-500 ml-0.5">
                      <path d="M12 2L22 20H2L12 2Z" />
                    </svg>
                    48-hour build sprint
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Link href="/events/codestorm-2026">
                  <Button className="bg-orange-500 text-white hover:bg-orange-600 h-12 px-6 text-[14px] font-semibold group border border-orange-500">
                    Register now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform opacity-70" />
                  </Button>
                </Link>
                <Link href="/events/codestorm-2026">
                  <Button variant="outline" className="border-white/10 text-white h-12 px-6 text-[14px] font-semibold hover:bg-white/5 bg-transparent">
                    View details
                  </Button>
                </Link>
              </div>
            </FadeUp>

            {/* Right Card */}
            <FadeUp delay={0.2} className="relative rounded-[24px] overflow-hidden p-8 md:p-10 flex flex-col justify-between text-white bg-gradient-to-tr from-[#161420] via-[#1a1722] to-[#6d3039] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("/noise.png")' }}></div>

              <div className="relative z-10 mb-8">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  Starts in
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-4 gap-2 md:gap-3 mb-10">
                {[
                  { value: "33", label: "DAYS" },
                  { value: "08", label: "HOURS" },
                  { value: "08", label: "MINUTES" },
                  { value: "16", label: "SECONDS" }
                ].map((time) => (
                  <div key={time.label} className="bg-black/20 border border-white/[0.08] rounded-[16px] md:rounded-[20px] p-3 md:p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                    <span className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 text-white">{time.value}</span>
                    <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-white/80 uppercase">{time.label}</span>
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex items-end justify-between pt-6 mt-auto">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-2">PRIZE POOL</div>
                  <div className="text-3xl md:text-4xl font-bold">₹5,00,000</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-2">TEAMS</div>
                  <div className="text-3xl md:text-4xl font-bold">240+</div>
                </div>
              </div>
              
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 text-xs md:text-sm text-white/50 font-medium">
                48 hours • 3 tracks • Open to CU students and external participants.
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative w-full bg-white border-y border-black/[0.04] py-8 shadow-[0_4px_40px_rgba(0,0,0,0.01)] overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[100px] bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-blue-500/10 blur-3xl rounded-full pointer-events-none opacity-50" />

        <div className="max-w-[1200px] mx-auto px-5 md:px-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-16 relative z-10">
          
          <div className="md:w-[220px] shrink-0 border-l-2 border-black/10 pl-5">
             <p className="text-[14px] leading-relaxed text-gray-500 font-medium">
               <span className="text-black font-semibold">C Square Impact.</span><br />
               Building the next generation of tech talent.
             </p>
          </div>
          
          <div className="flex-1 flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
            {statCards.map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1} className="flex items-center gap-3.5 group cursor-default">
                 <div className="w-10 h-10 rounded-[12px] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300 shadow-sm">
                   {stat.icon && React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-4 h-4 transition-colors" })}
                 </div>
                 <div className="flex flex-col justify-center">
                   <span className="text-xl md:text-2xl font-bold tracking-tight text-black flex items-baseline leading-none mb-1">
                      {statsLoaded ? (
                        <>
                          <AnimatedCounter value={stat.value} />
                          <span className="text-black/40 ml-0.5">{stat.suffix}</span>
                        </>
                      ) : (
                        <span className="inline-block w-8 h-5 bg-black/5 rounded animate-pulse" />
                      )}
                   </span>
                   <span className="text-[12px] font-semibold tracking-wide text-gray-400 uppercase">{stat.label.split(' ')[0]}</span>
                 </div>
              </FadeUp>
            ))}
          </div>

        </div>
      </section>

      {/* ─── UPCOMING EVENTS PREVIEW ─── */}
      <section className="w-full pt-16 md:pt-24 pb-4 md:pb-8 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 mb-3 inline-block">
                UPCOMING
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
                What&apos;s on the calendar.
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm">
              <div className="px-5 py-2 rounded-[12px] bg-black text-white text-[13px] font-semibold cursor-default">All</div>
              <div className="px-5 py-2 rounded-[12px] text-gray-500 hover:text-black text-[13px] font-semibold cursor-default transition-colors">Hackathon</div>
              <div className="px-5 py-2 rounded-[12px] text-gray-500 hover:text-black text-[13px] font-semibold cursor-default transition-colors">Workshop</div>
              <div className="px-5 py-2 rounded-[12px] text-gray-500 hover:text-black text-[13px] font-semibold cursor-default transition-colors">Seminar</div>
              <div className="px-5 py-2 rounded-[12px] text-gray-500 hover:text-black text-[13px] font-semibold cursor-default transition-colors">Competition</div>
            </div>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(upcomingEvents.length > 0 ? upcomingEvents : [
              {
                id: '1', slug: 'codestorm-2026', title: 'CodeStorm 2026', event_type: 'hackathon',
                start_datetime: '2026-08-14T09:00:00Z', venue: 'CU Innovation Hub, Block C',
                description: '48-hour flagship hackathon. ₹5L prize pool.', banner_image_url: null,
                registered_count: 120, capacity: 500, is_registration_open: true, registration_deadline: ''
              },
              {
                id: '2', slug: 'react-workshop', title: 'React 20 Hands-on Workshop', event_type: 'workshop',
                start_datetime: '2026-07-22T14:00:00Z', venue: 'Lecture Theatre 2, Block A',
                description: 'Ship a full-stack app in one afternoon.', banner_image_url: null,
                registered_count: 45, capacity: 60, is_registration_open: true, registration_deadline: ''
              },
              {
                id: '3', slug: 'system-design', title: 'System Design Bootcamp', event_type: 'seminar',
                start_datetime: '2026-07-28T10:00:00Z', venue: 'Auditorium, Block D',
                description: 'Design at scale with senior engineers from Google & Stripe.', banner_image_url: null,
                registered_count: 80, capacity: 200, is_registration_open: true, registration_deadline: ''
              }
            ] as Event[]).map((event) => {
                const gradient = getGradientForType(event.event_type);
                const dotColor = getDotColorForType(event.event_type);
                const eventDate = new Date(event.start_datetime);
                return (
                  <StaggerItem key={event.id}>
                    <TiltCard className="h-full">
                      <Link href={`/events/${event.slug}`} className="block h-full group">
                        <div className="h-full flex flex-col rounded-[24px] border border-gray-100 bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-500">
                          
                          {/* Banner */}
                          <div className={`h-48 relative overflow-hidden bg-gradient-to-br ${gradient} p-4`}>
                            {event.banner_image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={event.banner_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            
                            {/* Type Badge */}
                            <div className="absolute top-4 left-4 z-10">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-gray-800 shadow-sm">
                                 <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                 <span className="capitalize">{event.event_type}</span>
                              </div>
                            </div>
                    
                            {/* Date Square */}
                            <div className="absolute bottom-4 right-4 z-10">
                              <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md">
                                 <span className="text-lg font-bold text-black leading-none">{eventDate.getDate()}</span>
                                 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5">
                                   {eventDate.toLocaleString('default', { month: 'short' })}
                                 </span>
                              </div>
                            </div>
                          </div>
                    
                          {/* Content */}
                          <div className="flex-1 p-6 flex flex-col">
                            <h3 className="font-bold text-xl mb-2 text-black leading-snug group-hover:text-blue-600 transition-colors">
                              {event.title}
                            </h3>
                            
                            <p className="text-gray-500 text-[14px] font-medium leading-relaxed mb-6 line-clamp-2">
                               {event.description || "Join us for this exciting event!"}
                            </p>
                            
                            <div className="mt-auto space-y-3 mb-6">
                              <div className="flex items-center gap-3 text-[13px] font-medium text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{formatDate(event.start_datetime)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-medium text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{event.venue}</span>
                              </div>
                            </div>
                            
                            <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[13px] font-bold text-black">View details</span>
                              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-black group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </TiltCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>
          </div>
        </section>

      {/* ─── PAST EVENTS (SCROLL GALLERY) ─── */}
      <ScrollGallery />

      {/* ─── MEET THE TEAM PREVIEW ─── */}
      {teamMembers.length > 0 && (
        <section className="w-full pt-16 md:pt-24 pb-20 md:pb-32 bg-[#f8f9fa] border-t border-black/[0.04]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10">
            <FadeUp className="text-center mb-16">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-3 inline-block">
                THE TEAM
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black">
                Meet the Curators
              </h2>
              <p className="text-gray-500 text-[15px] md:text-[16px] font-medium max-w-xl mx-auto">
                The humans behind the club infrastructure, working to build a better campus community.
              </p>
            </FadeUp>

            <StaggerContainer className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {teamMembers.slice(0, 5).map((member) => (
                <StaggerItem key={member.id} className="w-full sm:w-[calc(50%-12px)] md:w-[calc(25%-18px)] max-w-[240px]">
                  <TiltCard className="flex flex-col items-center text-center group cursor-default bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 transition-all duration-300 h-full">
                    
                    {/* Avatar Image */}
                    <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden bg-gray-50 shadow-sm border border-black/[0.04] mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <User className="w-6 h-6 text-black/40 stroke-0" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    
                    <p className="font-bold text-[15px] text-gray-900 mb-1.5 leading-snug">{member.full_name}</p>
                    <p className="text-[13px] font-medium text-gray-500">{member.designation}</p>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="mt-12 text-center sm:hidden">
              <Link href="/team">
                <Button variant="outline" className="border-black/10">Meet Everyone</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
