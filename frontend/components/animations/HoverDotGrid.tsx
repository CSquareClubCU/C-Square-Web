"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  depth: number; // 0 = far background, 1 = foreground
  color: string;
}

export function HoverDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // --- Configuration ---
    const PARTICLE_COUNT = 160;
    const GRAVITY = -0.04; // Negative = antigravity (float upward)
    const FRICTION = 0.995;
    const MOUSE_RADIUS = 180;
    const MOUSE_FORCE = 3.5;
    const SPEED_FACTOR = 0.7;

    // Monochrome palette with subtle variety — matches the site's aesthetic
    const COLORS = [
      "rgba(0, 0, 0,",       // Black
      "rgba(60, 60, 60,",    // Dark gray
      "rgba(100, 100, 100,", // Medium gray
      "rgba(140, 140, 140,", // Light gray
      "rgba(40, 40, 50,",    // Near-black blue tint
      "rgba(80, 80, 90,",    // Subtle blue-gray
    ];

    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999 };

    const createParticle = (randomY: boolean = true): Particle => {
      const depth = Math.random(); // 0 = far, 1 = near
      const baseSize = 2 + depth * 6; // Far particles are small, near are larger
      const size = baseSize + Math.random() * 3;

      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + size + Math.random() * 40,
        vx: (Math.random() - 0.5) * SPEED_FACTOR,
        vy: (Math.random() - 0.5) * SPEED_FACTOR * 0.5,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 0.12 + depth * 0.45, // Far = faint, near = visible
        depth,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    };

    const init = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle(true));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    init();

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // --- Anti-gravity (float upward) ---
        // Depth affects speed: near particles float faster
        const depthSpeed = 0.3 + p.depth * 0.7;
        p.vy += GRAVITY * depthSpeed;

        // --- Mouse repulsion ---
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const mouseR = MOUSE_RADIUS;

        if (distSq < mouseR * mouseR && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / mouseR) * MOUSE_FORCE;
          const nx = dx / dist;
          const ny = dy / dist;
          p.vx += nx * force;
          p.vy += ny * force;
        }

        // --- Physics ---
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // Gentle rotation
        p.rotation += p.rotationSpeed;

        // --- Wrapping / Respawning ---
        // If particle drifts off top, respawn from bottom
        if (p.y < -p.size * 2) {
          particles[i] = createParticle(false);
          particles[i].y = height + particles[i].size + Math.random() * 20;
        }
        // If it drifts off bottom (rare, from mouse push), wrap to top
        if (p.y > height + p.size * 2) {
          p.y = -p.size;
        }
        // Horizontal wrapping
        if (p.x < -p.size * 2) p.x = width + p.size;
        if (p.x > width + p.size * 2) p.x = -p.size;

        // --- Draw square with rotation ---
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `${p.color} ${p.opacity})`;
        const half = p.size / 2;
        ctx.fillRect(-half, -half, p.size, p.size);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden bg-transparent pointer-events-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
