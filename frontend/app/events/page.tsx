"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { fetchEvents } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { MapPin, Calendar, ArrowRight, Search, Trophy, Users, LayoutGrid } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem, TiltCard } from "@/components/animations/MotionElements";
import { Typewriter } from "@/components/animations/Typewriter";
import { Event } from "@/types";
import { motion } from "framer-motion";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";

// Custom Countdown Hook
function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    
    const target = new Date(targetDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

const CountdownBlock = ({ label, value }: { label: string, value: number }) => (
  <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white/5 rounded-[12px] border border-white/10 min-w-[60px] sm:min-w-[70px] shadow-sm">
    <span className="text-xl sm:text-2xl font-black text-white leading-none mb-1">{value.toString().padStart(2, '0')}</span>
    <span className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</span>
  </div>
);

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCategory, setActiveCategory, filterBarRef, handleFilterClick } = useCategoryFilter<string>("All");
  const [activeStatus, setActiveStatus] = useState("Upcoming");
  const [activeYear, setActiveYear] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Hackathon", "Competition", "Workshop", "Seminar"];

  useEffect(() => {
<<<<<<< HEAD
    fetchEvents()
      .then((data) => {
        setEvents(data.results);
      })
      .catch((error) => {
        console.error("Failed to fetch events:", error);
      })
      .finally(() => {
        setLoading(false);
      });
=======
    fetchEvents().then((data) => {
      setEvents(data.results);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  }, []);

  // Use the event marked as flagship
  const flagshipEvent = useMemo(() => {
    return events.find((e) => e.is_flagship) || events.find((e) => e.status === "published") || null;
  }, [events]);

  const timeLeft = useCountdown(flagshipEvent?.start_datetime);

  // Single unified grid logic based on all filters
  const filteredEvents = useMemo(() => {
    let list = events;

    // Filter Flagship out of the grid since it is displayed above
    if (flagshipEvent) {
      list = list.filter((e) => e.id !== flagshipEvent.id);
    }

    // Status Filter (Upcoming / Past)
    if (activeStatus === "Upcoming") {
      list = list.filter((e) => e.status === "published");
    } else {
      list = list.filter((e) => e.status === "completed");
    }

    // Category Filter
    if (activeCategory !== "All") {
      list = list.filter((e) => e.event_type.toLowerCase() === activeCategory.toLowerCase());
    }

    // Search Filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => 
        e.title.toLowerCase().includes(q) || 
        e.venue.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Year Filter
    if (activeYear !== "All") {
      list = list.filter((e) => new Date(e.start_datetime).getFullYear().toString() === activeYear);
    }

    return list;
  }, [events, flagshipEvent, activeStatus, activeCategory, searchQuery, activeYear]);



  const EventCard = ({ event, isPast = false }: { event: Event, isPast?: boolean }) => {
    return (
      <div className={`flex flex-col h-full bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isPast ? 'opacity-70 hover:opacity-100 transition-opacity grayscale-[30%]' : ''}`}>
        <Link href={`/events/${event.slug}`} className="flex flex-col h-full relative z-10 block">
          
          {/* Top Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-1 line-clamp-1">
                {event.title}
              </h3>
              <span className="text-sm font-medium text-gray-400 capitalize">
                {event.event_type}
              </span>
            </div>
            {/* Decorative Top Right Icon */}
            <div className="w-10 h-10 rounded-full bg-black/[0.03] flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {/* Middle Section (Details & Stats) */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Details
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                  {event.venue}
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                  {event.is_team_event ? "Team Event" : "Individual"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Fake Avatars */}
              <div className="flex -space-x-2 mr-3">
                <div className="w-7 h-7 rounded-full border-2 border-gray-50 bg-gradient-to-br from-blue-400 to-indigo-500"></div>
                <div className="w-7 h-7 rounded-full border-2 border-gray-50 bg-gradient-to-br from-purple-400 to-pink-500"></div>
                <div className="w-7 h-7 rounded-full border-2 border-gray-50 bg-gradient-to-br from-emerald-400 to-teal-500"></div>
              </div>
              <span className="text-[13px] font-bold text-emerald-600">
                +{event.registered_count} participating
              </span>
            </div>
          </div>

          {/* Bottom Section (Badges + Action) */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                Offline
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-emerald-700'}`}>
                {isPast ? "Closed" : "Open"}
              </span>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                Starts {formatDate(event.start_datetime)}
              </span>
            </div>
            <div className="px-6 py-2 bg-[#0A0A0A] text-white rounded-[8px] text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors flex-shrink-0 h-[40px]">
              Apply now
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </Link>
      </div>
    );
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Creative Header */}
      <section className="pt-4 md:pt-6 pb-2 relative overflow-hidden bg-transparent">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        
        <div className="max-w-[1200px] mx-auto w-full px-6">
          <FadeUp className="relative z-10 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-2">
              <LayoutGrid className="w-4 h-4 text-black" />
              <span className="text-sm font-semibold text-black tracking-wide">
                What's on
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-[#111] mb-1 leading-none min-h-[48px] md:min-h-[60px] flex items-start">
              <Typewriter texts={["Events.", "Hackathons.", "Competitions.", "Workshops.", "Seminars."]} speed={80} pause={3000} />
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Events Container */}
      <section className="pb-24">
        <div className="max-w-[1200px] mx-auto w-full px-6">
        
        {/* Scroll Anchor */}
        <div ref={filterBarRef} className="scroll-mt-24 pt-2 md:pt-4" />

        {/* Unified Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-10 w-full"
        >
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-x-auto no-scrollbar w-full">
            {/* Categories */}
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterClick(category)}
                className={`px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  activeCategory === category
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0 hidden md:block"></div>

            {/* Status Toggle */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {["Upcoming", "Past"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatus(status as "Upcoming" | "Past");
                    setTimeout(() => filterBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }}
                  className={`px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all whitespace-nowrap ${
                    activeStatus === status
                      ? "bg-black text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Dropdown (Year/Type) */}
            <div className="relative flex-shrink-0 ml-1">
              <select 
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-[8px] px-4 py-2 pr-8 text-[13px] font-semibold text-gray-500 outline-none hover:text-black focus:border-gray-300 transition-colors cursor-pointer h-[40px]"
              >
                <option value="All">All</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-1 items-center gap-2 px-3 py-1.5 bg-white rounded-[8px] border border-gray-200 focus-within:border-gray-400 transition-colors min-w-[200px] ml-1 h-[40px]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[13px] font-semibold placeholder:text-gray-400 outline-none w-full"
              />
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[28px] border border-black/[0.04] bg-white p-8 animate-pulse h-96" />
            ))}
          </div>
        ) : (
<<<<<<< HEAD
          <>
            {/* Split Flagship Event Card */}
            {flagshipEvent && activeStatus === "Upcoming" && activeCategory === "All" && searchQuery === "" && (
              <FadeUp className="mb-12">
                <span className="text-sm md:text-base font-black text-[#111] uppercase tracking-widest block mb-4">
                  Flagship Event
                </span>
                
                <div className="w-full flex flex-col lg:flex-row rounded-[24px] overflow-hidden border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-[#0A0A0A]">
                  {/* Left Panel: Info */}
                  <div className="p-5 md:p-6 lg:w-1/2 flex flex-col h-full bg-transparent relative z-10">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A00]"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                          Flagship • {flagshipEvent.event_type}
=======
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
            {filtered.map((event) => (
              <StaggerItem key={event.id}>
                <TiltCard className="h-full">
                  <div className="h-full flex flex-col rounded-[24px] border border-[var(--c-border)] bg-white overflow-hidden hover:shadow-xl transition-shadow duration-500">
                    {/* Banner Area */}
                    <div className="h-40 bg-black flex items-center justify-center relative overflow-hidden">
                      {event.banner_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.banner_image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl font-black text-white/[0.04] tracking-tighter relative z-10">
                          {event.event_type.toUpperCase()}
                        </span>
                      )}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="text-xs font-semibold uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full">
                          {event.event_type}
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                        </span>
                      </div>
                      
                      <h3 className="text-3xl md:text-4xl font-semibold text-white mb-2 tracking-tighter leading-[1.1]">
                        {flagshipEvent.title}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2 font-medium">
                        {flagshipEvent.description || "Join us for our biggest event of the year."}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-gray-300 font-medium text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(flagshipEvent.start_datetime)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300 font-medium text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="line-clamp-1">{flagshipEvent.venue}</span>
                        </div>
                      </div>
                    </div>

<<<<<<< HEAD
                    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                      <Link href={`/events/${flagshipEvent.slug}`} className="flex-1">
                        <Button className="w-full rounded-[8px] text-sm font-semibold bg-[#FF5A00] text-white hover:bg-[#E04D00] border-0 flex items-center justify-center gap-2 group/btn shadow-[0_0_20px_rgba(255,90,0,0.3)]">
                          Register now
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </Link>
                      <Link href={`/events/${flagshipEvent.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-[8px] text-sm font-semibold bg-transparent text-white border-white/20 hover:bg-white/5 hover:border-white/40">
                          View details
=======
                    <div className="flex-1 flex flex-col p-8">
                      <h3 className="text-xl font-semibold mb-4">{event.title}</h3>
                      <div className="space-y-3 text-sm text-[var(--c-secondary-text)] mb-6 flex-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-3 shrink-0" />
                          <span>{formatDate(event.start_datetime)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-3 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-3 shrink-0" />
                          <span>{event.registered_count} / {event.capacity}</span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
                        <div
                          className="bg-[var(--c-accent)] h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(0, Math.min((event.registered_count / (event.capacity || 1)) * 100, 100))}%` }}
                        />
                      </div>

                      <Link href={`/events/${event.slug}`} className="w-full">
                        <Button variant="outline" className="w-full group">
                          View Details
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right Panel: Metrics & Countdown */}
                  <div className="lg:w-1/2 p-5 md:p-6 bg-transparent flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/5">
                    <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest w-fit mb-6">
                      Starts In
                    </span>
                    
                    <div className="flex items-center gap-2 sm:gap-3 mb-8">
                      <CountdownBlock label="Days" value={timeLeft.days} />
                      <CountdownBlock label="Hours" value={timeLeft.hours} />
                      <CountdownBlock label="Minutes" value={timeLeft.minutes} />
                      <CountdownBlock label="Seconds" value={timeLeft.seconds} />
                    </div>
                    
                    <div className="w-full h-px bg-white/10 mb-6"></div>
                    
                    <div className="flex justify-between items-end mb-4">
                      {flagshipEvent.prizes && flagshipEvent.prizes.length > 0 ? (
                        <div>
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1">Prize Pool</span>
                          <span className="text-2xl sm:text-3xl font-black text-white">
                            {flagshipEvent.prizes[0].award}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1">Rewards</span>
                          <span className="text-xl sm:text-2xl font-black text-white">Certificates & Merch</span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1">Teams / Capacity</span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                          {flagshipEvent.capacity ? `${flagshipEvent.capacity}+ Spots` : "Open to All"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-white/40 font-medium">
                      {flagshipEvent.is_team_event ? `${flagshipEvent.min_team_size}-${flagshipEvent.max_team_size} members per team.` : "Individual participation."} 
                      {flagshipEvent.is_open_to_external ? " Open to CU students and external participants." : " Exclusive to CU students."}
                    </p>
                  </div>
                </div>
              </FadeUp>
            )}

            {/* Dynamic Grid */}
            {filteredEvents.length > 0 ? (
              <div>
                <span className="text-sm md:text-base font-black text-[#111] uppercase tracking-widest block mb-4">
                  {activeStatus === "Upcoming" ? "Upcoming Events" : "Past Events"}
                </span>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                  {filteredEvents.map((event) => (
                    <div key={event.id}>
                      <EventCard event={event} isPast={activeStatus === "Past"} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <FadeUp className="text-center py-24 bg-white rounded-[32px] border border-black/[0.04] shadow-sm">
                <div className="w-20 h-20 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-black/30" />
                </div>
                <h3 className="text-2xl font-bold text-[#111] mb-2">No events found</h3>
                <p className="text-lg text-black/40 max-w-md mx-auto">
                  We couldn't find any {activeStatus.toLowerCase()} events matching your filters. Try clearing them!
                </p>
                <Button 
                  variant="outline" 
                  className="mt-8 px-5 rounded-[8px] font-semibold"
                  onClick={() => {
                    setActiveCategory("All");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </FadeUp>
            )}
          </>
        )}
        </div>
      </section>
    </div>
  );
}
