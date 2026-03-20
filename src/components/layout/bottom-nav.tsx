"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Trophy, Radio, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
<<<<<<< HEAD
  { label: "Ranking", icon: Trophy, href: "/leaderboard" },
  { label: "Drag", icon: Zap, href: "/drag" },
  { label: "Vozitje", icon: Gauge, href: "/dashboard", primary: true },
  { label: "Radarët", icon: Radio, href: "/explore" },
  { label: "Profili", icon: User, href: "/profile" },
=======
  { label: "RANKING", icon: Trophy, href: "/leaderboard" },
  { label: "DRAG RANK", icon: Zap, href: "/drag-ranking" },
  { label: "VOZITJE", icon: Gauge, href: "/dashboard", primary: true },
  { label: "RADARËT", icon: Radio, href: "/explore" },
  { label: "PROFILI", icon: User, href: "/profile" },
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
];

export function BottomNav() {
  const pathname = usePathname();

  return (
<<<<<<< HEAD
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md h-[4.5rem] glass border-t border-white/5 px-4 flex items-center justify-around z-[100] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.6)] pb-[env(safe-area-inset-bottom)]">
=======
    <div className="fixed bottom-0 left-0 right-0 h-[5.5rem] glass border-t border-white/5 px-2 flex items-center justify-around z-[100] rounded-t-[2.5rem] shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile'));
        const Icon = item.icon;

        if (item.primary) {
          return (
<<<<<<< HEAD
            <Link key={item.href} href={item.href} className="relative -top-6 active:scale-95 transition-transform duration-200">
              <div className={cn(
                "w-[4rem] h-[4rem] rounded-2xl flex items-center justify-center transition-all duration-300 border-4 border-background shadow-2xl",
                isActive ? "bg-red-600 neon-red scale-110" : "bg-zinc-900 border-white/5"
              )}>
                <Icon className={cn("w-8 h-8 transition-colors", isActive ? "text-white" : "text-accent")} />
              </div>
              <span className={cn(
                "text-[8px] absolute -bottom-5 left-1/2 -translate-x-1/2 font-black uppercase tracking-[0.1em] transition-colors whitespace-nowrap",
=======
            <Link key={item.href} href={item.href} className="relative -top-8 active:scale-95 transition-transform">
              <div className={cn(
                "w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center transition-all border-4 border-background shadow-2xl",
                isActive ? "bg-red-600 scale-110 shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse-red" : "bg-zinc-900 border-white/5"
              )}>
                <Icon className={cn("w-9 h-9", isActive ? "text-white" : "text-accent")} />
              </div>
              <span className={cn(
                "text-[8px] absolute -bottom-5 left-1/2 -translate-x-1/2 font-bold uppercase whitespace-nowrap",
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                isActive ? "text-red-500" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
<<<<<<< HEAD
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform duration-200">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              isActive ? "bg-accent/10" : "group-hover:bg-white/5"
            )}>
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
              )} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-colors",
=======
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform pt-1">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
              isActive ? "bg-accent/10" : "hover:bg-white/5"
            )}>
              <Icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-muted-foreground")} />
            </div>
            <span className={cn(
              "text-[8px] font-bold uppercase text-center",
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
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