"use client";

/**
 * /admin
 *
 * Admin overview dashboard — stats, quick actions, recent events.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  QrCode,
  ClipboardList,
  Loader2,
  AlertCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
import { fetchEvents, fetchStats, logout } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import type { Event } from "@/types";
import type { PublicStats } from "@/lib/api";

const statusColors: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth({ role: "admin" });
  const [events, setEvents] = useState<Event[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.allSettled([
      fetchEvents({}),
      fetchStats(),
    ])
      .then(([eventsRes, statsRes]) => {
        if (eventsRes.status === "fulfilled") {
          setEvents(eventsRes.value.results);
          setRecentEvents(eventsRes.value.results.slice(0, 5));
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  if (!user) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white text-black">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-xl font-medium mb-2">Could not load dashboard</p>
        <p className="text-gray-500">User data not found.</p>
      </div>
    );
  }

  // Note: published is only based on the current page of results. 
  // For a true total, backend stats would need to return published_events.
  const published = events.filter((e) => e.status === "published").length;
  const total = stats?.total_events ?? 0;

  const now = new Date();
  
  // Current Date Formatting
  const currentDateFormatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-12 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{currentDateFormatted}</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-3">
              Hey, {user.full_name?.split(" ")[0] || "Admin"}.
            </h1>
            <p className="text-gray-600 text-[15px]">
              You have <strong className="text-black">{total} total events</strong> and <strong className="text-black">{stats?.total_registrations ?? 0} registrations</strong> to manage.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/events/new">
              <Button variant="outline" className="px-6">Create Event</Button>
            </Link>
            <Button onClick={handleLogout} className="px-6 bg-black text-white hover:bg-gray-800">
              Log out
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              href: "/admin/events/new",
              icon: <Plus className="w-6 h-6 text-black" />,
              label: "Create Event",
              desc: "Publish a new event",
            },
            {
              href: "/admin/events",
              icon: <CalendarDays className="w-6 h-6 text-black" />,
              label: "All Events",
              desc: "Manage your events",
            },
            {
              href: "/admin/team",
              icon: <Users className="w-6 h-6 text-black" />,
              label: "Core Team",
              desc: "Manage team display",
            },
            {
              href: "/checkin",
              icon: <QrCode className="w-6 h-6 text-black" />,
              label: "Check-in Scanner",
              desc: "Start scanning QR codes",
            },
            {
              href: "/admin/past-events",
              icon: <ClipboardList className="w-6 h-6 text-black" />,
              label: "Past Events",
              desc: "Manage homepage gallery",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="p-6 rounded-[24px] bg-[#f8f9fa] border border-black/[0.04] cursor-pointer h-full transition-all hover:shadow-md group"
              >
                <div className="w-12 h-12 rounded-[12px] bg-white border border-black/[0.04] flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <p className="font-semibold text-black mb-1 tracking-tight">{item.label}</p>
                <p className="text-[13px] text-gray-500 font-medium">
                  {item.desc}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            {
              label: "Total Events",
              value: total,
              icon: <CalendarDays className="w-4 h-4" />,
            },
            {
              label: "Published",
              value: published,
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: "Total Registrations",
              value: stats?.total_registrations ?? "—",
              icon: <ClipboardList className="w-4 h-4" />,
            },
            {
              label: "Checked In",
              value: stats?.total_checkins ?? "—",
              icon: <CheckCircle2 className="w-4 h-4" />,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2 text-[13px] text-gray-500 font-semibold mb-4">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-3xl font-semibold tracking-tight text-black">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Events List */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-black">Recent Events</h2>
            <Link href="/admin/events">
              <Button variant="outline" className="px-5 text-gray-600">
                View all
              </Button>
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-16 bg-[#f8f9fa] rounded-[24px] border border-black/[0.04]">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4 font-medium">No events yet</p>
              <Link href="/admin/events/new">
                <Button className="bg-black text-white hover:bg-gray-800 px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <StaggerContainer className="space-y-4">
              {recentEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <Link href={`/admin/events/${event.slug}`}>
                    <div
                      className="w-full bg-white border border-black/[0.04] rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 rounded-[12px] bg-[#f8f9fa] border border-black/[0.04] flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold tracking-tight group-hover:text-black/70 transition-colors mb-1 truncate">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatDate(event.start_datetime)}
                            </span>
                            <span className="capitalize border-l border-gray-300 pl-3">
                              {event.event_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border ${
                            statusColors[event.status] || "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {event.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

      </div>
    </div>
  );
}
