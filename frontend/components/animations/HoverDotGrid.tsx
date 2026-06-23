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

    const spacing = 28; // Clean grid spacing
    const hoverRadius = 380; // Spotlight size

    let dots: { 
      baseX: number; 
      baseY: number; 
      x: number; 
      y: number; 
      size: number;
      opacity: number;
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

      dots = [];
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({ 
            baseX: x, 
            baseY: y, 
            x: x, 
            y: y, 
            size: 4, // Base font size
            opacity: 0
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
    let startTime = performance.now();

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const elapsed = time - startTime;

      // Lerp mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.2;
      mouse.y += (targetMouse.y - mouse.y) * 0.2;

      for (const dot of dots) {
        const dx = dot.baseX - mouse.x;
        const dy = dot.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.baseX;
        let targetY = dot.baseY;
        let targetSize = 4; // Base font size
        let targetOpacity = 0; // Default invisible

        if (distance < hoverRadius) {
          // Wave calculations
          const wavelength = 120; // Distance between wave peaks
          const phase = elapsed * 0.004; // Speed of the rippling
          
          const wave = Math.cos(distance * (Math.PI * 2 / wavelength) - phase);
          const falloff = 1 - (distance / hoverRadius);
          const easeFalloff = falloff * falloff; 
          
          const intensity = ((wave + 1) / 2) * easeFalloff;

          // Wave peaks make the C² font much larger
          targetSize = 4 + (intensity * 18);
          
          // Wave peaks are darker
          targetOpacity = intensity * 0.8;

          // Wave displacement (pushes dots outward slightly on the wave peaks)
          const displacement = intensity * 10;
          if (distance > 0) {
            targetX = dot.baseX + (dx / distance) * displacement;
            targetY = dot.baseY + (dy / distance) * displacement;
          }
        }

        // Smooth physics lerping
        dot.x += (targetX - dot.x) * 0.35;
        dot.y += (targetY - dot.y) * 0.35;
        dot.size += (targetSize - dot.size) * 0.35;
        dot.opacity += (targetOpacity - dot.opacity) * 0.35;

        // Optimization: only draw if visible
        if (dot.opacity > 0.01) {
          ctx.fillStyle = `rgba(0, 0, 0, ${dot.opacity})`;
          ctx.font = `bold ${dot.size}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("C²", dot.x, dot.y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

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
      className="absolute inset-0 z-0 overflow-hidden bg-transparent pointer-events-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
