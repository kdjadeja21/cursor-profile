export type SocialKind =
  | "x"
  | "github"
  | "linkedin"
  | "linktree"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "threads"
  | "bluesky"
  | "discord"
  | "twitch"
  | "reddit"
  | "medium"
  | "substack"
  | "dribbble"
  | "behance"
  | "telegram"
  | "gitlab"
  | "website";

export type SocialLink = {
  href: string;
  kind: SocialKind;
  label: string;
};

type Network = {
  kind: Exclude<SocialKind, "website">;
  /** Hosts and registrable domains (`uk.linkedin.com` matches `linkedin.com`). */
  domains: readonly string[];
  brand: string;
  /** First path segments that are routing, not the public handle. */
  skip?: readonly string[];
  mention?: boolean;
};

const NETWORKS: readonly Network[] = [
  {
    kind: "x",
    domains: ["x.com", "twitter.com", "mobile.twitter.com"],
    brand: "X",
    mention: true,
  },
  {
    kind: "github",
    domains: ["github.com"],
    brand: "GitHub",
  },
  {
    kind: "linkedin",
    domains: ["linkedin.com", "lnkd.in"],
    skip: ["in", "company", "school", "pub", "mwlite"],
    brand: "LinkedIn",
  },
  {
    kind: "linktree",
    domains: ["linktr.ee", "linktree.com"],
    brand: "Linktree",
  },
  {
    kind: "instagram",
    domains: ["instagram.com", "instagr.am"],
    skip: ["p", "reel", "reels", "stories", "explore"],
    brand: "Instagram",
    mention: true,
  },
  {
    kind: "youtube",
    domains: ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"],
    skip: ["c", "channel", "user", "watch", "shorts", "playlist", "live"],
    brand: "YouTube",
    mention: true,
  },
  {
    kind: "tiktok",
    domains: ["tiktok.com"],
    skip: ["video", "t", "tag", "music"],
    brand: "TikTok",
    mention: true,
  },
  {
    kind: "facebook",
    domains: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"],
    skip: ["profile.php", "pages", "watch", "share"],
    brand: "Facebook",
  },
  {
    kind: "threads",
    domains: ["threads.net", "threads.com"],
    brand: "Threads",
    mention: true,
  },
  {
    kind: "bluesky",
    domains: ["bsky.app", "bsky.social"],
    skip: ["profile"],
    brand: "Bluesky",
  },
  {
    kind: "discord",
    domains: ["discord.com", "discord.gg", "discordapp.com"],
    skip: ["users", "channels", "invite"],
    brand: "Discord",
  },
  {
    kind: "twitch",
    domains: ["twitch.tv"],
    skip: ["videos", "directory"],
    brand: "Twitch",
  },
  {
    kind: "reddit",
    domains: ["reddit.com"],
    skip: ["r", "u", "user", "comments"],
    brand: "Reddit",
  },
  {
    kind: "medium",
    domains: ["medium.com"],
    brand: "Medium",
  },
  {
    kind: "substack",
    domains: ["substack.com"],
    skip: ["p", "notes", "home"],
    brand: "Substack",
  },
  {
    kind: "dribbble",
    domains: ["dribbble.com"],
    skip: ["shots"],
    brand: "Dribbble",
  },
  {
    kind: "behance",
    domains: ["behance.net"],
    skip: ["gallery"],
    brand: "Behance",
  },
  {
    kind: "telegram",
    domains: ["t.me", "telegram.me", "telegram.org"],
    skip: ["s"],
    brand: "Telegram",
  },
  {
    kind: "gitlab",
    domains: ["gitlab.com"],
    brand: "GitLab",
  },
];

function pathSegments(pathname: string): string[] {
  return pathname.split("/").filter((part) => part.length > 0);
}

function hostnameOf(url: URL): string {
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function findNetwork(host: string): Network | null {
  return NETWORKS.find((network) => network.domains.some((domain) => hostMatches(host, domain))) ?? null;
}

function networkHandle(pathname: string, skip: readonly string[] = []): string | null {
  const parts = pathSegments(pathname);
  if (parts.length === 0) {
    return null;
  }

  const first = parts[0];
  if (skip.includes(first.toLowerCase())) {
    return parts[1] ?? null;
  }

  return first;
}

function formatLabel(handle: string | null, network: Network): string {
  if (!handle) {
    return network.brand;
  }

  const trimmed = handle.replace(/^@/, "");
  if (!trimmed) {
    return network.brand;
  }

  return network.mention ? `@${trimmed}` : trimmed;
}

/** Profiles often store `x.com/handle` with no scheme. Make that parseable. */
function toAbsoluteUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    // Keep going — many public profiles omit https://.
  }

  const withoutSlashes = trimmed.replace(/^\/\//, "");
  try {
    return new URL(`https://${withoutSlashes}`);
  } catch {
    return null;
  }
}

export function parseSocialLink(href: string): SocialLink {
  const url = toAbsoluteUrl(href);
  if (!url) {
    return { href, kind: "website", label: href };
  }

  const host = hostnameOf(url);
  const absolute = url.href;
  const network = findNetwork(host);

  if (!network) {
    return {
      href: absolute,
      kind: "website",
      label: host || href,
    };
  }

  return {
    href: absolute,
    kind: network.kind,
    label: formatLabel(networkHandle(url.pathname, network.skip), network),
  };
}

export function parseSocialLinks(hrefs: string[]): SocialLink[] {
  return hrefs.map(parseSocialLink);
}
