"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { StoryCard } from "@/lib/story-cards";
import { MagneticButton } from "@/components/fx/magnetic";
import { SplitText } from "@/components/fx/split-text";
import { burstParticles } from "@/components/fx/particle-field";
import { SceneItem, useScene } from "@/components/profile/scene";

// Story mode is the exit moment, not the entry cost — it only loads when asked for.
const StoryMode = dynamic(() => import("@/components/profile/story-mode"), {
  ssr: false,
});

export function FinaleScene({
  cards,
  displayName,
  handle,
}: {
  cards: StoryCard[];
  displayName: string;
  handle: string;
}) {
  const { ready } = useScene();
  const reduced = useReducedMotion();
  const [storyOpen, setStoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (!ready || reduced || fired.current) {
      return;
    }

    fired.current = true;
    const timer = setTimeout(() => {
      burstParticles({ x: 0.5, y: 0.42, count: 140, power: 1.4 });
    }, 700);
    return () => clearTimeout(timer);
  }, [ready, reduced]);

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
      <div className="flex flex-col items-center text-center">
        <SceneItem delay={0.1}>
          <p className="text-accent text-small mb-6 tracking-[0.32em] uppercase">
            That&rsquo;s the year so far
          </p>
        </SceneItem>

        <h2 className="text-hero drop-glow max-w-full font-bold">
          <SplitText
            text={`@${handle}`}
            by="chars"
            start={ready}
            delay={0.3}
            unitClassName="gradient-accent"
            caret
          />
        </h2>

        <SceneItem delay={1}>
          <p className="text-ink-muted text-lead mt-8 max-w-xl">
            Play the recap as a short story, grab the link with its generated
            preview card, or hand the screen to the next person.
          </p>
        </SceneItem>

        <SceneItem delay={1.25} from="scale">
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-4">
            <MagneticButton size="lg" onClick={() => setStoryOpen(true)}>
              Play story
              <span aria-hidden="true">▶</span>
            </MagneticButton>
            <MagneticButton size="lg" variant="ghost" onClick={copyLink}>
              {copied ? "Link copied" : "Copy link"}
            </MagneticButton>
          </div>
        </SceneItem>

        <SceneItem delay={1.6}>
          <Link
            href="/"
            className="text-ink-faint hover:text-ink focus-visible:ring-ink text-base mt-14 inline-flex items-center gap-2 rounded-full px-4 py-2 underline-offset-6 transition-colors outline-none hover:underline focus-visible:ring-2"
          >
            <span aria-hidden="true">←</span>
            Look up another profile
          </Link>
        </SceneItem>
      </div>

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
