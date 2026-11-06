"use client";

import { useEffect, useRef } from "react";
import type { Rank } from "@/lib/types";

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

const RANK_ATMOSPHERE: Record<
  Rank,
  { count: number; speed: number; glow: number; drift: number }
> = {
  E: { count: 16, speed: 0.32, glow: 0, drift: 0.16 },
  D: { count: 28, speed: 0.46, glow: 6, drift: 0.28 },
  C: { count: 42, speed: 0.56, glow: 8, drift: 0.4 },
  B: { count: 54, speed: 0.72, glow: 11, drift: 0.55 },
  A: { count: 50, speed: 0.62, glow: 13, drift: 0.45 },
  S: { count: 66, speed: 0.88, glow: 12, drift: 0.7 },
};

function readTriplet(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string,
) {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function BattlefieldAtmosphere({ rank }: { rank: Rank }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const accent = readTriplet(styles, "--accent-rgb", "84 221 255");
    const accent2 = readTriplet(styles, "--accent2-rgb", "59 158 255");
    const ice = readTriplet(styles, "--ice-rgb", "220 246 255");
    const mist = readTriplet(styles, "--mist-rgb", "143 176 201");

    // Palette follows the active rank theme.
    const colors = [accent, accent2, ice, mist];

    const atmosphere = RANK_ATMOSPHERE[rank];
    const shadowColor = `rgb(${accent} / 0.7)`;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];

    for (let i = 0; i < atmosphere.count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.6,
        speedY:
          -(Math.random() * 0.7 + 0.25) * (atmosphere.speed / 0.56),
        speedX: (Math.random() - 0.5) * atmosphere.drift,
        alpha: Math.random() * 0.5 + 0.15,
        fadeSpeed:
          (Math.random() * 0.008 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
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
        const alpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = `rgb(${p.color} / ${alpha})`;
        if (atmosphere.glow > 0) {
          ctx.shadowBlur = atmosphere.glow;
          ctx.shadowColor = shadowColor;
        }
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
  }, [rank]);

  return (
    <div
      aria-hidden="true"
      data-rank={rank}
      className="battlefield-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Rank-reactive battlefield mist */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--accent2-a015),transparent)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[45vh] bg-gradient-to-t from-[var(--void-a04)] via-[var(--panel-a025)] to-transparent" />
      <div className="absolute top-1/4 -left-48 h-96 w-96 rounded-full bg-[var(--accent-a004)] blur-[100px]" />
      <div className="absolute bottom-1/3 -right-48 h-96 w-96 rounded-full bg-[var(--accent2-a006)] blur-[120px]" />

      {/* Floating mana embers */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85"
      />
    </div>
  );
}
