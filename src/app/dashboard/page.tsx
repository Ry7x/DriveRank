<<<<<<< HEAD

"use client"

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
=======
"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Zap, Loader2, Navigation, ShieldAlert, Timer, Flag, Trophy, Activity, MapPin, Crown, Star, Gauge, History, ArrowUpRight, StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, useCollection } from "@/firebase";
import { doc, collection, query, where, getCountFromServer, orderBy, limit } from "firebase/firestore";
import { useDriving, RunMode } from "@/context/driving-context";

const RouteMap = dynamic(() => import("@/components/telemetry/route-map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 rounded-3xl">
      <Loader2 className="w-6 h-6 animate-spin text-red-500" />
    </div>
  )
});

type ReportType = 'Radar' | 'Polici' | 'Kontrollë';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { 
    speed, isDriving, peakSpeed, tripTime, tripDistance, hasGps, 
    currentCoords, routePoints, telemetry, startTime,
    runMode, dragTime, isDragFinished, isWakeLockActive,
    setRunMode, startTrip, stopTrip, resetTrip 
  } = useDriving();
  
  const [mounted, setMounted] = useState(false);
  const [isReporting, setIsReporting] = useState<ReportType | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cityRank, setCityRank] = useState<number | null>(null);
  const [kosovoRank, setKosovoRank] = useState<number | null>(null);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!user?.uid || isUserLoading || !db) return null;
    return doc(db, "users", user.uid);
  }, [user?.uid, isUserLoading, db]);
  const { data: profile } = useDoc(profileRef);

  const reportsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "radar_reports"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);
  const { data: reports } = useCollection(reportsQuery);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const activeAlert = useMemo(() => {
    if (!reports || !currentCoords) return null;
    return reports.find(r => {
      const dist = calculateDistance(currentCoords.lat, currentCoords.lng, r.lat, r.lng);
      return dist < 2000;
    });
  }, [reports, currentCoords]);

  const telemetryStats = useMemo(() => {
    if (!telemetry || telemetry.length < 2) return { avgSpeed: 0, stops: 0, accels: 0 };
    
    let stops = 0;
    let accels = 0;
    
    for (let i = 1; i < telemetry.length; i++) {
      const prev = telemetry[i-1];
      const curr = telemetry[i];
      if (prev.speed > 5 && curr.speed < 2) stops++;
      if (curr.speed - prev.speed > 8) accels++;
    }
    
    const avgSpeed = Math.round(telemetry.reduce((acc, p) => acc + p.speed, 0) / telemetry.length);
    return { avgSpeed, stops, accels };
  }, [telemetry]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateRanks = async () => {
    if (!db || !profile) return;
    setIsRankingLoading(true);
    
    try {
      const publicRunsCol = collection(db, "public_runs");
      let kosovoQuery;
      let cityQuery;

      if (runMode === 'free') {
        const val = peakSpeed;
        if (val <= 0) return;
        kosovoQuery = query(publicRunsCol, where("runType", "==", "Top Speed"), where("peakSpeedKmH", ">", val));
        if (profile.city) {
          cityQuery = query(publicRunsCol, where("city", "==", profile.city), where("runType", "==", "Top Speed"), where("peakSpeedKmH", ">", val));
        }
      } else {
        const modeName = runMode === '0-100' ? '0-100' : runMode === '100-200' ? '100-200' : '1/4 Mile';
        const val = dragTime;
        if (!val) return;
        kosovoQuery = query(publicRunsCol, where("runType", "==", modeName), where("dragTime", "<", val));
        if (profile.city) {
          cityQuery = query(publicRunsCol, where("city", "==", profile.city), where("runType", "==", modeName), where("dragTime", "<", val));
        }
      }

      const kosovoSnapshot = await getCountFromServer(kosovoQuery);
      setKosovoRank(kosovoSnapshot.data().count + 1);

      if (cityQuery) {
        const citySnapshot = await getCountFromServer(cityQuery);
        setCityRank(citySnapshot.data().count + 1);
      }
    } catch (e) {
      console.error("Dështoi llogaritja e ranking:", e);
    } finally {
      setIsRankingLoading(false);
    }
  };

  useEffect(() => {
    if (isDragFinished && mounted && !showSummary) {
      setShowSummary(true);
      calculateRanks();
      toast({ title: "🏆 MISIONI U KRYE!", description: `Koha jote: ${dragTime?.toFixed(2)}s` });
    }
  }, [isDragFinished, dragTime, mounted, showSummary]);

  const handleStartMission = () => startTrip();

  const handleStopMission = () => {
    stopTrip();
    setShowSummary(true);
    calculateRanks();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rpm = useMemo(() => {
    if (speed === 0) return 800;
    const gear = Math.floor(speed / 60) + 1;
    const speedInGear = speed % 60;
    const baseRpm = 1200 + (gear * 100);
    const calculated = baseRpm + (speedInGear * 110);
    return Math.min(Math.floor(calculated), 8000);
  }, [speed]);

  const handleQuickReport = async (type: ReportType) => {
    if (!db || !currentCoords || !user?.uid) {
      toast({ variant: "destructive", title: "GABIM 📍", description: "Lejoni GPS-in për të raportuar." });
      return;
    }
    setIsReporting(type);
    
    let locationName = profile?.city || "Kosovë";
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentCoords.lat}&lon=${currentCoords.lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.address) {
        const address = data.address;
        const road = address.road || address.pedestrian || address.street || address.residential || "";
        const area = address.suburb || address.neighbourhood || address.village || "";
        const city = address.city || address.town || address.village || "";
        locationName = [road, area, city].filter(Boolean).slice(0, 2).join(", ") || locationName;
      }
    } catch (e) { console.warn("Geocoding dështoi"); }

    const reportsCol = collection(db, "radar_reports");
    addDocumentNonBlocking(reportsCol, {
      type,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      location: locationName,
      city: profile?.city || "Kosovë",
      createdAt: new Date().toISOString(),
      userId: user?.uid
    });
    
    setTimeout(() => {
      setIsReporting(null);
      const emoji = type === 'Radar' ? '🚨' : type === 'Polici' ? '🚔' : '🚗';
      toast({ title: `${emoji} U RAPORTUA!`, description: `${type} shënuar në: 📍 ${locationName}` });
    }, 400);
  };

  const handleSaveRun = () => {
    if (!user?.uid || !db || !profile) return;
    setIsSaving(true);
    const runData = {
      userId: user.uid,
      username: profile.username,
      carBrand: profile.carBrand,
      carModel: profile.carModel,
      profileIcon: profile.profileIcon,
      city: profile.city || "Prishtinë",
      runType: runMode === 'free' ? 'Top Speed' : runMode === '0-100' ? '0-100' : runMode === '100-200' ? '100-200' : '1/4 Mile',
      startTime: startTime?.toISOString() || new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: tripTime,
      peakSpeedKmH: peakSpeed,
      distanceMeters: tripDistance,
      dragTime: dragTime,
      telemetry: telemetry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      carProfileId: "primary"
    };
    
    const userRunsCol = collection(db, "users", user.uid, "runs");
    addDocumentNonBlocking(userRunsCol, runData);
    
    const publicRunsCol = collection(db, "public_runs");
    addDocumentNonBlocking(publicRunsCol, runData);
    
    toast({ title: "🏆 U RUAJT!", description: "Të dhënat u sinkronizuan në Ranking." });
    setIsSaving(false);
    setShowSummary(false);
    resetTrip();
    setCityRank(null);
    setKosovoRank(null);
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground pb-24 overflow-x-hidden safe-top relative no-scrollbar">
      <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="p-4 space-y-4 z-20 shrink-0">
        {!hasGps && (
          <Alert variant="destructive" className="rounded-2xl bg-red-950/40 border-red-500/50 backdrop-blur-xl animate-pulse-red">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-red-500">📍 KËRKOHET LOKACIONI</AlertTitle>
            <AlertDescription className="text-[9px] font-bold opacity-90 uppercase leading-relaxed text-red-100">
              Lejoni qasjen në GPS për të matur performancën dhe raportuar radarët.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full", isWakeLockActive ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-zinc-700")} />
             <span className="text-[7px] font-black uppercase text-muted-foreground tracking-[0.2em]">
               {isWakeLockActive ? "🔥 SPORT_HUD AKTIV" : "SPORT_HUD GATI"}
             </span>
           </div>
           <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 text-muted-foreground bg-white/5 py-0.5 tracking-widest">
             {hasGps ? "👀 LIDHJA TELEMETRIKE" : "KËRKOHET GPS..."}
           </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          <Button onClick={() => handleQuickReport('Radar')} disabled={!!isReporting} className="h-16 flex flex-col gap-1 rounded-2xl glass-card bg-red-600/10 border-red-500/30 text-white active:scale-95 transition-all shadow-lg hover:bg-red-600/20">
            {isReporting === 'Radar' ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : <span className="text-2xl">🚨</span>}
            <span className="text-[8px] font-black uppercase tracking-widest text-red-500">RADAR</span>
          </Button>
          <Button onClick={() => handleQuickReport('Polici')} disabled={!!isReporting} className="h-16 flex flex-col gap-1 rounded-2xl glass-card bg-blue-600/10 border-blue-500/30 text-white active:scale-95 transition-all shadow-lg hover:bg-blue-600/20">
            {isReporting === 'Polici' ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <span className="text-2xl">🚔</span>}
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">POLICI</span>
          </Button>
          <Button onClick={() => handleQuickReport('Kontrollë')} disabled={!!isReporting} className="h-16 flex flex-col gap-1 rounded-2xl glass-card bg-zinc-800/30 border-white/10 text-white active:scale-95 transition-all shadow-lg">
            {isReporting === 'Kontrollë' ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400" /> : <span className="text-2xl">🚗</span>}
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">KONTROLLË</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-2 overflow-visible">
        <div className="grid grid-cols-4 gap-2 w-full max-w-[340px] mb-6 z-20">
          {[
            { id: 'free', label: 'LIRË 👀', icon: Navigation },
            { id: '0-100', label: '0-100 🔥', icon: Zap },
            { id: '100-200', label: '100-200 ⏱️', icon: Timer },
            { id: '1/4mile', label: '1/4 MILE 🏁', icon: Flag }
          ].map((mode) => (
            <Button 
              key={mode.id}
              onClick={() => !isDriving && setRunMode(mode.id as RunMode)}
              className={cn(
                "h-12 flex flex-col gap-1 rounded-xl border transition-all text-[7px] font-black uppercase z-10",
                runMode === mode.id 
                  ? `bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]` 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10",
                isDriving && "opacity-50 cursor-not-allowed"
              )}
            >
              <mode.icon className="w-3.5 h-3.5" />
              {mode.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full aspect-square flex items-center justify-center max-w-[340px] mx-auto overflow-visible mb-6">
          <div className="w-full h-full relative flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="w-full h-full transform -rotate-90 overflow-visible absolute inset-0">
              <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/[0.05]" />
              <circle
                cx="200" cy="200" r="180"
                stroke="currentColor" strokeWidth="12" strokeLinecap="butt"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 180}
                style={{ 
                  strokeDashoffset: (2 * Math.PI * 180) - (rpm / 8000) * (2 * Math.PI * 180),
                  transition: 'stroke-dashoffset 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className={cn(
                  "transition-all",
                  rpm > 7000 ? "text-red-600 shadow-[0_0_40px_rgba(220,38,38,1)]" : 
                  rpm > 6000 ? "text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]" : 
                  "text-accent drop-shadow-[0_0_15px_rgba(77,224,244,0.5)]"
                )}
              />
              {Array.from({ length: 60 }).map((_, i) => (
                <line
                  key={i} x1="200" y1="12" x2="200" y2={i % 5 === 0 ? "35" : "28"}
                  transform={`rotate(${i * 6} 200 200)`}
                  className={cn(
                    "transition-colors duration-200",
                    (i * 6) <= (rpm / 8000 * 360) ? (rpm > 6500 ? "text-red-500" : "text-accent") : (i >= 52 ? "text-red-950/60" : "text-white/10")
                  )}
                  stroke="currentColor" strokeWidth={i % 5 === 0 ? "4" : "1"}
                />
              ))}
            </svg>
            
            <div className="z-20 flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-2">
                 <Activity className={cn("w-3.5 h-3.5", rpm > 6500 ? "text-red-500 animate-pulse" : "text-accent")} />
                 <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">👀 TELEMETRIA LIVE</span>
              </div>
              <span className={cn(
                "font-black tracking-tighter leading-none transition-all duration-150 tabular-nums text-white drop-shadow-[0_0_20px_rgba(77,224,244,0.3)]",
                speed > 99 ? "text-[8.5rem]" : "text-[10rem]",
                speed > 100 && "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]"
              )}>
                {speed}
              </span>
              <div className="flex flex-col items-center -mt-6">
                <span className={cn("text-[14px] font-black uppercase tracking-[0.8em] opacity-90", speed > 100 ? "text-red-500" : "text-accent")}>KM / H</span>
                <div className="mt-10 flex flex-col items-center gap-2">
                  {activeAlert ? (
                    <div className="flex items-center gap-3 bg-red-600/30 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
                      <span className="text-xl">{activeAlert.type === 'Radar' ? '🚨' : activeAlert.type === 'Polici' ? '🚔' : '🚗'}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">KUJDES: {activeAlert.type.toUpperCase()}</span>
                        <span className="text-[8px] font-bold text-white uppercase truncate max-w-[120px] mt-1">{activeAlert.location}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-zinc-950/80 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#4de0f4]" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">RRUGËT E PASTRA 👀</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[320px] z-20 space-y-4">
          <Button 
            onClick={() => isDriving ? handleStopMission() : handleStartMission()} 
            className={cn(
              "w-full h-16 rounded-2xl font-black text-lg uppercase italic tracking-tighter transition-all shadow-2xl active:scale-95 border-b-4", 
              "bg-red-600 hover:bg-red-700 text-white border-red-900 shadow-[0_10px_30px_rgba(220,38,38,0.4)]"
            )}
          >
            {isDriving ? <span>STOP</span> : <span>Start Trip</span>}
          </Button>
          
          <div className="grid grid-cols-2 gap-3 px-1">
            <Card className="glass-card p-4 flex flex-col items-center rounded-2xl group hover:border-accent/30 transition-all sporty-gradient">
              <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">📍 DISTANCA</span>
              <span className="text-sm font-black text-white">{(tripDistance / 1000).toFixed(2)} KM</span>
            </Card>
            <Card className="glass-card p-4 flex flex-col items-center rounded-2xl group hover:border-red-500/30 transition-all sporty-gradient">
              <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">🏆 SHPEJTËSIA MAX</span>
              <span className="text-sm font-black text-red-500">{peakSpeed} KM/H</span>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="glass border-white/10 w-[94%] sm:max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-0 shadow-2xl">
          <div className="p-8 space-y-6 sporty-gradient">
            <DialogHeader className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-red-600/20 rounded-2xl flex items-center justify-center shadow-lg border border-red-500/30">
                <Trophy className="w-7 h-7 text-red-500" />
              </div>
              <DialogTitle className="text-lg font-black uppercase tracking-tighter text-center mt-2">DriveRank Pro 🏆</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">📊 STATISTIKAT E RRUGËTIMIT</h3>
                  <Badge variant="outline" className="text-[8px] font-bold text-accent border-accent/20 bg-accent/5">LIVE TELEMETRY</Badge>
                </div>
                <Card className="glass-card border-white/10 p-5 rounded-[2rem] space-y-4 bg-zinc-950/50">
                  <div className="h-44 w-full rounded-[1.8rem] border border-white/5 overflow-hidden relative shadow-inner bg-zinc-950">
                    <RouteMap points={routePoints} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 border border-white/5 p-3 flex flex-col items-center rounded-xl sporty-gradient">
                      <Timer className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                      <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">KOHA</span>
                      <span className="text-xs font-black text-white mt-1">{formatTime(tripTime)}</span>
                    </div>
                    <div className="bg-white/5 border border-accent/20 p-3 flex flex-col items-center rounded-xl sporty-gradient">
                      <MapPin className="w-3.5 h-3.5 text-accent mb-1" />
                      <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">DISTANCA</span>
                      <span className="text-xs font-black text-accent mt-1">{(tripDistance / 1000).toFixed(2)} km</span>
                    </div>
                    <div className="bg-white/5 border border-red-500/20 p-3 flex flex-col items-center rounded-xl sporty-gradient">
                      <Trophy className="w-3.5 h-3.5 text-red-500 mb-1" />
                      <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">MAX</span>
                      <span className="text-xs font-black text-red-500 mt-1">{peakSpeed} km/h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col items-center">
                       <Gauge className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                       <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest text-center">MESATARJA</span>
                       <span className="text-xs font-black text-white mt-0.5">{telemetryStats.avgSpeed} km/h</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <StopCircle className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                       <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest text-center">NDALESA</span>
                       <span className="text-xs font-black text-white mt-0.5">{telemetryStats.stops}</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <Zap className="w-3.5 h-3.5 text-red-500 mb-1" />
                       <span className="text-[6px] font-black text-muted-foreground uppercase tracking-widest text-center">NXITIME</span>
                       <span className="text-xs font-black text-red-500 mt-0.5">{telemetryStats.accels}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent px-1">Kalkulimet e Ranking Stats</h3>
                <Card className="glass-card border-accent/30 bg-accent/5 p-5 rounded-[2rem] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-10"><Crown className="w-12 h-12 text-accent" /></div>
                   {isRankingLoading ? (
                     <div className="flex flex-col items-center py-4 gap-2">
                       <Loader2 className="w-6 h-6 animate-spin text-accent" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Duke llogaritur pozicionin...</span>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg">
                             <Star className="w-5 h-5 text-background fill-background" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black text-accent uppercase tracking-widest">DriveRank Pro Stats</span>
                             <span className="text-sm font-black text-white uppercase italic">#{cityRank || '--'} në {profile?.city || "Qytet"} 📍</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                           <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                             <div className="flex items-center gap-2">
                               <MapPin className="w-3 h-3 text-accent" />
                               <span className="text-[10px] font-black uppercase text-muted-foreground">{profile?.city || "QYTETI"}</span>
                             </div>
                             <span className="text-sm font-black text-white">#{cityRank || '--'} në {profile?.city || "Qytetin tënd"} 📍</span>
                           </div>
                           <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-red-500/20">
                             <div className="flex items-center gap-2">
                               <Flag className="w-3 h-3 text-red-500" />
                               <span className="text-[10px] font-black uppercase text-muted-foreground">KOSOVË</span>
                             </div>
                             <span className="text-sm font-black text-red-500">#{kosovoRank || '--'} në Kosovë 🔥</span>
                           </div>
                        </div>
                     </div>
                   )}
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleSaveRun} disabled={isSaving || isRankingLoading} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 border-b-4 border-red-900">RUAJ TË DHËNAT 🔥</Button>
              <Button variant="ghost" className="w-full h-10 rounded-xl font-black uppercase text-[9px] text-zinc-500 hover:text-white" onClick={() => { setShowSummary(false); resetTrip(); setCityRank(null); setKosovoRank(null); }}>ANULO DHE FSHIJ 👀</Button>
=======
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Loader2, Timer, Trophy, RotateCcw, Gauge, Zap, Square, MapPin, Star, ChevronRight, X, Activity, Signal, SignalHigh, SignalLow, Play, AlertCircle, ShieldAlert, Radio, Navigation, CircleSlash, RefreshCcw, TrendingUp, ArrowDown, InfoIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, useCollection, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { subDays, subHours } from "date-fns";
import { useDriving, RunMode } from "@/context/driving-context";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/telemetry/route-map"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse rounded-[1.8rem] flex items-center justify-center text-[8px] font-medium text-white/20 uppercase">Duke hapur hartën...</div>
});

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const polarToCartesian = (cX: number, cY: number, rad: number, angleDeg: number) => {
    const rads = ((angleDeg - 90) * Math.PI) / 180.0;
    return { x: cX + rad * Math.cos(rads) };
  };
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = [
    "M", start.x, 170 + radius * Math.sin(((endAngle - 90) * Math.PI) / 180.0),
    "A", radius, radius, 0, largeArcFlag, 0, end.x, 170 + radius * Math.sin(((startAngle - 90) * Math.PI) / 180.0)
  ].join(" ");
  return d;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const {
    speed, acceleration, isDriving, peakSpeed, tripTime, tripDistance, gpsAccuracy, hasGps,
    startTrip, startDragCountdown, stopTrip, resetTrip,
    runMode, setRunMode, dragTime, currentCoords,
    lastRunSummary, setLastRunSummary, countdown, isJumpStart, isWaitingForLaunch
  } = useDriving();

  const [mounted, setMounted] = useState(false);
  const [activeModule, setActiveModule] = useState<'top-speed' | 'drag'>('top-speed');
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dismissedRadarId, setDismissedRadarId] = useState<string | null>(null);
  
  const [summaryApi, setSummaryApi] = useState<CarouselApi>();
  const [summaryIndex, setSummaryIndex] = useState(0);

  // PREDICTIVE UI SPEED ENGINE
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const targetSpeedRef = useRef(0);
  const accelRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    targetSpeedRef.current = speed;
    accelRef.current = acceleration;
  }, [speed, acceleration]);

  useEffect(() => {
    const animate = (time: number) => {
      const dt = (time - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = time;

      setDisplaySpeed(prev => {
        const target = targetSpeedRef.current;
        const currentAccel = accelRef.current;
        
        let next = prev + (currentAccel * 3.6) * dt;
        const diff = target - next;
        next += diff * 1.0; 

        if (target === 0 && next < 1) return 0;
        if (Math.abs(target - next) > 15) return target;
        
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    if (lastRunSummary) {
      setShowSummary(true);
    } else {
      setShowSummary(false);
    }
  }, [lastRunSummary]);

  useEffect(() => {
    if (!summaryApi) return;
    const onSelect = () => {
      setSummaryIndex(summaryApi.selectedScrollSnap());
    };
    summaryApi.on("select", onSelect);
    return () => {
      summaryApi.off("select", onSelect);
    };
  }, [summaryApi]);

  const profileRef = useMemoFirebase(() => (!user?.uid || isUserLoading || !db ? null : doc(db, "users", user.uid)), [user?.uid, isUserLoading, db]);
  const { data: profile } = useDoc(profileRef);

  const fiveDaysAgo = useMemo(() => subDays(new Date(), 5).toISOString(), []);
  const threeHoursAgo = useMemo(() => subHours(new Date(), 3).toISOString(), []);

  const publicRunsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "public_runs"), 
      where("createdAt", ">=", fiveDaysAgo),
      limit(1000)
    );
  }, [db, user, fiveDaysAgo]);
  
  const { data: allPublicRuns } = useCollection(publicRunsQuery);

  const radarReportsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "radar_reports"),
      where("createdAt", ">=", threeHoursAgo),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user, threeHoursAgo]);

  const { data: radarReports } = useCollection(radarReportsQuery);

  const activeRadarAlert = useMemo(() => {
    if (!currentCoords || !radarReports) return null;
    
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const p1 = lat1 * Math.PI / 180;
      const p2 = lat2 * Math.PI / 180;
      const dp = (lat2 - lat1) * Math.PI / 180;
      const dl = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const nearby = radarReports.map(r => ({
      ...r,
      currentDistance: calculateDistance(currentCoords.lat, currentCoords.lng, r.lat, r.lng)
    })).filter(r => r.currentDistance <= 2000)
       .sort((a, b) => a.currentDistance - b.currentDistance);

    return nearby.length > 0 ? nearby[0] : null;
  }, [currentCoords, radarReports]);

  const getRank = useCallback((type: string, value: number, city?: string) => {
    if (!allPublicRuns) return 0;
    const isTimeBased = ['0-60', '0-100', '100-200', '1/4 Mile'].includes(type);
    const cityRuns = city && city !== "Mbarë Kosova" ? allPublicRuns.filter(r => r.city === city) : allPublicRuns;
    const typeRuns = cityRuns.filter(r => r.runType === type);
    const bestPerUser: Record<string, number> = {};
    typeRuns.forEach(r => {
      const val = isTimeBased ? r.dragTime : r.peakSpeedKmH;
      if (val === null || val === undefined) return;
      if (!bestPerUser[r.userId]) bestPerUser[r.userId] = val;
      else bestPerUser[r.userId] = isTimeBased ? Math.min(bestPerUser[r.userId], val) : Math.max(bestPerUser[r.userId], val);
    });
    const betterUsers = Object.values(bestPerUser).filter(val => isTimeBased ? val < value : val > value);
    return betterUsers.length + 1;
  }, [allPublicRuns]);

  const currentRunRanks = useMemo(() => {
    if (!lastRunSummary || !profile) return { city: 0, kosovo: 0 };
    if (lastRunSummary.runType === 'ALL') return { city: 0, kosovo: 0 }; 
    const val = ['0-60', '0-100', '100-200', '1/4 Mile'].includes(lastRunSummary.runType) ? lastRunSummary.time : lastRunSummary.peakSpeed;
    return { 
      city: getRank(lastRunSummary.runType, val, profile.city), 
      kosovo: getRank(lastRunSummary.runType, val) 
    };
  }, [lastRunSummary, getRank, profile]);

  const personalBestInfo = useMemo(() => {
    if (!lastRunSummary || !profile || lastRunSummary.runType === 'Top Speed') return null;
    
    const runType = lastRunSummary.runType;
    const pbKey = runType === '0-60' ? 'best_0_60' :
                  runType === '0-100' ? 'best_0_100' :
                  runType === '100-200' ? 'best_100_200' :
                  runType === '1/4 Mile' ? 'best_1_4_mile' : null;
    
    if (!pbKey) return null;
    
    const currentPB = profile[pbKey];
    const currentTime = lastRunSummary.time;
    
    if (!currentPB) {
      return { isNewBest: true, label: "Rekordi i parë i regjistruar", diff: null };
    }
    
    if (currentTime < currentPB) {
      const diff = (currentPB - currentTime).toFixed(2);
      return { isNewBest: true, label: "🔥 Personal Best!", diff: `-${diff}s përmirësim` };
    } else {
      const diff = (currentTime - currentPB).toFixed(2);
      return { isNewBest: false, label: "Më i miri yt: " + currentPB.toFixed(2) + "s", diff: `+${diff}s më ngadalë se rekordi` };
    }
  }, [lastRunSummary, profile]);

  useEffect(() => { setMounted(true); }, []);

  const handleModuleChange = (module: 'top-speed' | 'drag') => {
    setActiveModule(module);
    setRunMode(module === 'top-speed' ? 'free' : '0-100');
  };

  const themeColor = activeModule === 'drag' ? "#eab308" : "#ffffff";

  const handleSaveToLeaderboard = async () => {
    if (!db || !user || !lastRunSummary || !profile || !profileRef) return;
    setIsSaving(true);
    try {
      const baseRun = {
        userId: user.uid,
        username: profile.username,
        community: profile.community || "Tjetër",
        profileIcon: profile.profileIcon || "speedometer",
        isAdmin: profile.isAdmin || false,
        city: profile.city || "Kosovë",
        carBrand: profile.carBrand || "Unknown",
        carModel: profile.carModel || "Unknown",
        telemetry: lastRunSummary.telemetry || [],
        path: (lastRunSummary.points || []).map(p => ({ lat: p[0], lng: p[1] })),
        createdAt: new Date().toISOString(),
        brakes: lastRunSummary.brakes,
        turns: lastRunSummary.turns,
        lowSpeedPasses: lastRunSummary.lowSpeedPasses,
        maxGForce: lastRunSummary.maxGForce
      };

      const profileUpdates: any = {};

      if (lastRunSummary.runType === 'ALL' && lastRunSummary.allStats) {
        Object.entries(lastRunSummary.allStats).forEach(([type, time]) => {
          if (time) {
            const runData = {
              ...baseRun,
              runType: type,
              dragTime: parseFloat(time.toFixed(2)),
              peakSpeedKmH: lastRunSummary.peakSpeed,
              distanceMeters: lastRunSummary.distance,
              durationSeconds: time,
            };
            addDocumentNonBlocking(collection(db, "public_runs"), runData);
            addDocumentNonBlocking(collection(db, "users", user.uid, "runs"), runData);

            const pbKey = type === '0-60' ? 'best_0_60' :
                          type === '0-100' ? 'best_0_100' :
                          type === '100-200' ? 'best_100_200' :
                          type === '1/4 Mile' ? 'best_1_4_mile' : null;
            
            if (pbKey && (!profile[pbKey] || time < profile[pbKey])) {
              profileUpdates[pbKey] = time;
            }
          }
        });
      } else {
        const runData = {
          ...baseRun,
          runType: lastRunSummary.runType,
          dragTime: ['0-60', '0-100', '100-200', '1/4 Mile'].includes(lastRunSummary.runType) ? parseFloat(lastRunSummary.time.toFixed(2)) : null,
          peakSpeedKmH: lastRunSummary.peakSpeed,
          distanceMeters: lastRunSummary.distance,
          durationSeconds: lastRunSummary.time,
        };
        addDocumentNonBlocking(collection(db, "public_runs"), runData);
        addDocumentNonBlocking(collection(db, "users", user.uid, "runs"), runData);

        const runType = lastRunSummary.runType;
        const pbKey = runType === '0-60' ? 'best_0_60' :
                      runType === '0-100' ? 'best_0_100' :
                      runType === '100-200' ? 'best_100_200' :
                      runType === '1/4 Mile' ? 'best_1_4_mile' : null;
        
        if (pbKey && (!profile[pbKey] || lastRunSummary.time < profile[pbKey])) {
          profileUpdates[pbKey] = lastRunSummary.time;
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        updateDocumentNonBlocking(profileRef, profileUpdates);
      }
      
      setLastRunSummary(null);
      router.push(lastRunSummary.runType === 'Top Speed' ? "/leaderboard" : "/drag-ranking");
    } finally { setIsSaving(false); }
  };

  const gpsStatus = useMemo(() => {
    if (!hasGps) return { icon: SignalLow, color: "text-red-500", label: "Jo GPS" };
    if (gpsAccuracy === null) return { icon: Signal, color: "text-zinc-500", label: "KËRKIM..." };
    if (gpsAccuracy < 10) return { icon: SignalHigh, color: "text-green-500", label: "PRO" };
    if (gpsAccuracy < 30) return { icon: Signal, color: "text-yellow-500", label: "MIRË" };
    return { icon: SignalLow, color: "text-orange-500", label: "DOBËT" };
  }, [hasGps, gpsAccuracy]);

  if (!mounted || isUserLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

  const rpmValue = Math.min((displaySpeed / 240) * 8, 8.5);
  const startAngle = 135; 
  const currentProgressAngle = startAngle + (rpmValue / 8) * (405 - 135);

  const isDragModule = activeModule === 'drag';

  return (
    <div className="flex flex-col h-full w-full text-white pb-32 overflow-x-hidden safe-top relative bg-black no-scrollbar">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-black to-black pointer-events-none z-0" />

      <div className="absolute top-12 left-6 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/5 apple-slide-up">
        <gpsStatus.icon className={cn("w-3 h-3", gpsStatus.color)} />
        <span className="text-[8px] font-medium uppercase">{gpsStatus.label}</span>
        {gpsAccuracy !== null && <span className="text-[8px] font-light text-white/30">{Math.round(gpsAccuracy)}m</span>}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-[360px] mx-auto">
        <div className="flex items-center gap-1.5 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-3xl apple-slide-up w-fit relative">
          <button onClick={() => handleModuleChange('top-speed')} className={cn("px-4 py-2.5 rounded-xl font-medium text-[9px] uppercase transition-all flex items-center gap-1.5", activeModule === 'top-speed' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white")}><Gauge className="w-3.5 h-3.5" /> Top Speed</button>
          <button onClick={() => handleModuleChange('drag')} className={cn("px-4 py-2.5 rounded-xl font-medium text-[9px] uppercase transition-all flex items-center gap-1.5", activeModule === 'drag' ? "bg-yellow-500 text-black shadow-[0_0_15px_#eab308]" : "text-white/40 hover:text-white")}><Zap className="w-3.5 h-3.5" /> Modi Drag</button>
          
          {isDragModule && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-1 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all">
                  <InfoIcon className="w-4 h-4 text-yellow-500" />
                </button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 rounded-[2.5rem] p-8 max-w-[340px] apple-scale-in">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-3xl flex items-center justify-center border border-yellow-500/20">
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                  <DialogTitle className="text-xl font-medium text-center">Si funksionon modi Drag?</DialogTitle>
                  <div className="space-y-4 w-full">
                    {[
                      { icon: Gauge, t: "Ndalo plotësisht", d: "Makina duhet të jetë në 0 km/h për të nisur garën." },
                      { icon: Play, t: "Nis garën", d: "Kliko butonin dhe prit dritën e gjelbër të semaforit." },
                      { icon: TrendingUp, t: "Matja e saktë", d: "Kronometri nis automatikasht sapo detektohet lëvizja e parë pas dritës." },
                      { icon: Trophy, t: "Objektivi", d: "Gara mbaron saktësisht në milisekondën që kapni shpejtësinë target." }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><step.icon className="w-4 h-4 text-yellow-500/60" /></div>
                        <div>
                          <p className="text-[11px] font-medium text-white/80">{step.t}</p>
                          <p className="text-[10px] font-light text-white/40 leading-relaxed mt-0.5">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogClose asChild>
                    <Button className="w-full h-12 rounded-2xl bg-yellow-500 text-black font-medium uppercase shadow-xl">Kuptova!</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {activeRadarAlert && dismissedRadarId !== activeRadarAlert.id && (
          <div className="w-full mb-6 apple-slide-up stagger-1 px-2">
            <div className="glass-card border-red-500/30 bg-red-600/5 p-4 rounded-[2rem] flex items-center gap-4 shadow-2xl relative overflow-hidden group">
              <button 
                onClick={() => setDismissedRadarId(activeRadarAlert.id)}
                className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-50" />
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] shrink-0 animate-pulse-glow z-10">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 z-10">
                <p className="text-[9px] font-medium text-red-500 uppercase mb-0.5">⚠️ {activeRadarAlert.type.toUpperCase()} LIVE</p>
                <h3 className="text-sm font-medium text-white truncate uppercase">{activeRadarAlert.location || activeRadarAlert.city}</h3>
                <p className="text-[8px] font-medium text-white/40 uppercase mt-0.5">LARGËSIA: {Math.round(activeRadarAlert.currentDistance)}m</p>
              </div>
              <Radio className="w-5 h-5 text-red-500/30 animate-pulse absolute right-4 opacity-20" />
            </div>
          </div>
        )}

        {activeModule === 'drag' && !isDriving && (
          <div className="flex flex-col items-center gap-3 mb-6 apple-slide-up stagger-1 w-full px-2">
             <p className="text-[8px] font-medium text-white/30 uppercase">ZGJIDH MODIN OBLIGATIV</p>
             <div className="flex flex-wrap gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-full justify-center">
                {(['0-60', '0-100', '100-200', '1/4mile', 'ALL'] as RunMode[]).map((mode) => (
                  <button key={mode} onClick={() => setRunMode(mode)} className={cn("flex-1 min-w-[60px] py-2.5 rounded-xl font-medium text-[9px] uppercase transition-all", runMode === mode ? "bg-yellow-500 text-black shadow-lg" : "text-white/30 hover:text-white/60")}>{mode === '1/4mile' ? '1/4 Mile' : mode}</button>
                ))}
             </div>
          </div>
        )}

        {isDragModule && countdown > 0 && (
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-3 apple-scale-in">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={cn(
                  "w-5 h-5 rounded-full border-2 border-white/5 transition-all duration-300",
                  countdown >= i ? "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] border-red-500" : "bg-zinc-900"
                )} />
              ))}
              <div className={cn(
                "w-12 h-12 rounded-full border-2 border-white/5 transition-all duration-500 ml-1",
                countdown === 6 ? "bg-green-500 shadow-[0_0_35px_rgba(34,197,94,0.9)] border-green-400 scale-110" : "bg-zinc-900"
              )} />
            </div>
            <p className={cn(
              "text-[10px] font-medium uppercase animate-pulse",
              countdown === 6 ? "text-green-500" : "text-red-500/60"
            )}>
              {countdown === 6 ? "NISU TANI!" : "Prit dritën e gjelbër..."}
            </p>
          </div>
        )}

        <div className="relative w-full aspect-square flex items-center justify-center apple-scale-in stagger-2">
          <svg width="100%" height="100%" viewBox="0 0 340 340" className="max-w-full overflow-visible">
            <defs>
              <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={themeColor} stopOpacity="0.1" /><stop offset="100%" stopColor={themeColor} stopOpacity="0.9" /></linearGradient>
            </defs>
            {Array.from({ length: 81 }).map((_, i) => {
              const val = i / 10;
              const angle = 135 + (val / 8) * (405 - 135);
              const isMajor = i % 10 === 0;
              const angleRad = (angle - 90) * Math.PI / 180;
              return (
                <g key={i}>
                  <line x1={170 + (140 - (isMajor ? 18 : 8)) * Math.cos(angleRad)} y1={170 + (140 - (isMajor ? 18 : 8)) * Math.sin(angleRad)} x2={170 + 140 * Math.cos(angleRad)} y2={170 + 140 * Math.sin(angleRad)} stroke={val >= 6.8 ? "#ef4444" : themeColor} strokeWidth={isMajor ? 3 : 1} opacity={isMajor ? 0.9 : 0.25} />
                  {isMajor && <text x={170 + 102 * Math.cos(angleRad)} y={170 + 102 * Math.sin(angleRad)} fill={val >= 6.8 ? "#ef4444" : themeColor} fontSize="13" fontWeight="500" textAnchor="middle" alignmentBaseline="middle" className="opacity-70">{val}</text>}
                </g>
              );
            })}
            <path d={describeArc(170, 170, 136, 135, currentProgressAngle)} fill="none" stroke="url(#arcGradient)" strokeWidth="7" strokeLinecap="round" style={{ filter: 'url(#needleGlow)' }} />
            <line x1={170 + 50 * Math.cos((currentProgressAngle - 90) * Math.PI / 180)} y1={170 + 50 * Math.sin((currentProgressAngle - 90) * Math.PI / 180)} x2={170 + 136 * Math.cos((currentProgressAngle - 90) * Math.PI / 180)} y2={170 + 136 * Math.sin((currentProgressAngle - 90) * Math.PI / 180)} stroke={rpmValue > 6.8 ? "#ef4444" : "#ffffff"} strokeWidth="5" strokeLinecap="round" style={{ filter: 'url(#needleGlow)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
                <div className="text-center flex flex-col items-center">
                    <span className={cn("text-8xl font-medium leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]", isDragModule ? "text-yellow-500" : "text-white")}>{Math.round(displaySpeed)}</span>
                    <span className="text-sm font-light text-white/40 uppercase mt-3">km/h</span>
                    {isDragModule && (dragTime !== null || isWaitingForLaunch) && (
                      <div className="mt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <p className="text-[10px] font-medium text-yellow-500/60 uppercase">Koha {runMode}</p>
                        {isWaitingForLaunch ? (
                          <p className="text-2xl font-medium text-yellow-500 animate-pulse uppercase">Nisu!</p>
                        ) : (
                          <p className="text-4xl font-medium text-yellow-500">{(dragTime || 0).toFixed(2)}s</p>
                        )}
                      </div>
                    )}
                </div>
          </div>
        </div>

        <div className="w-full mt-8 space-y-5 apple-slide-up stagger-4 px-2 z-20">
           {isDragModule && speed > 1.5 && !isDriving && !isJumpStart && (
             <div className="bg-red-600/10 border border-red-600/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
               <p className="text-[9px] font-medium text-red-500 uppercase leading-relaxed">Duhet të jesh 0 km/h për të filluar run</p>
             </div>
           )}

           {isJumpStart && (
             <Badge className="w-full bg-red-600 text-white font-medium h-10 rounded-xl justify-center uppercase animate-pulse">🔥 Jump Start - Anulohet</Badge>
           )}

           <div className="flex flex-col gap-3">
             <Button
                onClick={() => {
                  if (isDriving) { if (!isDragModule) stopTrip(); } 
                  else if (isDragModule) { if (speed <= 1.5) startDragCountdown(); } 
                  else { startTrip(); }
                }}
                disabled={isDragModule && speed > 1.5 && !isDriving}
                className={cn(
                  "w-full h-20 rounded-[2.2rem] font-medium text-base uppercase transition-all shadow-2xl border-b-4 active:scale-[0.97]",
                  isDriving ? "bg-red-600 text-white hover:bg-red-700 border-red-800" : isDragModule ? "bg-yellow-500 text-black hover:bg-yellow-400 border-yellow-700 shadow-yellow-500/30" : "bg-accent text-background hover:bg-accent/90 border-accent/70 shadow-accent/30",
                  isDragModule && speed > 1.5 && !isDriving && "opacity-40 grayscale pointer-events-none"
                )}
              >
                {isDriving ? (
                  <div key="driving-active" className="flex items-center gap-3 font-medium">
                    {isDragModule ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                    <span>{isDragModule ? "Recording" : "Ndalo udhëtimin"}</span>
                  </div>
                ) : (
                  <div key="driving-inactive" className="flex items-center gap-3 font-medium">
                    {isDragModule ? <Zap className="w-6 h-6 fill-current" /> : <Navigation className="w-6 h-6 fill-current" />}
                    <span>{isDragModule ? "Nis garën" : "Fillo udhëtimin"}</span>
                  </div>
                )}
              </Button>

              {isDragModule && (peakSpeed > 0 || (dragTime && dragTime > 0) || isDriving) && (
                <Button 
                  variant="outline" 
                  onClick={resetTrip} 
                  className="w-full h-14 rounded-2xl font-medium text-[10px] uppercase border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border-b-4 border-b-white/5 active:translate-y-0.5 active:border-b-0"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reseto Statistikat
                </Button>
              )}
           </div>

           {isDriving && (
              <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isDragModule ? (
                  <>
                    <Card className="bg-yellow-500/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <Timer className="w-4 h-4 text-yellow-500 mb-1.5" />
                      <span className="text-[14px] font-medium text-yellow-500">{(dragTime || 0).toFixed(2)}s</span>
                    </Card>
                    <Card className="bg-yellow-500/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <MapPin className="w-4 h-4 text-yellow-500 mb-1.5" />
                      <span className="text-[14px] font-medium text-white">{Math.round(tripDistance)}m</span>
                    </Card>
                    <Card className="bg-yellow-500/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <Gauge className="w-4 h-4 text-yellow-500 mb-1.5" />
                      <span className="text-[14px] font-medium text-white">{Math.round(peakSpeed)}</span>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="bg-accent/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <TrendingUp className="w-4 h-4 text-accent mb-1.5" /><span className="text-[14px] font-medium text-white">{Math.round((tripDistance / Math.max(tripTime, 1)) * 3.6) || 0} <span className="text-[8px] opacity-40">KM/H</span></span>
                    </Card>
                    <Card className="bg-accent/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <Gauge className="w-4 h-4 text-accent mb-1.5" /><span className="text-[14px] font-medium text-white">{Math.round(peakSpeed)}</span>
                    </Card>
                    <Card className="bg-accent/5 border border-white/5 p-4 rounded-[1.8rem] flex flex-col items-center backdrop-blur-md">
                      <MapPin className="w-4 h-4 text-accent mb-1.5" /><span className="text-[14px] font-medium text-white">{(tripDistance / 1000).toFixed(2)} <span className="text-[8px] opacity-40">KM</span></span>
                    </Card>
                  </>
                )}
              </div>
           )}
        </div>
      </div>

      <Dialog modal={true} open={showSummary} onOpenChange={(open) => !open && setLastRunSummary(null)}>
        <DialogContent className="w-[94vw] max-w-[380px] bg-transparent border-none shadow-none p-0 outline-none overflow-visible apple-scale-in">
          <div className="w-full bg-zinc-950 border border-white/10 rounded-[2.5rem] p-5 flex flex-col h-full max-h-[92dvh] shadow-[0_0_50px_rgba(0,0,0,0.8)] mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
              <div>
                <p className="font-light text-[9px] text-accent/60 uppercase mb-0.5">DriveRank Kosovo</p>
                <DialogTitle className="text-lg font-medium text-white leading-tight">DriveRank | {lastRunSummary?.runType}</DialogTitle>
              </div>
              <button onClick={() => setLastRunSummary(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <Carousel setApi={setSummaryApi} opts={{ align: "center", containScroll: false }} className="w-full h-full">
                <CarouselContent className="ml-0 h-full">
                  <CarouselItem className="pl-0 basis-full h-full flex flex-col">
                    <div className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar py-1 pr-1">
                      {lastRunSummary?.runType === 'ALL' && lastRunSummary.allStats ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {Object.entries(lastRunSummary.allStats).map(([type, time], idx) => (
                            <div 
                              key={type} 
                              className={cn(
                                "bg-white/5 p-3.5 rounded-2xl border border-white/5 backdrop-blur-xl flex flex-col items-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500",
                                idx === 0 ? "delay-[50ms]" : idx === 1 ? "delay-[100ms]" : idx === 2 ? "delay-[150ms]" : "delay-[200ms]"
                              )}
                            >
                              <p className="text-[9px] font-light text-white/40 uppercase mb-1">{type}</p>
                              <p className="text-xl font-light text-yellow-500">{time?.toFixed(2)}s</p>
                              <p className="text-[7px] font-medium text-white/20 mt-1.5 uppercase">Rank: #{getRank(type, time!, profile?.city)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {personalBestInfo && (
                            <div className={cn(
                              "p-3 rounded-2xl border text-center animate-in fade-in slide-in-from-top-2 duration-500",
                              personalBestInfo.isNewBest ? "bg-yellow-500/10 border-yellow-500/30" : "bg-white/5 border-white/10"
                            )}>
                              <p className={cn("text-[10px] font-medium uppercase", personalBestInfo.isNewBest ? "text-yellow-500" : "text-white/60")}>
                                {personalBestInfo.label}
                              </p>
                              {personalBestInfo.diff && (
                                <p className="text-[8px] font-light text-white/40 uppercase mt-0.5">
                                  {personalBestInfo.diff}
                                </p>
                              )}
                            </div>
                          )}

                          <Card className="bg-white/5 border-white/5 p-4 rounded-[1.8rem] space-y-3 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[50ms]">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-xl text-center">
                                <p className="text-[9px] font-light text-white/40 uppercase mb-1.5">
                                  {lastRunSummary?.runType === 'Top Speed' ? 'Distance' : 'Achievement'}
                                </p>
                                <p className="text-2xl font-light text-accent">
                                  {lastRunSummary?.runType === 'Top Speed' 
                                    ? `${(lastRunSummary.distance / 1000).toFixed(2)} km` 
                                    : `${lastRunSummary?.time.toFixed(2)}s`}
                                </p>
                              </div>
                              <div className="bg-accent/10 p-4 rounded-xl border border-accent/20 backdrop-blur-xl text-center relative overflow-hidden group shadow-[0_0_20px_rgba(77,224,244,0.1)] animate-in zoom-in-95 duration-500 delay-[150ms]">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                                <div className="absolute -right-1 -bottom-1 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Gauge className="w-10 h-10 text-accent" />
                                </div>
                                <p className="text-[9px] font-medium text-accent uppercase mb-1.5 relative z-10">Max Speed</p>
                                <p className="text-2xl font-light text-white relative z-10">{lastRunSummary?.peakSpeed} <span className="text-[9px] text-accent/40 font-medium">KM/H</span></p>
                              </div>
                            </div>
                          </Card>

                          <div className="grid grid-cols-2 gap-2.5 pb-4">
                             {lastRunSummary?.runType === 'Top Speed' ? (
                               <>
                                 <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-accent shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[200ms]">
                                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-accent" /></div>
                                    <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Avg Speed</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.avgSpeed} km/h</p></div>
                                 </Card>
                                 <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-cyan-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[250ms]">
                                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0"><Activity className="w-4 h-4 text-cyan-500" /></div>
                                    <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Consistent</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.consistentSpeed} km/h</p></div>
                                 </Card>
                               </>
                             ) : null}
                             <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-red-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[300ms]">
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><CircleSlash className="w-4 h-4 text-red-500" /></div>
                                <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Brakes</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.brakes || 0}x</p></div>
                             </Card>
                             <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-blue-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[350ms]">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><RefreshCcw className="w-4 h-4 text-blue-500" /></div>
                                <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Turns</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.turns || 0}x</p></div>
                             </Card>
                             <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-yellow-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
                                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0"><ArrowDown className="w-4 h-4 text-yellow-500" /></div>
                                <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Low Speed</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.lowSpeedPasses || 0}x</p></div>
                             </Card>
                             <Card className="bg-white/5 border-white/5 p-3 rounded-2xl flex items-center gap-3 border-l-2 border-l-green-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[450ms]">
                                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-green-500" /></div>
                                <div className="text-left min-w-0"><p className="text-[9px] font-light text-white/40 uppercase truncate">Accel G</p><p className="text-sm font-medium text-white leading-none mt-1">{lastRunSummary?.maxGForce || 0} G</p></div>
                             </Card>
                          </div>
                          <div className="h-10 w-full shrink-0" />
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-0 basis-full h-full flex flex-col">
                    <div className="space-y-3.5 flex-1 min-h-0 flex flex-col">
                      <Card className="bg-white/[0.02] border-white/5 p-4 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl flex-1">
                        <div className="w-full aspect-[4/3] bg-zinc-950 rounded-[1.8rem] flex items-center justify-center shadow-inner border border-white/5 overflow-hidden shrink-0 relative">
                          <RouteMap points={lastRunSummary?.points || []} />
                        </div>
                        <div className="space-y-2 w-full px-1">
                           <div className="flex items-center gap-3.5 bg-white/5 px-4 py-3 rounded-xl border border-white/5 backdrop-blur-xl shadow-lg">
                             <Star className="w-5 h-5 text-accent fill-accent" />
                             <div className="text-left">
                               <p className="text-[9px] font-light text-white/40 uppercase">{profile?.city || "City"} Rank</p>
                               <p className="text-xs font-medium text-white">
                                 {currentRunRanks.city !== 0 ? `Numër ${currentRunRanks.city} në ${profile?.city} sot.` : "Rënditje e shumëfishtë"}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3.5 bg-white/5 px-4 py-3 rounded-xl border border-white/5 backdrop-blur-xl shadow-lg">
                             <Activity className="w-5 h-5 text-white/40" />
                             <div className="text-left">
                               <p className="text-[9px] font-light text-white/40 uppercase">Kosova Rank</p>
                               <p className="text-xs font-medium text-white/60">
                                 {currentRunRanks.kosovo !== 0 
                                   ? `Numër ${currentRunRanks.kosovo} në Kosovë sot.` 
                                   : "Duke llogaritur..."}
                               </p>
                             </div>
                           </div>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            <div className="flex flex-col items-center shrink-0 relative z-10 w-full mt-3 pt-1 border-t border-white/5">
              <div className="flex justify-center gap-2.5 mb-3 pt-3">
                {[0, 1].map((i) => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-500 shadow-sm", summaryIndex === i ? "w-8 bg-accent shadow-[0_0_10px_#4de0f4]" : "w-1.5 bg-white/10")} />
                ))}
              </div>
              
              <Button onClick={handleSaveToLeaderboard} disabled={isSaving} className="w-full h-16 bg-accent text-background font-medium uppercase text-xs rounded-[1.5rem] shadow-[0_15px_40px_rgba(77,224,244,0.3)] active:scale-[0.98] transition-all border-b-4 border-accent/70 hover:bg-accent/90">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-2">Save on Ranking <ChevronRight className="w-5 h-5" /></div>}
              </Button>
              
              <p className="text-[8px] font-medium text-white/20 uppercase animate-pulse mt-3 mb-1">Rrëshqitni për të parë hartën</p>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
            </div>
          </div>
        </DialogContent>
      </Dialog>
<<<<<<< HEAD
=======

>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
      <BottomNav />
    </div>
  );
}
