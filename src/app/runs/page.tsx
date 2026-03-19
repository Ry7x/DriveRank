
"use client"

import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { History, Calendar, MapPin, Share2, Loader2, Gauge, Clock, Timer } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { sq } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function RunsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const runsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "users", user.uid, "runs"),
      orderBy("createdAt", "desc")
    );
  }, [user, db]);

  const { data: runs, isLoading } = useCollection(runsQuery);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 safe-top">
      <div className="p-6 shrink-0 apple-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tighter uppercase">🏆 HISTORIKU I <span className="text-accent">GARAVE</span></h1>
          </div>
          <Badge className="bg-primary text-accent font-bold px-3">
            {isLoading ? "..." : (runs?.length || 0)}
          </Badge>
        </div>
      </div>

      <div className="px-4 space-y-4 overflow-y-auto no-scrollbar flex-1 pb-safe">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 apple-slide-up stagger-1">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-[10px] font-bold uppercase">Duke ngarkuar... 👀</p>
          </div>
        ) : runs && runs.length > 0 ? (
          runs.map((run, idx) => (
            <Card key={run.id} className={cn(
              "glass border-white/5 p-4 flex flex-col gap-4 rounded-3xl group hover:border-accent/20 transition-all apple-slide-up",
              idx < 6 ? `stagger-${idx + 1}` : ""
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-light text-muted-foreground uppercase tracking-widest">
                    {run.createdAt ? format(new Date(run.createdAt), "d MMMM, yyyy", { locale: sq }) : ""}
                  </span>
                </div>
                <Share2 className="w-4 h-4 text-muted-foreground hover:text-accent cursor-pointer" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Badge variant="outline" className="w-fit bg-accent/10 border-accent/20 text-accent font-bold mb-1 uppercase text-[9px]">
                    🔥 {run.runType || "GARË"}
                  </Badge>
                  <div className="flex items-baseline gap-1">
                    {run.runType === 'Top Speed' ? (
                      <span className="text-3xl font-bold text-white">
                        {run.peakSpeedKmH} <span className="text-xs">km/h</span>
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-3xl font-bold text-red-500">
                          {run.dragTime?.toFixed(2)} <span className="text-xs text-white">s</span>
                        </span>
                        <span className="text-[8px] font-light text-muted-foreground uppercase">SPEED: {run.peakSpeedKmH} KM/H</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-light text-muted-foreground uppercase tracking-widest mb-1">📍 DISTANCA</span>
                  <span className="text-xl font-bold text-white">{(run.distanceMeters / 1000).toFixed(2)} km</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-light uppercase text-muted-foreground">
                  <MapPin className="w-3 h-3 text-accent" />
                  📍 {run.city}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-light uppercase text-muted-foreground">
                  <Clock className="w-3 h-3 text-accent" />
                  {Math.floor(run.durationSeconds / 60)}:{(run.durationSeconds % 60).toFixed(2).padStart(5, '0')}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-white/5 apple-slide-up stagger-1">
            <Gauge className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-tighter">Nuk ka rekorde 👀</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
