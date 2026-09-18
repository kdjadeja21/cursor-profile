import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CursorProfile } from "@/lib/cursor-profile";
import { getCursorProfile, normalizeHandle } from "@/lib/cursor-profile";
import { buildStory, formatCompactNumber } from "@/lib/derive";
import type { HeadlineStat } from "@/components/profile/headline-marquee";
import { HeadlineMarquee } from "@/components/profile/headline-marquee";
import { HeroBand } from "@/components/profile/hero-band";
import { CodingConstellation } from "@/components/profile/coding-constellation";
import { Momentum } from "@/components/profile/momentum";
import { TokenStream } from "@/components/profile/token-stream";
import { AgentMix } from "@/components/profile/agent-mix";
import { Milestones } from "@/components/profile/milestones";
import { CelebrationBurst } from "@/components/profile/celebration-burst";
import { SharePanel } from "@/components/profile/share-panel";
import { JourneyScroller } from "@/components/profile/journey-scroller";
import { Section } from "@/components/profile/primitives/surfaces";
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

  const hasEarnedMilestone = story.milestones.some(
    (milestone) => milestone.earned,
  );

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
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-8">
      <JourneyScroller />
      <HeroBand profile={profile} joinedDaysAgo={story.joinedDaysAgo} />

      {story.celebration ? (
        <CelebrationBurst
          celebration={story.celebration}
          handle={profile.handle}
        />
      ) : null}

      <HeadlineMarquee stats={stats} />

      <Section
        id="constellation"
        eyebrow="Coding constellation"
        title="Every day, at a glance"
        description="Each cell is one day of token output, banded by quartile so a quiet day still reads differently from a heavy one."
      >
        <CodingConstellation calendar={story.calendar} />
      </Section>

      <Section
        id="momentum"
        eyebrow="Momentum"
        title="The run, and the record"
        description="Streaks count consecutive days with tracked activity."
      >
        <Momentum streak={story.streak} />
      </Section>

      <Section
        id="tokens"
        eyebrow="Token stream"
        title="Output over the last 30 days"
        description={
          story.tokenWindowTotal > 0
            ? "Drag or use the arrow keys to scrub through individual days."
            : "Nothing charted for this window yet."
        }
      >
        <TokenStream
          series={story.tokenWindow}
          total={story.tokenWindowTotal}
        />
      </Section>

      <Section
        id="agents"
        eyebrow="Agent mix"
        title="Local and cloud"
        description="Where the work actually ran."
      >
        <AgentMix agents={story.agents} />
      </Section>

      <Section
        id="milestones"
        eyebrow="Milestones"
        title={hasEarnedMilestone ? "Earned along the way" : "Still to come"}
        description={
          hasEarnedMilestone
            ? "Derived from the activity history — records, thresholds and peaks."
            : "Nothing unlocked yet. These are the first ones within reach."
        }
      >
        <Milestones milestones={story.milestones} />
      </Section>

      <Section
        id="share"
        eyebrow="Share"
        title="Send it to someone"
        description="The recap runs as a short story, and the link unfurls with a generated card."
      >
        <SharePanel
          cards={buildStoryCards(profile, story, activity.longestAgentSeconds)}
          displayName={profile.displayName}
          handle={profile.handle}
        />
      </Section>
    </main>
  );
}
