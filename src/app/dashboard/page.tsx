
"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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
             <div className="flex wrap gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-full justify-center">
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
              <filter id="needleGlow" x="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <linearGradient id="arcGradient" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stopColor={themeColor} stopOpacity="0.1" /><stop offset="100%" stopColor={themeColor} stopOpacity="0.9" /></linearGradient>
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
            <path d={descArc(170, 170, 136, 135, currentProgressAngle)} fill="none" stroke="url(#arcGradient)" strokeWidth="7" strokeLinecap="round" style={{ filter: 'url(#needleGlow)' }} />
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
                    <span className="font-bold">{isDragModule ? "RECORDING" : "NDALO UDHËTIMIN"}</span>
                  </div>
                ) : (
                  <div key="driving-inactive" className="flex items-center gap-3 font-medium">
                    {isDragModule ? <Zap className="w-6 h-6 fill-current" /> : <Navigation className="w-6 h-6 fill-current" />}
                    <span className="font-bold">{isDragModule ? "NIS GARËN" : "FILLO UDHËTIMIN"}</span>
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
          <DialogTitle className="sr-only">DriveRank Kosova - Rezultatet</DialogTitle>
          <div className="w-full bg-zinc-950 border border-white/10 rounded-[2.5rem] p-5 flex flex-col h-full max-h-[92dvh] shadow-[0_0_50px_rgba(0,0,0,0.8)] mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
              <div className="w-10" />
              <button onClick={() => setLastRunSummary(null)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"><X className="w-5 h-5 text-white/40" /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <Carousel setApi={setSummaryApi} opts={{ align: "center", containScroll: false }} className="w-full h-full">
                <CarouselContent className="ml-0 h-full">
                  <CarouselItem className="pl-0 basis-full h-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center w-full">
                      <div className="w-full bg-gradient-to-br from-red-900/30 via-black to-black rounded-[2.5rem] p-10 flex flex-col items-center justify-center border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        
                        <h2 className="text-xl font-black text-white mb-8 tracking-tighter uppercase text-center relative z-10">
                          <span className="italic">DriveRank</span> <span className="text-red-600">Kosova</span>
                        </h2>

                        <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-4 relative z-10">
                          {lastRunSummary?.runType === 'Top Speed' ? 'TOP SPEED RUN' : `MODI ${lastRunSummary?.runType}`}
                        </p>
                        
                        <div className="flex items-baseline gap-2 mb-6 relative z-10">
                          <p className="text-7xl font-black text-white tracking-tighter leading-none">
                            {lastRunSummary?.runType === 'Top Speed' ? lastRunSummary?.peakSpeed : lastRunSummary?.time}
                          </p>
                          <span className="text-xl font-bold text-white/30 uppercase tracking-widest">
                            {lastRunSummary?.runType === 'Top Speed' ? 'km/h' : 'sec'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 w-full relative z-10">
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-3xl font-black text-yellow-500 tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                              {getOrdinal(currentRunRanks.city || 1)}
                            </p>
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.1em]">
                              Në {profile?.city || "Qytet"}
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-1 border-l border-white/10">
                            <p className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                              {getOrdinal(currentRunRanks.kosovo || 1)}
                            </p>
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.1em]">
                              Në Kosovë
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-0 basis-full h-full flex flex-col items-center justify-center">
                    <div className="w-full bg-gradient-to-br from-red-900/30 via-black to-black rounded-[2.5rem] p-8 flex flex-col h-full border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                      
                      <h2 className="text-sm font-black text-white/60 mb-6 tracking-widest uppercase text-center relative z-10">
                        <span className="italic">DriveRank</span> <span className="text-red-600/60">Data</span>
                      </h2>

                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 relative z-10">
                        {lastRunSummary?.runType === 'ALL' && lastRunSummary.allStats ? (
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(lastRunSummary.allStats).map(([type, time], idx) => (
                              <div 
                                key={type} 
                                className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-xl flex flex-col items-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <p className="text-[9px] font-bold text-white/40 uppercase mb-1">{type}</p>
                                <p className="text-xl font-black text-yellow-500">{time?.toFixed(2)}s</p>
                                <p className="text-[7px] font-black text-white/20 mt-1.5 uppercase">Rank: #{getRank(type, time!, profile?.city)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-xl text-center shadow-lg animate-in fade-in slide-in-from-left-4 duration-500">
                                <p className="text-[9px] font-bold text-white/40 uppercase mb-1.5 flex items-center justify-center gap-1.5">
                                  <MapPin className="w-2.5 h-2.5 text-accent" /> Distance
                                </p>
                                <p className="text-xl font-black text-white">
                                  {lastRunSummary?.runType === 'Top Speed' 
                                    ? `${(lastRunSummary.distance / 1000).toFixed(2)} km` 
                                    : `${lastRunSummary?.time.toFixed(2)}s`}
                                </p>
                              </div>
                              <div className="bg-accent/10 p-4 rounded-2xl border border-accent/20 backdrop-blur-xl text-center shadow-[0_0_20px_rgba(77,224,244,0.1)] animate-in fade-in slide-in-from-right-4 duration-500">
                                <p className="text-[9px] font-bold text-accent uppercase mb-1.5 flex items-center justify-center gap-1.5">
                                  <Gauge className="w-2.5 h-2.5" /> Max Speed
                                </p>
                                <p className="text-xl font-black text-white">{lastRunSummary?.peakSpeed} <span className="text-[10px] text-accent/60 font-bold">KM/H</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pb-4">
                               <div className="bg-white/5 p-3.5 rounded-2xl border-l-2 border-l-accent shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[100ms]">
                                  <p className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-2 mb-1.5"><TrendingUp className="w-3 h-3 text-accent" /> Avg Speed</p>
                                  <p className="text-base font-black text-white leading-none">{lastRunSummary?.avgSpeed} km/h</p>
                               </div>
                               <div className="bg-white/5 p-3.5 rounded-2xl border-l-2 border-l-green-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[150ms]">
                                  <p className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-2 mb-1.5"><Activity className="w-3 h-3 text-green-500" /> Max Accel</p>
                                  <p className="text-base font-black text-white leading-none">{lastRunSummary?.maxGForce || 0} G</p>
                               </div>
                               <div className="bg-white/5 p-3.5 rounded-2xl border-l-2 border-l-red-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[200ms]">
                                  <p className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-2 mb-1.5"><CircleSlash className="w-3 h-3 text-red-500" /> Brakes</p>
                                  <p className="text-base font-black text-white leading-none">{lastRunSummary?.brakes || 0}x</p>
                               </div>
                               <div className="bg-white/5 p-3.5 rounded-2xl border-l-2 border-l-blue-500 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[250ms]">
                                  <p className="text-[8px] font-bold text-white/40 uppercase flex items-center gap-2 mb-1.5"><RefreshCcw className="w-3 h-3 text-blue-500" /> Turns</p>
                                  <p className="text-base font-black text-white leading-none">{lastRunSummary?.turns || 0}x</p>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
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
              
              <Button onClick={handleSaveToLeaderboard} disabled={isSaving} className="w-full h-16 bg-accent text-background font-black uppercase text-xs rounded-[1.5rem] shadow-[0_15px_40px_rgba(77,224,244,0.3)] active:scale-[0.98] transition-all border-b-4 border-accent/70 hover:bg-accent/90">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-2">Save on Ranking <ChevronRight className="w-5 h-5" /></div>}
              </Button>
              
              <p className="text-[8px] font-black text-white/20 uppercase animate-pulse mt-3 mb-1">
                {summaryIndex === 0 ? "Rrëshqitni për statistikat" : "Kthehu te rekordi"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

function descArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
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

