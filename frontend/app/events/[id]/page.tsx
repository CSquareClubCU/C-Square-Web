"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchEventById } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Users,
  CalendarDays,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp, SlideIn, ScaleIn } from "@/components/animations/MotionElements";
import { Event } from "@/types";

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchEventById(params.id as string)
        .then((data) => {
          setEvent(data);
        })
        .catch((error) => {
          console.error("Failed to fetch event:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-5 md:px-10 py-16 md:py-24 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-24 mb-8" />
        <div className="h-10 bg-gray-100 rounded w-2/3 mb-4" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-[32px]" />
          <div className="h-64 bg-gray-100 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-5 md:px-10 py-32 text-center">
        <h1 className="text-3xl font-bold mb-4">Event not found</h1>
        <Link href="/events">
          <Button variant="secondary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const capacity = event.capacity || 1; // avoid division by zero
  const filledPercent = Math.max(0, Math.min((event.registered_count / capacity) * 100, 100));
  const spotsLeft = Math.max(0, event.capacity - event.registered_count);
  const isFull = spotsLeft === 0;
  const isPastDeadline = new Date(event.registration_deadline) < new Date();
  const canRegister = !isFull && !isPastDeadline && event.status === "published";

  return (
    <div className="w-full">
      {/* Header background */}
      <section className="w-full bg-[var(--c-surface)] dot-grid border-b border-[var(--c-border)] py-12 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp>
            <Link
              href="/events"
              className="text-sm text-[var(--c-muted-text)] hover:text-[var(--c-accent)] transition-colors flex items-center mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Events
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-white bg-[var(--c-accent)] px-3 py-1 rounded-full">
                {event.event_type}
              </span>
              {event.is_team_event && (
                <span className="text-xs font-medium text-[var(--c-secondary-text)] bg-white px-3 py-1 rounded-full border border-[var(--c-border)]">
                  Team Event
                </span>
              )}
              {event.is_open_to_external && (
                <span className="text-xs font-medium text-[var(--c-secondary-text)] bg-white px-3 py-1 rounded-full border border-[var(--c-border)]">
                  Open to All
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              {event.title}
            </h1>
            <p className="text-xl text-[var(--c-secondary-text)]">
              {formatDate(event.start_datetime)} &middot; {event.venue}
            </p>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <SlideIn direction="left">
              <div className="p-8 md:p-12 rounded-[32px] border border-[var(--c-border)] bg-white">
                <h2 className="text-2xl font-bold mb-6">About the Event</h2>
                <div
                  className="text-[var(--c-secondary-text)] leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            </SlideIn>

            {/* Quick Facts */}
            <FadeUp delay={0.2}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: <CalendarDays className="w-5 h-5" />,
                    label: "Date",
                    value: formatDate(event.start_datetime),
                  },
                  {
                    icon: <Clock className="w-5 h-5" />,
                    label: "Time",
                    value: `${formatTime(event.start_datetime)} - ${formatTime(event.end_datetime)}`,
                  },
                  {
                    icon: <MapPin className="w-5 h-5" />,
                    label: "Venue",
                    value: event.venue,
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    label: "Capacity",
                    value: `${event.capacity} seats`,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-[var(--c-border)] bg-white text-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--c-surface)] flex items-center justify-center mx-auto mb-3">
                      {item.icon}
                    </div>
                    <p className="text-xs text-[var(--c-muted-text)] uppercase tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SlideIn direction="right">
              {/* Registration Card */}
              <div className="p-8 rounded-[32px] border border-[var(--c-border)] bg-white sticky top-28">
                <h3 className="font-semibold text-lg mb-1">Register Now</h3>
                <p className="text-sm text-[var(--c-muted-text)] mb-6">
                  Closes {formatDate(event.registration_deadline)}
                </p>

                {/* Capacity bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-[var(--c-muted-text)] mb-2">
                    <span>{event.registered_count} registered</span>
                    <span>{spotsLeft} spots left</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[var(--c-accent)] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${filledPercent}%` }}
                    />
                  </div>
                </div>

                <Link href={canRegister ? "/login" : "#"}>
                  <Button className="w-full group mb-3" size="lg" disabled={!canRegister}>
                    {isFull ? "Event Full" : isPastDeadline ? "Registration Closed" : "Register"}
                    {canRegister && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </Link>

                <Button variant="ghost" className="w-full text-[var(--c-muted-text)]" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>

                <div className="mt-6 pt-6 border-t border-[var(--c-border)] space-y-3">
                  <div className="flex items-center text-sm text-[var(--c-secondary-text)]">
                    <ExternalLink className="w-4 h-4 mr-3 shrink-0" />
                    <span>
                      {event.is_open_to_external
                        ? "Open to external participants"
                        : "CU Students Only"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-[var(--c-secondary-text)]">
                    <Users className="w-4 h-4 mr-3 shrink-0" />
                    <span>
                      {event.is_team_event ? "Team registration" : "Individual registration"}
                    </span>
                  </div>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  );
}
