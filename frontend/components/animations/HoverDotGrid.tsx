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

    const spacing = 32; // Spacing between dashes
    const dashLength = 8;
    const baseDashWidth = 1.5;
    const hoverRadius = 300;
    const repelForce = 40; // Max pixels to push away

    // Store actual properties and target properties for each dash
    let particles: { 
      baseX: number; 
      baseY: number; 
      baseAngle: number;
      baseOpacity: number;
      x: number; 
      y: number; 
      angle: number;
      opacity: number;
      width: number;
    }[] = [];

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
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const jitterX = (Math.random() - 0.5) * spacing * 0.6;
          const jitterY = (Math.random() - 0.5) * spacing * 0.6;
          const baseX = x + jitterX;
          const baseY = y + jitterY;

          // Flow field angle: tangential to concentric circles
          const dx = baseX - centerX;
          const dy = baseY - centerY;
          const baseAngle = Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5) * 0.15;
          const baseOpacity = 0.15 + Math.random() * 0.25;

          particles.push({ 
            baseX, 
            baseY, 
            baseAngle,
            baseOpacity,
            x: baseX, 
            y: baseY, 
            angle: baseAngle,
            opacity: baseOpacity,
            width: baseDashWidth
          });
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

      // Lerp mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.15;
      mouse.y += (targetMouse.y - mouse.y) * 0.15;

      for (const p of particles) {
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.baseX;
        let targetY = p.baseY;
        let targetAngle = p.baseAngle;
        let targetOpacity = p.baseOpacity;
        let targetWidth = baseDashWidth;

        if (distance < hoverRadius) {
          const factor = 1 - distance / hoverRadius;
          const easeFactor = factor * factor; // ease-in curve
          
          targetOpacity = p.baseOpacity + ((1 - p.baseOpacity) * easeFactor);
          targetWidth = baseDashWidth + (1.5 * easeFactor);

          // Repel from cursor
          if (distance > 0) {
            targetX = p.baseX - (dx / distance) * (repelForce * easeFactor);
            targetY = p.baseY - (dy / distance) * (repelForce * easeFactor);
          }
          
          // Rotate slightly when repelling for a dynamic twisting feel
          targetAngle = p.baseAngle + (easeFactor * Math.PI / 4);
        }

        // Lerp physical properties for buttery smoothness
        p.x += (targetX - p.x) * 0.15;
        p.y += (targetY - p.y) * 0.15;
        p.angle += (targetAngle - p.angle) * 0.15;
        p.opacity += (targetOpacity - p.opacity) * 0.15;
        p.width += (targetWidth - p.width) * 0.15;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.beginPath();
        ctx.moveTo(-dashLength / 2, 0);
        ctx.lineTo(dashLength / 2, 0);

        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.lineWidth = p.width;
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
