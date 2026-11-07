"use client"

import type { LucideIcon } from "lucide-react";
import { Clock, MapPin, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KOSOVO_CITIES } from "@/lib/kosovo";
import { RANK_THEMES, type RankTheme } from "./theme";

interface RankingHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  theme: RankTheme;
  timeLeft: string;
  seasonProgress: number;
  city: string;
  onCityChange: (city: string) => void;
  driverCount: number;
  record?: { value: string; unit: string } | null;
}

export function RankingHeader({
  icon: Icon,
  title,
  subtitle,
  theme,
  timeLeft,
  seasonProgress,
  city,
  onCityChange,
  driverCount,
  record,
}: RankingHeaderProps) {
  const t = RANK_THEMES[theme];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 apple-slide-up">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl shrink-0", t.soft, t.border)}>
          <Icon className={cn("w-7 h-7", t.text)} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold uppercase leading-none tracking-tight">{title}</h1>
          <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1.5 tracking-wider">{subtitle}</p>
        </div>
      </div>

      {/* Season strip: reset countdown, drivers, record */}
      <div className="glass-card rounded-2xl p-3 apple-slide-up stagger-1">
        <div className="grid grid-cols-3 divide-x divide-white/5 text-center">
          <Stat label="Reseti" value={timeLeft || "—"} icon={<Clock className="w-3 h-3" />} accent="text-accent" />
          <Stat label="Shoferë" value={String(driverCount)} icon={<Users className="w-3 h-3" />} />
          <Stat
            label="Rekordi"
            value={record ? `${record.value}${record.unit === "s" ? "s" : ""}` : "—"}
            suffix={record && record.unit !== "s" ? record.unit : undefined}
            accent={t.text}
          />
        </div>
        <div className="mt-3 h-1 w-full rounded-full bg-white/5 overflow-hidden" aria-hidden>
          <div className={cn("h-full rounded-full transition-[width] duration-700", t.bar)} style={{ width: `${Math.round(seasonProgress * 100)}%` }} />
        </div>
      </div>

      <Select value={city} onValueChange={onCityChange}>
        <SelectTrigger
          aria-label="Filtro sipas qytetit"
          className="w-full h-12 glass border-white/10 rounded-2xl font-bold uppercase text-[11px] bg-white/5 transition-colors duration-300 hover:border-accent/40 apple-slide-up stagger-2"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className={cn("w-3.5 h-3.5 shrink-0", t.text)} />
            <SelectValue placeholder="Zgjidh Qytetin" />
          </span>
        </SelectTrigger>
        <SelectContent className="glass border-white/10 max-h-[300px]">
          {KOSOVO_CITIES.map((c) => (
            <SelectItem key={c} value={c} className="font-bold text-[11px] uppercase py-3">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="px-2 min-w-0">
      <div className="flex items-center justify-center gap-1 text-[8px] font-bold uppercase text-muted-foreground tracking-wider">
        {icon}
        {label}
      </div>
      <div className={cn("mt-1 text-sm font-bold tabular-nums truncate", accent ?? "text-white")}>
        {value}
        {suffix && <span className="ml-0.5 text-[9px] font-medium text-muted-foreground uppercase">{suffix}</span>}
      </div>
    </div>
  );
}
