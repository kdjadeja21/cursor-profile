/**
 * Upstream's protobuf `count` field saturates at signed int32 (2_147_483_647).
 * Days above that still carry the real total on `value` (and `tokensOverTime`
 * already serializes the full integer as a string). Always take the largest
 * finite reading so heatmaps and totals are not pinned to the int32 ceiling.
 */
export function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function resolveTokens(
  entry: Record<string, unknown>,
  keys: string[],
): number | null {
  const present = keys.filter((key) => key in entry && entry[key] != null);

  if (present.length === 0) {
    return null;
  }

  return present.reduce((max, key) => Math.max(max, asNumber(entry[key])), 0);
}

/** Linear below this peak/quiet ratio; log above it so a single spike does not flatten the rest. */
export const TOKEN_CHART_LOG_SPAN = 25;

/**
 * Maps a daily total onto 0..1 of chart height.
 *
 * A log scale from zero is the wrong default for a profile like Lauren's: the
 * quietest recent day is still ~4B against a ~65B peak, so log10(n+1)/log10(peak)
 * parks every point in the top tenth of the plot. Linear is the right scale
 * when the window is within one or two orders of magnitude; log only when the
 * peak dwarfs the quietest real day.
 */
export function tokenChartY(
  tokens: number,
  peak: number,
  minPositive: number,
): number {
  if (tokens <= 0 || peak <= 0) {
    return 0;
  }

  const quiet = Math.max(minPositive, Number.EPSILON);
  const span = peak / quiet;

  if (span <= TOKEN_CHART_LOG_SPAN) {
    return Math.min(1, tokens / peak);
  }

  const floor = quiet / 10;
  const logFloor = Math.log10(floor);
  const logPeak = Math.log10(peak);
  const denom = logPeak - logFloor;

  if (denom <= 0) {
    return 1;
  }

  return Math.min(
    1,
    Math.max(0, (Math.log10(Math.max(tokens, floor)) - logFloor) / denom),
  );
}
