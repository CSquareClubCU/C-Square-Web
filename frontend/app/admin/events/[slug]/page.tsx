"use client";

/**
 * /admin/events/[slug]
 *
 * Admin event detail: view/edit event info + manage registrations.
 * Actions: approve, reject, move from waitlist.
 * Uses slug in URL; uses event.id (UUID) for all sub-resource API calls.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeUp } from "@/components/animations/MotionElements";
import { ConfirmAlert } from "@/components/ui/ConfirmAlert";
import { fetchEventById, fetchEventRegistrations, approveRegistration, rejectRegistration, moveFromWaitlist, exportAttendanceCsv, updateEvent, uploadEventBanner, awardBonusPoints, deleteRegistration, fetchEventVolunteers, assignVolunteer, removeVolunteer, fetchTeam, deleteEvent } from "@/lib/api";
import type { EventCreateData, VolunteerAssignment } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, RegistrationAdmin, RegistrationStatus, CoreTeamMemberPublic } from "@/types";
import { useRequireAuth } from "@/hooks/useRequireAuth";
const STATUS_TABS: Array<{ value: RegistrationStatus | ""; label: string; icon: React.ReactNode }> = [
  { value: "", label: "All", icon: <Users className="w-3.5 h-3.5" /> },
  { value: "pending", label: "Pending", icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "approved", label: "Approved", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { value: "waitlisted", label: "Waitlisted", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  { value: "rejected", label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" /> },
];



export default function AdminEventDetailPage() {
  useRequireAuth({ role: "admin" });
  const params = useParams();
  const router = useRouter();
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
  const [removeModal, setRemoveModal] = useState<{ id: string; name: string } | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Bonus Points
  const [bonusModal, setBonusModal] = useState<{ id: string; name: string; userId: string; points: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EventCreateData>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Volunteers
  const [volunteers, setVolunteers] = useState<VolunteerAssignment["volunteers"]>([]);
  const [coreTeam, setCoreTeam] = useState<CoreTeamMemberPublic[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [volunteersModalOpen, setVolunteersModalOpen] = useState(false);

  // Delete Event Alert
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleFaqChange = (index: number, field: string, value: string) => {
    setEditForm((prev) => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
    });
  };

  const addFaq = () => {
    setEditForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index: number) => {
    setEditForm((prev) => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs.splice(index, 1);
      return { ...prev, faqs: newFaqs };
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

  const loadVolunteers = useCallback(async () => {
    if (!event) return;
    try {
      const data = await fetchEventVolunteers(event.id);
      setVolunteers(data.volunteers || []);
    } catch (err) {
      console.error("Failed to fetch volunteers:", err);
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      loadVolunteers();
    }
  }, [event, loadVolunteers]);

  useEffect(() => {
    fetchTeam()
      .then(setCoreTeam)
      .catch(console.error);
  }, []);

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
    } catch (err: any) { alert(err.message || "Failed to approve registration."); console.error(err); }
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
    } catch (err: any) { alert(err.message || "Failed to reject registration."); console.error(err); }
    finally { setActionLoading(null); }
  }

  async function handleMoveFromWaitlist(id: string) {
    setActionLoading(id);
    try {
      await moveFromWaitlist(id);
      await loadRegistrations();
    } catch (err: any) { alert(err.message || "Failed to move from waitlist."); console.error(err); }
    finally { setActionLoading(null); }
  }

  async function handleRemoveRegistration() {
    if (!removeModal) return;
    setActionLoading(removeModal.id);
    try {
      await deleteRegistration(removeModal.id);
      await loadRegistrations();
    } catch (err: any) {
      alert(err.message || "Failed to remove registration.");
    } finally {
      setActionLoading(null);
      setRemoveModal(null);
    }
  }

  async function handleAwardBonus() {
    if (!bonusModal || !bonusModal.points) return;
    setActionLoading(bonusModal.id);
    try {
      await awardBonusPoints(bonusModal.userId, bonusModal.points);
      setBonusModal(null);
      // Wait for 1 second so the action button stops spinning
      setTimeout(() => setActionLoading(null), 1000);
    } catch (err) {
      console.error(err);
      setActionLoading(null);
    }
  }

  async function handleAssignVolunteer() {
    if (!event || !selectedVolunteerId) return;
    setAssigningLoading(true);
    try {
      await assignVolunteer(event.id, selectedVolunteerId);
      setSelectedVolunteerId("");
      await loadVolunteers();
    } catch (err: any) {
      alert(err.message || "Failed to assign volunteer.");
    } finally {
      setAssigningLoading(false);
    }
  }

  async function handleRemoveVolunteer(assignmentId: string) {
    if (!event) return;
    setRemovingId(assignmentId);
    try {
      await removeVolunteer(event.id, assignmentId);
      await loadVolunteers();
    } catch (err: any) {
      alert(err.message || "Failed to remove volunteer.");
    } finally {
      setRemovingId(null);
    }
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
      faqs: event.faqs || [],
      rules: event.rules || "",
      contact_name: event.contact_name || "",
      contact_email: event.contact_email || "",
      is_registration_open: event.is_registration_open,
      is_flagship: event.is_flagship,
      points: event.points,
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

  async function handleDeleteEvent() {
    if (!event) return;
    setDeleteLoading(true);
    try {
      await deleteEvent(event.slug);
      router.push("/admin/events");
    } catch (err: any) {
      alert(err.message || "Failed to delete event.");
      setDeleteLoading(false);
      setDeleteAlertOpen(false);
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
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <section className="w-full pt-12 pb-8 relative overflow-hidden">
        {event.banner_image_url && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.banner_image_url} alt="Banner" className="w-full h-full object-cover blur-sm" />
          </div>
        )}
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <Link
              href="/admin/events"
              className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4 inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> All Events
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest bg-gray-50 text-gray-500 border-gray-200">
                    {event.event_type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                    event.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    event.status === "draft" ? "bg-gray-100 text-gray-600 border-gray-200" :
                    event.status === "cancelled" ? "bg-red-50 text-red-600 border-red-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {event.status}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
                  {event.title}
                </h1>
                <p className="text-gray-600 text-[15px]">
                  {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)} · {event.venue}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#e5e7eb] text-black hover:bg-gray-50"
                  onClick={() => setVolunteersModalOpen(true)}
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  Volunteers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#e5e7eb] text-black hover:bg-gray-50"
                  onClick={openEdit}
                >
                  <Edit3 className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
                <Link href={`/checkin/${eventSlug}`}>
                  <Button variant="outline" size="sm" className="border-[#e5e7eb] text-black hover:bg-gray-50">
                    <QrCode className="w-4 h-4 mr-1.5" />
                    Scanner
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={handleExport}
                  disabled={exportLoading}
                >
                  {exportLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                  Export
                </Button>
              </div>
            </div>

            {/* Capacity bar */}
            {/* Capacity bar */}
            <div className="mt-8 max-w-sm">
              <div className="flex justify-between text-[13px] text-gray-500 font-medium mb-2">
                <span className="text-[#111111]">{event.registered_count} registered</span>
                <span>{event.capacity} capacity</span>
              </div>
              <div className="w-full bg-[#e5e7eb] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#111111] h-1.5 rounded-full transition-all duration-700"
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
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-24 space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === tab.value
                    ? "bg-[#111111] text-white"
                    : "text-[#6b7280] hover:text-black hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[14px] rounded-full border border-[#e5e7eb] bg-[#f8f9fa] focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-[var(--c-muted-text)]">
          {total} registration{total !== 1 ? "s" : ""}
          {statusFilter ? ` · ${statusFilter}` : ""}
        </p>

        {/* Table */}
        <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
          {loadingRegs ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-20 text-center bg-[#f8f9fa]">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No registrations</p>
              <p className="text-sm text-gray-400 mt-1">
                {search || statusFilter ? "Try adjusting your filters." : "No one has registered yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e7eb]">
              <AnimatePresence>
                {registrations.map((reg) => (
                  <motion.div
                    key={reg.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          reg.status === 'approved' ? 'bg-[#10b981]' :
                          reg.status === 'pending' ? 'bg-[#f59e0b]' :
                          reg.status === 'rejected' ? 'bg-[#ef4444]' :
                          'bg-[#d1d5db]'
                        }`} />
                        <p className="font-semibold text-[14px] text-[#111111] truncate">
                          {reg.user_full_name || reg.user_email.split('@')[0]}
                        </p>
                        {reg.waitlist_position && (
                          <span className="text-[11px] font-medium text-[#6b7280] bg-gray-100 px-2 py-0.5 rounded-full border border-[#e5e7eb]">
                            Waitlist #{reg.waitlist_position}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#6b7280] truncate mt-0.5 ml-4">{reg.user_email}</p>
                      {reg.user_student_uid && (
                        <div className="flex flex-wrap gap-2 mt-1 ml-4 text-[12px] text-[#9ca3af] font-medium">
                          <span>{reg.user_student_uid}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 shrink-0 min-w-[140px]">
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
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approved
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBonusModal({ id: reg.id, name: reg.user_full_name, userId: reg.user, points: 50 })}
                                className="text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              >
                                <Trophy className="w-3.5 h-3.5 mr-1" />
                                Bonus
                              </Button>
                            </div>
                          )}
                          {reg.status === "rejected" && (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}
                          <div className="w-px h-6 bg-gray-200 mx-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemoveModal({ id: reg.id, name: reg.user_full_name })}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                            title="Completely Remove Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <ConfirmAlert
        isOpen={!!rejectModal}
        title="Reject Registration"
        message={
          <div>
            <p className="text-[14px] text-gray-500 mb-4">
              You are rejecting <strong>{rejectModal?.name}</strong>. Provide a reason — this will be emailed to them.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Capacity reached, please try next time."
              className="w-full px-4 py-3 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black resize-none"
            />
          </div>
        }
        onConfirm={handleReject}
        onCancel={() => { setRejectModal(null); setRejectReason(""); }}
        confirmText="Reject"
        isDestructive={true}
        loading={rejectModal ? actionLoading === rejectModal.id : false}
        confirmDisabled={!rejectReason.trim()}
      />

      <ConfirmAlert
        isOpen={!!bonusModal}
        title="Award Bonus Points"
        message={
          <div>
            <p className="text-[14px] text-gray-500 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Award points manually to <strong>{bonusModal?.name}</strong>.
            </p>
            <input
              type="number"
              min="0"
              value={bonusModal?.points || 0}
              onChange={(e) => bonusModal && setBonusModal({ ...bonusModal, points: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black"
            />
          </div>
        }
        onConfirm={handleAwardBonus}
        onCancel={() => setBonusModal(null)}
        confirmText="Award"
        loading={bonusModal ? actionLoading === bonusModal.id : false}
        confirmDisabled={!bonusModal?.points}
      />

      {/* Edit Event Panel */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end p-4"
            onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-[24px] w-full max-w-xl max-h-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04] bg-[#f8f9fa] shrink-0">
                <h3 className="font-semibold text-lg text-black">Edit Event</h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:bg-black/5 hover:text-black rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
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
                        className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between border border-[var(--c-border)] p-4 rounded-xl mt-4">
                    <div>
                      <div className="font-semibold text-sm">Event Banner</div>
                      <div className="text-xs text-[var(--c-muted-text)]">Max size 5MB, JPG/PNG/WEBP only</div>
                    </div>
                    <label className="cursor-pointer group relative">
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleBannerUpload} disabled={bannerLoading} />
                      <Button variant="outline" className="border-black/[0.08] text-black hover:bg-gray-50 pointer-events-none" disabled={bannerLoading}>
                        {bannerLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        {event.banner_image_url ? "Change Banner" : "Upload Banner"}
                      </Button>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border border-[var(--c-border)] p-4 rounded-xl mt-4">
                    <div>
                      <div className="font-semibold text-sm">Flagship Event</div>
                      <div className="text-xs text-[var(--c-muted-text)]">Show this event on the homepage</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editForm.is_flagship}
                        onChange={(e) => setEditForm(p => ({ ...p, is_flagship: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="edit-points" className="block text-sm font-medium mb-1.5">Club Points</label>
                    <input
                      id="edit-points"
                      type="number"
                      value={editForm.points ?? 100}
                      onChange={(e) => setEditForm((p) => ({ ...p, points: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium mb-1.5">Status</label>
                  <select
                    id="edit-status"
                    value={editForm.status ?? ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as Event["status"] }))}
                    className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
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
                        className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
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
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-contact_email" className="block text-sm font-medium mb-1.5">Contact Email</label>
                    <input
                      id="edit-contact_email"
                      type="email"
                      value={editForm.contact_email || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, contact_email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors"
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
                    className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] text-[15px] focus:outline-none focus:border-black transition-colors resize-none"
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

                {/* Enhancements: FAQs */}
                <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[16px] p-5 md:p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Frequently Asked Questions</h2>
                    <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                      <Plus className="w-4 h-4 mr-1" /> Add FAQ
                    </Button>
                  </div>

                  {(!editForm.faqs || editForm.faqs.length === 0) ? (
                    <p className="text-sm text-[var(--c-muted-text)]">No FAQs added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {editForm.faqs.map((faq, idx) => (
                        <div key={idx} className="flex gap-3 items-start border border-[var(--c-border)] p-4 rounded-xl relative bg-white">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              placeholder="Question (e.g. Who can attend?)"
                              value={faq.question}
                              onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-md border border-[var(--c-border)] text-sm focus:outline-none focus:border-black"
                            />
                            <textarea
                              placeholder="Answer (e.g. Everyone!)"
                              value={faq.answer}
                              rows={2}
                              onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                              className="w-full px-3 py-1.5 rounded-md border border-[var(--c-border)] text-sm focus:outline-none focus:border-black resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFaq(idx)}
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

                </div>

                <div className="px-6 py-5 border-t border-black/[0.04] bg-[#f8f9fa] flex items-center justify-between gap-3 shrink-0">
                  <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteAlertOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" className="border-black/[0.08]" onClick={() => setEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editLoading} className="bg-black text-white hover:bg-gray-800">
                      {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {editLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volunteers Modal */}
      <AnimatePresence>
        {volunteersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setVolunteersModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04]">
                <h3 className="font-bold text-xl">Manage Volunteers</h3>
                <button
                  onClick={() => setVolunteersModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <p className="text-sm text-gray-500">Core team members assigned to check-in attendees.</p>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="flex-1 px-3 py-2 text-[14px] rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="">Select Core Team Member...</option>
                    {coreTeam
                      .filter((ct) => ct.user && !volunteers.some((v) => v.user.id === ct.user))
                      .map((ct) => (
                        <option key={ct.id} value={ct.user || ""}>
                          {ct.full_name}
                        </option>
                      ))}
                  </select>
                  <Button 
                    onClick={handleAssignVolunteer} 
                    disabled={!selectedVolunteerId || assigningLoading}
                    className="bg-black text-white hover:bg-gray-800 px-3 py-2"
                  >
                    {assigningLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  {volunteers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No volunteers assigned.</p>
                  ) : (
                    volunteers.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-[8px] bg-gray-50 border border-gray-100">
                        <div className="overflow-hidden">
                          <p className="text-[14px] font-medium text-black truncate">{assignment.user.full_name}</p>
                          <p className="text-[12px] text-gray-500 truncate">{assignment.user.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveVolunteer(assignment.id)}
                          disabled={removingId === assignment.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                          title="Remove volunteer"
                        >
                          {removingId === assignment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Delete Event"
        message={<>Are you SURE you want to delete this event completely? <strong>This cannot be undone.</strong></>}
        confirmText="Delete Event"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteAlertOpen(false)}
      />
      {/* Remove Registration Confirm Alert */}
      <ConfirmAlert
        isOpen={!!removeModal}
        title="Remove Registration"
        message={
          <>
            Are you sure you want to completely remove <strong>{removeModal?.name}</strong> from this event?
            <br />
            This action cannot be undone.
          </>
        }
        onConfirm={handleRemoveRegistration}
        onCancel={() => setRemoveModal(null)}
        confirmText="Remove"
        isDestructive
        loading={actionLoading === removeModal?.id}
      />
    </div>
  );
}
