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
import type { Event, CoreTeamMemberPublic } from "@/types";

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

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const timeLeft = useCountdown(targetDate);
  return (
    <>
      {[
        { value: timeLeft.days, label: "DAYS" },
        { value: timeLeft.hours, label: "HOURS" },
        { value: timeLeft.minutes, label: "MINUTES" },
        { value: timeLeft.seconds, label: "SECONDS" }
      ].map((time) => (
        <div key={time.label} className="bg-black/20 border border-white/[0.08] rounded-[16px] md:rounded-[20px] p-3 md:p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <span className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 text-white">{time.value}</span>
          <span className="text-[8px] md:text-[9px] font-semibold tracking-[0.15em] text-white/80 uppercase">{time.label}</span>
        </div>
      ))}
    </>
  );
}

export default function Home() {
  const [stats, setStats] = useState<PublicStats>({
    total_registrations: 0,
    total_events: 0,
    total_checkins: 0,
    active_team_members: 0,
  });
  const [homeEvents, setHomeEvents] = useState<Event[]>([]);
  const [flagshipEvent, setFlagshipEvent] = useState<Event | null>(null);
  const [teamMembers, setTeamMembers] = useState<CoreTeamMemberPublic[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [eventFilter, setEventFilter] = useState("All");

  useEffect(() => {
    // Fetch all homepage live data in parallel
    Promise.allSettled([
      fetchStats(),
      fetchEvents({ status: "published" }),
      fetchTeam(),
    ]).then(([statsRes, eventsRes, teamRes]) => {
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      }
      setStatsLoaded(true);
      if (eventsRes.status === "fulfilled") {
        const publishedEvents = eventsRes.value.results;
        const flagship = publishedEvents.find((e: Event) => e.is_flagship) || publishedEvents[0] || null;
        setFlagshipEvent(flagship);
        
        // Store all published events so filtering works correctly
        setHomeEvents(publishedEvents);
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
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[1.05] text-black">
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
      <section className="relative w-full bg-white pt-6 pb-2 md:pt-8 md:pb-4">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] shadow-sm p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
            
            <div className="lg:w-[240px] shrink-0 border-l-2 border-[#111111] pl-5">
               <p className="text-[14px] leading-relaxed text-[#6b7280] font-medium">
                 <span className="text-[#111111] font-semibold tracking-tight">C Square Impact</span><br />
                 Building the next generation of tech talent, one event at a time.
               </p>
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
              {statCards.map((stat, i) => (
                <FadeUp key={i} delay={i * 0.1} className="flex flex-col cursor-default">
                   <span className="text-3xl md:text-4xl font-semibold tracking-tighter text-[#111111] flex items-baseline leading-none mb-2">
                      {statsLoaded ? (
                        <>
                          <AnimatedCounter value={stat.value} />
                          <span className="text-[#6b7280] ml-1">{stat.suffix}</span>
                        </>
                      ) : (
                        <span className="inline-block w-12 h-8 bg-[#f5f5f5] rounded animate-pulse" />
                      )}
                   </span>
                   <span className="text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase flex items-center gap-1.5">
                     {stat.icon && React.cloneElement(stat.icon as React.ReactElement<any>, { className: "w-3.5 h-3.5 text-[#111111]" })}
                     {stat.label}
                   </span>
                </FadeUp>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ♦ FLAGSHIP SECTION ♦ */}
      {(() => {
        const flagship = flagshipEvent;
        if (!flagship) return null;
        
        const prizePool = flagship.prizes && flagship.prizes.length > 0 ? flagship.prizes[0].award : "TBA";
        const isPast = flagship.end_datetime ? new Date(flagship.end_datetime) < new Date() : new Date(flagship.start_datetime) < new Date();
        const durationText = flagship.end_datetime 
          ? `${Math.max(1, Math.floor((new Date(flagship.end_datetime).getTime() - new Date(flagship.start_datetime).getTime()) / (1000 * 60 * 60)))} hours` 
          : "TBA";
        return (
      <section className="w-full bg-white pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="max-w-[1200px] w-full mx-auto px-5 md:px-10">
          <FadeUp>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-orange-600 mb-3 inline-block">
              FLAGSHIP EVENT
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter mb-8 md:mb-10 text-black">
              Our biggest weekend of the year.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card */}
            <FadeUp delay={0.1} className="bg-[#0a0a0a] text-white rounded-[24px] p-8 md:p-10 border border-black/[0.04] shadow-2xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold text-white/90 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Flagship • {flagship.event_type.charAt(0).toUpperCase() + flagship.event_type.slice(1)}
                </div>
                
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-3 text-white">
                  {flagship.title}
                </h3>
                
                <p className="text-lg text-gray-400 mb-8 font-medium">
                  {flagship.description || "Join us for our biggest event of the year."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 mb-8 text-[14px] font-medium text-gray-300">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {new Date(flagship.start_datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {flagship.venue}
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-gray-500" />
                    {prizePool}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500 ml-0.5" />
                    {durationText} duration
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                {flagship.is_registration_open && !isPast ? (
                  <Link href={`/events/${flagship.slug}`}>
                    <Button className="bg-orange-500 text-white hover:bg-orange-600 h-12 px-6 text-[14px] font-semibold group border border-orange-500">
                      Register now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform opacity-70" />
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="bg-gray-800 text-gray-400 h-12 px-6 text-[14px] font-semibold cursor-not-allowed">
                    {isPast ? "Event Concluded" : "Registration Closed"}
                  </Button>
                )}
                <Link href={`/events/${flagship.slug}`}>
                  <Button variant="outline" className="border-white/10 text-white h-12 px-6 text-[14px] font-semibold hover:bg-white/5 bg-transparent">
                    View details
                  </Button>
                </Link>
              </div>
            </FadeUp>

            {/* Right Card */}
            <FadeUp delay={0.2} className={`relative rounded-[24px] overflow-hidden p-8 md:p-10 flex flex-col justify-between text-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] ${isPast ? 'bg-gray-800' : 'bg-gradient-to-tr from-[#161420] via-[#1a1722] to-[#6d3039]'}`}>
              <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("/noise.png")' }}></div>

              <div className="relative z-10 mb-8">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {isPast ? "Event Concluded" : "Starts in"}
                </div>
              </div>

              {!isPast && (
                <div className="relative z-10 grid grid-cols-4 gap-2 md:gap-3 mb-10">
                  <CountdownTimer targetDate={flagship.start_datetime} />
                </div>
              )}

              <div className="relative z-10 flex items-end justify-between pt-6 mt-auto">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-2">PRIZE POOL</div>
                  <div className="text-3xl md:text-4xl font-bold">{prizePool}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold tracking-[0.15em] text-white/50 uppercase mb-2">STUDENTS</div>
                  <div className="text-3xl md:text-4xl font-bold">{flagship.registered_count || 0}+</div>
                </div>
              </div>
              
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 text-xs md:text-sm text-white/50 font-medium">
                {durationText} • {flagship.is_open_to_external ? "Open to CU students and external participants." : "Exclusive to CU students."}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
      );
    })()}



      {/* ─── UPCOMING EVENTS PREVIEW ─── */}
      <section className="w-full pt-6 pb-4 md:pt-8 md:pb-8 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 mb-3 inline-block">
                UPCOMING
              </span>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black">
                What&apos;s on the calendar.
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm">
              {["All", "Hackathon", "Workshop", "Competition"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEventFilter(cat)}
                  className={`px-5 py-2 rounded-[12px] text-[13px] font-semibold cursor-default transition-colors ${
                    eventFilter === cat
                      ? "bg-black text-white"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
              <Link href="/events" className="px-5 py-2 rounded-[12px] text-black hover:bg-gray-50 text-[13px] font-semibold transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </FadeUp>

          <StaggerContainer key={eventFilter} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const filteredEvents = homeEvents.filter(e => eventFilter === "All" || e.event_type === eventFilter.toLowerCase()).slice(0, 6);
              if (filteredEvents.length > 0) {
                return filteredEvents.map((event) => {
                  const gradient = getGradientForType(event.event_type);
                  const dotColor = getDotColorForType(event.event_type);
                  const eventDate = new Date(event.start_datetime);
                  return (
                    <StaggerItem key={event.id}>
                      <TiltCard className="h-full">
                        <Link href={`/events/${event.slug}`} className="block h-full group">
                          <div className={`h-full flex flex-col rounded-[24px] border border-gray-100 bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-500 ${eventDate < new Date() ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
                            
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
                              <h3 className="font-semibold tracking-tight text-xl mb-2 text-black leading-snug group-hover:text-blue-600 transition-colors">
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
                });
              } else {
                return (
                  <div className="col-span-1 md:col-span-3 text-center py-20 bg-gray-50 rounded-[24px] border border-gray-200">
                    <p className="text-xl font-semibold text-gray-600">No upcoming events right now.</p>
                    <p className="text-gray-500 mt-2">Check back later for updates!</p>
                  </div>
                );
              }
            })()}
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
        <section className="w-full pt-6 pb-16 md:pt-8 md:pb-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 md:px-10">
            <FadeUp className="text-center mb-16">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-3 inline-block">
                THE TEAM
              </span>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-4 text-black">
                Meet the Curators
              </h2>
              <p className="text-gray-500 text-[15px] md:text-[16px] font-medium max-w-xl mx-auto">
                The humans behind the club infrastructure, working to build a better campus community.
              </p>
            </FadeUp>

            <StaggerContainer className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {teamMembers.slice(0, 6).map((member) => (
                <StaggerItem key={member.id} className="w-full sm:w-[calc(50%-12px)] md:w-[calc(25%-18px)] max-w-[240px]">
                  <TiltCard className="flex flex-col items-center text-center group cursor-default bg-white rounded-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 border border-black/[0.04] h-full">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#F5F5F5] mb-5 overflow-hidden relative transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-[#999]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold tracking-tight text-[#111] text-lg mb-1">{member.full_name}</h3>
                    <p className="text-sm text-[#777] font-medium mb-6">
                      {member.designation}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-auto">
                      {member.github_url && (
                        <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                    </div>
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
