import type { ProfileActivity, ProfileIdentity } from "@/lib/cursor-profile";
import type { ProfileStory } from "@/lib/derive";
import {
  formatCompactNumber,
  formatDayLabel,
  formatDuration,
} from "@/lib/derive";
import type { HeadlineStat } from "@/components/profile/headline-scene";

export type StoryCard = {
  id: string;
  eyebrow: string;
  value: string;
  caption: string;
  /** The closing card carries the share actions instead of a plain stat. */
  isFinale?: boolean;
};

/**
 * Shared with `app/[handle]/page.tsx` and the event display's "presenting" view so
 * the two never drift out of sync.
 */
export function buildHeadlineStats(
  activity: ProfileActivity,
  story: ProfileStory,
): HeadlineStat[] {
  return [
    {
      id: "tokens",
      label: "Tokens generated",
      amount: story.calendar.totalTokens,
      kind: "compact",
      detail: story.hasActivity
        ? `Across ${story.calendar.trackedDays} days of tracked history`
        : "Nothing tracked yet",
      emphasis: true,
    },
    {
      id: "agents",
      label: "Agents run",
      amount: story.agents.total,
      kind: "integer",
      detail: `${story.agents.local} local · ${story.agents.cloud} cloud`,
    },
    {
      id: "longest-agent",
      label: "Longest agent",
      amount: activity.longestAgentSeconds,
      kind: "duration",
      detail: "Single uninterrupted session",
    },
  ];
}

export function buildStoryCards(
  profile: ProfileIdentity,
  story: ProfileStory,
  longestAgentSeconds: number,
): StoryCard[] {
  const cards: StoryCard[] = [
    {
      id: "tokens",
      eyebrow: "Tokens generated",
      value: formatCompactNumber(story.calendar.totalTokens),
      caption: `Across ${story.calendar.trackedDays} days of tracked history.`,
    },
    {
      id: "consistency",
      eyebrow: "Days shipped",
      value: `${story.calendar.activeDays}`,
      caption: `${Math.round((story.calendar.activeDays / Math.max(story.calendar.trackedDays, 1)) * 100)}% of every tracked day had activity.`,
    },
  ];

  if (story.calendar.busiestDay) {
    cards.push({
      id: "best-day",
      eyebrow: "Biggest day",
      value: formatCompactNumber(story.calendar.busiestDay.tokens),
      caption: `Peak output landed on ${formatDayLabel(story.calendar.busiestDay.date)}.`,
    });
  }

  cards.push({
    id: "streak",
    eyebrow: "Longest streak",
    value: `${story.streak.longest} days`,
    caption:
      story.streak.current > 0
        ? `The current run is at ${story.streak.current}.`
        : "Waiting on the next run.",
  });

  cards.push({
    id: "agents",
    eyebrow: "Agents run",
    value: formatCompactNumber(story.agents.total),
    caption: `${formatCompactNumber(story.agents.local)} local and ${formatCompactNumber(story.agents.cloud)} cloud, with a longest session of ${formatDuration(longestAgentSeconds)}.`,
  });

  const leadModel = story.topModels[0];
  if (leadModel) {
    cards.push({
      id: "models",
      eyebrow: "Top model",
      value: leadModel.name,
      caption: `${leadModel.agentRequests} agent ${leadModel.agentRequests === 1 ? "request" : "requests"}${leadModel.vendor ? ` · ${leadModel.vendor}` : ""}.`,
    });
  }

  cards.push({
    id: "finale",
    eyebrow: "That's the year so far",
    value: `@${profile.handle}`,
    caption: "Share it, or scroll back through the detail.",
    isFinale: true,
  });

  return cards;
}
