/**
 * Per-board accent colours. Class strings are written out in full so Tailwind's
 * JIT can see them.
 */
export const RANK_THEMES = {
  red: {
    text: "text-red-500",
    bg: "bg-red-600",
    soft: "bg-red-600/15",
    border: "border-red-500/30",
    glow: "shadow-[0_0_24px_rgba(220,38,38,0.25)]",
    gradient: "from-red-600/15",
    pageGlow: "from-red-600/15",
    nameAnim: "animate-text-red-purple",
    tabActive: "data-[state=active]:bg-red-600 data-[state=active]:text-white",
    bar: "bg-red-500",
  },
  yellow: {
    text: "text-yellow-500",
    bg: "bg-yellow-500",
    soft: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_24px_rgba(234,179,8,0.2)]",
    gradient: "from-yellow-500/15",
    pageGlow: "from-yellow-500/15",
    nameAnim: "animate-text-yellow-cyan",
    tabActive: "data-[state=active]:bg-yellow-500 data-[state=active]:text-black",
    bar: "bg-yellow-500",
  },
} as const;

export type RankTheme = keyof typeof RANK_THEMES;
