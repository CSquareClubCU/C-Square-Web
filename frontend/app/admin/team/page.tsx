"use client";

/**
 * /admin/team
 *
 * Full team member CRUD management — all in the portal.
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
import { fetchTeam, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { TeamMemberPublic } from "@/types";

type MemberForm = {
  full_name: string;
  designation: string;
  photo_url: string;
  display_order: string;
};

const emptyForm: MemberForm = {
  full_name: "",
  designation: "",
  photo_url: "",
  display_order: "0",
};

export default function AdminTeamPage() {
  useRequireAuth({ role: "admin" });
  const [members, setMembers] = useState<TeamMemberPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberPublic | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(member: TeamMemberPublic) {
    setEditingMember(member);
    setForm({
      full_name: member.full_name,
      designation: member.designation,
      photo_url: member.photo_url ?? "",
      display_order: String(member.display_order),
    });
    setFormError(null);
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
      };
      if (editingMember) {
        await updateTeamMember(editingMember.id, payload);
      } else {
        await createTeamMember(payload);
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(member: TeamMemberPublic) {
    setTogglingId(member.id);
    try {
      await updateTeamMember(member.id, { is_active: !member.is_active });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(member: TeamMemberPublic) {
    if (deleteConfirm !== member.id) {
      setDeleteConfirm(member.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    setDeletingId(member.id);
    try {
      await deleteTeamMember(member.id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

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
        {/* Member grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--c-border)] rounded-2xl">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-[var(--c-secondary-text)]">No team members yet</p>
            <p className="text-sm text-[var(--c-muted-text)] mt-1">Add the first member using the button above.</p>
            <button
              onClick={openCreate}
              className="mt-4 inline-block"
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </button>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {members.map((member) => (
              <StaggerItem key={member.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={`flex flex-col items-center text-center group relative ${!member.is_active ? "opacity-50" : ""}`}
                >
                  {/* Photo */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--c-surface)] border-2 border-[var(--c-border)] mb-4 overflow-hidden transition-all duration-300 group-hover:border-black/20 group-hover:shadow-md">
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
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--c-border)]">
                <h3 className="font-bold text-lg">
                  {editingMember ? "Edit Member" : "Add Team Member"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
