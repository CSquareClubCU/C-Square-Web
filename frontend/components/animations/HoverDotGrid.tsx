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
    let centerX = 0;
    let centerY = 0;

    // Particle settings
    const spacing = 32; // Spacing between dashes
    const dashLength = 8;
    const dashWidth = 2;
    const hoverRadius = 300;
    const maxRepel = 40; // How far they push away

    let particles: { baseX: number; baseY: number; angle: number; color: string; hoverColor: string }[] = [];

    // Mouse state
    let mouse = { x: -1000, y: -1000 };
    let targetMouse = { x: -1000, y: -1000 };

    const init = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      centerX = width / 2;
      centerY = height / 2;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      particles = [];

      // Create grid of dashes with organic jitter
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const jitterX = (Math.random() - 0.5) * spacing * 0.6;
          const jitterY = (Math.random() - 0.5) * spacing * 0.6;
          const baseX = x + jitterX;
          const baseY = y + jitterY;

          // Flow field angle: tangential to concentric circles around the center
          const dx = baseX - centerX;
          const dy = baseY - centerY;
          const angle = Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5) * 0.15;

          // Color based on X position to mimic the screenshot's gradient
          const hue = (baseX / width) * 360;
          const opacity = 0.3 + Math.random() * 0.4;
          const color = `hsla(${hue}, 80%, 65%, ${opacity})`;
          const hoverColor = `hsla(${hue}, 100%, 80%, 1)`;

          particles.push({ baseX, baseY, angle, color, hoverColor });
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
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    init();

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lerp mouse for buttery smooth animation
      mouse.x += (targetMouse.x - mouse.x) * 0.12;
      mouse.y += (targetMouse.y - mouse.y) * 0.12;

      for (const p of particles) {
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let drawX = p.baseX;
        let drawY = p.baseY;
        let drawAngle = p.angle;
        let isHovered = false;
        let easeFactor = 0;

        if (distance < hoverRadius) {
          isHovered = true;
          const factor = 1 - distance / hoverRadius;
          easeFactor = factor * factor; // ease-in

          // Repel effect (push away from cursor)
          if (distance > 0) {
            drawX -= (dx / distance) * (maxRepel * easeFactor);
            drawY -= (dy / distance) * (maxRepel * easeFactor);
          }

          // Slightly rotate based on repel force
          drawAngle += easeFactor * (Math.PI / 6);
        }

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(drawAngle);

        ctx.beginPath();
        ctx.moveTo(-dashLength / 2, 0);
        ctx.lineTo(dashLength / 2, 0);

        if (isHovered) {
          ctx.strokeStyle = p.hoverColor;
          ctx.lineWidth = dashWidth + (1.5 * easeFactor);
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = dashWidth;
        }

        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
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
