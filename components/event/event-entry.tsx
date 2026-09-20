"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ParticleField } from "@/components/fx/particle-field";
import { SplitText } from "@/components/fx/split-text";
import { EntryForm } from "@/components/event/entry-form";
import { useSpotlightStatus } from "@/components/event/use-spotlight-status";
import { useMood } from "@/lib/use-mood";

function StatusCard({
  title,
  detail,
  secondsRemaining,
}: {
  title: string;
  detail: string;
  secondsRemaining: number;
}) {
  const [left, setLeft] = useState(secondsRemaining);

  useEffect(() => {
    const deadline = Date.now() + secondsRemaining * 1000;
    const interval = setInterval(() => {
      setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  return (
    <div
      role="status"
      className="glass border-accent/40 shadow-glow mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center"
    >
      <span aria-hidden="true" className="text-accent text-2xl">
        ✦
      </span>
      <h1 className="text-display text-accent font-bold text-balance">{title}</h1>
      <p className="text-ink-muted text-lead text-balance">{detail}</p>
      <p className="text-ink-faint text-base tabular">{left}s left</p>
    </div>
  );
}

export function EventEntry({ hasSurprise }: { hasSurprise: boolean }) {
  const { status, refresh } = useSpotlightStatus("entry");
  const [claimedByMe, setClaimedByMe] = useState<string | null>(null);
  const sawPresenting = useRef(false);

  useMood("idle");

  useEffect(() => {
    if (status.status === "presenting") {
      sawPresenting.current = true;
      return;
    }

    if (sawPresenting.current) {
      sawPresenting.current = false;
      setClaimedByMe(null);
    }
  }, [status]);

  const username = status.status === "presenting" ? status.username : claimedByMe;
  const occupied = username !== null;
  const mine =
    occupied &&
    claimedByMe !== null &&
    username.toLowerCase() === claimedByMe.toLowerCase();
  const secondsRemaining =
    status.status === "presenting" ? status.secondsRemaining : 60;

  return (
    <main
      data-keyboard-stack
      className="relative flex min-h-0 flex-1 flex-col items-center justify-safe-center overflow-x-clip overflow-y-auto px-4 py-12 text-center sm:px-6 sm:py-16"
    >
      <ParticleField />

      <div className="relative z-10 mb-10">
        <Image
          src="/cursor-lockup.svg"
          alt="Cursor"
          width={220}
          height={53}
          priority
          className="h-12 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-16"
        />
      </div>

      <p className="text-accent text-micro relative z-10 mb-5 tracking-[0.32em] uppercase">
        <SplitText text="Live Profile Spotlight" by="words" delay={0.3} />
      </p>

      {occupied && username ? (
        <div className="relative z-10 mt-4 w-full">
          <StatusCard
            key={username}
            title={mine ? "You're up!" : "Someone's up right now"}
            detail={
              mine
                ? `@${username} is live on the main screen`
                : `@${username} is on the main screen — try again in a bit`
            }
            secondsRemaining={secondsRemaining}
          />
        </div>
      ) : (
        <>
          <h1 className="text-hero relative z-10 max-w-[16ch] overflow-visible font-bold sm:max-w-none">
            <SplitText
              text="Take the main screen"
              by="words"
              delay={0.45}
              unitClassName="gradient-ink"
              caret
            />
          </h1>

          <p className="text-ink-muted text-lead relative z-10 mt-4 max-w-lg">
            Enter your Cursor username to get spotlighted for 60 seconds — only one
            person can be up at a time.
          </p>

          <div className="relative z-10 mt-10 w-full max-w-2xl">
            <EntryForm
              hasSurprise={hasSurprise}
              onClaimed={setClaimedByMe}
              onSettled={() => {
                void refresh();
              }}
            />
          </div>
        </>
      )}
    </main>
  );
}
