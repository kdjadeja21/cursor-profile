import type { Metadata } from "next";
import { displayFont } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursor Ambassadors",
  description: "Coding activity, told like a highlight reel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} h-full antialiased`}>
      <body className="bg-surface text-ink flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
