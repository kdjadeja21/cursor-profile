import localFont from "next/font/local";

/**
 * Cursor Gothic — official brand face (Regular / Bold + italics).
 * Files live next to this module so `next/font/local` can subset and self-host them.
 */
export const displayFont = localFont({
  src: [
    {
      path: "./CursorGothic-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./CursorGothic-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./CursorGothic-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./CursorGothic-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-display-family",
  display: "swap",
  adjustFontFallback: "Arial",
});
