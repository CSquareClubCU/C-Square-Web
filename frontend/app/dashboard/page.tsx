"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Trophy,
  Loader2,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
import { fetchMyRegistrations, logout, fetchSettings } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Registration, Event } from "@/types";

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-black",
    bg: "bg-gray-100 border border-gray-200",
  },
  pending: {
    label: "Pending Review",
    icon: <Clock className="w-4 h-4" />,
    color: "text-gray-600",
    bg: "bg-gray-50 border border-gray-200",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-white",
    bg: "bg-black",
  },
  waitlisted: {
    label: "Waitlisted",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-gray-600",
    bg: "bg-white border border-gray-200 border-dashed",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-gray-500",
    bg: "bg-gray-50 border border-gray-200",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const { user, loading: authLoading } = useRequireAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("profile_updated") === "true") {
        setSuccess("Profile updated successfully!");
        window.history.replaceState({}, "", "/dashboard");
        const timer = setTimeout(() => setSuccess(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    async function loadData() {
      try {
        const [regsData, settingsData] = await Promise.all([
          fetchMyRegistrations(),
          fetchSettings().catch(() => ({ whatsapp_group_link: "" }))
        ]);
        setRegistrations(regsData.results);
        setWhatsappLink(settingsData?.whatsapp_group_link || "");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, authLoading]);

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white text-black">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-xl font-medium mb-2">Could not load dashboard</p>
        <p className="text-gray-500">{error || "User data not found."}</p>
      </div>
    );
  }

  const now = new Date();
  
  // Current Date Formatting (e.g. "Monday, 13 July")
  const currentDateFormatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const upcomingRegs = registrations.filter(
    (reg) => new Date(reg.event.start_datetime) >= now && reg.status !== "cancelled" && reg.status !== "rejected" && reg.event.status !== "draft"
  );
  
  const pastRegs = registrations.filter(
    (reg) => new Date(reg.event.start_datetime) < now && reg.status !== "cancelled" && reg.status !== "rejected" && reg.event.status !== "draft"
  );
  
  // Sort upcoming by soonest
  const sortedUpcoming = [...upcomingRegs].sort(
    (a, b) => new Date(a.event.start_datetime).getTime() - new Date(b.event.start_datetime).getTime()
  );
  
  const nextUpEvent = sortedUpcoming.length > 0 ? sortedUpcoming[0].event : null;
  const nextUpReg = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

  const filteredRegistrations = activeTab === "upcoming" ? upcomingRegs : pastRegs;

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-12 pb-24">
        
        {success && (
          <FadeUp>
            <div className="mb-8 p-4 bg-green-50 text-green-700 rounded-[16px] text-sm flex items-center gap-3 border border-green-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium">{success}</span>
            </div>
          </FadeUp>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{currentDateFormatted}</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-3">
              Hey, {user.full_name?.split(" ")[0] || "Student"}.
            </h1>
            <p className="text-gray-600 text-[15px]">
              You have <strong className="text-black">{upcomingRegs.length} upcoming events</strong> and <strong className="text-black">{user.club_points?.toLocaleString() || 0} club points</strong>. Keep the streak going.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/events">
              <Button variant="outline" className="px-6">Browse events</Button>
            </Link>
            <Button onClick={handleLogout} className="px-6">
              Log out
            </Button>
          </div>
        </div>

        {/* WhatsApp Community Banner */}
        {whatsappLink && (
          <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
            <div>
              <h3 className="font-bold text-xl mb-1">Join our WhatsApp Community</h3>
              <p className="text-gray-500 text-sm">Scan the QR code or click the link to stay connected with fellow members and get instant updates.</p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="bg-[#f8f9fa] p-2 rounded-xl border border-gray-100">
                <QRCodeSVG value={whatsappLink} size={80} level="M" />
              </div>
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-black text-white hover:bg-gray-800">
                  Join WhatsApp
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-black/[0.04]">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-4">
              <CalendarDays className="w-4 h-4" />
              Registered
            </div>
            <div className="text-3xl font-semibold tracking-tight text-black mb-1">{upcomingRegs.length}</div>
            <div className="text-[13px] text-gray-500">Upcoming</div>
          </div>
          
          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-black/[0.04]">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Attended
            </div>
            <div className="text-3xl font-semibold tracking-tight text-black mb-1">{pastRegs.length}</div>
            <div className="text-[13px] text-gray-500">Past events</div>
          </div>
          
          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-black/[0.04]">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-4">
              <Trophy className="w-4 h-4" />
              Club points
            </div>
            <div className="text-3xl font-semibold tracking-tight text-black mb-1">{user.club_points?.toLocaleString() || 0}</div>
            <div className="text-[13px] text-gray-500">{user.club_rank ? `Rank #${user.club_rank}` : "Unranked"}</div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column (Next Up + Registrations) */}
          <div className="lg:col-span-2 space-y-12">
            
            {nextUpEvent && nextUpReg && (
              <div className="bg-[#111111] rounded-[24px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
                {/* Subtle gradient overlay */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] text-orange-500 uppercase mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Next up &middot; In {Math.ceil((new Date(nextUpEvent.start_datetime).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                  
                  <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter mb-4">{nextUpEvent.title}</h2>
                  <p className="text-white/60 text-[15px] md:text-base max-w-lg mb-10 leading-relaxed">
                    Join us for the upcoming {nextUpEvent.event_type}. We're excited to see you there.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">When</p>
                      <p className="font-semibold">{formatDate(nextUpEvent.start_datetime)}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Where</p>
                      <p className="font-semibold truncate">{nextUpEvent.venue}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/dashboard/${nextUpReg.id}`)}>
                      <div>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</p>
                        <p className="font-semibold text-green-400 capitalize">{nextUpReg.status}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations List */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold tracking-tight text-black">Your Events</h3>
                
                <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm">
                  {(["upcoming", "past"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-[12px] text-[13px] font-semibold transition-all duration-200 capitalize ${
                        activeTab === tab
                          ? "bg-black text-white"
                          : "text-gray-500 hover:text-black hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <StaggerContainer className="space-y-4">
                {filteredRegistrations.length === 0 ? (
                  <div className="text-center py-16 bg-[#f8f9fa] rounded-[24px] border border-black/[0.04]">
                    <p className="text-gray-500 mb-4">No {activeTab} events found.</p>
                    <Link href="/events">
                      <Button variant="outline">Browse Events</Button>
                    </Link>
                  </div>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const status = statusConfig[reg.status] || statusConfig.pending;
                    return (
                      <StaggerItem key={reg.id}>
                        <div
                          onClick={() => router.push(`/dashboard/${reg.id}`)}
                          className="w-full bg-white border border-black/[0.04] rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${status.bg} ${status.color}`}
                              >
                                {status.icon}
                                <span className="ml-1.5">{status.label}</span>
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" />
                                Registered {formatDate(reg.registered_at)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight group-hover:text-black/70 transition-colors mb-2">
                              {reg.event.title}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[13px] text-gray-500 font-medium">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                {formatDate(reg.event.start_datetime)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-gray-400" />
                                {reg.event.venue}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-black/[0.04]">
                            {reg.status === "approved" && (
                              <Button variant="primary" size="sm" className="gap-2">
                                <QrCode className="w-4 h-4" />
                                View Ticket
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-[#f8f9fa] border-black/[0.04] hover:bg-gray-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/events/${reg.event.slug}`);
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })
                )}
              </StaggerContainer>
            </div>
            
          </div>
          
          {/* Right Column (Profile Card) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-[32px] border border-black/[0.04] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold uppercase shrink-0">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-black">{user.full_name}</h3>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="text-black font-semibold truncate ml-4" title={user.email}>{user.email}</span>
                </div>
                <div className="h-px w-full bg-black/[0.04]" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">UID</span>
                  <span className="text-black font-semibold">{user.student_uid || "-"}</span>
                </div>
                <div className="h-px w-full bg-black/[0.04]" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500 font-medium">Leaderboard</span>
                  <span className="text-black font-semibold">{user.club_rank ? `#${user.club_rank}` : "Unranked"}</span>
                </div>
              </div>
              
              <Link href="/dashboard/settings" className="block w-full">
                <Button variant="outline" className="w-full h-11 border-black/[0.08]">
                  Edit profile
                </Button>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

