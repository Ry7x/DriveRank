
"use client"

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}
