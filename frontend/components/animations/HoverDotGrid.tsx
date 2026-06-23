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

    const numParticles = 2000; // High density for the spotlight
    const hoverRadius = 350; // Spotlight size
    const repelForce = 30;

    // Store properties for each dash
    let particles: { 
      baseX: number; 
      baseY: number; 
      baseLength: number;
      maxOpacity: number;
      x: number; 
      y: number; 
      angle: number;
      opacity: number;
      length: number;
    }[] = [];

    let mouse = { x: -1000, y: -1000 };
    let targetMouse = { x: -1000, y: -1000 };

    const init = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const baseX = Math.random() * width;
        const baseY = Math.random() * height;

        const baseLength = 1 + Math.random() * 4; 
        const maxOpacity = 0.3 + Math.random() * 0.7;

        particles.push({ 
          baseX, 
          baseY, 
          baseLength,
          maxOpacity,
          x: baseX, 
          y: baseY, 
          angle: 0,
          opacity: 0,
          length: baseLength
        });
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
        const dx = p.baseX - mouse.x;
        const dy = p.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.baseX;
        let targetY = p.baseY;
        let targetOpacity = 0;
        let targetLength = p.baseLength;
        let targetAngle = p.angle;

        if (distance < hoverRadius) {
          // Angle points outward from the cursor
          targetAngle = Math.atan2(dy, dx);
          
          const factor = 1 - distance / hoverRadius;
          const easeFactor = factor * factor; 
          
          // Fade in near the cursor
          targetOpacity = p.maxOpacity * easeFactor;

          // 3D effect: lines stretch as they get further from the cursor center
          // At distance 0, they are dots. At the edges, they stretch into streaks.
          const perspectiveStretch = (distance / hoverRadius) * 15;
          targetLength = p.baseLength + perspectiveStretch;

          // Repel from cursor slightly for dynamic movement
          if (distance > 0) {
            targetX = p.baseX + (dx / distance) * (repelForce * easeFactor);
            targetY = p.baseY + (dy / distance) * (repelForce * easeFactor);
          }
        }

        // Fast lerp for snappy but smooth updates
        p.x += (targetX - p.x) * 0.2;
        p.y += (targetY - p.y) * 0.2;
        
        // Handle angle lerp carefully around PI boundaries to prevent spinning
        let angleDiff = targetAngle - p.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        p.angle += angleDiff * 0.2;

        p.opacity += (targetOpacity - p.opacity) * 0.2;
        p.length += (targetLength - p.length) * 0.2;

        // Optimization: only draw if visible
        if (p.opacity > 0.01) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          ctx.beginPath();
          ctx.moveTo(-p.length / 2, 0);
          ctx.lineTo(p.length / 2, 0);

          ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.stroke();

          ctx.restore();
        }
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
      className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
