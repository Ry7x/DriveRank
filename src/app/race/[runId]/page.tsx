
"use client"

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ghost, Flag, ChevronLeft, Zap, Trophy, Timer, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function GhostRacePage() {
  const { runId } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const ghostRef = useMemoFirebase(() => (db ? doc(db, "public_runs", runId as string) : null), [db, runId]);
  const { data: ghostRun, isLoading: isGhostLoading } = useDoc(ghostRef);

  const lastPos = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRacing && startTime) {
      interval = setInterval(() => {
        setElapsed((Date.now() - startTime) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRacing, startTime]);

  useEffect(() => {
    let watchId: number;
    if (mounted && isRacing) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed: mps } = pos.coords;
          const currentKmh = Math.round((mps || 0) * 3.6);
          setSpeed(currentKmh);
          
          if (lastPos.current) {
            const R = 6371e3;
            const phi1 = (lastPos.current.lat * Math.PI) / 180;
            const phi2 = (latitude * Math.PI) / 180;
            const deltaPhi = ((latitude - lastPos.current.lat) * Math.PI) / 180;
            const deltaLambda = ((longitude - lastPos.current.lng) * Math.PI) / 180;
            const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            setDistance(prev => prev + d);
          }
          lastPos.current = { lat: latitude, lng: longitude, timestamp: pos.timestamp };
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [mounted, isRacing]);

  const ghostStats = useMemo(() => {
    if (!ghostRun?.telemetry || !isRacing) return { speed: 0, distance: 0, gap: 0 };
    const points = ghostRun.telemetry as {time: number, speed: number, distance: number}[];
    const ghostPoint = points.reduce((prev, curr) => 
      Math.abs(curr.time - elapsed) < Math.abs(prev.time - elapsed) ? curr : prev
    );
    return {
      speed: ghostPoint.speed,
      distance: ghostPoint.distance,
      gap: Math.round(distance - ghostPoint.distance)
    };
  }, [ghostRun, elapsed, distance, isRacing]);

  if (isGhostLoading || !mounted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-6">
           <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-pulse" />
           <Loader2 className="w-20 h-20 animate-spin text-accent" />
        </div>
        <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-zinc-500">Duke ngarkuar telemetrinë e fantazmës...</p>
      </div>
    );
  }

  const handleStart = () => {
    setIsRacing(true);
    setStartTime(Date.now());
    setDistance(0);
    setElapsed(0);
    toast({ title: "GARA FILLOI!", description: "Ndiq fantazmën e " + ghostRun?.username });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(77,224,244,0.05),rgba(0,0,0,0),rgba(77,224,244,0.05))] bg-[length:100%_4px,10%_100%] pointer-events-none opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,224,244,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="p-6 flex items-center justify-between z-20">
        <Button onClick={() => router.back()} size="icon" variant="ghost" className="rounded-2xl hover:bg-white/5"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex flex-col items-center">
          <Badge className="bg-red-600/20 text-red-500 border-red-500/20 font-black italic uppercase text-[8px] animate-pulse px-3 py-1 rounded-full">MODI FANTASMË AKTIV</Badge>
          <h1 className="text-sm font-black italic uppercase tracking-tighter mt-1">GARA KUNDËR <span className="text-accent">{ghostRun?.username}</span></h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="mb-12 flex flex-col items-center">
          <div className={cn(
            "text-[8rem] sm:text-[10rem] font-black italic tracking-tighter leading-none transition-all duration-300 drop-shadow-[0_0_30px_rgba(77,224,244,0.3)]",
            ghostStats.gap >= 0 ? "text-accent" : "text-red-500"
          )}>
            {ghostStats.gap > 0 ? `+${ghostStats.gap}` : ghostStats.gap}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] mt-2 opacity-50 bg-white/5 px-4 py-1 rounded-full border border-white/5">Diferenca në Metra</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <Card className="glass-card border-white/5 p-6 flex flex-col items-center rounded-[2.5rem] relative overflow-hidden group hover:border-accent/30 transition-all shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent neon-glow" />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">TI (LIV)</span>
            <span className="text-5xl font-black italic text-white">{speed}</span>
            <span className="text-[8px] font-black text-accent uppercase mt-1">KM / H</span>
          </Card>
          <Card className="glass-card border-white/5 p-6 flex flex-col items-center rounded-[2.5rem] relative opacity-60 grayscale group-hover:grayscale-0 transition-all shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-500" />
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">FANTASMA</span>
            <span className="text-5xl font-black italic text-zinc-400">{ghostStats.speed}</span>
            <span className="text-[8px] font-black text-zinc-500 uppercase mt-1">KM / H</span>
          </Card>
        </div>

        <div className="w-full max-w-sm mt-12 space-y-8">
           <div className="relative h-4 bg-zinc-900/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <div 
                className="absolute top-0 h-full bg-zinc-800 transition-all duration-300 flex items-center" 
                style={{ width: `${Math.min((ghostStats.distance / (ghostRun?.distanceMeters || 1000)) * 100, 100)}%` }}
              >
                <div className="absolute right-0 w-6 h-6 rounded-full bg-zinc-700 border-2 border-background flex items-center justify-center shadow-xl translate-x-1/2">
                   <Ghost className="w-3 h-3 text-white/50" />
                </div>
              </div>
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-accent/20 to-accent transition-all duration-300 flex items-center" 
                style={{ width: `${Math.min((distance / (ghostRun?.distanceMeters || 1000)) * 100, 100)}%` }}
              >
                <div className="absolute right-0 w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center shadow-[0_0_20px_#4de0f4] translate-x-1/2 neon-glow">
                   <Zap className="w-4 h-4 text-background fill-background" />
                </div>
              </div>
           </div>
           
           <div className="flex justify-between px-2">
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">DISTANCA JOTE</span>
                <span className="text-xl font-black italic text-white">{Math.round(distance)}m</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">KOHA</span>
                <span className="text-xl font-black italic text-accent">{elapsed.toFixed(1)}s</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">FANTASMA TOTAL</span>
                <span className="text-xl font-black italic text-zinc-500">{Math.round(ghostRun?.distanceMeters || 0)}m</span>
              </div>
           </div>
        </div>
      </div>

      <div className="p-8 z-20">
        {!isRacing ? (
          <Button 
            onClick={handleStart} 
            className="w-full h-16 rounded-[2rem] bg-accent hover:bg-accent/90 text-background font-black text-xl uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(77,224,244,0.3)] active:scale-95 transition-all border-b-4 border-accent/70"
          >
            FILLO GARËN <Zap className="w-6 h-6 ml-2 fill-background" />
          </Button>
        ) : (
          <Button 
            onClick={() => setIsRacing(false)} 
            variant="destructive"
            className="w-full h-16 rounded-[2rem] font-black text-xl uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all border-b-4 border-red-800"
          >
            NDALO GARËN <Flag className="w-6 h-6 ml-2" />
          </Button>
        )}
      </div>

      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
