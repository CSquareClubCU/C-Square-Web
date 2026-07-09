"use client";

/**
 * /admin/events
 *
 * Admin event list — paginated, filterable by status.
 * Allows creating, editing, and deleting events.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  CalendarDays,
  Users,
  Clock,
  Filter,
  ArrowRight,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/animations/MotionElements";
import { fetchEvents, deleteEvent } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Event, EventStatus } from "@/types";

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const statusColors: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AdminEventsPage() {
  useRequireAuth({ role: "admin" });
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (statusFilter) params.status = statusFilter;
      const data = await fetchEvents(params);
      setEvents(data.results);
      setTotal(data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await load();
    };
    init();
    return () => { mounted = false; };
  }, [load]);

  async function handleDelete(slug: string) {
    if (deleteConfirm !== slug) {
      setDeleteConfirm(slug);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    setDeletingId(slug);
    try {
      await deleteEvent(slug);
      setEvents((prev) => prev.filter((e) => e.slug !== slug));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40">
                  Admin › Events
                </span>
                <h1 className="text-3xl font-bold tracking-tight mt-1 gradient-text">
                  Event Management
                </h1>
              </div>
              <Link href="/admin/events/new">
                <Button className="bg-white text-black hover:bg-gray-100 border-0 shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-[var(--c-muted-text)]" />
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as EventStatus | "")}
                className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-all duration-200 ${
                  statusFilter === opt.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-[var(--c-secondary-text)] border-[var(--c-border)] hover:border-[var(--c-accent)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[var(--c-border)] rounded-2xl">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[var(--c-secondary-text)]">No events found</p>
            <p className="text-sm text-[var(--c-muted-text)] mt-1">
              {statusFilter ? `No ${statusFilter} events.` : "Create your first event."}
            </p>
            <Link href="/admin/events/new" className="mt-5 inline-block">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-white border border-[var(--c-border)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${
                          statusColors[event.status] || statusColors.draft
                        }`}
                      >
                        {event.status}
                      </span>
                      <span className="text-xs text-[var(--c-muted-text)] capitalize">
                        {event.event_type}
                      </span>
                    </div>
                    <p className="font-semibold truncate">{event.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--c-muted-text)] mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(event.start_datetime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.registered_count}/{event.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/events/${event.slug}/attendance`}>
                      <Button variant="ghost" size="sm" className="text-[var(--c-muted-text)]">
                        <Search className="w-4 h-4 mr-1.5" />
                        Attendance
                      </Button>
                    </Link>
                    <Link href={`/admin/events/${event.slug}`}>
                      <Button variant="secondary" size="sm">
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        Manage
                      </Button>
                    </Link>
                    {event.status === "draft" && (
                      <button
                        onClick={() => handleDelete(event.slug)}
                        disabled={deletingId === event.slug}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          deleteConfirm === event.slug
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                        title={deleteConfirm === event.slug ? "Click again to confirm" : "Delete draft"}
                      >
                        {deletingId === event.slug ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : deleteConfirm === event.slug ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <Link href={`/admin/events/${event.slug}`}>
                      <button className="p-2 text-gray-400 hover:text-black transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && total > 20 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
