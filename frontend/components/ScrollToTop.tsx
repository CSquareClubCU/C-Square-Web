"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to the very top smoothly whenever the route changes
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Also handle page reloads (on mount)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return null;
}
