"use client";

/**
 * /checkin
 *
 * Event picker for volunteers and admins.
 * Lists all published events so the volunteer can select which
 * event they're checking in for today, then navigate to /checkin/[eventId].
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
<<<<<<< HEAD
import { useRequireAuth } from "@/hooks/useRequireAuth";
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
import {
  QrCode,
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  Users,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
import { fetchEvents } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event } from "@/types";

export default function CheckinIndexPage() {
<<<<<<< HEAD
  const { user } = useRequireAuth({ role: "volunteer" }); // Admin naturally passes
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    if (!user) return; // Wait until auth is resolved

    const params: any = { status: "published" };
    if (user.role === "volunteer") {
      params.assigned_only = true;
    }

    fetchEvents(params)
      .then((data) => setEvents(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);
=======
    // Volunteers need to see all published events (most likely today's)
    fetchEvents({ status: "published" })
      .then((data) => setEvents(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f

  // Sort by proximity to now
  const now = new Date();
  const sorted = [...events].sort((a, b) => {
    const diffA = Math.abs(new Date(a.start_datetime).getTime() - now.getTime());
    const diffB = Math.abs(new Date(b.start_datetime).getTime() - now.getTime());
    return diffA - diffB;
  });

  return (
<<<<<<< HEAD
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <section className="w-full pt-12 pb-8">
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          <FadeUp>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-[#f8f9fa] border border-black/[0.04] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-black" />
              </div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500">
                Check-in Station
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
              Select Event
            </h1>
            <p className="text-gray-600 text-[15px]">
=======
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 md:py-14 relative overflow-hidden">
        <div className="max-w-[800px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40">
                Check-in Station
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text">
              Select Event
            </h1>
            <p className="text-white/40 mt-2">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
              Choose the event you&apos;re checking attendees in for today.
            </p>
          </FadeUp>
        </div>
      </section>

<<<<<<< HEAD
      <div className="max-w-[800px] mx-auto px-5 md:px-10 pb-24">
=======
      <div className="max-w-[800px] mx-auto px-5 md:px-10 py-10">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : sorted.length === 0 ? (
<<<<<<< HEAD
          <div className="py-20 text-center bg-[#f8f9fa] rounded-[24px] border border-black/[0.04]">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-lg text-black mb-1">
              No published events
            </p>
            <p className="text-sm text-gray-500 mb-0">
=======
          <div className="py-20 text-center border border-dashed border-[var(--c-border)] rounded-2xl">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[var(--c-secondary-text)]">
              No published events
            </p>
            <p className="text-sm text-[var(--c-muted-text)] mt-1">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
              Events will appear here when published by an admin.
            </p>
          </div>
        ) : (
          <StaggerContainer className="space-y-3">
            {sorted.map((event) => {
              const isToday =
                new Date(event.start_datetime).toDateString() === now.toDateString();
              const isPast = new Date(event.end_datetime) < now;

              return (
                <StaggerItem key={event.id}>
<<<<<<< HEAD
                  <Link href={`/checkin/${event.slug}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className={`flex items-center justify-between p-6 rounded-[24px] border cursor-pointer transition-all duration-200 group ${
                        isToday
                          ? "bg-black text-white border-black shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                          : isPast
                          ? "bg-gray-50 border-black/[0.04] opacity-60"
                          : "bg-white border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-black/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
=======
                  <Link href={`/checkin/${event.id}`}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                        isToday
                          ? "bg-black text-white border-black shadow-lg"
                          : isPast
                          ? "bg-gray-50 border-[var(--c-border)] opacity-60"
                          : "bg-white border-[var(--c-border)] hover:border-black/20 hover:shadow-md"
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
<<<<<<< HEAD
                          className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${
                            isToday ? "bg-white/10" : "bg-[#f8f9fa] border border-black/[0.04]"
                          }`}
                        >
                          <CalendarDays
                            className={`w-5 h-5 ${isToday ? "text-white" : "text-gray-500"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p
                              className={`font-semibold truncate text-[16px] ${
                                isToday ? "text-white" : "text-black"
=======
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isToday ? "bg-white/10" : "bg-[var(--c-surface)] border border-[var(--c-border)]"
                          }`}
                        >
                          <CalendarDays
                            className={`w-5 h-5 ${isToday ? "text-white" : "text-[var(--c-secondary-text)]"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-semibold truncate ${
                                isToday ? "text-white" : ""
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                              }`}
                            >
                              {event.title}
                            </p>
                            {isToday && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-black px-2 py-0.5 rounded-full shrink-0">
                                Today
                              </span>
                            )}
                            {isPast && (
<<<<<<< HEAD
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 border border-gray-200">
=======
                              <span className="text-[10px] font-medium text-[var(--c-muted-text)] bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                                Past
                              </span>
                            )}
                          </div>
                          <div
<<<<<<< HEAD
                            className={`flex flex-wrap items-center gap-3 text-[13px] ${
                              isToday ? "text-white/60" : "text-gray-500"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.venue}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
=======
                            className={`flex flex-wrap items-center gap-3 text-xs mt-1 ${
                              isToday ? "text-white/60" : "text-[var(--c-muted-text)]"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.venue}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                              {event.registered_count}/{event.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-5 h-5 shrink-0 ml-4 transition-colors ${
                          isToday
<<<<<<< HEAD
                            ? "text-white/40 group-hover:text-white"
=======
                            ? "text-white/60 group-hover:text-white"
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                            : "text-gray-300 group-hover:text-black"
                        }`}
                      />
                    </motion.div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
