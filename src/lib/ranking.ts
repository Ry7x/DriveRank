export type RankDirection = "higher" | "lower";

export interface RankedEntry<T = any> {
  run: T;
  rank: number;
  value: number;
  /** Absolute distance to the #1 value (0 for the leader). */
  gap: number;
}

/**
 * Keeps each driver's best run, sorts, and annotates rank + gap to the leader.
 * Single pass over `runs`, then one sort over unique drivers.
 */
export function buildRanking<T extends { userId?: string }>(
  runs: Iterable<T>,
  getValue: (run: T) => number | null | undefined,
  direction: RankDirection
): RankedEntry<T>[] {
  const isBetter = direction === "higher" ? (a: number, b: number) => a > b : (a: number, b: number) => a < b;
  const best = new Map<string, { run: T; value: number }>();

  for (const run of runs) {
    const value = getValue(run);
    if (!run.userId || value == null || !Number.isFinite(value) || value <= 0) continue;
    const current = best.get(run.userId);
    if (!current || isBetter(value, current.value)) best.set(run.userId, { run, value });
  }

  const sorted = [...best.values()].sort((a, b) => (direction === "higher" ? b.value - a.value : a.value - b.value));
  const leader = sorted[0]?.value ?? 0;

  return sorted.map((entry, i) => ({ ...entry, rank: i + 1, gap: Math.abs(entry.value - leader) }));
}
