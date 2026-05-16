'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 40;
const SPAWN_THROTTLE_MS = 32;

/**
 * Subtle ember trail behind the cursor. Tiny gold sparks briefly follow the
 * mouse and rise upward like real embers before fading. Canvas-based so it
 * scales well even on long sessions.
 *
 * Skipped on touch devices and for users who prefer reduced motion. Sits at
 * a low z-index so it never blocks interaction or overlaps modal dialogs.
 */
export function EmberCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let lastSpawn = 0;
    let raf = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles = particles.filter((p) => {
        p.life += 16;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.05; // embers rise
        p.vx *= 0.97;

        const t = p.life / p.maxLife;
        if (t >= 1) return false;

        // Soft fade in-out curve
        const alpha = Math.sin(t * Math.PI) * 0.75;
        const r = p.size * (1 - t * 0.4);

        // Outer warm halo
        ctx.beginPath();
        ctx.fillStyle = `rgba(201, 165, 72, ${alpha * 0.22})`;
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core bright ember
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 220, 140, ${alpha})`;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawn < SPAWN_THROTTLE_MS) return;
      lastSpawn = now;

      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 8,
        y: e.clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.25 + (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 550 + Math.random() * 350,
        size: 0.8 + Math.random() * 1.2,
      });

      if (particles.length > MAX_PARTICLES) {
        particles.shift();
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
