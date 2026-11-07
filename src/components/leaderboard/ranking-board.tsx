"use client"

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { ChevronDown, Crown, Flag, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_KOSOVO } from "@/lib/kosovo";
import type { RankedEntry } from "@/lib/ranking";
import { RenderCarIcon } from "@/components/icons/car-icons";
import { RANK_THEMES, type RankTheme } from "./theme";

const PAGE_SIZE = 50;

export type FormatValue = (value: number) => { value: string; unit: string };

interface RankingBoardProps {
  entries: RankedEntry[];
  theme: RankTheme;
  format: FormatValue;
  /** Renders the distance to #1, e.g. "-12 km/h" or "+0.34s". */
  formatGap: (gap: number) => string;
  currentUserId?: string;
  city: string;
  isLoading: boolean;
  emptyMessage: string;
}

export function RankingBoard({
  entries,
  theme,
  format,
  formatGap,
  currentUserId,
  city,
  isLoading,
  emptyMessage,
}: RankingBoardProps) {
  // Parent remounts via `key` on city/tab change, which resets pagination.
  // Live snapshot updates keep the current page size.
  const [visible, setVisible] = useState(PAGE_SIZE);

  const me = currentUserId ? entries.find((e) => e.run.userId === currentUserId) : undefined;

  const scrollToMe = useCallback(() => {
    if (!me) return;
    if (me.rank > visible) setVisible(Math.ceil(me.rank / PAGE_SIZE) * PAGE_SIZE);
    requestAnimationFrame(() => {
      document.getElementById(`rank-${me.run.userId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [me, visible]);

  if (isLoading) return <RankingSkeleton />;

  if (entries.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center text-center gap-4 apple-slide-up">
        <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center">
          <Flag className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground max-w-[16rem]">{emptyMessage}</p>
        <Link
          href="/dashboard"
          className="text-[10px] font-bold uppercase px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 transition-colors"
        >
          Bëj vrapimin e parë
        </Link>
      </div>
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3, visible);
  const leaderLabel = city === ALL_KOSOVO ? "NR. 1 NË KOSOVË" : `NR. 1 NË ${city.toUpperCase()}`;

  return (
    <>
      <Podium entries={podium} theme={theme} format={format} currentUserId={currentUserId} leaderLabel={leaderLabel} />

      {rest.length > 0 && (
        <ol className="space-y-2 mt-5" aria-label="Renditja">
          {rest.map((entry, i) => (
            <RankingRow
              key={entry.run.userId}
              entry={entry}
              theme={theme}
              format={format}
              gapLabel={formatGap(entry.gap)}
              isMe={entry.run.userId === currentUserId}
              stagger={i}
            />
          ))}
        </ol>
      )}

      {entries.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-4 w-full h-11 rounded-2xl glass-card text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-center gap-1.5 hover:text-white transition-colors"
        >
          Shfaq më shumë ({entries.length - visible}) <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {currentUserId && <MyRankBar me={me} total={entries.length} theme={theme} format={format} formatGap={formatGap} onClick={scrollToMe} />}
    </>
  );
}

/* ------------------------------------------------------------------ Podium */

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const PLINTH_HEIGHT = ["h-24", "h-16", "h-12"];
const MEDAL = ["", "text-zinc-300", "text-orange-500"];

function Podium({
  entries,
  theme,
  format,
  currentUserId,
  leaderLabel,
}: {
  entries: RankedEntry[];
  theme: RankTheme;
  format: FormatValue;
  currentUserId?: string;
  leaderLabel: string;
}) {
  const t = RANK_THEMES[theme];

  return (
    <div className="grid grid-cols-3 gap-2 items-end pt-6">
      {PODIUM_ORDER.map((idx, col) => {
        const entry = entries[idx];
        if (!entry) return <div key={col} />;
        const { run } = entry;
        const isFirst = idx === 0;
        const isMe = run.userId === currentUserId;
        const isAdmin = run.isAdmin === true;
        const { value, unit } = format(entry.value);

        return (
          <Link
            key={run.userId}
            id={`rank-${run.userId}`}
            href={`/profile/${run.userId}`}
            className={cn("flex flex-col items-center min-w-0 group apple-slide-up", `stagger-${col + 1}`)}
          >
            {isFirst && <Crown className={cn("w-5 h-5 mb-1 fill-current", t.text)} aria-hidden />}
            <div
              className={cn(
                "relative rounded-full flex items-center justify-center bg-zinc-950 border-2 transition-transform group-active:scale-95",
                isFirst ? cn("w-16 h-16", t.border, t.glow) : "w-12 h-12 border-white/10",
                isAdmin && "border-purple-500/60",
                isMe && "ring-2 ring-accent ring-offset-2 ring-offset-black"
              )}
            >
              <RenderCarIcon
                type={run.profileIcon}
                className={cn(isFirst ? "w-8 h-8" : "w-6 h-6", isAdmin ? "text-purple-400" : isFirst ? t.text : "text-white/70")}
              />
              <span
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2 min-w-5 h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-black",
                  isFirst ? cn(t.bg, theme === "yellow" ? "text-black" : "text-white") : idx === 1 ? "bg-zinc-300 text-black" : "bg-orange-500 text-black"
                )}
              >
                {entry.rank}
              </span>
            </div>

            <div className="mt-3 w-full text-center min-w-0 px-1">
              <div className="flex items-center justify-center gap-1 min-w-0">
                <span className={cn("text-[11px] font-bold uppercase truncate", isFirst ? t.nameAnim : "text-white")}>{run.username}</span>
                {isAdmin && <ShieldCheck className="w-3 h-3 text-yellow-500 shrink-0" aria-label="App founder" />}
              </div>
              <div className="text-[8px] text-muted-foreground uppercase truncate">{run.city}</div>
            </div>

            <div
              className={cn(
                "mt-2 w-full rounded-t-2xl border border-b-0 flex flex-col items-center justify-start pt-2 bg-gradient-to-b to-transparent",
                PLINTH_HEIGHT[idx],
                isFirst ? cn(t.border, t.gradient) : "border-white/10 from-white/[0.06]"
              )}
            >
              <span className={cn("font-bold tabular-nums leading-none", isFirst ? cn("text-xl", t.text) : cn("text-base", MEDAL[idx]))}>
                {value}
              </span>
              <span className="text-[8px] font-medium text-muted-foreground uppercase mt-1">{unit}</span>
              {isFirst && <span className={cn("mt-1.5 text-[7px] font-black uppercase tracking-wider", t.text)}>{leaderLabel}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------- Row */

const RankingRow = memo(function RankingRow({
  entry,
  theme,
  format,
  gapLabel,
  isMe,
  stagger,
}: {
  entry: RankedEntry;
  theme: RankTheme;
  format: FormatValue;
  gapLabel: string;
  isMe: boolean;
  stagger: number;
}) {
  const { run } = entry;
  const isAdmin = run.isAdmin === true;
  const { value, unit } = format(entry.value);
  const car = [run.carBrand, run.carModel].filter(Boolean).join(" ");

  return (
    <li
      id={`rank-${run.userId}`}
      // Off-screen rows skip layout/paint until scrolled near — cheap win for long lists.
      className={cn("[content-visibility:auto] [contain-intrinsic-size:auto_68px]", stagger < 8 && cn("apple-slide-up", `stagger-${stagger + 1}`))}
    >
      <Link
        href={`/profile/${run.userId}`}
        className={cn(
          "glass-card flex items-center gap-3 px-4 h-[68px] rounded-2xl transition-colors active:scale-[0.99] hover:border-white/20",
          isMe && "border-accent/50 bg-accent/[0.06]",
          isAdmin && !isMe && "border-purple-500/40 bg-gradient-to-r from-purple-600/10 to-yellow-500/5"
        )}
      >
        <span className="w-7 text-center text-xs font-bold tabular-nums text-muted-foreground shrink-0">{entry.rank}</span>

        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0">
          <RenderCarIcon type={run.profileIcon} className={cn("w-5 h-5", isAdmin ? "text-purple-400" : "text-white/60")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn("font-bold text-[13px] uppercase truncate", isAdmin ? "text-purple-300" : "text-white")}>{run.username}</span>
            {isMe && <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-accent text-black shrink-0">TI</span>}
            {isAdmin && (
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-600 to-yellow-500 text-white shrink-0">
                FOUNDER
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-muted-foreground uppercase min-w-0">
            <span className="truncate">{run.city}</span>
            {car && <span className="truncate text-muted-foreground/60">• {car}</span>}
          </div>
          {run.community && (
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <Users className="w-2.5 h-2.5 text-blue-500/60 shrink-0" />
              <span className="text-[8px] font-bold uppercase text-blue-400/80 truncate">{run.community}</span>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg font-bold tabular-nums leading-none text-white">
            {value}
            <span className="ml-0.5 text-[9px] font-medium text-muted-foreground uppercase">{unit}</span>
          </div>
          <div className={cn("text-[9px] font-semibold tabular-nums mt-1", RANK_THEMES[theme].text, "opacity-70")}>{gapLabel}</div>
        </div>
      </Link>
    </li>
  );
});

/* -------------------------------------------------------------- My rank bar */

function MyRankBar({
  me,
  total,
  theme,
  format,
  formatGap,
  onClick,
}: {
  me?: RankedEntry;
  total: number;
  theme: RankTheme;
  format: FormatValue;
  formatGap: (gap: number) => string;
  onClick: () => void;
}) {
  const t = RANK_THEMES[theme];
  const bar = "fixed left-0 right-0 z-[90] px-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.5rem)] apple-slide-up";

  if (!me) {
    return (
      <div className={bar}>
        <Link
          href="/dashboard"
          className="max-w-lg mx-auto glass rounded-2xl h-12 px-4 flex items-center justify-between text-[10px] font-bold uppercase"
        >
          <span className="text-muted-foreground">Nuk je ende në këtë renditje</span>
          <span className={t.text}>Garo tani →</span>
        </Link>
      </div>
    );
  }

  const { value, unit } = format(me.value);
  const percentile = Math.max(1, Math.round((me.rank / total) * 100));

  return (
    <div className={bar}>
      <button
        type="button"
        onClick={onClick}
        className="max-w-lg w-full mx-auto glass rounded-2xl h-12 px-4 flex items-center gap-3 border-accent/30 text-left"
      >
        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-accent text-black">TI</span>
        <span className="text-sm font-bold tabular-nums">#{me.rank}</span>
        <span className="text-[9px] uppercase text-muted-foreground">Top {percentile}%</span>
        <span className="ml-auto text-sm font-bold tabular-nums">
          {value}
          <span className="ml-0.5 text-[9px] text-muted-foreground uppercase">{unit}</span>
        </span>
        {me.rank > 1 && <span className={cn("text-[9px] font-semibold tabular-nums", t.text)}>{formatGap(me.gap)}</span>}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- Skeleton */

function RankingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Duke ngarkuar renditjen">
      <div className="grid grid-cols-3 gap-2 items-end pt-6">
        {[1, 0, 2].map((idx) => (
          <div key={idx} className="flex flex-col items-center gap-3">
            <div className={cn("rounded-full bg-white/5 animate-pulse", idx === 0 ? "w-16 h-16" : "w-12 h-12")} />
            <div className="h-2.5 w-16 rounded bg-white/5 animate-pulse" />
            <div className={cn("w-full rounded-t-2xl bg-white/[0.03] animate-pulse", PLINTH_HEIGHT[idx])} />
          </div>
        ))}
      </div>
      <div className="space-y-2 mt-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
