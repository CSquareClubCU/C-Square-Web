"use client";

/**
 * /admin/events/new
 *
 * Create event form. All fields from the API spec.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createEvent } from "@/lib/api";
import type { EventCreateData } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const EVENT_TYPES = ["hackathon", "competition", "workshop", "seminar"];
const EVENT_STATUSES = ["draft", "published"];

function FieldGroup({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-[8px] border border-black/[0.08] bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-all duration-200 text-[15px]";

const selectClass =
  "w-full px-4 py-3 rounded-[8px] border border-black/[0.08] bg-white text-black focus:outline-none focus:border-black transition-all duration-200 text-[15px]";

export default function NewEventPage() {
  useRequireAuth({ role: "admin" });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [descMode, setDescMode] = useState<"write" | "preview">("write");
  const [rulesMode, setRulesMode] = useState<"write" | "preview">("write");

  const [form, setForm] = useState<EventCreateData>({
    title: "",
    description: "",
    event_type: "hackathon",
    start_datetime: "",
    end_datetime: "",
    venue: "",
    capacity: 100,
    registration_deadline: "",
    is_open_to_external: false,
    is_team_event: false,
    min_team_size: null,
    max_team_size: null,
    status: "draft",
    prizes: [],
    faqs: [
      { question: "Who can attend?", answer: "This event is open to all university students." },
      { question: "Is there a registration fee?", answer: "No, the event is completely free!" },
    ],
    rules: "",
    contact_name: "",
    contact_email: "",
    is_registration_open: true,
    requires_approval: true,
    is_flagship: false,
    points: 100,
  });

  const handlePrizeChange = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const newPrizes = [...(prev.prizes || [])];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      return { ...prev, prizes: newPrizes };
    });
  };

  const addPrize = () => {
    setForm((prev) => ({
      ...prev,
      prizes: [...(prev.prizes || []), { position: "", award: "", description: "" }],
    }));
  };

  const removePrize = (index: number) => {
    setForm((prev) => {
      const newPrizes = [...(prev.prizes || [])];
      newPrizes.splice(index, 1);
      return { ...prev, prizes: newPrizes };
    });
  };

  const handleFaqChange = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
    });
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => {
      const newFaqs = [...(prev.faqs || [])];
      newFaqs.splice(index, 1);
      return { ...prev, faqs: newFaqs };
    });
  };

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const event = await createEvent(form);
      setSuccess(true);
      setTimeout(() => router.push(`/admin/events/${event.slug}`), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <section className="w-full pt-12 pb-8">
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          <Link
            href="/admin/events"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-3 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Events
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-black mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 text-[15px]">
            Draft your event details. You can publish it whenever you're ready.
          </p>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-5 md:px-10 pb-24">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Info */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="font-semibold text-lg">Basic Information</h2>

            <FieldGroup label="Event Title" htmlFor="title" required>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. C² Hackathon 2026"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
              />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Event Type" htmlFor="event_type" required>
                <select
                  id="event_type"
                  name="event_type"
                  value={form.event_type}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Status" htmlFor="status" required>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            <FieldGroup label="Description" htmlFor="description" required>
              <div className="flex items-center gap-4 mb-2">
                <button type="button" onClick={() => setDescMode('write')} className={`text-[13px] font-medium transition-colors ${descMode === 'write' ? 'text-black border-b border-black' : 'text-gray-500 hover:text-black'}`}>Write</button>
                <button type="button" onClick={() => setDescMode('preview')} className={`text-[13px] font-medium transition-colors ${descMode === 'preview' ? 'text-black border-b border-black' : 'text-gray-500 hover:text-black'}`}>Preview</button>
              </div>
              {descMode === 'write' ? (
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="Describe the event — supports Markdown"
                  value={form.description}
                  onChange={handleChange}
                  className={inputClass + " resize-none"}
                />
              ) : (
                <div className="p-4 border border-black/[0.08] rounded-[8px] bg-white min-h-[140px] prose prose-sm max-w-none text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.description || "*No description provided.*"}
                  </ReactMarkdown>
                </div>
              )}
            </FieldGroup>

            <FieldGroup label="Venue" htmlFor="venue" required>
              <input
                id="venue"
                name="venue"
                type="text"
                required
                placeholder="e.g. Auditorium Block 18, CU"
                value={form.venue}
                onChange={handleChange}
                className={inputClass}
              />
            </FieldGroup>
          </div>

          {/* Dates & Capacity */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="font-semibold text-lg">
              <CalendarDays className="w-5 h-5 inline-block mr-2 text-[var(--c-muted-text)]" />
              Dates &amp; Capacity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Start Date &amp; Time" htmlFor="start_datetime" required>
                <input
                  id="start_datetime"
                  name="start_datetime"
                  type="datetime-local"
                  required
                  value={form.start_datetime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="End Date &amp; Time" htmlFor="end_datetime" required>
                <input
                  id="end_datetime"
                  name="end_datetime"
                  type="datetime-local"
                  required
                  value={form.end_datetime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Registration Deadline" htmlFor="registration_deadline" required>
                <input
                  id="registration_deadline"
                  name="registration_deadline"
                  type="datetime-local"
                  required
                  value={form.registration_deadline}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Capacity (seats)" htmlFor="capacity" required>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  required
                  value={form.capacity ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
          </div>

          {/* Enhancements: Contact & Rules */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="font-semibold text-lg">Contact & Rules</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Contact Name" htmlFor="contact_name">
                <input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  placeholder="Organizer Name"
                  value={form.contact_name || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Contact Email" htmlFor="contact_email">
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  placeholder="organizer@example.com"
                  value={form.contact_email || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Rules & Guidelines" htmlFor="rules">
              <div className="flex items-center gap-4 mb-2">
                <button type="button" onClick={() => setRulesMode('write')} className={`text-[13px] font-medium transition-colors ${rulesMode === 'write' ? 'text-black border-b border-black' : 'text-gray-500 hover:text-black'}`}>Write</button>
                <button type="button" onClick={() => setRulesMode('preview')} className={`text-[13px] font-medium transition-colors ${rulesMode === 'preview' ? 'text-black border-b border-black' : 'text-gray-500 hover:text-black'}`}>Preview</button>
              </div>
              {rulesMode === 'write' ? (
                <textarea
                  id="rules"
                  name="rules"
                  rows={4}
                  placeholder="e.g. No plagiarism, team sizes are strictly enforced..."
                  value={form.rules || ""}
                  onChange={handleChange}
                  className={inputClass + " resize-none"}
                />
              ) : (
                <div className="p-4 border border-black/[0.08] rounded-[8px] bg-white min-h-[120px] prose prose-sm max-w-none text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.rules || "*No rules provided.*"}
                  </ReactMarkdown>
                </div>
              )}
            </FieldGroup>
          </div>

          {/* Enhancements: Prizes */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Prizes</h2>
              <Button type="button" variant="outline" size="sm" onClick={addPrize}>
                <Plus className="w-4 h-4 mr-1" /> Add Prize
              </Button>
            </div>

            {(!form.prizes || form.prizes.length === 0) ? (
              <p className="text-sm text-[var(--c-muted-text)]">No prizes added yet.</p>
            ) : (
              <div className="space-y-4">
                {form.prizes.map((prize, idx) => (
                  <div key={idx} className="flex gap-3 items-start border border-[var(--c-border)] p-4 rounded-xl relative">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Position (e.g. 1st Place)"
                          value={prize.position}
                          onChange={(e) => handlePrizeChange(idx, "position", e.target.value)}
                          className={inputClass + " py-2"}
                        />
                        <input
                          type="text"
                          placeholder="Award (e.g. $500)"
                          value={prize.award}
                          onChange={(e) => handlePrizeChange(idx, "award", e.target.value)}
                          className={inputClass + " py-2"}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={prize.description}
                        onChange={(e) => handlePrizeChange(idx, "description", e.target.value)}
                        className={inputClass + " py-2"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrize(idx)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors mt-0.5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhancements: FAQs */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Frequently Asked Questions</h2>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="w-4 h-4 mr-1" /> Add FAQ
              </Button>
            </div>

            {(!form.faqs || form.faqs.length === 0) ? (
              <p className="text-sm text-[var(--c-muted-text)]">No FAQs added yet.</p>
            ) : (
              <div className="space-y-4">
                {form.faqs.map((faq, idx) => (
                  <div key={idx} className="flex gap-3 items-start border border-[var(--c-border)] p-4 rounded-xl relative">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Question (e.g. Who can attend?)"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                        className={inputClass + " py-2"}
                      />
                      <textarea
                        placeholder="Answer (e.g. Everyone!)"
                        value={faq.answer}
                        rows={2}
                        onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                        className={inputClass + " py-2 resize-none"}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors mt-0.5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Settings */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] mt-8">
            <h2 className="font-semibold text-lg mb-4">Event Features</h2>
            
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-black/[0.08] bg-white cursor-pointer hover:bg-black/[0.02] transition-colors">
                <input
                  type="checkbox"
                  checked={form.is_flagship}
                  onChange={(e) => setForm({ ...form, is_flagship: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <div>
                  <div className="font-medium text-[15px]">Flagship Event</div>
                  <div className="text-sm text-gray-500">Mark this as the primary flagship event to be featured on the homepage.</div>
                </div>
              </label>
            </div>

            <FieldGroup label="Club Points" htmlFor="points" required>
              <input
                id="points"
                name="points"
                type="number"
                required
                min="0"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value, 10) || 0 })}
                className={inputClass}
              />
              <p className="text-sm text-gray-500 mt-2">Points awarded to users upon check-in.</p>
            </FieldGroup>
          </div>

          {/* Attendance Settings */}
          <div className="bg-[#f8f9fa] border border-black/[0.04] rounded-[24px] p-6 md:p-8 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] mt-8">
            <h2 className="font-semibold text-lg mb-4">Attendance Settings</h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="is_registration_open"
                  checked={form.is_registration_open}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--c-border)] accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Registrations Open</p>
                  <p className="text-xs text-[var(--c-muted-text)]">
                    If unchecked, users cannot register for this event
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="requires_approval"
                  checked={form.requires_approval}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--c-border)] accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Requires Approval (Waitlist)</p>
                  <p className="text-xs text-[var(--c-muted-text)]">
                    If unchecked, users will be automatically approved unless capacity is full
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="is_open_to_external"
                  checked={form.is_open_to_external}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--c-border)] accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Open to external participants</p>
                  <p className="text-xs text-[var(--c-muted-text)]">
                    Allow registrations from non-CU students
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_team_event"
                  checked={form.is_team_event}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--c-border)] accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Team registration</p>
                  <p className="text-xs text-[var(--c-muted-text)]">
                    Students register as teams instead of individuals
                  </p>
                </div>
              </label>
            </div>

            {form.is_team_event && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-2 gap-5 pt-3"
              >
                <FieldGroup label="Min team size" htmlFor="min_team_size">
                  <input
                    id="min_team_size"
                    name="min_team_size"
                    type="number"
                    min={2}
                    value={form.min_team_size ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    className={inputClass}
                  />
                </FieldGroup>
                <FieldGroup label="Max team size" htmlFor="max_team_size">
                  <input
                    id="max_team_size"
                    name="max_team_size"
                    type="number"
                    min={2}
                    value={form.max_team_size ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    className={inputClass}
                  />
                </FieldGroup>
              </motion.div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/admin/events">
              <Button variant="ghost" type="button" className="text-[var(--c-muted-text)]">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading || success} size="lg">
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Created! Redirecting...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
