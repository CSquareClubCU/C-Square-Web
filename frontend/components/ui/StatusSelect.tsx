import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StatusSelect({
  isCheckedIn,
  disabled,
  onSelect,
}: {
  isCheckedIn: boolean;
  disabled?: boolean;
  onSelect: (status: "pending" | "checked_in") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between w-full text-[13px] font-medium px-3 py-1.5 rounded-full border outline-none transition-colors ${
          disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
            : isCheckedIn
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer"
        }`}
      >
        <span>{isCheckedIn ? "Checked In" : "Pending"}</span>
        {!disabled && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg overflow-hidden z-[50]"
          >
            <button
              onClick={() => {
                onSelect("pending");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors ${
                !isCheckedIn ? "bg-gray-50 text-black" : "text-[#6b7280] hover:bg-gray-50 hover:text-black"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                onSelect("checked_in");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors ${
                isCheckedIn ? "bg-gray-50 text-black" : "text-[#6b7280] hover:bg-gray-50 hover:text-black"
              }`}
            >
              Checked In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
