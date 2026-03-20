
"use client"

import { useMemo, useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { Trophy, Timer, Zap, Flag, Gauge, History, Loader2, ChevronRight } from "lucide-react";
=======
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { Trophy, Timer, Zap, Flag, Gauge, History, Loader2, ChevronRight, MapPin } from "lucide-react";
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

export default function DragModulePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
<<<<<<< HEAD
=======
  const [bestApi, setBestApi] = useState<CarouselApi>();
  const [bestIndex, setBestIndex] = useState(0);
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d

  useEffect(() => {
    setMounted(true);
  }, []);

<<<<<<< HEAD
=======
  useEffect(() => {
    if (!bestApi) return;
    const onSelect = () => setBestIndex(bestApi.selectedScrollSnap());
    bestApi.on("select", onSelect);
    return () => { bestApi.off("select", onSelect); };
  }, [bestApi]);

>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  const dragRunsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "runs"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: rawRuns, isLoading } = useCollection(dragRunsQuery);

  const dragRuns = useMemo(() => {
    if (!rawRuns) return [];
<<<<<<< HEAD
    return rawRuns.filter(r => ["0-100", "100-200", "1/4 Mile"].includes(r.runType));
  }, [rawRuns]);

  const bestStats = useMemo(() => {
    const defaultStats = { "0-100": "--", "100-200": "--", "1/4 Mile": "--" };
=======
    return rawRuns.filter(r => ["0-60", "0-100", "100-200", "1/4 Mile"].includes(r.runType));
  }, [rawRuns]);

  const bestStats = useMemo(() => {
    const defaultStats = { "0-60": "--", "0-100": "--", "100-200": "--", "1/4 Mile": "--" };
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    if (!dragRuns) return defaultStats;
    
    const bests: Record<string, string> = { ...defaultStats };
    
    dragRuns.forEach(run => {
      const type = run.runType;
      const time = run.dragTime;
      if (time) {
        if (bests[type] === "--" || time < parseFloat(bests[type])) {
          bests[type] = time.toFixed(2) + "s";
        }
      }
    });
    
    return bests;
  }, [dragRuns]);

  if (!mounted || isUserLoading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-background flex items-center justify-center">
=======
      <div className="min-h-screen bg-black flex items-center justify-center">
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 safe-top relative no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
=======
  const BEST_CARDS = [
    { type: "0-60", val: bestStats["0-60"], icon: Zap, color: "text-green-400", label: "Më i miri 0-60" },
    { type: "0-100", val: bestStats["0-100"], icon: Zap, color: "text-cyan-400", label: "Më i miri 0-100" },
    { type: "100-200", val: bestStats["100-200"], icon: Timer, color: "text-purple-500", label: "Më i miri 100-200" },
    { type: "1/4 Mile", val: bestStats["1/4 Mile"], icon: Flag, color: "text-yellow-500", label: "Më i miri 1/4 Mile" }
  ];

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground pb-32 safe-top relative no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10 space-y-6">
        <div className="flex items-center justify-between apple-slide-up">
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-accent" />
            </div>
            <div>
<<<<<<< HEAD
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">🏆 MODULI DRAG</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] mt-1">🔥 PERFORMANCA JOTE</p>
            </div>
          </div>
          <Badge className="bg-accent/10 border-accent/20 text-accent font-black py-1 px-3 rounded-xl italic">
=======
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">🏆 MODULI DRAG</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] mt-1.5">🔥 PERFORMANCA JOTE</p>
            </div>
          </div>
          <Badge className="bg-accent/10 border-accent/20 text-accent font-black py-1 px-3 rounded-xl">
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
            🔥 MODI PRO
          </Badge>
        </div>

<<<<<<< HEAD
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Më i miri 0-100 🥇", val: bestStats["0-100"], icon: Zap, color: "text-cyan-400" },
            { label: "Më i miri 100-200 🔥", val: bestStats["100-200"], icon: Timer, color: "text-purple-500" },
            { label: "Më i miri 1/4 Mile 🏆", val: bestStats["1/4 Mile"], icon: Flag, color: "text-yellow-500" }
          ].map((stat, i) => (
            <Card key={i} className="glass border-white/5 p-4 flex flex-col items-center gap-2 rounded-2xl shadow-xl">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <div className="text-center">
                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={cn("text-xs font-black italic", stat.val !== "--" ? "text-white" : "text-zinc-600")}>{stat.val}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4 pt-2">
=======
        <div className="apple-slide-up stagger-1">
          <Carousel setApi={setBestApi} opts={{ align: "center" }} className="w-full">
            <CarouselContent className="ml-0">
              {BEST_CARDS.map((card, i) => (
                <CarouselItem key={i} className="pl-0 basis-[85%] flex justify-center px-1">
                  <Card className="w-full glass border-white/5 p-8 flex flex-col items-center justify-center gap-4 rounded-[2.5rem] shadow-2xl min-h-[160px]">
                    <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center", card.color.replace('text', 'bg').replace('400', '400/10'))}>
                      <card.icon className={cn("w-8 h-8", card.color)} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{card.label}</p>
                      <p className={cn("text-4xl font-black", card.val !== "--" ? "text-white" : "text-zinc-600")}>{card.val}</p>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="flex justify-center gap-2.5 mt-6">
              {BEST_CARDS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-700",
                    bestIndex === i ? "w-8 bg-accent shadow-[0_0_10px_#4de0f4]" : "w-1.5 bg-white/10"
                  )} 
                />
              ))}
            </div>
          </Carousel>
        </div>

        <div className="space-y-4 pt-2 apple-slide-up stagger-2">
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> 👀 HISTORIKU DRAG
            </h2>
            <span className="text-[8px] font-bold text-accent uppercase">{dragRuns?.length || 0} GARAT E FUNDIT</span>
          </div>

          <div className="grid gap-3">
            {isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
            ) : dragRuns && dragRuns.length > 0 ? (
<<<<<<< HEAD
              dragRuns.map((run) => (
                <Card key={run.id} className="glass-card border-white/5 p-4 rounded-[1.8rem] group hover:border-accent/20 transition-all flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
=======
              dragRuns.map((run, idx) => (
                <Card key={run.id} className={cn(
                  "glass-card border-white/5 p-4 rounded-[1.8rem] group hover:border-accent/20 transition-all flex items-center gap-4 apple-slide-up",
                  idx < 5 ? `stagger-${idx + 3}` : ""
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    run.runType === "0-60" ? "bg-green-500/10 text-green-400" :
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                    run.runType === "0-100" ? "bg-cyan-500/10 text-cyan-400" : 
                    run.runType === "100-200" ? "bg-purple-500/10 text-purple-500" : 
                    "bg-yellow-500/10 text-yellow-500"
                  )}>
<<<<<<< HEAD
                    {run.runType === "0-100" ? <Zap className="w-6 h-6" /> : 
=======
                    {run.runType === "0-60" || run.runType === "0-100" ? <Zap className="w-6 h-6" /> : 
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                     run.runType === "100-200" ? <Timer className="w-6 h-6" /> : 
                     <Flag className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
<<<<<<< HEAD
                      <h3 className="text-sm font-black italic text-white uppercase">{run.runType}</h3>
=======
                      <h3 className="text-sm font-black text-white uppercase">{run.runType}</h3>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                      <Badge variant="outline" className="text-[7px] font-black px-1.5 py-0 border-white/10 text-muted-foreground">📍 {run.city}</Badge>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                      {run.createdAt ? format(new Date(run.createdAt), "d MMMM, HH:mm", { locale: sq }) : ""}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
<<<<<<< HEAD
                      <p className="text-lg font-black italic text-accent leading-none">
=======
                      <p className="text-lg font-black text-accent leading-none">
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                        {run.dragTime?.toFixed(2)}s
                      </p>
                      <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mt-1">KOHA</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-accent transition-colors" />
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center glass rounded-3xl border-white/5">
                <Gauge className="w-12 h-12 text-muted-foreground opacity-10 mx-auto mb-4" />
<<<<<<< HEAD
                <p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">Ende nuk keni bërë gara Drag. 👀</p>
=======
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ende nuk keni bërë gara Drag. 👀</p>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
