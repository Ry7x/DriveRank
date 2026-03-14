
"use client"

import { useMemo, useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Timer, Zap, Flag, Gauge, History, Loader2, ChevronRight } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

export default function DragModulePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return rawRuns.filter(r => ["0-100", "100-200", "1/4 Mile"].includes(r.runType));
  }, [rawRuns]);

  const bestStats = useMemo(() => {
    const defaultStats = { "0-100": "--", "100-200": "--", "1/4 Mile": "--" };
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 safe-top relative no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">🏆 MODULI DRAG</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] mt-1">🔥 PERFORMANCA JOTE</p>
            </div>
          </div>
          <Badge className="bg-accent/10 border-accent/20 text-accent font-black py-1 px-3 rounded-xl italic">
            🔥 MODI PRO
          </Badge>
        </div>

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
              dragRuns.map((run) => (
                <Card key={run.id} className="glass-card border-white/5 p-4 rounded-[1.8rem] group hover:border-accent/20 transition-all flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    run.runType === "0-100" ? "bg-cyan-500/10 text-cyan-400" : 
                    run.runType === "100-200" ? "bg-purple-500/10 text-purple-500" : 
                    "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {run.runType === "0-100" ? <Zap className="w-6 h-6" /> : 
                     run.runType === "100-200" ? <Timer className="w-6 h-6" /> : 
                     <Flag className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black italic text-white uppercase">{run.runType}</h3>
                      <Badge variant="outline" className="text-[7px] font-black px-1.5 py-0 border-white/10 text-muted-foreground">📍 {run.city}</Badge>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                      {run.createdAt ? format(new Date(run.createdAt), "d MMMM, HH:mm", { locale: sq }) : ""}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-lg font-black italic text-accent leading-none">
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
                <p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">Ende nuk keni bërë gara Drag. 👀</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
