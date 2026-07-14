import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

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
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={loading ? undefined : onCancel}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[16px] p-6 max-w-sm w-full shadow-xl relative z-10"
          >
            <h3 className="text-lg font-semibold text-[#111111] mb-2">{title}</h3>
            <div className="text-[14px] text-[#6b7280] mb-6">{message}</div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-[#e5e7eb]" onClick={onCancel} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                className={isDestructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-black text-white hover:bg-gray-800"}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "..." : confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
