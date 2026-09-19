export type SocialKind = "x" | "github" | "website";

export type SocialLink = {
  href: string;
  kind: SocialKind;
  label: string;
};

function firstPathSegment(pathname: string): string | null {
  const segment = pathname.split("/").find((part) => part.length > 0);
  return segment ?? null;
}

function hostnameOf(url: URL): string {
  return url.hostname.replace(/^www\./, "").toLowerCase();
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
  const handle = firstPathSegment(url.pathname);
  const absolute = url.href;

  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    return {
      href: absolute,
      kind: "x",
      label: handle ? `@${handle}` : "X",
    };
  }

  if (host === "github.com") {
    return {
      href: absolute,
      kind: "github",
      label: handle ?? "GitHub",
    };
  }

  return {
    href: absolute,
    kind: "website",
    label: host || href,
  };
}

export function parseSocialLinks(hrefs: string[]): SocialLink[] {
  return hrefs.map(parseSocialLink);
}
