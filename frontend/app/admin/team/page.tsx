"use client";

/**
 * /admin/team
 *
<<<<<<< HEAD
 * Full Core Team management — all in the portal.
=======
 * Full team member CRUD management — all in the portal.
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
 * No Django Admin links needed.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Loader2,
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Save,
  EyeOff,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";
<<<<<<< HEAD
import { fetchTeam, createTeamMember, updateTeamMember, deleteTeamMember, uploadTeamPhoto, searchUsers } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { CoreTeamMemberPublic, User } from "@/types";
=======
import { fetchTeam, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { TeamMemberPublic } from "@/types";
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f

type MemberForm = {
  full_name: string;
  designation: string;
  photo_url: string;
  display_order: string;
<<<<<<< HEAD
  user_id: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
};

const emptyForm: MemberForm = {
  full_name: "",
  designation: "",
  photo_url: "",
  display_order: "0",
<<<<<<< HEAD
  user_id: "",
  github_url: "",
  linkedin_url: "",
  twitter_url: "",
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
};

export default function AdminTeamPage() {
  useRequireAuth({ role: "admin" });
<<<<<<< HEAD
  const [members, setMembers] = useState<CoreTeamMemberPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CoreTeamMemberPublic | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
=======
  const [members, setMembers] = useState<TeamMemberPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberPublic | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

<<<<<<< HEAD
  // User Autocomplete state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
  // Keyboard access for modal
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  const load = useCallback(() => {
    setLoading(true);
    fetchTeam()
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await load();
    };
    init();
    return () => { mounted = false; };
  }, [load]);

  function openCreate() {
    setEditingMember(null);
    setForm(emptyForm);
<<<<<<< HEAD
    setPhotoFile(null);
    setFormError(null);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUser(null);
    setModalOpen(true);
  }

  function openEdit(member: CoreTeamMemberPublic) {
=======
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(member: TeamMemberPublic) {
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    setEditingMember(member);
    setForm({
      full_name: member.full_name,
      designation: member.designation,
<<<<<<< HEAD
      photo_url: member.photo_url || "",
      display_order: String(member.display_order),
      user_id: member.user || "",
      github_url: member.github_url || "",
      linkedin_url: member.linkedin_url || "",
      twitter_url: member.twitter_url || "",
    });
    setPhotoFile(null);
    setFormError(null);
    if (member.user && member.user_email) {
      setSelectedUser({ id: member.user, email: member.user_email } as any);
      setUserSearchQuery(member.user_email);
    } else {
      setUserSearchQuery("");
      setSelectedUser(null);
    }
    setUserSearchResults([]);
=======
      photo_url: member.photo_url ?? "",
      display_order: String(member.display_order),
    });
    setFormError(null);
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        designation: form.designation.trim(),
        photo_url: form.photo_url.trim() || null,
        display_order: parseInt(form.display_order, 10) || 0,
<<<<<<< HEAD
        user_id: form.user_id || null,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        twitter_url: form.twitter_url.trim() || null,
      };
      let memberId = editingMember?.id;
      if (editingMember) {
        await updateTeamMember(editingMember.id, payload);
      } else {
        const created = await createTeamMember(payload);
        memberId = created.id;
      }
      
      if (photoFile && memberId) {
        await uploadTeamPhoto(memberId, photoFile);
      }

=======
      };
      if (editingMember) {
        await updateTeamMember(editingMember.id, payload);
      } else {
        await createTeamMember(payload);
      }
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save member.");
    } finally {
      setSubmitting(false);
    }
  }

<<<<<<< HEAD
  async function handleToggleActive(member: CoreTeamMemberPublic) {
=======
  async function handleToggleActive(member: TeamMemberPublic) {
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    setTogglingId(member.id);
    setActionError(null);
    try {
      await updateTeamMember(member.id, { is_active: !member.is_active });
      load();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setTogglingId(null);
    }
  }

<<<<<<< HEAD
  async function handleDelete(member: CoreTeamMemberPublic) {
=======
  async function handleDelete(member: TeamMemberPublic) {
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
    if (deleteConfirm !== member.id) {
      setDeleteConfirm(member.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    setDeletingId(member.id);
    setActionError(null);
    try {
      await deleteTeamMember(member.id);
      load();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

<<<<<<< HEAD
  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchUsers(userSearchQuery);
        setUserSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  const activeCount = members.filter((m) => m.is_active).length;

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <section className="w-full pt-12 pb-8">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-3 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
                Team Management
              </h1>
              <p className="text-gray-600 text-[15px]">
                {activeCount} active member{activeCount !== 1 ? "s" : ""} shown on the public team page.
              </p>
            </div>
            <Button
              className="px-6 bg-black text-white hover:bg-gray-800 shrink-0"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-24">
=======
  const activeCount = members.filter((m) => m.is_active).length;

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 relative z-10">
          <FadeUp>
            <Link
              href="/admin"
              className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40">
                  Admin › Team
                </span>
                <h1 className="text-3xl font-bold tracking-tight mt-1 gradient-text">
                  Team Management
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {activeCount} active member{activeCount !== 1 ? "s" : ""} shown on the public team page.
                </p>
              </div>
              <Button
                className="bg-white text-black hover:bg-gray-100 border-0 shrink-0"
                onClick={openCreate}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
        {/* Member grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : members.length === 0 ? (
<<<<<<< HEAD
          <div className="text-center py-20 bg-[#f8f9fa] rounded-[24px] border border-black/[0.04]">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1 text-black">No Team Members</h3>
            <p className="text-gray-500 text-sm mb-0">
=======
          <div className="text-center py-20 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)]">
            <h3 className="font-semibold text-lg mb-1">No Team Members</h3>
            <p className="text-[var(--c-muted-text)] text-sm mb-0">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
              Add your first team member to display on the public team page.
            </p>
            <button
              onClick={openCreate}
<<<<<<< HEAD
              className="mt-5 inline-block"
            >
              <Button size="sm" className="bg-black text-white px-6 hover:bg-gray-800">
=======
              className="mt-4 inline-block"
            >
              <Button size="sm">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {actionError && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {actionError}
              </div>
            )}
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {members.map((member) => (
                <StaggerItem key={member.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
<<<<<<< HEAD
                    className={`flex flex-col items-center text-center group relative p-6 bg-white border border-black/[0.04] rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all ${!member.is_active ? "opacity-50 grayscale-[50%]" : ""}`}
                  >
                  {/* Photo */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#f8f9fa] border-2 border-black/[0.04] mb-4 overflow-hidden transition-all duration-300 group-hover:border-black/10 group-hover:shadow-sm shrink-0">
=======
                    className={`flex flex-col items-center text-center group relative ${!member.is_active ? "opacity-50" : ""}`}
                  >
                  {/* Photo */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--c-surface)] border-2 border-[var(--c-border)] mb-4 overflow-hidden transition-all duration-300 group-hover:border-black/20 group-hover:shadow-md">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--c-muted-text)]">
                        {member.full_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <p className="font-semibold text-sm mb-0.5 leading-tight">{member.full_name}</p>
                  <p className="text-xs text-[var(--c-muted-text)] mb-2">{member.designation}</p>

                  {/* Inactive badge */}
                  {!member.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-2">
                      Hidden
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(member)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[var(--c-secondary-text)]" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(member)}
                      disabled={togglingId === member.id}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={member.is_active ? "Hide from public page" : "Show on public page"}
                    >
                      {togglingId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : member.is_active ? (
                        <EyeOff className="w-3.5 h-3.5 text-[var(--c-muted-text)]" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      disabled={deletingId === member.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        deleteConfirm === member.id
                          ? "bg-red-100 text-red-600"
                          : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                      }`}
                      title={deleteConfirm === member.id ? "Click to confirm delete" : "Delete permanently"}
                    >
                      {deletingId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : deleteConfirm === member.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
            </StaggerContainer>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
          >
            <motion.div
<<<<<<< HEAD
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-[24px] shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04] bg-[#f8f9fa]">
                <h3 className="text-lg font-semibold tracking-tight text-black">
=======
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              ref={(node) => {
                if (node) node.focus();
              }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md focus:outline-none"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--c-border)]">
                <h3 className="font-bold text-lg">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                  {editingMember ? "Edit Member" : "Add Team Member"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
<<<<<<< HEAD
                  className="p-2 -mr-2 text-gray-400 hover:bg-black/5 hover:text-black rounded-full transition-colors"
=======
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

<<<<<<< HEAD
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto">
                  {formError && (
                    <div className="p-3 rounded-[8px] bg-red-50 border border-red-100 text-red-600 text-sm">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-black">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[15px]"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-black">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[15px]"
                      placeholder="e.g. President"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-black">
                      Photo
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          setFormError("File size must be under 5MB.");
                          setPhotoFile(null);
                          e.target.value = "";
                        } else {
                          setFormError(null);
                          setPhotoFile(file);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[15px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-black hover:file:bg-gray-100"
                    />
                    {form.photo_url && !photoFile && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty to keep current photo.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-black">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[15px]"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first.</p>
                  </div>

                  <div className="pt-4 border-t border-black/[0.04]">
                    <h4 className="text-sm font-semibold mb-3 text-black">Link User Profile (Optional)</h4>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search user by name or email..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          if (!e.target.value) {
                            setSelectedUser(null);
                            setForm({ ...form, user_id: "" });
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-[8px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[15px]"
                      />
                      {isSearchingUsers && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      
                      {userSearchResults.length > 0 && userSearchQuery && !selectedUser && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg max-h-48 overflow-y-auto">
                          {userSearchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col items-start border-b border-gray-100 last:border-0"
                              onClick={() => {
                                setSelectedUser(user);
                                setForm({ ...form, user_id: user.id });
                                setUserSearchQuery(user.email);
                                setUserSearchResults([]);
                              }}
                            >
                              <span className="text-[14px] font-medium text-black">{user.full_name || "Unknown"}</span>
                              <span className="text-[12px] text-gray-500">{user.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedUser && (
                        <div className="mt-2 p-2 bg-emerald-50 text-emerald-700 text-xs rounded-md flex items-center justify-between border border-emerald-100">
                          <span>Linked to <strong>{selectedUser.email}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(null);
                              setForm({ ...form, user_id: "" });
                              setUserSearchQuery("");
                            }}
                            className="text-emerald-500 hover:text-emerald-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {form.user_id && !selectedUser && (
                        <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded-md flex items-center justify-between border border-blue-100">
                          <span>User ID: <strong>{form.user_id}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, user_id: "" });
                            }}
                            className="text-blue-500 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/[0.04]">
                    <h4 className="text-sm font-semibold mb-3 text-black">Social Links (Optional)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">
                          GitHub URL
                        </label>
                        <input
                          type="url"
                          value={form.github_url}
                          onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-[6px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[14px]"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={form.linkedin_url}
                          onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-[6px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[14px]"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          value={form.twitter_url}
                          onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-[6px] border border-black/[0.08] bg-white focus:outline-none focus:border-black transition-colors text-[14px]"
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-5 border-t border-black/[0.04] bg-[#f8f9fa] flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="border-black/[0.08]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-black text-white hover:bg-gray-800">
=======
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {[
                  { id: "m-name", label: "Full Name", name: "full_name", placeholder: "e.g. Karan Sharma", required: true },
                  { id: "m-role", label: "Designation / Role", name: "designation", placeholder: "e.g. President", required: true },
                  { id: "m-photo", label: "Photo URL", name: "photo_url", placeholder: "https://...", required: false },
                  { id: "m-order", label: "Display Order", name: "display_order", placeholder: "0 = first", required: false },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block text-sm font-medium mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      id={field.id}
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={(form as Record<string, string>)[field.name]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border)] text-sm focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                ))}

                {formError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                    {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-[var(--c-muted-text)]"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? "Saving..." : editingMember ? "Save Changes" : "Add Member"}
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
