"use client"

import { useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";

/** Rankings reset every 5 days, counted from a fixed epoch so every client agrees. */
const SEASON_EPOCH = Date.UTC(2024, 0, 1);
export const SEASON_DAYS = 5;
const SEASON_MS = SEASON_DAYS * 24 * 60 * 60 * 1000;

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  return `${d}D ${h}H ${String(m).padStart(2, "0")}M`;
}

/**
 * Countdown to the next ranking reset plus the ISO cutoff used to query runs.
 * Ticks every 30s, which is enough for a minute-resolution label.
 */
export function useRankingSeason() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Fixed for the lifetime of the page so the Firestore query stays memoised.
  const sinceIso = useMemo(() => subDays(new Date(), SEASON_DAYS).toISOString(), []);

  if (now === null) return { timeLeft: "", progress: 0, sinceIso };

  const elapsedInSeason = (now - SEASON_EPOCH) % SEASON_MS;
  return {
    timeLeft: formatRemaining(SEASON_MS - elapsedInSeason),
    progress: elapsedInSeason / SEASON_MS,
    sinceIso,
  };
}
