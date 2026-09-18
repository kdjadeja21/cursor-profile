import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CursorProfile } from "@/lib/cursor-profile";
import { getCursorProfile, normalizeHandle } from "@/lib/cursor-profile";
import { buildStory, formatCompactNumber } from "@/lib/derive";
import type { HeadlineStat } from "@/components/profile/headline-scene";
import { ProfileExperience } from "@/components/profile/profile-experience";
import { buildStoryCards } from "@/lib/story-cards";

/** Only `/@handle` is a profile; anything else is a genuine 404. */
function resolveHandle(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (!decoded.startsWith("@") || decoded.length < 2) {
    notFound();
  }

  return normalizeHandle(decoded);
}

async function loadProfile(segment: string): Promise<CursorProfile> {
  const result = await getCursorProfile(resolveHandle(segment));

  if (!result.ok) {
    if (result.reason === "not-found") {
      notFound();
    }

    throw new Error("Failed to load the profile.");
  }

  return { profile: result.profile, activity: result.activity };
}

export async function generateMetadata({
  params,
}: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const { profile, activity } = await loadProfile(handle);
  const story = buildStory(activity, profile.createdAt);

  const title = `${profile.displayName} (@${profile.handle}) · Cursor`;
  const description = `${formatCompactNumber(story.calendar.totalTokens)} tokens, ${story.agents.total} agents and a ${story.streak.longest}-day streak.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  const { profile, activity } = await loadProfile(handle);
  const story = buildStory(activity, profile.createdAt);

  const stats: HeadlineStat[] = [
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

  return (
    <ProfileExperience
      profile={profile}
      story={story}
      stats={stats}
      cards={buildStoryCards(profile, story, activity.longestAgentSeconds)}
    />
  );
}
