"use client";

import { useSyncExternalStore } from "react";
import { LoadingCinematic } from "@/components/fx/loading-cinematic";

const subscribe = () => () => {};

/**
 * `loading.tsx` gets no params, so the handle is lifted off the URL instead. Read
 * from `window` rather than `usePathname()` because the fallback is part of the
 * prerendered shell and a router hook there would block the whole route.
 */
export function RouteLoading() {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => null,
  );
  const segment = decodeURIComponent(pathname?.split("/")[1] ?? "");
  const handle = segment.startsWith("@") ? segment.slice(1) : null;

  return <LoadingCinematic handle={handle} />;
}
