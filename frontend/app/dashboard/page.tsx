"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/MotionElements";

// Mock dashboard data — will be replaced with real API calls
const MOCK_USER = {
  full_name: "Arjun Singh",
  email: "arjun@cuchd.in",
  role: "student" as const,
  student_uid: "22BCS10001",
  branch: "CSE",
};

const MOCK_REGISTRATIONS = [
  {
    id: "reg-1",
    event: {
      id: "1",
      title: "HackCU 2026",
      start_datetime: "2026-08-15T09:00:00Z",
      venue: "Block 10, Chandigarh University",
    },
    status: "approved",
    qr_image_url: null,
    registered_at: "2026-07-15T14:30:00Z",
  },
  {
    id: "reg-2",
    event: {
      id: "2",
      title: "Intro to Web3 Workshop",
      start_datetime: "2026-09-05T14:00:00Z",
      venue: "Seminar Hall, Block 3",
    },
    status: "pending",
    qr_image_url: null,
    registered_at: "2026-08-28T10:00:00Z",
  },
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  pending: {
    label: "Pending Review",
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-700",
    bg: "bg-red-50",
  },
  waitlisted: {
    label: "Waitlisted",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  return (
    <div className="w-full">
      {/* Dashboard Header */}
      <section className="w-full bg-[var(--c-surface)] border-b border-[var(--c-border)] py-10 md:py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 rounded-full bg-[var(--c-accent)] text-white flex items-center justify-center text-2xl font-bold">
                  {MOCK_USER.full_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Hey, {MOCK_USER.full_name.split(" ")[0]}!
                  </h1>
                  <p className="text-sm text-[var(--c-secondary-text)]">
                    {MOCK_USER.email} &middot; {MOCK_USER.student_uid} &middot; {MOCK_USER.branch}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-16">
        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 mb-10">
          {(["upcoming", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[var(--c-accent)] text-white"
                  : "bg-[var(--c-surface)] text-[var(--c-secondary-text)] hover:bg-gray-200"
              }`}
            >
              {tab === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}
        </div>

        {/* Registrations */}
        <StaggerContainer className="space-y-4">
          {MOCK_REGISTRATIONS.map((reg) => {
            const status = statusConfig[reg.status] || statusConfig.pending;
            return (
              <StaggerItem key={reg.id}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-8 rounded-[24px] border border-[var(--c-border)] bg-white flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow duration-300"
                >
                  {/* Event Info */}
                  <div className="flex-1">
                    <Link
                      href={`/events/${reg.event.id}`}
                      className="text-lg font-semibold hover:underline underline-offset-4"
                    >
                      {reg.event.title}
                    </Link>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--c-secondary-text)]">
                      <span className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-1.5" />
                        {formatDate(reg.event.start_datetime)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        Registered {formatDate(reg.registered_at)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}
                  >
                    {status.icon}
                    <span className="ml-1.5">{status.label}</span>
                  </span>

                  {/* QR Code Button */}
                  {reg.status === "approved" && (
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR
                    </Button>
                  )}
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Empty State */}
        {MOCK_REGISTRATIONS.length === 0 && (
          <FadeUp className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[var(--c-surface)] flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-8 h-8 text-[var(--c-muted-text)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No registrations yet</h3>
            <p className="text-[var(--c-secondary-text)] mb-6">
              Browse upcoming events and register for your first one!
            </p>
            <Link href="/events">
              <Button>Explore Events</Button>
            </Link>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
