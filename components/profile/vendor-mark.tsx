"use client";

import { cx } from "@/lib/cx";

export type KnownVendor = "anthropic" | "google" | "cursor" | "openai" | "xai";

export function knownVendor(vendor: string | null): KnownVendor | null {
  if (!vendor) {
    return null;
  }

  switch (vendor.toLowerCase()) {
    case "anthropic":
      return "anthropic";
    case "google":
      return "google";
    case "cursor":
      return "cursor";
    case "openai":
      return "openai";
    case "xai":
      return "xai";
    default:
      return null;
  }
}

/**
 * Official vendor marks (Simple Icons / Cursor brand lockup cube). Used to identify
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
          viewBox="400 395 167 191"
          className={className}
          role="img"
          aria-label={label}
        >
          <title>{label}</title>
          <path
            fill="#72716D"
            d="M483.395 490.5L566 538.297C565.493 539.178 564.757 539.93 563.845 540.456L486.636 585.13C484.632 586.29 482.159 586.29 480.154 585.13L402.945 540.456C402.034 539.93 401.297 539.178 400.79 538.297L483.395 490.5Z"
          />
          <path
            fill="#55544F"
            d="M483.395 395V490.5L400.79 538.297C400.282 537.416 400 536.398 400 535.346V445.654C400 443.545 401.122 441.6 402.945 440.544L480.15 395.87C481.154 395.29 482.273 395 483.391 395H483.395Z"
          />
          <path
            fill="#43413C"
            d="M565.996 442.703C565.489 441.822 564.752 441.07 563.841 440.544L486.632 395.87C485.632 395.29 484.513 395 483.395 395V490.5L566 538.297C566.507 537.416 566.789 536.398 566.789 535.346V445.654C566.789 444.598 566.511 443.588 566 442.703H565.996Z"
          />
          <path
            fill="#D6D5D2"
            d="M560.218 446.049C560.686 446.858 560.751 447.896 560.218 448.82L485.235 578.974C484.732 579.855 483.392 579.493 483.392 578.479V492.713C483.392 492.029 483.209 491.37 482.877 490.794L560.215 446.045H560.218V446.049Z"
          />
          <path
            fill="white"
            d="M560.218 446.049L482.88 490.797C482.552 490.224 482.073 489.737 481.48 489.394L407.369 446.511C406.49 446.006 406.851 444.663 407.862 444.663H557.824C558.889 444.663 559.754 445.239 560.218 446.049Z"
          />
        </svg>
      );
    case "openai":
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
            d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A6.066 6.066 0 0 0 19.019 19.82a5.985 5.985 0 0 0 3.997-2.9 6.046 6.046 0 0 0-.742-7.098ZM13.14 21.037a4.476 4.476 0 0 1-2.867-.98l.141-.08 4.779-2.759a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.503 4.504Zm-9.616-3.56a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.216-2.473Zm-1.25-10.35a4.48 4.48 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.071.071 0 0 1-.071.006L7.347 14.68A4.504 4.504 0 0 1 2.274 7.127Zm16.888 3.45-5.833-3.387 2.02-1.163a.075.075 0 0 1 .071 0l4.804 2.776a4.5 4.5 0 0 1-.695 8.116v-5.439a.79.79 0 0 0-.407-.667Zm2.027-3.024-.142-.085-4.773-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66ZM8.39 12.608l-2.02-1.163a.08.08 0 0 1-.038-.057V5.806a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.19a.795.795 0 0 0-.393.681Zm1.003-2.16 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
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
