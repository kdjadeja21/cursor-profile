"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ProfileIdentity } from "@/lib/cursor-profile";
import type { ProfileStory } from "@/lib/derive";
import type { StoryCard } from "@/lib/story-cards";
import type { HeadlineStat } from "@/components/profile/headline-scene";
import { HeadlineScene } from "@/components/profile/headline-scene";
import { HeroScene } from "@/components/profile/hero-band";
import { CodingConstellation } from "@/components/profile/coding-constellation";
import { Momentum } from "@/components/profile/momentum";
import { TokenStream } from "@/components/profile/token-stream";
import { AgentMix } from "@/components/profile/agent-mix";
import { TopModels } from "@/components/profile/top-models";
import { Milestones } from "@/components/profile/milestones";
import { FinaleScene } from "@/components/profile/share-panel";
import { Scene, type SceneDefinition } from "@/components/profile/scene";
import { SceneRail, scrollToScene } from "@/components/profile/scene-rail";
import { SceneDirector } from "@/components/profile/scene-director";
import { ParticleField } from "@/components/fx/particle-field";
import { useMood } from "@/lib/use-mood";

type SceneSlot = SceneDefinition & {
  node: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
};

export function ProfileExperience({
  profile,
  story,
  stats,
  cards,
}: {
  profile: ProfileIdentity;
  story: ProfileStory;
  stats: HeadlineStat[];
  cards: StoryCard[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [readyMask, setReadyMask] = useState(1);
  const [paused, setPaused] = useState(false);
  useMood("profile");

  const hasEarnedMilestone = story.milestones.some((milestone) => milestone.earned);
  const hasModels = story.topModels.length > 0;

  const slots = useMemo<SceneSlot[]>(() => {
    const next: SceneSlot[] = [
      {
        id: "hero",
        label: "Hello",
        dwellMs: 5200,
        node: (
          <HeroScene
            profile={profile}
            joinedDaysAgo={story.joinedDaysAgo}
            celebration={story.celebration}
          />
        ),
      },
      {
        id: "numbers",
        label: "Numbers",
        dwellMs: 6200,
        eyebrow: "The headline",
        title: "By the numbers",
        align: "center",
        node: <HeadlineScene stats={stats} />,
      },
      {
        id: "constellation",
        label: "Calendar",
        dwellMs: 5600,
        eyebrow: "Coding constellation",
        title: "Every day, at a glance",
        description:
          "Each cell is one day of token output, banded by quartile so a quiet day still reads differently from a heavy one.",
        node: <CodingConstellation calendar={story.calendar} />,
      },
      {
        id: "momentum",
        label: "Streak",
        dwellMs: 5000,
        eyebrow: "Momentum",
        title: "The run, and the record",
        description: "Streaks count consecutive days with tracked activity.",
        node: <Momentum streak={story.streak} />,
      },
      {
        id: "tokens",
        label: "Tokens",
        dwellMs: 5600,
        eyebrow: "Token stream",
        title: "Output over the last 30 days",
        description:
          story.tokenWindowTotal > 0
            ? "Drag or use the arrow keys to scrub through individual days."
            : "Nothing charted for this window yet.",
        node: <TokenStream series={story.tokenWindow} total={story.tokenWindowTotal} />,
      },
      {
        id: "agents",
        label: "Agents",
        dwellMs: 5000,
        eyebrow: "Agent mix",
        title: "Local and cloud",
        description: "Where the work actually ran.",
        node: <AgentMix agents={story.agents} />,
      },
    ];

    if (hasModels) {
      next.push({
        id: "models",
        label: "Models",
        dwellMs: 5200,
        eyebrow: "Top models",
        title: "What did the work",
        description: "The models behind the agent runs, ranked by requests.",
        node: <TopModels models={story.topModels} />,
      });
    }

    next.push(
      {
        id: "milestones",
        label: "Milestones",
        dwellMs: 5600,
        eyebrow: "Milestones",
        title: hasEarnedMilestone ? "Earned along the way" : "Still to come",
        description: hasEarnedMilestone
          ? "Derived from the activity history — records, thresholds and peaks."
          : "Nothing unlocked yet. These are the first ones within reach.",
        node: <Milestones milestones={story.milestones} />,
      },
      {
        id: "share",
        label: "Share",
        dwellMs: 0,
        align: "center",
        node: (
          <FinaleScene
            cards={cards}
            displayName={profile.displayName}
            handle={profile.handle}
          />
        ),
      },
    );

    return next;
  }, [cards, hasEarnedMilestone, hasModels, profile, stats, story]);

  const scenes = useMemo(
    () => slots.map(({ id, label, dwellMs }) => ({ id, label, dwellMs })),
    [slots],
  );

  // Scroll snapping lives on <html>, which only this shell should ever switch on.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.scenes = "";
    return () => {
      delete root.dataset.scenes;
    };
  }, []);

  // The active scene is whichever midpoint sits closest to the viewport centre; a
  // scene becomes ready (and stays ready) once it has come within reach of it.
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const centre = window.innerHeight / 2;
      const reach = window.innerHeight * 0.3;
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      let arriving = 0;

      document
        .querySelectorAll<HTMLElement>("section[data-scene-index]")
        .forEach((section) => {
          const index = Number(section.dataset.sceneIndex);
          const rect = section.getBoundingClientRect();
          const distance = Math.abs((rect.top + rect.bottom) / 2 - centre);

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }

          if (rect.top < centre + reach && rect.bottom > centre - reach) {
            arriving |= 1 << index;
          }
        });

      setActiveIndex((current) => (current === nearest ? current : nearest));
      setReadyMask((current) => {
        const next = current | arriving | (1 << nearest);
        return next === current ? current : next;
      });
    };

    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [slots.length]);

  const jump = useCallback(
    (index: number) => {
      const scene = scenes[index];
      if (scene) {
        scrollToScene(scene.id);
      }
    },
    [scenes],
  );

  const jumpManually = useCallback(
    (index: number) => {
      setPaused(true);
      jump(index);
    },
    [jump],
  );

  return (
    <main className="relative">
      <ParticleField />
      <SceneRail scenes={scenes} activeIndex={activeIndex} onJump={jumpManually} />
      <SceneDirector
        scenes={scenes}
        activeIndex={activeIndex}
        paused={paused}
        onPausedChange={setPaused}
        onJump={jump}
      />

      {slots.map((slot, index) => (
        <Scene
          key={slot.id}
          id={slot.id}
          index={index}
          active={activeIndex === index}
          ready={(readyMask & (1 << index)) !== 0}
          eyebrow={slot.eyebrow}
          title={slot.title}
          description={slot.description}
          align={slot.align}
        >
          {slot.node}
        </Scene>
      ))}
    </main>
  );
}
