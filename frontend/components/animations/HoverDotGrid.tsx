"use client";

import { useEffect, useRef } from "react";

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

    // Grid settings
    const spacing = 24;
    const baseRadius = 1.2;
    const maxRadius = 3;
    const hoverRadius = 250;
    const maxPull = 12; // How many pixels the dot moves towards cursor

    let dots: { x: number; y: number; baseX: number; baseY: number }[] = [];

    // Mouse state
    let mouse = { x: -1000, y: -1000 };
    let targetMouse = { x: -1000, y: -1000 };

    const init = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      dots = [];
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse.x = e.clientX - rect.left;
      targetMouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetMouse.x = -1000;
      targetMouse.y = -1000;
    };

    window.addEventListener("resize", init);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    init();

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lerp mouse for buttery smooth animation
      mouse.x += (targetMouse.x - mouse.x) * 0.12;
      mouse.y += (targetMouse.y - mouse.y) * 0.12;

      for (const dot of dots) {
        const dx = mouse.x - dot.baseX;
        const dy = mouse.y - dot.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let currentRadius = baseRadius;
        let opacity = 0.15;
        let drawX = dot.baseX;
        let drawY = dot.baseY;

        if (distance < hoverRadius) {
          const factor = 1 - distance / hoverRadius; // 0 to 1
          const easeFactor = factor * factor; // ease-in

          currentRadius = baseRadius + (maxRadius - baseRadius) * easeFactor;
          opacity = 0.15 + 0.85 * easeFactor;

          // Pull effect
          if (distance > 0) {
            drawX += (dx / distance) * (maxPull * easeFactor);
            drawY += (dy / distance) * (maxPull * easeFactor);
          }
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      // Draw a soft ambient glow directly on canvas around the mouse
      if (mouse.x > -500 && mouse.x < width + 500 && mouse.y > -500 && mouse.y < height + 500) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          hoverRadius
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, hoverRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", init);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden bg-black"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
