"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ProfileIdentity } from "@/lib/cursor-profile";
import type { Celebration } from "@/lib/derive";
import { SplitText } from "@/components/fx/split-text";
import { burstParticles } from "@/components/fx/particle-field";
import { CelebrationBurst } from "@/components/profile/celebration-burst";
import { SceneItem, useScene } from "@/components/profile/scene";
import { cx } from "@/lib/cx";

function badgeLabel(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function joinedLabel(days: number): string {
  if (days <= 0) {
    return "Joined today";
  }

  return days === 1
    ? "Joined yesterday"
    : `Joined ${days.toLocaleString("en-US")} days ago`;
}

function linkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Avatar({ profile }: { profile: ProfileIdentity }) {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-40 sm:w-40 lg:h-56 lg:w-56">
      {reduced ? null : (
        <>
          <span className="pulse-ring border-accent/40 absolute inset-0 rounded-full border" />
          <span
            className="pulse-ring border-accent/30 absolute inset-0 rounded-full border"
            style={{ animationDelay: "1.4s" }}
          />
        </>
      )}

      <div
        aria-hidden="true"
        className="orbit absolute inset-[-9%] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, var(--color-accent) 70deg, var(--color-ember) 120deg, #fff3e0 140deg, transparent 220deg)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px))",
          filter: "drop-shadow(0 0 10px var(--color-accent))",
        }}
      />
      <div
        aria-hidden="true"
        className="orbit-reverse absolute inset-[-18%] rounded-full opacity-80"
        style={{
          background:
            "conic-gradient(from 180deg, transparent 0deg, var(--color-accent-soft) 40deg, var(--color-ember) 70deg, transparent 130deg)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
        }}
      />

      <div className="shadow-glow-lg relative h-full w-full overflow-hidden rounded-full ring-1 ring-white/20">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            width={256}
            height={256}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="text-giant flex h-full w-full items-center justify-center font-bold"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, var(--color-ember), var(--color-accent) 45%, var(--color-accent-deep))",
            }}
          >
            <span className="text-surface text-hero font-extrabold">
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroScene({
  profile,
  joinedDaysAgo,
  celebration,
}: {
  profile: ProfileIdentity;
  joinedDaysAgo: number | null;
  celebration: Celebration | null;
}) {
  const { ready } = useScene();
  const reduced = useReducedMotion();
  const fired = useRef(false);

  useEffect(() => {
    if (!ready || reduced || fired.current) {
      return;
    }

    fired.current = true;
    const timer = setTimeout(() => {
      burstParticles({ x: 0.28, y: 0.5, count: 90, power: 1.1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [ready, reduced]);

  return (
    <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
      <SceneItem from="scale" delay={0.1} className="justify-self-center lg:justify-self-start">
        <Avatar profile={profile} />
      </SceneItem>

      <div className="min-w-0 text-center lg:text-left">
        <SceneItem delay={0.35}>
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {profile.badges.map((badge, index) => (
              <motion.span
                key={badge}
                initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                animate={ready ? { opacity: 1, scale: 1 } : undefined}
                transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.5 + index * 0.1 }}
                className="border-accent/50 bg-accent/15 text-accent text-small shadow-glow rounded-full border px-4 py-1.5 font-medium tracking-[0.18em] uppercase"
              >
                {badgeLabel(badge)}
              </motion.span>
            ))}
          </div>
        </SceneItem>

        <h1 className="text-hero drop-glow max-w-full font-bold">
          <SplitText
            text={profile.displayName}
            by="chars"
            start={ready}
            delay={0.55}
            unitClassName="gradient-ink"
            caret
          />
        </h1>

        <SceneItem delay={0.9}>
          <p className="text-heading text-ink-muted mt-4 font-medium">
            <span className="text-accent">@</span>
            {profile.handle}
          </p>
        </SceneItem>

        <SceneItem delay={1.1}>
          <div
            className={cx(
              "text-ink-faint text-lead mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start",
            )}
          >
            {joinedDaysAgo !== null ? <span>{joinedLabel(joinedDaysAgo)}</span> : null}
            {profile.links.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline-offset-6 transition-colors hover:underline"
              >
                {linkLabel(link)}
              </a>
            ))}
          </div>
        </SceneItem>

        {celebration ? (
          <CelebrationBurst celebration={celebration} handle={profile.handle} />
        ) : null}
      </div>
    </div>
  );
}
