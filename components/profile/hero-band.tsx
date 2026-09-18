import type { ProfileIdentity } from "@/lib/cursor-profile";
import { Entrance } from "@/components/profile/primitives/entrance";
import { Spotlight } from "@/components/profile/primitives/spotlight";
import { TypingText } from "@/components/profile/primitives/typing-text";

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

export function HeroBand({
  profile,
  joinedDaysAgo,
}: {
  profile: ProfileIdentity;
  joinedDaysAgo: number | null;
}) {
  return (
    <Spotlight className="pt-16 pb-8 sm:pt-24">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Entrance delay={0.05} className="shrink-0">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              width={96}
              height={96}
              className="ring-edge-strong h-24 w-24 rounded-full object-cover ring-1"
            />
          ) : (
            <div
              aria-hidden="true"
              className="from-accent/25 ring-edge-strong text-display text-ink flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br to-transparent ring-1"
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Entrance>

        <div className="min-w-0">
          <Entrance delay={0.14}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="border-accent/40 bg-accent/10 text-accent text-micro rounded-full border px-3 py-1 tracking-[0.12em] uppercase"
                >
                  {badgeLabel(badge)}
                </span>
              ))}
            </div>
          </Entrance>

          <h1 className="text-display sm:text-hero text-ink">
            <TypingText text={profile.displayName} />
          </h1>

          <Entrance delay={0.3}>
            <p className="text-ink-muted text-lead mt-2">@{profile.handle}</p>
          </Entrance>

          <Entrance delay={0.42}>
            <div className="text-ink-faint text-small mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {joinedDaysAgo !== null ? <span>{joinedLabel(joinedDaysAgo)}</span> : null}
              {profile.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent underline-offset-4 transition-colors hover:underline"
                >
                  {linkLabel(link)}
                </a>
              ))}
            </div>
          </Entrance>
        </div>
      </div>
    </Spotlight>
  );
}
