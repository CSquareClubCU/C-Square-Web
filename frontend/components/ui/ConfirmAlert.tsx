import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./Button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConfirmAlert({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  loading = false,
  confirmDisabled = false,
}: {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open && !loading) onCancel();
    }}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content 
                asChild
                onInteractOutside={(e) => {
                  if (loading) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                  if (loading) e.preventDefault();
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-xl relative z-10"
                >
                  <Dialog.Title className="text-lg font-semibold text-[#111111] mb-2">{title}</Dialog.Title>
                  <Dialog.Description asChild>
                    <div className="text-[14px] text-[#6b7280] mb-6">{message}</div>
                  </Dialog.Description>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" className="border-[#e5e7eb]" onClick={onCancel} disabled={loading}>
                      {cancelText}
                    </Button>
                    <Button
                      className={isDestructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-black text-white hover:bg-gray-800"}
                      onClick={onConfirm}
                      disabled={loading || confirmDisabled}
                    >
                      {loading ? "..." : confirmText}
                    </Button>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </button>
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
