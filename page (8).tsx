
"use client"

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Radio, Loader2, Zap, ShieldAlert, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser, useDoc, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, doc, getDocs, limit } from "firebase/firestore";
import { format, subHours } from "date-fns";
import { useDriving } from "@/context/driving-context";
import { reverseGeocode } from "@/services/navigation/geocodingService";

const RadarMap = dynamic(() => import("../../components/radar/radar-map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 animate-pulse rounded-3xl">
      <Loader2 className="w-10 h-10 animate-spin text-red-500" />
    </div>
  )
});

type ReportType = 'Radar' | 'Polici' | 'Kontrollë';

export default function RadarPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { speed, currentCoords, isDriving } = useDriving();
  const [mounted, setMounted] = useState(false);
  const [isReporting, setIsReporting] = useState<ReportType | null>(null);
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!user || isUserLoading || !db) return null;
    return doc(db, "users", user.uid);
  }, [user, isUserLoading, db]);
  const { data: profile } = useDoc(profileRef);

  const threeHoursAgo = useMemo(() => {
    const d = subHours(new Date(), 3);
    return d.toISOString();
  }, []);

  useEffect(() => {
    if (db && user?.uid && !isUserLoading) {
      const cleanupOldReports = async () => {
        try {
          const reportsCol = collection(db, "radar_reports");
          const userReportsQuery = query(
            reportsCol, 
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(userReportsQuery);
          
          if (!snapshot.empty) {
            snapshot.docs.forEach((reportDoc) => {
              const reportData = reportDoc.data();
              if (reportData.createdAt < threeHoursAgo) {
                deleteDocumentNonBlocking(doc(db, "radar_reports", reportDoc.id));
              }
            });
          }
        } catch (e) {
          console.error("Auto-cleanup dështoi:", e);
        }
      };
      cleanupOldReports();
    }
  }, [db, user?.uid, isUserLoading, threeHoursAgo]);

  const radarQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(
      collection(db, "radar_reports"),
      where("createdAt", ">=", threeHoursAgo),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, user, isUserLoading, threeHoursAgo]);

  const { data: reports, isLoading: isReportsLoading } = useCollection(radarQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReport = async (type: ReportType) => {
    if (!currentCoords || !user || !db) {
      toast({ variant: "destructive", title: "Gabim 📍", description: "GPS ose Auth nuk është gati." });
      return;
    }

    setIsReporting(type);
    const { lat, lng } = currentCoords;
    
    try {
      const geo = await reverseGeocode(lat, lng);
      
      const reportsCol = collection(db, "radar_reports");
      addDocumentNonBlocking(reportsCol, {
        type,
        lat,
        lng,
        location: geo.road,
        city: geo.city,
        neighborhood: geo.neighborhood,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });
      
      const emoji = type === 'Radar' ? '🚨' : type === 'Polici' ? '🚔' : '🚗';
      const locText = `${geo.city}${geo.neighborhood ? `, ${geo.neighborhood}` : ""}, ${geo.road}`;
      toast({ 
        title: `${emoji} U RAPORTUA LIVE!`, 
        description: `${type} në ${locText}.` 
      });
    } catch (e) {
      console.error("Raportimi dështoi:", e);
    } finally {
      setIsReporting(null);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground safe-top relative no-scrollbar pb-32 overflow-x-hidden">
      {isDriving && (
        <div className="fixed top-12 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="glass-card border-red-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl bg-zinc-950/80">
            <Zap className={cn("w-4 h-4", speed > 100 ? "text-red-500 animate-pulse" : "text-accent")} />
            <div className="flex flex-col items-end">
              <span className={cn("text-xl font-bold leading-none", speed > 100 ? "text-red-500" : "text-white")}>{speed}</span>
              <span className="text-[7px] font-bold uppercase text-muted-foreground">KM/H</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col gap-6 w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between apple-slide-up">
          <div className="flex items-center gap-2">
            <Radio className={cn("w-6 h-6 text-red-500", !isReportsLoading && "animate-pulse")} />
            <h1 className="text-xl font-bold tracking-tighter uppercase text-white">RADARËT <span className="text-red-500">LIVE</span></h1>
          </div>
          <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-500 text-[8px] font-bold uppercase px-3">
            🔥 3H AKTIV
          </Badge>
        </div>

        <div className="relative h-[280px] w-full glass rounded-3xl border-red-500/10 overflow-hidden shadow-2xl apple-scale-in">
          <RadarMap center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [42.6629, 21.1655]} alerts={reports || []} />
          <div className="absolute top-3 left-3 z-10">
             <Badge className="bg-red-600/80 backdrop-blur-md text-white font-bold text-[7px] px-2 py-0.5 rounded-lg uppercase flex items-center gap-1 shadow-xl">
               <ShieldAlert className="w-2.5 h-2.5" /> MONITORIM AKTIV
             </Badge>
          </div>
        </div>

        <div className="space-y-3 apple-slide-up stagger-1">
          <h2 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">RAPORTO TANI 🔥</h2>
          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => handleReport('Radar')} disabled={!!isReporting} className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white border-none shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isReporting === 'Radar' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xl">🚨</span>}
              <span className="text-[8px] font-bold uppercase">RADAR</span>
            </button>
            <button onClick={() => handleReport('Polici')} disabled={!!isReporting} className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isReporting === 'Polici' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xl">🚔</span>}
              <span className="text-[8px] font-bold uppercase">POLICI</span>
            </button>
            <button onClick={() => handleReport('Kontrollë')} disabled={!!isReporting} className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white border-none shadow-lg transition-all active:scale-95 disabled:opacity-50">
              {isReporting === 'Kontrollë' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xl">🚗</span>}
              <span className="text-[8px] font-bold uppercase">KONTROLLË</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 apple-slide-up stagger-2">
          <h2 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">👀 AKTIVITETI NË KOSOVË (3H)</h2>
          <div className="grid gap-3">
            {isReportsLoading ? (
              <div className="flex flex-col items-center py-10 opacity-50"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
            ) : reports && reports.length > 0 ? (
              reports.map((report, idx) => (
                <Card key={report.id} className={cn("glass border-white/5 p-4 flex items-center gap-4 rounded-3xl transition-all hover:border-red-500/20 apple-slide-up", idx < 6 ? `stagger-${idx + 1}` : "", report.type === "Radar" && "border-red-500/30 bg-red-500/5")}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-lg", report.type === 'Radar' ? "bg-red-600/20" : report.type === 'Polici' ? "bg-blue-600/20" : "bg-white/5")}>
                    {report.type === 'Radar' ? '🚨' : report.type === 'Polici' ? '🚔' : '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                       <MapPin className="w-3 h-3 text-white/40" />
                       <h3 className="text-[11px] font-bold uppercase truncate text-white">
                         {report.city}{report.neighborhood ? `, ${report.neighborhood}` : ""}, {report.location}
                       </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[8px] font-bold uppercase tracking-wider", report.type === 'Radar' ? "text-red-500" : "text-muted-foreground")}>🔥 {report.type} LIVE</p>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <p className="text-[8px] font-light text-accent uppercase tracking-widest">
                        raportuar në ora {report.createdAt ? format(new Date(report.createdAt), "HH:mm") : ""}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 glass border-white/5 rounded-3xl apple-slide-up stagger-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 text-center">Rrugët e Kosovës janë të pastra. 👀</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
