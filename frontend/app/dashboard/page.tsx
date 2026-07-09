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
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
import { fetchMyRegistrations, logout } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Registration } from "@/types";

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
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    async function loadData() {
      try {
        const regsData = await fetchMyRegistrations();
        setRegistrations(regsData.results);
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
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  }


  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-white bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white/50 mb-4" />
        <p className="text-white/50">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-white bg-black">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-xl font-medium mb-2">Could not load dashboard</p>
        <p className="text-white/50">{error || "User data not found."}</p>
      </div>
    );
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const isPast = new Date(reg.event.start_datetime) < new Date();
    return activeTab === "past" ? isPast : !isPast;
  });

  return (
    <div className="w-full">
      {/* Dashboard Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 md:py-14 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold shadow-lg uppercase">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">
                    Hey, {user.full_name?.split(" ")[0] || "Student"}!
                  </h1>
                  <p className="text-sm text-white/40">
                    {user.email} &middot; {user.student_uid || "No UID"} &middot; {user.branch || "No Branch"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  {loggingOut ? "Logging out..." : "Log out"}
                </Button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-16">
        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 mb-10">
          {(["upcoming", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}
        </div>

        {/* Registrations */}
        <StaggerContainer className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 mb-4">No {activeTab} registrations found.</p>
              <Link href="/events">
                <Button variant="outline">Browse Events</Button>
              </Link>
            </div>
          ) : (
            filteredRegistrations.map((reg) => {
              const status = statusConfig[reg.status] || statusConfig.pending;
              return (
                <StaggerItem key={reg.id}>
                  <Link href={`/dashboard/${reg.id}`}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="w-full bg-white border border-[var(--c-border)] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${status.bg} ${status.color}`}
                        >
                          {status.icon}
                          <span className="ml-1.5">{status.label}</span>
                        </span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Registered {formatDate(reg.registered_at)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold hover:text-[var(--c-primary)] transition-colors mb-2">
                        {reg.event.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-[var(--c-secondary-text)]">
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

                    <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--c-border)]">
                      {reg.status === "approved" && (
                        <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-medium">
                          <QrCode className="w-4 h-4" />
                          View Ticket
                        </span>
                      )}
                      <span className="px-4 py-2 rounded-xl border border-[var(--c-border)] text-sm font-medium text-[var(--c-secondary-text)] hover:border-black transition-colors">
                        Details
                      </span>
                    </div>
                  </motion.div>
                  </Link>
                </StaggerItem>
              );
            })
          )}
        </StaggerContainer>
      </div>
    </div>
  );
}
