"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEvents } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { MapPin, Clock, Users, ArrowRight, Search } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem, TiltCard } from "@/components/animations/MotionElements";
import { Event } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const filtered = events.filter((event) => {
    const matchesType = filter === "all" || event.event_type === filter;
    const matchesSearch =
      search === "" ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="w-full bg-black text-white dot-grid py-16 md:py-24 border-b border-[var(--c-border)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60 mb-4 inline-block">
              Discover
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Upcoming Events
            </h1>
            <p className="text-lg text-white/70 max-w-[600px]">
              Browse hackathons, workshops, and seminars. Register with one click and get your QR code instantly.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="w-full border-b border-[var(--c-border)] bg-white sticky top-20 z-30">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            {["all", "hackathon", "workshop", "seminar", "competition"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  filter === type
                    ? "bg-[var(--c-accent)] text-white"
                    : "bg-[var(--c-surface)] text-[var(--c-secondary-text)] hover:bg-gray-200"
                }`}
              >
                {type === "all" ? "All Events" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted-text)]" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-full border border-[var(--c-border)] bg-white text-sm placeholder:text-[var(--c-muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/10 focus:border-[var(--c-accent)] transition-all"
            />
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-10 py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[24px] border border-[var(--c-border)] p-8 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-6" />
                <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-full mb-3" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-8" />
                <div className="h-10 bg-gray-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp className="text-center py-20">
            <p className="text-xl font-semibold text-[var(--c-secondary-text)]">No events found</p>
            <p className="text-sm text-[var(--c-muted-text)] mt-2">Try adjusting your filters</p>
          </FadeUp>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-container">
            {filtered.map((event) => (
              <StaggerItem key={event.id}>
                <TiltCard className="h-full">
                  <div className="h-full flex flex-col rounded-[24px] border border-[var(--c-border)] bg-white overflow-hidden hover:shadow-xl transition-shadow duration-500">
                    {/* Banner Area */}
                    <div className="h-40 bg-[var(--c-surface)] mesh-gradient flex items-center justify-center relative">
                      <span className="text-4xl font-bold text-[var(--c-accent)]/10 tracking-tighter">
                        {event.event_type.toUpperCase()}
                      </span>
                      <div className="absolute top-4 left-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white bg-[var(--c-accent)] px-3 py-1 rounded-full">
                          {event.event_type}
                        </span>
                      </div>
                      {event.status === "published" && (
                        <div className="absolute top-4 right-4">
                          <span className="text-xs font-medium text-[var(--c-success)] bg-green-50 px-3 py-1 rounded-full flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-success)] mr-1.5" />
                            Open
                          </span>
                        </div>
                      )}
                    </div>

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

                      <Link href={`/events/${event.id}`} className="w-full">
                        <Button variant="outline" className="w-full group">
                          View Details
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
