"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { StoryCard } from "@/lib/story-cards";
import { cx } from "@/lib/cx";

const CARD_MS = 4200;

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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        go(1);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} story recap`}
      tabIndex={-1}
      className="bg-surface/95 fixed inset-0 z-50 flex flex-col backdrop-blur-xl outline-none"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
        <div className="flex gap-1.5" aria-hidden="true">
          {cards.map((entry, position) => {
            // The active bar fills across the card's own dwell time, so the bar doubles
            // as the countdown to the next card.
            const ticking = position === index && !reduced && !isLast;

            return (
              <div
                key={entry.id}
                className="bg-edge h-1 flex-1 overflow-hidden rounded-full"
              >
                <div
                  className={cx(
                    "bg-accent h-full origin-left rounded-full",
                    ticking && "animate-[progress-fill_linear_forwards]",
                    !ticking && (position <= index ? "scale-x-100" : "scale-x-0"),
                  )}
                  style={ticking ? { animationDuration: `${CARD_MS}ms` } : undefined}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-ink-faint text-micro tracking-[0.22em] uppercase">
            {displayName}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink focus-visible:ring-ink text-small rounded-full px-3 py-1 outline-none focus-visible:ring-2"
          >
            Close
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              <p className="text-ink-faint text-micro mb-6 tracking-[0.22em] uppercase">
                {card.eyebrow}
              </p>
              <p
                className={cx(
                  "tabular",
                  card.isFinale
                    ? "text-display text-ink"
                    : "text-hero text-accent",
                )}
              >
                {card.value}
              </p>
              <p className="text-ink-muted text-lead mx-auto mt-6 max-w-md">
                {card.caption}
              </p>

              {card.isFinale ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="bg-accent text-surface focus-visible:ring-ink text-small rounded-full px-5 py-2.5 transition-transform outline-none hover:scale-[1.03] focus-visible:ring-2"
                  >
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex(0)}
                    className="border-edge-strong text-ink-muted hover:text-ink focus-visible:ring-ink text-small rounded-full border px-5 py-2.5 outline-none focus-visible:ring-2"
                  >
                    Replay
                  </button>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="text-ink-muted hover:text-ink focus-visible:ring-ink text-small rounded-full px-4 py-2 outline-none focus-visible:ring-2 disabled:opacity-30"
          >
            Back
          </button>
          <p className="text-ink-faint text-micro tabular">
            {index + 1} / {cards.length}
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={isLast}
            className="text-ink-muted hover:text-ink focus-visible:ring-ink text-small rounded-full px-4 py-2 outline-none focus-visible:ring-2 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
