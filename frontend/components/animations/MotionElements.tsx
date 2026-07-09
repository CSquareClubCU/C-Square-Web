"use client";

import { useEffect, useRef, ReactNode } from "react";
import { motion, useInView } from "framer-motion";

/* ─── Fade Up on Scroll ─── */
export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger Children ─── */
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Scale In ─── */
export function ScaleIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Slide In from Left or Right ─── */
export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === "left" ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── 3D Tilt Card ─── */
export function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Floating Animation ─── */
export function Float({
  children,
  className = "",
  duration = 4,
  distance = 12,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [-distance, distance, -distance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Counter Animation ─── */
export function AnimatedCounter({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && ref.current) {
      let animationFrameId: number;
      const end = value;
      const duration = 2000;
      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * end);
        if (ref.current) ref.current.textContent = current.toString();
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(tick);
        }
      };

      animationFrameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isInView, value]);

  return <span ref={ref} className={className}>0</span>;
}

/* ─── Marquee (Infinite Horizontal Scroll) ─── */
export function Marquee({
  children,
  className = "",
  speed = 30,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        <div aria-hidden="true" className="shrink-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Text Reveal (Per-Character Stagger) ─── */
export function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.04,
            delayChildren: delay,
          },
        },
      }}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-block mr-[0.3em]">
          {word.split("").map((char, ci) => (
            <motion.span
              key={ci}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}

/* ─── Glow Card (White Glow on Hover) ─── */
export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

/* ─── Orbit Ring ─── */
export function OrbitRing({
  className = "",
  size = 400,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`orbit-ring ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        className="w-full h-full"
      >
        <circle
          cx="200"
          cy="200"
          r="180"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="0.5"
          strokeDasharray="4 8"
        />
        <circle
          cx="200"
          cy="200"
          r="140"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="0.5"
          strokeDasharray="3 12"
        />
        {/* Orbiting dots */}
        <circle cx="200" cy="20" r="3" fill="rgba(255, 255, 255, 0.3)" />
        <circle cx="380" cy="200" r="2" fill="rgba(255, 255, 255, 0.2)" />
        <circle cx="60" cy="300" r="2.5" fill="rgba(255, 255, 255, 0.15)" />
      </svg>
    </div>
  );
}
