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

export function parseSocialLink(href: string): SocialLink {
  try {
    const url = new URL(href);
    const host = hostnameOf(url);
    const handle = firstPathSegment(url.pathname);

    if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
      return {
        href,
        kind: "x",
        label: handle ? `@${handle}` : "X",
      };
    }

    if (host === "github.com") {
      return {
        href,
        kind: "github",
        label: handle ?? "GitHub",
      };
    }

    return {
      href,
      kind: "website",
      label: host || href,
    };
  } catch {
    return { href, kind: "website", label: href };
  }
}

export function parseSocialLinks(hrefs: string[]): SocialLink[] {
  return hrefs.map(parseSocialLink);
}
