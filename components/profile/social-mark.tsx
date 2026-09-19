import type { SocialKind } from "@/lib/social-links";

export function socialKindLabel(kind: SocialKind): string {
  switch (kind) {
    case "x":
      return "X";
    case "github":
      return "GitHub";
    case "website":
      return "Website";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/** Brand marks for public profile links — X, GitHub, or a generic globe. */
export function SocialMark({
  kind,
  className,
}: {
  kind: SocialKind;
  className?: string;
}) {
  const label = socialKindLabel(kind);

  switch (kind) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
          <title>{label}</title>
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.831L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
          <title>{label}</title>
          <path
            fill="currentColor"
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
      );
    case "website":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          role="img"
          aria-hidden="true"
        >
          <title>{label}</title>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 3c2.4 2.6 3.6 5.7 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.7-3.6-9s1.2-6.4 3.6-9Z"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
