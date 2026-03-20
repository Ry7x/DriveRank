
"use client"

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, MapPin, Zap, Crown, Loader2, Star, Clock, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { subDays, intervalToDuration } from "date-fns";
import { RenderCarIcon } from "@/components/icons/car-icons";

const KOSOVO_CITIES = [
  "Mbarë Kosova", "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Mitrovicë", "Gjilan", "Ferizaj", 
  "Vushtrri", "Podujevë", "Rahovec", "Fushë Kosovë", "Suharekë", "Kaçanik", 
  "Skënderaj", "Lipjan", "Malishevë", "Drenas", "Deçan", "Klinë", "Kamenicë", 
  "Dragash", "Istog", "Viti", "Obiliq", "Leposaviq", "Graçanicë", "Hani i Elezit", 
  "Zveçan", "Shtime", "Novobërdë", "Zubin Potok", "Junik", "Mamushë", 
  "Ranillug", "Partesh", "Kllokot"
];

export default function DragRankingPage() {
  const { user, isUserLoading } = useUser();
  const [cityFilter, setCityFilter] = useState("Mbarë Kosova");
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => { 
    setMounted(true); 
    
    const calculateTimeLeft = () => {
      const epoch = new Date('2024-01-01T00:00:00Z').getTime();
      const now = Date.now();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const elapsed = now - epoch;
      const nextReset = epoch + (Math.floor(elapsed / fiveDaysMs) + 1) * fiveDaysMs;
      
      const duration = intervalToDuration({ start: now, end: nextReset });
      const d = duration.days || 0;
      const h = duration.hours || 0;
      const m = duration.minutes || 0;
      
      setTimeLeft(`${d}D ${h}H ${m}M`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, []);

  const fiveDaysAgo = useMemo(() => subDays(new Date(), 5).toISOString(), []);

  const publicRunsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user?.uid) return null;
    return query(
      collection(db, "public_runs"), 
      where("createdAt", ">=", fiveDaysAgo),
      orderBy("createdAt", "desc"), 
      limit(1000)
    );
  }, [db, isUserLoading, user?.uid, fiveDaysAgo]);

  const { data: allRuns, isLoading } = useCollection(publicRunsQuery);

  const filteredRuns = useMemo(() => {
    if (!allRuns) return [];
    if (cityFilter === "Mbarë Kosova") return allRuns;
    return allRuns.filter(run => run.city === cityFilter);
  }, [allRuns, cityFilter]);

  const dragRankings = (type: string) => {
    const uniqueUsers: Record<string, any> = {};
    filteredRuns.filter(r => r.runType === type && r.dragTime).forEach(run => {
      if (!uniqueUsers[run.userId] || run.dragTime < uniqueUsers[run.userId].dragTime) {
        uniqueUsers[run.userId] = run;
      }
    });
    return Object.values(uniqueUsers).sort((a: any, b: any) => (a.dragTime || 999) - (b.dragTime || 999));
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="flex flex-col h-full w-full bg-black text-white pb-24 safe-top overflow-x-hidden no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-6 pb-4 relative z-10 space-y-6 w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between apple-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/15 rounded-2xl flex items-center justify-center border border-yellow-500/20 shadow-xl shrink-0">
              <Zap className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase leading-none">DRAG RANKING</h1>
              <p className="text-[10px] font-light text-muted-foreground uppercase mt-1.5">SHPEJTËSIA NË KOSOVË</p>
            </div>
          </div>
          <Badge className="bg-accent/10 border-accent/20 text-[8px] font-black text-accent uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse-glow">
            <Clock className="w-3 h-3" /> RESETI NË: {timeLeft}
          </Badge>
        </div>

        <div className="space-y-2 apple-slide-up stagger-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground px-1">📍 FILTRO SIPAS QYTETIT</Label>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full h-14 glass border-white/10 rounded-2xl font-bold uppercase text-[11px] bg-white/5 transition-all duration-300">
              <SelectValue placeholder="Zgjidh Qytetin" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 max-h-[300px]">
              {KOSOVO_CITIES.map(c => (
                <SelectItem key={c} value={c} className="font-bold text-[11px] uppercase py-3">📍 {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="0-60" className="w-full mt-2 relative z-10 max-w-lg mx-auto px-4">
        <TabsList className="flex gap-2 overflow-x-auto no-scrollbar glass border-white/5 h-14 rounded-[1.5rem] p-1.5 shrink-0 mb-6 bg-white/5 apple-slide-up stagger-2">
          {['0-60', '0-100', '100-200', '1/4mile'].map((v) => (
            <TabsTrigger key={v} value={v} className="rounded-xl flex-1 data-[state=active]:bg-yellow-500 data-[state=active]:text-black font-bold text-[9px] uppercase px-4">{v === '1/4mile' ? '1/4 MILE' : v}</TabsTrigger>
          ))}
        </TabsList>

        <div className="space-y-3">
          {['0-60', '0-100', '100-200', '1/4 Mile'].map((type) => (
            <TabsContent key={type} value={type === '1/4 Mile' ? '1/4mile' : type} className="m-0 space-y-3">
              {dragRankings(type).map((run: any, index: number) => (
                <LeaderboardCard key={run.id} driver={run} index={index} metric={`${run.dragTime?.toFixed(2)}s`} currentCity={cityFilter} />
              ))}
            </TabsContent>
          ))}
          {!isLoading && filteredRuns.length === 0 && (
            <div className="py-24 text-center opacity-40 apple-slide-up stagger-3"><p className="text-[11px] font-bold uppercase text-center">Nuk ka rekorde aktive për këtë qytet (5 ditët e fundit). 🏁</p></div>
          )}
        </div>
      </Tabs>
      <BottomNav />
    </div>
  );
}

function LeaderboardCard({ 
  driver, 
  index, 
  metric, 
  currentCity 
}: { 
  driver: any, 
  index: number, 
  metric: string, 
  currentCity: string 
}) {
  const isFirst = index === 0;
  const isSecond = index === 1;
  const isThird = index === 2;
  const isAdmin = driver.isAdmin === true;
  const staggerClass = index < 8 ? `stagger-${index + 1}` : 'opacity-100';

  return (
    <Card className={cn(
      "glass-card p-4 px-5 relative overflow-hidden group transition-all duration-300 rounded-[1.8rem] border-white/10 apple-slide-up w-full",
      staggerClass,
      isAdmin && "border-purple-500/40 bg-gradient-to-br from-purple-600/10 via-zinc-950 to-yellow-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      !isAdmin && isFirst && "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.15)]",
      isSecond && !isAdmin && "border-zinc-400/20 bg-gradient-to-br from-zinc-400/5 to-transparent",
      isThird && !isAdmin && "border-orange-600/20 bg-gradient-to-br from-orange-600/5 to-transparent"
    )}>
      {isAdmin && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-yellow-500 text-white rounded-bl-[1.2rem] flex items-center gap-2 shadow-lg z-20 apple-scale-in">
          <ShieldCheck className="w-3.5 h-3.5 fill-current" />
          <span className="text-[9px] font-black uppercase">APP FOUNDER</span>
        </div>
      )}

      {isFirst && !isAdmin && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-yellow-500 text-black rounded-bl-[1.2rem] flex items-center gap-2 shadow-lg z-20 apple-scale-in">
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span className="text-[9px] font-black uppercase">
            {currentCity === 'Mbarë Kosova' ? 'NR. 1 NË KOSOVË' : `NR. 1 NË ${currentCity.toUpperCase()}`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 relative z-10 h-14">
        <div className="flex flex-col items-center justify-center min-w-[28px] shrink-0">
          {index === 0 ? <Trophy className={cn("w-6 h-6", isAdmin ? "text-purple-400" : "text-yellow-500")} /> : 
           index === 1 ? <Medal className="w-6 h-6 text-zinc-400" /> :
           index === 2 ? <Medal className="w-6 h-6 text-orange-600" /> :
           <span className="text-[12px] font-bold text-muted-foreground/30">#{index + 1}</span>}
        </div>
        
        <Link href={`/profile/${driver.userId}`} className="w-11 h-11 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center shadow-lg shrink-0 overflow-hidden active:scale-90 relative">
           {isAdmin && <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />}
           <RenderCarIcon type={driver.profileIcon} className={cn("w-6 h-6 relative z-10", isAdmin ? "text-purple-400" : isFirst ? "text-yellow-500" : "text-white/60")} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-bold text-sm truncate uppercase", 
              isFirst ? "animate-text-yellow-cyan" : isAdmin ? "text-purple-400" : "text-white"
            )}>{driver.username}</h3>
            {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />}
            {isFirst && !isAdmin && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-pulse-glow" />}
          </div>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {driver.community && (
              <div className="flex items-center gap-1.5">
                <Users className="w-2.5 h-2.5 text-blue-500/50" />
                <span className="text-[8px] font-black uppercase animate-text-blue-grey">{driver.community}</span>
              </div>
            )}
            <div className="flex items-center gap-2 leading-none">
              <MapPin className={cn("w-2.5 h-2.5 shrink-0", isAdmin ? "text-purple-500" : isFirst ? "text-yellow-500" : "text-zinc-500")} />
              <span className="text-[8px] font-light text-muted-foreground uppercase truncate">{driver.city}</span>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0">
          <div className={cn(
            "text-xl font-bold leading-none",
            isAdmin ? "text-purple-400" : isFirst ? "text-yellow-500" : "text-white"
          )}>
            {metric.split(' ')[0]}
          </div>
          <div className="text-[9px] font-light text-muted-foreground uppercase leading-none mt-1.5">{metric.split(' ')[1]}</div>
        </div>
      </div>
    </Card>
  );
}
