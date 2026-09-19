"use client";

import { useMemo } from "react";
import { buildStory } from "@/lib/derive";
import { buildHeadlineStats, buildStoryCards } from "@/lib/story-cards";
import { ProfileExperience } from "@/components/profile/profile-experience";
import type { SpotlightProfileSnapshot } from "@/lib/spotlight-lock";

/**
 * Renders the exact same scroll-through recap as `/@handle` — same scenes,
 * same headline stats, same share cards — driven by the profile snapshot
 * captured at claim time instead of a live fetch.
 */
export function PresentingExperience({
  profile,
}: {
  profile: SpotlightProfileSnapshot;
}) {
  const story = useMemo(
    () => buildStory(profile.activity, profile.profile.createdAt),
    [profile],
  );

  const stats = useMemo(
    () => buildHeadlineStats(profile.activity, story),
    [profile.activity, story],
  );

  const cards = useMemo(
    () => buildStoryCards(profile.profile, story, profile.activity.longestAgentSeconds),
    [profile, story],
  );

  return (
    <ProfileExperience profile={profile.profile} story={story} stats={stats} cards={cards} />
  );
}
