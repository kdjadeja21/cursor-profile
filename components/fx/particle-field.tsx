"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  hue: number;
};

const BURST_EVENT = "fx:burst";
const MAX_PARTICLES = 220;
const AMBIENT_TARGET = 70;

export type BurstOptions = {
  /** Viewport-relative origin, 0..1. Defaults to the centre. */
  x?: number;
  y?: number;
  count?: number;
  /** Multiplier on launch velocity. */
  power?: number;
};

/** Fire a one-shot spark burst from anywhere; no-op if no field is mounted. */
export function burstParticles(options: BurstOptions = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<BurstOptions>(BURST_EVENT, { detail: options }));
}

function spawnAmbient(width: number, height: number): Particle {
  const ttl = 6 + Math.random() * 7;
  return {
    x: Math.random() * width,
    y: height + 10 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 12,
    vy: -(18 + Math.random() * 26),
    life: 0,
    ttl,
    size: 0.8 + Math.random() * 1.8,
    hue: 18 + Math.random() * 20,
  };
}

function spawnBurst(
  originX: number,
  originY: number,
  power: number,
): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = (120 + Math.random() * 260) * power;
  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 40,
    life: 0,
    ttl: 0.9 + Math.random() * 1.1,
    size: 1.2 + Math.random() * 2.4,
    hue: 14 + Math.random() * 30,
  };
}

/**
 * Ember field on a single canvas. Capped particle count, pauses when the tab is hidden,
 * and skipped entirely under reduced motion. `burstParticles()` adds a spark shower.
 */
export function ParticleField({
  className,
  ambient = true,
}: {
  className?: string;
  ambient?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced !== false) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = performance.now();
    let hidden = document.hidden;
    const particles: Particle[] = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onBurst = (event: Event) => {
      const detail = (event as CustomEvent<BurstOptions>).detail ?? {};
      const count = Math.min(detail.count ?? 60, MAX_PARTICLES - particles.length);
      const originX = (detail.x ?? 0.5) * width;
      const originY = (detail.y ?? 0.5) * height;
      const power = detail.power ?? 1;

      for (let index = 0; index < count; index += 1) {
        particles.push(spawnBurst(originX, originY, power));
      }
    };

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (hidden) {
        return;
      }

      context.clearRect(0, 0, width, height);

      if (ambient && particles.length < AMBIENT_TARGET && Math.random() < 0.6) {
        particles.push(spawnAmbient(width, height));
      }

      context.globalCompositeOperation = "lighter";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life += dt;

        if (particle.life >= particle.ttl || particle.y < -20) {
          particles.splice(index, 1);
          continue;
        }

        // Burst sparks decelerate and fall; ambient embers just drift.
        const isBurst = particle.ttl < 3;
        if (isBurst) {
          particle.vx *= 1 - 2.4 * dt;
          particle.vy = particle.vy * (1 - 2.4 * dt) + 160 * dt;
        } else {
          particle.vx += Math.sin(now / 900 + particle.y * 0.01) * 6 * dt;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        const progress = particle.life / particle.ttl;
        const alpha = isBurst
          ? 1 - progress
          : Math.sin(progress * Math.PI) * 0.75;

        context.beginPath();
        context.fillStyle = `hsla(${particle.hue}, 100%, ${isBurst ? 68 : 60}%, ${alpha})`;
        context.shadowColor = `hsla(${particle.hue}, 100%, 60%, ${alpha})`;
        context.shadowBlur = isBurst ? 12 : 8;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";
    };

    const onVisibility = () => {
      hidden = document.hidden;
      last = performance.now();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener(BURST_EVENT, onBurst);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener(BURST_EVENT, onBurst);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ambient, reduced]);

  if (reduced) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full ${className ?? ""}`}
    />
  );
}
