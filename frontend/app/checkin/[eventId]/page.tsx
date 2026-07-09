"use client";

/**
 * /checkin/[eventId]
 *
 * Event-day check-in page for volunteers and admins.
 * Two modes:
 * 1. QR Scanner  — uses the browser camera to scan QR codes
 * 2. Manual List — searchable attendance list with manual check-in
 *
 * Live stats auto-refresh every 5 seconds.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  QrCode,
  List,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  RefreshCw,
  MapPin,
  Clock,
  Camera,
  CameraOff,
} from "lucide-react";

import {
  fetchEventById,
  fetchCheckinStats,
  fetchAttendanceList,
  checkinByQR,
  manualCheckin,
} from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, CheckinStats, AttendanceRecord } from "@/types";

type Mode = "qr" | "manual";

type CheckinFeedback = {
  type: "success" | "error" | "already";
  name: string;
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// QR Scanner component — uses jsQR via canvas
// ─────────────────────────────────────────────────────────────────────────────

function QRScanner({ onScan }: { onScan: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const lastScan = useRef<string>("");
  const animRef = useRef<number>(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasCamera(true);
          setScanning(true);
        }
      } catch {
        setHasCamera(false);
      }
    }

    startCamera();

    return () => {
      setScanning(false);
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Scan loop using jsQR dynamically loaded
  useEffect(() => {
    if (!scanning) return;

    let jsQR: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null = null;

    import("jsqr").then((mod) => {
      jsQR = mod.default;
      scanLoop();
    }).catch(() => {
      // jsQR not available — fallback to manual input only
    });

    function scanLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !jsQR) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (canvas.width > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result && result.data && result.data !== lastScan.current) {
          lastScan.current = result.data;
          onScan(result.data);
          // Cooldown before next scan
          setTimeout(() => { lastScan.current = ""; }, 3000);
        }
      }

      animRef.current = requestAnimationFrame(scanLoop);
    }

    return () => { cancelAnimationFrame(animRef.current); };
  }, [scanning, onScan]);

  if (hasCamera === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CameraOff className="w-12 h-12 text-gray-300 mb-4" />
        <p className="font-semibold text-[var(--c-secondary-text)]">Camera not available</p>
        <p className="text-sm text-[var(--c-muted-text)] mt-1">
          Use the Manual tab to check in students by searching their name.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-w-sm mx-auto">
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 border-2 border-white/60 rounded-2xl relative">
          {/* Corner accents */}
          {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "bottom-0 right-0 border-b-4 border-r-4"].map((cls, i) => (
            <div key={i} className={`absolute w-6 h-6 border-white rounded-sm ${cls}`} />
          ))}
          {/* Scan line */}
          <motion.div
            className="absolute left-2 right-2 h-0.5 bg-white/70"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      {hasCamera === null && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <Camera className="w-8 h-8 text-white/40 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [mode, setMode] = useState<Mode>("qr");
  const [feedback, setFeedback] = useState<CheckinFeedback | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [listSearch, setListSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [manualLoading, setManualLoading] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // Debounce list search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(listSearch), 350);
    return () => clearTimeout(t);
  }, [listSearch]);

  // Load event
  useEffect(() => {
    fetchEventById(eventId)
      .then(setEvent)
      .catch(console.error);
  }, [eventId]);

  // Load stats + poll every 5s
  const refreshStats = useCallback(async () => {
    try {
      const data = await fetchCheckinStats(eventId);
      setStats(data);
    } catch (err) { console.error(err); }
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) await refreshStats();
    };
    init();
    const interval = setInterval(refreshStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshStats]);

  // Load attendance list
  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await fetchAttendanceList(eventId, {
        search: debouncedSearch || undefined,
      });
      setAttendanceList(data.results);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  }, [eventId, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mode === "manual" && mounted) {
        await loadList();
      }
    };
    init();
    return () => { mounted = false; };
  }, [mode, loadList]);

  // Show feedback briefly
  function showFeedback(f: CheckinFeedback) {
    setFeedback(f);
    setTimeout(() => setFeedback(null), 4000);
  }

  // Handle QR scan
  const handleQRScan = useCallback(async (token: string) => {
    if (qrLoading) return;
    setQrLoading(true);
    try {
      const result = await checkinByQR(token);
      showFeedback({
        type: result.already_checked_in ? "already" : "success",
        name: result.student.full_name,
        message: result.message,
      });
      refreshStats();
    } catch (err: unknown) {
      showFeedback({
        type: "error",
        name: "",
        message: err instanceof Error ? err.message : "Invalid QR code",
      });
    } finally {
      setQrLoading(false);
    }
  }, [qrLoading, refreshStats]);

  // Handle manual check-in
  async function handleManualCheckin(registrationId: string) {
    setManualLoading(registrationId);
    try {
      const result = await manualCheckin(registrationId);
      showFeedback({
        type: result.already_checked_in ? "already" : "success",
        name: result.student.full_name,
        message: result.message,
      });
      refreshStats();
      loadList();
    } catch (err: unknown) {
      showFeedback({
        type: "error",
        name: "",
        message: err instanceof Error ? err.message : "Check-in failed",
      });
    } finally {
      setManualLoading(null);
    }
  }

  const checkedInPercent = stats
    ? Math.round((stats.checked_in / Math.max(stats.total_approved, 1)) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Header */}
      <section className="w-full bg-black text-white noise-overlay border-b border-white/[0.04] py-8 relative overflow-hidden">
        <div className="max-w-[900px] mx-auto px-5 md:px-10 relative z-10">
          <Link
            href="/admin"
            className="text-sm text-white/40 hover:text-white transition-colors flex items-center mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Admin
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight gradient-text">
                {event?.title || "Check-in Scanner"}
              </h1>
              {event && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/40 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.venue}
                  </span>
                </div>
              )}
            </div>

            {/* Live stats */}
            {stats && (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.checked_in}</p>
                  <p className="text-xs text-white/40">Checked in</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.total_approved}</p>
                  <p className="text-xs text-white/40">Approved</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{checkedInPercent}%</p>
                  <p className="text-xs text-white/40">Rate</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {stats && (
            <div className="mt-5">
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-emerald-400 h-2 rounded-full"
                  animate={{ width: `${checkedInPercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm w-full mx-4 ${
              feedback.type === "success"
                ? "bg-black text-white"
                : feedback.type === "already"
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : feedback.type === "already" ? (
              <RefreshCw className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            <div>
              {feedback.name && (
                <p className="font-semibold text-sm">{feedback.name}</p>
              )}
              <p className="text-sm opacity-80">{feedback.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode tabs + content */}
      <div className="max-w-[900px] mx-auto px-5 md:px-10 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
          {([
            { id: "qr" as Mode, label: "QR Scanner", icon: <QrCode className="w-4 h-4" /> },
            { id: "manual" as Mode, label: "Manual List", icon: <List className="w-4 h-4" /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === tab.id
                  ? "bg-white text-black shadow-sm"
                  : "text-[var(--c-muted-text)] hover:text-black"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* QR Scanner mode */}
        {mode === "qr" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto"
          >
            <QRScanner onScan={handleQRScan} />
            <p className="text-center text-sm text-[var(--c-muted-text)] mt-4">
              Point the camera at a student&apos;s QR code to check them in instantly.
            </p>
            {qrLoading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[var(--c-muted-text)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Manual list mode */}
        {mode === "manual" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted-text)]" />
              <input
                type="text"
                placeholder="Search by name, email, or student UID..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[var(--c-border)] bg-white focus:outline-none focus:border-black transition-all text-sm"
              />
            </div>

            {/* List */}
            <div className="bg-white border border-[var(--c-border)] rounded-2xl overflow-hidden">
              {listLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-[var(--c-secondary-text)] font-medium">No approved registrations</p>
                  <p className="text-sm text-[var(--c-muted-text)] mt-1">
                    {debouncedSearch ? "No match for your search." : "No one approved yet."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--c-border)]">
                  {attendanceList.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Check-in status indicator */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            record.is_checked_in ? "bg-emerald-400" : "bg-gray-200"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${record.is_checked_in ? "text-[var(--c-muted-text)]" : ""}`}>
                            {record.user_full_name}
                          </p>
                          <p className="text-xs text-[var(--c-muted-text)] truncate">
                            {record.user_email}
                            {record.user_student_uid && ` · ${record.user_student_uid}`}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-4">
                        {record.is_checked_in ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Checked in
                          </span>
                        ) : (
                          <button
                            onClick={() => handleManualCheckin(record.registration_id)}
                            disabled={manualLoading === record.registration_id}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {manualLoading === record.registration_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Check in
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-center text-[var(--c-muted-text)]">
              Showing approved registrations only. 
              <span className="text-emerald-600 font-semibold"> {attendanceList.filter(r => r.is_checked_in).length}</span> of {attendanceList.length} checked in.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
