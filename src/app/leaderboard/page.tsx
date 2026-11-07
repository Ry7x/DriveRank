"use client"

import { useMemo, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RankingHeader } from "@/components/leaderboard/ranking-header";
import { RankingBoard, type FormatValue } from "@/components/leaderboard/ranking-board";
import { usePublicRuns } from "@/hooks/use-public-runs";
import { useRankingSeason } from "@/hooks/use-ranking-season";
import { ALL_KOSOVO } from "@/lib/kosovo";
import { buildRanking } from "@/lib/ranking";

const formatSpeed: FormatValue = (v) => ({ value: String(Math.round(v)), unit: "km/h" });
const formatSpeedGap = (gap: number) => (gap < 0.5 ? "—" : `-${Math.round(gap)} km/h`);

export default function LeaderboardPage() {
  const [city, setCity] = useState(ALL_KOSOVO);
  const { timeLeft, progress, sinceIso } = useRankingSeason();
  const { runs, user, isUserLoading, isLoading } = usePublicRuns(sinceIso);

  const topSpeedRuns = useMemo(() => (runs ?? []).filter((r) => r.runType === "Top Speed"), [runs]);

  const rankings = useMemo(
    () =>
      buildRanking(
        city === ALL_KOSOVO ? topSpeedRuns : topSpeedRuns.filter((r) => r.city === city),
        (r) => r.peakSpeedKmH,
        "higher"
      ),
    [topSpeedRuns, city]
  );

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const leader = rankings[0];

  return (
    <div className="relative flex flex-col min-h-full w-full bg-black text-white pb-44 safe-top overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-red-600/15 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-6">
        <RankingHeader
          icon={Trophy}
          title="Top Speed"
          subtitle="Live në Kosovë"
          theme="red"
          timeLeft={timeLeft}
          seasonProgress={progress}
          city={city}
          onCityChange={setCity}
          driverCount={rankings.length}
          record={leader ? formatSpeed(leader.value) : null}
        />

        <RankingBoard
          key={city}
          entries={rankings}
          theme="red"
          format={formatSpeed}
          formatGap={formatSpeedGap}
          currentUserId={user?.uid}
          city={city}
          isLoading={isLoading}
          emptyMessage="Nuk ka rekorde aktive (5 ditët e fundit). 🏁"
        />
      </div>
      <BottomNav />
    </div>
  );
}
