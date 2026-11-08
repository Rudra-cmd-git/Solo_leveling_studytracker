"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  fadeSpeed: number;
  color: string;
}

export function BattlefieldAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Solo Leveling Mana Colors: Cyan, Ice Blue, Monarch Purple, Shadow Blue
    const colors = [
      "rgba(84, 221, 255,",   // Cyan Mana
      "rgba(59, 158, 255,",   // System Blue
      "rgba(138, 92, 246,",   // Monarch Purple
      "rgba(220, 246, 255,",  // Ice White
    ];

    const particleCount = 45;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.6,
        speedY: -(Math.random() * 0.7 + 0.25),
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        fadeSpeed: (Math.random() * 0.008 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.y += p.speedY;
        p.x += p.speedX;
        p.alpha += p.fadeSpeed;

        if (p.alpha <= 0.1 || p.alpha >= 0.8) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Reset if drifted past top or off sides
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, Math.min(1, p.alpha))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(84, 221, 255, 0.75)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Deep Shadow Monarch Battlefield Mist */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,158,255,0.15),rgba(2,5,11,0))]" />
      <div className="absolute bottom-0 left-0 right-0 h-[45vh] bg-gradient-to-t from-[rgba(16,7,32,0.45)] via-[rgba(3,10,20,0.25)] to-transparent" />
      <div className="absolute top-1/4 -left-48 h-96 w-96 rounded-full bg-[rgba(84,221,255,0.04)] blur-[100px]" />
      <div className="absolute bottom-1/3 -right-48 h-96 w-96 rounded-full bg-[rgba(138,92,246,0.06)] blur-[120px]" />

      {/* Floating Mana Ember Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85"
      />
    </div>
  );
}
