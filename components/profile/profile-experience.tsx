"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Milestones } from "@/components/profile/milestones";
import { FinaleScene } from "@/components/profile/share-panel";
import { Scene, type SceneDefinition } from "@/components/profile/scene";
import { SceneRail, scrollToScene } from "@/components/profile/scene-rail";
import { SceneDirector } from "@/components/profile/scene-director";
import { ParticleField } from "@/components/fx/particle-field";
import { useMood } from "@/lib/use-mood";

const SCENES: SceneDefinition[] = [
  { id: "hero", label: "Hello", dwellMs: 5200 },
  { id: "numbers", label: "Numbers", dwellMs: 6200 },
  { id: "constellation", label: "Calendar", dwellMs: 5600 },
  { id: "momentum", label: "Streak", dwellMs: 5000 },
  { id: "tokens", label: "Tokens", dwellMs: 5600 },
  { id: "agents", label: "Agents", dwellMs: 5000 },
  { id: "milestones", label: "Milestones", dwellMs: 5600 },
  { id: "share", label: "Share", dwellMs: 0 },
];

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
  const [paused, setPaused] = useState(false);
  useMood("profile");

  // Scroll snapping lives on <html>, which only this shell should ever switch on.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.scenes = "";
    return () => {
      delete root.dataset.scenes;
    };
  }, []);

  const jump = useCallback((index: number) => {
    const scene = SCENES[index];
    if (scene) {
      scrollToScene(scene.id);
    }
  }, []);

  // Picking a stop on the rail is the visitor taking the wheel.
  const jumpManually = useCallback(
    (index: number) => {
      setPaused(true);
      jump(index);
    },
    [jump],
  );

  const hasEarnedMilestone = story.milestones.some((milestone) => milestone.earned);

  return (
    <main className="relative">
      <ParticleField />
      <SceneRail scenes={SCENES} activeIndex={activeIndex} onJump={jumpManually} />
      <SceneDirector
        scenes={SCENES}
        activeIndex={activeIndex}
        paused={paused}
        onPausedChange={setPaused}
        onJump={jump}
      />

      <Scene id="hero" index={0} onActive={setActiveIndex}>
        <HeroScene
          profile={profile}
          joinedDaysAgo={story.joinedDaysAgo}
          celebration={story.celebration}
        />
      </Scene>

      <Scene
        id="numbers"
        index={1}
        onActive={setActiveIndex}
        eyebrow="The headline"
        title="By the numbers"
        align="center"
      >
        <HeadlineScene stats={stats} />
      </Scene>

      <Scene
        id="constellation"
        index={2}
        onActive={setActiveIndex}
        eyebrow="Coding constellation"
        title="Every day, at a glance"
        description="Each cell is one day of token output, banded by quartile so a quiet day still reads differently from a heavy one."
      >
        <CodingConstellation calendar={story.calendar} />
      </Scene>

      <Scene
        id="momentum"
        index={3}
        onActive={setActiveIndex}
        eyebrow="Momentum"
        title="The run, and the record"
        description="Streaks count consecutive days with tracked activity."
      >
        <Momentum streak={story.streak} />
      </Scene>

      <Scene
        id="tokens"
        index={4}
        onActive={setActiveIndex}
        eyebrow="Token stream"
        title="Output over the last 30 days"
        description={
          story.tokenWindowTotal > 0
            ? "Drag or use the arrow keys to scrub through individual days."
            : "Nothing charted for this window yet."
        }
      >
        <TokenStream series={story.tokenWindow} total={story.tokenWindowTotal} />
      </Scene>

      <Scene
        id="agents"
        index={5}
        onActive={setActiveIndex}
        eyebrow="Agent mix"
        title="Local and cloud"
        description="Where the work actually ran."
      >
        <AgentMix agents={story.agents} />
      </Scene>

      <Scene
        id="milestones"
        index={6}
        onActive={setActiveIndex}
        eyebrow="Milestones"
        title={hasEarnedMilestone ? "Earned along the way" : "Still to come"}
        description={
          hasEarnedMilestone
            ? "Derived from the activity history — records, thresholds and peaks."
            : "Nothing unlocked yet. These are the first ones within reach."
        }
      >
        <Milestones milestones={story.milestones} />
      </Scene>

      <Scene id="share" index={7} onActive={setActiveIndex} align="center">
        <FinaleScene
          cards={cards}
          displayName={profile.displayName}
          handle={profile.handle}
        />
      </Scene>
    </main>
  );
}
