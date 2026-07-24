"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-dismissed";

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Only show on mobile/tablet devices
    const isMobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    if (!isMobile) return;

    // Don't show if already dismissed this session
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Don't show if already running as a standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const showTimer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(showTimer);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShow(true), 1000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      // Native browser install flow
      setInstalling(true);
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
        return;
      }
      setInstalling(false);
      setDeferredPrompt(null);
    } else {
      // Fallback: dismiss — browser doesn't support native prompt here
      handleDismiss();
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  return (
    <Dialog.Root open={show} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <AnimatePresence>
        {show && (
          <Dialog.Portal forceMount>
            {/* Scrim */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                key="pwa-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-[2px]"
                onClick={handleDismiss}
              />
            </Dialog.Overlay>

            {/* Card — slides up from bottom */}
            <Dialog.Content asChild forceMount onPointerDownOutside={handleDismiss} onEscapeKeyDown={handleDismiss}>
              <motion.div
                key="pwa-card"
                initial={{ opacity: 0, y: 80, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 outline-none"
              >
                <div className="max-w-sm mx-auto bg-white rounded-[24px] border border-[#EAEAEA] shadow-[0_8px_40px_rgba(0,0,0,0.14)] overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-black" />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] bg-black flex items-center justify-center shadow-sm shrink-0">
                      <Image
                        src="/logo-mark.png"
                        alt="C Square Club"
                        width={28}
                        height={28}
                        className="object-contain invert"
                      />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#111] leading-tight tracking-[-0.01em]">
                        C Square Club
                      </p>
                      <p className="text-[11px] text-[#888] mt-0.5">
                        csquareclub.co.in
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    aria-label="Dismiss install prompt"
                    className="w-7 h-7 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#888] hover:bg-[#E8E8E8] hover:text-[#333] transition-colors shrink-0 mt-0.5"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Body */}
                <p className="text-[13px] text-[#555] leading-relaxed mb-5">
                  Install the app for fast access to events, your dashboard, and
                  QR check-ins — even offline.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Offline access", "Fast launch", "No app store"].map(
                    (feat) => (
                      <span
                        key={feat}
                        className="text-[11px] font-medium text-[#555] bg-[#F5F5F5] px-3 py-1 rounded-full border border-[#E8E8E8]"
                      >
                        {feat}
                      </span>
                    )
                  )}
                </div>

                {/* Actions */}
                {isIOS ? (
                  <div className="flex flex-col gap-2 text-center">
                    <div className="bg-[#F8F8F8] p-3 rounded-[12px] border border-[#EAEAEA] text-[13px] text-[#333]">
                      Tap <span className="font-semibold">Share</span> in your browser menu<br/>and select <span className="font-semibold">Add to Home Screen</span>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="py-2.5 px-4 text-[13px] font-medium text-[#666] hover:text-[#111] transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInstall}
                      disabled={installing || !deferredPrompt}
                      id="pwa-install-btn"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white text-[13.5px] font-semibold rounded-[12px] shadow-[inset_0_2px_0_0_rgba(255,255,255,0.15)] hover:bg-[#222] active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {installing ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={14} strokeWidth={2.5} />
                      )}
                      {installing ? "Installing…" : "Install App"}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="py-2.5 px-4 text-[13px] font-medium text-[#666] hover:text-[#111] border border-[#E8E8E8] rounded-[12px] hover:bg-[#F5F5F5] active:scale-[0.98] transition-all"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    )}
  </AnimatePresence>
</Dialog.Root>
  );
}
