import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CURATED_HANDLES,
  EXPIRY_SECONDS,
  computeSecondsRemaining,
  isExpired,
  isSameSpotlightSession,
  mergeSpotlightStatus,
  nextStatusDelayMs,
  pickCuratedHandle,
  nextSurpriseHandle,
  shouldFetchProfileForClaim,
  DISPLAY_IDLE_POLL_MS,
  MIN_STATUS_REFRESH_MS,
  type SpotlightStatusResponse,
} from "./spotlight-lock.ts";

function presenting(username: string, secondsRemaining: number): SpotlightStatusResponse {
  return {
    status: "presenting",
    username,
    isRandom: false,
    secondsRemaining,
    profile: {
      profile: {
        handle: username,
        displayName: username,
        avatarUrl: null,
        visibility: null,
        badges: [],
        links: [],
        createdAt: null,
        updatedAt: null,
      },
      activity: {
        mostActiveMonth: null,
        mostActiveDay: null,
        longestStreak: 0,
        currentStreak: 0,
        activeDates: [],
        activityCounts: [],
        agentsLocal: 0,
        agentsCloud: 0,
        longestAgentSeconds: 0,
        tokensOverTime: [],
        agentsOverTime: [],
        topModels: [],
      },
    },
  };
}

describe("computeSecondsRemaining", () => {
  it("returns the full window right after a claim starts", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:00.000Z").getTime();
    assert.equal(computeSecondsRemaining(startedAt, now), EXPIRY_SECONDS);
  });

  it("counts down as time passes", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:20.000Z").getTime();
    assert.equal(computeSecondsRemaining(startedAt, now), EXPIRY_SECONDS - 20);
  });

  it("floors at zero once the window has fully elapsed", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:05:00.000Z").getTime();
    assert.equal(computeSecondsRemaining(startedAt, now), 0);
  });

  it("treats a null start as already expired", () => {
    assert.equal(computeSecondsRemaining(null), 0);
  });
});

describe("isExpired", () => {
  it("is not expired within the window", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:59.000Z").getTime();
    assert.equal(isExpired(startedAt, now), false);
  });

  it("is expired right at the boundary and beyond", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:01:00.000Z").getTime();
    assert.equal(isExpired(startedAt, now), true);
  });
});

describe("isSameSpotlightSession", () => {
  it("treats two idle polls as the same session", () => {
    assert.equal(
      isSameSpotlightSession({ status: "idle" }, { status: "idle" }),
      true,
    );
  });

  it("ignores countdown-only updates for the same presenter", () => {
    assert.equal(isSameSpotlightSession(presenting("lauren", 58), presenting("lauren", 56)), true);
  });

  it("treats a new presenter as a different session", () => {
    assert.equal(isSameSpotlightSession(presenting("lauren", 40), presenting("eric", 60)), false);
  });

  it("treats idle ↔ presenting as a session change", () => {
    assert.equal(isSameSpotlightSession({ status: "idle" }, presenting("lauren", 60)), false);
    assert.equal(isSameSpotlightSession(presenting("lauren", 1), { status: "idle" }), false);
  });
});

describe("nextStatusDelayMs", () => {
  it("waits for the remaining slot time instead of polling while presenting", () => {
    assert.equal(nextStatusDelayMs(presenting("lauren", 12), "display"), 12_000);
    assert.equal(nextStatusDelayMs(presenting("lauren", 12), "entry"), 12_000);
  });

  it("floors a zero remaining payload so expiry still gets one confirmation fetch", () => {
    assert.equal(nextStatusDelayMs(presenting("lauren", 0), "display"), MIN_STATUS_REFRESH_MS);
  });

  it("does not poll the entry route while idle", () => {
    assert.equal(nextStatusDelayMs({ status: "idle" }, "entry"), null);
  });

  it("uses the idle interval only on the display route", () => {
    assert.equal(nextStatusDelayMs({ status: "idle" }, "display"), DISPLAY_IDLE_POLL_MS);
  });
});

describe("mergeSpotlightStatus", () => {
  it("keeps the current object when only the countdown changed", () => {
    const current = presenting("lauren", 58);
    const next = presenting("lauren", 56);
    const merged = mergeSpotlightStatus(current, next);

    assert.equal(merged.status, "presenting");
    if (merged.status === "presenting") {
      assert.equal(merged.secondsRemaining, 56);
      assert.equal(merged.profile, current.profile);
    }
  });

  it("replaces the session when the presenter changes", () => {
    const current = presenting("lauren", 40);
    const next = presenting("eric", 60);
    assert.equal(mergeSpotlightStatus(current, next), next);
  });
});

describe("shouldFetchProfileForClaim", () => {
  it("skips the profile fetch while someone is presenting", () => {
    assert.equal(shouldFetchProfileForClaim(presenting("lauren", 40)), false);
  });

  it("fetches a profile when the slot is idle", () => {
    assert.equal(shouldFetchProfileForClaim({ status: "idle" }), true);
  });
});

describe("pickCuratedHandle", () => {
  it("picks a handle deterministically from the curated pool given a fixed random source", () => {
    const picked = pickCuratedHandle(() => 0);
    assert.equal(picked, CURATED_HANDLES[0]);
  });

  it("never returns an index past the end of the pool", () => {
    const picked = pickCuratedHandle(() => 0.999999);
    assert.equal(picked, CURATED_HANDLES[CURATED_HANDLES.length - 1]);
  });

  it("skips excluded handles when others remain", () => {
    const first = CURATED_HANDLES[0];
    assert.ok(first);
    const picked = pickCuratedHandle(() => 0, [first]);
    assert.equal(picked, CURATED_HANDLES[1]);
  });
});

describe("nextSurpriseHandle", () => {
  it("walks the pool without replacement", () => {
    const seen = new Set<string>();
    let remaining: string[] = [];
    let last: string | null = null;

    for (let step = 0; step < CURATED_HANDLES.length; step += 1) {
      const next = nextSurpriseHandle(CURATED_HANDLES, remaining, last, () => 0);
      assert.ok(next);
      assert.equal(seen.has(next.handle), false);
      seen.add(next.handle);
      remaining = next.remaining;
      last = next.handle;
    }

    assert.equal(seen.size, CURATED_HANDLES.length);
  });

  it("does not immediately repeat the last handle when the bag refills", () => {
    const last = CURATED_HANDLES[0];
    assert.ok(last);
    const next = nextSurpriseHandle(CURATED_HANDLES, [], last, () => 0);
    assert.ok(next);
    assert.notEqual(next.handle, last);
  });

  it("includes the newly added surprise profiles", () => {
    assert.ok(CURATED_HANDLES.includes("jatin-babariya"));
    assert.ok(CURATED_HANDLES.includes("kdjadeja"));
    assert.ok(CURATED_HANDLES.includes("vishalnai56"));
  });
});
