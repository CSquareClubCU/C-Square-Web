"use client";

/**
 * /admin/events/[slug]/attendance
 *
 * Admin attendance overview for a specific event.
 * Shows live stats, full attendance list with check-in times.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  Search,
  QrCode,
  Download,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/animations/MotionElements";
import {
  fetchEventById,
  fetchCheckinStats,
  fetchAttendanceList,
  exportAttendanceCsv,
} from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, CheckinStats, AttendanceRecord } from "@/types";

import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AdminAttendancePage() {
  useRequireAuth({ role: "admin" });
  const params = useParams();
  const eventSlug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { 
    const t = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [debouncedSearch]);

  // Load event by slug, then use event.id (UUID) for sub-resource API calls
  useEffect(() => {
    fetchEventById(eventSlug)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventSlug]);

  // Load stats + auto-refresh (uses event UUID)
  const refreshStats = useCallback(async () => {
    if (!event) return;
    try {
      const s = await fetchCheckinStats(event.id);
      setStats(s);
      setLastRefresh(new Date());
    } catch (err) { console.error(err); }
  }, [event]);

  useEffect(() => {
    let mounted = true;
    if (!event) return;
    const init = async () => {
      if (mounted) await refreshStats();
    };
    init();
    const interval = setInterval(refreshStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshStats, event]);

  // Load records (uses event UUID)
  const loadRecords = useCallback(async () => {
    if (!event) return;
    setListLoading(true);
    try {
      const data = await fetchAttendanceList(event.id, {
        search: debouncedSearch || undefined,
        page,
      });
      setRecords(data.results);
      setTotal(data.count);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  }, [event, debouncedSearch, page]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await loadRecords();
    };
    init();
    return () => { mounted = false; };
  }, [loadRecords]);

  async function handleExport() {
    if (!event) return;
    setExportLoading(true);
    try {
      const blob = await exportAttendanceCsv(event.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${event.slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    finally { setExportLoading(false); }
  }

  const totalPages = Math.ceil(total / 20);
  const checkedInPercent = stats
    ? Math.round((stats.checked_in / Math.max(stats.total_approved, 1)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <Link
              href={`/admin/events/${eventSlug}`}
              className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/30">
                  Attendance
                </span>
                <h1 className="text-3xl font-bold tracking-tight mt-1 gradient-text">
                  {event?.title || "Event Attendance"}
                </h1>
                {event && (
                  <p className="text-white/40 text-sm mt-1">
                    {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {event && (
                  <Link href={`/checkin/${event.id}`}>
                    <Button variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                      <QrCode className="w-4 h-4 mr-2" />
                      Open Scanner
                    </Button>
                  </Link>
                )}
                <Button
                  variant="secondary"
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                  onClick={handleExport}
                  disabled={exportLoading || !event}
                >
                  {exportLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { label: "Checked In", value: stats.checked_in, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                  { label: "Approved", value: stats.total_approved, icon: <Users className="w-4 h-4 text-white/60" /> },
                  { label: "Remaining", value: stats.remaining, icon: <Clock className="w-4 h-4 text-amber-400" /> },
                  { label: "Check-In Rate", value: `${checkedInPercent}%`, icon: <RefreshCw className="w-4 h-4 text-white/60" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-white/40">{s.label}</span></div>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            {stats && (
              <div className="mt-4">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    className="bg-emerald-400 h-2 rounded-full"
                    animate={{ width: `${checkedInPercent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-2 text-right">
                  Auto-refreshed {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
            )}
          </FadeUp>
        </div>
      </section>

      {/* Records */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 space-y-5">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted-text)]" />
          <input
            type="text"
            placeholder="Search name, email, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[var(--c-border)] bg-white focus:outline-none focus:border-black transition-all text-sm"
          />
        </div>

        <p className="text-sm text-[var(--c-muted-text)]">
          {total} attendance record{total !== 1 ? "s" : ""}
        </p>

        {/* Table */}
        <div className="bg-white border border-[var(--c-border)] rounded-2xl overflow-hidden">
          {listLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[var(--c-secondary-text)] font-medium">
                {debouncedSearch ? "No match" : "No records yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_150px] gap-4 px-5 py-3 border-b border-[var(--c-border)] bg-gray-50 text-xs font-semibold text-[var(--c-muted-text)] uppercase tracking-wider">
                <span>Student</span>
                <span>Email / UID</span>
                <span>Method</span>
                <span>Checked In At</span>
              </div>
              <div className="divide-y divide-[var(--c-border)]">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className={`px-5 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_120px_150px] sm:items-center gap-2 hover:bg-gray-50 transition-colors ${
                      rec.is_checked_in ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          rec.is_checked_in ? "bg-emerald-400" : "bg-gray-300"
                        }`}
                      />
                      <span className="font-medium text-sm">{rec.user_full_name}</span>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--c-muted-text)] truncate">{rec.user_email}</p>
                      {rec.user_student_uid && (
                        <p className="text-xs text-[var(--c-muted-text)]">{rec.user_student_uid}</p>
                      )}
                    </div>
                    <div>
                      {rec.check_in_method ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border border-[var(--c-border)] capitalize">
                          {rec.check_in_method}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--c-muted-text)]">—</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--c-muted-text)]">
                      {rec.checked_in_at
                        ? new Date(rec.checked_in_at).toLocaleTimeString()
                        : "Not checked in"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--c-muted-text)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
