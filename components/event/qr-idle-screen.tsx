"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SplitText } from "@/components/fx/split-text";
import { useMood } from "@/lib/use-mood";

/** Rendered client-side against the current origin, so the QR always points at
 *  wherever this display is actually being served from. */
export function QrIdleScreen() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useMood("idle");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { toDataURL } = await import("qrcode");
      const entryUrl = new URL("/event", window.location.origin).toString();
      const dataUrl = await toDataURL(entryUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#f7f5f2", light: "#00000000" },
      });

      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-x-clip px-6 py-16 text-center">
      <div>
        <Image
          src="/cursor-lockup.svg"
          alt="Cursor"
          width={260}
          height={62}
          priority
          className="mx-auto h-14 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-20"
        />
      </div>

      <p className="text-accent text-micro tracking-[0.32em] uppercase">
        <SplitText text="Live Profile Spotlight" by="words" />
      </p>

      <h1 className="text-hero max-w-[16ch] font-bold">
        <SplitText text="Scan to take the stage" by="words" delay={0.2} unitClassName="gradient-ink" />
      </h1>

      <div className="glass shadow-glow flex h-[22vmin] w-[22vmin] min-h-[220px] min-w-[220px] items-center justify-center rounded-3xl p-6">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URL, nothing for next/image to optimize.
          <img src={qrDataUrl} alt="QR code linking to the spotlight entry page" className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
        )}
      </div>

      <p className="text-ink-muted text-lead max-w-md">
        Scan the code, enter your Cursor username, and you&rsquo;re on stage for 60
        seconds.
      </p>
    </main>
  );
}
