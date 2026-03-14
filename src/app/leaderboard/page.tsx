
"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, MapPin, Zap, Crown, Loader2, Star, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { RenderCarIcon } from "@/components/icons/car-icons";
import { Button } from "@/components/ui/button";

const KOSOVO_CITIES = [
  "Mbarë Kosova", "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Mitrovicë", "Gjilan", "Ferizaj", 
  "Vushtrri", "Podujevë", "Rahovec", "Fushë Kosovë", "Suharekë", "Kaçanik", 
  "Skënderaj", "Lipjan", "Malishevë", "Drenas", "Deçan", "Klinë", "Kamenicë", 
  "Dragash", "Istog", "Viti", "Obiliq", "Leposaviq", "Graçanicë", "Hani i Elezit", 
  "Zveçan", "Shtime", "Novobërdë", "Zubin Potok", "Junik", "Mamushë", 
  "Ranillug", "Partesh", "Kllokot"
];

export default function LeaderboardPage() {
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState("top-speed");
  const [cityFilter, setCityFilter] = useState("Mbarë Kosova");
  const db = useFirestore();

  const publicRunsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user?.uid) return null;
    return query(
      collection(db, "public_runs"),
      orderBy("createdAt", "desc"),
      limit(1000)
    );
  }, [db, isUserLoading, user?.uid]);

  const { data: allRuns, isLoading } = useCollection(publicRunsQuery);

  const filteredRuns = useMemo(() => {
    if (!allRuns) return [];
    if (cityFilter === "Mbarë Kosova") return allRuns;
    return allRuns.filter(run => run.city === cityFilter);
  }, [allRuns, cityFilter]);

  const topSpeedRankings = useMemo(() => {
    const uniqueUsers: Record<string, any> = {};
    filteredRuns.forEach(run => {
      if (!uniqueUsers[run.userId] || (run.peakSpeedKmH || 0) > (uniqueUsers[run.userId].peakSpeedKmH || 0)) {
        uniqueUsers[run.userId] = run;
      }
    });
    return Object.values(uniqueUsers).sort((a: any, b: any) => (b.peakSpeedKmH || 0) - (a.peakSpeedKmH || 0));
  }, [filteredRuns]);

  const dragRankings = (type: string) => {
    const uniqueUsers: Record<string, any> = {};
    filteredRuns.filter(r => r.runType === type && r.dragTime).forEach(run => {
      if (!uniqueUsers[run.userId] || run.dragTime < uniqueUsers[run.userId].dragTime) {
        uniqueUsers[run.userId] = run;
      }
    });
    return Object.values(uniqueUsers).sort((a: any, b: any) => (a.dragTime || 999) - (b.dragTime || 999));
  };

  const zeroTo100Rankings = useMemo(() => dragRankings('0-100'), [filteredRuns]);
  const hundredTo200Rankings = useMemo(() => dragRankings('100-200'), [filteredRuns]);
  const quarterMileRankings = useMemo(() => dragRankings('1/4 Mile'), [filteredRuns]);

  const globalBestInKosovo = useMemo(() => {
    if (!allRuns) return {};
    const bests: Record<string, number> = {};
    bests['top-speed'] = Math.max(...allRuns.map(r => r.peakSpeedKmH || 0), 0);
    ['0-100', '100-200', '1/4 Mile'].forEach(type => {
      const typeRuns = allRuns.filter(r => r.runType === type && r.dragTime);
      if (typeRuns.length > 0) {
        bests[type] = Math.min(...typeRuns.map(r => r.dragTime));
      }
    });
    return bests;
  }, [allRuns]);

  if (isUserLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 safe-top relative no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-red-600/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-6 pb-2 relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <Trophy className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">🏆 RANKINGU</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] mt-1">👀 LIVE KOSOVA</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-muted-foreground px-1 tracking-widest">📍 FILTRO QYTETIN</Label>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full h-11 glass border-white/10 rounded-xl font-black italic uppercase text-[10px] bg-white/5">
              <SelectValue placeholder="Zgjidh Qytetin" />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 max-h-[260px]">
              {KOSOVO_CITIES.map(c => (
                <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase italic">📍 {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="top-speed" onValueChange={setActiveTab} className="w-full px-4 mt-2 relative z-10">
        <TabsList className="flex gap-1 overflow-x-auto no-scrollbar glass border-white/5 h-12 rounded-2xl p-1 shrink-0 mb-6 bg-white/5">
          <TabsTrigger value="top-speed" className="rounded-xl flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white font-black text-[8px] uppercase italic px-2">🔥 SHPEJTËSIA</TabsTrigger>
          <TabsTrigger value="0-100" className="rounded-xl flex-1 data-[state=active]:bg-accent data-[state=active]:text-background font-black text-[8px] uppercase italic px-2">0-100</TabsTrigger>
          <TabsTrigger value="100-200" className="rounded-xl flex-1 data-[state=active]:bg-accent data-[state=active]:text-background font-black text-[8px] uppercase italic px-2">100-200</TabsTrigger>
          <TabsTrigger value="1/4mile" className="rounded-xl flex-1 data-[state=active]:bg-accent data-[state=active]:text-background font-black text-[8px] uppercase italic px-2">1/4 MILE</TabsTrigger>
        </TabsList>

        <div className="space-y-2">
          <TabsContent value="top-speed" className="m-0 space-y-2">
            {topSpeedRankings.map((run: any, index: number) => (
              <LeaderboardCard 
                key={run.id} 
                driver={run} 
                index={index} 
                metric={`${run.peakSpeedKmH} km/h`} 
                runId={run.id} 
                isGlobalTop={run.peakSpeedKmH >= (globalBestInKosovo['top-speed'] || 0)}
                currentCity={cityFilter}
              />
            ))}
          </TabsContent>

          <TabsContent value="0-100" className="m-0 space-y-2">
            {zeroTo100Rankings.map((run: any, index: number) => (
              <LeaderboardCard 
                key={run.id} 
                driver={run} 
                index={index} 
                metric={`${run.dragTime?.toFixed(2)}s`} 
                runId={run.id} 
                isGlobalTop={run.dragTime <= (globalBestInKosovo['0-100'] || 999)}
                currentCity={cityFilter}
              />
            ))}
          </TabsContent>

          <TabsContent value="100-200" className="m-0 space-y-2">
            {hundredTo200Rankings.map((run: any, index: number) => (
              <LeaderboardCard 
                key={run.id} 
                driver={run} 
                index={index} 
                metric={`${run.dragTime?.toFixed(2)}s`} 
                runId={run.id} 
                isGlobalTop={run.dragTime <= (globalBestInKosovo['100-200'] || 999)}
                currentCity={cityFilter}
              />
            ))}
          </TabsContent>

          <TabsContent value="1/4mile" className="m-0 space-y-2">
            {quarterMileRankings.map((run: any, index: number) => (
              <LeaderboardCard 
                key={run.id} 
                driver={run} 
                index={index} 
                metric={`${run.dragTime?.toFixed(2)}s`} 
                runId={run.id} 
                isGlobalTop={run.dragTime <= (globalBestInKosovo['1/4 Mile'] || 999)}
                currentCity={cityFilter}
              />
            ))}
          </TabsContent>
          
          {!isLoading && filteredRuns.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <p className="text-[10px] font-black uppercase italic tracking-widest">Nuk ka rekorde për këtë qytet.</p>
            </div>
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
  runId, 
  isGlobalTop,
  currentCity 
}: { 
  driver: any, 
  index: number, 
  metric: string, 
  runId?: string,
  isGlobalTop?: boolean,
  currentCity?: string
}) {
  const isFirst = index === 0;

  return (
    <Card className={cn(
      "glass-card p-2 px-4 relative overflow-hidden group transition-all duration-300 rounded-[1.2rem] border-white/5",
      isFirst ? "border-accent/40 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent shadow-lg" : "hover:border-white/10"
    )}>
      {isFirst && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-accent text-background rounded-bl-lg flex items-center gap-1 shadow-md z-20">
          <Crown className="w-2.5 h-2.5 fill-current" />
          <span className="text-[7px] font-black uppercase tracking-tighter">
            {isGlobalTop || currentCity === 'Mbarë Kosova' ? '1# ne Kosove' : `1# ne ${currentCity}`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 relative z-10 h-10">
        <div className="flex flex-col items-center justify-center min-w-[24px]">
          {index === 0 ? <Trophy className="w-5 h-5 text-accent" /> : 
           index === 1 ? <Medal className="w-4 h-4 text-zinc-400" /> :
           index === 2 ? <Medal className="w-4 h-4 text-orange-600" /> :
           <span className="text-[10px] font-black text-muted-foreground/40 italic">#{index + 1}</span>}
        </div>
        
        <Link href={`/profile/${driver.userId}`} className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
           <RenderCarIcon type={driver.profileIcon} className="w-5 h-5 text-accent" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-black text-[10px] truncate uppercase text-white">{driver.username}</h3>
            {isFirst && <Star className="w-2 h-2 text-accent fill-accent animate-pulse" />}
          </div>
          <div className="flex items-center gap-1 leading-none">
            <MapPin className="w-1.5 h-1.5 text-accent" />
            <span className="text-[6.5px] font-black text-muted-foreground uppercase">📍 {driver.city}</span>
            <span className="text-[6.5px] font-bold text-muted-foreground/50 truncate uppercase ml-1">{driver.carBrand} {driver.carModel}</span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className={cn(
            "text-base font-black italic leading-none transition-colors",
            isFirst ? "text-accent" : "text-white"
          )}>
            {metric.split(' ')[0]}
          </div>
          <div className="text-[6px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">{metric.split(' ')[1]}</div>
        </div>
      </div>
      
      {isFirst && runId && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex justify-between items-center h-5">
           <Badge variant="outline" className="h-3.5 bg-accent/5 border-accent/20 text-accent text-[6px] font-black uppercase px-1.5">🔥 TOP REKORD</Badge>
           <Link href={`/race/${runId}`}>
             <span className="text-[7px] font-black uppercase text-accent hover:underline flex items-center gap-1">MUNDO KËTË 🔥 <ChevronRight className="w-2 h-2" /></span>
           </Link>
        </div>
      )}
    </Card>
  );
}
