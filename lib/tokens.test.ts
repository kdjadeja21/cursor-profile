import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCalendar, formatCompactNumber } from "./derive.ts";
import { resolveTokens, tokenChartY } from "./tokens.ts";

const INT32_MAX = 2_147_483_647;

function emptyActivity(
  activityCounts: { date: string; tokens: number }[],
): Parameters<typeof buildCalendar>[0] {
  return {
    mostActiveMonth: null,
    mostActiveDay: null,
    longestStreak: 0,
    currentStreak: 0,
    activeDates: activityCounts.filter((day) => day.tokens > 0).map((day) => day.date),
    activityCounts,
    agentsLocal: 0,
    agentsCloud: 0,
    longestAgentSeconds: 0,
    tokensOverTime: [],
    agentsOverTime: [],
  };
}

describe("resolveTokens", () => {
  it("prefers the unclipped value when count saturates at int32", () => {
    const tokens = resolveTokens(
      { date: "2026-09-05", count: INT32_MAX, value: "64939292736" },
      ["count", "value"],
    );

    assert.equal(tokens, 64_939_292_736);
  });

  it("keeps matching count and value totals", () => {
    const tokens = resolveTokens(
      { date: "2026-03-23", count: 7_889_618, value: "7889618" },
      ["count", "value"],
    );

    assert.equal(tokens, 7_889_618);
  });

  it("reads string token windows used by the 30-day graph", () => {
    const tokens = resolveTokens(
      { date: "2026-09-05", tokens: "64939292736" },
      ["tokens"],
    );

    assert.equal(tokens, 64_939_292_736);
  });

  it("skips a trailing window day with a null token total", () => {
    assert.equal(
      resolveTokens({ date: "2026-09-18", tokens: null }, ["tokens"]),
      null,
    );
  });
});

describe("tokenChartY", () => {
  it("spreads Lauren-scale billion-token days instead of pinning them to the ceiling", () => {
    const peak = 64_939_292_736;
    const quiet = 4_263_041_683;
    const oldLog = (n: number) => Math.log10(n + 1) / Math.log10(peak + 1);

    assert.ok(tokenChartY(quiet, peak, quiet) < 0.2);
    assert.equal(tokenChartY(peak, peak, quiet), 1);
    assert.ok(
      tokenChartY(peak, peak, quiet) - tokenChartY(quiet, peak, quiet) >
        oldLog(peak) - oldLog(quiet),
    );
  });

  it("still uses log when a 60B spike would flatten million-token days on a linear axis", () => {
    const peak = 60_000_000_000;
    const quiet = 1_000_000;
    const linear = quiet / peak;

    assert.ok(tokenChartY(quiet, peak, quiet) > 0.15);
    assert.ok(tokenChartY(quiet, peak, quiet) > linear);
    assert.equal(tokenChartY(0, peak, quiet), 0);
  });
});

describe("buildCalendar", () => {
  it("bands overflowed days by real totals instead of the shared int32 cap", () => {
    const days = [
      { date: "2026-09-01", tokens: 8_000_000_000 },
      { date: "2026-09-02", tokens: 16_000_000_000 },
      { date: "2026-09-03", tokens: 32_000_000_000 },
      { date: "2026-09-04", tokens: 48_000_000_000 },
      { date: "2026-09-05", tokens: 64_939_292_736 },
    ];
    const calendar = buildCalendar(emptyActivity(days), "2026-09-05");
    const levels = new Set(
      calendar.weeks
        .flat()
        .filter((cell) => cell.tokens > 0)
        .map((cell) => cell.level),
    );

    assert.equal(calendar.busiestDay?.date, "2026-09-05");
    assert.equal(calendar.busiestDay?.tokens, 64_939_292_736);
    assert.ok(levels.size > 1);
    assert.ok(levels.has(4));
  });
});

describe("formatCompactNumber", () => {
  it("formats trillion-scale totals without collapsing to zero", () => {
    assert.equal(formatCompactNumber(1_456_074_038_343), "1.46T");
    assert.equal(formatCompactNumber(64_939_292_736), "64.9B");
  });
});
