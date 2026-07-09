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
  "w-full px-4 py-3 rounded-xl border border-[var(--c-border)] bg-white text-[var(--c-primary-text)] placeholder:text-[var(--c-muted-text)] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 text-sm";

const selectClass =
  "w-full px-4 py-3 rounded-xl border border-[var(--c-border)] bg-white text-[var(--c-primary-text)] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 text-sm";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    rules: "",
    contact_name: "",
    contact_email: "",
    is_registration_open: true,
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
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        <div className="max-w-[800px] mx-auto px-5 md:px-10 relative z-10">
          <Link
            href="/admin/events"
            className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Create New Event
          </h1>
          <p className="text-white/40 mt-1">
            Saved as draft until you publish it.
          </p>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-5 md:px-10 py-10">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Info */}
          <div className="bg-white border border-[var(--c-border)] rounded-2xl p-6 md:p-8 space-y-5">
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
              <textarea
                id="description"
                name="description"
                required
                rows={5}
                placeholder="Describe the event — supports basic HTML"
                value={form.description}
                onChange={handleChange}
                className={inputClass + " resize-none"}
              />
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
          <div className="bg-white border border-[var(--c-border)] rounded-2xl p-6 md:p-8 space-y-5">
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
          <div className="bg-white border border-[var(--c-border)] rounded-2xl p-6 md:p-8 space-y-5">
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
              <textarea
                id="rules"
                name="rules"
                rows={4}
                placeholder="Rules for the event (supports basic HTML)"
                value={form.rules || ""}
                onChange={handleChange}
                className={inputClass + " resize-none"}
              />
            </FieldGroup>
          </div>

          {/* Enhancements: Prizes */}
          <div className="bg-white border border-[var(--c-border)] rounded-2xl p-6 md:p-8 space-y-5">
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

          {/* Options */}
          <div className="bg-white border border-[var(--c-border)] rounded-2xl p-6 md:p-8 space-y-5">
            <h2 className="font-semibold text-lg">Registration Options</h2>

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
