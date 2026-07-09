"use client";

/**
 * /admin/events/[slug]
 *
 * Admin event detail: view/edit event info + manage registrations.
 * Actions: approve, reject, move from waitlist.
 * Uses slug in URL; uses event.id (UUID) for all sub-resource API calls.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  QrCode,
  ArrowUpCircle,
  Download,
  Edit3,
  X,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/animations/MotionElements";
import { fetchEventById, fetchEventRegistrations, approveRegistration, rejectRegistration, moveFromWaitlist, exportAttendanceCsv, updateEvent, uploadEventBanner } from "@/lib/api";
import type { EventCreateData } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, RegistrationAdmin, RegistrationStatus } from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const STATUS_TABS: Array<{ value: RegistrationStatus | ""; label: string; icon: React.ReactNode }> = [
  { value: "", label: "All", icon: <Users className="w-3.5 h-3.5" /> },
  { value: "pending", label: "Pending", icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "approved", label: "Approved", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { value: "waitlisted", label: "Waitlisted", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  { value: "rejected", label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" /> },
];

const rowStatusStyle: Record<string, string> = {
  approved: "border-l-4 border-l-emerald-400",
  pending: "border-l-4 border-l-amber-400",
  rejected: "border-l-4 border-l-red-400",
  waitlisted: "border-l-4 border-l-gray-300",
  cancelled: "border-l-4 border-l-gray-200 opacity-60",
};

export default function AdminEventDetailPage() {
  useRequireAuth({ role: "admin" });
  const params = useParams();
  const eventSlug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EventCreateData>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);

  const handlePrizeChange = (index: number, field: string, value: string) => {
    setEditForm((prev) => {
      const newPrizes = [...(prev.prizes || [])];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      return { ...prev, prizes: newPrizes };
    });
  };

  const addPrize = () => {
    setEditForm((prev) => ({
      ...prev,
      prizes: [...(prev.prizes || []), { position: "", award: "", description: "" }],
    }));
  };

  const removePrize = (index: number) => {
    setEditForm((prev) => {
      const newPrizes = [...(prev.prizes || [])];
      newPrizes.splice(index, 1);
      return { ...prev, prizes: newPrizes };
    });
  };

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!event || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setBannerLoading(true);
    try {
      const updated = await uploadEventBanner(event.id, file);
      // uploadEventBanner may only return { banner_image_url } if backend returns partial data
      setEvent(prev => prev ? { ...prev, ...updated } : updated);
    } catch (err) {
      console.error("Banner upload failed:", err);
      alert("Failed to upload banner image. Max size 5MB, JPG/PNG/WEBP only.");
    } finally {
      setBannerLoading(false);
      e.target.value = ""; // Reset input
    }
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load event by slug
  useEffect(() => {
    fetchEventById(eventSlug)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoadingEvent(false));
  }, [eventSlug]);

  // Load registrations (uses event UUID from event.id)
  const loadRegistrations = useCallback(async () => {
    if (!event) return;
    setLoadingRegs(true);
    try {
      const data = await fetchEventRegistrations(event.id, {
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
      });
      setRegistrations(data.results);
      setTotal(data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRegs(false);
    }
  }, [event, statusFilter, debouncedSearch, page]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await loadRegistrations();
    };
    init();
    return () => { mounted = false; };
  }, [loadRegistrations]);
  // Reset page when filters change
  useEffect(() => { 
    const t = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [statusFilter, debouncedSearch]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await approveRegistration(id);
      await loadRegistrations();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    try {
      await rejectRegistration(rejectModal.id, rejectReason);
      setRejectModal(null);
      setRejectReason("");
      await loadRegistrations();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  }

  async function handleMoveFromWaitlist(id: string) {
    setActionLoading(id);
    try {
      await moveFromWaitlist(id);
      await loadRegistrations();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  }

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

  function openEdit() {
    if (!event) return;
    // Pre-fill form with current event values
    const toLocalDT = (iso: string) => {
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setEditForm({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      venue: event.venue,
      capacity: event.capacity,
      status: event.status,
      start_datetime: toLocalDT(event.start_datetime),
      end_datetime: toLocalDT(event.end_datetime),
      registration_deadline: toLocalDT(event.registration_deadline),
      is_open_to_external: event.is_open_to_external,
      is_team_event: event.is_team_event,
      min_team_size: event.min_team_size ?? null,
      max_team_size: event.max_team_size ?? null,
      prizes: event.prizes || [],
      rules: event.rules || "",
      contact_name: event.contact_name || "",
      contact_email: event.contact_email || "",
      is_registration_open: event.is_registration_open,
    });
    setEditError(null);
    setEditOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setEditLoading(true);
    setEditError(null);
    try {
      // PATCH by slug
      const updated = await updateEvent(event.slug, editForm);
      setEvent(updated);
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setEditLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  if (loadingEvent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/admin/events"><Button variant="secondary">Back to events</Button></Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        {event.banner_image_url && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.banner_image_url} alt="Banner" className="w-full h-full object-cover blur-sm" />
          </div>
        )}
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <Link
              href="/admin/events"
              className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Events
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/30">
                  {event.event_type} · {event.status}
                </span>
                <h1 className="text-3xl font-bold tracking-tight mt-1 gradient-text">
                  {event.title}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)} · {event.venue}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap items-center">
                <label className="cursor-pointer group relative">
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleBannerUpload} disabled={bannerLoading} />
                  <Button variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10 pointer-events-none" disabled={bannerLoading}>
                    {bannerLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                    {event.banner_image_url ? "Change Banner" : "Upload Banner"}
                  </Button>
                </label>
                <Button
                  variant="secondary"
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                  onClick={openEdit}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
                <Link href={`/admin/events/${eventSlug}/attendance`}>
                  <Button variant="secondary" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                    <QrCode className="w-4 h-4 mr-2" />
                    Live Attendance
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                  onClick={handleExport}
                  disabled={exportLoading}
                >
                  {exportLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-6 max-w-sm">
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>{event.registered_count} registered</span>
                <span>{event.capacity} capacity</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      (event.registered_count / Math.max(event.capacity, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Registrations */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 space-y-5">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  statusFilter === tab.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-[var(--c-secondary-text)] border-[var(--c-border)] hover:border-black"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted-text)]" />
            <input
              type="text"
              placeholder="Search name, email, UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-[var(--c-border)] bg-white focus:outline-none focus:border-black transition-all"
            />
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-[var(--c-muted-text)]">
          {total} registration{total !== 1 ? "s" : ""}
          {statusFilter ? ` · ${statusFilter}` : ""}
        </p>

        {/* Table */}
        <div className="bg-white border border-[var(--c-border)] rounded-2xl overflow-hidden">
          {loadingRegs ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[var(--c-secondary-text)] font-medium">No registrations</p>
              <p className="text-sm text-[var(--c-muted-text)] mt-1">
                {search || statusFilter ? "Try adjusting your filters." : "No one has registered yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--c-border)]">
              <AnimatePresence>
                {registrations.map((reg) => (
                  <motion.div
                    key={reg.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${rowStatusStyle[reg.status] || ""}`}
                  >
                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {reg.user_full_name || "—"}
                        </p>
                        {reg.waitlist_position && (
                          <span className="text-xs text-[var(--c-muted-text)] bg-gray-100 px-2 py-0.5 rounded-full">
                            #{reg.waitlist_position}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--c-muted-text)] truncate">{reg.user_email}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-[var(--c-muted-text)]">
                        {reg.user_student_uid && <span>{reg.user_student_uid}</span>}
                        {reg.user_branch && <span>· {reg.user_branch}</span>}
                        {reg.user_year && <span>· Yr {reg.user_year}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {actionLoading === reg.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {reg.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(reg.id)}
                                className="text-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRejectModal({
                                    id: reg.id,
                                    name: reg.user_full_name,
                                  })
                                }
                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {reg.status === "waitlisted" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleMoveFromWaitlist(reg.id)}
                              className="text-xs"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
                              Move up
                            </Button>
                          )}
                          {reg.status === "approved" && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          )}
                          {reg.status === "rejected" && (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
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

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-bold text-lg mb-1">Reject Registration</h3>
              <p className="text-sm text-[var(--c-secondary-text)] mb-4">
                You are rejecting <strong>{rejectModal.name}</strong>. Provide a reason — this will be emailed to them.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Capacity reached, please try next time."
                className="w-full px-4 py-3 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black resize-none mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-[var(--c-muted-text)]"
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                  onClick={handleReject}
                >
                  {actionLoading === rejectModal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Reject"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Panel */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end p-4 overflow-auto"
            onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-2xl w-full max-w-xl h-full overflow-auto shadow-2xl"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--c-border)] sticky top-0 bg-white z-10">
                <h3 className="font-bold text-lg">Edit Event</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                {[
                  { id: "edit-title", label: "Title", name: "title", type: "text", required: true },
                  { id: "edit-venue", label: "Venue", name: "venue", type: "text", required: true },
                  { id: "edit-capacity", label: "Capacity", name: "capacity", type: "number", required: true },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block text-sm font-medium mb-1.5">
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      required={field.required}
                      value={(editForm as Record<string, unknown>)[field.name] as string ?? ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                ))}

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium mb-1.5">Status</label>
                  <select
                    id="edit-status"
                    value={editForm.status ?? ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as Event["status"] }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                  >
                    {["draft", "published", "cancelled", "completed"].map((s) => (
                      <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "edit-start", label: "Start", name: "start_datetime" },
                    { id: "edit-end", label: "End", name: "end_datetime" },
                    { id: "edit-deadline", label: "Registration Deadline", name: "registration_deadline" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="block text-sm font-medium mb-1.5">{field.label}</label>
                      <input
                        id={field.id}
                        type="datetime-local"
                        value={(editForm as Record<string, unknown>)[field.name] as string ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, [field.name]: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-contact_name" className="block text-sm font-medium mb-1.5">Contact Name</label>
                    <input
                      id="edit-contact_name"
                      type="text"
                      value={editForm.contact_name || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, contact_name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-contact_email" className="block text-sm font-medium mb-1.5">Contact Email</label>
                    <input
                      id="edit-contact_email"
                      type="email"
                      value={editForm.contact_email || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, contact_email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-rules" className="block text-sm font-medium mb-1.5">Rules</label>
                  <textarea
                    id="edit-rules"
                    rows={4}
                    value={editForm.rules || ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, rules: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all resize-none"
                  />
                </div>

                <div className="border border-[var(--c-border)] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Prizes</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addPrize} className="h-8">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Prize
                    </Button>
                  </div>
                  {(!editForm.prizes || editForm.prizes.length === 0) ? (
                    <p className="text-xs text-[var(--c-muted-text)]">No prizes set.</p>
                  ) : (
                    <div className="space-y-3">
                      {editForm.prizes.map((prize, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Position"
                                value={prize.position}
                                onChange={(e) => handlePrizeChange(idx, "position", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-md border border-[var(--c-border)] text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Award"
                                value={prize.award}
                                onChange={(e) => handlePrizeChange(idx, "award", e.target.value)}
                                className="w-full px-3 py-1.5 rounded-md border border-[var(--c-border)] text-sm"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Description"
                              value={prize.description}
                              onChange={(e) => handlePrizeChange(idx, "description", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-md border border-[var(--c-border)] text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePrize(idx)}
                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-registration_open"
                    checked={editForm.is_registration_open ?? true}
                    onChange={(e) => setEditForm((p) => ({ ...p, is_registration_open: e.target.checked }))}
                    className="w-4 h-4 rounded border-[var(--c-border)] accent-black"
                  />
                  <label htmlFor="edit-registration_open" className="text-sm font-medium">Registrations Open</label>
                </div>

                {editError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                    {editError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1 text-[var(--c-muted-text)]" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading} className="flex-1">
                    {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {editLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
