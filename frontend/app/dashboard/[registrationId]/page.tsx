"use client";

/**
 * /dashboard/[registrationId]
 *
 * Shows the QR code for a specific approved registration.
 * Students use this on event day for check-in.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CalendarDays,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchRegistration } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Registration } from "@/types";

const statusMeta: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  approved: {
    label: "Approved — show this QR at the event",
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "text-[var(--c-success)]",
    description:
      "Your registration is confirmed. Show this QR code to the volunteer at the entry.",
  },
  pending: {
    label: "Pending review",
    icon: <Clock className="w-5 h-5" />,
    color: "text-gray-500",
    description:
      "Your registration is under review. You'll receive an email once approved.",
  },
  rejected: {
    label: "Registration rejected",
    icon: <XCircle className="w-5 h-5" />,
    color: "text-red-500",
    description:
      "Unfortunately your registration was not approved. Check your email for the reason.",
  },
  waitlisted: {
    label: "On the waitlist",
    icon: <AlertCircle className="w-5 h-5" />,
    color: "text-amber-500",
    description:
      "You're on the waitlist. If a spot opens up, you'll be moved to pending automatically.",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-5 h-5" />,
    color: "text-gray-400",
    description: "This registration has been cancelled.",
  },
};

export default function RegistrationQRPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = params.registrationId as string;

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) return;

    fetchRegistration(registrationId)
      .then(setRegistration)
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load registration";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 text-center">
        <QrCode className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Registration not found</h1>
        <p className="text-[var(--c-secondary-text)] mb-6">
          {error || "This registration doesn't exist or you don't have access to it."}
        </p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const meta = statusMeta[registration.status] || statusMeta.pending;
  const isApproved = registration.status === "approved";

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-10 relative overflow-hidden">
        <div className="max-w-[600px] mx-auto px-5 md:px-10 relative z-10">
          <Link
            href="/dashboard"
            className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text">
            {registration.event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatDate(registration.event.start_datetime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatTime(registration.event.start_datetime)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {registration.event.venue}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[600px] mx-auto px-5 md:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-[var(--c-border)] rounded-[32px] overflow-hidden"
        >
          {/* Status banner */}
          <div
            className={`px-8 py-5 border-b border-[var(--c-border)] flex items-center gap-3 ${
              isApproved ? "bg-gray-50" : "bg-white"
            }`}
          >
            <span className={meta.color}>{meta.icon}</span>
            <span className={`text-sm font-semibold ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          {/* QR Code section */}
          <div className="p-8 md:p-12 flex flex-col items-center text-center">
            {isApproved && registration.qr_image_url ? (
              <>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border-4 border-[var(--c-border)] shadow-lg mb-8"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={registration.qr_image_url}
                    alt={`QR code for ${registration.event.title}`}
                    className="w-full h-full object-contain bg-white"
                  />
                </motion.div>

                <p className="text-[var(--c-secondary-text)] text-sm leading-relaxed max-w-xs">
                  {meta.description}
                </p>

                <div className="mt-6 px-4 py-2 bg-gray-50 rounded-full border border-[var(--c-border)]">
                  <span className="text-xs text-[var(--c-muted-text)] font-mono">
                    ID: {registration.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-[var(--c-border)] flex flex-col items-center justify-center mb-8">
                  <QrCode className="w-16 h-16 text-gray-200 mb-4" />
                  <span className="text-sm text-[var(--c-muted-text)]">
                    QR available after approval
                  </span>
                </div>
                <p className="text-[var(--c-secondary-text)] text-sm leading-relaxed max-w-xs">
                  {meta.description}
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--c-border)] bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-[var(--c-muted-text)]">
              Registered{" "}
              {registration.registered_at
                ? new Date(registration.registered_at).toLocaleDateString()
                : "—"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-[var(--c-muted-text)] text-xs"
            >
              View all registrations
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
