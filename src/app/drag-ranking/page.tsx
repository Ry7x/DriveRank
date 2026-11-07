"use client"

import { useMemo, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankingHeader } from "@/components/leaderboard/ranking-header";
import { RankingBoard, type FormatValue } from "@/components/leaderboard/ranking-board";
import { RANK_THEMES } from "@/components/leaderboard/theme";
import { usePublicRuns } from "@/hooks/use-public-runs";
import { useRankingSeason } from "@/hooks/use-ranking-season";
import { ALL_KOSOVO } from "@/lib/kosovo";
import { buildRanking, type RankedEntry } from "@/lib/ranking";
import { cn } from "@/lib/utils";

/** `runType` values as stored in Firestore, with their tab labels. */
const DRAG_TYPES = [
  { type: "0-60", label: "0-60" },
  { type: "0-100", label: "0-100" },
  { type: "100-200", label: "100-200" },
  { type: "1/4 Mile", label: "1/4 Mile" },
] as const;

type DragType = (typeof DRAG_TYPES)[number]["type"];

const formatTime: FormatValue = (v) => ({ value: v.toFixed(2), unit: "s" });
const formatTimeGap = (gap: number) => (gap < 0.005 ? "—" : `+${gap.toFixed(2)}s`);

export default function DragRankingPage() {
  const [city, setCity] = useState(ALL_KOSOVO);
  const [tab, setTab] = useState<DragType>("0-60");
  const { timeLeft, progress, sinceIso } = useRankingSeason();
  const { runs, user, isUserLoading, isLoading } = usePublicRuns(sinceIso);

  // Bucket runs by type in one pass, then rank each bucket once — previously every
  // tab was re-filtered and re-sorted on every render.
  const rankingsByType = useMemo(() => {
    const buckets = new Map<string, any[]>(DRAG_TYPES.map((d) => [d.type, []]));
    for (const run of runs ?? []) {
      if (!run.dragTime) continue;
      if (city !== ALL_KOSOVO && run.city !== city) continue;
      buckets.get(run.runType)?.push(run);
    }
    const result = {} as Record<DragType, RankedEntry[]>;
    for (const { type } of DRAG_TYPES) result[type] = buildRanking(buckets.get(type)!, (r) => r.dragTime, "lower");
    return result;
  }, [runs, city]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const active = rankingsByType[tab];
  const leader = active[0];

  return (
    <div className="relative flex flex-col min-h-full w-full bg-black text-white pb-44 safe-top overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-yellow-500/15 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-6">
        <RankingHeader
          icon={Zap}
          title="Drag Ranking"
          subtitle="Shpejtësia në Kosovë"
          theme="yellow"
          timeLeft={timeLeft}
          seasonProgress={progress}
          city={city}
          onCityChange={setCity}
          driverCount={active.length}
          record={leader ? formatTime(leader.value) : null}
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as DragType)} className="mt-4">
          <TabsList className="grid grid-cols-4 gap-1 glass border-white/5 h-12 rounded-2xl p-1 bg-white/5 w-full apple-slide-up stagger-3">
            {DRAG_TYPES.map(({ type, label }) => {
              const count = rankingsByType[type].length;
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className={cn("rounded-xl h-full font-bold text-[10px] uppercase px-1 gap-1", RANK_THEMES.yellow.tabActive)}
                >
                  {label}
                  {count > 0 && <span className="text-[8px] opacity-60 tabular-nums">{count}</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <RankingBoard
          key={`${city}|${tab}`}
          entries={active}
          theme="yellow"
          format={formatTime}
          formatGap={formatTimeGap}
          currentUserId={user?.uid}
          city={city}
          isLoading={isLoading}
          emptyMessage={`Nuk ka rekorde ${tab} për këtë qytet (5 ditët e fundit). 🏁`}
        />
      </div>
      <BottomNav />
    </div>
  );
}
