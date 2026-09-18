import type { Metadata, Viewport } from "next";
import { displayFont } from "@/app/fonts";
import { AuroraBackdrop } from "@/components/fx/aurora-backdrop";
import "./globals.css";

/** Without an absolute base, the generated share card is referenced relatively and
 *  never resolves for whoever the link is sent to. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cursor",
  description: "Look up a Cursor profile.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} h-full antialiased`}>
      <body className="bg-surface text-ink flex min-h-full flex-col">
        {/* Persistent across routes so gate -> loading -> profile share one sky. */}
        <AuroraBackdrop />
        {children}
      </body>
    </html>
  );
}
