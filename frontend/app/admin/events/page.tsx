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
  ArrowLeft,
  QrCode,
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
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-12 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-3 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
              All Events
            </h1>
            <p className="text-gray-600 text-[15px]">
              Manage, publish, and track all your events.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/events/new">
              <Button className="px-6 bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Unified Filter Bar */}
        <div className="mb-8 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-x-auto no-scrollbar">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as EventStatus | "")}
                className={`px-5 py-2 rounded-[12px] text-[13px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === opt.value
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-[24px] bg-[#f8f9fa] animate-pulse border border-black/[0.04]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-[#f8f9fa] rounded-[24px] border border-black/[0.04]">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4 font-medium">
              {statusFilter ? `No ${statusFilter} events found.` : "No events yet"}
            </p>
            <Link href="/admin/events/new">
              <Button className="bg-black text-white hover:bg-gray-800 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="w-full bg-white border border-black/[0.04] rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-12 h-12 rounded-[12px] bg-[#f8f9fa] border border-black/[0.04] flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                            statusColors[event.status] || "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {event.status}
                        </span>
                        <span className="text-[12px] text-gray-400 font-medium capitalize">
                          {event.event_type}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight group-hover:text-black/70 transition-colors mb-1.5 truncate">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(event.start_datetime)}
                        </span>
                        <span className="flex items-center gap-1.5 border-l border-gray-300 pl-3">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {event.registered_count}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/checkin/${event.slug}`}>
                      <Button variant="outline" size="sm" className="text-gray-600">
                        <QrCode className="w-4 h-4 mr-1.5" />
                        Attendance
                      </Button>
                    </Link>
                    <Link href={`/admin/events/${event.slug}`}>
                      <Button variant="outline" size="sm" className="text-gray-600 bg-[#f8f9fa] border-transparent hover:bg-gray-100 hover:border-gray-200">
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        Manage
                      </Button>
                    </Link>
                    {event.status === "draft" && (
                      <button
                        onClick={() => handleDelete(event.slug)}
                        disabled={deletingId === event.slug}
                        className={`p-2 rounded-[8px] transition-all duration-200 ${
                          deleteConfirm === event.slug
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent"
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
