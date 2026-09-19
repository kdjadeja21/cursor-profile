import { CURATED_HANDLES, nextSurpriseHandle } from "@/lib/spotlight-lock";

const STORAGE_KEY = "cursor-profile:surprise-bag";

type SurpriseBag = {
  remaining: string[];
  last: string | null;
};

function emptyBag(): SurpriseBag {
  return { remaining: [], last: null };
}

function readBag(): SurpriseBag {
  if (typeof sessionStorage === "undefined") {
    return emptyBag();
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyBag();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return emptyBag();
    }

    const record = parsed as Record<string, unknown>;
    const remaining = Array.isArray(record.remaining)
      ? record.remaining.filter((handle): handle is string => typeof handle === "string")
      : [];
    const last = typeof record.last === "string" ? record.last : null;

    return { remaining, last };
  } catch {
    return emptyBag();
  }
}

function writeBag(bag: SurpriseBag): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch {
    // Private mode / quota — the in-memory pick still works for this click.
  }
}

/** Next curated handle, without replacement until the bag is exhausted. */
export function takeSurpriseHandle(random: () => number = Math.random): string | null {
  const bag = readBag();
  const next = nextSurpriseHandle(CURATED_HANDLES, bag.remaining, bag.last, random);
  if (!next) {
    return null;
  }

  writeBag({ remaining: next.remaining, last: next.handle });
  return next.handle;
}
