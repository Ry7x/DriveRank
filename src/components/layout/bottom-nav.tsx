"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Trophy, Radio, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "RANKING", icon: Trophy, href: "/leaderboard" },
  { label: "DRAG RANK", icon: Zap, href: "/drag-ranking" },
  { label: "VOZITJE", icon: Gauge, href: "/dashboard", primary: true },
  { label: "RADARËT", icon: Radio, href: "/explore" },
  { label: "PROFILI", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[5.5rem] glass border-t border-white/5 px-2 flex items-center justify-around z-[100] rounded-t-[2.5rem] shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile'));
        const Icon = item.icon;

        if (item.primary) {
          return (
            <Link key={item.href} href={item.href} className="relative -top-8 active:scale-95 transition-transform">
              <div className={cn(
                "w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center transition-all border-4 border-background shadow-2xl",
                isActive ? "bg-red-600 scale-110 shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse-red" : "bg-zinc-900 border-white/5"
              )}>
                <Icon className={cn("w-9 h-9", isActive ? "text-white" : "text-accent")} />
              </div>
              <span className={cn(
                "text-[8px] absolute -bottom-5 left-1/2 -translate-x-1/2 font-bold uppercase whitespace-nowrap",
                isActive ? "text-red-500" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform pt-1">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
              isActive ? "bg-accent/10" : "hover:bg-white/5"
            )}>
              <Icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-muted-foreground")} />
            </div>
            <span className={cn(
              "text-[8px] font-bold uppercase text-center",
              isActive ? "text-accent" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}