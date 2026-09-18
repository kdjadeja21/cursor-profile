"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { StoryCard } from "@/lib/story-cards";
import { MagneticButton } from "@/components/fx/magnetic";
import { SplitText } from "@/components/fx/split-text";
import { GsapFill } from "@/components/fx/gsap-fill";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

const CARD_MS = 4600;

export default function StoryMode({
  cards,
  displayName,
  shareUrl,
  onClose,
}: {
  cards: StoryCard[];
  displayName: string;
  shareUrl: string;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        const next = current + delta;
        if (next < 0) {
          return 0;
        }

        if (next >= cards.length) {
          return cards.length - 1;
        }

        return next;
      });
    },
    [cards.length],
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Auto-advance is the whole point of story mode, but it also removes the reader's
  // control, so it is off entirely when reduced motion is requested.
  useEffect(() => {
    if (reduced || isLast) {
      return;
    }

    const timer = setTimeout(() => go(1), CARD_MS);
    return () => clearTimeout(timer);
  }, [go, index, isLast, reduced]);

  useEffect(() => {
    const SWALLOWED = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"];

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        go(1);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      } else if (!SWALLOWED.includes(event.key)) {
        return;
      }

      // The scene director also listens on window; the story owns paging while open.
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [go, onClose]);

  useGSAP(
    () => {
      const dialog = dialogRef.current;
      if (!dialog || reduced !== false) {
        return;
      }

      gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    },
    { dependencies: [reduced] },
  );

  useGSAP(
    () => {
      const node = cardRef.current;
      if (!node || reduced !== false) {
        return;
      }

      const caption = node.querySelector("[data-story-caption]");
      const actions = node.querySelector("[data-story-actions]");

      gsap.fromTo(
        node,
        { opacity: 0, y: 36, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" },
      );

      if (caption) {
        gsap.fromTo(
          caption,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.55, ease: "expo.out" },
        );
      }

      if (actions) {
        gsap.fromTo(
          actions,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.85, ease: "expo.out" },
        );
      }
    },
    { dependencies: [card.id, reduced] },
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // Portaled to <body>: the scenes sit inside a transformed wrapper, which would
  // otherwise become the containing block and shrink this "fixed" overlay to a card.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} story recap`}
      tabIndex={-1}
      className="bg-surface/85 fixed inset-0 z-50 flex flex-col outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex gap-2" aria-hidden="true">
          {cards.map((entry, position) => {
            const ticking = position === index && reduced !== true && !isLast;

            return (
              <div
                key={entry.id}
                className="bg-edge h-1 flex-1 overflow-hidden rounded-full"
              >
                {ticking ? (
                  <GsapFill
                    play
                    duration={CARD_MS / 1000}
                    ease="none"
                    className="bg-accent h-full rounded-full shadow-[0_0_10px_var(--color-accent)]"
                  />
                ) : (
                  <div
                    className={cx(
                      "bg-accent h-full origin-left rounded-full shadow-[0_0_10px_var(--color-accent)]",
                      position <= index ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-ink-faint text-small tracking-[0.3em] uppercase">
            {displayName}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="glass text-ink-muted hover:text-ink focus-visible:ring-ink text-small rounded-full px-4 py-2 outline-none focus-visible:ring-2"
          >
            Close
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-visible">
          <div ref={cardRef} className="w-full overflow-visible text-center">
            <p className="text-accent text-small mb-8 tracking-[0.32em] uppercase">
              {card.eyebrow}
            </p>
            <p
              className={cx(
                "tabular overflow-visible font-extrabold",
                card.isFinale ? "text-hero" : "text-hero sm:text-giant",
              )}
            >
              <SplitText
                text={card.value}
                by={card.value.length > 12 ? "words" : "chars"}
                delay={0.15}
                stagger={0.045}
                unitClassName={card.isFinale ? "gradient-ink" : "gradient-accent"}
              />
            </p>
            <p
              data-story-caption=""
              className="text-ink-muted text-title mx-auto mt-10 max-w-2xl font-normal"
            >
              {card.caption}
            </p>

            {card.isFinale ? (
              <div
                data-story-actions=""
                className="mt-12 flex flex-wrap items-center justify-center gap-4"
              >
                <MagneticButton size="lg" onClick={copyLink}>
                  {copied ? "Link copied" : "Copy link"}
                </MagneticButton>
                <MagneticButton size="lg" variant="ghost" onClick={() => setIndex(0)}>
                  Replay
                </MagneticButton>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="text-ink-muted hover:text-ink focus-visible:ring-ink text-base rounded-full px-5 py-2 outline-none focus-visible:ring-2 disabled:opacity-30"
          >
            ← Back
          </button>
          <p className="text-ink-faint text-small tabular tracking-[0.2em]">
            {index + 1} / {cards.length}
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={isLast}
            className="text-ink-muted hover:text-ink focus-visible:ring-ink text-base rounded-full px-5 py-2 outline-none focus-visible:ring-2 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
