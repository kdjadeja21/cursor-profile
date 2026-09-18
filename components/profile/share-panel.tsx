"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { StoryCard } from "@/lib/story-cards";
import { GlassCard } from "@/components/profile/primitives/surfaces";

// Story mode is the exit moment, not the entry cost — it only loads when asked for.
const StoryMode = dynamic(() => import("@/components/profile/story-mode"), {
  ssr: false,
});

function MagneticButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerMove={
        reduced
          ? undefined
          : (event) => {
              const node = ref.current;
              if (!node) {
                return;
              }

              const bounds = node.getBoundingClientRect();
              const x = (event.clientX - (bounds.left + bounds.width / 2)) * 0.25;
              const y = (event.clientY - (bounds.top + bounds.height / 2)) * 0.35;
              node.style.transform = `translate(${x}px, ${y}px)`;
            }
      }
      onPointerLeave={() => {
        if (ref.current) {
          ref.current.style.transform = "";
        }
      }}
      className={
        variant === "primary"
          ? "bg-accent text-surface focus-visible:ring-ink text-base rounded-full px-6 py-3 transition-transform duration-200 outline-none focus-visible:ring-2"
          : "border-edge-strong text-ink-muted hover:text-ink focus-visible:ring-ink text-base rounded-full border px-6 py-3 transition-transform duration-200 outline-none focus-visible:ring-2"
      }
    >
      {children}
    </button>
  );
}

export function SharePanel({
  cards,
  displayName,
  handle,
}: {
  cards: StoryCard[];
  displayName: string;
  handle: string;
}) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window === "undefined" ? `/@${handle}` : window.location.href;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <GlassCard className="p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="from-accent/12 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-heading text-ink max-w-md">
              Worth sharing?
            </p>
            <p className="text-ink-muted text-small mt-2 max-w-md">
              Play the recap as a five-card story, or grab the link — it comes
              with a generated preview card.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <MagneticButton onClick={() => setStoryOpen(true)}>
              Play story
            </MagneticButton>
            <MagneticButton variant="ghost" onClick={copyLink}>
              {copied ? "Link copied" : "Copy link"}
            </MagneticButton>
          </div>
        </div>
      </GlassCard>

      {storyOpen ? (
        <StoryMode
          cards={cards}
          displayName={displayName}
          shareUrl={shareUrl}
          onClose={() => setStoryOpen(false)}
        />
      ) : null}
    </>
  );
}
