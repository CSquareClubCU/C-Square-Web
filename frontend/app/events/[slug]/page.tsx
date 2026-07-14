"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";
import { fetchEventById, fetchCurrentUser, registerForEvent, cancelRegistration, fetchMyRegistrations } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Users,
  CalendarDays,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  XCircle,
  User as UserIcon,
  Video,
  Image as ImageIcon,
<<<<<<< HEAD
  Rocket,
  Award,
  Lightbulb,
  Globe,
  ChevronDown,
  ChevronUp,
  Search
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp, SlideIn } from "@/components/animations/MotionElements";
import type { Event, User, Registration } from "@/types";

<<<<<<< HEAD
// Countdown hook
function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    if (!targetDate) return;
    
    const target = new Date(targetDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
<<<<<<< HEAD
  
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaqs, setOpenFaqs] = useState<string[]>([]);
  
  const toggleFaq = (faqId: string) => {
    setOpenFaqs((prev) => 
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f

  useEffect(() => {
    const slug = params.slug as string;
    if (!slug) return;

<<<<<<< HEAD
=======
    // Load event and current user concurrently
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    Promise.allSettled([
      fetchEventById(slug),
      fetchCurrentUser(),
    ]).then(([eventResult, userResult]) => {
      if (eventResult.status === "fulfilled") setEvent(eventResult.value);
      if (userResult.status === "fulfilled") setUser(userResult.value);
    }).finally(() => setLoading(false));
  }, [params.slug]);

<<<<<<< HEAD
=======
  // After user is loaded, check if they already have a registration for this event
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  useEffect(() => {
    if (!user || !event) return;
    fetchMyRegistrations()
      .then((data) => {
        const existing = data.results.find((r) => r.event.id === event.id);
        if (existing) setMyRegistration(existing);
      })
<<<<<<< HEAD
      .catch(() => {});
  }, [user, event]);

  const countdown = useCountdown(event?.registration_deadline);

=======
      .catch(() => {
        // 401 = not logged in, ignore
      });
  }, [user, event]);

>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  async function handleRegister() {
    if (!event || !user) return;
    setRegLoading(true);
    setRegError(null);
    try {
      const reg = await registerForEvent(event.id);
      setMyRegistration(reg);
<<<<<<< HEAD
=======
      // Update the registered_count locally
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
      setEvent((prev) => prev ? { ...prev, registered_count: prev.registered_count + 1 } : prev);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleCancel() {
    if (!myRegistration) return;
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setRegLoading(true);
    try {
      await cancelRegistration(myRegistration.id);
      setMyRegistration(null);
      setCancelConfirm(false);
      setEvent((prev) => prev ? { ...prev, registered_count: Math.max(0, prev.registered_count - 1) } : prev);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Failed to cancel registration.");
    } finally {
      setRegLoading(false);
    }
  }

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A00]" />
=======
      <div className="w-full max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-24 mb-8" />
        <div className="h-10 bg-gray-100 rounded w-2/3 mb-4" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-[32px]" />
          <div className="h-64 bg-gray-100 rounded-[32px]" />
        </div>
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
      </div>
    );
  }

  if (!event) {
    return (
<<<<<<< HEAD
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4 text-[#111]">Event not found</h1>
        <Link href="/events">
          <Button className="bg-[#111] text-white hover:bg-gray-800">Back to Events</Button>
=======
      <div className="w-full max-w-[1200px] mx-auto px-5 md:px-10 py-32 text-center">
        <h1 className="text-3xl font-bold mb-4">Event not found</h1>
        <Link href="/events">
          <Button variant="secondary">Back to Events</Button>
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
        </Link>
      </div>
    );
  }

<<<<<<< HEAD
=======

>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  const spotsLeft = Math.max(0, event.capacity - event.registered_count);
  const isFull = spotsLeft === 0;
  const isPastDeadline = new Date(event.registration_deadline) < new Date();
  const canRegister = !isFull && !isPastDeadline && event.status === "published" && event.is_registration_open !== false;
<<<<<<< HEAD
  
=======

  // Registration sidebar content depends on auth + existing registration
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  const isLoggedIn = !!user;
  const hasRegistration = !!myRegistration;
  const regStatus = myRegistration?.status;

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#f8f9fa] text-[#111] font-['Inter',sans-serif] pb-32">


      {/* Main Content Grid */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          
          {/* Left Column - Content */}
          <div className="flex-1 min-w-0">
            <FadeUp>
              {/* Banner */}
              <div className="w-full aspect-[2/1] rounded-[12px] overflow-hidden bg-gradient-to-br from-blue-900 to-red-900 mb-6 shadow-sm">
=======
    <div className="min-h-screen bg-[#ffffff] text-[#111111] selection:bg-black/10 pb-24 font-['Inter',sans-serif]">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-[96px]">
        
        {/* Back Link */}
        <FadeUp>
          <Link
            href="/events"
            className="text-[14px] text-[#6b7280] hover:text-[#111111] transition-colors flex items-center mb-10 w-fit font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Events
          </Link>
        </FadeUp>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24">
          
          {/* Left Column */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-8">
            <SlideIn direction="left">
              {/* Banner Image */}
              <div className="w-full aspect-square rounded-[16px] overflow-hidden bg-[#f5f5f5] border border-[#e5e7eb] relative">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                {event.banner_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
<<<<<<< HEAD
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/30" />
=======
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#898989]">
                    <ImageIcon className="w-16 h-16 mb-4" />
                    <span className="text-[14px] font-medium">No banner available</span>
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                  </div>
                )}
              </div>

<<<<<<< HEAD
              {/* Overview White Card */}
              <div id="overview" className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] p-8 md:p-10 mb-12 shadow-sm">
                <div 
                  className="text-[#374151] leading-[1.6] text-[15px] md:text-[16px] prose prose-p:mb-5 max-w-none prose-a:text-[#3b82f6]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || "<p>Join us for an exciting journey of creativity and innovation.</p>") }}
                />
              </div>

              {/* Prizes */}
              {event.prizes && event.prizes.length > 0 && (
                <div id="prizes" className="mb-12 pt-4">
                  <div className="flex items-center gap-6 mb-6">
                    <h2 className="text-[28px] font-semibold tracking-tight text-[#111111]">Prizes</h2>
                    <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.prizes.slice(0, 3).map((prize, idx) => (
                      <div key={idx} className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] p-5 flex items-center gap-4 hover:border-[#111111]/20 transition-colors shadow-sm">
                        <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center shrink-0">
                           <Award className="w-5 h-5 text-[#6b7280]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#111111] text-[16px]">{prize.position}</h4>
                          <p className="text-[14px] text-[#6b7280] line-clamp-1">{prize.award}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* FAQs */}
              <div id="faqs" className="mb-12 pt-4">
                <div className="flex items-center gap-6 mb-6">
                  <h2 className="text-[28px] font-semibold tracking-tight text-[#111111]">FAQs</h2>
                  <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
                </div>
                
                {/* Search Bar */}
                <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-[8px] p-4 flex items-center gap-3 mb-6 shadow-sm">
                  <Search className="w-5 h-5 text-[#6b7280]" />
                  <input 
                    type="text" 
                    placeholder="Search FAQs" 
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#111111] placeholder-[#6b7280]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Team Size Card */}
                  <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
                    <h4 className="font-semibold text-[#111111] text-[15px]">Team size</h4>
                    <p className="text-[#374151] mt-6 text-[15px]">
                      {event.is_team_event ? `${event.min_team_size || 1} - ${event.max_team_size || 4}` : '1 (Individual)'}
                    </p>
                  </div>
                  {/* Registration Costs Card */}
                  <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
                    <h4 className="font-semibold text-[#111111] text-[15px]">Registration costs?</h4>
                    <p className="text-[#374151] mt-6 text-[15px]">Free for all students.</p>
                  </div>
                </div>

                {event.faqs && event.faqs.length > 0 && (
                  <div className="space-y-4">
                    {event.faqs.map((faq, idx) => (
                      <div key={idx} className="bg-[#ffffff] border border-[#e5e7eb] rounded-[12px] shadow-sm overflow-hidden transition-all duration-300">
                        <div 
                          className="flex justify-between items-center cursor-pointer p-6" 
                          onClick={() => toggleFaq(`faq-${idx}`)}
                        >
                          <h4 className="font-semibold text-[#111111] text-[15px]">{faq.question}</h4>
                          {openFaqs.includes(`faq-${idx}`) ? <ChevronUp className="w-5 h-5 text-[#9ca3af]" /> : <ChevronDown className="w-5 h-5 text-[#9ca3af]" />}
                        </div>
                        <AnimatePresence initial={false}>
                          {openFaqs.includes(`faq-${idx}`) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <div className="px-6 pb-6 text-[#374151] text-[15px]">
                                <div className="pt-4 border-t border-[#f3f4f6]">
                                  {faq.answer}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </FadeUp>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 sticky top-[120px] h-fit self-start">
            <div className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] shadow-sm p-6 md:p-8">
                  
                  <h1 className="text-[24px] font-semibold tracking-tight text-[#111111] mb-8">
                    {event.title}
                  </h1>
                  
                  {/* Info List with Vertical Line Accent */}
                  <div className="relative pl-5 border-l-2 border-[#111111] mb-8 space-y-6">
                    <div>
                      <p className="text-[11px] font-semibold text-[#898989] uppercase tracking-widest mb-1">Runs From</p>
                      <p className="font-semibold text-[#111111] text-[16px]">
                        {new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#898989] uppercase tracking-widest mb-1">Happening</p>
                      <p className="font-semibold text-[#111111] text-[16px]">{event.venue}</p>
                    </div>
                  </div>

                  {/* Countdown Box */}
                  <div className="bg-[#f5f5f5] border border-[#e5e7eb] rounded-[12px] p-5 mb-6">
                    <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
                      Applications Close In
                    </p>
                    <p className="font-semibold text-[#111111] text-[18px]">
                      {isPastDeadline ? "Closed" : `${countdown.days}d:${countdown.hours}h:${countdown.minutes}m`}
                    </p>
                  </div>

                  {/* Action Button & Status */}
                  {hasRegistration ? (
                    <div className="flex flex-col gap-3">
                      <div className={`w-full rounded-[12px] p-4 flex items-center justify-center gap-2 border ${
                        regStatus === 'approved' ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 
                        regStatus === 'waitlisted' ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b]' :
                        regStatus === 'rejected' ? 'bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]' :
                        'bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6]'
                      }`}>
                        {regStatus === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : 
                         regStatus === 'rejected' ? <XCircle className="w-5 h-5" /> : 
                         <Clock className="w-5 h-5" />}
                        <span className="font-semibold text-[14px]">
                          {regStatus === "approved" ? "Joined" :
                           regStatus === "waitlisted" ? "Waitlisted" :
                           regStatus === "rejected" ? "Declined" :
                           "Pending"}
                        </span>
                      </div>
                      
                      {regStatus === "approved" && myRegistration.qr_image_url && (
                        <Link href={`/dashboard/${myRegistration.id}`}>
                          <Button className="w-full bg-[#111111] text-[#ffffff] hover:bg-[#242424] shadow-sm">
                            View Ticket
=======
              {/* Hosted By */}
              <div className="mt-8 pb-8 border-b border-[#f3f4f6]">
                <p className="text-[13px] font-medium text-[#898989] uppercase tracking-wider mb-3">Hosted By</p>
                <div className="flex items-center gap-3">
                  <div className="w-[36px] h-[36px] rounded-full bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center shrink-0">
                    <span className="text-[#111111] text-[12px] font-bold">CS</span>
                  </div>
                  <p className="font-semibold text-[16px] text-[#111111]">
                    {event.contact_name || "C Square Club"}
                  </p>
                </div>
              </div>

              {/* Attendees */}
              <div className="mt-8">
                <p className="font-semibold text-[#111111] text-[16px] mb-4">{event.registered_count.toLocaleString()} Went</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[...Array(Math.min(event.registered_count, 5))].map((_, i) => (
                      <div key={i} className={`w-[36px] h-[36px] rounded-full border-[3px] border-[#ffffff] flex items-center justify-center text-[10px] font-bold text-white
                        ${i === 0 ? "bg-[#3b82f6]" : i === 1 ? "bg-[#10b981]" : i === 2 ? "bg-[#f59e0b]" : i === 3 ? "bg-[#ec4899]" : "bg-[#8b5cf6]"}
                      `}>
                        <UserIcon className="w-4 h-4 text-white/90" />
                      </div>
                    ))}
                    {event.registered_count === 0 && (
                       <div className="w-[36px] h-[36px] rounded-full bg-[#f5f5f5] border-[3px] border-[#ffffff] flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-[#898989]" />
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </SlideIn>
          </div>

          {/* Right Column */}
          <div className="flex-1 lg:mt-4">
            <SlideIn direction="right">
              {/* Title */}
              <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] font-bold text-[#111111] tracking-tight leading-[1.05] mb-12" style={{ letterSpacing: '-2px' }}>
                {event.title}
              </h1>

              {/* Date Block */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f5f5f5] flex flex-col items-center justify-center shrink-0 border border-[#e5e7eb]">
                  <CalendarDays className="w-5 h-5 text-[#6b7280]" />
                </div>
                <div className="pt-1">
                  <p className="text-[18px] font-semibold text-[#111111]">
                    {new Date(event.start_datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-[14px] text-[#6b7280] mt-1">
                    {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)} {event.venue?.toLowerCase().includes('online') ? 'GMT+5:30' : ''}
                  </p>
                </div>
              </div>

              {/* Venue Block */}
              <div className="flex items-center gap-4 mb-14">
                <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f5f5f5] flex items-center justify-center shrink-0 border border-[#e5e7eb]">
                  {event.venue?.toLowerCase().includes('youtube') ? (
                    <Video className="w-5 h-5 text-[#6b7280]" />
                  ) : (
                    <MapPin className="w-5 h-5 text-[#6b7280]" />
                  )}
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-[#111111]">{event.venue}</p>
                </div>
              </div>

              {/* Registration / Status Card */}
              <div className="bg-[#f5f5f5] rounded-[12px] p-6 sm:p-8 border border-[#e5e7eb] max-w-xl mb-24">
                {hasRegistration ? (
                  <>
                    <div className={`w-10 h-10 rounded-full mb-5 flex items-center justify-center ${
                      regStatus === 'approved' ? 'bg-[#10b981]/10 text-[#10b981]' : 
                      regStatus === 'waitlisted' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                      regStatus === 'rejected' ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                      'bg-[#3b82f6]/10 text-[#3b82f6]'
                    }`}>
                      {regStatus === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : 
                       regStatus === 'rejected' ? <XCircle className="w-5 h-5" /> : 
                       <Clock className="w-5 h-5" />}
                    </div>

                    <h3 className="text-[22px] font-semibold mb-2 text-[#111111] tracking-tight">
                      {regStatus === "approved" ? "Thank You for Joining" :
                       regStatus === "waitlisted" ? "You're on the Waitlist" :
                       regStatus === "rejected" ? "Registration Declined" :
                       "Registration Pending"}
                    </h3>
                    <p className="text-[16px] text-[#6b7280] mb-8 leading-relaxed">
                      {regStatus === "approved" ? "We hope you enjoy the event!" :
                       regStatus === "waitlisted" ? `Waitlist position: ${myRegistration.waitlist_position || "TBD"}` :
                       regStatus === "rejected" ? "Unfortunately, we cannot accommodate you at this time." :
                       "Your request is being reviewed by the organizers."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {regStatus === "approved" && myRegistration.qr_image_url && (
                        <Link href={`/dashboard/${myRegistration.id}`} className="flex-1">
                          <Button className="w-full bg-[#111111] text-white hover:bg-[#242424] rounded-[8px] h-[40px] font-semibold text-[14px]">
                            View Ticket &amp; QR
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                          </Button>
                        </Link>
                      )}
                      
                      {(regStatus === "pending" || regStatus === "waitlisted") && (
<<<<<<< HEAD
                        <Button
                          onClick={handleCancel}
                          disabled={regLoading}
                          variant="outline"
                          className="w-full border-[#e5e7eb] text-[#374151] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/20 shadow-sm transition-colors"
                        >
                          {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (cancelConfirm ? "Confirm Cancel" : "Cancel Request")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {isLoggedIn ? (
                        <Button
                          className="w-full bg-[#111111] text-[#ffffff] hover:bg-[#242424] shadow-sm"
                          disabled={!canRegister || regLoading}
                          onClick={handleRegister}
                        >
                          {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                           !canRegister ? "Unavailable" : "Apply now"}
                        </Button>
                      ) : (
                        <Link href={`/login?next=/events/${event.slug}`}>
                          <Button className="w-full bg-[#111111] text-[#ffffff] hover:bg-[#242424] shadow-sm" disabled={!canRegister}>
                            {canRegister ? "Log in to Apply" : "Unavailable"}
                          </Button>
                        </Link>
                      )}
                      
                      <AnimatePresence>
                        {regError && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[13px] text-[#ef4444] mt-2 font-medium text-center"
                          >
                            {regError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </div>
            </div>
          </div>
          
        </div>
      </div>
=======
                        <div className="flex-1 flex flex-col gap-2">
                           {cancelConfirm && <p className="text-[13px] text-[#ef4444] text-center font-medium">Click again to cancel</p>}
                           <Button
                             onClick={handleCancel}
                             disabled={regLoading}
                             variant="secondary"
                             className={`w-full rounded-[8px] h-[40px] font-semibold text-[14px] transition-colors ${
                               cancelConfirm
                                 ? "bg-[#ef4444] text-white border-transparent hover:bg-red-600"
                                 : "bg-white text-[#111111] border-[#e5e7eb] hover:bg-[#f8f9fa]"
                             }`}
                           >
                             {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (cancelConfirm ? "Confirm cancel" : "Cancel registration")}
                           </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-[22px] font-semibold mb-2 text-[#111111] tracking-tight">
                      {isFull ? "Registration Full" : 
                       !event.is_registration_open ? "Registration Closed" : 
                       isPastDeadline ? "Deadline Passed" :
                       "Secure Your Spot"}
                    </h3>
                    <p className="text-[16px] text-[#6b7280] mb-8 leading-relaxed">
                      {canRegister ? `Registration closes ${formatDate(event.registration_deadline)}` :
                       "Stay tuned for future events."}
                    </p>

                    <AnimatePresence>
                      {regError && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[14px] text-[#ef4444] mb-4 bg-red-50 p-3 rounded-[8px] border border-red-100 font-medium"
                        >
                          {regError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {isLoggedIn ? (
                      <Button
                        className="w-full bg-[#111111] text-white hover:bg-[#242424] rounded-[8px] h-[40px] font-semibold text-[14px]"
                        disabled={!canRegister || regLoading}
                        onClick={handleRegister}
                      >
                        {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         !canRegister ? "Unavailable" : "Register Now"}
                      </Button>
                    ) : (
                      <Link href={`/login?next=/events/${event.slug}`}>
                        <Button className="w-full bg-[#111111] text-white hover:bg-[#242424] rounded-[8px] h-[40px] font-semibold text-[14px]" disabled={!canRegister}>
                          {canRegister ? "Log in to Register" : "Unavailable"}
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Event Details (Description, Rules, etc.) */}
              <div className="space-y-16 max-w-[800px]">
                <div>
                  <h2 className="text-[22px] font-semibold text-[#111111] mb-6 tracking-tight">About the Event</h2>
                  <div
                    className="text-[#374151] leading-[1.5] text-[16px] prose prose-p:mb-4 prose-a:text-[#3b82f6] max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
                  />
                </div>

                {event.rules && (
                  <div className="pt-12 border-t border-[#f3f4f6]">
                    <h2 className="text-[22px] font-semibold text-[#111111] mb-6 tracking-tight">Rules & Guidelines</h2>
                    <div
                      className="text-[#374151] leading-[1.5] text-[16px] prose prose-p:mb-4 max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.rules) }}
                    />
                  </div>
                )}
                
                {event.prizes && event.prizes.length > 0 && (
                  <div className="pt-12 border-t border-[#f3f4f6]">
                    <h2 className="text-[22px] font-semibold text-[#111111] mb-6 tracking-tight">Prizes & Awards</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {event.prizes.map((prize, idx) => (
                        <div key={idx} className="p-6 rounded-[12px] bg-[#f5f5f5] border border-[#e5e7eb] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none select-none">
                            <span className="text-[64px] font-bold text-[#111111] leading-none tracking-tight">{idx + 1}</span>
                          </div>
                          <div className="relative z-10">
                            <span className="text-[13px] font-medium text-[#6b7280] mb-2 block">
                              {prize.position}
                            </span>
                            <h3 className="text-[18px] font-semibold text-[#111111] mb-1">{prize.award}</h3>
                            {prize.description && (
                              <p className="text-[14px] text-[#6b7280]">{prize.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info / Tags */}
                <div className="pt-12 border-t border-[#f3f4f6] flex flex-wrap gap-3">
                   <span className="text-[13px] font-medium text-[#111111] bg-[#f5f5f5] px-3 py-1 rounded-full border border-[#e5e7eb]">
                     {event.event_type}
                   </span>
                   {event.is_team_event && (
                     <span className="text-[13px] font-medium text-[#111111] bg-[#f5f5f5] px-3 py-1 rounded-full border border-[#e5e7eb] flex items-center">
                       <Users className="w-3.5 h-3.5 mr-1.5 text-[#6b7280]" /> Team Event
                     </span>
                   )}
                   {event.is_open_to_external && (
                     <span className="text-[13px] font-medium text-[#111111] bg-[#f5f5f5] px-3 py-1 rounded-full border border-[#e5e7eb] flex items-center">
                       <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#6b7280]" /> Open to All
                     </span>
                   )}
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  );
}
