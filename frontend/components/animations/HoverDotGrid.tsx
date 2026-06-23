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

    const numParticles = 1200; // Dense organic scattering like Antigravity
    const hoverRadius = 250;
    const repelForce = 50; 

    // Store actual properties and target properties for each dash
    let particles: { 
      baseX: number; 
      baseY: number; 
      baseAngle: number;
      baseOpacity: number;
      baseLength: number;
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
      centerX = width / 2;
      centerY = height / 2;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const baseX = Math.random() * width;
        const baseY = Math.random() * height;

        // Angle pointing exactly away from center (starburst / hyperspace)
        const dx = baseX - centerX;
        const dy = baseY - centerY;
        const baseAngle = Math.atan2(dy, dx); 
        
        // Randomize length and opacity for depth effect
        const baseLength = 1 + Math.random() * 9; 
        const baseOpacity = 0.1 + Math.random() * 0.5;

        particles.push({ 
          baseX, 
          baseY, 
          baseAngle,
          baseOpacity,
          baseLength,
          x: baseX, 
          y: baseY, 
          angle: baseAngle,
          opacity: baseOpacity,
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
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.baseX;
        let targetY = p.baseY;
        let targetAngle = p.baseAngle;
        let targetOpacity = p.baseOpacity;
        let targetLength = p.baseLength;

        if (distance < hoverRadius) {
          const factor = 1 - distance / hoverRadius;
          const easeFactor = factor * factor; // ease-in curve
          
          targetOpacity = p.baseOpacity + ((1 - p.baseOpacity) * easeFactor);
          targetLength = p.baseLength + (6 * easeFactor);

          // Repel from cursor
          if (distance > 0) {
            targetX = p.baseX - (dx / distance) * (repelForce * easeFactor);
            targetY = p.baseY - (dy / distance) * (repelForce * easeFactor);
          }
          
          // Rotate slightly when dodging the mouse
          targetAngle = p.baseAngle + (easeFactor * Math.PI / 4);
        }

        // Lerp physical properties for buttery smoothness
        p.x += (targetX - p.x) * 0.15;
        p.y += (targetY - p.y) * 0.15;
        p.angle += (targetAngle - p.angle) * 0.15;
        p.opacity += (targetOpacity - p.opacity) * 0.15;
        p.length += (targetLength - p.length) * 0.15;

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
