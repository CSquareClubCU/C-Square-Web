"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const REMARK_PLUGINS = [remarkGfm];
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
  Rocket,
  Award,
  Lightbulb,
  Globe,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp, SlideIn } from "@/components/animations/MotionElements";
import TeamStatusWidget from "@/components/events/TeamStatusWidget";
import type { Event, User, Registration, Team } from "@/types";

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

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaqs, setOpenFaqs] = useState<string[]>([]);
  
  const toggleFaq = (faqId: string) => {
    setOpenFaqs((prev) => 
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };

  useEffect(() => {
    const slug = params.slug as string;
    if (!slug) return;

    Promise.allSettled([
      fetchEventById(slug),
      fetchCurrentUser(),
    ]).then(([eventResult, userResult]) => {
      if (eventResult.status === "fulfilled") setEvent(eventResult.value);
      if (userResult.status === "fulfilled") setUser(userResult.value);
    }).finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    if (!user || !event) return;
    fetchMyRegistrations()
      .then((data) => {
        const existing = data.results.find((r) => r.event.id === event.id);
        if (existing) setMyRegistration(existing);
      })
      .catch(() => {});
  }, [user, event]);

  const countdown = useCountdown(event?.registration_deadline);

  async function handleRegister() {
    if (!event || !user) return;
    setRegLoading(true);
    setRegError(null);
    try {
      const reg = await registerForEvent(event.id);
      setMyRegistration(reg);
      // registered_count only counts approved registrations — only increment if auto-approved
      if (reg.status === 'approved') {
        setEvent((prev) => prev ? { ...prev, registered_count: prev.registered_count + 1 } : prev);
      }
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
      const wasApproved = myRegistration.status === 'approved';
      setMyRegistration(prev => prev ? { ...prev, status: 'cancelled' } : null);
      setCancelConfirm(false);
      if (wasApproved) {
        setEvent((prev) => prev ? { ...prev, registered_count: Math.max(0, prev.registered_count - 1) } : prev);
      }
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Failed to cancel registration.");
    } finally {
      setRegLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A00]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4 text-[#111]">Event not found</h1>
        <Link href="/events">
          <Button className="bg-[#111] text-white hover:bg-gray-800">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const spotsLeft = Math.max(0, event.capacity - event.registered_count);
  const isFull = spotsLeft === 0;
  const isPastDeadline = new Date(event.registration_deadline) < new Date();
  const canRegister = !isFull && !isPastDeadline && event.status === "published" && event.is_registration_open !== false;
  
  const isLoggedIn = !!user;
  const hasRegistration = !!myRegistration;
  const regStatus = myRegistration?.status;
  const showTeamSection = event.is_team_event && myRegistration && (regStatus === "approved" || regStatus === "pending");

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111] font-['Inter',sans-serif] pb-32">


      {/* Main Content Grid */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">
          
          {/* Left Column - Content */}
          <div className="flex-1 min-w-0">
            <FadeUp>
              {/* Banner */}
              <div className="w-full aspect-[2/1] rounded-[12px] overflow-hidden bg-gradient-to-br from-blue-900 to-red-900 mb-6 shadow-sm">
                {event.banner_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/30" />
                  </div>
                )}
              </div>

              {/* Overview White Card */}
              <div id="overview" className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] p-8 md:p-10 mb-12 shadow-sm">
                <div className="prose prose-sm md:prose-base max-w-none prose-a:text-[#3b82f6] text-[#374151]">
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                    {event.description || "Join us for an exciting journey of creativity and innovation."}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Rules */}
              {event.rules && (
                <div id="rules" className="bg-[#ffffff] rounded-[12px] border border-[#e5e7eb] p-8 md:p-10 mb-12 shadow-sm">
                  <h2 className="text-[28px] font-semibold tracking-tight text-[#111111] mb-6">Rules & Guidelines</h2>
                  <div className="prose prose-sm md:prose-base max-w-none prose-a:text-[#3b82f6] text-[#374151]">
                    <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                      {event.rules}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

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
          <div className={`w-full lg:w-[340px] xl:w-[380px] shrink-0 h-fit self-start ${showTeamSection ? '' : 'sticky top-[120px]'}`}>
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
                    <>
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
                          </Button>
                        </Link>
                      )}
                      
                      {(regStatus === "pending" || regStatus === "waitlisted") && (
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
                    
                    {showTeamSection && (
                      <TeamStatusWidget 
                        registration={myRegistration}
                        onTeamUpdated={(team: Team | null) => {
                          setMyRegistration(prev => prev ? { ...prev, team } : null);
                        }}
                      />
                    )}
                  </>
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
  );
}
