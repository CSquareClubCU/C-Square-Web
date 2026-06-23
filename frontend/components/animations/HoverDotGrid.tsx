"use client";

import { useState, useRef, useEffect } from "react";

export function HoverDotGrid() {
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base dim dot grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Glowing dot grid masked by mouse position */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          WebkitMaskImage: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
        }}
      />

      {/* Soft radial glow behind dots */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.04) 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
