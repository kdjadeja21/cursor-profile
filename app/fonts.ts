import { Inter_Tight } from "next/font/google";

/**
 * CursorGothic stand-in.
 *
 * The brand face isn't publicly licensed, so Inter Tight carries the same
 * compressed neo-grotesk feel under the heavy negative tracking the brand uses
 * at display sizes. To swap in the real thing, drop the woff2 files into
 * `public/fonts/` and replace this export with `next/font/local` — nothing
 * else in the app references the family directly.
 */
export const displayFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
