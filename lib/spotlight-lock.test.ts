import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CURATED_HANDLES,
  EXPIRY_SECONDS,
  computeSecondsRemaining,
  isExpired,
  pickCuratedHandle,
} from "./spotlight-lock.ts";

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

describe("pickCuratedHandle", () => {
  it("picks a handle deterministically from the curated pool given a fixed random source", () => {
    const picked = pickCuratedHandle(() => 0);
    assert.equal(picked, CURATED_HANDLES[0]);
  });

  it("never returns an index past the end of the pool", () => {
    const picked = pickCuratedHandle(() => 0.999999);
    assert.equal(picked, CURATED_HANDLES[CURATED_HANDLES.length - 1]);
  });
});
