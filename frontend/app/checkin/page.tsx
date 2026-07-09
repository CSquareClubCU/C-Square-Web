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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Volunteers need to see all published events (most likely today's)
    fetchEvents({ status: "published" })
      .then((data) => setEvents(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sort by proximity to now
  const now = new Date();
  const sorted = [...events].sort((a, b) => {
    const diffA = Math.abs(new Date(a.start_datetime).getTime() - now.getTime());
    const diffB = Math.abs(new Date(b.start_datetime).getTime() - now.getTime());
    return diffA - diffB;
  });

  return (
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
              Choose the event you&apos;re checking attendees in for today.
            </p>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-5 md:px-10 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[var(--c-border)] rounded-2xl">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[var(--c-secondary-text)]">
              No published events
            </p>
            <p className="text-sm text-[var(--c-muted-text)] mt-1">
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
                  <Link href={`/checkin/${event.id}`}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                        isToday
                          ? "bg-black text-white border-black shadow-lg"
                          : isPast
                          ? "bg-gray-50 border-[var(--c-border)] opacity-60"
                          : "bg-white border-[var(--c-border)] hover:border-black/20 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
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
                              <span className="text-[10px] font-medium text-[var(--c-muted-text)] bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                                Past
                              </span>
                            )}
                          </div>
                          <div
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
                              {event.registered_count}/{event.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-5 h-5 shrink-0 ml-4 transition-colors ${
                          isToday
                            ? "text-white/60 group-hover:text-white"
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
