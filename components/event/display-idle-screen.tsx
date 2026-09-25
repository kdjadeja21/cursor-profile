"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ParticleField } from "@/components/fx/particle-field";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { SplitText } from "@/components/fx/split-text";
import { useMood } from "@/lib/use-mood";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

const CYCLE_MS = 4200;

const BEATS = [
  {
    id: "stage",
    kicker: "On this screen",
    value: "60s",
    line: "Your year of building, full screen.",
  },
  {
    id: "room",
    kicker: "The whole room",
    value: "1",
    line: "One profile at a time.",
  },
  {
    id: "story",
    kicker: "What they see",
    value: "You",
    line: "Tokens, streaks, and the models you reach for.",
  },
] as const;

function OrbitRing({
  inset,
  reverse = false,
  gradient,
}: {
  inset: string;
  reverse?: boolean;
  gradient: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx("absolute rounded-full", reverse ? "orbit-reverse" : "orbit")}
      style={{
        inset,
        background: gradient,
        mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
        WebkitMask:
          "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
      }}
    />
  );
}

/**
 * Projector idle state. A teammate's phone is the way onto the stage, so this
 * screen stays a landing — no QR, no form — until a claim arrives.
 */
export function DisplayIdleScreen() {
  useMood("idle");
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const active = BEATS[beat] ?? BEATS[0];

  useEffect(() => {
    if (reduced !== false) {
      return;
    }

    const interval = setInterval(() => {
      setBeat((current) => (current + 1) % BEATS.length);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, [reduced]);

  return (
    <main className="relative flex min-h-0 flex-1 items-center overflow-x-clip overflow-y-auto px-6 py-6 sm:px-10 lg:px-16">
      <ParticleField />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="relative mx-auto aspect-square w-[min(42vmin,380px)]">
          <div
            aria-hidden="true"
            className="breathe absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_42%,transparent),transparent_68%)]"
          />
          {reduced === true ? null : (
            <>
              <span className="pulse-ring border-accent/35 absolute inset-[10%] rounded-full border" />
              <span
                className="pulse-ring border-ember/25 absolute inset-[10%] rounded-full border"
                style={{ animationDelay: "1.4s" }}
              />
              <OrbitRing
                inset="4%"
                gradient="conic-gradient(from 0deg, transparent 0deg, var(--color-accent) 70deg, var(--color-ember) 120deg, #fff3e0 140deg, transparent 220deg)"
              />
              <OrbitRing
                inset="-6%"
                reverse
                gradient="conic-gradient(from 180deg, transparent 0deg, var(--color-accent-soft) 40deg, var(--color-ember) 70deg, transparent 130deg)"
              />
            </>
          )}
          <span className="text-giant gradient-accent drop-glow absolute inset-0 flex items-center justify-center font-bold">
            @
          </span>
        </div>

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Image
            src="/cursor-lockup.svg"
            alt="Cursor"
            width={260}
            height={62}
            priority
            className="h-10 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-14"
          />

          <p className="text-accent text-micro mt-6 flex items-center gap-3 tracking-[0.32em] uppercase">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="bg-accent/70 absolute inline-flex h-full w-full animate-ping rounded-full" />
              <span className="bg-accent relative h-2.5 w-2.5 rounded-full" />
            </span>
            <SplitText text="Live profile spotlight" by="words" />
          </p>

          <h1 className="text-hero mt-4 max-w-[12ch] font-bold">
            <SplitText
              text="The stage is open"
              by="words"
              delay={0.15}
              unitClassName="gradient-ink"
              caret
            />
          </h1>

          <div className="mt-4 min-h-[1.5em] w-full max-w-xl" aria-live="polite">
            <GsapSwap id={active.id}>
              <p className="text-title text-ink font-semibold text-balance">{active.line}</p>
            </GsapSwap>
          </div>

          <p className="text-ink-muted text-lead mt-3 max-w-md text-balance">
            A Cursor teammate nearby has the phone. Hand them your username.
          </p>

          <ul className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3">
            {BEATS.map((item, index) => {
              const lit = reduced === false && index === beat;

              return (
                <li
                  key={item.id}
                  className={cx(
                    "glass rounded-2xl px-3 py-4 transition-[border-color,box-shadow] duration-700 sm:rounded-3xl sm:px-4",
                    lit && "border-accent/50 shadow-glow",
                  )}
                >
                  <p className="text-display text-ink font-bold tabular">{item.value}</p>
                  <p className="text-ink-faint text-micro mt-1 tracking-[0.18em] uppercase">
                    {item.kicker}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
