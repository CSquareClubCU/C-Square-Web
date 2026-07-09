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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
import { fetchEvents, fetchStats } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Event } from "@/types";
import type { PublicStats } from "@/lib/api";

const statusColors: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AdminPage() {
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

  const published = events.filter((e) => e.status === "published").length;
  const total = events.length;


  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 md:py-14 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              Admin Console
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text">
              C² Dashboard
            </h1>
            <p className="text-white/40 mt-2">
              Manage events, registrations, and attendance.
            </p>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-14 space-y-12">

        {/* Quick Actions */}
        <FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/admin/events/new",
                icon: <Plus className="w-6 h-6" />,
                label: "Create Event",
                desc: "Publish a new event",
                accent: true,
              },
              {
                href: "/admin/events",
                icon: <CalendarDays className="w-6 h-6" />,
                label: "All Events",
                desc: "Manage your events",
              },
              {
                href: "/admin/team",
                icon: <Users className="w-6 h-6" />,
                label: "Team Members",
                desc: "Manage team display",
              },
              {
                href: "/checkin",
                icon: <QrCode className="w-6 h-6" />,
                label: "Check-in Scanner",
                desc: "Start scanning QR codes",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`p-6 rounded-2xl border cursor-pointer h-full transition-all duration-200 ${
                    item.accent
                      ? "bg-black text-white border-black hover:bg-[var(--c-accent-hover)]"
                      : "bg-white border-[var(--c-border)] hover:border-[var(--c-accent)]/20 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      item.accent
                        ? "bg-white/10"
                        : "bg-[var(--c-surface)] border border-[var(--c-border)]"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <p className="font-semibold mb-1">{item.label}</p>
                  <p
                    className={`text-sm ${
                      item.accent ? "text-white/60" : "text-[var(--c-muted-text)]"
                    }`}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Events",
                value: total,
                icon: <CalendarDays className="w-5 h-5" />,
              },
              {
                label: "Published",
                value: published,
                icon: <TrendingUp className="w-5 h-5" />,
              },
              {
                label: "Total Registrations",
                value: stats?.total_registrations ?? "—",
                icon: <ClipboardList className="w-5 h-5" />,
              },
              {
                label: "Checked In",
                value: stats?.total_checkins ?? "—",
                icon: <CheckCircle2 className="w-5 h-5" />,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-[var(--c-border)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center mb-4 text-[var(--c-secondary-text)]">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold mb-1">{loading ? "—" : stat.value}</p>
                <p className="text-sm text-[var(--c-muted-text)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Events</h2>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm" className="text-[var(--c-muted-text)]">
                View all
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[var(--c-border)] rounded-2xl">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[var(--c-secondary-text)] font-medium">No events yet</p>
              <p className="text-sm text-[var(--c-muted-text)] mt-1">Create your first event to get started.</p>
              <Link href="/admin/events/new" className="mt-4 inline-block">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <StaggerContainer className="space-y-3">
              {recentEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <Link href={`/admin/events/${event.slug}`}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-5 bg-white border border-[var(--c-border)] rounded-2xl cursor-pointer hover:border-[var(--c-accent)]/20 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5 text-[var(--c-secondary-text)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate group-hover:text-[var(--c-accent)] transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--c-muted-text)] mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.start_datetime)}
                            <span>·</span>
                            <span className="capitalize">{event.event_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                            statusColors[event.status] || statusColors.draft
                          }`}
                        >
                          {event.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--c-accent)] transition-colors" />
                      </div>
                    </motion.div>
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
