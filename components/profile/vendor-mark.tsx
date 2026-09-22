"use client";

import { cx } from "@/lib/cx";

export type KnownVendor = "anthropic" | "google" | "cursor" | "openai" | "xai";

function knownVendor(vendor: string | null): KnownVendor | null {
  if (!vendor) {
    return null;
  }

  switch (vendor.toLowerCase().replace(/[\s._-]/g, "")) {
    case "anthropic":
      return "anthropic";
    case "google":
    case "googledeepmind":
      return "google";
    case "cursor":
    case "anysphere":
      return "cursor";
    case "openai":
      return "openai";
    case "xai":
      return "xai";
    default:
      return null;
  }
}

/** Prefer the API vendor, then infer from the model name so logos still show. */
export function resolveVendor(vendor: string | null, name: string): KnownVendor | null {
  const fromVendor = knownVendor(vendor);
  if (fromVendor) {
    return fromVendor;
  }

  const n = name.toLowerCase();
  if (
    n.includes("claude") ||
    n.includes("sonnet") ||
    n.includes("opus") ||
    n.includes("haiku")
  ) {
    return "anthropic";
  }
  if (n.includes("gemini") || n.includes("gemma")) {
    return "google";
  }
  if (n.includes("grok")) {
    return "xai";
  }
  if (
    n.includes("gpt") ||
    /\bo[1-9]\b/.test(n) ||
    n.includes("chatgpt") ||
    n.includes("codex")
  ) {
    return "openai";
  }
  if (n.includes("composer") || n.includes("cursor") || n === "auto") {
    return "cursor";
  }

  return null;
}

export function vendorDisplayName(vendor: KnownVendor): string {
  switch (vendor) {
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google";
    case "cursor":
      return "Cursor";
    case "openai":
      return "OpenAI";
    case "xai":
      return "xAI";
    default: {
      const exhaustive: never = vendor;
      return exhaustive;
    }
  }
}

/**
 * Official vendor marks (Simple Icons / Cursor brand cube). Used to identify
 * the model provider on the recap cards — not as decoration.
 */
export function VendorMark({
  vendor,
  className,
  title,
}: {
  vendor: KnownVendor;
  className?: string;
  title?: string;
}) {
  const label = title ?? vendor;

  switch (vendor) {
    case "anthropic":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="currentColor"
            d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7443l1.3693-3.5527h6.9794l1.3682 3.5528H17.22L10.4178 3.54Zm-.3712 10.2231 2.2636-5.8783 2.2637 5.8783Z"
          />
        </svg>
      );
    case "google":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.12 2.77-2.39 3.63v3.01h3.86c2.26-2.08 3.55-5.15 3.55-8.88Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.94-2.85l-3.86-3.01c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.12-6.73-4.96H1.28v3.11C3.26 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.33A7.21 7.21 0 0 1 4.89 12c0-.81.14-1.6.38-2.33V6.56H1.28A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.44l3.99-3.11Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.56l3.99 3.11C6.22 6.87 8.87 4.75 12 4.75Z"
          />
        </svg>
      );
    case "cursor":
      return (
        <svg
          viewBox="0 0 466.73 532.09"
          className={className}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="#edecec"
            d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.64,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.64-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z"
          />
        </svg>
      );
    case "openai":
      return (
        <svg
          viewBox="-1 -1 26 26"
          preserveAspectRatio="xMidYMid meet"
          className={cx("overflow-visible", className)}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="currentColor"
            d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
          />
        </svg>
      );
    case "xai":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="currentColor"
            d="M17.736 3.011a2.25 2.25 0 0 1 3.182 0l.071.07a2.25 2.25 0 0 1 0 3.182L14.24 12l6.75 6.737a2.25 2.25 0 0 1 0 3.182l-.07.07a2.25 2.25 0 0 1-3.183 0L12 16.323l-5.737 5.666a2.25 2.25 0 0 1-3.182 0l-.071-.07a2.25 2.25 0 0 1 0-3.182L9.76 12 3.01 5.263a2.25 2.25 0 0 1 0-3.182l.07-.07a2.25 2.25 0 0 1 3.183 0L12 7.677Z"
          />
        </svg>
      );
    default: {
      const exhaustive: never = vendor;
      return exhaustive;
    }
  }
}

export function vendorMarkClass(vendor: KnownVendor): string {
  switch (vendor) {
    case "anthropic":
      return "text-ink";
    case "google":
      return "";
    case "cursor":
      return "";
    case "openai":
      return "text-ink";
    case "xai":
      return "text-ink";
    default: {
      const exhaustive: never = vendor;
      return exhaustive;
    }
  }
}

export function VendorFallback({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "bg-accent/20 text-accent flex items-center justify-center rounded-2xl font-bold",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
